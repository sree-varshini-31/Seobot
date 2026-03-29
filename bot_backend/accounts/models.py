from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


def user_avatar_upload_to(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "png"
    if ext not in ("jpg", "jpeg", "png", "gif", "webp"):
        ext = "png"
    return f"avatars/user_{instance.user_id}.{ext}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to=user_avatar_upload_to, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User profile"
        verbose_name_plural = "User profiles"

    def __str__(self):
        return f"Profile({self.user.username})"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)
