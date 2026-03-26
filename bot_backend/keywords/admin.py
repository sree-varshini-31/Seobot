from django.contrib import admin
from .models import Keyword, KeywordTrend, Competitor

@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ["id", "keyword", "project", "intent_type", "search_volume", "difficulty_score"]
    list_filter = ["intent_type"]
    search_fields = ["keyword", "project__name"]

@admin.register(KeywordTrend)
class KeywordTrendAdmin(admin.ModelAdmin):
    list_display = ["id", "keyword", "project", "ranking_position", "search_volume", "recorded_at"]
    ordering = ["-recorded_at"]

@admin.register(Competitor)
class CompetitorAdmin(admin.ModelAdmin):
    list_display = ["id", "keyword", "project", "ranking_position", "competitor_url"]
    search_fields = ["keyword", "project__name"]
