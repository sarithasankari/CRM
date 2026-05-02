from rest_framework import viewsets
from .models import Activity, Meeting, Call, Campaign
from .serializers import ActivitySerializer, MeetingSerializer, CallSerializer, CampaignSerializer

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    filterset_fields = ['type']
    search_fields = ['notes']
    ordering_fields = ['created_at']

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all().order_by('-created_at')
    serializer_class = MeetingSerializer
    search_fields = ['title', 'notes']
    ordering_fields = ['created_at', 'date']

class CallViewSet(viewsets.ModelViewSet):
    serializer_class = CallSerializer
    filterset_fields = ['type', 'outcome']
    search_fields = ['contact_name', 'company', 'notes']
    ordering_fields = ['created_at', 'call_date']

    def get_queryset(self):
        return Call.objects.select_related('created_by').all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    filterset_fields = ['status', 'type']
    search_fields = ['name', 'target_audience']
    ordering_fields = ['created_at', 'start_date']

    def get_queryset(self):
        return Campaign.objects.select_related('created_by').all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
