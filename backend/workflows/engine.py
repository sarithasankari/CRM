"""
Workflow Execution Engine — Production Grade
============================================
Called by Django signals (post_save, pre_delete) for all core-app models.

Flow:
  1. Find all active Workflows matching (module, trigger_event).
  2. Evaluate ALL conditions — empty conditions = unconditional fire.
  3. Dispatch each configured action with full error isolation.
  4. Write a WorkflowLog entry (success or failure) per execution.
  5. Never let a workflow failure crash the originating request.
"""

import logging
import uuid
from django.db import transaction

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Stage → probability mapping (mirrors Zoho CRM defaults)
# ---------------------------------------------------------------------------
STAGE_PROBABILITY = {
    'Qualification': 20,
    'Needs Analysis': 35,
    'Value Proposition': 45,
    'Identify Decision Makers': 55,
    'Proposal/Price Quote': 65,
    'Negotiation/Review': 80,
    'Closed Won': 100,
    'Closed Lost': 0,
    'Closed Lost to Competition': 0,
}


# ---------------------------------------------------------------------------
# Public entry-point — called by signals
# ---------------------------------------------------------------------------
def trigger_workflows(module_name: str, trigger_event: str, instance) -> None:
    """
    Evaluate and execute all active workflows matching module + trigger_event.

    Args:
        module_name:    lowercase model name, e.g. 'lead', 'deal'
        trigger_event:  'create' | 'update' | 'delete'
        instance:       the Django model instance that was saved/deleted
    """
    # Late import to avoid circular imports at startup
    from workflows.models import Workflow, WorkflowLog

    try:
        active_workflows = Workflow.objects.filter(
            module=module_name,
            trigger_event=trigger_event,
            is_active=True,
        ).prefetch_related('conditions', 'actions')
    except Exception as exc:
        logger.error(
            "[WorkflowEngine] DB error fetching workflows for %s/%s: %s",
            module_name, trigger_event, exc,
        )
        return

    for workflow in active_workflows:
        _run_workflow(workflow, instance, WorkflowLog)


# ---------------------------------------------------------------------------
# Internal: single workflow runner
# ---------------------------------------------------------------------------
def _run_workflow(workflow, instance, WorkflowLog) -> None:
    try:
        if not _evaluate_conditions(workflow, instance):
            logger.debug(
                "[WorkflowEngine] Conditions NOT met — skipped '%s' (id=%s)",
                workflow.name, workflow.id,
            )
            return

        logger.info(
            "[WorkflowEngine] Running '%s' (id=%s) on %s id=%s",
            workflow.name, workflow.id, instance.__class__.__name__, instance.pk,
        )

        errors = []
        for action in workflow.actions.all():
            try:
                _dispatch_action(action, instance)
            except Exception as exc:
                msg = f"Action '{action.action_type}' failed: {exc}"
                logger.error("[WorkflowEngine] %s (workflow=%s)", msg, workflow.id)
                errors.append(msg)

        WorkflowLog.objects.create(
            workflow=workflow,
            status='failure' if errors else 'success',
            message=('\n'.join(errors) if errors
                     else f"OK — {instance.__class__.__name__} id={instance.pk}"),
        )

    except Exception as exc:
        logger.error(
            "[WorkflowEngine] Unhandled error in workflow '%s' (id=%s): %s",
            workflow.name, workflow.id, exc,
        )
        try:
            WorkflowLog.objects.create(
                workflow=workflow,
                status='failure',
                message=f"Engine error: {exc}",
            )
        except Exception:
            pass  # Never propagate logging failures


# ---------------------------------------------------------------------------
# Condition evaluation
# ---------------------------------------------------------------------------
def _evaluate_conditions(workflow, instance) -> bool:
    conditions = list(workflow.conditions.all())
    if not conditions:
        return True  # No conditions = unconditional trigger

    for condition in conditions:
        if not _eval_condition(condition, instance):
            return False
    return True


