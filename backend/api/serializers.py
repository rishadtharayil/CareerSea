from rest_framework import serializers
from .models import Question, UserResponse, CareerSuggestion, RoadmapStep

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'choices']

class RoadmapStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapStep
        fields = ['order', 'title', 'description', 'duration', 'resources']

class CareerSuggestionSerializer(serializers.ModelSerializer):
    roadmap_steps = RoadmapStepSerializer(many=True, read_only=True)

    class Meta:
        model = CareerSuggestion
        fields = ['id', 'title', 'description', 'reasoning', 'roadmap_steps']

class UserResponseSerializer(serializers.ModelSerializer):
    suggestions = CareerSuggestionSerializer(many=True, read_only=True)
    answers = serializers.JSONField()

    class Meta:
        model = UserResponse
        fields = ['id', 'answers', 'suggestions', 'created_at']
