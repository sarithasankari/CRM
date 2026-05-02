from rest_framework import serializers
from .models import Contact


class ContactSerializer(serializers.ModelSerializer):
    # Human-readable owner info for frontend display (never writable)
    owner_username = serializers.CharField(
        source='owner.username', read_only=True
    )
    owner_full_name = serializers.SerializerMethodField()
    linked_lead_name = serializers.CharField(
        source='linked_lead.name', read_only=True, allow_null=True
    )

    class Meta:
        model = Contact
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']

    def get_owner_full_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return None

    def validate_email(self, value):
        # For update operations, exclude current instance from uniqueness check
        request = self.context.get('request')
        qs = Contact.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A contact with this email already exists.")
        return value
