from django.db import models
from django.conf import settings


class Task(models.Model):
    STATUS_CHOICES = (
        ('pending',     'Pending'),
        ('in_progress', 'In Progress'),
        ('completed',   'Completed'),
        ('cancelled',   'Cancelled'),
    )

    PRIORITY_CHOICES = (
        ('low',    'Low'),
        ('medium', 'Medium'),
        ('high',   'High'),
        ('urgent', 'Urgent'),
    )

    title        = models.CharField(max_length=255)
    description  = models.TextField(blank=True, null=True)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority     = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    due_date     = models.DateTimeField(null=True, blank=True)
    assigned_to  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='tasks'
    )

    # Traceability — which workflow auto-created this task (optional)
    source_workflow = models.ForeignKey(
        'workflows.Workflow',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_tasks',
        help_text="Populated when this task was auto-created by a workflow."
    )
    source_object_id = models.CharField(
        max_length=50, blank=True, default='',
        help_text="PK of the triggering record (lead, deal, etc.)."
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', '-priority']

    def __str__(self):
        return self.title
