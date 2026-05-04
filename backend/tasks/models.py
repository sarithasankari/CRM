from django.db import models
from django.conf import settings


class Task(models.Model):
    STATUS_CHOICES = (
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed',   'Completed'),
    )

    PRIORITY_CHOICES = (
        ('low',    'Low'),
        ('medium', 'Medium'),
        ('high',   'High'),
        ('urgent', 'Urgent'),
    )

    TASK_TYPE_CHOICES = (
        ('general', 'General'),
        ('call', 'Call'),
        ('email', 'Email'),
        ('meeting', 'Meeting'),
    )

    title        = models.CharField(max_length=255)
    task_type    = models.CharField(max_length=20, choices=TASK_TYPE_CHOICES, default='general')
    description  = models.TextField(blank=True, null=True)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    priority     = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    due_date     = models.DateTimeField(null=True, blank=True)
    is_active    = models.BooleanField(default=True)
    update_count = models.IntegerField(default=0)
    
    current_step = models.CharField(max_length=50, default='Initial Call')
    steps        = models.JSONField(default=dict, blank=True)
    next_action  = models.CharField(max_length=255, blank=True, null=True)
    
    lead = models.ForeignKey(
        'leads.Lead',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='tasks'
    )
    deal = models.ForeignKey(
        'deals.Deal',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='tasks'
    )
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

    source = models.CharField(max_length=50, default='Manual', help_text="Manual / Automation")
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', '-priority']
        indexes = [
            models.Index(fields=['lead', 'title', 'task_type', 'is_active']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['lead'],
                condition=~models.Q(status='completed') & models.Q(lead__isnull=False),
                name='unique_active_task_per_lead'
            )
        ]

    def __str__(self):
        return self.title
