"""
Workflow Execution Engine — Production Grade v2
================================================
Fully dynamic, scalable, and production-ready.

Flow:
  1. Find all active Workflows matching (module, trigger_event).
  2. Evaluate ALL conditions using AND / OR logic.
  3. Dispatch each action in order, with full error isolation.
  4. Write a WorkflowLog entry (success / partial / failure / skipped).
  5. Never let a workflow failure crash the originating request.

Supported trigger events:
  create | update | delete | stage_changed | status_changed

Assignment strategies for create_task:
  owner        → lead.assigned_to / deal.owner
  round_robin  → distribute equally among sales reps in same team
  manager      → first manager in the same team
  specific_user→ hardcoded FK on WorkflowAction.specific_user
"""

import logging
import uuid
import threading
from django.db import transaction

logger = logging.getLogger(__name__)


# ===========================================================================
# PUBLIC ENTRY-POINT
# ===========================================================================
def trigger_workflows(module_name: str, trigger_event: str, instance,
                      extra_context: dict = None) -> None:
    """
    Evaluate and execute all active workflows matching module + trigger_event.

    Args:
        module_name:    lowercase model name, e.g. 'lead', 'deal'
        trigger_event:  'create' | 'update' | 'delete' |
                        'stage_changed' | 'status_changed'
        instance:       the Django model instance
        extra_context:  optional dict with pre_save snapshot data,
                        e.g. {'old_stage': 'Qualification'}
    """
    from workflows.models import Workflow, WorkflowLog

    extra_context = extra_context or {}

    try:
        active_workflows = Workflow.objects.filter(
            module=module_name,
            trigger_event=trigger_event,
            is_active=True,
        ).prefetch_related('conditions', 'actions__specific_user')
    except Exception as exc:
        logger.error(
            "[Engine] DB error fetching workflows for %s/%s: %s",
            module_name, trigger_event, exc,
        )
        return

    for workflow in active_workflows:
        _run_workflow(workflow, instance, trigger_event, extra_context, WorkflowLog)


# ===========================================================================
# INTERNAL: single workflow runner
# ===========================================================================
def _run_workflow(workflow, instance, trigger_event, extra_context, WorkflowLog) -> None:
    try:
        conditions_met, skip_reason = _evaluate_conditions(workflow, instance, extra_context)

        if not conditions_met:
            logger.debug(
                "[Engine] Conditions NOT met — skipped '%s' (id=%s): %s",
                workflow.name, workflow.id, skip_reason,
            )
            WorkflowLog.objects.create(
                workflow=workflow,
                status='skipped',
                trigger_event=trigger_event,
                object_id=str(instance.pk),
                message=f"Conditions not met: {skip_reason}",
            )
            return

        logger.info(
            "[Engine] Running '%s' (id=%s) on %s id=%s",
            workflow.name, workflow.id, instance.__class__.__name__, instance.pk,
        )

        errors  = []
        success = []
        for action in workflow.actions.all():
            try:
                _dispatch_action(action, instance, workflow, extra_context)
                success.append(action.action_type)
            except Exception as exc:
                msg = f"Action '{action.action_type}' (id={action.id}) failed: {exc}"
                logger.error("[Engine] %s (workflow=%s)", msg, workflow.id)
                errors.append(msg)

        if errors and success:
            final_status = 'partial'
        elif errors:
            final_status = 'failure'
        else:
            final_status = 'success'

        WorkflowLog.objects.create(
            workflow=workflow,
            status=final_status,
            trigger_event=trigger_event,
            object_id=str(instance.pk),
            message=(
                f"OK: {', '.join(success)}" if not errors
                else f"Errors:\n" + "\n".join(errors)
            ),
        )

    except Exception as exc:
        logger.error(
            "[Engine] Unhandled error in workflow '%s' (id=%s): %s",
            workflow.name, workflow.id, exc,
        )
        try:
            WorkflowLog.objects.create(
                workflow=workflow,
                status='failure',
                trigger_event=trigger_event,
                object_id=str(getattr(instance, 'pk', '?')),
                message=f"Engine error: {exc}",
            )
        except Exception:
            pass  # Never propagate logging failures


# ===========================================================================
# CONDITION EVALUATION  (AND / OR)
# ===========================================================================
def _evaluate_conditions(workflow, instance, extra_context: dict):
    """
    Returns (bool, reason_string).
    Empty condition list = unconditional trigger.
    """
    conditions = list(workflow.conditions.all())
    if not conditions:
        return True, "No conditions (unconditional)"

    logic = workflow.condition_logic  # 'AND' | 'OR'
    results = []

    for condition in conditions:
        matched = _eval_one_condition(condition, instance, extra_context)
        results.append((matched, str(condition)))

    if logic == 'OR':
        passed = any(r[0] for r in results)
        reason = f"OR — at least one must match: {results}"
    else:  # AND (default)
        passed = all(r[0] for r in results)
        reason = f"AND — all must match: {results}"

    return passed, reason


