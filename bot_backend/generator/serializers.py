from rest_framework import serializers  # type: ignore
from .models import Article, ContentPlan, Backlink  # type: ignore

class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = '__all__'

class ContentPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentPlan
        fields = '__all__'

class BacklinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Backlink
        fields = '__all__'
