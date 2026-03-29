from django.urls import path
from . import views

urlpatterns = [
    # ── Public ──────────────────────────────
    path("register/", views.register),       # POST — anyone
    path("login/", views.login),             # POST — anyone

    # ── User (login required) ────────────────
    path("logout/", views.logout),           # POST — logged in user
    path("profile/", views.profile),         # GET, PATCH — own profile
    path("profile/insights/", views.profile_insights),  # GET — charts / history
    path("profile/avatar/", views.profile_avatar),  # POST upload, DELETE reset
    path("profile/password/", views.change_password),  # POST

    # ── Admin (admin login required) ─────────
    path("admin/profile/", views.admin_profile),  # GET — admin profile + overview
    path("admin/users/", views.admin_users),       # GET — all users data
    path("admin/stats/", views.admin_stats),       # GET — platform statistics
]
