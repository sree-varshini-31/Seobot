from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from rest_framework.decorators import throttle_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile


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


def _user_public_dict(request, user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    avatar_url = None
    if profile.avatar:
        avatar_url = request.build_absolute_uri(profile.avatar.url)
    display = (user.first_name or "").strip() or user.username
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name or "",
        "name": display,
        "avatar": avatar_url,
        "role": "admin" if _is_admin(user) else "user",
        "plan": "Free Plan",
    }


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
        "user": _user_public_dict(request, user),
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
        "user": _user_public_dict(request, user),
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


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, FormParser, MultiPartParser])
def profile(request):
    """Read or update own profile (username / email)."""
    user = request.user
    from projects.models import Project
    from audit.models import SEOAuditHistory

    if request.method == "PATCH":
        if "username" in request.data:
            new_username = (request.data.get("username") or "").strip()
            if len(new_username) < 3:
                return Response({"success": False, "error": "Username must be at least 3 characters"}, status=400)
            if new_username != user.username and User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
                return Response({"success": False, "error": "Username already taken"}, status=400)
            user.username = new_username

        if "email" in request.data:
            new_email = (request.data.get("email") or "").strip().lower()
            if not new_email:
                return Response({"success": False, "error": "Email is required"}, status=400)
            if new_email != user.email:
                current_pw = (request.data.get("current_password") or "").strip()
                if not user.check_password(current_pw):
                    return Response(
                        {"success": False, "error": "Current password is required to change your email."},
                        status=400,
                    )
                if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                    return Response({"success": False, "error": "Email already in use"}, status=400)
            user.email = new_email

        if "first_name" in request.data:
            user.first_name = (request.data.get("first_name") or "").strip()[:150]

        user.save()

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

    udict = _user_public_dict(request, user)
    udict["date_joined"] = user.date_joined.strftime("%Y-%m-%d")
    udict["total_projects"] = projects.count()
    udict["my_projects"] = latest_scores

    return Response({
        "success": True,
        "role": "admin" if _is_admin(user) else "user",
        "user": udict,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_insights(request):
    """Projects + daily audit history for charts (from SEOAuditHistory)."""
    from django.utils import timezone
    from datetime import timedelta
    from projects.models import Project
    from audit.models import SEOAuditHistory

    user = request.user
    since = timezone.now() - timedelta(days=90)

    out = []
    for proj in Project.objects.filter(user=user).order_by("-last_analyzed_at", "-created_at"):
        audits = SEOAuditHistory.objects.filter(project=proj, created_at__gte=since).order_by("created_at")
        timeline = []
        for a in audits:
            timeline.append({
                "date": a.created_at.strftime("%Y-%m-%d %H:%M"),
                "score": a.seo_score,
                "issues": a.issues_count,
            })
        latest = SEOAuditHistory.objects.filter(project=proj).order_by("-created_at").first()
        out.append({
            "id": proj.id,
            "name": proj.name,
            "url": proj.url,
            "last_analyzed_at": proj.last_analyzed_at.isoformat() if proj.last_analyzed_at else None,
            "next_refresh_after": proj.cache_expires_at.isoformat() if proj.cache_expires_at else None,
            "cache_active": proj.is_cache_valid(),
            "latest_score": latest.seo_score if latest else None,
            "audit_timeline": timeline,
        })

    return Response({"success": True, "projects": out})


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def profile_avatar(request):
    """POST: multipart field `avatar`. DELETE: remove custom avatar."""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if request.method == "DELETE":
        if profile.avatar:
            profile.avatar.delete(save=False)
            profile.avatar = None
            profile.save()
        return Response({"success": True, "user": _user_public_dict(request, request.user)})

    f = request.FILES.get("avatar")
    if not f:
        return Response({"success": False, "error": "No file field `avatar`"}, status=400)
    if f.size > 5 * 1024 * 1024:
        return Response({"success": False, "error": "Image must be under 5MB"}, status=400)
    profile.avatar.save(f.name, f, save=True)
    return Response({
        "success": True,
        "user": _user_public_dict(request, request.user),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    old_pw = (request.data.get("old_password") or "").strip()
    new_pw = (request.data.get("new_password") or "").strip()
    if not old_pw or not new_pw:
        return Response({"success": False, "error": "old_password and new_password required"}, status=400)
    if not request.user.check_password(old_pw):
        return Response({"success": False, "error": "Current password is incorrect"}, status=400)
    try:
        validate_password(new_pw, user=request.user)
    except ValidationError as e:
        return Response({"success": False, "error": list(e.messages)}, status=400)
    request.user.set_password(new_pw)
    request.user.save()
    update_session_auth_hash(request, request.user)
    return Response({"success": True, "message": "Password updated"})


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


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, user_id):
    """Admin only — update or delete a specific user."""
    err = _admin_required(request)
    if err:
        return err

    try:
        target_user = User.objects.get(id=user_id)
        if target_user.is_superuser and not request.user.is_superuser:
            return Response({"success": False, "error": "Cannot modify superuser"}, status=403)
    except User.DoesNotExist:
        return Response({"success": False, "error": "User not found"}, status=404)

    if request.method == "DELETE":
        if target_user.id == request.user.id:
            return Response({"success": False, "error": "Cannot delete yourself"}, status=400)
        target_user.delete()
        return Response({"success": True, "message": "User deleted successfully"})

    if request.method == "PATCH":
        if "username" in request.data:
            new_username = (request.data.get("username") or "").strip()
            if len(new_username) >= 3:
                if new_username != target_user.username and User.objects.filter(username=new_username).exists():
                    return Response({"success": False, "error": "Username already taken"}, status=400)
                target_user.username = new_username

        if "email" in request.data:
            new_email = (request.data.get("email") or "").strip().lower()
            if new_email and new_email != target_user.email:
                if User.objects.filter(email=new_email).exists():
                    return Response({"success": False, "error": "Email already in use"}, status=400)
                target_user.email = new_email

        if "is_active" in request.data:
            val = request.data.get("is_active")
            target_user.is_active = str(val).lower() in ("true", "1", "yes")

        target_user.save()
        return Response({
            "success": True,
            "message": "User updated successfully",
            "user": {
                "id": target_user.id,
                "username": target_user.username,
                "email": target_user.email,
                "is_active": target_user.is_active
            }
        })