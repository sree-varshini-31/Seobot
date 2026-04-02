from rest_framework.decorators import api_view
from rest_framework.response import Response

from services.seo_analyzer import analyze_website


@api_view(["GET"])
def audit_website(request):
    """
    Real-time SEO audit endpoint using SerpAPI + Groq.
    Implements 24-hour cache for same URL and updates user usage stats.
    """
    url = request.query_params.get("url") or request.GET.get("url")

    if not url:
        return Response({"success": False, "error": "URL required"}, status=400)

    try:
        from django.utils import timezone
        from datetime import timedelta
        from audit.models import SEOAuditHistory
        
        # Check for cache (less than 24 hours old for this exact URL)
        recent_audit = SEOAuditHistory.objects.filter(
            project__url=url, 
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).select_related('project').order_by('-created_at').first()

        if recent_audit and recent_audit.full_result:
            result = recent_audit.full_result
        else:
            # project_id is optional for one-off audits
            result = analyze_website(project_id=None, url=url)

        # `analyze_website` returns {"error": "..."} on failure
        if isinstance(result, dict) and result.get("error"):
            return Response({"success": False, "error": result["error"]}, status=400)

        # Update user usage stats and save project
        if request.user and request.user.is_authenticated:
            from accounts.models import UserProfile
            from projects.models import Project
            
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.websites_searched += 1
            
            # Find or create a project to store the audit for the profile page
            project = Project.objects.filter(user=request.user, url=url).first()
            if not project:
                from urllib.parse import urlparse
                domain = urlparse(url).netloc
                project = Project.objects.create(
                    user=request.user,
                    url=url,
                    name=domain or url
                )
            
            # Create Audit history if it was newly analyzed
            if not (recent_audit and recent_audit.full_result):
                profile.api_calls_used += 1 # Only increment if we actually ran the analysis
                SEOAuditHistory.objects.create(
                    project=project,
                    seo_score=result.get("seo_score", 0),
                    full_result=result
                )
                project.last_analyzed_at = timezone.now()
                project.save()
            
            # Approximate data received by serializing the result into string length
            import json
            profile.data_received_bytes += len(json.dumps(result))
            profile.save()

        # Frontend `Audit.jsx` expects the raw data object (no nesting under "data")
        return Response(result)

    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
def get_audit_report(request):
    """
    Returns the latest cached SEO audit result for a project.
    Accepts either ?project_id=<id> or ?url=<url>.
    Used by the Admin panel to download PDFs without re-running the audit.
    """
    project_id = request.query_params.get("project_id")
    url = request.query_params.get("url")

    if not project_id and not url:
        return Response({"success": False, "error": "project_id or url required"}, status=400)

    try:
        from audit.models import SEOAuditHistory

        qs = SEOAuditHistory.objects.select_related('project').order_by('-created_at')

        if project_id:
            qs = qs.filter(project_id=project_id)
        else:
            qs = qs.filter(project__url=url)

        latest = qs.first()

        if not latest or not latest.full_result:
            return Response(
                {"success": False, "error": "No cached audit found for this project."},
                status=404
            )

        return Response(latest.full_result)

    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)