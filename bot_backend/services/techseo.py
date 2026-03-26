import requests
import certifi
import re
import math
import logging
from urllib.parse import urlparse, urljoin

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
            # Try https version
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
    """Call Google PageSpeed Insights API (free, no key needed for basic use)."""
    try:
        api_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
        params = {"url": url, "strategy": "mobile", "category": ["performance", "seo", "accessibility"]}
        r = requests.get(api_url, params=params, timeout=30)
        if r.status_code != 200:
            return {"error": f"PageSpeed API returned {r.status_code}"}

        data = r.json()
        cats = data.get("lighthouseResult", {}).get("categories", {})
        audits = data.get("lighthouseResult", {}).get("audits", {})

        # Core Web Vitals
        lcp = audits.get("largest-contentful-paint", {}).get("displayValue", "N/A")
        fid = audits.get("total-blocking-time", {}).get("displayValue", "N/A")
        cls = audits.get("cumulative-layout-shift", {}).get("displayValue", "N/A")
        speed_index = audits.get("speed-index", {}).get("displayValue", "N/A")

        return {
            "performance_score": round((cats.get("performance", {}).get("score", 0) or 0) * 100),
            "seo_score": round((cats.get("seo", {}).get("score", 0) or 0) * 100),
            "accessibility_score": round((cats.get("accessibility", {}).get("score", 0) or 0) * 100),
            "core_web_vitals": {
                "lcp": lcp,
                "total_blocking_time": fid,
                "cls": cls,
                "speed_index": speed_index,
            },
            "mobile_friendly": True,
        }
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
    """
    Calculate Flesch Reading Ease score.
    90-100 = Very Easy, 60-70 = Standard, 30-50 = Difficult, 0-30 = Very Difficult
    """
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

    # Count exact phrase matches
    count = len(re.findall(re.escape(keyword_lower), text.lower()))

    density = round((count / total_words * 100), 2) if total_words > 0 else 0

    # Keyword placement checks
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