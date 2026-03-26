from datetime import datetime
from urllib.parse import urlparse
import os
import requests as http_requests

from serp.services import get_serp_full, get_serp_results, get_search_volume
from crawler.services import crawl_website
from audit.services import seo_audit
from keywords.services import extract_keywords
from services.techseo import (
    check_ssl, check_robots_txt, check_sitemap,
    check_page_speed, check_technical_seo,
    flesch_reading_ease, readability_label, keyword_density,
)


def _normalize_domain(url: str) -> str:
    return urlparse(url).netloc.lower().replace("www.", "")


def generate_with_groq(prompt: str) -> str:
    """Call Groq API for AI content generation"""
    import logging
    import time
    logger = logging.getLogger(__name__)

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY not set in .env")
        return None

    for attempt in range(2):  # retry once on rate limit
        try:
            response = http_requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 400,
                    "temperature": 0.7
                },
                timeout=20
            )
            if response.status_code == 429:
                logger.warning("Groq rate limit hit — waiting 5s before retry")
                time.sleep(5)
                continue
            if response.status_code != 200:
                logger.error(f"Groq API error {response.status_code}: {response.text[:200]}")
                return None
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error(f"Groq request failed: {e}")
            return None
    return None


def is_brand_search_relevant(brand_results: list, your_domain: str) -> bool:
    for r in brand_results[:3]:
        if your_domain in _normalize_domain(r.get("url", "")):
            return True
    return False


def generate_content_suggestions(keyword: str, serp_results: list, your_domain: str) -> dict:
    """Generate real AI content suggestions using Groq"""

    competitor_titles = [
        c.get("title", "") for c in serp_results[:8]
        if c.get("title") and len(c.get("title", "")) > 10
        and your_domain not in c.get("url", "")
    ][:3]

    competitors_text = ", ".join(f'"{t}"' for t in competitor_titles if t)

    groq_prompt = f"""You are an SEO expert. Generate content for the keyword: "{keyword}"

Top competing pages on Google: {competitors_text}
The website being analyzed is: {your_domain}

Return ONLY a JSON object with exactly these 3 keys:
{{
    "title": "An SEO optimized article title under 60 characters relevant to {your_domain}",
    "meta_description": "A compelling meta description under 155 characters for {your_domain}",
    "blog": "A 2-3 sentence blog intro paragraph for {your_domain} that hooks the reader and naturally includes the keyword"
}}

Return only the JSON, no explanation, no markdown."""

    groq_response = generate_with_groq(groq_prompt)

    if groq_response:
        try:
            import json
            clean = groq_response.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean)
            if all(k in result for k in ["title", "meta_description", "blog"]):
                return result
        except Exception:
            pass

    return {
        "title": "Content generation unavailable",
        "meta_description": "Content generation unavailable",
        "blog": "Content generation unavailable — please check your GROQ_API_KEY"
    }


def generate_backlink_suggestions(keyword: str, your_domain: str) -> list:
    """Generate AI-powered backlink suggestions using Groq"""

    groq_prompt = f"""You are an SEO backlink strategist for {your_domain}.
Give 5 specific, actionable backlink building strategies for the keyword "{keyword}".
Focus on strategies relevant to {your_domain}'s niche.
Return ONLY a JSON array of 5 plain strings. Each item must be a plain string, not an object.
Example format: ["strategy one", "strategy two", "strategy three", "strategy four", "strategy five"]
No explanation, no keys, just a JSON array of strings."""

    groq_response = generate_with_groq(groq_prompt)

    if groq_response:
        try:
            import json
            clean = groq_response.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean)
            if isinstance(result, list) and len(result) > 0:
                # Handle both plain strings and dict formats from Groq
                cleaned = []
                for item in result:
                    if isinstance(item, str):
                        cleaned.append(item)
                    elif isinstance(item, dict):
                        # Extract value from any key (e.g. "Strategy": "...")
                        cleaned.append(list(item.values())[0])
                return cleaned[:6]
        except Exception:
            pass

    return ["Backlink suggestions unavailable — please check your GROQ_API_KEY"]



