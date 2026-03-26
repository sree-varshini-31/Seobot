from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "url", "user", "created_at"]
    list_filter = ["created_at", "user"]
    search_fields = ["name", "url", "user__username"]
    ordering = ["-created_at"]
