import logging
from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from activities.models import Activity
from .models import ActivityLog, Task
from .serializers import ActivityLogSerializer, TaskSerializer
from users.permissions import RoleBasedAccessPermission

logger = logging.getLogger(__name__)


class TaskViewSet(viewsets.ModelViewSet):
    """
    Task execution engine endpoint.

    RBAC:
      admin   → all tasks
      manager → tasks assigned to users in same team
      sales   → only tasks assigned to themselves

    Custom actions:
      POST /tasks/{id}/start_call/      → marks task in_progress, starts timer
      POST /tasks/{id}/complete_task/   → completes task, sets outcome, fires workflow
      GET  /tasks/{id}/activity_log/    → returns full ActivityLog for a task
      GET  /tasks/call_dashboard/       → returns call tasks grouped by priority/overdue
    """
    serializer_class = TaskSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['status', 'priority', 'task_type', 'source_object_id', 'is_active', 'lead']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']

    # ------------------------------------------------------------------
    # Queryset
    # ------------------------------------------------------------------

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()

        base_qs = Task.objects.select_related('assigned_to', 'lead', 'contact', 'deal')

        if user.role == 'admin':
            return base_qs.all()
        if user.role == 'manager':
            if not user.team:
                return base_qs.none()
            return base_qs.filter(assigned_to__team=user.team)
        if user.role == 'sales':
            return base_qs.filter(assigned_to=user)

        return base_qs.none()

    # ------------------------------------------------------------------
    # Standard CRUD overrides
    # ------------------------------------------------------------------

    def create(self, request, *args, **kwargs):
        lead_id = request.data.get('lead')
        title = request.data.get('title')
        task_type = request.data.get('task_type', 'follow_up')

        # Deduplication: one active task per lead+task_type
        existing_task = None
        if lead_id:
            existing_task = Task.objects.filter(
                lead_id=lead_id,
                task_type=task_type,
                is_active=True,
            ).first()
        elif title:
            existing_task = Task.objects.filter(
                title__iexact=title,
                assigned_to=request.user,
                is_active=True,
            ).first()

        if existing_task:
            # Update (but DO NOT blindly flip to in_progress)
            update_data = {k: v for k, v in request.data.items()}
            update_data.pop('status', None)  # preserve current status unless explicit

            serializer = self.get_serializer(existing_task, data=update_data, partial=True)
            serializer.is_valid(raise_exception=True)
            existing_task._current_user = request.user
            serializer.save()
            self._log_activity('update', f"Task re-triggered: {existing_task.title}", lead_id, request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)

        response = super().create(request, *args, **kwargs)
        if lead_id and title:
            self._log_activity('created', f"Task created: {title}", lead_id, request.user)
        return response

    def perform_create(self, serializer):
        user = self.request.user
        task = serializer.save(
            assigned_to=serializer.validated_data.get('assigned_to') or user
        )
        task._current_user = user

    def perform_update(self, serializer):
        incoming_status = serializer.validated_data.get('status')
        instance = serializer.instance

        extra = {}
        now = timezone.now()

        # Auto-set is_active and completed_at based on status
        if incoming_status == 'completed':
            extra['is_active'] = False
            if not instance.completed_at:
                extra['completed_at'] = now
        elif incoming_status and incoming_status != 'completed':
            extra['is_active'] = True

        instance._current_user = self.request.user
        instance = serializer.save(**extra)

        # Log to activity feed when task is completed
        if instance.status == 'completed' and instance.lead_id:
            self._log_activity(
                'completed',
                f"Task completed: {instance.title} — outcome: {instance.outcome or 'N/A'}",
                instance.lead_id,
                self.request.user,
            )

    # ------------------------------------------------------------------
    # Custom Action: start_call
    # ------------------------------------------------------------------

    @action(detail=True, methods=['post'], url_path='start_call')
    def start_call(self, request, pk=None):
        """
        Mark a call-type task as in_progress.
        Records call start time in metadata.
        """
        task = self.get_object()

        if task.task_type != 'call':
            return Response(
                {'error': 'This action is only available for call-type tasks.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if task.status == 'completed':
            return Response(
                {'error': 'Task is already completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            task = Task.objects.select_for_update().get(pk=task.pk)
            if task.status == 'completed':
                return Response(
                    {'error': 'Task is already completed.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            task._current_user = request.user
            task.status = 'in_progress'
            task.is_active = True
            metadata = task.metadata or {}
            metadata['call_started_at'] = timezone.now().isoformat()
            task.metadata = metadata
            task.save(update_fields=['status', 'is_active', 'metadata', 'updated_at'])

        serializer = self.get_serializer(task)
        return Response({'message': 'Call started.', 'task': serializer.data})

    # ------------------------------------------------------------------
    # Custom Action: complete_task
    # ------------------------------------------------------------------

    @action(detail=True, methods=['post'], url_path='complete_task')
    def complete_task(self, request, pk=None):
        """
        Complete a task with a required outcome.
        Fires the workflow engine to auto-create next steps.

        Body: { "outcome": "interested|no_response|success|failed|not_interested", "notes": "..." }
        """
        task = self.get_object()
        outcome = request.data.get('outcome', '').strip()
        notes = request.data.get('notes', '')

        if not outcome:
            return Response(
                {'error': 'outcome is required to complete a task.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_outcomes = [o[0] for o in Task.OUTCOME_CHOICES]
        if outcome not in valid_outcomes:
            return Response(
                {'error': f"Invalid outcome. Choose from: {', '.join(valid_outcomes)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if task.status == 'completed':
            return Response(
                {'error': 'Task is already completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            task = Task.objects.select_for_update().get(pk=task.pk)
            if task.status == 'completed':
                return Response(
                    {'error': 'Task is already completed.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            now = timezone.now()

            # Calculate call duration if applicable
            metadata = task.metadata or {}
            call_duration = 0
            if task.task_type == 'call' and metadata.get('call_started_at'):
                try:
                    from datetime import datetime
                    started = datetime.fromisoformat(metadata['call_started_at'])
                    if started.tzinfo is None:
                        started = timezone.make_aware(started)
                    call_duration = int((now - started).total_seconds())
                except Exception:
                    pass

            metadata['call_ended_at'] = now.isoformat()
            metadata['call_duration_seconds'] = call_duration

            task._current_user = request.user
            task.status = 'completed'
            task.outcome = outcome
            task.is_active = False
            task.completed_at = now
            task.metadata = metadata
            if notes:
                task.notes = notes
            if call_duration:
                task.call_duration = call_duration
                task.call_outcome = outcome

            task.save()

        # Run the inline CRM workflow rules (in addition to the DB workflow engine
        # which fires via signals). This ensures the hardcoded rules always execute.
        workflow_actions = self._run_crm_workflow_rules(task, request.user)

        serializer = self.get_serializer(task)
        return Response({
            'message': 'Task completed successfully.',
            'task': serializer.data,
            'workflow_actions': workflow_actions,
            'call_duration_seconds': call_duration if task.task_type == 'call' else None,
        })

    def _run_crm_workflow_rules(self, task, user):
        """
        Hardcoded CRM workflow rules:
          call + interested    → update lead → qualified, create meeting task
          call + no_response   → create follow-up call task (+1 day, high priority)
          call + not_interested → update lead → lost
          meeting + success    → update lead → proposal, create Send Proposal task
          meeting + failed     → create reschedule task
        """
        actions_taken = []
        now = timezone.now()

        lead = task.lead
        task_type = task.task_type
        outcome = task.outcome

        try:
            if task_type == 'call' and outcome == 'interested':
                if lead:
                    lead.status = 'qualified'
                    lead.save(update_fields=['status', 'updated_at'])
                    actions_taken.append('Lead status → qualified')

                # Auto-create meeting task (+1 day)
                new_task = self._create_followup_task(
                    title='Schedule Meeting',
                    task_type='meeting',
                    priority='high',
                    due_date=now + timedelta(days=1),
                    lead=lead,
                    assigned_to=user,
                    notes=f"Auto-created after call outcome: interested",
                )
                actions_taken.append(f'Created meeting task #{new_task.pk}')

            elif task_type == 'call' and outcome == 'no_response':
                new_task = self._create_followup_task(
                    title='Follow-up Call',
                    task_type='call',
                    priority='high',
                    due_date=now + timedelta(days=1),
                    lead=lead,
                    assigned_to=user,
                    notes=f"Auto-created: no response on previous call",
                )
                actions_taken.append(f'Created follow-up call task #{new_task.pk}')

            elif task_type == 'call' and outcome == 'not_interested':
                if lead:
                    lead.status = 'lost'
                    lead.save(update_fields=['status', 'updated_at'])
                    actions_taken.append('Lead status → lost')

            elif task_type == 'meeting' and outcome == 'success':
                if lead:
                    lead.status = 'proposal'
                    lead.save(update_fields=['status', 'updated_at'])
                    actions_taken.append('Lead status → proposal')

                new_task = self._create_followup_task(
                    title='Send Proposal',
                    task_type='proposal',
                    priority='high',
                    due_date=now + timedelta(days=1),
                    lead=lead,
                    assigned_to=user,
                    notes=f"Auto-created after meeting outcome: success",
                )
                actions_taken.append(f'Created Send Proposal task #{new_task.pk}')

            elif task_type == 'meeting' and outcome == 'failed':
                new_task = self._create_followup_task(
                    title='Reschedule Meeting',
                    task_type='meeting',
                    priority='medium',
                    due_date=now + timedelta(days=2),
                    lead=lead,
                    assigned_to=user,
                    notes=f"Auto-created: meeting failed, reschedule needed",
                )
                actions_taken.append(f'Created reschedule task #{new_task.pk}')

        except Exception as exc:
            logger.error("[CRM Rules] Workflow rule execution failed: %s", exc, exc_info=True)
            actions_taken.append(f'Warning: {exc}')

        return actions_taken

    def _create_followup_task(self, title, task_type, priority, due_date, lead, assigned_to, notes=''):
        """Create a follow-up task with deduplication check."""
        # Deduplication: don't create if same active task exists for this lead+type
        if lead:
            existing = Task.objects.filter(
                lead=lead,
                task_type=task_type,
                title__iexact=title,
                is_active=True,
                status__in=['not_started', 'pending', 'in_progress'],
            ).first()
            if existing:
                return existing

        task = Task.objects.create(
            title=title,
            task_type=task_type,
            priority=priority,
            due_date=due_date,
            lead=lead,
            assigned_to=assigned_to,
            notes=notes,
            status='not_started',
            is_active=True,
        )
        task._current_user = assigned_to
        return task

    # ------------------------------------------------------------------
    # Custom Action: activity_log
    # ------------------------------------------------------------------

    @action(detail=True, methods=['get'], url_path='activity_log')
    def activity_log(self, request, pk=None):
        """Return full ActivityLog timeline for a specific task."""
        task = self.get_object()
        logs = ActivityLog.objects.filter(task=task).order_by('-timestamp')
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)

    # ------------------------------------------------------------------
    # Custom Action: call_dashboard
    # ------------------------------------------------------------------

    @action(detail=False, methods=['get'], url_path='call_dashboard')
    def call_dashboard(self, request):
        """
        Returns call tasks grouped into buckets for the Call Execution Dashboard.
        Buckets: overdue, due_today, upcoming, in_progress
        """
        qs = self.get_queryset().filter(
            task_type='call',
            status__in=['not_started', 'pending', 'in_progress'],
            is_active=True,
        ).select_related('lead', 'assigned_to')

        now = timezone.now()
        today_end = now.replace(hour=23, minute=59, second=59)

        overdue = []
        due_today = []
        upcoming = []
        in_progress = []

        for task in qs:
            s = self.get_serializer(task).data
            if task.status == 'in_progress':
                in_progress.append(s)
            elif task.due_date and task.due_date < now:
                overdue.append(s)
            elif task.due_date and task.due_date <= today_end:
                due_today.append(s)
            else:
                upcoming.append(s)

        return Response({
            'overdue': overdue,
            'due_today': due_today,
            'in_progress': in_progress,
            'upcoming': upcoming,
            'stats': {
                'total_call_tasks': qs.count(),
                'overdue_count': len(overdue),
                'due_today_count': len(due_today),
                'in_progress_count': len(in_progress),
            }
        })

    # ------------------------------------------------------------------
    # Analytics: metrics
    # ------------------------------------------------------------------

    @action(detail=False, methods=['get'], url_path='metrics')
    def metrics(self, request):
        """Computed analytics: conversion rates, overdue counts, completion times."""
        from django.db.models import Avg, Count, F, ExpressionWrapper, DurationField

        qs = self.get_queryset()
        now = timezone.now()

        total_calls = qs.filter(task_type='call', status='completed').count()
        converted_calls = qs.filter(
            task_type='call', status='completed', outcome='interested'
        ).count()
        call_to_conversion_rate = (
            round(converted_calls / total_calls * 100, 1) if total_calls else 0
        )

        overdue_count = qs.filter(
            due_date__lt=now,
            status__in=['not_started', 'pending', 'in_progress'],
        ).count()

        avg_completion_time = qs.filter(
            status='completed',
            completed_at__isnull=False,
        ).annotate(
            completion_time=ExpressionWrapper(
                F('completed_at') - F('created_at'),
                output_field=DurationField()
            )
        ).aggregate(avg=Avg('completion_time'))['avg']

        avg_call_duration_success = qs.filter(
            task_type='call', status='completed', outcome='interested'
        ).aggregate(avg=Avg('call_duration'))['avg']

        avg_call_duration_failed = qs.filter(
            task_type='call', status='completed', outcome__in=['no_response', 'not_interested']
        ).aggregate(avg=Avg('call_duration'))['avg']

        return Response({
            'call_to_conversion_rate': call_to_conversion_rate,
            'overdue_tasks_count': overdue_count,
            'avg_completion_hours': (
                round(avg_completion_time.total_seconds() / 3600, 1)
                if avg_completion_time else None
            ),
            'avg_call_duration_success': round(avg_call_duration_success, 1) if avg_call_duration_success else 0,
            'avg_call_duration_failed': round(avg_call_duration_failed, 1) if avg_call_duration_failed else 0,
            'total_completed': qs.filter(status='completed').count(),
            'total_active': qs.filter(is_active=True).count(),
        })

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _log_activity(self, activity_type, notes, lead_id, user):
        try:
            Activity.objects.create(
                type=activity_type,
                notes=notes,
                object_id=lead_id,
                content_type=ContentType.objects.get(model='lead'),
                created_by=user,
            )
        except Exception:
            pass


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only API for ActivityLogs. Supports filtering by task."""
    serializer_class = ActivityLogSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['task', 'action_type']
    ordering_fields = ['timestamp']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ActivityLog.objects.none()

        # Admin sees all; sales/manager sees logs for their tasks
        if user.role == 'admin':
            return ActivityLog.objects.select_related('task', 'user').all()

        # Filter via the tasks the user can see
        if user.role == 'manager' and user.team:
            task_ids = Task.objects.filter(
                assigned_to__team=user.team
            ).values_list('id', flat=True)
        else:
            task_ids = Task.objects.filter(
                assigned_to=user
            ).values_list('id', flat=True)

        return ActivityLog.objects.filter(
            task_id__in=task_ids
        ).select_related('task', 'user').order_by('-timestamp')
