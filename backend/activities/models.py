from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings

class Activity(models.Model):
    TYPE_CHOICES = (
        ('created', 'Created'),
        ('update', 'Update'),
        ('completed', 'Completed'),
        ('call', 'Call'),
        ('meeting', 'Meeting'),
        ('email', 'Email'),
        ('note', 'Note'),
        ('reminder', 'Reminder'),
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
    MEETING_STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
    )
    title = models.CharField(max_length=255)
    # Generic relation to Lead/Contact/Deal
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_to = GenericForeignKey('content_type', 'object_id')

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='meetings')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=MEETING_STATUS_CHOICES, default='scheduled')
    meeting_type = models.CharField(max_length=50)  # e.g. "Video Call"
    notes = models.TextField(blank=True, null=True)
    
    # Traceability
    created_from_task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_meetings')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Call(models.Model):
    DIRECTION_CHOICES = (
        ('inbound', 'Inbound'),
        ('outbound', 'Outbound'),
    )
    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )
    OUTCOME_CHOICES = (
        ('connected', 'Connected'),
        ('no_response', 'No Response'),
        ('not_interested', 'Not Interested'),
        ('pending', 'Pending'),
    )
    
    # Generic relation (Optional link to Lead/Contact)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_to = GenericForeignKey('content_type', 'object_id')

    phone_number = models.CharField(max_length=20, blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='calls')
    direction = models.CharField(max_length=20, choices=DIRECTION_CHOICES, default='outbound')
    call_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    outcome = models.CharField(max_length=30, choices=OUTCOME_CHOICES, default='pending')
    
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(default=0, help_text="Duration in seconds")
    
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_direction_display()} Call - {self.get_outcome_display()}"


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
