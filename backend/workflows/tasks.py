from celery import shared_task
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_workflow_email(to_email, subject, body):
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=None,  # Uses DEFAULT_FROM_EMAIL
            recipient_list=[to_email],
            fail_silently=False,
        )
        logger.info(f"Successfully sent email to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False
