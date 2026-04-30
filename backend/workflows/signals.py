from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.apps import apps
from .engine import trigger_workflows
from .models import AuditLog

# Listen to all models in our core apps
CORE_APPS = ['leads', 'deals', 'tasks', 'contacts', 'projects', 'quotes', 'invoices', 'support']

_old_state = {}

@receiver(pre_save)
def handle_pre_save(sender, instance, **kwargs):
    app_label = sender._meta.app_label
    if app_label in CORE_APPS:
        if instance.pk:
            try:
                old_instance = sender.objects.get(pk=instance.pk)
                _old_state[f"{sender.__name__}_{instance.pk}"] = {
                    f.name: str(getattr(old_instance, f.name, ''))
                    for f in sender._meta.fields
                }
            except sender.DoesNotExist:
                pass

@receiver(post_save)
def handle_post_save(sender, instance, created, **kwargs):
    app_label = sender._meta.app_label
    if app_label in CORE_APPS:
        module_name = sender._meta.model_name
        trigger_event = 'create' if created else 'update'
        
        # --- Audit Logging Logic ---
        if created:
            AuditLog.objects.create(
                action='CREATE',
                model_name=sender.__name__,
                object_id=str(instance.pk),
                changes={'action': 'created'}
            )
        else:
            key = f"{sender.__name__}_{instance.pk}"
            old_dict = _old_state.pop(key, {})
            new_dict = {f.name: str(getattr(instance, f.name, '')) for f in sender._meta.fields}
            
            diff = {k: {'old': old_dict.get(k), 'new': v} for k, v in new_dict.items() if old_dict.get(k) != v}
            
            filtered_diff = {k: v for k, v in diff.items() if k not in ['updated_at', 'modified_at']}
            
            if filtered_diff:
                AuditLog.objects.create(
                    action='UPDATE',
                    model_name=sender.__name__,
                    object_id=str(instance.pk),
                    changes=filtered_diff
                )
        
        trigger_workflows(module_name, trigger_event, instance)

@receiver(pre_delete)
def handle_pre_delete(sender, instance, **kwargs):
    app_label = sender._meta.app_label
    if app_label in CORE_APPS:
        module_name = sender._meta.model_name
        
        AuditLog.objects.create(
            action='DELETE',
            model_name=sender.__name__,
            object_id=str(instance.pk),
            changes={'action': 'deleted'}
        )
        
        trigger_workflows(module_name, 'delete', instance)
