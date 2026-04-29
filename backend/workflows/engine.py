import operator
import logging
from .models import Workflow, WorkflowLog
from django.db.models import QuerySet

logger = logging.getLogger(__name__)

# Action Handlers
def execute_create_task(action, instance):
    from tasks.models import Task
    try:
        data = action.action_data
        Task.objects.create(
            title=data.get('title', f"Auto Task for {instance}"),
            status='Pending',
            due_date=data.get('due_date'),
        )
        return True, "Task created successfully."
    except Exception as e:
        return False, str(e)

def execute_assign_user(action, instance):
    try:
        user_id = action.action_data.get('user_id')
        if hasattr(instance, 'assigned_to_id'):
            instance.assigned_to_id = user_id
            instance.save()
            return True, f"Assigned user {user_id}."
        return False, "Instance has no assigned_to field."
    except Exception as e:
        return False, str(e)

def execute_send_email(action, instance):
    # Dummy implementation for send email
    email = action.action_data.get('email')
    return True, f"Simulated sending email to {email}."

def execute_update_field(action, instance):
    try:
        field = action.action_data.get('field')
        value = action.action_data.get('value')
        if hasattr(instance, field):
            setattr(instance, field, value)
            instance.save()
            return True, f"Updated field {field} to {value}."
        return False, f"Field {field} not found."
    except Exception as e:
        return False, str(e)

def execute_create_project(action, instance):
    from projects.models import Project
    try:
        data = action.action_data
        Project.objects.create(
            name=data.get('name', f"Project for {instance}"),
            status='Planning',
        )
        return True, "Project created successfully."
    except Exception as e:
        return False, str(e)

def execute_send_notification(action, instance):
    # Dummy implementation for notification
    message = action.action_data.get('message', 'Notification triggered.')
    return True, f"Simulated notification: {message}"

def execute_convert_lead(action, instance):
    from contacts.models import Contact
    from deals.models import Deal
    try:
        # Create Contact
        contact = Contact.objects.create(
            name=instance.name,
            email=instance.email,
            phone=instance.phone,
            company=instance.company,
            linked_lead=instance
        )
        # Create Deal
        Deal.objects.create(
            title=f"{instance.company or instance.name} Deal",
            contact=contact,
            stage='qualified'
        )
        # Archive Lead
        instance.soft_delete()
        return True, "Lead converted to Contact and Deal successfully."
    except Exception as e:
        return False, f"Convert error: {str(e)}"

def execute_create_quote(action, instance):
    from quotes.models import Quote
    try:
        data = action.action_data
        amount = data.get('amount', getattr(instance, 'value', 0.00))
        quote = Quote.objects.create(
            deal=instance,
            quote_number=f"QT-{instance.id}",
            amount=amount,
            status='draft'
        )
        return True, f"Quote {quote.quote_number} created successfully."
    except Exception as e:
        return False, str(e)

def execute_generate_invoice(action, instance):
    from invoices.models import Invoice
    try:
        data = action.action_data
        amount = data.get('amount', getattr(instance, 'amount', 0.00))
        invoice = Invoice.objects.create(
            quote=instance,
            invoice_number=f"INV-{instance.id}",
            amount=amount,
            status='draft'
        )
        return True, f"Invoice {invoice.invoice_number} created successfully."
    except Exception as e:
        return False, str(e)

ACTION_HANDLERS = {
    'create_task': execute_create_task,
    'assign_user': execute_assign_user,
    'send_email': execute_send_email,
    'update_field': execute_update_field,
    'create_project': execute_create_project,
    'send_notification': execute_send_notification,
    'convert_lead': execute_convert_lead,
    'create_quote': execute_create_quote,
    'generate_invoice': execute_generate_invoice,
}

def evaluate_condition(instance, condition):
    try:
        field_val = getattr(instance, condition.field_name, None)
        if field_val is None:
            return False
            
        field_val = str(field_val).lower()
        cond_val = str(condition.value).lower()

        if condition.operator == 'equals':
            return field_val == cond_val
        elif condition.operator == 'not_equals':
            return field_val != cond_val
        elif condition.operator == 'contains':
            return cond_val in field_val
        elif condition.operator == 'gt':
            return float(field_val) > float(cond_val)
        elif condition.operator == 'lt':
            return float(field_val) < float(cond_val)
    except Exception as e:
        logger.error(f"Error evaluating condition: {e}")
    return False

def trigger_workflows(module_name, trigger_event, instance):
    workflows = Workflow.objects.filter(
        module=module_name,
        trigger_event=trigger_event,
        is_active=True
    ).prefetch_related('conditions', 'actions')

    for workflow in workflows:
        # Check all conditions
        conditions_met = True
        for condition in workflow.conditions.all():
            if not evaluate_condition(instance, condition):
                conditions_met = False
                break
        
        if conditions_met:
            for action in workflow.actions.all():
                handler = ACTION_HANDLERS.get(action.action_type)
                if handler:
                    success, message = handler(action, instance)
                    
                    WorkflowLog.objects.create(
                        workflow=workflow,
                        status='success' if success else 'failure',
                        message=f"Action '{action.action_type}': {message}"
                    )
                else:
                    WorkflowLog.objects.create(
                        workflow=workflow,
                        status='failure',
                        message=f"Handler for action '{action.action_type}' not found."
                    )
