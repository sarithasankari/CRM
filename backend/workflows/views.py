from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from .models import Workflow, WorkflowLog
from .serializers import WorkflowSerializer, WorkflowLogSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all().order_by('-created_at')
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        workflow = self.get_object()
        logs = workflow.logs.all().order_by('-executed_at')
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = WorkflowLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = WorkflowLogSerializer(logs, many=True)
        return Response(serializer.data)

class WorkflowLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = WorkflowLog.objects.all().order_by('-executed_at')
    serializer_class = WorkflowLogSerializer
    permission_classes = [IsAuthenticated]
