from rest_framework import viewsets
from .models import Deal
from .serializers import DealSerializer
from users.permissions import RoleBasedAccessPermission

class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['stage']
    search_fields = ['title']
    ordering_fields = ['created_at', 'expected_close_date', 'value']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Deal.objects.none()
            
        if user.role == 'admin':
            return Deal.objects.all()
        elif user.role == 'manager':
            if user.team:
                return Deal.objects.filter(contact__linked_lead__assigned_to__team=user.team)
            return Deal.objects.none()
        elif user.role == 'sales':
            return Deal.objects.filter(contact__linked_lead__assigned_to=user)
        return Deal.objects.none()
