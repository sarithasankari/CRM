import logging
import random
from datetime import timedelta
from django.utils import timezone
from django.db import transaction, IntegrityError
from django.core.cache import cache
from celery import shared_task
from leads.models import Lead
from tasks.models import Task
from activities.models import Call, Meeting
from deals.models import Deal
from contacts.models import Contact

logger = logging.getLogger(__name__)

VALID_TRANSITIONS = {
    "new": ["contacted"],
    "contacted": ["qualified"],
    "qualified": ["proposal"],
    "proposal": ["won", "lost"]
}

STATUS_TO_STEP = {
    "new": "Initial Call",
    "contacted": "Follow-up Call",
    "qualified": "Send Proposal",
    "proposal": "Negotiation",
    "won": "Closed Won",
    "lost": "Closed Lost"
}

def validate_lead_task_consistency(lead):
    """Utility to check if a lead's task matches its status."""
    task = Task.objects.filter(lead=lead).exclude(status='completed').first()
    if not task:
        task = Task.objects.filter(lead=lead).first()
    if not task:
        return False
    expected_step = STATUS_TO_STEP.get(lead.status, 'Initial Call')
    if task.current_step != expected_step:
        return False
    return True

def _get_lead_score(lead):
    # Simulated lead scoring based on company/title presence, or just random
    score = 50
    if lead.company:
        score += 20
    if lead.email and "gmail" not in lead.email.lower():
        score += 20
    if lead.phone:
        score += 10
    return score

@shared_task(bind=True, name='workflows.execute_auto_call', max_retries=3, default_retry_delay=30)
def execute_auto_call(self, lead_id):
    """
    Simulates making a call and logging it automatically.
    AutoPilot strictly updates Lead.status inside a locked transaction.
    Task progression is handled via django signals based on lead status change.
    """
    try:
        lead_stub = Lead.objects.filter(id=lead_id).first()
        if not lead_stub:
            logger.warning(f"[AutoPilot] Lead {lead_id} not found.")
            return

        if lead_stub.status in ['won', 'lost']:
            logger.info(f"[AutoPilot] Lead {lead_stub.id} is in terminal state ({lead_stub.status}). Skipping auto call.")
            return

        score = _get_lead_score(lead_stub)
        
        # Decide outcome
        if score >= 70:
            outcome = 'interested'
            new_status = 'qualified'
        elif score >= 40:
            outcome = 'no_answer'
            new_status = 'contacted'
        else:
            outcome = 'not_interested'
            new_status = 'lost'

        # AutoPilot Execution Deduplication (CRITICAL)
        dedupe_key = f"autopilot:{lead_stub.id}:{new_status}"
        if cache.get(dedupe_key):
            logger.info(f"[AutoPilot] Duplicate execution prevented for Lead {lead_stub.id} to {new_status}")
            return
        
        # Double Idempotency Protection (Check before DB lock)
        if lead_stub.status == new_status:
            return

        # Enforce Valid Status Transitions (Check before DB lock)
        if new_status not in VALID_TRANSITIONS.get(lead_stub.status, []):
            logger.warning(f"[AutoPilot] Invalid transition blocked: {lead_stub.status} -> {new_status}")
            return

        # Lock dedupe execution
        cache.set(dedupe_key, True, timeout=60)

        duration = random.randint(30, 300) if outcome == 'interested' else random.randint(0, 30)

        Call.objects.create(
            content_type=None,
            object_id=lead_stub.id,
            owner=lead_stub.assigned_to,
            direction='outbound',
            outcome=outcome,
            duration=duration,
            notes=f"[AUTO PILOT] Auto-generated call. Lead score: {score}. System decided outcome: {outcome}."
        )
        
        logger.info(f"[AutoPilot] Executed auto call for Lead {lead_stub.id}. Outcome: {outcome}")

        with transaction.atomic():
            try:
                lead = Lead.objects.select_for_update().get(id=lead_id)
            except Lead.DoesNotExist:
                return

            if lead.status in ['won', 'lost']:
                logger.info(f"[AutoPilot] Lead {lead.id} changed to terminal state concurrently. Skipping update.")
                return

            # Double Idempotency Protection (Check after DB lock)
            if lead.status == new_status:
                logger.info(f"[AutoPilot] Lead {lead.id} already has status {new_status}. Skipping update.")
                return

            # Enforce Valid Status Transitions (Check after DB lock)
            if new_status not in VALID_TRANSITIONS.get(lead.status, []):
                logger.warning(f"[AutoPilot] Invalid transition blocked: {lead.status} -> {new_status}")
                return

            logger.info(f"[AutoPilot][Lead:{lead.id}] {lead.status} → {new_status}")
            lead.status = new_status
            lead.save()
            
        # Optional side effect
        if new_status == 'qualified':
            execute_auto_meeting.apply_async(args=[lead_id], countdown=3600)

    except Exception as e:
        logger.error(f"[AutoPilot Error] Lead:{lead_id} failed execute_auto_call: {str(e)}", exc_info=True)
        raise e


