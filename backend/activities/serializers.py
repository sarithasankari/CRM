from rest_framework import serializers
from .models import Activity, Meeting, Call, Campaign

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'

class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = '__all__'

class CallSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    outcome_display = serializers.CharField(source='get_outcome_display', read_only=True)

    class Meta:
        model = Call
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

class CampaignSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']
