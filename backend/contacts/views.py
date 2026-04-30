from rest_framework import viewsets
from users.mixins import TeamOwnedViewSetMixin
from .models import Contact
from .serializers import ContactSerializer

class ContactViewSet(TeamOwnedViewSetMixin, viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    filterset_fields = ['company']
    search_fields = ['name', 'email', 'company']
    ordering_fields = ['created_at', 'updated_at']
