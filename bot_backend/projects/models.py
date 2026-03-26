from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


CACHE_TTL_HOURS = 24  # Re-fetch after 24 hours


class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    url = models.URLField(db_index=True)
    analytics_cache = models.JSONField(default=dict, blank=True)
    last_analyzed_at = models.DateTimeField(null=True, blank=True)
    cache_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', '-created_at']),     # user project list
            models.Index(fields=['url', 'user']),              # cache lookup
            models.Index(fields=['cache_expires_at']),         # expiry checks
        ]

    def __str__(self):
        return f"{self.name} ({self.url})"

    def is_cache_valid(self):
        """Return True if cached data is still fresh."""
        if not self.analytics_cache or not self.cache_expires_at:
            return False
        return timezone.now() < self.cache_expires_at

    def set_cache(self, data):
        """Store result and set expiry."""
        self.analytics_cache = data
        self.last_analyzed_at = timezone.now()
        self.cache_expires_at = timezone.now() + timedelta(hours=CACHE_TTL_HOURS)
        self.save()