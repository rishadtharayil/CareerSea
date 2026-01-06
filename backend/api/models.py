from django.db import models

class Question(models.Model):
    text = models.CharField(max_length=255)
    order = models.IntegerField(default=0)
    choices = models.JSONField(default=list, blank=True)  # List of strings, empty for open text

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text

class UserResponse(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    answers = models.JSONField()  # {question_id: answer_text}

    def __str__(self):
        return f"Response {self.id} at {self.created_at}"

class CareerSuggestion(models.Model):
    user_response = models.ForeignKey(UserResponse, on_delete=models.CASCADE, related_name='suggestions')
    title = models.CharField(max_length=255)
    description = models.TextField()
    reasoning = models.TextField()

    def __str__(self):
        return self.title

class RoadmapStep(models.Model):
    career = models.ForeignKey(CareerSuggestion, on_delete=models.CASCADE, related_name='roadmap_steps')
    title = models.CharField(max_length=255)
    description = models.TextField()
    duration = models.CharField(max_length=100, blank=True)
    order = models.IntegerField(default=0)
    resources = models.JSONField(default=list, blank=True) # List of links or resource names

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.order}. {self.title} ({self.career.title})"
