from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Lead
from django.db import IntegrityError
import logging

logger = logging.getLogger(__name__)

STATUS_TO_STEP = {
    "new": "Initial Call",
    "contacted": "Follow-up Call",
    "qualified": "Send Proposal",
    "proposal": "Negotiation",
    "won": "Closed Won",
    "lost": "Closed Lost"
}

STEPS_LIST = [
    {'name': 'Initial Call', 'status': 'pending'},
    {'name': 'Follow-up Call', 'status': 'pending'},
    {'name': 'Send Proposal', 'status': 'pending'},
    {'name': 'Negotiation', 'status': 'pending'},
    {'name': 'Closed Won', 'status': 'pending'},
    {'name': 'Closed Lost', 'status': 'pending'}
]

@receiver(pre_save, sender=Lead)
def auto_set_next_action(sender, instance, **kwargs):
    """
    Tracks previous status to prevent over-triggering.
    Sets next_action based on central mapping.
    """
    if not instance.pk:
        instance._old_status = None
    else:
        try:
            instance._old_status = sender.objects.only("status").get(pk=instance.pk).status
        except sender.DoesNotExist:
            instance._old_status = None

    # If not a new lead and status hasn't changed, do not update next_action
    if instance.pk and instance._old_status == instance.status:
        return

    action = STATUS_TO_STEP.get(instance.status)
    if action:
        instance.next_action = action


@receiver(post_save, sender=Lead)
def log_lead_save(sender, instance, created, **kwargs):
    from workflows.auto_pilot import execute_auto_call
    from tasks.models import Task
    from django.utils import timezone
    from datetime import timedelta
    from django.contrib.contenttypes.models import ContentType
    from activities.models import Activity

    # Prevent unnecessary signal load
    old_status = getattr(instance, '_old_status', None)
    if not created and old_status == instance.status:
        return

    if created:
        logger.info(f"New Lead created: {instance.name} ({instance.email})")
        try:
            try:
                task = Task.objects.create(
                    title=f"Lead Workflow: {instance.name}",
                    description=f"Automated single-task workflow for {instance.name}.",
                    priority='high',
                    due_date=timezone.now() + timedelta(hours=1),
                    assigned_to=instance.assigned_to,
                    lead=instance,
                    source_object_id=str(instance.id),
                    status='in_progress',
                    current_step='Initial Call',
                    next_action='Initial Call',
                    steps={'list': STEPS_LIST.copy()},
                    task_type='call'
                )
            except IntegrityError:
                task = Task.objects.get(
                    lead=instance,
                    status__in=["pending", "in_progress"]
                )
            
            # Log Activity
            Activity.objects.create(
                type='created',
                notes=f"Started workflow for lead {instance.name}. Next: Initial Call",
                object_id=instance.id,
                content_type=ContentType.objects.get_for_model(instance),
            )
            
            execute_auto_call.apply_async(args=[instance.id], countdown=3600)
            
        except Exception as e:
            logger.error(f"Failed to auto-create single lead task: {e}")
            
    else:
        logger.info(f"Lead {instance.id} status changed: {old_status} -> {instance.status}")
        
        try:
            # Enforce single task - fetch the only active one, or any if none active
            task = Task.objects.filter(lead=instance).exclude(status='completed').first()
            if not task:
                task = Task.objects.filter(lead=instance).first()

            if not task:
                logger.warning(f"[Signal] Master Task missing for lead {instance.id}. Recreating safely.")
                try:
                    task = Task.objects.create(
                        title=f"Lead Workflow: {instance.name}",
                        description=f"Automated single-task workflow for {instance.name}.",
                        priority='high',
                        due_date=timezone.now() + timedelta(hours=1),
                        assigned_to=instance.assigned_to,
                        lead=instance,
                        source_object_id=str(instance.id),
                        status='in_progress',
                        current_step='Initial Call',
                        next_action='Initial Call',
                        steps={'list': STEPS_LIST.copy()},
                        task_type='call'
                    )
                except IntegrityError:
                    task = Task.objects.get(
                        lead=instance,
                        status__in=["pending", "in_progress"]
                    )

            if task:
                new_step = STATUS_TO_STEP.get(instance.status, 'Initial Call')
                
                if task.current_step != new_step:
                    old_step = task.current_step
                    task.current_step = new_step
                    task.next_action = new_step
                    task.due_date = timezone.now() + timedelta(days=1)
                    
                    steps_data = task.steps.get('list', [])
                    for s in steps_data:
                        if s['name'] == old_step:
                            s['status'] = 'completed'
                        elif s['name'] == new_step:
                            s['status'] = 'in_progress'
                    task.steps = {'list': steps_data}
                    
                    if instance.status in ['won', 'lost']:
                        task.status = 'completed'
                        task.is_active = False

                    task.save(update_fields=['current_step', 'next_action', 'due_date', 'steps', 'status', 'is_active', 'updated_at'])
                    
                    logger.info(f"[Signal][Task:{task.id}] Step → {task.current_step}")

                    # Log Activity
                    Activity.objects.create(
                        type='update',
                        notes=f"Workflow advanced from {old_step} to {new_step}.",
                        object_id=instance.id,
                        content_type=ContentType.objects.get_for_model(instance),
                    )
                
        except Exception as e:
            logger.error(f"Failed to update single lead task: {e}")
