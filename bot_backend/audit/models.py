from django.db import models
from projects.models import Project


class SEOReport(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    seo_score = models.IntegerField()
    issues = models.JSONField()
    suggestions = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class SEOAuditHistory(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    seo_score = models.IntegerField()
    issues_count = models.IntegerField(default=0)
    # Full snapshot of every field returned by analyze_website
    full_result = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.project.name} - Score: {self.seo_score} ({self.created_at.date()})"
