from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
import logging

from .models import Lead
from .serializers import LeadSerializer
from contacts.models import Contact
from contacts.serializers import ContactSerializer
from deals.models import Deal
from deals.serializers import DealSerializer
from users.permissions import RoleBasedAccessPermission

try:
    from .tasks import send_welcome_email
except ImportError:
    send_welcome_email = None

logger = logging.getLogger(__name__)

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ['status', 'source']
    search_fields = ['name', 'email', 'company']
    ordering_fields = ['created_at', 'updated_at']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Lead.objects.none()
            
        if user.role == 'admin':
            return Lead.objects.all()
        elif user.role == 'manager':
            # Manager sees leads assigned to their team
            if user.team:
                return Lead.objects.filter(assigned_to__team=user.team)
            return Lead.objects.none()
        elif user.role == 'sales':
            # Sales sees only their own leads
            return Lead.objects.filter(assigned_to=user)
        return Lead.objects.none()

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        lead = self.get_object()

        if lead.status == 'qualified':
            return Response({'detail': 'Lead is already converted/qualified.'}, status=status.HTTP_400_BAD_REQUEST)

        create_deal = request.data.get('createDeal', False)
        deal_name = request.data.get('dealName', f"{lead.company or lead.name} Deal")
        amount = request.data.get('amount', 0)
        closing_date = request.data.get('closingDate')
        stage = request.data.get('stage', 'Qualification')

        try:
            with transaction.atomic():
                # 1. Update Lead Status
                lead.status = 'qualified'
                lead.save()

                # 2. Get or Create Contact safely (atomic)
                contact, contact_created = Contact.objects.get_or_create(
                    email=lead.email,
                    defaults={
                        'name': lead.name,
                        'phone': lead.phone,
                        'company': lead.company,
                        'linked_lead': lead
                    }
                )

                # 3. Create Deal if requested
                deal = None
                if create_deal:
                    deal = Deal.objects.create(
                        title=deal_name,
                        value=amount,
                        stage=stage,
                        contact=contact,
                        expected_close_date=closing_date if closing_date else None
                    )

            # 4. Trigger Async side-effects only after successful commit
            if send_welcome_email:
                transaction.on_commit(lambda: send_welcome_email.delay(contact.id))

            logger.info(f"Lead {lead.id} successfully converted to Contact {contact.id}")

            return Response({
                "lead": LeadSerializer(lead).data,
                "contact": ContactSerializer(contact).data,
                "deal": DealSerializer(deal).data if deal else None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error converting lead {lead.id}: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