def _eval_one_condition(condition, instance, extra_context: dict) -> bool:
    """
    Evaluate a single WorkflowCondition against the instance.
    Supports:
      - Standard field paths (dot notation): 'status', 'value', 'contact.company'
      - Extra-context keys for change detection: 'old_stage', 'old_status'
    """
    field_path = condition.field_name
    target     = condition.value
    op         = condition.operator

    # Check extra_context first (e.g. old_stage for stage_changed events)
    if field_path in extra_context:
        field_value = extra_context[field_path]
    else:
        field_value = _resolve_field(instance, field_path)

    try:
        return _apply_operator(op, field_value, target)
    except (TypeError, ValueError) as exc:
        logger.warning(
            "[Engine] Condition eval error (field=%s, op=%s, val=%r): %s",
            field_path, op, field_value, exc,
        )
        return False


def _apply_operator(op: str, field_value, target: str) -> bool:
    """Apply a comparison operator between field_value and target."""
    # Null-safe operators
    if op == 'is_empty':
        return field_value in (None, '', [], {})
    if op == 'is_not_empty':
        return field_value not in (None, '', [], {})

    fv_str = str(field_value).lower() if field_value is not None else ''
    tg_str = str(target).lower()

    if op == 'equals':
        return fv_str == tg_str
    if op == 'not_equals':
        return fv_str != tg_str
    if op == 'contains':
        return tg_str in fv_str
    if op == 'not_contains':
        return tg_str not in fv_str
    if op == 'starts_with':
        return fv_str.startswith(tg_str)
    if op == 'ends_with':
        return fv_str.endswith(tg_str)

    # Numeric comparisons
    fv_num = float(field_value)
    tg_num = float(target)
    if op == 'gt':
        return fv_num > tg_num
    if op == 'gte':
        return fv_num >= tg_num
    if op == 'lt':
        return fv_num < tg_num
    if op == 'lte':
        return fv_num <= tg_num

    logger.warning("[Engine] Unknown operator '%s'", op)
    return False


def _resolve_field(instance, field_path: str):
    """Resolve dot-separated field path, e.g. 'contact.company'."""
    value = instance
    for part in field_path.split('.'):
        if value is None:
            return None
        value = getattr(value, part, None)
    return value


# ===========================================================================
# ACTION DISPATCHER
# ===========================================================================
def _dispatch_action(action, instance, workflow, extra_context: dict) -> None:
    handlers = {
        'create_task':        _do_create_task,
        'assign_user':        _do_assign_user,
        'send_email':         _do_send_email,
        'update_field':       _do_update_field,
        'create_project':     _do_create_project,
        'send_notification':  _do_send_notification,
        'create_quote':       _do_create_quote,
        'generate_invoice':   _do_generate_invoice,
    }
    handler = handlers.get(action.action_type)
    if handler is None:
        logger.warning("[Engine] No handler for action type '%s'", action.action_type)
        return
    handler(action, instance, workflow)


