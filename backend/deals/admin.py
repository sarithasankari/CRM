from django.contrib import admin
from .models import Deal

@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ('title', 'value', 'stage', 'contact', 'expected_close_date')
    list_filter = ('stage',)
    search_fields = ('title',)
