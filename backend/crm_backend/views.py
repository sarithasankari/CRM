from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

from leads.models import Lead
from deals.models import Deal
from tasks.models import Task
from activities.models import Activity, Meeting
from users.models import User

class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Base querysets
        if user.role == 'admin':
            leads_qs = Lead.objects.all()
            deals_qs = Deal.objects.all()
            tasks_qs = Task.objects.all()
        elif user.role == 'manager' and user.team:
            leads_qs = Lead.objects.filter(assigned_to__team=user.team)
            deals_qs = Deal.objects.filter(contact__leads__assigned_to__team=user.team) # approximate
            tasks_qs = Task.objects.filter(assigned_to__team=user.team)
        else:
            leads_qs = Lead.objects.filter(assigned_to=user)
            # In absence of assigned_to on Deal, we skip filtering for now
            deals_qs = Deal.objects.all()
            tasks_qs = Task.objects.filter(assigned_to=user)

        total_leads = leads_qs.count()
        active_deals = deals_qs.exclude(stage__in=['Closed Won', 'Closed Lost', 'Closed Lost to Competition']).count()
        pipeline_value = deals_qs.exclude(stage__in=['Closed Lost', 'Closed Lost to Competition']).aggregate(total=Sum('value'))['total'] or 0
        open_tasks = tasks_qs.exclude(status='Completed').count()

        # Monthly Revenue Projection (Won deals)
        range_param = request.query_params.get('range', 'monthly')
        if range_param == 'monthly':
            days = 30
        elif range_param == 'quarterly':
            days = 90
        elif range_param == 'annual':
            days = 365
        else:
            days = 30
            
        start_date = timezone.now() - timedelta(days=days)
        
        from collections import defaultdict
        
        deals = deals_qs.filter(
            stage='Closed Won', 
            created_at__gte=start_date
        ).values('created_at', 'value')
        
        monthly_data = defaultdict(float)
        for d in deals:
            # Group by month in Python
            month_key = d['created_at'].replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_data[month_key] += float(d['value'] or 0)
            
        chart_data = []
        for month, total in sorted(monthly_data.items()):
            month_name = month.strftime("%b").upper()
            chart_data.append({
                'name': month_name,
                'actual': total,
                'forecast': total * 1.2 # dummy forecast calculation
            })

        # Recent activities (Live Pulse replacement)
        # Using Tasks and Meetings
        recent_activities = []
        for t in tasks_qs.order_by('-created_at')[:3]:
            recent_activities.append({
                'id': f"task_{t.id}",
                'type': 'task',
                'title': t.title,
                'meta': f"{t.assigned_to.username if t.assigned_to else 'Unassigned'} • {t.created_at.strftime('%Y-%m-%d %H:%M')}",
                'badge': t.status,
                'badgeColor': 'bg-rose-50 text-rose-600' if t.status == 'Pending' else 'bg-emerald-50 text-emerald-600',
                'iconColor': 'bg-rose-100 text-rose-600' if t.status == 'Pending' else 'bg-emerald-100 text-emerald-600',
            })
            
        for m in Meeting.objects.all().order_by('-created_at')[:2]:
            recent_activities.append({
                'id': f"meeting_{m.id}",
                'type': 'meeting',
                'title': m.title,
                'meta': f"{m.start_time.strftime('%Y-%m-%d %H:%M') if m.start_time else 'TBD'}",
                'badge': m.meeting_type,
                'badgeColor': 'bg-blue-50 text-blue-600',
                'iconColor': 'bg-blue-100 text-blue-600',
            })

        from activities.models import Campaign
        total_budget = Campaign.objects.aggregate(total=Sum('budget'))['total'] or 0
        total_mkt_revenue = Campaign.objects.aggregate(total=Sum('actual_revenue'))['total'] or 0
        marketing_roi = (float(total_mkt_revenue) / float(total_budget) * 100) if float(total_budget) > 0 else 0

        # KPIs
        win_ratio = deals_qs.filter(stage='Closed Won').count() / deals_qs.count() * 100 if deals_qs.count() > 0 else 0
        avg_deal_size = pipeline_value / active_deals if active_deals > 0 else 0
        conversion_rate = deals_qs.count() / total_leads * 100 if total_leads > 0 else 0
        
        kpis = [
          { 'label': 'Conversion Rate', 'value': f"{round(conversion_rate, 1)}%", 'trend': '+0%', 'color': 'blue' },
          { 'label': 'Avg Deal Size', 'value': float(avg_deal_size), 'trend': '+0%', 'color': 'emerald' },
          { 'label': 'Marketing ROI', 'value': f"{round(marketing_roi, 1)}%", 'trend': '+5%', 'color': 'indigo' },
          { 'label': 'Win Ratio', 'value': f"{round(win_ratio, 1)}%", 'trend': '+0%', 'color': 'indigo' }
        ]

        # Lead Distribution by Source
        lead_sources = leads_qs.values('source').annotate(count=Count('id')).order_by('-count')
        sources_data = []
        total_leads_count = total_leads if total_leads > 0 else 1
        for ls in lead_sources:
            source_key = ls['source'] or 'other'
            source_display = dict(Lead.SOURCE_CHOICES).get(source_key, 'Other')
            sources_data.append({
                'name': source_display,
                'value': round(ls['count'] / total_leads_count * 100, 1),
                'color': 'blue-500'
            })

        return Response({
            'stats': {
                'leads': total_leads,
                'deals': active_deals,
                'revenue': float(pipeline_value),
                'tasks': open_tasks,
                'marketing_roi': f"{round(marketing_roi, 1)}%"
            },
            'chartData': chart_data,
            'activities': recent_activities,
            'kpis': kpis,
            'leadSources': sources_data
        })


class TeamPerformanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        team_data = []
        
        range_param = request.query_params.get('range', 'monthly')
        if range_param == 'monthly':
            days = 30
        elif range_param == 'quarterly':
            days = 90
        elif range_param == 'annual':
            days = 365
        else:
            days = 30
            
        start_date = timezone.now() - timedelta(days=days)

        for user in users:
            user_deals = Deal.objects.filter(owner=user, created_at__gte=start_date)
            won_deals  = user_deals.filter(stage='Closed Won').count()
            total_deals = user_deals.count()
            win_rate = (won_deals / total_deals * 100) if total_deals > 0 else 0
            revenue = user_deals.filter(stage='Closed Won').aggregate(
                total=Sum('value')
            )['total'] or 0

            team_data.append({
                'id':        user.id,
                'name':      user.get_full_name() or user.username,
                'role':      user.get_role_display(),
                'deals':     total_deals,
                'revenue':   float(revenue),
                'winRate':   round(win_rate, 1),
                'trend':      'up' if win_rate > 50 else 'down',
                'trendColor': 'text-emerald-500' if win_rate > 50 else 'text-rose-500',
            })

        return Response(team_data)