@shared_task(bind=True, name='workflows.execute_auto_meeting', max_retries=3, default_retry_delay=30)
def execute_auto_meeting(self, lead_id):
    """
    Simulates automatically scheduling and completing a meeting.
    """
    try:
        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            return

        if lead.status in ['won', 'lost']:
            return

        start_time = timezone.now() + timedelta(days=1)
        end_time = start_time + timedelta(minutes=30)
        
        meeting = Meeting.objects.create(
            title=f"Demo with {lead.name}",
            object_id=lead.id,
            owner=lead.assigned_to,
            start_time=start_time,
            end_time=end_time,
            status='scheduled',
            meeting_type='Demo',
            notes="[AUTO PILOT] Auto-scheduled meeting."
        )
        
        logger.info(f"[AutoPilot] Executed auto meeting schedule for Lead {lead.id}")
        simulate_meeting_outcome.apply_async(args=[meeting.id], countdown=86400 + 1800)
        
    except Exception as e:
        logger.error(f"[AutoPilot Error] Lead:{lead_id} failed execute_auto_meeting: {str(e)}", exc_info=True)
        raise e


@shared_task(bind=True, name='workflows.simulate_meeting_outcome', max_retries=3, default_retry_delay=30)
def simulate_meeting_outcome(self, meeting_id):
    try:
        meeting = Meeting.objects.get(id=meeting_id)
        lead_stub = Lead.objects.filter(id=meeting.object_id).first()
        if not lead_stub:
            return
            
        if lead_stub.status in ['won', 'lost']:
            return

        score = _get_lead_score(lead_stub)
        if score >= 70:
            meeting.status = 'completed'
            meeting.notes += "\n[AUTO PILOT] Meeting completed successfully. Lead is highly engaged."
            meeting.save(update_fields=['status', 'notes'])
            new_status = 'proposal'
        else:
            meeting.status = 'no_show'
            meeting.notes += "\n[AUTO PILOT] Prospect did not show up."
            meeting.save(update_fields=['status', 'notes'])
            new_status = 'lost'

        dedupe_key = f"autopilot:{lead_stub.id}:{new_status}"
        if cache.get(dedupe_key):
            logger.info(f"[AutoPilot] Duplicate execution prevented for Lead {lead_stub.id} to {new_status}")
            return

        # Double Idempotency Protection (Check before DB lock)
        if lead_stub.status == new_status:
            return

        # Enforce Valid Status Transitions (Check before DB lock)
        if new_status not in VALID_TRANSITIONS.get(lead_stub.status, []):
            logger.warning(f"[AutoPilot] Invalid transition blocked: {lead_stub.status} -> {new_status}")
            return

        cache.set(dedupe_key, True, timeout=60)

        with transaction.atomic():
            try:
                lead = Lead.objects.select_for_update().get(id=lead_stub.id)
            except Lead.DoesNotExist:
                return

            if lead.status in ['won', 'lost'] and lead.status != new_status:
                logger.info(f"[AutoPilot] Lead {lead.id} changed to terminal state concurrently. Skipping.")
                return

            # Double Idempotency Protection (Check after DB lock)
            if lead.status == new_status:
                logger.info(f"[AutoPilot] Lead {lead.id} already has status {new_status}. Skipping update.")
                return

            # Enforce Valid Status Transitions (Check after DB lock)
            if new_status not in VALID_TRANSITIONS.get(lead.status, []):
                logger.warning(f"[AutoPilot] Invalid transition blocked: {lead.status} -> {new_status}")
                return

            logger.info(f"[AutoPilot][Lead:{lead.id}] {lead.status} → {new_status}")
            lead.status = new_status
            lead.save()

        # Deal Progression (happens outside lock to avoid long transactions)
        if new_status == 'proposal':
            contact, created = Contact.objects.get_or_create(
                email=lead_stub.email,
                defaults={
                    'name': lead_stub.name,
                    'phone': lead_stub.phone,
                    'company': lead_stub.company,
                    'owner': lead_stub.assigned_to,
                    'linked_lead': lead_stub
                }
            )
            if not created and not contact.linked_lead:
                contact.linked_lead = lead_stub
                contact.save(update_fields=['linked_lead'])
            Deal.objects.create(
                title=f"{lead_stub.company or lead_stub.name} Deal",
                value=random.randint(5000, 50000),
                stage='Proposal/Price Quote',
                owner=lead_stub.assigned_to,
                contact=contact
            )
            logger.info(f"[AutoPilot] Auto-converted Lead {lead_stub.id} to Deal!")
            
    except Exception as e:
        logger.error(f"[AutoPilot Error] failed simulate_meeting_outcome: {str(e)}", exc_info=True)
        raise e

