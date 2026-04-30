from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count
from deals.models import Deal
from leads.models import Lead
from tasks.models import Task
from activities.models import Activity
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_dashboard(request):
    user = request.user
    deals = Deal.objects.all()
    leads = Lead.objects.all()

    # Filter based on role
    if user.role != 'admin':
        if user.role == 'manager' and user.team:
            leads = leads.filter(assigned_to__team=user.team)
            deals = deals.filter(assigned_to__team=user.team)
            tasks = Task.objects.filter(assigned_to__team=user.team)
            activities = Activity.objects.filter(created_by__team=user.team)
        else:
            leads = leads.filter(assigned_to=user)
            deals = deals.filter(assigned_to=user)
            tasks = Task.objects.filter(assigned_to=user)
            activities = Activity.objects.filter(created_by=user)
    else:
        tasks = Task.objects.all()
        activities = Activity.objects.all()

    # KPIs
    total_leads = leads.count()
    active_deals = deals.exclude(stage__in=['Closed Won', 'Closed Lost', 'Closed Lost to Competition']).count()
    revenue = deals.filter(stage='Closed Won').aggregate(total=Sum('value'))['total'] or 0
    pending_tasks = tasks.exclude(status='Completed').count()

    # Monthly Revenue Trends (last 6 months)
    six_months_ago = timezone.now() - timedelta(days=180)
    monthly_data = deals.filter(stage='Closed Won', expected_close_date__gte=six_months_ago) \
        .annotate(month=TruncMonth('expected_close_date')) \
        .values('month') \
        .annotate(actual=Sum('value')) \
        .order_by('month')

    # Also calculate projected (all active deals expected to close)
    projected_data = deals.exclude(stage__in=['Closed Lost', 'Closed Lost to Competition']) \
        .filter(expected_close_date__gte=six_months_ago) \
        .annotate(month=TruncMonth('expected_close_date')) \
        .values('month') \
        .annotate(projected=Sum('value')) \
        .order_by('month')

    months_map = {}
    for i in range(6):
        d = timezone.now() - timedelta(days=30 * (5 - i))
        month_name = d.strftime('%b')
        months_map[month_name] = {'name': month_name, 'actual': 0, 'projected': 0}

    for item in monthly_data:
        if item['month']:
            m_name = item['month'].strftime('%b')
            if m_name in months_map:
                months_map[m_name]['actual'] = float(item['actual'] or 0)
                
    for item in projected_data:
        if item['month']:
            m_name = item['month'].strftime('%b')
            if m_name in months_map:
                months_map[m_name]['projected'] = float(item['projected'] or 0)

    chart_data = list(months_map.values())

    # Recent Activities (Live Pulse)
    recent_acts = activities.order_by('-created_at')[:5]
    live_pulse = []
    for act in recent_acts:
        # Determine color based on type
        badge_color = 'bg-blue-50 text-blue-600'
        icon_color = 'bg-blue-100 text-blue-600'
        
        if act.type == 'meeting':
            badge_color = 'bg-emerald-50 text-emerald-600'
            icon_color = 'bg-emerald-100 text-emerald-600'
        elif act.type == 'call':
            badge_color = 'bg-amber-50 text-amber-600'
            icon_color = 'bg-amber-100 text-amber-600'
            
        # time ago string
        delta = timezone.now() - act.created_at
        if delta.days > 0:
            time_ago = f"{delta.days} days ago"
        elif delta.seconds // 3600 > 0:
            time_ago = f"{delta.seconds // 3600} hours ago"
        else:
            time_ago = f"{delta.seconds // 60} mins ago"

        user_name = act.created_by.get_full_name() if act.created_by else 'System'
        
        live_pulse.append({
            'id': act.id,
            'type': act.type,
            'title': act.title or f"{act.get_type_display()} Activity",
            'meta': f"{user_name} • {time_ago}",
            'badge': act.type.upper(),
            'badgeColor': badge_color,
            'iconColor': icon_color,
        })

    # Deal Velocity (Top deals)
    top_deals = deals.exclude(stage__in=['Closed Lost', 'Closed Lost to Competition']).order_by('-value')[:5]
    deal_closures = []
    for d in top_deals:
        deal_closures.append({
            'id': d.id,
            'company': d.title,
            'contact': d.contact.name if d.contact else 'Unassigned',
            'value': f"${float(d.value):,.0f}",
            'probability': d.probability,
            'status': d.stage,
            'statusColor': 'bg-emerald-50 text-emerald-600' if d.stage == 'Closed Won' else 'bg-blue-50 text-blue-600'
        })

    # Conversion Rate calculation
    qualified_leads = leads.filter(status='qualified').count()
    conversion_rate = (qualified_leads / total_leads * 100) if total_leads > 0 else 0
    avg_deal_size = deals.filter(stage='Closed Won').aggregate(avg=Avg('value'))['avg'] or 0

    # Team Performance (Leaderboard)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    team_data = []
    
    # Depending on role, get users to show
    if user.role == 'admin':
        users_to_evaluate = User.objects.all()
    elif user.role == 'manager' and user.team:
        users_to_evaluate = User.objects.filter(team=user.team)
    else:
        users_to_evaluate = User.objects.filter(id=user.id)
        
    for u in users_to_evaluate:
        u_deals = Deal.objects.filter(assigned_to=u)
        u_deals_count = u_deals.count()
        u_won_deals = u_deals.filter(stage='Closed Won')
        u_won_count = u_won_deals.count()
        u_revenue = u_won_deals.aggregate(total=Sum('value'))['total'] or 0
        u_win_rate = (u_won_count / u_deals_count * 100) if u_deals_count > 0 else 0
        
        # calculate trend (simple placeholder logic for now)
        trend = 'flat'
        trend_color = 'text-slate-300'
        if u_win_rate > 50:
            trend = 'up'
            trend_color = 'text-emerald-500'
        elif u_win_rate < 20 and u_deals_count > 0:
            trend = 'down'
            trend_color = 'text-rose-500'
            
        if u_deals_count > 0: # Only show users with deals
            team_data.append({
                'id': u.id,
                'name': u.get_full_name() or u.username or u.email,
                'role': u.get_role_display() if hasattr(u, 'get_role_display') else u.role,
                'deals': u_deals_count,
                'revenue': f"${float(u_revenue):,.0f}",
                'winRate': round(u_win_rate),
                'trend': trend,
                'trendColor': trend_color
            })
            
    # Sort by revenue descending
    team_data.sort(key=lambda x: float(x['revenue'].replace('$', '').replace(',', '')), reverse=True)

    return Response({
        'kpis': {
            'leads': total_leads,
            'deals': active_deals,
            'revenue': float(revenue),
            'tasks': pending_tasks
        },
        'trends': chart_data,
        'live_pulse': live_pulse,
        'deal_closures': deal_closures,
        'team_performance': team_data,
        'analytics': {
            'conversion_rate': f"{conversion_rate:.1f}%",
            'avg_deal_size': f"${float(avg_deal_size):,.0f}",
            'cycle_velocity': '18 Days',
            'win_ratio': f"{(deals.filter(stage='Closed Won').count() / max(1, deals.filter(stage__in=['Closed Won', 'Closed Lost', 'Closed Lost to Competition']).count()) * 100):.1f}%"
        }
    })