def generate_keyword_opportunity(your_domain: str, kw: str, your_position) -> dict:
    """Generate unique AI suggestion and action for each keyword using Groq"""
    
    if your_position is None:
        position_context = f"{your_domain} does not rank for this keyword at all"
        status = "Not Ranking"
    elif your_position == 1:
        position_context = f"{your_domain} ranks #1 for this keyword"
        status = "Rank #1"
    elif your_position <= 3:
        position_context = f"{your_domain} ranks #{your_position} for this keyword"
        status = f"Rank #{your_position}"
    elif your_position <= 10:
        position_context = f"{your_domain} ranks #{your_position} on page 1 for this keyword"
        status = f"Page 1 #{your_position}"
    else:
        position_context = f"{your_domain} ranks #{your_position} on page 2+ for this keyword"
        status = f"Page 2+ #{your_position}"

    groq_prompt = f"""You are an SEO strategist. Give a unique, specific suggestion and action for this keyword.

Website: {your_domain}
Keyword: "{kw}"
Current status: {position_context}

Return ONLY a JSON object with exactly 2 keys:
{{
    "suggestion": "One specific sentence explaining the SEO opportunity or status for this exact keyword",
    "action": "One specific actionable step the website owner should take for this exact keyword"
}}

Make suggestion and action unique and specific to the keyword "{kw}" — not generic advice.
No explanation, just JSON."""

    groq_response = generate_with_groq(groq_prompt)
    
    if groq_response:
        try:
            import json as _json
            clean = groq_response.replace("```json", "").replace("```", "").strip()
            result = _json.loads(clean)
            if "suggestion" in result and "action" in result:
                return {
                    "keyword": kw,
                    "your_site": f"https://{your_domain}",
                    "your_position": your_position if your_position is not None else "Not Ranking",
                    "suggestion": result["suggestion"],
                    "action": result["action"]
                }
        except Exception:
            pass

    # Fallback if Groq fails
    if your_position is None:
        suggestion = f"'{kw}' is an untapped keyword — {your_domain} is missing traffic from this search"
        action = f"Create a dedicated page on {your_domain} targeting '{kw}'"
    elif your_position <= 3:
        suggestion = f"{your_domain} ranks #{your_position} for '{kw}' — strong position generating good traffic"
        action = f"Maintain and strengthen your '{kw}' ranking with fresh content updates"
    elif your_position <= 10:
        suggestion = f"{your_domain} ranks #{your_position} for '{kw}' — close to top 3 but losing clicks"
        action = f"Optimize your '{kw}' page content and earn more backlinks to reach top 3"
    else:
        suggestion = f"{your_domain} ranks #{your_position} for '{kw}' — too deep to get meaningful traffic"
        action = f"Rebuild your '{kw}' content strategy from scratch to reach page 1"

    return {
        "keyword": kw,
        "your_site": f"https://{your_domain}",
        "your_position": your_position if your_position is not None else "Not Ranking",
        "suggestion": suggestion,
        "action": action
    }

def build_keyword_opportunities(your_domain: str, related_keywords: list) -> list:
    """Build keyword opportunities with unique AI suggestions per keyword.
    Limited to 3 keywords to reduce API calls and avoid Groq rate limits.
    """
    import time
    opportunities = []

    for i, kw in enumerate(related_keywords[:3]):  # 3 instead of 5 — saves 4 API calls
        results = get_serp_results(kw, num_results=10) or []

        your_position = None
        for item in results:
            domain = _normalize_domain(item.get("url", ""))
            if domain == your_domain:
                your_position = item.get("position")
                break

        # Small delay between Groq calls to avoid rate limit
        if i > 0:
            time.sleep(1)

        opportunity = generate_keyword_opportunity(your_domain, kw, your_position)
        opportunities.append(opportunity)

    return opportunities


def get_brand_keywords(your_domain: str) -> tuple:
    brand = your_domain.split(".")[0]
    brand_results, brand_related = get_serp_full(brand, num_results=10)
    brand_results = brand_results or []
    brand_related = brand_related or []
    return brand_results, brand_related, brand


