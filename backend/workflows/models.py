"""
Workflow Models — Production Grade
====================================
Supports:
  - Multiple trigger events (create / update / delete / stage_changed)
  - AND / OR condition logic
  - Multiple action types with smart assignment strategies
  - Delayed (async) task creation via Celery
"""

from django.db import models
from django.conf import settings


# ---------------------------------------------------------------------------
# Workflow
# ---------------------------------------------------------------------------
class Workflow(models.Model):
    MODULE_CHOICES = [
        ('lead', 'Lead'),
        ('deal', 'Deal'),
        ('task', 'Task'),
        ('contact', 'Contact'),
        ('project', 'Project'),
        ('quote', 'Quote'),
        ('invoice', 'Invoice'),
        ('case', 'Support Case'),
    ]

    TRIGGER_CHOICES = [
        ('create', 'On Create'),
        ('update', 'On Update'),
        ('delete', 'On Delete'),
        ('stage_changed', 'On Stage Changed'),   # Deal-specific
        ('status_changed', 'On Status Changed'),  # Lead-specific
    ]

    CONDITION_LOGIC_CHOICES = [
        ('AND', 'All conditions must match (AND)'),
        ('OR',  'Any condition must match (OR)'),
    ]

    name             = models.CharField(max_length=255)
    description      = models.TextField(blank=True, default='')
    module           = models.CharField(max_length=50, choices=MODULE_CHOICES)
    trigger_event    = models.CharField(max_length=50, choices=TRIGGER_CHOICES)
    condition_logic  = models.CharField(
        max_length=3,
        choices=CONDITION_LOGIC_CHOICES,
        default='AND',
        help_text="How multiple conditions are combined."
    )
    is_active        = models.BooleanField(default=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} [{self.module}:{self.trigger_event}]"


# ---------------------------------------------------------------------------
# WorkflowCondition
# ---------------------------------------------------------------------------
class WorkflowCondition(models.Model):
    OPERATOR_CHOICES = [
        ('equals',      'Equals (=)'),
        ('not_equals',  'Not Equals (!=)'),
        ('contains',    'Contains'),
        ('not_contains','Does Not Contain'),
        ('gt',          'Greater Than (>)'),
        ('gte',         'Greater Than or Equal (>=)'),
        ('lt',          'Less Than (<)'),
        ('lte',         'Less Than or Equal (<=)'),
        ('starts_with', 'Starts With'),
        ('ends_with',   'Ends With'),
        ('is_empty',    'Is Empty'),
        ('is_not_empty','Is Not Empty'),
    ]

    workflow   = models.ForeignKey(Workflow, related_name='conditions', on_delete=models.CASCADE)
    field_name = models.CharField(
        max_length=255,
        help_text="Dot-notation field path, e.g. 'status', 'value', 'contact.company'"
    )
    operator   = models.CharField(max_length=50, choices=OPERATOR_CHOICES, default='equals')
    value      = models.CharField(max_length=512, blank=True, default='')
    order      = models.PositiveIntegerField(default=0, help_text="Evaluation order (lower = first)")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.field_name} {self.operator} '{self.value}'"


# ---------------------------------------------------------------------------
# WorkflowAction
# ---------------------------------------------------------------------------
class WorkflowAction(models.Model):
    ACTION_TYPE_CHOICES = [
        ('create_task',        'Create Task'),
        ('assign_user',        'Assign User'),
        ('send_email',         'Send Email'),
        ('update_field',       'Update Field'),
        ('create_project',     'Create Project'),
        ('send_notification',  'Send Notification'),
        ('create_quote',       'Create Quote'),
        ('generate_invoice',   'Generate Invoice'),
    ]

    ASSIGNMENT_TYPE_CHOICES = [
        ('owner',        'Record Owner / Assigned To'),
        ('round_robin',  'Round Robin (distribute equally)'),
        ('manager',      'Team Manager'),
        ('specific_user','Specific User'),
    ]

    PRIORITY_CHOICES = [
        ('low',      'Low'),
        ('medium',   'Medium'),
        ('high',     'High'),
        ('urgent',   'Urgent'),
    ]

    workflow        = models.ForeignKey(Workflow, related_name='actions', on_delete=models.CASCADE)
    action_type     = models.CharField(max_length=50, choices=ACTION_TYPE_CHOICES)
    order           = models.PositiveIntegerField(default=0, help_text="Execution order (lower = first)")

    # ── Task creation fields ───────────────────────────────────────────────
    assignment_type = models.CharField(
        max_length=30,
        choices=ASSIGNMENT_TYPE_CHOICES,
        default='owner',
        help_text="How to assign the created task."
    )
    specific_user   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='workflow_actions',
        help_text="Used when assignment_type='specific_user'."
    )
    delay_days      = models.PositiveIntegerField(
        default=0,
        help_text="0 = immediate. N > 0 = schedule via Celery after N days."
    )
    priority        = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
    )

    # ── Generic action data (used for send_email, update_field, etc.) ─────
    action_data     = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "For create_task: {title, description, due_days_override}. "
            "For send_email: {to_field, subject, body}. "
            "For update_field: {field, value}."
        )
    )

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"[{self.workflow.name}] {self.action_type} ({self.assignment_type})"


# ---------------------------------------------------------------------------
# WorkflowLog — one row per workflow execution
# ---------------------------------------------------------------------------
class WorkflowLog(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('partial', 'Partial (some actions failed)'),
        ('failure', 'Failure'),
        ('skipped', 'Skipped (conditions not met)'),
    ]

    workflow      = models.ForeignKey(Workflow, related_name='logs', on_delete=models.CASCADE)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES)
    executed_at   = models.DateTimeField(auto_now_add=True)
    trigger_event = models.CharField(max_length=50, blank=True, default='')
    object_id     = models.CharField(max_length=50, blank=True, default='')
    message       = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-executed_at']

    def __str__(self):
        return f"{self.workflow.name} — {self.status} @ {self.executed_at:%Y-%m-%d %H:%M}"


# ---------------------------------------------------------------------------
# RoundRobinState — tracks the round-robin pointer per workflow action
# ---------------------------------------------------------------------------
class RoundRobinState(models.Model):
    """
    Persists which sales rep should receive the NEXT round-robin task.
    One row per workflow action with assignment_type='round_robin'.
    """
    action       = models.OneToOneField(
        WorkflowAction,
        on_delete=models.CASCADE,
        related_name='round_robin_state'
    )
    last_user_id = models.IntegerField(
        null=True, blank=True,
        help_text="PK of the last user who was assigned a task via round-robin."
    )
    updated_at   = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"RoundRobin state for action {self.action_id}"
