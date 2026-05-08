from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Question, UserResponse, CareerSuggestion, RoadmapStep

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

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
