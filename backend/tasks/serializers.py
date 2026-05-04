from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    stage = serializers.CharField(source='lead.status', read_only=True)
    owner = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = Task
        fields = [
            'id', 'title', 'task_type', 'description', 'status', 'priority',
            'due_date', 'assigned_to', 'owner', 'lead', 'deal',
            'lead_name', 'stage', 'current_step', 'steps', 'next_action',
            'source_workflow', 'source_object_id',
            'is_active', 'update_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['source_workflow', 'source_object_id', 'is_active', 'update_count', 'created_at', 'updated_at']

    def get_owner(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None


