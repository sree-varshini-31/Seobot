from django.contrib import admin
from .models import Article, ContentPlan

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title", "project", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["title", "project__name"]
    ordering = ["-created_at"]

@admin.register(ContentPlan)
class ContentPlanAdmin(admin.ModelAdmin):
    list_display = ["title", "project", "created_at"]
    search_fields = ["title", "project__name"]
