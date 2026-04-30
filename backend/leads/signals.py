from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Lead
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Lead)
def log_lead_save(sender, instance, created, **kwargs):
    # Signals should only be used for pure side-effects (logging, analytics events, etc.)
    # Core business logic (like conversion) has been moved to LeadViewSet.convert()
    if created:
        logger.info(f"New Lead created: {instance.name} ({instance.email})")
    else:
        logger.info(f"Lead updated: {instance.name} (Status: {instance.status})")
