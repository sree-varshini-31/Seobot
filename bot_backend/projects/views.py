from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from projects.models import Project
from urllib.parse import urlparse
import ipaddress
import socket


def is_valid_url(url: str) -> bool:
    """
    Validate URL and block SSRF attacks.
    Rejects private IPs, localhost, and internal network addresses.
    """
    try:
        parsed = urlparse(url.strip())

        # Must be http or https
        if parsed.scheme not in ("http", "https"):
            return False

        # Must have a hostname
        hostname = parsed.hostname
        if not hostname:
            return False

        # Block localhost variants
        blocked_hostnames = [
            "localhost", "127.0.0.1", "0.0.0.0", "::1",
            "metadata.google.internal",  # GCP metadata
            "169.254.169.254",           # AWS metadata
        ]
        if hostname.lower() in blocked_hostnames:
            return False

        # Resolve hostname to IP and check if private/reserved
        try:
            ip = ipaddress.ip_address(socket.gethostbyname(hostname))
            if (
                ip.is_private or
                ip.is_loopback or
                ip.is_reserved or
                ip.is_link_local or
                ip.is_multicast
            ):
                return False
        except (socket.gaierror, ValueError):
            # Can't resolve — allow it (DNS failure, not a security issue)
            pass

        return True

    except Exception:
        return False


def _is_admin(user):
    return user.is_staff


def _admin_required(request):
    if not _is_admin(request.user):
        return Response({"success": False, "error": "Admin access required"}, status=403)
    return None


# ─────────────────────────────────────────
# PUBLIC
# ─────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "message": "SEO Automation API",
        "status": "running",
        "user_endpoints": {
            "register":    "POST /api/auth/register/",
            "login":       "POST /api/auth/login/",
            "logout":      "POST /api/auth/logout/",
            "profile":     "GET  /api/auth/profile/",
            "analyze":     "GET  /api/analyze/?url=…  (6h server-side refresh; same URL reuses cache)",
            "analyze_refresh": "GET  /api/analyze/?url=…&refresh=true  (internal only)",
            "my_projects": "GET  /api/data/",
            "my_analytics":"GET  /api/analytics/<project_id>/",
        },
        "admin_endpoints": {
            "admin_profile":  "GET /api/auth/admin/profile/",
            "all_users":      "GET /api/auth/admin/users/",
            "platform_stats": "GET /api/auth/admin/stats/",
            "all_projects":   "GET /api/admin/projects/",
            "any_analytics":  "GET /api/admin/analytics/<project_id>/",
        }
    })


