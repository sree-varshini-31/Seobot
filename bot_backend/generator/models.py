from django.db import models  # type: ignore
from django.contrib.postgres.fields import JSONField  # type: ignore
from projects.models import Project  # type: ignore
import uuid

class ContentPlan(models.Model):
    """AI-generated content plan for a project"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    target_keywords = models.JSONField(default=list)
    content_pillars = models.JSONField(default=list)
    monthly_topics = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.project.name} - {self.title}"

class ContentTemplate(models.Model):
    """Templates for different types of content"""
    TEMPLATE_TYPES = [
        ('blog', 'Blog Post'),
        ('news', 'News Article'),
        ('howto', 'How-to Guide'),
        ('listicle', 'Listicle'),
        ('comparison', 'Comparison Article'),
        ('youtube', 'YouTube Video Article'),
    ]

    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    prompt_template = models.TextField()
    is_active = models.BooleanField(default=True)
    language = models.CharField(max_length=10, default='en')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.template_type} - {self.name}"

class Article(models.Model):
    """Generated articles"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('generating', 'Generating'),
        ('review', 'Ready for Review'),
        ('approved', 'Approved'),
        ('published', 'Published'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, db_index=True)
    content = models.TextField(blank=True)
    excerpt = models.TextField(blank=True)
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.TextField(max_length=160, blank=True)
    keywords = models.JSONField(default=list)
    primary_keyword = models.CharField(max_length=100, blank=True, db_index=True)
    secondary_keywords = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    word_count = models.IntegerField(default=0)
    reading_time = models.IntegerField(default=0)  # in minutes
    template = models.ForeignKey(ContentTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    youtube_url = models.URLField(blank=True)  # for YouTube articles
    featured_image_url = models.URLField(blank=True)
    internal_links = models.JSONField(default=list)  # [{'url': '', 'anchor': ''}]
    external_links = models.JSONField(default=list)  # [{'url': '', 'anchor': ''}]
    schema_markup = models.TextField(blank=True)  # JSON-LD
    seo_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.content:
            self.word_count = len(self.content.split())
            self.reading_time = max(1, self.word_count // 200)  # ~200 words per minute
        super().save(*args, **kwargs)

class GenerationTask(models.Model):
    """Tracks AI generation tasks"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    article = models.OneToOneField(Article, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField(default=0)  # 0-100
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Task for {self.article.title}"

class Backlink(models.Model):
    """Track backlinks for articles"""
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('outreach', 'Outreach Sent'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
    ]

    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    target_url = models.URLField(db_index=True)
    anchor_text = models.CharField(max_length=200)
    target_domain = models.CharField(max_length=200, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned', db_index=True)
    domain_authority = models.IntegerField(default=0)
    contact_email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.target_domain} - {self.anchor_text}"

class BacklinkHistory(models.Model):
    """Historical tracking of backlink acquisition progress"""
    backlink = models.ForeignKey(Backlink, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=Backlink.STATUS_CHOICES)
    domain_authority = models.IntegerField(default=0)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['backlink', '-recorded_at']),
        ]
