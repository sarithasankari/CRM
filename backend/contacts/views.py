from rest_framework import viewsets
from .models import Contact
from .serializers import ContactSerializer
from users.permissions import RoleBasedAccessPermission


class ContactViewSet(viewsets.ModelViewSet):
    """
    RBAC rules (strict, owner-field only):
      admin   → all contacts
      manager → contacts owned by users in same team
      sales   → only their own contacts
    """
    serializer_class = ContactSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['company']
    search_fields = ['name', 'email', 'company']
    ordering_fields = ['created_at', 'updated_at']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Contact.objects.none()

        base_qs = Contact.objects.select_related('owner', 'linked_lead')

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
        """Owner is immutable after creation — enforced by serializer read_only."""
        serializer.save()
