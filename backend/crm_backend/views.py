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
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_revenue = deals_qs.filter(
            stage='Closed Won', 
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=Sum('value')
        ).order_by('month')

        chart_data = []
        for mr in monthly_revenue:
            month_name = mr['month'].strftime("%b").upper()
            chart_data.append({
                'name': month_name,
                'actual': float(mr['total']),
                'forecast': float(mr['total']) * 1.2 # dummy forecast calculation
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
                'meta': f"{m.date} • {m.time}",
                'badge': m.type,
                'badgeColor': 'bg-blue-50 text-blue-600',
                'iconColor': 'bg-blue-100 text-blue-600',
            })

        # KPIs
        win_ratio = deals_qs.filter(stage='Closed Won').count() / deals_qs.count() * 100 if deals_qs.count() > 0 else 0
        avg_deal_size = pipeline_value / active_deals if active_deals > 0 else 0
        conversion_rate = deals_qs.count() / total_leads * 100 if total_leads > 0 else 0
        
        kpis = [
          { 'label': 'Conversion Rate', 'value': f"{round(conversion_rate, 1)}%", 'trend': '+0%', 'color': 'blue' },
          { 'label': 'Avg Deal Size', 'value': f"${float(avg_deal_size):,.0f}", 'trend': '+0%', 'color': 'emerald' },
          { 'label': 'Cycle Velocity', 'value': '18 Days', 'trend': '-0 Days', 'color': 'amber' },
          { 'label': 'Win Ratio', 'value': f"{round(win_ratio, 1)}%", 'trend': '+0%', 'color': 'indigo' }
        ]

        return Response({
            'stats': {
                'leads': total_leads,
                'deals': active_deals,
                'revenue': float(pipeline_value),
                'tasks': open_tasks
            },
            'chartData': chart_data,
            'activities': recent_activities,
            'kpis': kpis
        })


class TeamPerformanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.prefetch_related('owned_deals').all()
        team_data = []

        for user in users:
            user_deals = Deal.objects.filter(owner=user)
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
                'revenue':   f"${float(revenue):,.2f}",
                'winRate':   round(win_rate, 1),
                'trend':      'up' if win_rate > 50 else 'down',
                'trendColor': 'text-emerald-500' if win_rate > 50 else 'text-rose-500',
            })

        return Response(team_data)
