from rest_framework import viewsets

from users.permissions import RoleBasedAccessPermission

from .models import Deal, Product
from .serializers import DealSerializer, ProductSerializer


class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['stage']
    search_fields = ['title']
    ordering_fields = ['created_at', 'value']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Deal.objects.none()

        base_qs = Deal.objects.select_related('owner', 'contact', 'account')
        if user.role == 'admin':
            return base_qs.all()
        if user.role == 'manager':
            return base_qs.filter(owner__team=user.team) if user.team else base_qs.none()
        if user.role == 'sales':
            return base_qs.filter(owner=user)
        return base_qs.none()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        serializer.save()


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [RoleBasedAccessPermission]
    search_fields = ['name']
    ordering_fields = ['name', 'price']
