from rest_framework import serializers  # type: ignore
from .models import Article, ContentPlan, Backlink  # type: ignore

class ArticleSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Article
        fields = (
            "id",
            "project",
            "project_name",
            "title",
            "slug",
            "content",
            "excerpt",
            "meta_title",
            "meta_description",
            "keywords",
            "primary_keyword",
            "secondary_keywords",
            "status",
            "word_count",
            "reading_time",
            "template",
            "youtube_url",
            "featured_image_url",
            "internal_links",
            "external_links",
            "schema_markup",
            "seo_score",
            "created_at",
            "updated_at",
            "published_at",
        )

class ContentPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentPlan
        fields = '__all__'

class BacklinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Backlink
        fields = '__all__'
