from rest_framework import viewsets, status
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from .models import Task
from .serializers import TaskSerializer
from users.permissions import RoleBasedAccessPermission
from activities.models import Activity

from django.utils import timezone
from datetime import timedelta
from django.db.models import Q

class TaskViewSet(viewsets.ModelViewSet):
    """
    RBAC rules (strict, assigned_to field):
      admin   → all tasks
      manager → tasks assigned to users in same team
      sales   → only tasks assigned to themselves
    """
    serializer_class = TaskSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['status', 'priority', 'source_object_id', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()

        base_qs = Task.objects.select_related('assigned_to', 'lead')

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

    def create(self, request, *args, **kwargs):
        lead_id = request.data.get('lead')
        title = request.data.get('title')
        task_type = request.data.get('task_type', 'general')
        
        # Check if an active task exists with similar attributes to prevent duplicates
        existing_task = None
        if lead_id:
            # One Lead = One Active Task rule
            existing_task = Task.objects.filter(lead_id=lead_id, is_active=True).first()
        elif title:
            # Fallback for non-lead tasks
            existing_task = Task.objects.filter(title__iexact=title, assigned_to=request.user, is_active=True).first()

        if existing_task:
            # Workflow Spam Protection
            time_threshold = timezone.now() - timedelta(minutes=5)
            if existing_task.updated_at >= time_threshold and not lead_id:
                # Only debounce non-lead tasks, lead tasks should always update
                pass # Or we can let it update

            # Update existing task
            update_data = request.data.copy()
            # Increment update count
            update_data['update_count'] = existing_task.update_count + 1
            if 'status' not in update_data:
                update_data['status'] = 'in_progress'
            
            serializer = self.get_serializer(existing_task, data=update_data, partial=True)
            serializer.is_valid(raise_exception=True)
            # Save explicitly to bypass standard ModelViewSet logic avoiding overwrites
            instance = serializer.save()
            
            # Log Activity
            try:
                Activity.objects.create(
                    type='update',
                    notes=f"Task re-triggered / updated",
                    object_id=lead_id,
                    content_type=ContentType.objects.get(model='lead'),
                    created_by=request.user
                )
            except Exception:
                pass
                
            return Response(serializer.data, status=status.HTTP_200_OK)
                
        # Create new task
        response = super().create(request, *args, **kwargs)
        if lead_id and title:
            try:
                Activity.objects.create(
                    type='created',
                    notes=f"Task created: {title}",
                    object_id=lead_id,
                    content_type=ContentType.objects.get(model='lead'),
                    created_by=request.user
                )
            except Exception:
                pass
        return response

    def perform_create(self, serializer):
        if not serializer.validated_data.get('assigned_to'):
            serializer.save(assigned_to=self.request.user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        instance = serializer.save()
        
        # When task is completed, mark it inactive
        if instance.status == 'completed' and instance.is_active:
            instance.is_active = False
            instance.save(update_fields=['is_active'])
            
            # Log Activity
            if instance.lead:
                try:
                    Activity.objects.create(
                        type='completed',
                        notes=f"Task completed: {instance.title}",
                        object_id=instance.lead.id,
                        content_type=ContentType.objects.get(model='lead'),
                        created_by=self.request.user
                    )
                except Exception:
                    pass
        elif instance.status != 'completed' and not instance.is_active:
            # If reverted to not completed, mark active again
            instance.is_active = True
            instance.save(update_fields=['is_active'])
