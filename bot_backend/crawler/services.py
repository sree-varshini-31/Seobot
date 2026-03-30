from bs4 import BeautifulSoup  # type: ignore
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def _parse_html(html: str, url: str) -> dict:
    """Parse HTML content into SEO data"""
    soup = BeautifulSoup(html, "html.parser")

    # 🔥 Remove noise elements before extracting content
    for tag in soup.find_all(["header", "footer", "nav", "script",
                               "style", "aside", "noscript", "iframe"]):
        tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else ""

    # 🔥 Detect Anti-Bot / Cloudflare Captcha pages
    lower_title = title.lower()
    text_check = soup.get_text().lower()
    if (
        "just a moment" in lower_title or 
        "attention required" in lower_title or
        "access denied" in lower_title or
        "verify you are a human" in text_check or
        "cf-browser-verification" in text_check or
        "tripadvisor" in lower_title and len(soup.find_all("p")) == 0
    ):
        return {"error": "Website is protected by anti-bot systems (e.g., Cloudflare) and is blocking our automated audit tool. Try another URL."}

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


def _crawl_with_playwright(url: str) -> dict:
    """Crawl using sync Playwright to guarantee JavaScript execution"""
    import asyncio
    from playwright.sync_api import sync_playwright
    import time

    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-infobars",
                    "--disable-dev-shm-usage",
                ]
            )

            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )

            page = context.new_page()

            # Hide webdriver flag
            page.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )

            # Load page
            page.goto(url, wait_until="domcontentloaded", timeout=30000)

            # Scroll entire page to trigger ALL lazy-loaded content
            page.evaluate("""
                () => {
                    const totalHeight = document.body.scrollHeight;
                    const step = 300;
                    let currentPos = 0;
                    while (currentPos < totalHeight) {
                        window.scrollTo(0, currentPos);
                        currentPos += step;
                    }
                    window.scrollTo(0, 0);
                }
            """)

            time.sleep(2)
            html = page.content()
            browser.close()

            result = _parse_html(html, url)

            if not result or (not result.get("title") and not result.get("content") and not result.get("error")):
                logger.warning(f"⚠️ Playwright got empty content for {url}")
                return {"error": "Failed to extract content from the website using Javascript rendering."}

            logger.info(
                f"✅ Playwright crawled {url} — "
                f"{result.get('word_count', 0)} words, "
                f"{len(result.get('internal_links', []))} internal links"
            )
            return result

    except Exception as e:
        logger.warning(f"⚠️ Playwright failed for {url}: {e}")
        return {"error": f"Scraping Engine failed to loaded Javascript: {e}"}


def crawl_website(url: str) -> dict:
    """
    Crawl website using Playwright (full JS rendering + full page scroll).
    Requests fallback removed to enforce JavaScript execution for accurate SEO metrics.
    """
    return _crawl_with_playwright(url)