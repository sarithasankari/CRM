from rest_framework import viewsets
from .models import Deal
from .serializers import DealSerializer
from users.permissions import RoleBasedAccessPermission


class DealViewSet(viewsets.ModelViewSet):
    """
    RBAC rules (strict, owner-field only):
      admin   → all deals
      manager → deals owned by users in same team
      sales   → only their own deals
    """
    serializer_class = DealSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['stage']
    search_fields = ['title']
    ordering_fields = ['created_at', 'expected_close_date', 'value']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Deal.objects.none()

        base_qs = Deal.objects.select_related('owner', 'contact')

        if user.role == 'admin':
            return base_qs.all()

        if user.role == 'manager':
            if not user.team:
                return base_qs.none()
            return base_qs.filter(owner__team=user.team)

        if user.role == 'sales':
            return base_qs.filter(owner=user)

        # Unknown / future roles → deny everything
        return base_qs.none()

    def perform_create(self, serializer):
        """Always stamp the creating user as owner. Never trust client input."""
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        """Prevent ownership transfer on update — owner is immutable after creation."""
        serializer.save()  # owner is read_only in serializer, so this is safe
