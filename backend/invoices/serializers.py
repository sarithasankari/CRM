from rest_framework import serializers
from .models import Invoice
from quotes.serializers import QuoteLineItemSerializer


class InvoiceSerializer(serializers.ModelSerializer):
    owner_full_name = serializers.SerializerMethodField()
    quote_number = serializers.CharField(source='quote.quote_number', read_only=True, allow_null=True)
    deal_title = serializers.CharField(source='quote.deal.title', read_only=True, allow_null=True)
    customer_name = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    line_items = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']

    def get_owner_full_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return None

    def get_customer_name(self, obj):
        if obj.quote and obj.quote.deal and obj.quote.deal.contact:
            return f"{obj.quote.deal.contact.first_name} {obj.quote.deal.contact.last_name}".strip()
        return "N/A"

    def get_amount(self, obj):
        if obj.quote:
            return obj.quote.amount
        return obj.amount

    def get_line_items(self, obj):
        if obj.quote:
            serializer = QuoteLineItemSerializer(obj.quote.line_items.all(), many=True)
            return serializer.data
        return []