def _eval_condition(condition, instance) -> bool:
    """
    Evaluate one WorkflowCondition against the instance.
    Supports dot-notation field paths, e.g. 'contact.company'.
    """
    field_value = _resolve_field(instance, condition.field_name)
    target = condition.value
    op = condition.operator

    try:
        if op in ('gt', 'lt'):
            return float(field_value) > float(target) if op == 'gt' else float(field_value) < float(target)
        if op == 'equals':
            return str(field_value).lower() == str(target).lower()
        if op == 'not_equals':
            return str(field_value).lower() != str(target).lower()
        if op == 'contains':
            return str(target).lower() in str(field_value).lower()

        logger.warning("[WorkflowEngine] Unknown operator '%s'", op)
        return False

    except (TypeError, ValueError) as exc:
        logger.warning(
            "[WorkflowEngine] Condition eval error (field=%s, op=%s): %s",
            condition.field_name, op, exc,
        )
        return False


def _resolve_field(instance, field_path: str):
    """Resolve dot-separated field path, e.g. 'contact.company'."""
    value = instance
    for part in field_path.split('.'):
        if value is None:
            return None
        value = getattr(value, part, None)
    return value


# ---------------------------------------------------------------------------
# Action dispatcher
# ---------------------------------------------------------------------------
def _dispatch_action(action, instance) -> None:
    handlers = {
        'assign_user':       _do_assign_user,
        'create_task':       _do_create_task,
        'send_email':        _do_send_email,
        'update_field':      _do_update_field,
        'create_project':    _do_create_project,
        'send_notification': _do_send_notification,
        'create_quote':      _do_create_quote,
        'generate_invoice':  _do_generate_invoice,
    }
    handler = handlers.get(action.action_type)
    if handler is None:
        logger.warning("[WorkflowEngine] No handler for '%s'", action.action_type)
        return
    handler(action.action_data or {}, instance)


# ---------------------------------------------------------------------------
# Individual action handlers
# ---------------------------------------------------------------------------
def _do_assign_user(data: dict, instance) -> None:
    """Assign a user to the record. data: {user_id, field}"""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    user_id = data.get('user_id')
    field = data.get('field', 'assigned_to')

    if not user_id:
        raise ValueError("assign_user: missing 'user_id'")

    user = User.objects.get(pk=user_id)
    if not hasattr(instance, field):
        raise ValueError(f"assign_user: field '{field}' not on {instance.__class__.__name__}")

    setattr(instance, field, user)
    instance.save(update_fields=[field])
    logger.info("[WorkflowEngine] assign_user: %s → %s.%s id=%s", user.username, instance.__class__.__name__, field, instance.pk)


def _do_create_task(data: dict, instance) -> None:
    """Create a follow-up Task. data: {title, description, due_days}"""
    from tasks.models import Task
    from django.utils import timezone
    from datetime import timedelta

    title = data.get('title', f"Follow-up: {getattr(instance, 'title', str(instance))}")
    description = data.get('description', '')
    due_days = int(data.get('due_days', 1))
    assigned_to = getattr(instance, 'owner', None) or getattr(instance, 'assigned_to', None)

    task = Task.objects.create(
        title=title,
        description=description,
        status='pending',
        due_date=timezone.now() + timedelta(days=due_days),
        assigned_to=assigned_to,
    )
    logger.info("[WorkflowEngine] create_task: Task id=%s '%s'", task.pk, task.title)


def _do_send_email(data: dict, instance) -> None:
    """Send email via Celery. data: {to_field, subject, body}"""
    from workflows.tasks import send_workflow_email

    to_field = data.get('to_field', 'email')
    subject = data.get('subject', 'CRM Notification')
    body = data.get('body', '')
    to_email = _resolve_field(instance, to_field)

    if not to_email:
        raise ValueError(f"send_email: could not resolve '{to_field}' on {instance.__class__.__name__} id={instance.pk}")

    try:
        transaction.on_commit(lambda: send_workflow_email.delay(to_email, subject, body))
        logger.info("[WorkflowEngine] send_email queued → %s", to_email)
    except Exception as exc:
        logger.warning("[WorkflowEngine] Celery unavailable, sending sync: %s", exc)
        from django.core.mail import send_mail
        send_mail(subject=subject, message=body, from_email=None, recipient_list=[to_email], fail_silently=False)


