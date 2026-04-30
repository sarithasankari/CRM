from rest_framework import viewsets
from users.mixins import TeamOwnedViewSetMixin
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(TeamOwnedViewSetMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filterset_fields = ['status']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date']
