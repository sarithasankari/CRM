import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import F
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


def broadcast_marketing_update(event_type, data):
    """Utility to broadcast marketing events to all connected clients."""
    channel_layer = get_channel_layer()
    if channel_layer:
        try:
            async_to_sync(channel_layer.group_send)(
                'global_notifications',
                {
                    'type': 'send_notification',
                    'message': {
                        'module': 'marketing',
                        'event': event_type,
                        **data
                    }
                }
            )
        except Exception as e:
            logger.error(f"[MarketingSignals] Broadcast failed: {e}")


@receiver(post_save, sender='leads.Lead')
def on_lead_created_from_campaign(sender, instance, created, **kwargs):
    """
    When a Lead is created with a campaign FK:
    1. Increment campaign.leads_generated counter
    2. Auto-create 'Initial Contact' follow-up task
    3. Log activity
    4. Broadcast websocket event
    """
    if not created:
        return

    from activities.models import Campaign
    from tasks.models import Task
    from activities.models import Activity

    # attribution data for broadcast
    broadcast_data = {
        'lead_id': instance.pk,
        'name': instance.name or "New Lead",
        'source': instance.source,
        'campaign_id': instance.campaign_id,
        'campaign_name': instance.campaign.name if instance.campaign else None
    }

    if instance.campaign_id:
        # 1. Increment leads_generated atomically
        Campaign.objects.filter(pk=instance.campaign_id).update(
            leads_generated=F('leads_generated') + 1
        )
        
        # 2. Auto-create follow-up task
        try:
            Task.objects.get_or_create(
                lead=instance,
                task_type='follow_up',
                is_active=True,
                defaults={
                    'title': f'Initial Contact — {instance.name or instance.email or "New Lead"}',
                    'priority': 'high',
                    'status': 'not_started',
                    'assigned_to': instance.assigned_to,
                    'campaign': instance.campaign,
                    'description': f'Auto-generated from campaign: {instance.campaign.name}.',
                }
            )
        except Exception as e:
            logger.error(f"[Marketing] Task creation failed: {e}")

    # 3. Log activity
    try:
        Activity.objects.create(
            type='note',
            notes=f'Lead created via {instance.source or "direct"}. Linked to campaign: {instance.campaign.name if instance.campaign else "None"}',
            created_by=instance.assigned_to,
        )
    except: pass

    # 4. Broadcast realtime update
    broadcast_marketing_update('lead_captured', broadcast_data)


@receiver(post_save, sender='deals.Deal')
def on_deal_status_change(sender, instance, created, **kwargs):
    """
    When a Deal linked to a campaign is won:
    Update campaign revenue and broadcast.
    """
    if not instance.campaign_id:
        return

    update_fields = kwargs.get('update_fields')
    if update_fields is not None and 'status' not in update_fields:
        return

    if instance.status != 'won':
        return

    from activities.models import Campaign, Activity

    try:
        updated = Campaign.objects.filter(pk=instance.campaign_id).update(
            actual_revenue=F('actual_revenue') + instance.value,
            converted_deals=F('converted_deals') + 1
        )
        if updated:
            broadcast_marketing_update('deal_won', {
                'deal_id': instance.pk,
                'campaign_id': instance.campaign_id,
                'revenue': float(instance.value)
            })
    except Exception as e:
        logger.error(f"[Marketing] Campaign revenue update failed: {e}")


@receiver(post_save, sender='activities.Campaign')
def on_campaign_update(sender, instance, created, **kwargs):
    """Broadcast when a campaign is created or modified to refresh dashboards."""
    broadcast_marketing_update('campaign_updated', {
        'campaign_id': instance.pk,
        'name': instance.name,
        'status': instance.status,
        'is_new': created
    })
