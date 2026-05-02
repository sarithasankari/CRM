from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    owner_full_name = serializers.SerializerMethodField()
    quote_number = serializers.CharField(source='quote.quote_number', read_only=True, allow_null=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']

    def get_owner_full_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return None
