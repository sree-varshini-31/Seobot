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


def _serp_competitor_lines(serp_results: list, your_domain: str, limit: int = 6) -> str:
    lines = []
    for c in (serp_results or [])[:limit]:
        u = c.get("url") or ""
        if your_domain in _normalize_domain(u):
            continue
        t = (c.get("title") or "")[:120]
        s = (c.get("snippet") or "")[:200]
        pos = c.get("position")
        if t:
            lines.append(f"#{pos} {t} — {s}")
    return "\n".join(lines) if lines else "(no competitor snippets from SERP)"


def generate_content_suggestions(
    keyword: str,
    serp_results: list,
    your_domain: str,
    related_searches: list = None,
    people_also_ask: list = None,
) -> dict:
    """Groq generates content aligned with live SerpAPI competitor data."""

    competitors_text = _serp_competitor_lines(serp_results, your_domain)
    related_block = ", ".join((related_searches or [])[:8]) if related_searches else ""
    paa_block = ""
    if people_also_ask:
        paa_block = " | ".join(
            (q.get("question") or "")[:120] for q in people_also_ask[:5] if q.get("question")
        )

    groq_prompt = f"""You are an SEO expert. Use ONLY the real Google SERP data below (from SerpAPI) to shape recommendations for the site {your_domain}.

Target keyword: "{keyword}"

Organic competitor titles + snippets (Google results):
{competitors_text}

Related searches (Google): {related_block or "N/A"}
People also ask (Google): {paa_block or "N/A"}

Return ONLY a JSON object with exactly these 3 keys:
{{
    "title": "An SEO optimized article title under 60 characters that outranks competitors for this SERP",
    "meta_description": "A compelling meta description under 155 characters",
    "blog": "A 2-3 sentence blog intro that reflects search intent from the SERP data above"
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


def generate_backlink_suggestions(
    keyword: str,
    your_domain: str,
    serp_results: list = None,
    related_searches: list = None,
) -> list:
    """Groq backlink ideas informed by who ranks in the live SERP."""

    comp = _serp_competitor_lines(serp_results or [], your_domain, limit=5)
    rel = ", ".join((related_searches or [])[:6]) if related_searches else ""

    groq_prompt = f"""You are an SEO backlink strategist for {your_domain}.
Keyword: "{keyword}"
Google organic landscape (real SerpAPI data):
{comp}
Related searches: {rel or "N/A"}

Give 5 specific backlink strategies that would help {your_domain} compete with the domains ranking above for this keyword.
Return ONLY a JSON array of 5 plain strings.
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



