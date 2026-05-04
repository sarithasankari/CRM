import logging
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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

