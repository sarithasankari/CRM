from rest_framework import viewsets
from users.mixins import TeamOwnedViewSetMixin
from .models import Deal
from .serializers import DealSerializer

class DealViewSet(TeamOwnedViewSetMixin, viewsets.ModelViewSet):
    queryset = Deal.objects.select_related('contact').all()
    serializer_class = DealSerializer
    filterset_fields = ['stage']
    search_fields = ['title']
    ordering_fields = ['created_at', 'expected_close_date', 'value']
