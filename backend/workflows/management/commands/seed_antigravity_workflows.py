from django.core.management.base import BaseCommand
from workflows.models import Workflow, WorkflowCondition, WorkflowAction

class Command(BaseCommand):
    help = 'Seeds the database with Antigravity Workflows'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding Antigravity Workflows...')
        
        # Clear existing
        Workflow.objects.all().delete()

        # 1. The Floating Lead Problem
        w1 = Workflow.objects.create(name='The Floating Lead Problem', module='lead', trigger_event='create')
        WorkflowCondition.objects.create(workflow=w1, field_name='status', operator='equals', value='New')
        WorkflowAction.objects.create(workflow=w1, action_type='send_email', action_data={"template": "Grounding Email", "timing": "instant"})
        WorkflowAction.objects.create(workflow=w1, action_type='assign_user', action_data={"role": "Sales Rep", "timing": "instant"})
        WorkflowAction.objects.create(workflow=w1, action_type='create_task', action_data={"title": "Establish Lead Connection (Gravity Task)", "timing": "instant"})

        # 2. Deal Anti-Gravity Field
        w2 = Workflow.objects.create(name='Deal Anti-Gravity Field', module='deal', trigger_event='update')
        WorkflowCondition.objects.create(workflow=w2, field_name='amount', operator='gt', value='49999')
        WorkflowAction.objects.create(workflow=w2, action_type='create_task', action_data={"title": "Check Deal Gravity", "timing": "instant"})
        WorkflowAction.objects.create(workflow=w2, action_type='send_notification', action_data={"message": "Gravity Anomaly Detected on Deal", "timing": "instant"})
        
        # 3. Contact Gravity Wells
        w3 = Workflow.objects.create(name='Contact Gravity Wells', module='contact', trigger_event='update')
        WorkflowAction.objects.create(workflow=w3, action_type='update_field', action_data={"field": "gravity_score", "calculation": "deals+activities+tenure", "timing": "instant"})
        
        # 4. Account Orbital Dynamics
        w4 = Workflow.objects.create(name='Account Orbital Dynamics', module='lead', trigger_event='update') # using lead for account if 'account' not in choices
        WorkflowAction.objects.create(workflow=w4, action_type='create_task', action_data={"title": "Account Orbit Check", "timing": "instant"})

        # 5. Floating Tasks
        w5 = Workflow.objects.create(name='Floating Tasks (Never Completed)', module='task', trigger_event='create')
        WorkflowCondition.objects.create(workflow=w5, field_name='status', operator='not_equals', value='Completed')
        WorkflowAction.objects.create(workflow=w5, action_type='send_notification', action_data={"message": "Task Gravity Urgency Check", "timing": "instant"})

        # 8. Floating Support Cases
        w8 = Workflow.objects.create(name='Floating Support Cases', module='case', trigger_event='create')
        WorkflowAction.objects.create(workflow=w8, action_type='assign_user', action_data={"role": "Support Agent (Gravity Assigned)", "timing": "instant"})
        WorkflowAction.objects.create(workflow=w8, action_type='send_notification', action_data={"message": "Case Priority Gravity Level Set", "timing": "instant"})

        # 11. Quote Gravity Acceleration
        w11 = Workflow.objects.create(name='Quote Gravity Acceleration', module='quote', trigger_event='create')
        WorkflowAction.objects.create(workflow=w11, action_type='send_email', action_data={"template": "Quote Created - High Gravity", "timing": "instant"})

        # 12. Invoice Gravity Payment
        w12 = Workflow.objects.create(name='Invoice Gravity Payment', module='invoice', trigger_event='create')
        WorkflowAction.objects.create(workflow=w12, action_type='send_email', action_data={"template": "Invoice Sent - Payment Gravity", "timing": "instant"})

        # 6. Meeting Gravity Wells
        w6 = Workflow.objects.create(name='Meeting Gravity Wells', module='task', trigger_event='create')
        WorkflowAction.objects.create(workflow=w6, action_type='send_email', action_data={"template": "Meeting Gravity Reminder", "timing": "scheduled"})

        # 7. Call Gravity Momentum
        w7 = Workflow.objects.create(name='Call Gravity Momentum', module='task', trigger_event='create')
        WorkflowAction.objects.create(workflow=w7, action_type='update_field', action_data={"field": "call_gravity", "calculation": "priority+importance+deal_value", "timing": "instant"})

        # 9. Feedback Gravity Field
        w9 = Workflow.objects.create(name='Feedback Gravity Field', module='case', trigger_event='create')
        WorkflowAction.objects.create(workflow=w9, action_type='send_notification', action_data={"message": "Analyze Feedback Gravity", "timing": "instant"})

        # 16. Project Timeline Gravity
        w16 = Workflow.objects.create(name='Project Timeline Gravity', module='project', trigger_event='create')
        WorkflowAction.objects.create(workflow=w16, action_type='create_task', action_data={"title": "Project Gravity Milestone Check", "timing": "scheduled"})

        # 18. Revenue Projection Gravity
        w18 = Workflow.objects.create(name='Revenue Projection Gravity', module='deal', trigger_event='update')
        WorkflowAction.objects.create(workflow=w18, action_type='update_field', action_data={"field": "revenue_gravity", "calculation": "probability*amount", "timing": "instant"})

        # 21. Lead to Deal Gravity Journey
        w21 = Workflow.objects.create(name='Lead to Deal Gravity Journey', module='lead', trigger_event='update')
        WorkflowCondition.objects.create(workflow=w21, field_name='status', operator='equals', value='Qualified')
        WorkflowAction.objects.create(workflow=w21, action_type='create_task', action_data={"title": "Peak Gravity - Deal Conversion", "timing": "instant"})

        self.stdout.write(self.style.SUCCESS('Successfully seeded Antigravity Workflows!'))
