import logging
from datetime import timedelta

from django.db.models import Count, Sum, Q, F
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from django.conf import settings

from .models import Activity, Meeting, Call, Campaign
from .serializers import ActivitySerializer, MeetingSerializer, CallSerializer, CampaignSerializer

logger = logging.getLogger(__name__)


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    filterset_fields = ['type']
    search_fields = ['notes']
    ordering_fields = ['created_at']

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all().order_by('-created_at')
    serializer_class = MeetingSerializer
    search_fields = ['title', 'notes']
    ordering_fields = ['created_at', 'date']

class CallViewSet(viewsets.ModelViewSet):
    serializer_class = CallSerializer
    filterset_fields = ['direction', 'outcome']
    search_fields = ['contact_name', 'company', 'notes']
    ordering_fields = ['created_at', 'call_date']

    def get_queryset(self):
        return Call.objects.select_related('owner').all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    filterset_fields = ['status', 'type', 'source_platform']
    search_fields = ['name', 'target_audience', 'assigned_team']
    ordering_fields = ['created_at', 'start_date', 'leads_generated', 'actual_revenue']

    def get_queryset(self):
        return Campaign.objects.select_related('created_by').all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'], url_path='analytics')
    def campaign_analytics(self, request, pk=None):
        """Per-campaign analytics: leads, tasks, deals, ROI."""
        campaign = self.get_object()
        from leads.models import Lead
        from deals.models import Deal

        leads = Lead.objects.filter(campaign=campaign, is_deleted=False)
        deals = Deal.objects.filter(campaign=campaign)

        leads_by_status = dict(
            leads.values_list('status').annotate(count=Count('id')).values_list('status', 'count')
        )
        won_deals = deals.filter(status='won')
        total_revenue = won_deals.aggregate(total=Sum('value'))['total'] or 0

        return Response({
            'campaign_id': campaign.pk,
            'name': campaign.name,
            'leads_generated': leads.count(),
            'leads_by_status': leads_by_status,
            'total_deals': deals.count(),
            'won_deals': won_deals.count(),
            'total_revenue': float(total_revenue),
            'budget': float(campaign.budget),
            'roi_percentage': campaign.roi_percentage,
            'cost_per_lead': campaign.cost_per_lead,
            'conversion_rate': campaign.conversion_rate,
            'open_rate': campaign.opened,
            'click_rate': campaign.clicked,
        })

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """Aggregate marketing summary for the overview dashboard."""
        from leads.models import Lead
        from deals.models import Deal

        campaigns = self.get_queryset()
        leads = Lead.objects.filter(is_deleted=False)
        deals = Deal.objects.all()

        # Leads by source
        leads_by_source = dict(
            leads.exclude(source__isnull=True).values_list('source').annotate(c=Count('id')).values_list('source', 'c')
        )

        # Campaign-linked metrics
        campaign_leads = leads.filter(campaign__isnull=False)
        won_deals = deals.filter(status='won', campaign__isnull=False)
        total_won_revenue = won_deals.aggregate(total=Sum('value'))['total'] or 0
        total_budget = campaigns.aggregate(total=Sum('budget'))['total'] or 0

        active_campaigns = campaigns.filter(status='active').count()
        total_leads = leads.count()
        campaign_leads_count = campaign_leads.count()
        conversion_rate = round((won_deals.count() / campaign_leads_count * 100), 1) if campaign_leads_count > 0 else 0

        # Leads this week vs last week
        now = timezone.now()
        this_week = leads.filter(created_at__gte=now - timedelta(days=7)).count()
        last_week = leads.filter(
            created_at__gte=now - timedelta(days=14),
            created_at__lt=now - timedelta(days=7)
        ).count()

        return Response({
            'total_campaigns': campaigns.count(),
            'active_campaigns': active_campaigns,
            'total_leads': total_leads,
            'campaign_leads': campaign_leads_count,
            'leads_this_week': this_week,
            'leads_last_week': last_week,
            'won_deals': won_deals.count(),
            'total_won_revenue': float(total_won_revenue),
            'total_budget': float(total_budget),
            'conversion_rate': conversion_rate,
            'leads_by_source': leads_by_source,
            'campaigns_by_status': dict(
                campaigns.values_list('status').annotate(c=Count('id')).values_list('status', 'c')
            ),
        })


