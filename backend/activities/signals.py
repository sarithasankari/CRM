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
from .models import AuditLog, Meeting

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
def handle_post_save(sender, instance, created, **kwargs):
    log_and_broadcast(sender, instance, created, **kwargs)

@receiver(post_delete, sender=Lead)
@receiver(post_delete, sender=Deal)
@receiver(post_delete, sender=Contact)
@receiver(post_delete, sender=Task)
@receiver(post_delete, sender=Meeting)
def handle_post_delete(sender, instance, **kwargs):
    model_name = sender.__name__
    title = getattr(instance, 'title', getattr(instance, 'name', str(instance)))
    
    broadcast_update({
        'action': 'delete',
        'model': model_name,
        'id': instance.pk,
        'title': f"{model_name} deleted: {title}"
    })
