import requests  # type: ignore
import certifi  # type: ignore
from bs4 import BeautifulSoup  # type: ignore
import logging
from urllib.parse import urlparse
import asyncio

logger = logging.getLogger(__name__)


def _parse_html(html: str, url: str) -> dict:
    """Parse HTML content into SEO data"""
    soup = BeautifulSoup(html, "html.parser")

    # 🔥 Remove noise elements before extracting content
    for tag in soup.find_all(["header", "footer", "nav", "script",
                               "style", "aside", "noscript", "iframe"]):
        tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else ""

    meta_desc = ""
    desc = soup.find("meta", attrs={"name": "description"})
    if desc:
        meta_desc = desc.get("content", "")

    h1_tags = [h.text.strip() for h in soup.find_all("h1")]
    h2_tags = [h.text.strip() for h in soup.find_all("h2")]
    paragraphs = [p.text.strip() for p in soup.find_all("p") if p.text.strip()]

    domain = urlparse(url).netloc.replace("www.", "")
    all_links = [a.get("href", "") for a in soup.find_all("a") if a.get("href")]
    internal_links = [l for l in all_links if domain in l or l.startswith("/")]
    external_links = [l for l in all_links if l.startswith("http") and domain not in l]

    images = soup.find_all("img")
    images_without_alt = len([img for img in images if not img.get("alt")])

    # Extract meaningful text from main content areas only
    extra_text = []
    for tag in soup.find_all(["li", "span", "div", "section", "article", "main"]):
        text = tag.get_text(separator=" ", strip=True)
        if text and len(text) > 30:
            extra_text.append(text)

    content = " ".join(paragraphs + extra_text[:50])

    return {
        "title": title,
        "description": meta_desc,
        "h1": h1_tags,
        "h2": h2_tags,
        "content": content,
        "links": all_links,
        "internal_links": internal_links,
        "external_links": external_links,
        "images_without_alt": images_without_alt,
        "word_count": len(content.split()) if content else 0,
        "raw_html": html,  # kept for technical SEO checks
    }


async def _async_playwright_crawl(url: str) -> str:
    """Async Playwright crawl — scrolls entire page to trigger lazy loading"""
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars",
                "--disable-dev-shm-usage",
            ]
        )

        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="en-US",
        )

        page = await context.new_page()

        # Hide webdriver flag
        await page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        # Load page
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)

        # Scroll entire page to trigger ALL lazy-loaded content
        await page.evaluate("""
            async () => {
                const totalHeight = document.body.scrollHeight;
                const step = 300;
                let currentPos = 0;
                while (currentPos < totalHeight) {
                    window.scrollTo(0, currentPos);
                    await new Promise(r => setTimeout(r, 100));
                    currentPos += step;
                }
                window.scrollTo(0, 0);
            }
        """)

        await page.wait_for_timeout(2000)
        html = await page.content()
        await browser.close()
        return html


def _crawl_with_playwright(url: str) -> dict:
    """Crawl using Playwright with proper async handling"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        html = loop.run_until_complete(_async_playwright_crawl(url))
        loop.close()

        result = _parse_html(html, url)

        if not result.get("title") and not result.get("content"):
            logger.warning(f"⚠️ Playwright got empty content for {url}")
            return None

        logger.info(
            f"✅ Playwright crawled {url} — "
            f"{result.get('word_count', 0)} words, "
            f"{len(result.get('internal_links', []))} internal links"
        )
        return result

    except Exception as e:
        logger.warning(f"⚠️ Playwright failed for {url}: {e} — falling back to requests")
        return None


def _crawl_with_requests(url: str) -> dict:
    """Crawl using requests — fast but misses JavaScript content"""
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        response = requests.get(url, headers=headers, timeout=10, verify=certifi.where())
        response.raise_for_status()
        logger.info(f"✅ requests crawled {url}")
        return _parse_html(response.text, url)

    except requests.exceptions.SSLError:
        try:
            response = requests.get(url, headers=headers, timeout=10, verify=False)
            response.raise_for_status()
            return _parse_html(response.text, url)
        except Exception as e:
            return {"error": f"Failed to crawl URL: {e}"}

    except Exception as e:
        return {"error": f"Failed to crawl URL: {e}"}


def crawl_website(url: str) -> dict:
    """
    Crawl website using Playwright (full JS rendering + full page scroll)
    with automatic fallback to requests if Playwright fails.
    """
    result = _crawl_with_playwright(url)

    if result is None:
        logger.info(f"🔄 Falling back to requests for {url}")
        result = _crawl_with_requests(url)

    return result