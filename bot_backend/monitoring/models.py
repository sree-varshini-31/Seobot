from django.db import models


class APIErrorsLog(models.Model):
    endpoint = models.CharField(max_length=255, db_index=True)
    error_message = models.TextField()
    status_code = models.IntegerField(default=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.endpoint} - {self.status_code} at {self.created_at}"
