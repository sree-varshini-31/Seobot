from django.contrib import admin
from .models import SEOAuditHistory, SEOReport

@admin.register(SEOAuditHistory)
class SEOAuditHistoryAdmin(admin.ModelAdmin):
    list_display = ["id", "project", "seo_score", "issues_count", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["project__name", "project__url"]
    ordering = ["-created_at"]
