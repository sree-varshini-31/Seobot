from django.urls import path
from .views import audit_website

urlpatterns = [
    path("website/", audit_website, name="audit-website"),
]