# ─────────────────────────────────────────
# USER ENDPOINTS
# ─────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def analyze_site(request):
    """
    Analyze a URL for the logged-in user.

    Cache: same user + URL returns stored audit for up to 6 hours (reduces SerpAPI cost).
    After expiry, the next request runs a full fresh pipeline. Optional ?refresh=true for ops only.
    """
    url = request.data.get("url") if request.method == "POST" else request.GET.get("url")
    force_refresh = request.GET.get("refresh", "").lower() in ("true", "1", "yes")

    if not url:
        return Response({"success": False, "error": "URL is required"}, status=400)
    if not is_valid_url(url):
        return Response({"success": False, "error": "Invalid URL format"}, status=400)

    try:
        domain = urlparse(url).netloc.replace("www.", "")

        # ── Get or create project scoped to this user ──────────────────────
        try:
            project = Project.objects.get(url=url, user=request.user)
        except Project.DoesNotExist:
            name = domain
            counter = 1
            while Project.objects.filter(name=name, user=request.user).exists():
                name = f"{domain}-{counter}"
                counter += 1
            project = Project.objects.create(url=url, user=request.user, name=name)

        # ── Serve from cache if within 6h window (no extra SerpAPI calls) ───
        if not force_refresh and project.is_cache_valid():
            return Response({
                "success": True,
                "project_id": project.id,
                "last_analyzed_at": project.last_analyzed_at.isoformat() if project.last_analyzed_at else None,
                "next_refresh_after": project.cache_expires_at.isoformat() if project.cache_expires_at else None,
                "data": project.analytics_cache,
            })

        # ── Run full analysis ──────────────────────────────────────────────
        from services.seo_analyzer import analyze_website
        result = analyze_website(project.id, url)

        if result.get("error"):
            return Response({"success": False, "error": result["error"]}, status=500)

        # ── Persist full snapshot on project + history table ────────────────
        project.set_cache(result)

        # ── SEOAuditHistory — full snapshot ───────────────────────────────
        from audit.models import SEOAuditHistory
        SEOAuditHistory.objects.create(
            project=project,
            seo_score=result.get("seo_score", 0),
            issues_count=len(result.get("issues", [])),
            full_result=result,
        )

        # ── Keywords ──────────────────────────────────────────────────────
        from keywords.models import Keyword, KeywordTrend
        vol_map = result.get("keyword_search_volume") or {}
        for kw_data in result.get("keywords", []):
            kw = kw_data.get("keyword") if isinstance(kw_data, dict) else kw_data
            vol = vol_map.get(kw) or (kw_data.get("search_volume", 0) if isinstance(kw_data, dict) else 0)
            keyword_obj, _ = Keyword.objects.get_or_create(
                keyword=kw, project=project, defaults={"search_volume": vol}
            )
            if vol:
                keyword_obj.search_volume = vol
                keyword_obj.save()
            KeywordTrend.objects.create(
                project=project,
                keyword=keyword_obj,
                ranking_position=result.get("your_google_rank") if isinstance(result.get("your_google_rank"), int) else None,
                search_volume=vol,
            )

        # ── Keyword opportunities → Competitor table ───────────────────────
        from keywords.models import Competitor
        for opp in result.get("keyword_opportunities", []):
            Competitor.objects.update_or_create(
                project=project,
                keyword=opp.get("keyword", ""),
                defaults={
                    "competitor_url": opp.get("your_site", ""),
                    "ranking_position": opp.get("your_position", 0) if isinstance(opp.get("your_position"), int) else 0,
                }
            )

        # ── Article / content suggestions ─────────────────────────────────
        content = result.get("content_suggestions", {})
        if content.get("title") and content.get("title") != "Content generation unavailable":
            from generator.models import Article
            import uuid, re
            raw_slug = re.sub(r"[^\w\s-]", "", content["title"].lower())
            raw_slug = re.sub(r"[\s_-]+", "-", raw_slug).strip("-")
            slug = f"{raw_slug}-{str(uuid.uuid4())[:8]}"
            Article.objects.get_or_create(
                project=project,
                slug=slug,
                defaults=dict(
                    title=content.get("title", ""),
                    meta_title=content.get("title", "")[:60],
                    meta_description=content.get("meta_description", "")[:160],
                    excerpt=content.get("blog", ""),
                    content=content.get("blog", ""),
                    keywords=[k.get("keyword") if isinstance(k, dict) else k for k in result.get("keywords", [])],
                    status="draft",
                )
            )

        # ── Error log ─────────────────────────────────────────────────────
        issues = result.get("issues", [])
        if issues:
            from monitoring.models import APIErrorsLog
            APIErrorsLog.objects.create(
                endpoint=f"/api/analyze/?url={url}",
                error_message=f"SEO Issues: {', '.join(issues)}",
                status_code=200,
            )

        return Response({
            "success": True,
            "project_id": project.id,
            "last_analyzed_at": project.last_analyzed_at.isoformat(),
            "next_refresh_after": project.cache_expires_at.isoformat() if project.cache_expires_at else None,
            "data": result,
        })

    except Exception as exc:
        import traceback
        print("🔥 ERROR:", traceback.format_exc())
        try:
            from monitoring.models import APIErrorsLog
            APIErrorsLog.objects.create(
                endpoint=f"/api/analyze/?url={url}",
                error_message=str(exc),
                status_code=500,
            )
        except Exception:
            pass
        return Response({"success": False, "error": str(exc)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_projects(request):
    """Returns ONLY the logged-in user's own projects (admin sees all).
    Supports pagination: ?page=1&limit=20
    """
    try:
        from audit.models import SEOAuditHistory
        from django.db.models import OuterRef, Subquery

        # Single subquery to get latest score — avoids N+1 queries
        latest_score_subquery = SEOAuditHistory.objects.filter(
            project=OuterRef('pk')
        ).order_by('-created_at').values('seo_score')[:1]

        if _is_admin(request.user):
            projects = Project.objects.all().select_related("user").order_by("-created_at")
        else:
            projects = Project.objects.filter(user=request.user).order_by("-created_at")

        projects = projects.annotate(latest_score=Subquery(latest_score_subquery))

        # Pagination
        try:
            page  = max(1, int(request.GET.get("page", 1)))
            limit = min(100, max(1, int(request.GET.get("limit", 20))))
        except (ValueError, TypeError):
            page, limit = 1, 20

        total  = projects.count()
        start  = (page - 1) * limit
        end    = start + limit
        paged  = projects[start:end]

        data = []
        for p in paged:
            data.append({
                "id": p.id,
                "name": p.name,
                "url": p.url,
                "owner": p.user.username if _is_admin(request.user) and p.user else None,
                "latest_score": p.latest_score,
                "last_analyzed_at": p.last_analyzed_at.isoformat() if p.last_analyzed_at else None,
                "cache_expires_at": p.cache_expires_at.isoformat() if p.cache_expires_at else None,
                "cache_fresh": p.is_cache_valid(),
                "created_at": p.created_at.strftime("%Y-%m-%d %H:%M"),
            })

        return Response({
            "success": True,
            "count": total,
            "page": page,
            "limit": limit,
            "total_pages": max(1, -(-total // limit)),  # ceiling division
            "projects": data,
        })
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_analysis_result(request, project_id):
    """Return cached result for a project. User can only see their own."""
    try:
        if _is_admin(request.user):
            project = Project.objects.get(id=project_id)
        else:
            project = Project.objects.get(id=project_id, user=request.user)

        if not project.analytics_cache:
            return Response({"success": True, "status": "no data yet"})

        return Response({
            "success": True,
            "cached": True,
            "cache_fresh": project.is_cache_valid(),
            "last_analyzed_at": project.last_analyzed_at.isoformat() if project.last_analyzed_at else None,
            "cache_expires_at": project.cache_expires_at.isoformat() if project.cache_expires_at else None,
            "data": project.analytics_cache,
        })
    except Project.DoesNotExist:
        return Response({"success": False, "error": "Project not found"}, status=404)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_dashboard(request, project_id):
    """Full analytics for a project. User can only see their own."""
    try:
        if _is_admin(request.user):
            project = Project.objects.get(id=project_id)
        else:
            project = Project.objects.get(id=project_id, user=request.user)
        return _get_analytics(project, is_admin=_is_admin(request.user))
    except Project.DoesNotExist:
        return Response({"success": False, "error": "Project not found"}, status=404)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


# ─────────────────────────────────────────
# ADMIN ENDPOINTS
# ─────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_all_projects(request):
    """Admin only — all projects from all users."""
    err = _admin_required(request)
    if err:
        return err
    try:
        from audit.models import SEOAuditHistory
        from django.db.models import OuterRef, Subquery

        latest_score_subquery = SEOAuditHistory.objects.filter(
            project=OuterRef('pk')
        ).order_by('-created_at').values('seo_score')[:1]

        projects = (
            Project.objects.all()
            .select_related("user")
            .annotate(latest_score=Subquery(latest_score_subquery))
            .order_by("-created_at")
        )

        # Pagination
        try:
            page  = max(1, int(request.GET.get("page", 1)))
            limit = min(100, max(1, int(request.GET.get("limit", 20))))
        except (ValueError, TypeError):
            page, limit = 1, 20

        total = projects.count()
        paged = projects[(page-1)*limit : page*limit]

        data = []
        for p in paged:
            data.append({
                "id": p.id,
                "name": p.name,
                "url": p.url,
                "owner": p.user.username if p.user else "unknown",
                "latest_score": p.latest_score,
                "last_analyzed_at": p.last_analyzed_at.isoformat() if p.last_analyzed_at else None,
                "cache_fresh": p.is_cache_valid(),
                "created_at": p.created_at.strftime("%Y-%m-%d %H:%M"),
            })
        return Response({
            "success": True,
            "role": "admin",
            "count": total,
            "page": page,
            "limit": limit,
            "total_pages": max(1, -(-total // limit)),
            "projects": data,
        })
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_analytics(request, project_id):
    """Admin only — analytics for any project."""
    err = _admin_required(request)
    if err:
        return err
    try:
        project = Project.objects.get(id=project_id)
        return _get_analytics(project, is_admin=True)
    except Project.DoesNotExist:
        return Response({"success": False, "error": "Project not found"}, status=404)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


# ─────────────────────────────────────────
# SHARED HELPER
# ─────────────────────────────────────────

def _get_analytics(project, is_admin=False):
    from audit.models import SEOAuditHistory
    from keywords.models import KeywordTrend, Competitor
    from generator.models import Article

    audits      = SEOAuditHistory.objects.filter(project=project).order_by("created_at")[:30]
    kw_trends   = KeywordTrend.objects.filter(project=project).order_by("recorded_at")[:50]
    competitors = Competitor.objects.filter(project=project).order_by("ranking_position")[:20]
    articles    = Article.objects.filter(project=project).order_by("-created_at")[:10]

    project_info = {
        "id": project.id,
        "name": project.name,
        "url": project.url,
        "last_analyzed_at": project.last_analyzed_at.isoformat() if project.last_analyzed_at else None,
        "cache_fresh": project.is_cache_valid(),
    }
    if is_admin:
        project_info["owner"] = project.user.username if project.user else "unknown"

    return Response({
        "success": True,
        "role": "admin" if is_admin else "user",
        "project": project_info,
        "data": {
            "seo_score_trend": [
                {"date": a.created_at.strftime("%Y-%m-%d"), "score": a.seo_score, "issues_count": a.issues_count}
                for a in audits
            ],
            "keyword_metrics": [
                {"keyword": kw.keyword.keyword, "position": kw.ranking_position, "search_volume": kw.search_volume, "date": kw.recorded_at.strftime("%Y-%m-%d")}
                for kw in kw_trends
            ],
            "keyword_opportunities": [
                {"keyword": c.keyword, "your_position": c.ranking_position, "url": c.competitor_url}
                for c in competitors
            ],
            "content_drafts": [
                {"title": a.title, "meta_description": a.meta_description, "status": a.status, "created_at": a.created_at.strftime("%Y-%m-%d")}
                for a in articles
            ],
        }
    })