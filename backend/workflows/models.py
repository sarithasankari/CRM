from django.db import models

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
    ]

    name = models.CharField(max_length=255)
    module = models.CharField(max_length=50, choices=MODULE_CHOICES)
    trigger_event = models.CharField(max_length=50, choices=TRIGGER_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.module} - {self.trigger_event})"

class WorkflowCondition(models.Model):
    OPERATOR_CHOICES = [
        ('equals', 'Equals (=)'),
        ('not_equals', 'Not Equals (!=)'),
        ('contains', 'Contains'),
        ('gt', 'Greater Than (>)'),
        ('lt', 'Less Than (<)'),
    ]

    workflow = models.ForeignKey(Workflow, related_name='conditions', on_delete=models.CASCADE)
    field_name = models.CharField(max_length=255)
    operator = models.CharField(max_length=50, choices=OPERATOR_CHOICES)
    value = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.field_name} {self.operator} {self.value}"

class WorkflowAction(models.Model):
    ACTION_TYPE_CHOICES = [
        ('assign_user', 'Assign User'),
        ('create_task', 'Create Task'),
        ('send_email', 'Send Email'),
        ('update_field', 'Update Field'),
        ('create_project', 'Create Project'),
        ('send_notification', 'Send Notification'),
        ('create_quote', 'Create Quote'),
        ('generate_invoice', 'Generate Invoice'),
    ]

    workflow = models.ForeignKey(Workflow, related_name='actions', on_delete=models.CASCADE)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPE_CHOICES)
    action_data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.action_type}"

class WorkflowLog(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failure', 'Failure'),
    ]

    workflow = models.ForeignKey(Workflow, related_name='logs', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    executed_at = models.DateTimeField(auto_now_add=True)
    message = models.TextField(blank=True)

    def __str__(self):
        return f"{self.workflow.name} - {self.status} at {self.executed_at}"
