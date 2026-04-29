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
    notes = models.TextField()
    
    # Generic relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    related_to = GenericForeignKey('content_type', 'object_id')
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} on {self.related_to}"
