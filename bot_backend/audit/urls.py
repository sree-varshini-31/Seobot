from django.urls import path
from .views import audit_website, get_audit_report

urlpatterns = [
    path("website/", audit_website, name="audit-website"),
    path("report/", get_audit_report, name="audit-report"),
]