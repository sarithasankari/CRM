import json
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.forms.models import model_to_dict

from leads.models import Lead
from deals.models import Deal
from contacts.models import Contact
from tasks.models import Task
from .models import AuditLog, Meeting, Call
import logging

logger = logging.getLogger(__name__)

def broadcast_update(message):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'global_notifications',
            {
                'type': 'send_notification',
                'message': message
            }
        )

def log_and_broadcast(sender, instance, created, **kwargs):
    action = 'create' if created else 'update'
    model_name = sender.__name__
    
    # Try to safely get changes
    changes = {}
    try:
        changes = model_to_dict(instance)
        # remove un-serializable fields if necessary, or just stringify
        for k, v in changes.items():
            changes[k] = str(v)
    except Exception:
        pass

    # Create Audit Log
    # In a real app we'd get the user from thread locals. We'll leave it blank or assigned if available.
    user = getattr(instance, 'assigned_to', None) or getattr(instance, 'created_by', None)
    
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=str(instance.pk),
        changes=changes
    )

    title = getattr(instance, 'title', getattr(instance, 'name', str(instance)))
    
    broadcast_update({
        'action': action,
        'model': model_name,
        'id': instance.pk,
        'title': f"{model_name} {action}d: {title}"
    })

@receiver(post_save, sender=Lead)
@receiver(post_save, sender=Deal)
@receiver(post_save, sender=Contact)
@receiver(post_save, sender=Task)
@receiver(post_save, sender=Meeting)
@receiver(post_save, sender=Call)
def handle_post_save(sender, instance, created, **kwargs):
    log_and_broadcast(sender, instance, created, **kwargs)

    from workflows.tasks import execute_create_task

    # Activity Engine Automation for CALL
    if sender == Call and created:
        if instance.content_type and instance.content_type.model == 'lead':
            lead = instance.related_to
            if lead.status in ['won', 'lost', 'converted']:
                # Deduplication logic / stop workflow
                if not (lead.status == 'lost' and instance.outcome == 'not_interested'):
                    return

            from django.utils import timezone
            from datetime import timedelta
            from workflows.auto_pilot import execute_auto_meeting, execute_auto_call

            if instance.outcome == 'interested':
                task = Task.objects.create(
                    title=f"Schedule Meeting with {lead.name} (Auto)",
                    description=f"Call outcome was Interested. System will auto-schedule meeting.",
                    priority='high',
                    due_date=timezone.now() + timedelta(hours=1),
                    assigned_to=instance.owner,
                    source_object_id=str(lead.id),
                    status='pending',
                    task_type='meeting' if hasattr(Task, 'task_type') else 'follow-up'
                )
                execute_auto_meeting.apply_async(args=[task.id], countdown=3600) # 1 hour
                
            elif instance.outcome == 'no_answer':
                task = Task.objects.create(
                    title=f"Retry Call with {lead.name} (Auto)",
                    description=f"No answer on previous call. System will auto-retry.",
                    priority='medium',
                    due_date=timezone.now() + timedelta(hours=2),
                    assigned_to=instance.owner,
                    source_object_id=str(lead.id),
                    status='pending',
                    task_type='call' if hasattr(Task, 'task_type') else 'follow-up'
                )
                execute_auto_call.apply_async(args=[task.id], countdown=7200) # 2 hours
                
            elif instance.outcome == 'not_interested':
                lead.status = 'lost'
                lead.save(update_fields=['status'])

    # Activity Engine Automation for MEETING
    if sender == Meeting and not created:
        if instance.status == 'completed':
            if instance.content_type and instance.content_type.model == 'lead':
                lead = instance.related_to
                if lead.status not in ['won', 'lost', 'converted']:
                    execute_create_task.apply_async(kwargs={
                        'workflow_id': None, 'workflow_action_id': None,
                        'title': f"Send Proposal to {lead.name}",
                        'description': f"Meeting completed. Send a proposal.",
                        'priority': 'high', 'delay_days': 1,
                        'assignment_type': 'specific_user',
                        'specific_user_id': instance.owner.id if instance.owner else None,
                        'source_object_id': str(lead.id),
                        'owner_user_id': instance.owner.id if instance.owner else None,
                    })
        elif instance.status == 'no_show':
            if instance.content_type and instance.content_type.model == 'lead':
                lead = instance.related_to
                if lead.status not in ['won', 'lost', 'converted']:
                    execute_create_task.apply_async(kwargs={
                        'workflow_id': None, 'workflow_action_id': None,
                        'title': f"Reschedule Meeting with {lead.name}",
                        'description': f"Prospect was a no-show.",
                        'priority': 'medium', 'delay_days': 1,
                        'assignment_type': 'specific_user',
                        'specific_user_id': instance.owner.id if instance.owner else None,
                        'source_object_id': str(lead.id),
                        'owner_user_id': instance.owner.id if instance.owner else None,
                    })

    log_and_broadcast(sender, instance, created, **kwargs)

@receiver(post_delete, sender=Lead)
@receiver(post_delete, sender=Deal)
@receiver(post_delete, sender=Contact)
@receiver(post_delete, sender=Task)
@receiver(post_delete, sender=Meeting)
@receiver(post_delete, sender=Call)
def handle_post_delete(sender, instance, **kwargs):
    model_name = sender.__name__
    title = getattr(instance, 'title', getattr(instance, 'name', str(instance)))
    
    broadcast_update({
        'action': 'delete',
        'model': model_name,
        'id': instance.pk,
        'title': f"{model_name} deleted: {title}"
    })
