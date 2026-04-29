from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.apps import apps
from .engine import trigger_workflows

# Listen to all models in our core apps
CORE_APPS = ['leads', 'deals', 'tasks', 'contacts', 'projects', 'quotes', 'invoices', 'support']

@receiver(post_save)
def handle_post_save(sender, instance, created, **kwargs):
    app_label = sender._meta.app_label
    if app_label in CORE_APPS:
        module_name = sender._meta.model_name
        trigger_event = 'create' if created else 'update'
        trigger_workflows(module_name, trigger_event, instance)

@receiver(pre_delete)
def handle_pre_delete(sender, instance, **kwargs):
    app_label = sender._meta.app_label
    if app_label in CORE_APPS:
        module_name = sender._meta.model_name
        trigger_workflows(module_name, 'delete', instance)
