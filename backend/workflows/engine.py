import logging

from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from .actions import execute_action

logger = logging.getLogger(__name__)


TRIGGER_ALIASES = {
    'create': 'on_create',
    'update': 'on_update',
    'stage_changed': 'stage_change',
    'status_changed': 'stage_change',
}


def trigger_workflows(module_name, trigger_event, instance, extra_context=None):
    """
    Workflow execution entry point.

    Signals/views emit one normalized event. The engine fetches matching active
    workflows, evaluates conditions, and executes ordered actions.
    
    Supports:
      - Debouncing (configurable per workflow)
      - Idempotency via action fingerprinting
      - Task-driven automation (on_task_complete chaining)
    """
    from workflows.models import Workflow, WorkflowLog

    trigger = normalize_trigger(trigger_event)
    extra_context = extra_context or {}
    event = {
        'module': module_name,
        'trigger': trigger,
        'legacy_trigger': trigger_event,
        'extra': extra_context,
    }
    execution_key = _make_execution_key(module_name, trigger, instance, extra_context)

    workflows = Workflow.objects.filter(
        module=module_name,
        trigger_event__in={trigger, trigger_event},
        is_active=True,
    ).prefetch_related('conditions', 'actions__specific_user')

    for workflow in workflows:
        _run_workflow(workflow, instance, event, execution_key, WorkflowLog)


def normalize_trigger(trigger_event):
    """Normalize legacy trigger names to canonical names."""
    return TRIGGER_ALIASES.get(trigger_event, trigger_event)


def _make_execution_key(module_name, trigger, instance, extra_context):
    """Generate a deterministic key for debouncing."""
    import hashlib
    import json
    
    raw = {
        'module': module_name,
        'trigger': trigger,
        'object': instance.pk,
        'old_value': extra_context.get('old_value', ''),
        'new_value': extra_context.get('new_value', ''),
    }
    return hashlib.sha256(json.dumps(raw, sort_keys=True, default=str).encode()).hexdigest()


def _run_workflow(workflow, instance, event, execution_key, WorkflowLog):
    """Execute a single workflow with condition evaluation and action execution."""
    try:
        # Check debounce
        if _is_debounced(workflow, instance):
            WorkflowLog.objects.create(
                workflow=workflow,
                status='skipped',
                trigger_event=event['trigger'],
                object_id=str(instance.pk),
                execution_key=execution_key,
                message='Debounced: executed too recently',
            )
            return

        # Evaluate conditions
        passed, reason = evaluate_conditions(workflow, instance, event.get('extra', {}))
        if not passed:
            WorkflowLog.objects.create(
                workflow=workflow,
                status='skipped',
                trigger_event=event['trigger'],
                object_id=str(instance.pk),
                execution_key=execution_key,
                message=f"Conditions not met: {reason}",
            )
            return

        # Execute actions
        successes = []
        errors = []
        with transaction.atomic():
            for action in workflow.actions.all().order_by('order', 'pk'):
                try:
                    result = execute_action(action, instance, event)
                    if result.status == 'skipped':
                        successes.append(f"{result.name}: {result.message}")
                    else:
                        successes.append(f"{result.name}: {result.message or 'ok'}")
                except Exception as exc:
                    logger.error(
                        "[Workflow] action failed workflow=%s action=%s object=%s: %s",
                        workflow.pk, action.pk, instance.pk, exc, exc_info=True
                    )
                    errors.append(f"{action.action_type}: {exc}")

        # Determine final status
        status = 'success'
        if errors and successes:
            status = 'partial'
        elif errors:
            status = 'failure'

        # Log workflow execution
        WorkflowLog.objects.create(
            workflow=workflow,
            status=status,
            trigger_event=event['trigger'],
            object_id=str(instance.pk),
            execution_key=execution_key,
            message="; ".join(errors or successes or ['No actions executed']),
        )
    except Exception as exc:
        logger.error("[Workflow] engine failed workflow=%s: %s", workflow.pk, exc, exc_info=True)
        try:
            WorkflowLog.objects.create(
                workflow=workflow,
                status='failure',
                trigger_event=event['trigger'],
                object_id=str(getattr(instance, 'pk', '')),
                execution_key=execution_key,
                message=f"Engine error: {exc}",
            )
        except Exception:
            pass


def _is_debounced(workflow, instance):
    """Check if workflow execution is debounced (too soon after last run)."""
    from workflows.models import WorkflowDebounce
    
    object_key = f"{instance._meta.label_lower}:{instance.pk}"
    debounce_window = timedelta(minutes=workflow.debounce_minutes)
    cutoff_time = timezone.now() - debounce_window
    
    return WorkflowDebounce.objects.filter(
        workflow=workflow,
        object_key=object_key,
        last_executed_at__gte=cutoff_time
    ).exists()


def evaluate_conditions(workflow, instance, extra_context):
    """Evaluate all workflow conditions using AND/OR logic."""
    conditions = list(workflow.conditions.all().order_by('order', 'pk'))
    if not conditions:
        return True, 'No conditions'

    results = []
    for condition in conditions:
        value = extra_context.get(condition.field_name, _resolve_field(instance, condition.field_name))
        is_match = apply_operator(condition.operator, value, condition.value)
        results.append((is_match, condition.field_name, value, condition.operator, condition.value))

    if workflow.condition_logic == 'OR':
        return any(result[0] for result in results), str(results)
    return all(result[0] for result in results), str(results)


def apply_operator(operator, value, expected):
    """Apply a condition operator to evaluate a field value."""
    if operator in {'=', 'equals'}:
        return str(value).lower() == str(expected).lower()
    if operator in {'!=', 'not_equals'}:
        return str(value).lower() != str(expected).lower()
    if operator == 'contains':
        return str(expected).lower() in str(value).lower()
    if operator == 'not_contains':
        return str(expected).lower() not in str(value).lower()
    if operator in {'>', 'gt'}:
        try:
            return float(value) > float(expected)
        except (ValueError, TypeError):
            return False
    if operator in {'<', 'lt'}:
        try:
            return float(value) < float(expected)
        except (ValueError, TypeError):
            return False
    if operator == 'gte':
        try:
            return float(value) >= float(expected)
        except (ValueError, TypeError):
            return False
    if operator == 'lte':
        try:
            return float(value) <= float(expected)
        except (ValueError, TypeError):
            return False
    if operator == 'starts_with':
        return str(value).startswith(str(expected))
    if operator == 'ends_with':
        return str(value).endswith(str(expected))
    if operator == 'is_empty':
        return value in (None, '', [], {})
    if operator == 'is_not_empty':
        return value not in (None, '', [], {})
    return False


def _resolve_field(instance, field_path):
    """Resolve nested field paths (e.g., 'contact.email')."""
    value = instance
    for part in field_path.split('.'):
        if value is None:
            return None
        value = getattr(value, part, None)
    return value
