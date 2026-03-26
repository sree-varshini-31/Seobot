from django.contrib import admin
from .models import APIErrorsLog

@admin.register(APIErrorsLog)
class APIErrorsLogAdmin(admin.ModelAdmin):
    list_display = ["endpoint", "status_code", "created_at"]
    list_filter = ["status_code", "created_at"]
    search_fields = ["endpoint", "error_message"]
    ordering = ["-created_at"]
