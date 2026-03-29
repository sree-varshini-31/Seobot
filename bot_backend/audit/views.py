from rest_framework.decorators import api_view
from rest_framework.response import Response

from services.seo_analyzer import analyze_website


@api_view(["GET"])
def audit_website(request):
    """
    Real-time SEO audit endpoint using SerpAPI + Groq.

    This delegates to the shared `analyze_website` pipeline, which:
    - crawls the site,
    - calls SerpAPI for live SERP/keyword data,
    - calls Groq for AI suggestions,
    - runs technical SEO + readability checks.
    """
    url = request.query_params.get("url") or request.GET.get("url")

    if not url:
        return Response({"success": False, "error": "URL required"}, status=400)

    try:
        # project_id is optional for one-off audits
        result = analyze_website(project_id=None, url=url)

        # `analyze_website` returns {"error": "..."} on failure
        if isinstance(result, dict) and result.get("error"):
            return Response({"success": False, "error": result["error"]}, status=400)

        # Frontend `Audit.jsx` expects the raw data object (no nesting under "data")
        return Response(result)

    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)