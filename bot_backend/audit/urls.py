from django.urls import path
from .views import (
    audit_website,
    extract_keywords,
    keyword_research,
    seo_report,
    competitor_analysis,
    crawl_website
)

urlpatterns = [

    path("", audit_website),
    path("extract-keywords/", extract_keywords),
    path("keyword-research/", keyword_research),
    path("seo-report/", seo_report),
    path("competitors/", competitor_analysis),
    path("crawl/", crawl_website),

]