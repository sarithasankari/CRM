from rest_framework import serializers
from .models import Quote


class QuoteSerializer(serializers.ModelSerializer):
    owner_full_name = serializers.SerializerMethodField()
    deal_title = serializers.CharField(source='deal.title', read_only=True)

    class Meta:
        model = Quote
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']

    def get_owner_full_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return None
