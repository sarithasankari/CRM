from rest_framework import viewsets
from .models import Task
from .serializers import TaskSerializer
from users.permissions import RoleBasedAccessPermission


class TaskViewSet(viewsets.ModelViewSet):
    """
    RBAC rules (strict, assigned_to field):
      admin   → all tasks
      manager → tasks assigned to users in same team
      sales   → only tasks assigned to themselves
    """
    serializer_class = TaskSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['status', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()

        base_qs = Task.objects.select_related('assigned_to')

        if user.role == 'admin':
            return base_qs.all()

        if user.role == 'manager':
            if not user.team:
                return base_qs.none()
            return base_qs.filter(assigned_to__team=user.team)

        if user.role == 'sales':
            return base_qs.filter(assigned_to=user)

        # Unknown / future roles → deny everything
        return base_qs.none()

    def perform_create(self, serializer):
        """
        If no assigned_to is provided by the client, default to the
        requesting user so no task is ever created without an owner.
        """
        if not serializer.validated_data.get('assigned_to'):
            serializer.save(assigned_to=self.request.user)
        else:
            serializer.save()
