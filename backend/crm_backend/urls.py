"""
URL configuration for crm_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from leads.views import LeadViewSet
from contacts.views import ContactViewSet
from deals.views import DealViewSet
from tasks.views import TaskViewSet
from activities.views import ActivityViewSet, MeetingViewSet, CallViewSet, CampaignViewSet
from projects.views import ProjectViewSet
from workflows.views import WorkflowViewSet, WorkflowLogViewSet
from quotes.views import QuoteViewSet
from invoices.views import InvoiceViewSet
from support.views import CaseViewSet

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'deals', DealViewSet, basename='deal')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'activities', ActivityViewSet)
router.register(r'meetings', MeetingViewSet)
router.register(r'calls', CallViewSet, basename='call')
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'projects', ProjectViewSet)
router.register(r'workflows', WorkflowViewSet)
router.register(r'workflow-logs', WorkflowLogViewSet)
router.register(r'quotes', QuoteViewSet, basename='quote')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'cases', CaseViewSet)

from .views import DashboardStatsAPIView, TeamPerformanceAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/analytics/dashboard/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('api/analytics/team/', TeamPerformanceAPIView.as_view(), name='team-performance'),
    path('api/', include(router.urls)),
]
