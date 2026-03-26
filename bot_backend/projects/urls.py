from django.urls import path
from .views import (
    api_root, analyze_site,
    get_projects, get_analysis_result, analytics_dashboard,
    admin_all_projects, admin_analytics
)

urlpatterns = [
    # ── Public ──────────────────────────
    path("", api_root),

    # ── User endpoints ───────────────────
    path("analyze/", analyze_site),                          # analyze any URL
    path("data/", get_projects),                             # MY projects only
    path("data/<int:project_id>/", get_analysis_result),     # MY project result
    path("analytics/<int:project_id>/", analytics_dashboard), # MY project analytics

    # ── Admin endpoints ──────────────────
    path("admin/projects/", admin_all_projects),             # ALL projects
    path("admin/analytics/<int:project_id>/", admin_analytics), # ANY project analytics
]
