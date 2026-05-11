from rest_framework import serializers
from .models import Activity, Meeting, Call, Campaign

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'

class MeetingSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    type = serializers.ReadOnlyField()

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'date', 'time', 'type', 'meeting_type', 
            'start_time', 'end_time', 'status', 'notes', 'participants',
            'object_id', 'content_type', 'owner', 'created_at'
        ]
        read_only_fields = ['owner', 'created_at']

    def get_date(self, obj):
        return obj.start_time.strftime('%Y-%m-%d') if obj.start_time else None

    def get_time(self, obj):
        return obj.start_time.strftime('%H:%M') if obj.start_time else None

class CallSerializer(serializers.ModelSerializer):
    direction_display = serializers.CharField(source='get_direction_display', read_only=True)
    outcome_display = serializers.CharField(source='get_outcome_display', read_only=True)

    class Meta:
        model = Call
        fields = '__all__'
        read_only_fields = ['owner', 'created_at']

class CampaignSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    source_platform_display = serializers.CharField(source='get_source_platform_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    roi_percentage = serializers.SerializerMethodField()
    cost_per_lead = serializers.SerializerMethodField()
    conversion_rate = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'type', 'type_display', 'source_platform', 'source_platform_display',
            'target_audience', 'assigned_team', 'status', 'status_display',
            'description', 'budget', 'expected_revenue', 'actual_revenue',
            'sent', 'opened', 'clicked',
            'leads_generated', 'converted_deals',
            'start_date', 'end_date',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'roi_percentage', 'cost_per_lead', 'conversion_rate',
        ]
        read_only_fields = [
            'created_by', 'created_at', 'updated_at',
            'roi_percentage', 'cost_per_lead', 'conversion_rate',
            'created_by_name', 'status_display', 'type_display', 'source_platform_display',
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_roi_percentage(self, obj):
        return obj.roi_percentage

    def get_cost_per_lead(self, obj):
        return obj.cost_per_lead

    def get_conversion_rate(self, obj):
        return obj.conversion_rate
