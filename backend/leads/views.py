from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, IntegrityError
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

        base_qs = Lead.objects.select_related('assigned_to')

        if user.role == 'admin':
            return base_qs.all()
        elif user.role == 'manager':
            if user.team:
                return base_qs.filter(assigned_to__team=user.team)
            return base_qs.none()
        elif user.role == 'sales':
            return base_qs.filter(assigned_to=user)
        return base_qs.none()

    def perform_create(self, serializer):
        """Auto-assign the creating user when no assignment provided."""
        serializer.save(assigned_to=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    # ------------------------------------------------------------------
    # Conversion rate stats — used by the Leads page metric widget
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='conversion-rate')
    def conversion_rate(self, request):
        qs = self.get_queryset()
        total = qs.count()
        qualified = qs.filter(status='qualified').count()
        rate = round(qualified / total * 100, 1) if total > 0 else 0.0
        return Response({
            'total': total,
            'qualified': qualified,
            'conversion_rate': rate,
        })

    # ------------------------------------------------------------------
    # Lead → Contact + (optional) Deal conversion
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        lead = self.get_object()

        if lead.status == 'qualified':
            return Response(
                {'detail': 'This lead has already been converted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        create_deal = request.data.get('createDeal', False)
        deal_name = request.data.get('dealName', f"{lead.company or lead.name} Deal")
        amount = request.data.get('amount', 0)
        closing_date = request.data.get('closingDate')
        deal_stage = request.data.get('stage', 'Qualification')
        campaign_source = request.data.get('campaign_source', '')
        contact_role = request.data.get('contact_role', '')

        try:
            with transaction.atomic():
                # 1. Update lead status
                lead.status = 'qualified'
                lead.save(update_fields=['status'])

                # 2. Resolve owner: lead's assignee or the requesting user
                record_owner = lead.assigned_to or request.user

                # 3. Get-or-create Contact (guard against duplicate email)
                try:
                    contact, contact_created = Contact.objects.get_or_create(
                        email=lead.email,
                        defaults={
                            'name': lead.name,
                            'phone': lead.phone,
                            'company': lead.company,
                            'linked_lead': lead,
                            'owner': record_owner,
                        },
                    )
                except IntegrityError:
                    # Race condition — another request created the contact first
                    contact = Contact.objects.get(email=lead.email)
                    contact_created = False

                # 4. Fix orphan contact (no owner set)
                if not contact_created and contact.owner is None:
                    contact.owner = record_owner
                    contact.save(update_fields=['owner'])

                # 5. Optionally create Deal
                deal = None
                if create_deal:
                    deal = Deal.objects.create(
                        title=deal_name,
                        value=amount,
                        stage=deal_stage,
                        contact=contact,
                        expected_close_date=closing_date if closing_date else None,
                        owner=record_owner,
                    )

            # 6. Async side-effects — only after successful commit
            if send_welcome_email and contact_created:
                import threading
                def _dispatch_email():
                    try:
                        send_welcome_email.delay(contact.id)
                    except Exception as e:
                        logger.warning("Failed to queue welcome email, Redis might be down: %s", e)
                
                transaction.on_commit(
                    lambda: threading.Thread(target=_dispatch_email, daemon=True).start()
                )

            logger.info(
                "Lead %s converted → Contact %s%s",
                lead.id,
                contact.id,
                f" + Deal {deal.id}" if deal else "",
            )

            return Response(
                {
                    'lead': LeadSerializer(lead).data,
                    'contact': ContactSerializer(contact).data,
                    'deal': DealSerializer(deal).data if deal else None,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as exc:
            logger.error("Error converting lead %s: %s", lead.id, str(exc))
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
