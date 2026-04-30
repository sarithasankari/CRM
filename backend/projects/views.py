from rest_framework import viewsets
from users.mixins import TeamOwnedViewSetMixin
from .models import Project
from .serializers import ProjectSerializer

class ProjectViewSet(TeamOwnedViewSetMixin, viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filterset_fields = ['status']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'start_date', 'end_date']
