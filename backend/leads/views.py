import os
import uuid
import pandas as pd
from django.conf import settings
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from users.mixins import TeamOwnedViewSetMixin
from .models import Lead
from .serializers import LeadSerializer

class LeadViewSet(TeamOwnedViewSetMixin, viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('assigned_to').all()
    serializer_class = LeadSerializer
    filterset_fields = ['status', 'source']
    search_fields = ['name', 'email', 'company']
    ordering_fields = ['created_at', 'updated_at']

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def import_csv(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=400)
            
        duplicate_strategy = request.data.get('duplicate_strategy', 'skip')
        
        temp_path = os.path.join(settings.BASE_DIR, f"temp_{uuid.uuid4().hex}.csv")
        with open(temp_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
                
        # Rough check for large files (e.g. > 100KB)
        if file.size > 1024 * 100:
            from workflows.tasks import async_import_leads_csv
            task = async_import_leads_csv.delay(temp_path, duplicate_strategy, request.user.id)
            return Response({
                "message": "File is large, processing in background.",
                "status": "processing",
                "task_id": task.id
            })
            
        from utils.csv_service import process_lead_csv
        result = process_lead_csv(temp_path, duplicate_strategy, request.user.id)
        os.remove(temp_path)
        return Response(result)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        data = list(queryset.values('name', 'email', 'phone', 'company', 'status', 'source', 'created_at'))
        
        df = pd.DataFrame(data)
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads_export.csv"'
        df.to_csv(path_or_buf=response, index=False)
        return response
