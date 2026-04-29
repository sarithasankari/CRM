from rest_framework import viewsets
from .models import Contact
from .serializers import ContactSerializer

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    filterset_fields = ['company']
    search_fields = ['name', 'email', 'company']
    ordering_fields = ['created_at', 'updated_at']
