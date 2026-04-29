from rest_framework import viewsets
from .models import Deal
from .serializers import DealSerializer

class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.all()
    serializer_class = DealSerializer
    filterset_fields = ['stage']
    search_fields = ['title']
    ordering_fields = ['created_at', 'expected_close_date', 'value']
