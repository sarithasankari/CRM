from rest_framework import serializers
from .models import Quote, QuoteLineItem


class QuoteLineItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = QuoteLineItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'line_total']


class QuoteSerializer(serializers.ModelSerializer):
    owner_full_name = serializers.SerializerMethodField()
    deal_title = serializers.CharField(source='deal.title', read_only=True)
    customer_name = serializers.SerializerMethodField()
    line_items = QuoteLineItemSerializer(many=True, required=False)

    class Meta:
        model = Quote
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']

    def get_owner_full_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return None

    def get_customer_name(self, obj):
        if obj.deal and obj.deal.contact:
            return f"{obj.deal.contact.first_name} {obj.deal.contact.last_name}".strip()
        return ""

    def update(self, instance, validated_data):
        line_items_data = validated_data.pop('line_items', None)
        
        # Update quote fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update line items if provided
        if line_items_data is not None:
            # Simple approach: delete existing and recreate
            instance.line_items.all().delete()
            for item_data in line_items_data:
                QuoteLineItem.objects.create(quote=instance, **item_data)
            
            # Recalculate quote amount
            total_amount = sum(item_data['quantity'] * item_data['unit_price'] for item_data in line_items_data)
            instance.amount = total_amount
            instance.save()

        return instance
