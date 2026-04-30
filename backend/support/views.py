from rest_framework import viewsets
from users.mixins import TeamOwnedViewSetMixin
from .models import Case
from .serializers import CaseSerializer

class CaseViewSet(TeamOwnedViewSetMixin, viewsets.ModelViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
