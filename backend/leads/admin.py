from django.contrib import admin
from .models import Lead

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'company', 'status', 'assigned_to', 'created_at')
    list_filter = ('status', 'source')
    search_fields = ('name', 'email', 'company')