# ===========================================================================
# ACTION: CREATE TASK  (core feature)
# ===========================================================================
def _do_create_task(action, instance, workflow) -> None:
    """
    Auto-create and assign a Task.

    WorkflowAction.action_data schema:
        {
            "title":            "Follow up with {name}",   # {name} is interpolated
            "description":      "Auto-created by workflow.",
            "due_days_override": 3                         # overrides action.delay_days
        }

    Assignment strategies:
        owner        → lead.assigned_to  /  deal.owner
        round_robin  → cycle through sales reps in same team
        manager      → first manager of the team
        specific_user→ action.specific_user FK
    """
    from workflows.tasks import execute_create_task, execute_delayed_task

    data        = action.action_data or {}
    delay_days  = data.get('due_days_override', action.delay_days)
    delay_days  = int(delay_days)

    # Build task kwargs — these are passed to Celery so must be JSON-serializable
    task_kwargs = {
        'workflow_id':      workflow.id,
        'workflow_action_id': action.id,
        'title':            _interpolate(data.get('title', 'Follow-up Task'), instance),
        'description':      _interpolate(
            data.get('description', f'Auto-created by workflow: {workflow.name}'),
            instance
        ),
        'priority':         action.priority,
        'delay_days':       delay_days,
        'assignment_type':  action.assignment_type,
        'specific_user_id': action.specific_user_id,
        'source_object_id': str(instance.pk),
        # Resolved owner PK — serialize now while we have the instance
        'owner_user_id':    _resolve_owner_id(instance),
        'team_name':        _resolve_team_name(instance),
    }

    # Snapshot serializable values before going async
    _workflow_name = workflow.name

    def _dispatch():
        """
        1. Try to queue via Celery (requires Redis running).
        2. If Celery/Redis is unavailable, fall back to _create_task_in_db()
           directly in this background thread — task lands in DB regardless.
        Each branch is fully logged so failures are never silent.
        """
        # IMPORTANT: fresh DB connection for this thread
        from django.db import close_old_connections
        close_old_connections()

        # ── Try Celery ───────────────────────────────────────────────────
        celery_ok = False
        try:
            from workflows.tasks import execute_create_task
            execute_create_task.apply_async(
                kwargs=task_kwargs,
                countdown=delay_days * 86_400,
            )
            logger.info(
                "[Engine] create_task QUEUED via Celery "
                "(strategy=%s, delay=%dd, workflow='%s')",
                task_kwargs['assignment_type'], delay_days, _workflow_name,
            )
            celery_ok = True
        except Exception as celery_exc:
            logger.warning(
                "[Engine] Celery unavailable — falling back to direct DB creation "
                "(workflow='%s', reason=%s)",
                _workflow_name, celery_exc,
            )

        if celery_ok:
            return  # Celery will handle it

        # ── Direct fallback: create Task in DB now ───────────────────────
        try:
            from workflows.tasks import _create_task_in_db
            result = _create_task_in_db(**task_kwargs)
            logger.info(
                "[Engine] create_task DIRECT FALLBACK succeeded "
                "→ task_id=%s assigned_to=%s (workflow='%s')",
                result.get('task_id'), result.get('assigned_to'), _workflow_name,
            )
        except Exception as direct_exc:
            logger.error(
                "[Engine] create_task DIRECT FALLBACK also failed "
                "(workflow='%s'): %s",
                _workflow_name, direct_exc, exc_info=True,
            )

    t = threading.Thread(target=_dispatch, daemon=True)
    t.start()
    logger.info(
        "[Engine] create_task dispatched (strategy=%s, delay=%dd, workflow='%s')",
        action.assignment_type, delay_days, _workflow_name
    )



def _interpolate(template: str, instance) -> str:
    """
    Replace {field} placeholders in a string with instance field values.
    Example: "Follow up with {name}" → "Follow up with Acme Corp"
    """
    import re
    def replacer(match):
        field = match.group(1)
        value = _resolve_field(instance, field)
        return str(value) if value is not None else match.group(0)
    return re.sub(r'\{(\w[\w.]*)\}', replacer, template)


def _resolve_owner_id(instance) -> int | None:
    """Return the PK of the record's owner/assignee."""
    owner = getattr(instance, 'owner', None) or getattr(instance, 'assigned_to', None)
    return owner.pk if owner else None


def _resolve_team_name(instance) -> str | None:
    """Return the team name of the record's owner/assignee."""
    owner = getattr(instance, 'owner', None) or getattr(instance, 'assigned_to', None)
    if owner:
        return getattr(owner, 'team', None)
    return None


# ===========================================================================
# ACTION: ASSIGN USER
# ===========================================================================
def _do_assign_user(action, instance, workflow) -> None:
    """Assign a user to the record. action_data: {user_id, field}"""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    data    = action.action_data or {}
    user_id = data.get('user_id')
    field   = data.get('field', 'assigned_to')

    if not user_id:
        raise ValueError("assign_user: missing 'user_id' in action_data")

    user = User.objects.get(pk=user_id)
    if not hasattr(instance, field):
        raise ValueError(
            f"assign_user: field '{field}' not found on {instance.__class__.__name__}"
        )

    setattr(instance, field, user)
    instance.save(update_fields=[field])
    logger.info(
        "[Engine] assign_user: %s → %s.%s id=%s",
        user.username, instance.__class__.__name__, field, instance.pk
    )


# ===========================================================================
# ACTION: SEND EMAIL
# ===========================================================================
def _do_send_email(action, instance, workflow) -> None:
    """Send email via Celery. action_data: {to_field, subject, body}"""
    from workflows.tasks import send_workflow_email

    data     = action.action_data or {}
    to_field = data.get('to_field', 'email')
    subject  = _interpolate(data.get('subject', 'CRM Notification'), instance)
    body     = _interpolate(data.get('body', ''), instance)
    to_email = _resolve_field(instance, to_field)

    if not to_email:
        raise ValueError(
            f"send_email: could not resolve '{to_field}' on "
            f"{instance.__class__.__name__} id={instance.pk}"
        )

    transaction.on_commit(
        lambda: send_workflow_email.apply_async(args=[to_email, subject, body])
    )
    logger.info("[Engine] send_email queued → %s", to_email)


