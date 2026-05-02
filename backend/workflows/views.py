"""
Workflow API Views
==================
Provides full CRUD for Workflows + read-only WorkflowLogs.
Includes a test-trigger endpoint for development.
"""

import logging

from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Workflow, WorkflowLog
from .serializers import WorkflowSerializer, WorkflowLogSerializer

logger = logging.getLogger(__name__)


class WorkflowViewSet(viewsets.ModelViewSet):
    """
    CRUD for Workflows.
    GET /api/workflows/
    POST /api/workflows/
    GET/PUT/PATCH/DELETE /api/workflows/{id}/
    GET /api/workflows/{id}/logs/
    POST /api/workflows/{id}/test_trigger/
    """
    queryset           = Workflow.objects.prefetch_related('conditions', 'actions').order_by('-created_at')
    serializer_class   = WorkflowSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['module', 'trigger_event', 'is_active']
    search_fields      = ['name', 'description']
    ordering_fields    = ['created_at', 'updated_at', 'name']

    # ── Logs sub-resource ─────────────────────────────────────────────────
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """GET /api/workflows/{id}/logs/"""
        workflow = self.get_object()
        logs     = workflow.logs.all().order_by('-executed_at')
        page     = self.paginate_queryset(logs)
        if page is not None:
            serializer = WorkflowLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = WorkflowLogSerializer(logs, many=True)
        return Response(serializer.data)

    # ── Manual test trigger ────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def test_trigger(self, request, pk=None):
        """
        POST /api/workflows/{id}/test_trigger/
        Body: { "object_id": 5 }  — PK of the object to test against.

        Manually fires the workflow against a real record.
        Useful for dev/QA without needing to create/modify a real record.
        """
        from django.apps import apps
        from .engine import trigger_workflows

        workflow  = self.get_object()
        object_id = request.data.get('object_id')

        if not object_id:
            return Response(
                {'detail': "'object_id' is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Map module → app_label
        MODULE_APP_MAP = {
            'lead':    'leads',
            'deal':    'deals',
            'task':    'tasks',
            'contact': 'contacts',
            'project': 'projects',
            'quote':   'quotes',
            'invoice': 'invoices',
            'case':    'support',
        }
        app_label  = MODULE_APP_MAP.get(workflow.module)
        model_name = workflow.module

        if not app_label:
            return Response(
                {'detail': f"Unknown module '{workflow.module}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            Model    = apps.get_model(app_label=app_label, model_name=model_name)
            instance = Model.objects.get(pk=object_id)
        except Exception as exc:
            return Response(
                {'detail': f"Could not load {workflow.module} id={object_id}: {exc}"},
                status=status.HTTP_404_NOT_FOUND
            )

        import threading

        trigger_error = []

        def _run():
            try:
                trigger_workflows(
                    module_name=workflow.module,
                    trigger_event=workflow.trigger_event,
                    instance=instance,
                )
            except Exception as exc:
                logger.error("[Views] test_trigger thread error: %s", exc, exc_info=True)
                trigger_error.append(str(exc))

        # Run in a thread so we don't block the HTTP response
        # (important on Django's single-threaded dev server)
        t = threading.Thread(target=_run, daemon=True)
        t.start()
        t.join(timeout=6)   # Wait up to 6 s for engine to write log

        if trigger_error:
            return Response(
                {'detail': f'Trigger failed: {trigger_error[0]}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        latest_log = workflow.logs.order_by('-executed_at').first()
        return Response({
            'detail': 'Workflow test-triggered successfully.',
            'log': WorkflowLogSerializer(latest_log).data if latest_log else None,
        })

    # ── Toggle active ─────────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """POST /api/workflows/{id}/toggle/ — flip is_active."""
        workflow           = self.get_object()
        workflow.is_active = not workflow.is_active
        workflow.save(update_fields=['is_active'])
        return Response({
            'id':        workflow.pk,
            'is_active': workflow.is_active,
            'detail':    f"Workflow {'activated' if workflow.is_active else 'deactivated'}.",
        })


class WorkflowLogViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    """
    Read-only log access.
    GET /api/workflow-logs/
    GET /api/workflow-logs/{id}/
    """
    queryset           = WorkflowLog.objects.select_related('workflow').order_by('-executed_at')
    serializer_class   = WorkflowLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields   = ['status', 'workflow', 'trigger_event']
    search_fields      = ['message', 'object_id']
    ordering_fields    = ['executed_at']
