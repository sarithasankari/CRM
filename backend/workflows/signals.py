"""
Workflow Signal Handlers — Production Grade
===========================================
Automatically triggers workflows on model save events:

  - on_create: When a new record is created
  - on_update: When a record is updated
  - stage_change: When status/stage field changes (deal, lead, quote, task)
  - on_task_complete: When a task, call, or meeting is marked complete

Usage:
  - Signals are automatically connected via apps.py
  - Tracks field changes to detect stage_change triggers
  - Uses thread-local storage to preserve old values across signal handlers
"""

import logging
import threading

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .engine import trigger_workflows

logger = logging.getLogger(__name__)

# Models watched for workflow triggers
WATCHED_MODELS = {
    ('leads', 'lead'): 'lead',
    ('contacts', 'contact'): 'contact',
    ('contacts', 'account'): 'account',
    ('deals', 'deal'): 'deal',
    ('deals', 'product'): 'product',
    ('tasks', 'task'): 'task',
    ('activities', 'call'): 'call',
    ('activities', 'meeting'): 'meeting',
    ('quotes', 'quote'): 'quote',
    ('invoices', 'invoice'): 'invoice',
    ('projects', 'project'): 'project',
}

# Fields that trigger stage_change workflows
STAGE_FIELDS = {
    'deal': 'stage',
    'lead': 'status',
    'task': 'status',
    'quote': 'status',
    'project': 'status',
}

# Fields that trigger task completion workflows
COMPLETION_STATUSES = {'completed', 'done', 'finished', 'closed'}

# Thread-local storage for previous field values
_state = threading.local()


@receiver(pre_save)
def capture_previous_values(sender, instance, **kwargs):
    """
    Capture previous field values before save.
    Used to detect stage/status changes and other field modifications.
    """
    app_label = sender._meta.app_label
    model_name = sender._meta.model_name
    module = _module_for(sender)
    
    if not module or not instance.pk:
        return

    tracked = {}
    fields_to_track = []
    
    # Add stage/status fields
    stage_field = STAGE_FIELDS.get(model_name)
    if stage_field:
        fields_to_track.append(stage_field)
    
    # Add other important fields for tracking
    if model_name == 'lead':
        fields_to_track.extend(['status', 'score', 'assigned_to_id'])
    if model_name == 'deal':
        fields_to_track.extend(['stage', 'value', 'owner_id'])
    if model_name == 'task':
        fields_to_track.extend(['status', 'priority', 'assigned_to_id'])
    if model_name == 'quote':
        fields_to_track.extend(['status', 'amount', 'valid_until'])
    if model_name == 'contact':
        fields_to_track.extend(['status', 'owner_id'])
    
    if not fields_to_track:
        return

    try:
        old = sender.objects.only(*fields_to_track).get(pk=instance.pk)
        for field in fields_to_track:
            old_val = getattr(old, field, None)
            new_val = getattr(instance, field, None)
            tracked[f'old_{field}'] = old_val
            tracked[f'new_{field}'] = new_val
    except sender.DoesNotExist:
        return

    if tracked:
        setattr(_state, _state_key(sender, instance.pk), tracked)


@receiver(post_save)
def emit_workflow_events(sender, instance, created, **kwargs):
    """
    Emit workflow trigger events after save.
    Handles on_create, on_update, stage_change, and on_task_complete triggers.
    """
    module = _module_for(sender)
    if not module:
        return

    key = _state_key(sender, instance.pk)
    previous = getattr(_state, key, {})
    if hasattr(_state, key):
        delattr(_state, key)

    try:
        # Trigger on_create event
        if created:
            trigger_workflows(module, 'on_create', instance)
            return

        # Trigger on_update event (always fired on updates)
        trigger_workflows(module, 'on_update', instance, previous)

        # Trigger stage_change when relevant field changes
        stage_field = STAGE_FIELDS.get(module)
        if stage_field:
            old_val = previous.get(f'old_{stage_field}')
            new_val = previous.get(f'new_{stage_field}')
            if old_val != new_val:
                trigger_workflows(
                    module,
                    'stage_change',
                    instance,
                    {
                        'field': stage_field,
                        'old_value': old_val,
                        'new_value': new_val,
                    },
                )

        # Trigger on_task_complete when task/call/meeting is completed
        if module in {'task', 'call', 'meeting'}:
            status_field = STAGE_FIELDS.get(module, 'status')
            old_status = previous.get(f'old_{status_field}', '')
            new_status = previous.get(f'new_{status_field}', '')
            
            if old_status not in COMPLETION_STATUSES and new_status in COMPLETION_STATUSES:
                trigger_workflows(module, 'on_task_complete', instance, previous)
                
                # Chain to next workflow (task-driven automation)
                _trigger_dependent_workflows(instance, previous)

    except Exception as exc:
        logger.error(
            "[WorkflowSignals] failed for module=%s instance_id=%s: %s",
            module,
            instance.pk,
            exc,
            exc_info=True
        )


def _trigger_dependent_workflows(instance, previous):
    """
    Trigger dependent workflows based on task completion.
    For example: When "Initial Call" task completes → create "Follow-up Call" task.
    """
    from tasks.models import Task
    
    if not isinstance(instance, Task):
        return
    
    # Get the linked record (lead, contact, deal, etc.)
    linked_record = None
    if instance.lead:
        linked_record = instance.lead
        linked_module = 'lead'
    elif instance.deal:
        linked_record = instance.deal
        linked_module = 'deal'
    elif instance.contact:
        linked_record = instance.contact
        linked_module = 'contact'
    else:
        return
    
    if linked_record:
        # Trigger workflows on the linked record with on_task_complete trigger
        trigger_workflows(
            linked_module,
            'on_task_complete',
            linked_record,
            {
                'task_id': instance.pk,
                'task_type': instance.task_type,
                'task_status': instance.status,
            }
        )


def _module_for(sender):
    """Map model to module name for workflow triggers."""
    return WATCHED_MODELS.get((sender._meta.app_label, sender._meta.model_name))


def _state_key(sender, pk):
    """Generate a unique key for thread-local storage."""
    return f"{sender._meta.label_lower}:{pk}"