class MarketingLeadCaptureView(APIView):
    """
    POST /api/marketing/capture-lead/

    Public endpoint for web forms, landing pages, WhatsApp bots.
    Creates a lead with campaign attribution and auto-assigns a sales user.
    Duplicate prevention: by email (within 24h), phone, or email+name+company.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        phone = data.get('phone', '').strip()
        company = data.get('company', '').strip()
        source = data.get('source', 'website')
        campaign_id = data.get('campaign_id')
        message = data.get('message', '')

        if not name and not email and not phone:
            return Response(
                {'detail': 'At least one of name, email, or phone is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from leads.models import Lead
        from contacts.models import Contact
        from tasks.models import Task
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # --- Duplicate Prevention ---
        existing_lead = None
        duplicate_window = timezone.now() - timedelta(hours=24)

        if email:
            existing_lead = Lead.objects.filter(
                email=email, is_deleted=False,
                created_at__gte=duplicate_window
            ).first()
        if not existing_lead and phone:
            existing_lead = Lead.objects.filter(
                phone=phone, is_deleted=False,
                created_at__gte=duplicate_window
            ).first()
        if not existing_lead and name and company:
            existing_lead = Lead.objects.filter(
                name=name, company=company, is_deleted=False,
                created_at__gte=duplicate_window
            ).first()

        if existing_lead:
            logger.info(
                "[MarketingCapture] Duplicate lead suppressed: email=%s phone=%s",
                email, phone
            )
            return Response({
                'detail': 'Lead already exists — duplicate suppressed.',
                'lead_id': existing_lead.pk,
                'is_duplicate': True,
            }, status=status.HTTP_200_OK)

        # --- Campaign Validation ---
        campaign = None
        if campaign_id:
            try:
                campaign = Campaign.objects.get(pk=campaign_id)
            except Campaign.DoesNotExist:
                pass

        # --- Auto-assign Sales User (round-robin by least assigned active leads) ---
        sales_user = None
        try:
            sales_user = (
                User.objects.filter(role='sales', is_active=True)
                .annotate(active_leads=Count('lead', filter=Q(lead__is_deleted=False)))
                .order_by('active_leads')
                .first()
            )
        except Exception:
            pass

        if not sales_user:
            try:
                sales_user = User.objects.filter(is_active=True).first()
            except Exception:
                pass

        # --- Create Lead ---
        try:
            lead = Lead.objects.create(
                name=name,
                email=email,
                phone=phone,
                company=company,
                source=source,
                campaign=campaign,
                assigned_to=sales_user,
                status='new',
            )
            logger.info(
                "[MarketingCapture] Lead %s created from source=%s campaign=%s",
                lead.pk, source, campaign_id
            )
        except Exception as e:
            logger.error("[MarketingCapture] Failed to create lead: %s", e)
            return Response({'detail': f'Failed to create lead: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # --- Log activity ---
        try:
            Activity.objects.create(
                type='note',
                notes=(
                    f'Web lead captured via {source}. '
                    f'Name: {name}, Email: {email}, Phone: {phone}. '
                    f'Campaign: {campaign.name if campaign else "Direct"}. '
                    f'Message: {message[:200] if message else "—"}'
                ),
                created_by=sales_user,
            )
        except Exception as e:
            logger.error("[MarketingCapture] Activity log failed: %s", e)

        return Response({
            'detail': 'Lead captured successfully.',
            'lead_id': lead.pk,
            'is_duplicate': False,
            'assigned_to': sales_user.get_full_name() if sales_user else None,
            'campaign': campaign.name if campaign else None,
        }, status=status.HTTP_201_CREATED)


class MarketingAnalyticsView(APIView):
    """
    GET /api/marketing/analytics/
    Realtime marketing analytics for the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from leads.models import Lead
        from deals.models import Deal

        now = timezone.now()
        campaigns = Campaign.objects.all()
        leads = Lead.objects.filter(is_deleted=False)
        deals = Deal.objects.all()

        # Overall stats
        total_leads = leads.count()
        campaign_leads = leads.filter(campaign__isnull=False).count()
        won_deals = deals.filter(status='won')
        won_revenue = won_deals.aggregate(t=Sum('value'))['t'] or 0
        total_budget = campaigns.aggregate(t=Sum('budget'))['t'] or 0

        # Conversion funnel
        funnel = {
            s: leads.filter(status=s).count()
            for s in ['new', 'contacted', 'follow_up', 'qualified', 'meeting_scheduled', 'proposal', 'won']
        }

        # Leads by source
        leads_by_source = list(
            leads.exclude(source__isnull=True)
            .values('source')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Top campaigns by leads
        top_campaigns = list(
            campaigns.order_by('-leads_generated')[:5]
            .values('id', 'name', 'leads_generated', 'converted_deals', 'budget', 'actual_revenue', 'status')
        )
        for c in top_campaigns:
            budget = float(c['budget'] or 0)
            revenue = float(c['actual_revenue'] or 0)
            c['roi'] = round(((revenue - budget) / budget) * 100, 1) if budget > 0 else 0
            c['cost_per_lead'] = round(budget / c['leads_generated'], 2) if c['leads_generated'] > 0 else 0

        # Monthly leads trend (last 6 months)
        monthly = []
        for i in range(5, -1, -1):
            month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            if i == 0:
                month_end = now
            else:
                month_end = (month_start + timedelta(days=32)).replace(day=1)
            count = leads.filter(created_at__gte=month_start, created_at__lt=month_end).count()
            monthly.append({
                'month': month_start.strftime('%b %Y'),
                'leads': count,
            })

        cost_per_lead = round(float(total_budget) / campaign_leads, 2) if campaign_leads > 0 else 0
        overall_roi = round(((float(won_revenue) - float(total_budget)) / float(total_budget)) * 100, 1) if float(total_budget) > 0 else 0

        return Response({
            'total_leads': total_leads,
            'campaign_leads': campaign_leads,
            'active_campaigns': campaigns.filter(status='active').count(),
            'won_deals_count': won_deals.count(),
            'total_won_revenue': float(won_revenue),
            'total_budget': float(total_budget),
            'cost_per_lead': cost_per_lead,
            'overall_roi': overall_roi,
            'conversion_rate': round(won_deals.count() / campaign_leads * 100, 1) if campaign_leads > 0 else 0,
            'funnel': funnel,
            'leads_by_source': leads_by_source,
            'top_campaigns': top_campaigns,
            'monthly_trend': monthly,
        })


class WhatsAppWebhookView(APIView):
    """
    POST /api/marketing/webhook/whatsapp/

    Integration-ready WhatsApp webhook stub.
    - Validates payload structure
    - Logs incoming data as Activity
    - Duplicate prevention (phone + 5min window)
    - Future Meta API compatible (hub.verify_token, hub.challenge)
    """
    permission_classes = [AllowAny]

    VERIFY_TOKEN = getattr(settings, 'WHATSAPP_VERIFY_TOKEN', 'crm_whatsapp_verify_2024')

    def get(self, request):
        """Meta webhook verification handshake."""
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')

        if mode == 'subscribe' and token == self.VERIFY_TOKEN:
            logger.info("[WhatsApp] Webhook verification successful")
            return Response(int(challenge) if challenge else 'OK')
        return Response({'detail': 'Verification failed'}, status=status.HTTP_403_FORBIDDEN)

    def post(self, request):
        """Handle incoming WhatsApp messages / lead inquiries."""
        payload = request.data
        logger.info("[WhatsApp] Incoming webhook payload: %s", str(payload)[:500])

        # Extract contact info from payload (Meta API structure)
        phone = None
        message_text = ''
        try:
            entry = payload.get('entry', [{}])[0]
            changes = entry.get('changes', [{}])[0]
            value = changes.get('value', {})
            contacts = value.get('contacts', [{}])[0]
            phone = contacts.get('wa_id') or contacts.get('phone_number')
            messages = value.get('messages', [{}])[0]
            message_text = messages.get('text', {}).get('body', '') if isinstance(messages.get('text'), dict) else ''
        except (IndexError, KeyError, TypeError):
            pass

        # Fallback: direct payload
        if not phone:
            phone = payload.get('phone') or payload.get('from')

        # Duplicate prevention: same phone within 5 minutes
        if phone:
            window = timezone.now() - timedelta(minutes=5)
            recent = Activity.objects.filter(
                type='note',
                notes__icontains=f'whatsapp:{phone}',
                created_at__gte=window
            ).exists()
            if recent:
                logger.info("[WhatsApp] Duplicate webhook suppressed for phone %s", phone)
                return Response({'detail': 'Duplicate suppressed'}, status=status.HTTP_200_OK)

        # Log activity
        try:
            Activity.objects.create(
                type='note',
                notes=(
                    f'[WhatsApp Webhook] whatsapp:{phone or "unknown"} — '
                    f'Message: {message_text[:300] or "No message body"}. '
                    f'Raw payload logged for future automation.'
                ),
            )
        except Exception as e:
            logger.error("[WhatsApp] Activity log failed: %s", e)

        # TODO: Future — call MarketingLeadCaptureView internally to create lead from WhatsApp
        return Response({
            'detail': 'Webhook received and logged.',
            'phone': phone,
            'integration_status': 'stub — Meta API not yet configured',
        }, status=status.HTTP_200_OK)


class SendEmailAPIView(APIView):
    """
    POST /api/emails/send/
    Sends a real email via Django's mail backend (SMTP or console),
    then logs it as an Activity record so it appears in the Emails page.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        to_email = request.data.get('to_email', '').strip()
        subject  = request.data.get('subject', '').strip()
        body     = request.data.get('body', '').strip()
        contact_id = request.data.get('contact_id')

        if not to_email:
            return Response({'detail': 'to_email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not subject:
            return Response({'detail': 'subject is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not body:
            return Response({'detail': 'body is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                fail_silently=False,
            )
            logger.info("[SendEmail] Email sent to %s by user %s", to_email, request.user)
        except Exception as exc:
            logger.warning("[SendEmail] SMTP not configured or failed — logging only: %s", exc)
            # Non-fatal: log the email even if SMTP fails

        notes = f"TO: {to_email}\nSUBJECT: {subject}\n\n{body}"
        activity_kwargs = {
            'type': 'email',
            'notes': notes,
            'created_by': request.user,
        }

        if contact_id:
            try:
                from contacts.models import Contact
                from django.contrib.contenttypes.models import ContentType
                contact = Contact.objects.get(pk=contact_id)
                activity_kwargs['content_type'] = ContentType.objects.get_for_model(Contact)
                activity_kwargs['object_id'] = contact.pk
            except Exception:
                pass

        activity = Activity.objects.create(**activity_kwargs)
        serializer = ActivitySerializer(activity)

        return Response(
            {'detail': 'Email sent successfully.', 'activity': serializer.data},
            status=status.HTTP_201_CREATED,
        )



class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    filterset_fields = ['type']
    search_fields = ['notes']
    ordering_fields = ['created_at']

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all().order_by('-created_at')
    serializer_class = MeetingSerializer
    search_fields = ['title', 'notes']
    ordering_fields = ['created_at', 'date']

class CallViewSet(viewsets.ModelViewSet):
    serializer_class = CallSerializer
    filterset_fields = ['direction', 'outcome']
    search_fields = ['contact_name', 'company', 'notes']
    ordering_fields = ['created_at', 'call_date']

    def get_queryset(self):
        return Call.objects.select_related('owner').all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    filterset_fields = ['status', 'type']
    search_fields = ['name', 'target_audience']
    ordering_fields = ['created_at', 'start_date']

    def get_queryset(self):
        return Campaign.objects.select_related('created_by').all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class SendEmailAPIView(APIView):
    """
    POST /api/emails/send/
    Sends a real email via Django's mail backend (SMTP or console),
    then logs it as an Activity record so it appears in the Emails page.

    Request body:
        {
            "to_email":   "recipient@example.com",
            "subject":    "Hello",
            "body":       "Email content",
            "contact_id": 5   (optional — links activity to a contact)
        }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        to_email = request.data.get('to_email', '').strip()
        subject  = request.data.get('subject', '').strip()
        body     = request.data.get('body', '').strip()
        contact_id = request.data.get('contact_id')

        # Basic validation
        if not to_email:
            return Response({'detail': 'to_email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not subject:
            return Response({'detail': 'subject is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not body:
            return Response({'detail': 'body is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Send the actual email
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                fail_silently=False,
            )
            logger.info("[SendEmail] Email sent to %s by user %s", to_email, request.user)
        except Exception as exc:
            logger.error("[SendEmail] Failed to send email to %s: %s", to_email, exc)
            return Response(
                {'detail': f'Email delivery failed: {str(exc)}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Log the email as an Activity (so it shows in the Emails page)
        notes = f"TO: {to_email}\nSUBJECT: {subject}\n\n{body}"

        activity_kwargs = {
            'type': 'email',
            'notes': notes,
            'created_by': request.user,
        }

        # Optionally link to Contact via GenericForeignKey
        if contact_id:
            try:
                from contacts.models import Contact
                from django.contrib.contenttypes.models import ContentType
                contact = Contact.objects.get(pk=contact_id)
                activity_kwargs['content_type'] = ContentType.objects.get_for_model(Contact)
                activity_kwargs['object_id'] = contact.pk
            except Exception:
                pass  # Non-fatal — still log the email

        activity = Activity.objects.create(**activity_kwargs)
        serializer = ActivitySerializer(activity)

        return Response(
            {'detail': 'Email sent successfully.', 'activity': serializer.data},
            status=status.HTTP_201_CREATED,
        )