# ===========================================================================
# ACTION: UPDATE FIELD
# ===========================================================================
def _do_update_field(action, instance, workflow) -> None:
    """Set a field on the record. action_data: {field, value}"""
    data  = action.action_data or {}
    field = data.get('field')
    value = data.get('value')

    if not field:
        raise ValueError("update_field: missing 'field' in action_data")
    if not hasattr(instance, field):
        raise ValueError(
            f"update_field: '{field}' not found on {instance.__class__.__name__}"
        )

    setattr(instance, field, value)
    instance.save(update_fields=[field])
    logger.info(
        "[Engine] update_field: %s.%s = %r id=%s",
        instance.__class__.__name__, field, value, instance.pk
    )


# ===========================================================================
# ACTION: CREATE PROJECT
# ===========================================================================
def _do_create_project(action, instance, workflow) -> None:
    """Create a Project. action_data: {name, description}"""
    from projects.models import Project

    data        = action.action_data or {}
    name        = _interpolate(
        data.get('name', f"Project for {getattr(instance, 'title', str(instance))}"),
        instance
    )
    description = _interpolate(data.get('description', ''), instance)
    owner       = getattr(instance, 'owner', None) or getattr(instance, 'assigned_to', None)

    kwargs = {'name': name, 'description': description}
    if owner and hasattr(Project, 'owner'):
        kwargs['owner'] = owner

    project = Project.objects.create(**kwargs)
    logger.info("[Engine] create_project: Project id=%s '%s'", project.pk, project.name)


# ===========================================================================
# ACTION: SEND NOTIFICATION
# ===========================================================================
def _do_send_notification(action, instance, workflow) -> None:
    """Broadcast a WebSocket notification + log. action_data: {message}"""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    data    = action.action_data or {}
    message = _interpolate(data.get('message', 'CRM Workflow Notification'), instance)
    owner   = getattr(instance, 'owner', None) or getattr(instance, 'assigned_to', None)

    logger.info(
        "[Engine] NOTIFICATION → user=%s: %s (%s id=%s)",
        getattr(owner, 'username', 'unknown'), message,
        instance.__class__.__name__, instance.pk,
    )

    channel_layer = get_channel_layer()
    if channel_layer:
        try:
            async_to_sync(channel_layer.group_send)(
                'global_notifications',
                {
                    'type':    'send_notification',
                    'message': {
                        'action':  'workflow_notification',
                        'workflow': workflow.name,
                        'text':    message,
                        'model':   instance.__class__.__name__,
                        'id':      instance.pk,
                    }
                }
            )
        except Exception as exc:
            logger.warning("[Engine] WebSocket broadcast failed: %s", exc)


# ===========================================================================
# ACTION: CREATE QUOTE
# ===========================================================================
def _do_create_quote(action, instance, workflow) -> None:
    """Create a Quote. action_data: {amount, valid_days}"""
    from quotes.models import Quote
    from django.utils import timezone
    from datetime import timedelta

    if instance.__class__.__name__.lower() != 'deal':
        raise ValueError(
            f"create_quote requires a Deal instance, got {instance.__class__.__name__}"
        )

    data        = action.action_data or {}
    amount      = float(data.get('amount', getattr(instance, 'value', 0)))
    valid_until = (timezone.now() + timedelta(days=int(data.get('valid_days', 30)))).date()
    quote_num   = f"QT-{instance.pk}-{uuid.uuid4().hex[:6].upper()}"

    kwargs = {
        'deal':         instance,
        'quote_number': quote_num,
        'amount':       amount,
        'status':       'draft',
        'valid_until':  valid_until,
    }
    owner = getattr(instance, 'owner', None)
    if owner and hasattr(Quote, 'owner'):
        kwargs['owner'] = owner

    quote = Quote.objects.create(**kwargs)
    logger.info("[Engine] create_quote: Quote id=%s '%s'", quote.pk, quote_num)


# ===========================================================================
# ACTION: GENERATE INVOICE
# ===========================================================================
def _do_generate_invoice(action, instance, workflow) -> None:
    """Generate an Invoice from a Quote. action_data: {due_days}"""
    from invoices.models import Invoice
    from django.utils import timezone
    from datetime import timedelta

    if instance.__class__.__name__.lower() != 'quote':
        raise ValueError(
            f"generate_invoice requires a Quote instance, got {instance.__class__.__name__}"
        )

    data       = action.action_data or {}
    due_date   = (timezone.now() + timedelta(days=int(data.get('due_days', 30)))).date()
    inv_num    = f"INV-{instance.pk}-{uuid.uuid4().hex[:6].upper()}"

    kwargs = {
        'quote':          instance,
        'invoice_number': inv_num,
        'amount':         instance.amount,
        'status':         'draft',
        'due_date':       due_date,
    }
    owner = getattr(instance, 'owner', None)
    if owner and hasattr(Invoice, 'owner'):
        kwargs['owner'] = owner

    invoice = Invoice.objects.create(**kwargs)
    logger.info(
        "[Engine] generate_invoice: Invoice id=%s '%s'", invoice.pk, inv_num
    )
