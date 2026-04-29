from rest_framework import viewsets
from .models import Lead
from .serializers import LeadSerializer

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    filterset_fields = ['status', 'source']
    search_fields = ['name', 'email', 'company']
    ordering_fields = ['created_at', 'updated_at']

    def perform_destroy(self, instance):
        instance.soft_delete()
