from django.db import models
from projects.models import Project


class Competitor(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    keyword = models.CharField(max_length=255, db_index=True)
    competitor_url = models.URLField()
    ranking_position = models.IntegerField(default=0)
    domain_authority = models.IntegerField(default=0, blank=True, null=True)
    keyword_gaps = models.JSONField(default=dict, blank=True)
    competitor_content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['project', 'keyword']),
        ]

class Keyword(models.Model):
    INTENT_CHOICES = [
        ('informational', 'Informational'),
        ('commercial', 'Commercial'),
        ('navigational', 'Navigational'),
        ('transactional', 'Transactional'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    keyword = models.CharField(max_length=255, db_index=True)
    cluster = models.CharField(max_length=100, blank=True, null=True)
    intent_type = models.CharField(max_length=20, choices=INTENT_CHOICES, default='informational')
    difficulty_score = models.IntegerField(default=0)  # 0-100 score
    search_volume = models.IntegerField(default=0)
    cpc = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    serp_position = models.IntegerField(default=0, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['project', 'keyword']),
        ]
    
    def __str__(self):
        return f"{self.keyword} ({self.intent_type})"

class KeywordTrend(models.Model):
    keyword = models.ForeignKey(Keyword, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    ranking_position = models.IntegerField(null=True, blank=True)
    search_volume = models.IntegerField(default=0)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['keyword', '-recorded_at']),
            models.Index(fields=['project', '-recorded_at']),
        ]

    def __str__(self):
        return f"{self.keyword.keyword} trend ({self.recorded_at.date()})"