def analyze_website(project_id: int, url: str):

    # 🔹 1. Crawl Website
    data = crawl_website(url)
    if isinstance(data, dict) and data.get("error"):
        return {"error": data["error"]}

    # 🔹 2. SEO Audit
    audit_result = seo_audit(data)
    score = audit_result.get("seo_score", 0)

    # 🔹 3. Extract Keywords
    keywords = extract_keywords(data.get("content", ""))
    your_domain = _normalize_domain(url)

    # 🔹 4. Brand search
    brand_results, brand_related, brand = get_brand_keywords(your_domain)

    # 🔹 5. Check if brand search is relevant
    brand_is_relevant = is_brand_search_relevant(brand_results, your_domain)

    if brand_is_relevant:
    # Use page content keywords for content suggestions — more accurate
     main_keyword = keywords[0] if keywords else (brand_related[0] if brand_related else brand)
     serp_results = brand_results
     opportunity_keywords = brand_related[:5]
    else:
        main_keyword = keywords[0] if keywords else brand
        content_results, content_related = get_serp_full(main_keyword, num_results=10)
        serp_results = content_results or []
        opportunity_keywords = content_related[:5] if content_related else []

    # 🔹 6. Check ranking
    your_position = None
    for item in (brand_results + serp_results):
        result_domain = _normalize_domain(item.get("url", ""))
        if result_domain == your_domain:
            your_position = item.get("position")
            break

    # 🔹 7. Keyword opportunities
    keyword_opportunities = build_keyword_opportunities(your_domain, opportunity_keywords)

    # 🔹 8. Trend
    seo_score_trend = [{
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "score": score
    }]

    # 🔹 9. Issues
    issues = audit_result.get("issues", [])

    # 🔹 10. AI-powered suggestions via Groq
    content_suggestions = generate_content_suggestions(main_keyword, serp_results, your_domain)
    backlink_suggestions = generate_backlink_suggestions(main_keyword, your_domain)

    # 🔹 11. Technical SEO checks (SSL, robots, sitemap, canonical, schema, OG)
    ssl_check      = check_ssl(url)
    robots_check   = check_robots_txt(url)
    sitemap_check  = check_sitemap(url)
    tech_seo       = check_technical_seo(data, url)

    # 🔹 12. Google PageSpeed Insights (free API)
    pagespeed = check_page_speed(url)

    # 🔹 13. Readability score
    page_text = data.get("content", "")
    readability_score = flesch_reading_ease(page_text)
    readability = {
        "score": readability_score,
        "label": readability_label(readability_score),
        "recommendation": (
            "Good readability" if readability_score >= 60
            else "Content is too complex — simplify sentences and vocabulary"
        ),
    }

    # 🔹 14. Keyword density
    primary_keyword = keywords[0] if keywords else your_domain
    kw_density = keyword_density(page_text, primary_keyword)

    # 🔹 15. Add technical issues to score
    technical_issues = []
    if not ssl_check.get("https"):
        score = max(0, score - 10)
        technical_issues.append("Site not using HTTPS — major security and SEO risk")
    if not robots_check.get("exists"):
        score = max(0, score - 3)
        technical_issues.append("Missing robots.txt file")
    if not sitemap_check.get("exists"):
        score = max(0, score - 3)
        technical_issues.append("Missing sitemap.xml")
    if tech_seo.get("meta_robots", {}).get("is_noindex"):
        score = max(0, score - 20)
        technical_issues.append("Page has noindex — Google will not index this page")
    if not tech_seo.get("canonical", {}).get("exists"):
        score = max(0, score - 2)
        technical_issues.append("Missing canonical tag")
    if not tech_seo.get("open_graph", {}).get("exists"):
        technical_issues.append("Missing Open Graph tags — poor social sharing preview")
    if not tech_seo.get("schema_markup", {}).get("exists"):
        technical_issues.append("No schema markup — missing rich snippet opportunities")
    if not tech_seo.get("viewport_meta", {}).get("exists"):
        score = max(0, score - 5)
        technical_issues.append("Missing viewport meta tag — poor mobile experience")
    if kw_density.get("density_value", 0) < 0.5:
        technical_issues.append(f"Keyword density too low ({kw_density.get('density', '0%')}) — use primary keyword more")
    elif kw_density.get("density_value", 0) > 2.5:
        technical_issues.append(f"Keyword density too high ({kw_density.get('density', '0%')}) — risk of keyword stuffing")

    all_issues = issues + technical_issues

    # 🔹 16. Final Response
    return {
        "url": url,
        "seo_score": max(0, score),
        "seo_score_trend": seo_score_trend,
        "your_google_rank": your_position if your_position is not None else "Not Ranking",
        "issues": all_issues,
        "keywords": keywords[:5],
        "keyword_opportunities": keyword_opportunities,
        "backlink_suggestions": backlink_suggestions,
        "content_suggestions": content_suggestions,
        "technical_seo": {
            "ssl": ssl_check,
            "robots_txt": robots_check,
            "sitemap": sitemap_check,
            "canonical": tech_seo.get("canonical", {}),
            "meta_robots": tech_seo.get("meta_robots", {}),
            "schema_markup": tech_seo.get("schema_markup", {}),
            "open_graph": tech_seo.get("open_graph", {}),
            "twitter_card": tech_seo.get("twitter_card", {}),
            "favicon": tech_seo.get("favicon", {}),
            "hreflang": tech_seo.get("hreflang", {}),
            "viewport_meta": tech_seo.get("viewport_meta", {}),
        },
        "pagespeed": pagespeed,
        "readability": readability,
        "keyword_density": kw_density,
    }