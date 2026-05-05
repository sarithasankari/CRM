from django.db import models
from django.conf import settings
from leads.models import Lead

class Task(models.Model):
    """
    SINGLE MASTER TASK: Replaces separate Call and Meeting tables.
    """
    TYPE_CHOICES = (
        ('call', 'Call 📞'),
        ('meeting', 'Meeting 🧑💼'),
        ('follow_up', 'Follow-Up'),
        ('proposal', 'Proposal'),
        ('todo', 'To-Do'),
        ('email', 'Email'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),          # backend-generated initial state
        ('not_started', 'Not Started'),   # frontend default
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )

    OUTCOME_CHOICES = (
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('no_response', 'No Response'),
        ('interested', 'Interested'),
        ('not_interested', 'Not Interested'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="tasks", null=True, blank=True)
    contact = models.ForeignKey('contacts.Contact', on_delete=models.CASCADE, related_name="tasks", null=True, blank=True)
    account = models.ForeignKey('contacts.Account', on_delete=models.CASCADE, related_name="tasks", null=True, blank=True)
    deal = models.ForeignKey('deals.Deal', on_delete=models.CASCADE, related_name="tasks", null=True, blank=True)
    
    task_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='todo')
    title = models.CharField(max_length=255)
    current_step = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    is_active = models.BooleanField(default=True)
    
    # Polymorphic fields for Call/Meeting data
    call_duration = models.IntegerField(null=True, blank=True, help_text="Duration in seconds (if Call)")
    call_outcome = models.CharField(max_length=50, null=True, blank=True)
    meeting_start = models.DateTimeField(null=True, blank=True)
    meeting_end = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    outcome = models.CharField(max_length=50, choices=OUTCOME_CHOICES, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True, null=True)

    # Legacy fields to prevent complete breakage
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    source_object_id = models.CharField(max_length=100, blank=True, null=True)
    next_action = models.CharField(max_length=255, blank=True, null=True)
    steps = models.JSONField(default=dict, blank=True, null=True)

    def __str__(self):
        return self.title

class ActivityLog(models.Model):
    ACTION_CHOICES = (
        ('status_change', 'Status Change'),
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('completed', 'Completed'),
        ('outcome_change', 'Outcome Change'),
    )
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="activity_logs")
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    old_value = models.JSONField(default=dict, blank=True, null=True)
    new_value = models.JSONField(default=dict, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.action_type} for Task {self.task.id}"
