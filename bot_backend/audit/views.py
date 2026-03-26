# Audit views — SEO audit is handled via /api/analyze/ endpoint
# These endpoints are kept for backwards compatibility

from django.http import JsonResponse

def audit_website(request):
    return JsonResponse({
        "message": "Please use /api/analyze/?url=<your_url> for full SEO analysis"
    })

def extract_keywords(request):
    return JsonResponse({
        "message": "Please use /api/analyze/?url=<your_url> for keyword extraction"
    })

def keyword_research(request):
    return JsonResponse({
        "message": "Please use /api/analyze/?url=<your_url> for keyword research"
    })

def seo_report(request):
    return JsonResponse({
        "message": "Please use /api/analyze/?url=<your_url> for SEO report"
    })

def competitor_analysis(request):
    return JsonResponse({
        "message": "Please use /api/analyze/?url=<your_url> for competitor analysis"
    })

def crawl_website(request):
    return JsonResponse({
        "message": "Please use /api/analyze/?url=<your_url> for website crawling"
    })
