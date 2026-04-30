from rest_framework import viewsets
from .models import Task
from .serializers import TaskSerializer
from users.permissions import RoleBasedAccessPermission

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['status']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()
            
        if user.role == 'admin':
            return Task.objects.all()
        elif user.role == 'manager':
            if user.team:
                return Task.objects.filter(assigned_to__team=user.team)
            return Task.objects.none()
        elif user.role == 'sales':
            return Task.objects.filter(assigned_to=user)
        return Task.objects.none()
