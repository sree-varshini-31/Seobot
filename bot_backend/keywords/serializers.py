from rest_framework import serializers
from .models import Keyword

class KeywordSerializer(serializers.ModelSerializer):

    difficulty = serializers.SerializerMethodField()
    competition = serializers.SerializerMethodField()
    ranking_chance = serializers.SerializerMethodField()

    class Meta:
        model = Keyword
        fields = '__all__'

    def get_difficulty(self, obj):
        return obj.calculate_difficulty()

    def get_competition(self, obj):
        return obj.competition_level()

    def get_ranking_chance(self, obj):
        return obj.ranking_chance()