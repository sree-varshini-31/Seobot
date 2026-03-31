import os
import requests
import certifi
import re
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# TECHNICAL SEO CHECKS
# ─────────────────────────────────────────────────────────────────────────────

def check_ssl(url: str) -> dict:
    """Check if site uses valid HTTPS."""
    parsed = urlparse(url)
    is_https = parsed.scheme == "https"
    try:
        if is_https:
            r = requests.head(url, timeout=8, verify=certifi.where(), allow_redirects=True)
            return {"https": True, "valid_cert": True, "status_code": r.status_code}
        else:
            https_url = url.replace("http://", "https://")
            r = requests.head(https_url, timeout=8, verify=certifi.where(), allow_redirects=True)
            return {"https": False, "redirects_to_https": r.status_code < 400, "status_code": r.status_code}
    except requests.exceptions.SSLError:
        return {"https": is_https, "valid_cert": False, "error": "SSL certificate error"}
    except Exception as e:
        return {"https": is_https, "valid_cert": None, "error": str(e)}


def check_robots_txt(url: str) -> dict:
    """Fetch and analyze robots.txt."""
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    try:
        r = requests.get(robots_url, timeout=8, verify=certifi.where(), headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code == 200:
            content = r.text
            has_sitemap = "sitemap:" in content.lower()
            blocks_all = "disallow: /" in content.lower() and "user-agent: *" in content.lower()
            return {
                "exists": True,
                "has_sitemap_reference": has_sitemap,
                "blocks_all_crawlers": blocks_all,
                "content_preview": content[:300],
            }
        return {"exists": False, "status_code": r.status_code}
    except Exception as e:
        return {"exists": False, "error": str(e)}


def check_sitemap(url: str) -> dict:
    """Check if sitemap.xml exists and is valid."""
    parsed = urlparse(url)
    sitemap_url = f"{parsed.scheme}://{parsed.netloc}/sitemap.xml"
    try:
        r = requests.get(sitemap_url, timeout=8, verify=certifi.where(), headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code == 200:
            content = r.text
            is_xml = "<?xml" in content or "<urlset" in content or "<sitemapindex" in content
            url_count = content.count("<url>")
            return {
                "exists": True,
                "is_valid_xml": is_xml,
                "url_count": url_count,
                "sitemap_url": sitemap_url,
            }
        return {"exists": False, "status_code": r.status_code}
    except Exception as e:
        return {"exists": False, "error": str(e)}


def check_page_speed(url: str) -> dict:
    """Call Google PageSpeed Insights API.
    Tries mobile first, falls back to desktop for JS-heavy SPAs (NO_FCP error).
    """
    api_key = os.getenv("PAGESPEED_API_KEY")
    api_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

    def _fetch(strategy: str):
        params = [
            ("url", url),
            ("strategy", strategy),
            ("category", "performance"),
            ("category", "seo"),
            ("category", "accessibility"),
        ]
        if api_key:
            params.append(("key", api_key))
        return requests.get(api_url, params=params, timeout=30)

    def _parse(r) -> dict:
        data = r.json()
        err_msg = (data.get("error") or {}).get("message", "")
        if err_msg:
            return {"error": err_msg}
        cats = data.get("lighthouseResult", {}).get("categories", {})
        audits = data.get("lighthouseResult", {}).get("audits", {})
        crux = data.get("loadingExperience", {}).get("metrics", {})

        # 1. Try to get CrUX (real-world field data) first.
        # It's structured as: MTRC_NAME: {"percentile": value}
        # Note: TBT and Speed Index are Lab-only metrics, so they won't be in CrUX.
        field_lcp = crux.get("LARGEST_CONTENTFUL_PAINT_MS", {}).get("percentile")
        field_cls = crux.get("CUMULATIVE_LAYOUT_SHIFT_SCORE", {}).get("percentile")
        
        # 2. Extract Lab Data
        lab_lcp = audits.get("largest-contentful-paint", {}).get("numericValue")
        lab_tbt = audits.get("total-blocking-time", {}).get("numericValue")
        lab_cls = audits.get("cumulative-layout-shift", {}).get("numericValue")
        lab_si = audits.get("speed-index", {}).get("numericValue")

        # 3. Format gracefully
        lcp_val = (f"{round(field_lcp / 1000, 1)} s" if field_lcp else 
                   (f"{round(lab_lcp / 1000, 1)} s" if lab_lcp else "N/A"))
        
        tbt_val = f"{round(lab_tbt)} ms" if lab_tbt is not None else "N/A"
        
        cls_val = (str(round(field_cls / 100, 3)) if field_cls is not None else 
                   (str(round(lab_cls, 3)) if lab_cls is not None else "N/A"))
                   
        si_val = f"{round(lab_si / 1000, 1)} s" if lab_si is not None else "N/A"

        return {
            "performance_score": round((cats.get("performance", {}).get("score", 0) or 0) * 100),
            "seo_score": round((cats.get("seo", {}).get("score", 0) or 0) * 100),
            "accessibility_score": round((cats.get("accessibility", {}).get("score", 0) or 0) * 100),
            "core_web_vitals": {
                "lcp": lcp_val,
                "total_blocking_time": tbt_val,
                "cls": cls_val,
                "speed_index": si_val,
            },
            "mobile_friendly": True,
        }

    try:
        # Try mobile first
        r = _fetch("mobile")
        if r.status_code == 429:
            return {"error": "PageSpeed API rate limited — add PAGESPEED_API_KEY to .env"}
        if r.status_code == 200:
            result = _parse(r)
            if "error" not in result:
                return result

        # Fallback to desktop — works better with JS-heavy SPAs (NO_FCP)
        logger.info(f"Mobile PageSpeed failed for {url} — trying desktop strategy")
        r = _fetch("desktop")
        if r.status_code == 200:
            result = _parse(r)
            if "error" not in result:
                result["note"] = "desktop strategy (JS-heavy SPA)"
                return result

        return {"error": (r.json().get("error") or {}).get("message", f"PageSpeed returned {r.status_code}")}

    except Exception as e:
        logger.warning(f"PageSpeed API failed for {url}: {e}")
        return {"error": str(e)}


def check_technical_seo(html_data: dict, url: str) -> dict:
    """
    Check canonical tags, schema markup, Open Graph, Twitter Cards,
    meta robots, hreflang, favicon from already-crawled HTML data.
    """
    from bs4 import BeautifulSoup

    raw_html = html_data.get("raw_html", "")
    if not raw_html:
        return {"error": "No HTML available for technical checks"}

    soup = BeautifulSoup(raw_html, "html.parser")

    # Canonical tag
    canonical = soup.find("link", rel="canonical")
    canonical_url = canonical.get("href", "") if canonical else None

    # Meta robots
    meta_robots = soup.find("meta", attrs={"name": re.compile(r"robots", re.I)})
    robots_content = meta_robots.get("content", "").lower() if meta_robots else "index, follow"
    is_noindex = "noindex" in robots_content

    # Schema markup (JSON-LD)
    schema_scripts = soup.find_all("script", type="application/ld+json")
    schema_types = []
    for script in schema_scripts:
        try:
            import json
            data = json.loads(script.string or "{}")
            schema_types.append(data.get("@type", "Unknown"))
        except Exception:
            pass

    # Open Graph
    og_title = soup.find("meta", property="og:title")
    og_desc  = soup.find("meta", property="og:description")
    og_image = soup.find("meta", property="og:image")
    has_og = bool(og_title or og_desc)

    # Twitter Card
    tw_card = soup.find("meta", attrs={"name": "twitter:card"})
    has_twitter = bool(tw_card)

    # Favicon
    favicon = (
        soup.find("link", rel="icon") or
        soup.find("link", rel="shortcut icon") or
        soup.find("link", rel="apple-touch-icon")
    )
    has_favicon = bool(favicon)

    # Hreflang
    hreflang_tags = soup.find_all("link", rel="alternate", hreflang=True)
    hreflang_langs = [t.get("hreflang", "") for t in hreflang_tags]

    # Viewport meta (mobile)
    viewport = soup.find("meta", attrs={"name": "viewport"})
    has_viewport = bool(viewport)

    return {
        "canonical": {
            "exists": bool(canonical_url),
            "url": canonical_url,
            "self_referencing": canonical_url == url if canonical_url else False,
        },
        "meta_robots": {
            "content": robots_content,
            "is_noindex": is_noindex,
            "is_nofollow": "nofollow" in robots_content,
        },
        "schema_markup": {
            "exists": len(schema_types) > 0,
            "types": schema_types,
            "count": len(schema_types),
        },
        "open_graph": {
            "exists": has_og,
            "title": og_title.get("content", "") if og_title else None,
            "description": og_desc.get("content", "") if og_desc else None,
            "image": og_image.get("content", "") if og_image else None,
        },
        "twitter_card": {
            "exists": has_twitter,
            "type": tw_card.get("content", "") if tw_card else None,
        },
        "favicon": {"exists": has_favicon},
        "hreflang": {"exists": len(hreflang_langs) > 0, "languages": hreflang_langs},
        "viewport_meta": {"exists": has_viewport},
    }


# ─────────────────────────────────────────────────────────────────────────────
# READABILITY + KEYWORD DENSITY
# ─────────────────────────────────────────────────────────────────────────────

def flesch_reading_ease(text: str) -> float:
    """Flesch Reading Ease score. 90-100=Very Easy, 60-70=Standard, 0-30=Very Difficult."""
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    words = re.findall(r"\b\w+\b", text)

    if not sentences or not words:
        return 0.0

    def count_syllables(word: str) -> int:
        word = word.lower()
        vowels = "aeiouy"
        count = 0
        prev_vowel = False
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_vowel:
                count += 1
            prev_vowel = is_vowel
        if word.endswith("e") and count > 1:
            count -= 1
        return max(1, count)

    total_syllables = sum(count_syllables(w) for w in words)
    avg_sentence_length = len(words) / len(sentences)
    avg_syllables_per_word = total_syllables / len(words)

    score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
    return round(min(100, max(0, score)), 1)


def readability_label(score: float) -> str:
    if score >= 90: return "Very Easy"
    if score >= 80: return "Easy"
    if score >= 70: return "Fairly Easy"
    if score >= 60: return "Standard"
    if score >= 50: return "Fairly Difficult"
    if score >= 30: return "Difficult"
    return "Very Difficult"


def keyword_density(text: str, keyword: str) -> dict:
    """Calculate keyword density and placement."""
    if not text or not keyword:
        return {"density": "0%", "count": 0, "total_words": 0}

    words = re.findall(r"\b\w+\b", text.lower())
    total_words = len(words)
    keyword_lower = keyword.lower()

    count = len(re.findall(re.escape(keyword_lower), text.lower()))
    density = round((count / total_words * 100), 2) if total_words > 0 else 0

    first_100_words = " ".join(words[:100])
    in_first_paragraph = keyword_lower in first_100_words

    return {
        "keyword": keyword,
        "count": count,
        "total_words": total_words,
        "density": f"{density}%",
        "density_value": density,
        "in_first_paragraph": in_first_paragraph,
        "recommendation": (
            "Good density" if 0.5 <= density <= 2.5
            else "Too low — use keyword more" if density < 0.5
            else "Too high — keyword stuffing risk"
        ),
    }