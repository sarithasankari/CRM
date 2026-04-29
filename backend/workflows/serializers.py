from rest_framework import serializers
from .models import Workflow, WorkflowCondition, WorkflowAction, WorkflowLog

class WorkflowConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowCondition
        fields = ['id', 'field_name', 'operator', 'value']

class WorkflowActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowAction
        fields = ['id', 'action_type', 'action_data']

class WorkflowLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowLog
        fields = ['id', 'status', 'executed_at', 'message']
        read_only_fields = fields

class WorkflowSerializer(serializers.ModelSerializer):
    conditions = WorkflowConditionSerializer(many=True, required=False)
    actions = WorkflowActionSerializer(many=True, required=False)
    
    class Meta:
        model = Workflow
        fields = ['id', 'name', 'module', 'trigger_event', 'is_active', 'created_at', 'updated_at', 'conditions', 'actions']

    def create(self, validated_data):
        conditions_data = validated_data.pop('conditions', [])
        actions_data = validated_data.pop('actions', [])
        
        workflow = Workflow.objects.create(**validated_data)
        
        for condition_data in conditions_data:
            WorkflowCondition.objects.create(workflow=workflow, **condition_data)
            
        for action_data in actions_data:
            WorkflowAction.objects.create(workflow=workflow, **action_data)
            
        return workflow

    def update(self, instance, validated_data):
        conditions_data = validated_data.pop('conditions', None)
        actions_data = validated_data.pop('actions', None)

        instance.name = validated_data.get('name', instance.name)
        instance.module = validated_data.get('module', instance.module)
        instance.trigger_event = validated_data.get('trigger_event', instance.trigger_event)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()

        if conditions_data is not None:
            instance.conditions.all().delete()
            for condition_data in conditions_data:
                WorkflowCondition.objects.create(workflow=instance, **condition_data)

        if actions_data is not None:
            instance.actions.all().delete()
            for action_data in actions_data:
                WorkflowAction.objects.create(workflow=instance, **action_data)

        return instance
