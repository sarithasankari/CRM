from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings

class Activity(models.Model):
    TYPE_CHOICES = (
        ('call', 'Call'),
        ('meeting', 'Meeting'),
        ('email', 'Email'),
        ('note', 'Note'),
    )
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='note')
    title = models.CharField(max_length=255, blank=True)
    notes = models.TextField()
    scheduled_at = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    google_event_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Generic relation (optional for standalone activities like general meetings)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_to = GenericForeignKey('content_type', 'object_id')
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} on {self.related_to}"

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from workflows.tasks import sync_google_calendar, delete_google_event

@receiver(post_save, sender=Activity)
def sync_activity_to_google(sender, instance, created, **kwargs):
    if instance.type == 'meeting' and instance.scheduled_at and instance.created_by:
        action = 'create' if created else 'update'
        sync_google_calendar.delay(instance.id, action)

@receiver(pre_delete, sender=Activity)
def delete_activity_from_google(sender, instance, **kwargs):
    if instance.type == 'meeting' and instance.google_event_id and instance.created_by:
        delete_google_event.delay(instance.google_event_id, instance.created_by.id)
