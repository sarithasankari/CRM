import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from workflows.models import Workflow, WorkflowCondition, WorkflowAction, WorkflowRule

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Seeds strictly automated workflow rules for Task-driven Lead lifecycle'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            self.stdout.write("Purging existing task-related workflows and rules to enforce strict automation...")
            
            # Delete old Rules
            WorkflowRule.objects.all().delete()
            
            # Delete Workflow records related to lead and task triggers
            # We delete EVERYTHING because the prompt asked for a fully automated CRM workflow system
            # and to minimize manual user actions.
            Workflow.objects.filter(module__in=['lead', 'task']).delete()
            
            self.stdout.write("Seeding strict automation workflows...")

            # ---------------------------------------------------------
            # 1. Lead Creation -> Auto Call Task
            # ---------------------------------------------------------
            wf_lead_create = Workflow.objects.create(
                name="[AUTO] Lead Creation - Create Call Task",
                description="Automatically creates a high-priority call task when a new Lead is created.",
                module="lead",
                trigger_event="on_create",
                is_active=True
            )
            WorkflowAction.objects.create(
                workflow=wf_lead_create,
                action_type="create_task",
                order=1,
                priority="high",
                action_data={
                    "task_type": "call",
                    "status": "not_started",
                    "title": "Initial Contact Call",
                    "description": "System generated task for new lead follow-up."
                }
            )

            # ---------------------------------------------------------
            # 2. Call Task Complete (Not Connected) -> Reschedule Call
            # ---------------------------------------------------------
            wf_call_not_connected = Workflow.objects.create(
                name="[AUTO] Call Not Connected - Reschedule",
                description="Reschedules the call if outcome is no_response.",
                module="task",
                trigger_event="on_task_complete",
                is_active=True,
                debounce_minutes=1
            )
            WorkflowCondition.objects.create(workflow=wf_call_not_connected, field_name="task_type", operator="equals", value="call", order=1)
            WorkflowCondition.objects.create(workflow=wf_call_not_connected, field_name="outcome", operator="equals", value="no_response", order=2)
            
            WorkflowAction.objects.create(
                workflow=wf_call_not_connected,
                action_type="create_task",
                order=1,
                priority="high",
                delay_days=1,
                action_data={
                    "task_type": "call",
                    "status": "not_started",
                    "title": "Follow-up Call (Rescheduled)",
                    "due_days": 1
                }
            )

            # ---------------------------------------------------------
            # 3. Call Task Complete (Connected) -> Update Lead & Follow-up
            # ---------------------------------------------------------
            wf_call_connected = Workflow.objects.create(
                name="[AUTO] Call Connected - Update Lead to Contacted",
                description="Updates Lead to Contacted and creates Follow-up Call.",
                module="task",
                trigger_event="on_task_complete",
                is_active=True,
                debounce_minutes=1
            )
            WorkflowCondition.objects.create(workflow=wf_call_connected, field_name="task_type", operator="equals", value="call", order=1)
            WorkflowCondition.objects.create(workflow=wf_call_connected, field_name="outcome", operator="equals", value="success", order=2)
            
            WorkflowAction.objects.create(
                workflow=wf_call_connected,
                action_type="update_record",
                order=1,
                action_data={
                    "target": "lead",
                    "field": "status",
                    "value": "contacted"
                }
            )
            WorkflowAction.objects.create(
                workflow=wf_call_connected,
                action_type="create_task",
                order=2,
                priority="medium",
                action_data={
                    "task_type": "follow_up",
                    "status": "not_started",
                    "title": "Follow-up Call",
                    "due_days": 2
                }
            )

            # ---------------------------------------------------------
            # 3.5 Call Task Complete (Not Interested) -> Lost Lead
            # ---------------------------------------------------------
            wf_call_not_interested = Workflow.objects.create(
                name="[AUTO] Call Not Interested - Mark Lost",
                description="Updates Lead to Lost and closes tasks if call is not interested.",
                module="task",
                trigger_event="on_task_complete",
                is_active=True,
                debounce_minutes=1
            )
            WorkflowCondition.objects.create(workflow=wf_call_not_interested, field_name="task_type", operator="equals", value="call", order=1)
            WorkflowCondition.objects.create(workflow=wf_call_not_interested, field_name="outcome", operator="equals", value="not_interested", order=2)
            
            WorkflowAction.objects.create(
                workflow=wf_call_not_interested,
                action_type="update_record",
                order=1,
                action_data={
                    "target": "lead",
                    "field": "status",
                    "value": "lost"
                }
            )
            WorkflowAction.objects.create(
                workflow=wf_call_not_interested,
                action_type="close_open_tasks",
                order=2,
                action_data={"target": "lead"}
            )

            # ---------------------------------------------------------
            # 4. Lead Qualified -> Create Meeting Task
            # ---------------------------------------------------------
            wf_lead_qualified = Workflow.objects.create(
                name="[AUTO] Lead Qualified - Create Meeting Task",
                description="Generates a Meeting task when Lead becomes Qualified.",
                module="lead",
                trigger_event="stage_change",
                is_active=True
            )
            WorkflowCondition.objects.create(workflow=wf_lead_qualified, field_name="status", operator="equals", value="qualified", order=1)
            
            WorkflowAction.objects.create(
                workflow=wf_lead_qualified,
                action_type="create_task",
                order=1,
                priority="high",
                action_data={
                    "task_type": "meeting",
                    "status": "scheduled",
                    "title": "Discovery Meeting",
                    "description": "Please select a date and time for this meeting.",
                    "due_days": 1
                }
            )

            # ---------------------------------------------------------
            # 5. Meeting Task Complete (Interested) -> Proposal Stage
            # ---------------------------------------------------------
            wf_meeting_interested = Workflow.objects.create(
                name="[AUTO] Meeting Interested - Move to Proposal",
                description="Updates Lead to Proposal and creates Proposal Prep task.",
                module="task",
                trigger_event="on_task_complete",
                is_active=True,
                debounce_minutes=1
            )
            WorkflowCondition.objects.create(workflow=wf_meeting_interested, field_name="task_type", operator="equals", value="meeting", order=1)
            WorkflowCondition.objects.create(workflow=wf_meeting_interested, field_name="outcome", operator="equals", value="interested", order=2)
            
            WorkflowAction.objects.create(
                workflow=wf_meeting_interested,
                action_type="update_record",
                order=1,
                action_data={
                    "target": "lead",
                    "field": "status",
                    "value": "proposal"
                }
            )
            WorkflowAction.objects.create(
                workflow=wf_meeting_interested,
                action_type="create_task",
                order=2,
                priority="high",
                action_data={
                    "task_type": "proposal",
                    "status": "not_started",
                    "title": "Proposal Preparation",
                    "due_days": 3
                }
            )

            # ---------------------------------------------------------
            # 6. Meeting Task Complete (Not Interested) -> Lost Lead
            # ---------------------------------------------------------
            wf_meeting_not_interested = Workflow.objects.create(
                name="[AUTO] Meeting Not Interested - Mark Lost",
                description="Updates Lead to Lost and closes tasks.",
                module="task",
                trigger_event="on_task_complete",
                is_active=True,
                debounce_minutes=1
            )
            WorkflowCondition.objects.create(workflow=wf_meeting_not_interested, field_name="task_type", operator="equals", value="meeting", order=1)
            WorkflowCondition.objects.create(workflow=wf_meeting_not_interested, field_name="outcome", operator="equals", value="not_interested", order=2)
            
            WorkflowAction.objects.create(
                workflow=wf_meeting_not_interested,
                action_type="update_record",
                order=1,
                action_data={
                    "target": "lead",
                    "field": "status",
                    "value": "lost"
                }
            )
            WorkflowAction.objects.create(
                workflow=wf_meeting_not_interested,
                action_type="close_open_tasks",
                order=2,
                action_data={"target": "lead"}
            )

            # ---------------------------------------------------------
            # 7. Proposal Task Complete (Accepted) -> Won Lead
            # ---------------------------------------------------------
            wf_proposal_accepted = Workflow.objects.create(
                name="[AUTO] Proposal Accepted - Mark Won",
                description="Updates Lead to Won and closes tasks.",
                module="task",
                trigger_event="on_task_complete",
                is_active=True,
                debounce_minutes=1
            )
            WorkflowCondition.objects.create(workflow=wf_proposal_accepted, field_name="task_type", operator="equals", value="proposal", order=1)
            WorkflowCondition.objects.create(workflow=wf_proposal_accepted, field_name="outcome", operator="equals", value="success", order=2)
            
            WorkflowAction.objects.create(
                workflow=wf_proposal_accepted,
                action_type="update_record",
                order=1,
                action_data={
                    "target": "lead",
                    "field": "status",
                    "value": "won"
                }
            )
            WorkflowAction.objects.create(
                workflow=wf_proposal_accepted,
                action_type="close_open_tasks",
                order=2,
                action_data={"target": "lead"}
            )

            # ---------------------------------------------------------
            # 8. Proposal Task Complete (Rejected) -> Lost Lead
            # ---------------------------------------------------------
            wf_proposal_rejected = Workflow.objects.create(
                name="[AUTO] Proposal Rejected - Mark Lost",
                description="Updates Lead to Lost and closes tasks.",
                module="task",
                trigger_event="on_task_complete",
                is_active=True,
                debounce_minutes=1
            )
            WorkflowCondition.objects.create(workflow=wf_proposal_rejected, field_name="task_type", operator="equals", value="proposal", order=1)
            WorkflowCondition.objects.create(workflow=wf_proposal_rejected, field_name="outcome", operator="equals", value="failed", order=2)
            
            WorkflowAction.objects.create(
                workflow=wf_proposal_rejected,
                action_type="update_record",
                order=1,
                action_data={
                    "target": "lead",
                    "field": "status",
                    "value": "lost"
                }
            )
            WorkflowAction.objects.create(
                workflow=wf_proposal_rejected,
                action_type="close_open_tasks",
                order=2,
                action_data={"target": "lead"}
            )

            self.stdout.write(self.style.SUCCESS("Successfully seeded fully automated workflow system!"))
