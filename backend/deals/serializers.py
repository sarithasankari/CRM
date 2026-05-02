from rest_framework import serializers
from .models import Deal


class DealSerializer(serializers.ModelSerializer):
    # Human-readable owner info for frontend display (never writable)
    owner_username = serializers.CharField(
        source='owner.username', read_only=True
    )
    owner_full_name = serializers.SerializerMethodField()
    contact_name = serializers.CharField(
        source='contact.name', read_only=True
    )
    # Exposes the linked contact's company so the Kanban board shows real data
    company_name = serializers.CharField(
        source='contact.company', read_only=True, default=''
    )

    class Meta:
        model = Deal
        fields = '__all__'
        read_only_fields = ['owner', 'probability', 'created_at', 'updated_at']

    def get_owner_full_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return None

    def validate_value(self, value):
        if value < 0:
            raise serializers.ValidationError("Deal value cannot be negative.")
        return value
