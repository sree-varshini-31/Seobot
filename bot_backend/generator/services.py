import os
import re
import json
import time
import requests as http_requests
from typing import Dict, List, Tuple
from datetime import datetime
from urllib.parse import urlparse

from .models import Article, ContentTemplate, GenerationTask, ContentPlan
from projects.models import Project
from serp.services import get_competitors
from keywords.services import extract_keywords


def _make_ai_client():
    """Return (client, model) using Groq."""
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        try:
            from openai import OpenAI
            client = OpenAI(
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1",
            )
            return client, "llama-3.1-8b-instant"
        except Exception:
            pass
    return None, None


def _call_groq(client, model, prompt: str, max_tokens: int = 1000, temperature: float = 0.7) -> str:
    """Shared Groq call with retry on rate limit."""
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            err = str(e).lower()
            if "rate_limit" in err or "429" in err:
                if attempt == 0:
                    time.sleep(5)
                    continue
            raise
    return ""


def _parse_json(text: str) -> dict:
    """Safely parse JSON from Groq response, stripping markdown fences."""
    clean = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    return json.loads(clean)


class ContentGenerator:
    """Main content generation service"""

    def __init__(self):
        self.client, self.model = _make_ai_client()

    # ─────────────────────────────────────────────────────────────────
    # CONTENT PLAN
    # ─────────────────────────────────────────────────────────────────

    def generate_content_plan(self, project: Project) -> ContentPlan:
        """Generate a 12-month content plan using real project keywords."""
        if not self.client:
            raise ValueError("No AI API key configured — set GROQ_API_KEY in .env")

        # Use real keywords from DB if available, else placeholder
        from keywords.models import Keyword
        kw_qs = Keyword.objects.filter(project=project).values_list("keyword", flat=True)[:10]
        keywords = list(kw_qs) if kw_qs.exists() else ["seo", "content marketing", "digital growth"]

        # Get competitor URLs from SerpAPI for context
        competitors = []
        if keywords:
            serp = get_competitors(keywords[0], num_results=5)
            competitors = [r.get("url", "") for r in serp if r.get("url")][:3]

        prompt = f"""You are an expert content strategist.
Create a 12-month content plan for a website about: {project.name}
Website URL: {project.url}
Target Keywords: {", ".join(keywords[:10])}
Top Competitors: {", ".join(competitors)}

Return ONLY a JSON object with this exact structure:
{{
    "content_pillars": ["pillar1", "pillar2", "pillar3", "pillar4", "pillar5"],
    "monthly_themes": [
        {{
            "month": 1,
            "theme": "theme name",
            "articles": [
                {{"title": "Article title 1", "keyword": "target keyword", "type": "blog"}},
                {{"title": "Article title 2", "keyword": "target keyword", "type": "howto"}},
                {{"title": "Article title 3", "keyword": "target keyword", "type": "listicle"}}
            ]
        }}
    ]
}}
Include all 12 months. Each month should have 3-4 article ideas.
Return ONLY the JSON, no explanation."""

        try:
            raw = _call_groq(self.client, self.model, prompt, max_tokens=2000, temperature=0.7)
            plan_data = _parse_json(raw)
            return ContentPlan.objects.create(
                project=project,
                title=f"12-Month Content Plan for {project.name}",
                description=f"AI-generated content plan based on real keywords and competitor analysis",
                target_keywords=keywords,
                content_pillars=plan_data.get("content_pillars", []),
                monthly_topics=plan_data.get("monthly_themes", []),
            )
        except Exception as e:
            # Fallback basic plan
            return ContentPlan.objects.create(
                project=project,
                title=f"Basic Content Plan for {project.name}",
                description="Auto-generated fallback plan",
                target_keywords=keywords,
                content_pillars=["Tutorials", "Case Studies", "News", "How-to Guides", "Comparisons"],
                monthly_topics=[],
            )

    # ─────────────────────────────────────────────────────────────────
    # ARTICLE GENERATION
    # ─────────────────────────────────────────────────────────────────

    def generate_article(self, project: Project, keyword: str,
                         template_type: str = "blog",
                         youtube_url: str = None) -> Tuple[Article, GenerationTask]:
        """Generate a complete long-form article and save to DB."""

        slug = self._generate_unique_slug(keyword, project)
        article = Article.objects.create(
            project=project,
            title=f"Generating: {keyword}",
            slug=slug,
            primary_keyword=keyword,
            status="generating",
        )
        task = GenerationTask.objects.create(
            article=article,
            status="processing",
            started_at=datetime.now(),
        )

        try:
            if youtube_url:
                data = self._generate_youtube_article(keyword, youtube_url)
            else:
                data = self._generate_blog_article(keyword, template_type, project)

            article.title               = data.get("title", keyword)
            article.content             = data.get("content", "")
            article.excerpt             = data.get("excerpt", "")
            article.meta_title          = data.get("meta_title", "")[:60]
            article.meta_description    = data.get("meta_description", "")[:160]
            article.keywords            = data.get("keywords", [])
            article.secondary_keywords  = data.get("secondary_keywords", [])
            article.schema_markup       = data.get("schema_markup", "")
            article.internal_links      = data.get("internal_links", [])
            article.status              = "review"
            article.slug                = self._generate_unique_slug(article.title, project)
            article.save()

            task.status       = "completed"
            task.progress     = 100
            task.completed_at = datetime.now()
            task.save()

        except Exception as e:
            task.status        = "failed"
            task.error_message = str(e)
            task.save()
            article.status = "failed"
            article.save()
            raise

        return article, task

    def _generate_blog_article(self, keyword: str, template_type: str, project: Project) -> Dict:
        """Generate a full long-form article in 2 Groq calls."""
        if not self.client:
            raise ValueError("No AI API key configured — set GROQ_API_KEY in .env")

        domain = urlparse(project.url).netloc.replace("www.", "")
        competitors = get_competitors(keyword, num_results=5)
        competitor_titles = [r.get("url", "") for r in competitors[:3]]

        # ── Call 1: outline ──────────────────────────────────────────
        outline_prompt = f"""You are an SEO expert. Create a detailed outline for a long-form article.

Keyword: "{keyword}"
Website: {domain}
Template type: {template_type}
Competitor pages: {", ".join(competitor_titles)}

Return ONLY a JSON object:
{{
    "title": "SEO-optimized title under 60 chars with keyword",
    "meta_title": "Meta title under 60 chars",
    "meta_description": "Compelling meta description under 155 chars with keyword",
    "sections": [
        {{"heading": "H2 heading", "subpoints": ["point1", "point2", "point3"]}},
        {{"heading": "H2 heading 2", "subpoints": ["point1", "point2"]}},
        {{"heading": "FAQ", "subpoints": ["Q: question? A: answer", "Q: question2? A: answer2"]}}
    ],
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "secondary_keywords": ["sec1", "sec2", "sec3"]
}}
Include 6-8 sections. Always end with an FAQ section with 4-5 questions.
Return ONLY the JSON."""

        outline_raw = _call_groq(self.client, self.model, outline_prompt, max_tokens=1000, temperature=0.4)
        outline = _parse_json(outline_raw)

        time.sleep(1)  # avoid rate limit between calls

        # ── Call 2: full content ─────────────────────────────────────
        sections_text = ""
        for s in outline.get("sections", []):
            sections_text += f"\n## {s['heading']}\n"
            for pt in s.get("subpoints", []):
                sections_text += f"- {pt}\n"

        content_prompt = f"""Write a comprehensive, SEO-optimized long-form article.

Title: {outline.get("title", keyword)}
Primary Keyword: "{keyword}"
Website: {domain}
Article Type: {template_type}

Outline to follow:
{sections_text}

Requirements:
- Write at least 1500 words of full HTML content
- Use <h2> for main sections, <h3> for subsections
- Include <p> tags for paragraphs
- Naturally include the keyword "{keyword}" in first paragraph, headings, and throughout
- Add a proper introduction paragraph
- Add a conclusion with call to action for {domain}
- Include bullet points <ul><li> where appropriate
- Add an FAQ section at the end with <h2>Frequently Asked Questions</h2>
- Write in a professional, engaging, authoritative tone

Return ONLY a JSON object:
{{
    "title": "{outline.get("title", keyword)}",
    "content": "<full HTML content here — minimum 1500 words>",
    "excerpt": "2-3 sentence summary of the article",
    "meta_title": "{outline.get("meta_title", "")}",
    "meta_description": "{outline.get("meta_description", "")}",
    "keywords": {json.dumps(outline.get("keywords", [keyword]))},
    "secondary_keywords": {json.dumps(outline.get("secondary_keywords", []))},
    "internal_links": [
        {{"anchor": "anchor text", "suggested_topic": "topic this should link to"}}
    ],
    "schema_markup": ""
}}
Return ONLY the JSON, no explanation."""

        content_raw = _call_groq(self.client, self.model, content_prompt, max_tokens=3000, temperature=0.7)
        return _parse_json(content_raw)

    def _generate_youtube_article(self, keyword: str, youtube_url: str) -> Dict:
        """Generate article from YouTube video transcript."""
        if not self.client:
            raise ValueError("No AI API key configured — set GROQ_API_KEY in .env")

        video_id = self._extract_youtube_id(youtube_url)
        transcript_text = "Transcript not available"
        if video_id:
            try:
                from youtube_transcript_api import YouTubeTranscriptApi
                transcript = YouTubeTranscriptApi.get_transcript(video_id)
                transcript_text = " ".join([item["text"] for item in transcript])[:3000]
            except Exception:
                pass

        prompt = f"""Convert this YouTube video content into a comprehensive SEO article.

Video URL: {youtube_url}
Target Keyword: "{keyword}"
Transcript: {transcript_text}

Requirements:
- Write at least 1200 words in HTML format
- Use <h2> and <h3> headings
- Include a proper introduction, body sections, and conclusion
- Add an FAQ section based on the video content
- Naturally include "{keyword}" throughout
- Reference the video naturally in the introduction

Return ONLY a JSON object:
{{
    "title": "SEO title under 60 chars",
    "content": "<full HTML content>",
    "excerpt": "2-3 sentence summary",
    "meta_title": "Meta title under 60 chars",
    "meta_description": "Meta description under 155 chars",
    "keywords": ["keyword1", "keyword2"],
    "secondary_keywords": ["sec1", "sec2"],
    "internal_links": [],
    "schema_markup": ""
}}
Return ONLY JSON."""

        raw = _call_groq(self.client, self.model, prompt, max_tokens=3000, temperature=0.7)
        data = _parse_json(raw)
        data["youtube_url"] = youtube_url
        return data

    # ─────────────────────────────────────────────────────────────────
    # INTERNAL LINKING
    # ─────────────────────────────────────────────────────────────────

    def generate_internal_linking(self, project: Project) -> List[Dict]:
        """Analyze all articles in project and suggest internal links between them."""
        if not self.client:
            raise ValueError("No AI API key configured — set GROQ_API_KEY in .env")

        articles = Article.objects.filter(
            project=project,
            status__in=["review", "approved", "published"]
        ).values("id", "title", "primary_keyword", "keywords", "slug")

        if articles.count() < 2:
            return [{"message": "Need at least 2 articles to generate internal linking suggestions"}]

        article_list = []
        for a in articles:
            article_list.append({
                "id": str(a["id"]),
                "title": a["title"],
                "keyword": a["primary_keyword"],
                "slug": a["slug"],
            })

        prompt = f"""You are an SEO internal linking expert.
Analyze these articles and suggest which ones should link to each other.

Articles:
{json.dumps(article_list, indent=2)}

Rules:
- Only suggest links where there is a genuine topical connection
- Each article should link to 2-3 others maximum
- Suggest natural anchor text for each link
- Do not suggest linking an article to itself

Return ONLY a JSON array:
[
    {{
        "source_article_id": "uuid",
        "source_title": "title of source article",
        "links_to": [
            {{
                "target_article_id": "uuid",
                "target_title": "title",
                "anchor_text": "natural anchor text to use",
                "reason": "why these articles are related"
            }}
        ]
    }}
]
Return ONLY the JSON array."""

        try:
            raw = _call_groq(self.client, self.model, prompt, max_tokens=1500, temperature=0.3)
            suggestions = json.loads(re.sub(r"```(?:json)?|```", "", raw).strip())

            # Save suggestions to Article.internal_links field
            for suggestion in suggestions:
                try:
                    art = Article.objects.get(id=suggestion["source_article_id"])
                    art.internal_links = suggestion.get("links_to", [])
                    art.save()
                except Article.DoesNotExist:
                    pass

            return suggestions
        except Exception as e:
            return [{"error": f"Internal linking generation failed: {str(e)}"}]

    # ─────────────────────────────────────────────────────────────────
    # CONTENT OPTIMIZATION
    # ─────────────────────────────────────────────────────────────────

    def optimize_content(self, content: str, keyword: str) -> Dict:
        """Optimize existing content for SEO."""
        if not self.client:
            raise ValueError("No AI API key configured — set GROQ_API_KEY in .env")

        prompt = f"""Analyze and optimize this content for the keyword "{keyword}".

Content (first 2000 chars):
{content[:2000]}

Return ONLY a JSON object:
{{
    "seo_score": 75,
    "keyword_density": "1.8%",
    "readability_score": "65 (Flesch-Kincaid)",
    "improved_title": "Better SEO title",
    "improved_meta_description": "Better meta description under 155 chars",
    "suggestions": [
        "Add keyword in first paragraph",
        "Increase H2 headings",
        "Add more internal links"
    ],
    "keyword_usage": {{
        "in_title": true,
        "in_first_paragraph": false,
        "in_h1": true,
        "total_mentions": 3
    }}
}}
Return ONLY JSON."""

        raw = _call_groq(self.client, self.model, prompt, max_tokens=800, temperature=0.3)
        return _parse_json(raw)

    def generate_image(self, keyword: str, style: str = "professional") -> str:
        """Image generation not available — requires OpenAI DALL-E."""
        return ""

    # ─────────────────────────────────────────────────────────────────
    # HELPERS
    # ─────────────────────────────────────────────────────────────────

    def _extract_youtube_id(self, url: str) -> str:
        patterns = [
            r"(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})",
            r"youtube\.com\/embed\/([a-zA-Z0-9_-]{11})",
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return ""

    def _get_youtube_metadata(self, url: str) -> Dict:
        return {"title": "Video", "description": ""}

    def _generate_slug(self, title: str) -> str:
        slug = re.sub(r"[^\w\s-]", "", title.lower())
        slug = re.sub(r"[\s_-]+", "-", slug)
        return slug.strip("-")

    def _generate_unique_slug(self, title: str, project: Project) -> str:
        import uuid
        base = self._generate_slug(title)[:200]
        slug = f"{base}-{str(uuid.uuid4())[:8]}"
        return slug


class BacklinkBuilder:
    """Backlink service — placeholder, not implemented in this version."""

    def __init__(self):
        self.generator = ContentGenerator()

    def find_backlink_opportunities(self, keyword: str, domain: str) -> List[Dict]:
        return [{"message": "Backlink analysis coming in next version"}]

    def generate_outreach_email(self, target_site: str, article_topic: str) -> str:
        return "Outreach email generation coming in next version"


# Global instances
content_generator = ContentGenerator()
backlink_builder = BacklinkBuilder()