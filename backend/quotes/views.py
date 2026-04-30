from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework import viewsets
from rest_framework.decorators import action
from users.mixins import TeamOwnedViewSetMixin
from .models import Quote
from .serializers import QuoteSerializer

class QuoteViewSet(TeamOwnedViewSetMixin, viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        quote = self.get_object()
        html_string = render_to_string('pdf/quote.html', {'quote': quote})
        
        try:
            from weasyprint import HTML
            pdf_file = HTML(string=html_string).write_pdf()
            response = HttpResponse(pdf_file, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="quote_{quote.quote_number}.pdf"'
            return response
        except Exception as e:
            return HttpResponse(
                f"<h1>PDF Gen failed (Needs GTK3 on Windows)</h1><p>Error: {str(e)}</p><hr><h3>HTML Preview:</h3>{html_string}", 
                status=500
            )
