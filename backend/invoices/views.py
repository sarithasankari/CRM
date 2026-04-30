from rest_framework import viewsets
from users.mixins import TeamOwnedViewSetMixin
from .models import Invoice
from .serializers import InvoiceSerializer

class InvoiceViewSet(TeamOwnedViewSetMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
