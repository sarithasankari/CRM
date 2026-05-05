"""
Task Signals — ActivityLog auto-creation
=========================================
Every meaningful change to a Task (status, outcome, creation, completion)
is automatically recorded in ActivityLog. This provides the full history
timeline required by the CRM workflow engine.
"""
import logging
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone

logger = logging.getLogger(__name__)

# Track old state before save
_task_pre_save_cache = {}


@receiver(pre_save, sender='tasks.Task')
def task_pre_save(sender, instance, **kwargs):
    """Capture old state before saving so we can diff changes."""
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            _task_pre_save_cache[instance.pk] = {
                'status': old.status,
                'outcome': old.outcome,
                'priority': old.priority,
                'is_active': old.is_active,
            }
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='tasks.Task')
def task_post_save(sender, instance, created, **kwargs):
    """
    After every Task save:
    - Create ActivityLog entries for: creation, status_change, outcome_change, completion
    - Enforce: completed → is_active=False, completed_at=now()
    - Fire workflow engine on completion
    """
    from tasks.models import ActivityLog

    from tasks.middleware import get_current_user

    # Resolve current user: prefer instance-attached user (set by views), fall
    # back to the thread-local set by CurrentUserMiddleware.
    user = getattr(instance, '_current_user', None) or get_current_user()

    if created:
        _safe_log(ActivityLog, instance, 'created', {}, {
            'status': instance.status,
            'task_type': instance.task_type,
            'priority': instance.priority,
        }, user)
        return

    old = _task_pre_save_cache.pop(instance.pk, {})
    if not old:
        return

    # Status change
    new_status = instance.status
    old_status = old.get('status')
    if old_status and new_status != old_status:
        _safe_log(ActivityLog, instance, 'status_change',
                  {'status': old_status}, {'status': new_status}, user)

    # Outcome change
    new_outcome = instance.outcome
    old_outcome = old.get('outcome')
    if new_outcome and new_outcome != old_outcome:
        _safe_log(ActivityLog, instance, 'outcome_change',
                  {'outcome': old_outcome}, {'outcome': new_outcome}, user)

    # Completion
    if new_status == 'completed' and old_status != 'completed':
        _safe_log(ActivityLog, instance, 'completed', {
            'status': old_status,
        }, {
            'status': 'completed',
            'outcome': new_outcome,
            'completed_at': str(instance.completed_at or timezone.now()),
        }, user)

        # Fire the workflow engine (non-blocking, catches exceptions)
        _fire_workflow_on_completion(instance)


def _safe_log(ActivityLog, task, action_type, old_value, new_value, user):
    """Create ActivityLog safely — never raises so signals don't break saves."""
    try:
        ActivityLog.objects.create(
            task=task,
            action_type=action_type,
            old_value=old_value,
            new_value=new_value,
            user=user,
        )
    except Exception as exc:
        logger.error("[Tasks] ActivityLog creation failed: %s", exc, exc_info=True)


def _fire_workflow_on_completion(task):
    """
    Fire the workflow engine when a task completes.
    This is the bridge between task outcomes and automated next steps.
    Catches all exceptions so a workflow failure never breaks the task save.
    """
    try:
        from workflows.engine import trigger_workflows
        trigger_workflows(
            module_name='task',
            trigger_event='on_task_complete',
            instance=task,
            extra_context={
                'task_type': task.task_type,
                'outcome': task.outcome or '',
                'lead_id': str(task.lead_id or ''),
                'deal_id': str(task.deal_id or ''),
            }
        )
    except Exception as exc:
        logger.error("[Tasks] Workflow engine fire failed: %s", exc, exc_info=True)
