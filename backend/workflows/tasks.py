"""
Workflow Celery Tasks — Production Grade v2
============================================
Bug fixes vs v1:
  - bind=True tasks can NOT be called directly as functions (missing 'self').
    Separated the pure business logic into _create_task_in_db() which is
    callable from any context (Celery worker, fallback thread, eager mode).
  - DB connection safety: close_old_connections() at start of each task so
    background threads get fresh connections.
  - Full structured logging at every decision point.
  - Retry uses proper countdown with exponential backoff.
"""

import logging
from datetime import timedelta

from celery import shared_task
from django.core.mail import send_mail
from django.db import close_old_connections
from django.utils import timezone

logger = logging.getLogger(__name__)


# ===========================================================================
# PURE BUSINESS LOGIC — callable from Celery task OR direct fallback
# ===========================================================================

def _resolve_assignee(assignment_type, specific_user_id,
                      owner_user_id, team_name, workflow_action_id):
    """
    Resolve which User gets the task based on the assignment strategy.
    Returns a User instance or None.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    logger.debug(
        "[Tasks._resolve_assignee] strategy=%s owner_id=%s specific_id=%s team=%s action=%s",
        assignment_type, owner_user_id, specific_user_id, team_name, workflow_action_id
    )

    if assignment_type == 'owner':
        if not owner_user_id:
            logger.warning("[Tasks] owner strategy: owner_user_id is None (action=%s)", workflow_action_id)
            return None
        try:
            user = User.objects.get(pk=owner_user_id)
            logger.info("[Tasks] owner strategy → %s", user.username)
            return user
        except User.DoesNotExist:
            logger.warning("[Tasks] owner strategy: user id=%s not found", owner_user_id)
            return None

    if assignment_type == 'specific_user':
        if not specific_user_id:
            logger.warning("[Tasks] specific_user strategy: specific_user_id is None (action=%s)", workflow_action_id)
            return None
        try:
            user = User.objects.get(pk=specific_user_id)
            logger.info("[Tasks] specific_user strategy → %s", user.username)
            return user
        except User.DoesNotExist:
            logger.warning("[Tasks] specific_user strategy: user id=%s not found", specific_user_id)
            return None

    if assignment_type == 'manager':
        if not team_name:
            logger.warning("[Tasks] manager strategy: team_name is None (action=%s)", workflow_action_id)
            return None
        manager = User.objects.filter(role='manager', team=team_name, is_active=True).first()
        if manager:
            logger.info("[Tasks] manager strategy → %s (team=%s)", manager.username, team_name)
        else:
            logger.warning("[Tasks] manager strategy: no manager found for team='%s'", team_name)
        return manager

    if assignment_type == 'round_robin':
        return _round_robin_pick(team_name, workflow_action_id)

    logger.warning("[Tasks] Unknown assignment_type='%s' (action=%s)", assignment_type, workflow_action_id)
    return None


def _round_robin_pick(team_name, workflow_action_id):
    """Cycle through sales reps, persist pointer in RoundRobinState."""
    from django.contrib.auth import get_user_model
    from workflows.models import WorkflowAction, RoundRobinState

    User = get_user_model()
    qs   = User.objects.filter(role='sales', is_active=True)
    if team_name:
        qs = qs.filter(team=team_name)
    reps = list(qs.order_by('pk'))

    if not reps:
        logger.warning("[Tasks] round_robin: no sales reps in team='%s'", team_name)
        return None

    try:
        action = WorkflowAction.objects.get(pk=workflow_action_id)
        state, created = RoundRobinState.objects.get_or_create(action=action)

        last_idx = next((i for i, u in enumerate(reps) if u.pk == state.last_user_id), -1)
        next_idx  = (last_idx + 1) % len(reps)
        next_user = reps[next_idx]

        state.last_user_id = next_user.pk
        state.save(update_fields=['last_user_id', 'updated_at'])

        logger.info(
            "[Tasks] round_robin: assigned %s (slot %d/%d, action=%s)",
            next_user.username, next_idx + 1, len(reps), workflow_action_id
        )
        return next_user

    except Exception as exc:
        logger.error("[Tasks] round_robin state error (action=%s): %s", workflow_action_id, exc)
        return reps[0]  # safe fallback


def _create_task_in_db(
    workflow_id, workflow_action_id, title, description, priority,
    delay_days, assignment_type, specific_user_id, source_object_id,
    owner_user_id, team_name
):
    """
    Core business logic: resolve assignee + create Task in DB.
    This is a plain function (no Celery context needed) so it can be called:
      - From inside a @shared_task (Celery worker)
      - From a fallback background thread (no Redis)
      - From CELERY_TASK_ALWAYS_EAGER mode (unit tests)

    Returns: dict with task_id and assigned_to username.
    Raises:  Exception on failure (caller decides whether to retry).
    """
    from tasks.models import Task
    from workflows.models import Workflow

    # Ensure this thread has a fresh DB connection
    close_old_connections()

    logger.info(
        "[Tasks] _create_task_in_db START | workflow=%s action=%s title='%s' "
        "strategy=%s delay=%dd",
        workflow_id, workflow_action_id, title, assignment_type, delay_days
    )

    # 1. Resolve assignee
    assignee = _resolve_assignee(
        assignment_type=assignment_type,
        specific_user_id=specific_user_id,
        owner_user_id=owner_user_id,
        team_name=team_name,
        workflow_action_id=workflow_action_id,
    )

    # 2. Due date: at least 1 day out, or delay_days if specified
    due_date = timezone.now() + timedelta(days=max(int(delay_days), 1))

    # 3. Fetch Workflow object for FK (best-effort)
    workflow_obj = None
    try:
        workflow_obj = Workflow.objects.get(pk=workflow_id)
    except Workflow.DoesNotExist:
        logger.warning("[Tasks] Workflow id=%s not found — task will have no source_workflow FK", workflow_id)

    # 4. Create the Task row
    task = Task.objects.create(
        title=title,
        description=description,
        status='pending',
        priority=priority,
        due_date=due_date,
        assigned_to=assignee,
        source_workflow=workflow_obj,
        source_object_id=str(source_object_id),
    )

    logger.info(
        "[Tasks] Task CREATED id=%s title='%s' assigned_to=%s priority=%s "
        "due=%s workflow=%s",
        task.pk, task.title,
        getattr(assignee, 'username', 'unassigned'),
        priority,
        due_date.strftime('%Y-%m-%d'),
        workflow_id,
    )

    return {
        'task_id':     task.pk,
        'assigned_to': getattr(assignee, 'username', None),
        'title':       task.title,
        'priority':    task.priority,
    }


# ===========================================================================
# CELERY TASK: IMMEDIATE / DELAYED TASK CREATION
# ===========================================================================

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
    reject_on_worker_lost=True,
    name='workflows.execute_create_task',
)
def execute_create_task(self, **kwargs):
    """
    Celery entry-point for task creation.
    Delegates all logic to _create_task_in_db().
    Retries on transient failures with exponential backoff.
    """
    logger.info(
        "[Celery] execute_create_task RECEIVED | workflow=%s action=%s title='%s'",
        kwargs.get('workflow_id'), kwargs.get('workflow_action_id'), kwargs.get('title')
    )

    try:
        result = _create_task_in_db(
            workflow_id        = kwargs['workflow_id'],
            workflow_action_id = kwargs['workflow_action_id'],
            title              = kwargs.get('title', 'Auto Task'),
            description        = kwargs.get('description', ''),
            priority           = kwargs.get('priority', 'medium'),
            delay_days         = kwargs.get('delay_days', 0),
            assignment_type    = kwargs.get('assignment_type', 'owner'),
            specific_user_id   = kwargs.get('specific_user_id'),
            source_object_id   = kwargs.get('source_object_id', ''),
            owner_user_id      = kwargs.get('owner_user_id'),
            team_name          = kwargs.get('team_name'),
        )
        logger.info(
            "[Celery] execute_create_task DONE | task_id=%s assigned_to=%s",
            result.get('task_id'), result.get('assigned_to')
        )
        return result

    except Exception as exc:
        countdown = 30 * (2 ** self.request.retries)
        logger.error(
            "[Celery] execute_create_task FAILED (attempt %d/%d) | error=%s | retry in %ds",
            self.request.retries + 1, self.max_retries + 1, exc, countdown,
            exc_info=True,
        )
        raise self.retry(exc=exc, countdown=countdown)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
    reject_on_worker_lost=True,
    name='workflows.execute_delayed_task',
)
def execute_delayed_task(self, **kwargs):
    """
    Wrapper for delayed task creation.
    Exists as a separate task so it shows distinctly in Flower / monitoring.
    The actual countdown is set by the engine when scheduling.
    """
    logger.info(
        "[Celery] execute_delayed_task RECEIVED | workflow=%s delay_days=%s",
        kwargs.get('workflow_id'), kwargs.get('delay_days')
    )
    try:
        result = _create_task_in_db(
            workflow_id        = kwargs['workflow_id'],
            workflow_action_id = kwargs['workflow_action_id'],
            title              = kwargs.get('title', 'Auto Task'),
            description        = kwargs.get('description', ''),
            priority           = kwargs.get('priority', 'medium'),
            delay_days         = kwargs.get('delay_days', 0),
            assignment_type    = kwargs.get('assignment_type', 'owner'),
            specific_user_id   = kwargs.get('specific_user_id'),
            source_object_id   = kwargs.get('source_object_id', ''),
            owner_user_id      = kwargs.get('owner_user_id'),
            team_name          = kwargs.get('team_name'),
        )
        logger.info("[Celery] execute_delayed_task DONE | task_id=%s", result.get('task_id'))
        return result
    except Exception as exc:
        countdown = 60 * (2 ** self.request.retries)
        logger.error(
            "[Celery] execute_delayed_task FAILED | error=%s | retry in %ds",
            exc, countdown, exc_info=True
        )
        raise self.retry(exc=exc, countdown=countdown)


# ===========================================================================
# CELERY TASK: SEND EMAIL
# ===========================================================================

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
    name='workflows.send_workflow_email',
)
def send_workflow_email(self, to_email: str, subject: str, body: str):
    """Send a transactional email triggered by a workflow action."""
    logger.info("[Celery] send_workflow_email RECEIVED → %s | subject='%s'", to_email, subject)
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=None,
            recipient_list=[to_email],
            fail_silently=False,
        )
        logger.info("[Celery] send_workflow_email SENT → %s", to_email)
        return {'sent': True, 'to': to_email}
    except Exception as exc:
        countdown = 60 * (2 ** self.request.retries)
        logger.error("[Celery] send_workflow_email FAILED → %s: %s | retry in %ds",
                     to_email, exc, countdown)
        raise self.retry(exc=exc, countdown=countdown)
