from rest_framework import serializers
from .models import Workflow, WorkflowCondition, WorkflowAction, WorkflowLog, RoundRobinState


class WorkflowConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WorkflowCondition
        fields = ['id', 'field_name', 'operator', 'value', 'order']


class WorkflowActionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WorkflowAction
        fields = [
            'id', 'action_type', 'order',
            'assignment_type', 'specific_user', 'delay_days', 'priority',
            'action_data',
        ]


class WorkflowLogSerializer(serializers.ModelSerializer):
    class Meta:
        model       = WorkflowLog
        fields      = ['id', 'status', 'trigger_event', 'object_id', 'executed_at', 'message', 'execution_key']
        read_only_fields = fields


class WorkflowSerializer(serializers.ModelSerializer):
    conditions = WorkflowConditionSerializer(many=True, required=False)
    actions    = WorkflowActionSerializer(many=True, required=False)
    log_count  = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = Workflow
        fields = [
            'id', 'name', 'description', 'module', 'trigger_event',
            'condition_logic', 'is_active',
            'created_at', 'updated_at',
            'conditions', 'actions', 'log_count',
        ]

    def get_log_count(self, obj):
        return obj.logs.count()

    # ── Create ──────────────────────────────────────────────────────────────
    def create(self, validated_data):
        conditions_data = validated_data.pop('conditions', [])
        actions_data    = validated_data.pop('actions', [])

        workflow = Workflow.objects.create(**validated_data)

        for cond in conditions_data:
            WorkflowCondition.objects.create(workflow=workflow, **cond)

        for act in actions_data:
            WorkflowAction.objects.create(workflow=workflow, **act)

        return workflow

    # ── Update (full replace of nested objects) ──────────────────────────
    def update(self, instance, validated_data):
        conditions_data = validated_data.pop('conditions', None)
        actions_data    = validated_data.pop('actions', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if conditions_data is not None:
            instance.conditions.all().delete()
            for cond in conditions_data:
                WorkflowCondition.objects.create(workflow=instance, **cond)

        if actions_data is not None:
            instance.actions.all().delete()
            for act in actions_data:
                WorkflowAction.objects.create(workflow=instance, **act)

        return instance
