from celery import shared_task
import logging
from utils.email_service import send_crm_email

logger = logging.getLogger(__name__)

@shared_task
def test_task():
    logger.info("Celery test_task executed successfully!")
    return "Done"

@shared_task
def async_send_email(subject, message, to_email):
    return send_crm_email(subject, message, to_email)

@shared_task
def execute_scheduled_action(action_id, instance_id, model_name):
    from workflows.models import WorkflowAction
    from django.apps import apps
    from workflows.engine import ACTION_HANDLERS, WorkflowLog
    
    try:
        action = WorkflowAction.objects.get(id=action_id)
        model_class = apps.get_model(app_label=action.workflow.module, model_name=model_name)
        instance = model_class.objects.get(id=instance_id)
        
        handler = ACTION_HANDLERS.get(action.action_type)
        if handler:
            success, message = handler(action, instance)
            WorkflowLog.objects.create(
                workflow=action.workflow,
                status='success' if success else 'failure',
                message=f"Scheduled Action '{action.action_type}': {message}"
            )
    except Exception as e:
        logger.error(f"Failed scheduled action execution: {str(e)}")

@shared_task
def async_import_leads_csv(file_path, duplicate_strategy, user_id):
    from utils.csv_service import process_lead_csv
    import os
    result = process_lead_csv(file_path, duplicate_strategy, user_id)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except:
            pass
    return result

@shared_task
def sync_google_calendar(activity_id, action='create'):
    from activities.models import Activity
    from utils.google_calendar import get_google_service, format_event_data
    
    try:
        activity = Activity.objects.get(id=activity_id)
    except Activity.DoesNotExist:
        return
        
    if not activity.created_by or activity.type != 'meeting' or not activity.scheduled_at:
        return
        
    service = get_google_service(activity.created_by)
    if not service:
        return
        
    if action == 'create' or action == 'update':
        event_data = format_event_data(activity)
        
        if action == 'create' or not activity.google_event_id:
            event = service.events().insert(calendarId='primary', body=event_data).execute()
            Activity.objects.filter(id=activity_id).update(google_event_id=event.get('id'))
        else:
            try:
                service.events().update(calendarId='primary', eventId=activity.google_event_id, body=event_data).execute()
            except Exception:
                # If event deleted on Google side, recreate it
                event = service.events().insert(calendarId='primary', body=event_data).execute()
                Activity.objects.filter(id=activity_id).update(google_event_id=event.get('id'))
                
@shared_task
def delete_google_event(event_id, user_id):
    from django.contrib.auth import get_user_model
    from utils.google_calendar import get_google_service
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        service = get_google_service(user)
        if service:
            service.events().delete(calendarId='primary', eventId=event_id).execute()
    except Exception:
        pass
