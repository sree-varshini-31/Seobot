from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", RedirectView.as_view(url="/api/", permanent=False)),

    # API ROUTES
    path("api/", include("projects.urls")),
    path("api/audit/", include("audit.urls")),
    path("api/generator/", include("generator.urls")),

    # AUTH ROUTES
    path("api/auth/", include("accounts.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