@shared_task(name='workflows.reconcile_lead_tasks')
def reconcile_lead_tasks():
    """
    Background Reconciliation Job (SELF-HEALING)
    Finds leads with missing tasks or mismatched status/steps and fixes them.
    Should be scheduled to run every 5 minutes via Celery Beat.
    """
    logger.info("[Recovery] Starting background reconciliation job...")
    leads = Lead.objects.all()
    
    STEPS_LIST = [
        {'name': 'Initial Call', 'status': 'pending'},
        {'name': 'Follow-up Call', 'status': 'pending'},
        {'name': 'Send Proposal', 'status': 'pending'},
        {'name': 'Negotiation', 'status': 'pending'},
        {'name': 'Closed Won', 'status': 'pending'},
        {'name': 'Closed Lost', 'status': 'pending'}
    ]

    fixed_count = 0

    for lead in leads:
        try:
            if validate_lead_task_consistency(lead):
                continue

            expected_step = STATUS_TO_STEP.get(lead.status, 'Initial Call')
            
            task = Task.objects.filter(lead=lead).exclude(status='completed').first()
            if not task:
                task = Task.objects.filter(lead=lead).first()

            if not task:
                logger.warning(f"[Recovery] Recreating missing task for Lead:{lead.id}")
                try:
                    task = Task.objects.create(
                        title=f"Lead Workflow: {lead.name}",
                        description=f"Automated single-task workflow for {lead.name}.",
                        priority='high',
                        due_date=timezone.now() + timedelta(hours=1),
                        assigned_to=lead.assigned_to,
                        lead=lead,
                        source_object_id=str(lead.id),
                        status='in_progress',
                        current_step=expected_step,
                        next_action=expected_step,
                        steps={'list': STEPS_LIST.copy()},
                        task_type='call'
                    )
                except IntegrityError:
                    task = Task.objects.get(
                        lead=lead,
                        status__in=["pending", "in_progress"]
                    )
            
            if task.current_step != expected_step:
                logger.warning(f"[Recovery] Fixed task mismatch for Lead:{lead.id}. {task.current_step} -> {expected_step}")
                old_step = task.current_step
                task.current_step = expected_step
                task.next_action = expected_step
                
                steps_data = task.steps.get('list', [])
                for s in steps_data:
                    if s['name'] == old_step:
                        s['status'] = 'completed'
                    elif s['name'] == expected_step:
                        s['status'] = 'in_progress'
                task.steps = {'list': steps_data}
                
                if lead.status in ['won', 'lost']:
                    task.status = 'completed'
                    task.is_active = False

                task.save(update_fields=['current_step', 'next_action', 'steps', 'status', 'is_active', 'updated_at'])
            
            fixed_count += 1
            
        except Exception as e:
            logger.error(f"[Recovery Error] Failed to reconcile Lead:{lead.id}: {str(e)}", exc_info=True)

    logger.info(f"[Recovery] Reconciliation job finished. Fixed {fixed_count} leads.")
