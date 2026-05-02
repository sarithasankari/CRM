from rest_framework import viewsets
from .models import Quote
from .serializers import QuoteSerializer
from users.permissions import RoleBasedAccessPermission


class QuoteViewSet(viewsets.ModelViewSet):
    """
    RBAC rules:
      admin   → all quotes
      manager → quotes owned by users in same team
      sales   → only their own quotes
    """
    serializer_class = QuoteSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['status']
    search_fields = ['quote_number', 'deal__title']
    ordering_fields = ['created_at', 'valid_until', 'amount']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Quote.objects.none()

        base_qs = Quote.objects.select_related('owner', 'deal', 'deal__contact')

        if user.role == 'admin':
            return base_qs.all()
        if user.role == 'manager':
            if not user.team:
                return base_qs.none()
            return base_qs.filter(owner__team=user.team)
        if user.role == 'sales':
            return base_qs.filter(owner=user)

        return base_qs.none()

    def perform_create(self, serializer):
        """Always stamp the creating user as owner."""
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        """Owner is immutable after creation."""
        serializer.save()