def _do_update_field(data: dict, instance) -> None:
    """Set a field on the record. data: {field, value}"""
    field = data.get('field')
    value = data.get('value')
    if not field:
        raise ValueError("update_field: missing 'field'")
    if not hasattr(instance, field):
        raise ValueError(f"update_field: '{field}' not on {instance.__class__.__name__}")
    setattr(instance, field, value)
    instance.save(update_fields=[field])
    logger.info("[WorkflowEngine] update_field: %s.%s = %r id=%s", instance.__class__.__name__, field, value, instance.pk)


def _do_create_project(data: dict, instance) -> None:
    """Create a Project. data: {name, description}"""
    from projects.models import Project
    name = data.get('name', f"Project for {getattr(instance, 'title', str(instance))}")
    description = data.get('description', '')
    owner = getattr(instance, 'owner', None) or getattr(instance, 'assigned_to', None)
    kwargs = {'name': name, 'description': description}
    if owner and hasattr(Project, 'owner'):
        kwargs['owner'] = owner
    project = Project.objects.create(**kwargs)
    logger.info("[WorkflowEngine] create_project: Project id=%s '%s'", project.pk, project.name)


def _do_send_notification(data: dict, instance) -> None:
    """Log notification (extend with WebSocket/push later). data: {message}"""
    message = data.get('message', 'CRM Notification')
    owner = getattr(instance, 'owner', None) or getattr(instance, 'assigned_to', None)
    logger.info(
        "[WorkflowEngine] NOTIFICATION → user=%s: %s (%s id=%s)",
        getattr(owner, 'username', 'unknown'), message, instance.__class__.__name__, instance.pk,
    )


def _do_create_quote(data: dict, instance) -> None:
    """Create a Quote for a Deal. data: {amount, valid_days}"""
    from quotes.models import Quote
    from django.utils import timezone
    from datetime import timedelta

    if instance.__class__.__name__.lower() != 'deal':
        raise ValueError(f"create_quote requires a Deal instance, got {instance.__class__.__name__}")

    amount = float(data.get('amount', getattr(instance, 'value', 0)))
    valid_until = (timezone.now() + timedelta(days=int(data.get('valid_days', 30)))).date()
    quote_number = f"QT-{instance.pk}-{uuid.uuid4().hex[:6].upper()}"

    kwargs = {'deal': instance, 'quote_number': quote_number, 'amount': amount, 'status': 'draft', 'valid_until': valid_until}
    owner = getattr(instance, 'owner', None)
    if owner and hasattr(Quote, 'owner'):
        kwargs['owner'] = owner

    quote = Quote.objects.create(**kwargs)
    logger.info("[WorkflowEngine] create_quote: Quote id=%s '%s'", quote.pk, quote_number)


def _do_generate_invoice(data: dict, instance) -> None:
    """Generate an Invoice from a Quote. data: {due_days}"""
    from invoices.models import Invoice
    from django.utils import timezone
    from datetime import timedelta

    if instance.__class__.__name__.lower() != 'quote':
        raise ValueError(f"generate_invoice requires a Quote instance, got {instance.__class__.__name__}")

    due_date = (timezone.now() + timedelta(days=int(data.get('due_days', 30)))).date()
    invoice_number = f"INV-{instance.pk}-{uuid.uuid4().hex[:6].upper()}"

    kwargs = {'quote': instance, 'invoice_number': invoice_number, 'amount': instance.amount, 'status': 'draft', 'due_date': due_date}
    owner = getattr(instance, 'owner', None)
    if owner and hasattr(Invoice, 'owner'):
        kwargs['owner'] = owner

    invoice = Invoice.objects.create(**kwargs)
    logger.info("[WorkflowEngine] generate_invoice: Invoice id=%s '%s'", invoice.pk, invoice_number)
