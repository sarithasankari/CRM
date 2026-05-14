from rest_framework import serializers
from .models import Activity, Meeting, Call

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
