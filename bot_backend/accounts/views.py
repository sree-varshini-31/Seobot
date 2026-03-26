from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from rest_framework.decorators import throttle_classes
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken


class LoginThrottle(AnonRateThrottle):
    scope = 'login'


class RegisterThrottle(AnonRateThrottle):
    scope = 'register'


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def _is_admin(user):
    """Admin = is_staff. No superuser distinction."""
    return user.is_staff


def _admin_required(request):
    if not request.user.is_authenticated:
        return Response({"success": False, "error": "Login required"}, status=401)
    if not _is_admin(request.user):
        return Response({"success": False, "error": "Admin access required"}, status=403)
    return None


# ─────────────────────────────────────────
# PUBLIC
# ─────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RegisterThrottle])
def register(request):
    # Sanitize inputs — strip whitespace
    username = (request.data.get("username") or "").strip()
    email    = (request.data.get("email") or "").strip().lower()
    password = (request.data.get("password") or "").strip()

    if not username or not password or not email:
        return Response({"success": False, "error": "username, email and password are required"}, status=400)

    # Username length check
    if len(username) < 3:
        return Response({"success": False, "error": "Username must be at least 3 characters"}, status=400)
    if len(username) > 30:
        return Response({"success": False, "error": "Username must be under 30 characters"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"success": False, "error": "Username already exists"}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"success": False, "error": "Email already registered"}, status=400)

    # Validate password strength using Django's built-in validators
    # Checks: min length (8), not too common, not entirely numeric
    try:
        validate_password(password)
    except ValidationError as e:
        return Response({"success": False, "error": list(e.messages)}, status=400)

    # New registrations are always regular users — never auto-elevated
    user = User.objects.create_user(username=username, email=email, password=password)
    tokens = get_tokens(user)

    return Response({
        "success": True,
        "message": "Account created successfully",
        "user": {"id": user.id, "username": user.username, "email": user.email, "role": "user"},
        "tokens": tokens,
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login(request):
    username = (request.data.get("username") or "").strip()
    password = (request.data.get("password") or "").strip()

    if not username or not password:
        return Response({"success": False, "error": "username and password are required"}, status=400)

    user = authenticate(username=username, password=password)
    if not user:
        return Response({"success": False, "error": "Invalid credentials"}, status=401)

    tokens = get_tokens(user)
    return Response({
        "success": True,
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": "admin" if _is_admin(user) else "user",
        },
        "tokens": tokens,
    })


# ─────────────────────────────────────────
# USER (login required)
# ─────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        token = RefreshToken(request.data.get("refresh"))
        token.blacklist()
    except Exception:
        pass
    return Response({"success": True, "message": "Logged out successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    """Each user sees only their own data."""
    user = request.user
    from projects.models import Project
    from audit.models import SEOAuditHistory

    from django.db.models import OuterRef, Subquery
    latest_score_sq = SEOAuditHistory.objects.filter(
        project=OuterRef('pk')).order_by('-created_at').values('seo_score')[:1]
    latest_issues_sq = SEOAuditHistory.objects.filter(
        project=OuterRef('pk')).order_by('-created_at').values('issues_count')[:1]

    projects = Project.objects.filter(user=user).annotate(
        latest_score=Subquery(latest_score_sq),
        latest_issues=Subquery(latest_issues_sq),
    )
    latest_scores = []
    for p in projects:
        if p.latest_score is not None:
            latest_scores.append({
                "project": p.name,
                "url": p.url,
                "score": p.latest_score,
                "issues": p.latest_issues or 0,
                "last_analyzed_at": p.last_analyzed_at.isoformat() if p.last_analyzed_at else None,
                "cache_fresh": p.is_cache_valid(),
            })

    return Response({
        "success": True,
        "role": "admin" if _is_admin(user) else "user",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "date_joined": user.date_joined.strftime("%Y-%m-%d"),
            "total_projects": projects.count(),
            "my_projects": latest_scores,
        }
    })


# ─────────────────────────────────────────
# ADMIN (is_staff required)
# ─────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_profile(request):
    err = _admin_required(request)
    if err:
        return err

    from projects.models import Project
    from audit.models import SEOAuditHistory

    return Response({
        "success": True,
        "role": "admin",
        "admin": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "date_joined": request.user.date_joined.strftime("%Y-%m-%d"),
        },
        "platform_overview": {
            "total_users": User.objects.filter(is_staff=False).count(),
            "total_admins": User.objects.filter(is_staff=True).count(),
            "total_projects": Project.objects.count(),
            "total_analyses": SEOAuditHistory.objects.count(),
        }
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_users(request):
    """Admin only — see all users and their projects."""
    err = _admin_required(request)
    if err:
        return err

    from projects.models import Project
    from audit.models import SEOAuditHistory

    from django.db.models import OuterRef, Subquery, Count, Prefetch
    latest_score_sq = SEOAuditHistory.objects.filter(
        project=OuterRef('pk')).order_by('-created_at').values('seo_score')[:1]

    # Prefetch all projects+scores in 2 queries total instead of N*2
    projects_qs = Project.objects.annotate(
        latest_score=Subquery(latest_score_sq)
    ).order_by('-created_at')

    users = (
        User.objects.filter(is_staff=False)
        .prefetch_related(Prefetch('project_set', queryset=projects_qs, to_attr='prefetched_projects'))
        .annotate(project_count=Count('project'))
        .order_by("-date_joined")
    )

    data = []
    for u in users:
        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_active": u.is_active,
            "date_joined": u.date_joined.strftime("%Y-%m-%d"),
            "project_count": u.project_count,
            "projects": [
                {
                    "id": p.id,
                    "name": p.name,
                    "url": p.url,
                    "last_score": p.latest_score,
                    "last_analyzed_at": p.last_analyzed_at.isoformat() if p.last_analyzed_at else None,
                    "cache_fresh": p.is_cache_valid(),
                    "created_at": p.created_at.strftime("%Y-%m-%d"),
                }
                for p in u.prefetched_projects
            ],
        })

    return Response({"success": True, "role": "admin", "total_users": len(data), "users": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    err = _admin_required(request)
    if err:
        return err

    from projects.models import Project
    from audit.models import SEOAuditHistory
    from keywords.models import Keyword
    from generator.models import Article
    from monitoring.models import APIErrorsLog
    from django.db.models import Avg, Count

    avg_score = SEOAuditHistory.objects.aggregate(Avg("seo_score"))["seo_score__avg"]
    top_users = (
        Project.objects.values("user__username")
        .annotate(project_count=Count("id"))
        .order_by("-project_count")[:5]
    )

    return Response({
        "success": True,
        "role": "admin",
        "stats": {
            "users": {
                "total": User.objects.filter(is_staff=False).count(),
                "active": User.objects.filter(is_active=True, is_staff=False).count(),
                "admins": User.objects.filter(is_staff=True).count(),
            },
            "projects": {
                "total": Project.objects.count(),
                "total_analyses": SEOAuditHistory.objects.count(),
                "avg_seo_score": round(avg_score, 1) if avg_score else 0,
            },
            "content": {
                "total_keywords": Keyword.objects.count(),
                "total_articles": Article.objects.count(),
            },
            "errors": {
                "total_500_errors": APIErrorsLog.objects.filter(status_code=500).count(),
            },
            "top_users_by_projects": list(top_users),
        }
    })