def generate_keyword_opportunity(
    your_domain: str,
    kw: str,
    your_position,
    serp_snippet_for_kw: str = "",
) -> dict:
    """Groq suggestion per keyword; serp_snippet_for_kw is live top-result context from SerpAPI."""
    
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

    serp_ctx = f" Top Google result snippet for this query: {serp_snippet_for_kw[:300]}" if serp_snippet_for_kw else ""

    groq_prompt = f"""You are an SEO strategist. Give a unique, specific suggestion and action for this keyword.

Website: {your_domain}
Keyword: "{kw}"
Current status: {position_context}
{serp_ctx}

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
    """SerpAPI position per keyword + Groq — limited to 3 keywords for API cost control."""
    import time
    opportunities = []

    for i, kw in enumerate(related_keywords[:3]):
        results = get_serp_results(kw, num_results=10) or []

        your_position = None
        top_snippet = ""
        for item in results:
            domain = _normalize_domain(item.get("url", ""))
            if domain == your_domain:
                your_position = item.get("position")
            if not top_snippet and item.get("snippet"):
                top_snippet = item.get("snippet") or ""

        if i > 0:
            time.sleep(1)

        opportunity = generate_keyword_opportunity(your_domain, kw, your_position, top_snippet)
        opportunities.append(opportunity)

    return opportunities


def get_brand_keywords(your_domain: str) -> tuple:
    brand = your_domain.split(".")[0]
    brand_results, brand_related, brand_extras = get_serp_full(brand, num_results=10)
    brand_results = brand_results or []
    brand_related = brand_related or []
    return brand_results, brand_related, brand, brand_extras


def _build_missing_elements(tech_bundle: dict, audit_issues: list, kw_density: dict) -> list:
    """Explicit checklist of what is missing or weak on the crawled page (not mock)."""
    missing = []
    ts = tech_bundle or {}
    if not (ts.get("ssl") or {}).get("https"):
        missing.append("HTTPS: site not served over secure connection")
    if not (ts.get("robots_txt") or {}).get("exists"):
        missing.append("robots.txt: missing or unreachable")
    if not (ts.get("sitemap") or {}).get("exists"):
        missing.append("XML sitemap: missing or not declared")
    if not (ts.get("canonical") or {}).get("exists"):
        missing.append("Canonical link: missing")
    if (ts.get("meta_robots") or {}).get("is_noindex"):
        missing.append("meta robots: page set to noindex")
    if not (ts.get("open_graph") or {}).get("exists"):
        missing.append("Open Graph tags: missing (social previews suffer)")
    if not (ts.get("schema_markup") or {}).get("exists"):
        missing.append("Schema.org JSON-LD: missing (no rich results)")
    if not (ts.get("viewport_meta") or {}).get("exists"):
        missing.append("Viewport meta: missing (mobile UX)")
    if not (ts.get("favicon") or {}).get("exists"):
        missing.append("Favicon: missing")
    if not (ts.get("twitter_card") or {}).get("exists"):
        missing.append("Twitter card tags: missing")
    dv = (kw_density or {}).get("density_value")
    if dv is not None:
        if dv < 0.5:
            missing.append(f"Primary keyword usage: low ({kw_density.get('density', '0%')})")
        elif dv > 2.5:
            missing.append(f"Primary keyword usage: possibly too high ({kw_density.get('density', '0%')})")
    for issue in audit_issues or []:
        if isinstance(issue, str) and issue not in missing:
            missing.append(issue)
    return missing


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

    # 🔹 4. Brand + live Google SERP (SerpAPI)
    brand_results, brand_related, brand, brand_extras = get_brand_keywords(your_domain)

    brand_is_relevant = is_brand_search_relevant(brand_results, your_domain)

    if brand_is_relevant:
        main_keyword = keywords[0] if keywords else (brand_related[0] if brand_related else brand)
        serp_results = brand_results
        opportunity_keywords = brand_related[:5]
        primary_serp_extras = brand_extras or {}
        related_for_groq = brand_related
    else:
        main_keyword = keywords[0] if keywords else brand
        content_results, content_related, content_extras = get_serp_full(main_keyword, num_results=10)
        serp_results = content_results or []
        opportunity_keywords = content_related[:5] if content_related else []
        primary_serp_extras = content_extras or {}
        related_for_groq = content_related or []

    paa_list = (primary_serp_extras or {}).get("people_also_ask") or []

    # 🔹 5. Your position in Google (SerpAPI organic)
    your_position = None
    for item in (brand_results + serp_results):
        result_domain = _normalize_domain(item.get("url", ""))
        if result_domain == your_domain:
            your_position = item.get("position")
            break

    # 🔹 6. Technical + on-page (crawl) — before Groq so prompts use full picture
    ssl_check = check_ssl(url)
    robots_check = check_robots_txt(url)
    sitemap_check = check_sitemap(url)
    tech_seo = check_technical_seo(data, url)

    pagespeed = check_page_speed(url)

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

    primary_keyword = keywords[0] if keywords else your_domain
    kw_density = keyword_density(page_text, primary_keyword)

    issues = audit_result.get("issues", [])

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

    tech_bundle = {
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
    }
    missing_on_page = _build_missing_elements(tech_bundle, issues, kw_density)

    # 🔹 7. SerpAPI trend volumes (primary + opportunities — capped for cost)
    keyword_search_volume = {}
    for kw in [main_keyword] + opportunity_keywords[:2]:
        if kw and kw not in keyword_search_volume:
            keyword_search_volume[kw] = get_search_volume(kw)

    # 🔹 8. Groq — grounded in SerpAPI strings above
    content_suggestions = generate_content_suggestions(
        main_keyword,
        serp_results,
        your_domain,
        related_searches=related_for_groq,
        people_also_ask=paa_list,
    )
    backlink_suggestions = generate_backlink_suggestions(
        main_keyword,
        your_domain,
        serp_results=serp_results,
        related_searches=related_for_groq,
    )

    # 🔹 9. More SerpAPI calls per related keyword + Groq
    keyword_opportunities = build_keyword_opportunities(your_domain, opportunity_keywords)

    seo_score_trend = [{
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "score": score
    }]

    serp_snapshot = {
        "brand_query": brand,
        "primary_query": main_keyword,
        "source": "serpapi_google",
        "organic_results": serp_results[:10],
        "related_searches": list(related_for_groq[:12]) if related_for_groq else [],
        "people_also_ask": paa_list[:8],
        "search_information": (primary_serp_extras or {}).get("search_information"),
    }

    return {
        "url": url,
        "seo_score": max(0, score),
        "seo_score_trend": seo_score_trend,
        "your_google_rank": your_position if your_position is not None else "Not Ranking",
        "issues": all_issues,
        "missing_on_page": missing_on_page,
        "keywords": keywords[:5],
        "keyword_search_volume": keyword_search_volume,
        "keyword_opportunities": keyword_opportunities,
        "backlink_suggestions": backlink_suggestions,
        "content_suggestions": content_suggestions,
        "serp_snapshot": serp_snapshot,
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