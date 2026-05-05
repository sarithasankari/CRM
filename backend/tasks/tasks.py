"""
Tasks Celery Jobs
==================
- reconcile_lead_tasks: sync Lead status ↔ Task steps
- escalate_overdue_tasks: SLA enforcement — escalate overdue tasks
"""
import logging
from django.utils import timezone
from celery import shared_task
from leads.models import Lead
from tasks.models import Task, ActivityLog

logger = logging.getLogger(__name__)

try:
    from leads.constants import STATUS_TO_STEP
except ImportError:
    STATUS_TO_STEP = {}


@shared_task
def reconcile_lead_tasks():
    """Runs every 5 minutes to ensure Lead status and Task steps are in sync."""
    leads = Lead.objects.exclude(status__in=['won', 'lost'])

    for lead in leads:
        expected_step = STATUS_TO_STEP.get(lead.status)
        task = Task.objects.filter(lead=lead, is_active=True).first()

        if not task:
            logger.warning(f"[Recovery] Recreating missing task for Lead:{lead.id}")
            Task.objects.create(
                lead=lead,
                task_type='follow_up',
                title="Master Task: Recovery",
                current_step=expected_step,
                status='in_progress',
            )
        elif expected_step and task.current_step != expected_step:
            logger.warning(
                f"[Recovery] Fixing mismatch for Lead:{lead.id}. "
                f"{task.current_step} → {expected_step}"
            )
            task.current_step = expected_step
            task.save(update_fields=['current_step'])


@shared_task
def escalate_overdue_tasks():
    """
    SLA Enforcement — runs periodically (e.g., every 30 min).

    For every overdue task:
    1. Escalate priority (low→medium, medium→high)
    2. Create ActivityLog entry
    3. (Optional) Send notification — placeholder for email/WS
    """
    now = timezone.now()

    overdue_tasks = Task.objects.filter(
        due_date__lt=now,
        status__in=['not_started', 'pending', 'in_progress'],
        is_active=True,
    ).select_related('assigned_to', 'lead')

    escalated = 0
    priority_ladder = {'low': 'medium', 'medium': 'high', 'high': 'high'}

    for task in overdue_tasks:
        new_priority = priority_ladder.get(task.priority, task.priority)
        changed = new_priority != task.priority

        if changed:
            old_priority = task.priority
            task.priority = new_priority
            task.save(update_fields=['priority', 'updated_at'])
            escalated += 1

            try:
                ActivityLog.objects.create(
                    task=task,
                    action_type='updated',
                    old_value={'priority': old_priority, 'reason': 'overdue_escalation'},
                    new_value={'priority': new_priority, 'overdue': True},
                    user=None,
                )
            except Exception as exc:
                logger.error("[SLA] ActivityLog failed for task %s: %s", task.pk, exc)

            # Placeholder: send WebSocket notification
            _notify_overdue(task)

    logger.info("[SLA] Escalated %d overdue tasks.", escalated)
    return escalated


def _notify_overdue(task):
    """Send a broadcast notification for overdue task escalation."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                'global_notifications',
                {
                    'type': 'send_notification',
                    'message': {
                        'action': 'overdue_escalated',
                        'task_id': task.pk,
                        'title': task.title,
                        'new_priority': task.priority,
                        'assigned_to': task.assigned_to.username if task.assigned_to else None,
                    }
                }
            )
    except Exception:
        pass  # WebSocket broadcast is best-effort
