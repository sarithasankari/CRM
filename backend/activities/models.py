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
    
    # Generic relation (optional - allows standalone activities like email logs)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_to = GenericForeignKey('content_type', 'object_id')
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} on {self.related_to}"


class Meeting(models.Model):
    title = models.CharField(max_length=255)
    date = models.CharField(max_length=100) # Storing as string to match UI (e.g. "Oct 25, 2023" or YYYY-MM-DD)
    time = models.CharField(max_length=100) # e.g. "10:00 AM - 11:00 AM"
    type = models.CharField(max_length=50)  # e.g. "Video Call"
    participants = models.JSONField(default=list)
    notes = models.TextField(blank=True, null=True)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Call(models.Model):
    TYPE_CHOICES = (
        ('outbound', 'Outbound'),
        ('inbound', 'Inbound'),
        ('scheduled', 'Scheduled'),
    )
    OUTCOME_CHOICES = (
        ('connected', 'Connected'),
        ('voicemail', 'Voicemail'),
        ('interested', 'Interested'),
        ('not_interested', 'Not Interested'),
        ('follow_up', 'Follow-up Required'),
        ('pending', 'Pending'),
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='outbound')
    contact_name = models.CharField(max_length=255)
    company = models.CharField(max_length=255, blank=True, null=True)
    duration = models.CharField(max_length=20, blank=True, null=True)
    outcome = models.CharField(max_length=30, choices=OUTCOME_CHOICES, default='connected')
    notes = models.TextField(blank=True, null=True)
    call_date = models.DateTimeField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='calls')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()} - {self.contact_name}"


class Campaign(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    )
    TYPE_CHOICES = (
        ('email', 'Email'),
        ('social', 'Social Media'),
        ('sms', 'SMS'),
        ('event', 'Event'),
    )
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='email')
    target_audience = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    sent = models.IntegerField(default=0)
    opened = models.FloatField(default=0.0)  # percentage
    clicked = models.FloatField(default=0.0)  # percentage
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='campaigns')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50) # create, update, delete
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    changes = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} {self.action} {self.model_name} {self.object_id}"
