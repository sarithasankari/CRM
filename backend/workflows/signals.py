"""
Workflow Signal Integration — Production Grade
===============================================
Connects Django model lifecycle events to the Workflow Engine.

Handled events:
  - post_save  → triggers 'create' or 'update' workflows
  - pre_save   → detects deal stage changes and lead status changes
                 before the save, so we can pass old values to the engine
  - pre_delete → triggers 'delete' workflows

Stage/status change detection:
  Deal.stage    → triggers 'stage_changed' if stage is different
  Lead.status   → triggers 'status_changed' if status is different

Implementation notes:
  - We use a thread-local store to pass pre_save snapshots to post_save,
    avoiding a second DB query per save.
  - All exceptions are caught so a broken workflow NEVER crashes the request.
"""

import threading
import logging

from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver

from .engine import trigger_workflows
from .auto_pilot import execute_auto_call, execute_auto_meeting

logger = logging.getLogger(__name__)

# Thread-local storage for pre-save snapshots
_pre_save_state = threading.local()

# Models to watch (lowercase model names matching workflow module choices)
WATCHED_APPS = {'leads', 'deals', 'tasks', 'contacts', 'projects', 'quotes', 'invoices', 'support'}


# ===========================================================================
# PRE-SAVE — capture old values before the DB write
# ===========================================================================
@receiver(pre_save)
def capture_pre_save_state(sender, instance, **kwargs):
    """
    Before saving, record the current (old) values of change-tracked fields.
    These are stored per-thread so post_save can compare new vs old.
    """
    app_label = sender._meta.app_label
    if app_label not in WATCHED_APPS:
        return

    model_name = sender._meta.model_name

    # Only track existing records (pk set = already in DB)
    if not instance.pk:
        return

    snapshot = {}

    try:
        # ── Deal: track stage changes ──────────────────────────────────────
        if model_name == 'deal':
            try:
                old = sender.objects.only('stage').get(pk=instance.pk)
                snapshot['old_stage'] = old.stage
            except sender.DoesNotExist:
                pass

        # ── Lead: track status changes ─────────────────────────────────────
        elif model_name == 'lead':
            try:
                old = sender.objects.only('status').get(pk=instance.pk)
                snapshot['old_status'] = old.status
            except sender.DoesNotExist:
                pass

    except Exception as exc:
        logger.warning(
            "[Signals] pre_save snapshot error for %s id=%s: %s",
            model_name, instance.pk, exc
        )

    if snapshot:
        key = _make_key(model_name, instance.pk)
        setattr(_pre_save_state, key, snapshot)


# ===========================================================================
# POST-SAVE — trigger create / update / stage_changed / status_changed
# ===========================================================================
@receiver(post_save)
def handle_post_save(sender, instance, created, **kwargs):
    app_label = sender._meta.app_label
    if app_label not in WATCHED_APPS:
        return

    model_name = sender._meta.model_name

    try:
        # Retrieve pre-save snapshot (may be empty for new records)
        key      = _make_key(model_name, instance.pk)
        snapshot = getattr(_pre_save_state, key, {})
        _clear_snapshot(key)

        if created:
            # ── New record ─────────────────────────────────────────────────
            trigger_workflows(model_name, 'create', instance)

            if model_name == 'lead':
                # AutoPilot: Lead Created -> Auto Task
                from tasks.models import Task
                from django.utils import timezone
                from datetime import timedelta
                
                # Idempotency / Deduplication: Avoid duplicate tasks within 5 mins
                recent_duplicate = Task.objects.filter(
                    lead=instance,
                    title="Call Lead (Auto Scheduled)",
                    created_at__gte=timezone.now() - timedelta(minutes=5)
                ).exists()

                if not recent_duplicate:
                    Task.objects.create(
                        title="Call Lead (Auto Scheduled)",
                        description="[AutoPilot] Initial contact task.",
                        priority="high",
                        due_date=timezone.now() + timedelta(hours=1),
                        assigned_to=instance.assigned_to,
                        source_object_id=str(instance.pk),
                        lead=instance
                    )

            elif model_name == 'task' and '(Auto Scheduled)' in instance.title:
                # Dispatch AutoPilot handlers based on task title
                if 'Call' in instance.title:
                    execute_auto_call.apply_async(args=[instance.id], countdown=10) # Run shortly
                elif 'Meeting' in instance.title:
                    execute_auto_meeting.apply_async(args=[instance.id], countdown=10)


        else:
            # ── Updated record ─────────────────────────────────────────────
            trigger_workflows(model_name, 'update', instance)

            # ── Deal stage change ──────────────────────────────────────────
            if model_name == 'deal' and 'old_stage' in snapshot:
                old_stage = snapshot['old_stage']
                new_stage = instance.stage
                if old_stage != new_stage:
                    logger.info(
                        "[Signals] Deal id=%s stage changed: %s → %s",
                        instance.pk, old_stage, new_stage
                    )
                    trigger_workflows(
                        'deal', 'stage_changed', instance,
                        extra_context={
                            'old_stage': old_stage,
                            'new_stage': new_stage,
                        }
                    )

            # ── Lead status change ─────────────────────────────────────────
            if model_name == 'lead' and 'old_status' in snapshot:
                old_status = snapshot['old_status']
                new_status = instance.status
                if old_status != new_status:
                    logger.info(
                        "[Signals] Lead id=%s status changed: %s → %s",
                        instance.pk, old_status, new_status
                    )
                    trigger_workflows(
                        'lead', 'status_changed', instance,
                        extra_context={
                            'old_status': old_status,
                            'new_status': new_status,
                        }
                    )

    except Exception as exc:
        logger.error(
            "[Signals] post_save handler error for %s id=%s: %s",
            model_name, getattr(instance, 'pk', '?'), exc, exc_info=True
        )


# ===========================================================================
# PRE-DELETE — trigger delete workflows
# ===========================================================================
@receiver(pre_delete)
def handle_pre_delete(sender, instance, **kwargs):
    app_label = sender._meta.app_label
    if app_label not in WATCHED_APPS:
        return

    model_name = sender._meta.model_name
    try:
        trigger_workflows(model_name, 'delete', instance)
    except Exception as exc:
        logger.error(
            "[Signals] pre_delete handler error for %s id=%s: %s",
            model_name, getattr(instance, 'pk', '?'), exc, exc_info=True
        )


# ===========================================================================
# HELPERS
# ===========================================================================
def _make_key(model_name: str, pk) -> str:
    return f"_wf_{model_name}_{pk}"


def _clear_snapshot(key: str) -> None:
    try:
        delattr(_pre_save_state, key)
    except AttributeError:
        pass
