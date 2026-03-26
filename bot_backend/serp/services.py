import os
import requests
import certifi
import logging

logger = logging.getLogger(__name__)

SERPAPI_URL = "https://serpapi.com/search"


def get_serp_results(keyword: str, num_results: int = 10):
    """Fetch REAL Google results from SerpAPI"""

    api_key = os.getenv("SERPAPI_API_KEY")

    if not api_key:
        logger.error("❌ SERPAPI_API_KEY not found in environment")
        return []

    logger.info(f"✅ Fetching REAL Google results for: '{keyword}' via SerpAPI")

    params = {
        "engine": "google",
        "q": keyword,
        "num": num_results,
        "api_key": api_key
    }

    try:
        response = requests.get(
            SERPAPI_URL,
            params=params,
            timeout=20,
            verify=certifi.where()
        )
        response.raise_for_status()
        data = response.json()

        organic_results = data.get("organic_results", [])

        results = []
        for item in organic_results:
            results.append({
                "position": item.get("position"),
                "title": item.get("title"),
                "url": item.get("link"),
                "snippet": item.get("snippet")
            })

        logger.info(f"✅ Got {len(results)} results for '{keyword}'")
        return results

    except Exception as e:
        logger.error(f"❌ SerpAPI failed: {e}")
        return []


def get_serp_full(keyword: str, num_results: int = 10):
    """Fetch Google results AND related searches from SerpAPI"""

    api_key = os.getenv("SERPAPI_API_KEY")

    if not api_key:
        logger.error("❌ SERPAPI_API_KEY not found in environment")
        return [], []

    params = {
        "engine": "google",
        "q": keyword,
        "num": num_results,
        "api_key": api_key
    }

    try:
        response = requests.get(
            SERPAPI_URL,
            params=params,
            timeout=20,
            verify=certifi.where()
        )
        response.raise_for_status()
        data = response.json()

        organic_results = data.get("organic_results", [])
        results = []
        for item in organic_results:
            results.append({
                "position": item.get("position"),
                "title": item.get("title"),
                "url": item.get("link"),
                "snippet": item.get("snippet")
            })

        related = data.get("related_searches", [])
        related_keywords = [r.get("query", "") for r in related if r.get("query")]

        logger.info(f"✅ Got {len(results)} results and {len(related_keywords)} related searches for '{keyword}'")
        return results, related_keywords

    except Exception as e:
        logger.error(f"❌ SerpAPI failed: {e}")
        return [], []


def get_competitors(keyword: str, url: str = "", num_results: int = 10):
    """Compatibility wrapper for old code"""
    results = get_serp_results(keyword, num_results)
    formatted = []
    for i, r in enumerate(results or [], start=1):
        formatted.append({
            "position": i,
            "url": r.get("url")
        })
    return formatted


def get_search_volume(keyword: str) -> int:
    """Get search volume estimate using SerpAPI Google Trends"""
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        return 0

    try:
        response = requests.get(
            SERPAPI_URL,
            params={
                "engine": "google_trends",
                "q": keyword,
                "api_key": api_key,
                "data_type": "TIMESERIES"
            },
            timeout=15,
            verify=certifi.where()
        )
        data = response.json()
        timeline = data.get("interest_over_time", {}).get("timeline_data", [])
        if timeline:
            # Average of last 4 weeks as volume indicator
            values = [
                t.get("values", [{}])[0].get("extracted_value", 0)
                for t in timeline[-4:]
            ]
            avg = sum(values) // max(len(values), 1)
            # Scale 0-100 trend score to estimated monthly searches
            return avg * 1000
        return 0
    except Exception as e:
        logger.warning(f"⚠️ Search volume fetch failed for '{keyword}': {e}")
        return 0
