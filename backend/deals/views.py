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
        from django.db import transaction
        from rest_framework.exceptions import ValidationError
        from leads.models import Lead

        with transaction.atomic():
            lead_id = serializer.initial_data.get('lead')
            lead = None
            if lead_id:
                # Lock the lead record to prevent race conditions during creation
                try:
                    lead = Lead.objects.select_for_update().get(pk=lead_id)
                except Lead.DoesNotExist:
                    raise ValidationError({"lead": "Lead not found."})

            # 1. Prevent Duplicate Active Deals
            if lead and Deal.objects.filter(lead=lead, is_active=True).exists():
                raise ValidationError({"lead": "An active deal already exists for this lead."})
            
            # 2. Save the deal (stage defaults to proposal in model)
            deal = serializer.save(owner=self.request.user)
            
            # 3. Clear deal_required flag and timestamp
            if lead:
                lead.deal_required = False
                lead.deal_required_at = None
                lead.save(update_fields=['deal_required', 'deal_required_at'])

    def perform_update(self, serializer):
        from django.db import transaction
        with transaction.atomic():
            serializer.save()


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [RoleBasedAccessPermission]
    search_fields = ['name']
    ordering_fields = ['name', 'price']
