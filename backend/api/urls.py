from django.urls import path
from .views import QuestionListView, SubmitAssessmentView, RegisterView

urlpatterns = [
    path('questions/', QuestionListView.as_view(), name='question-list'),
    path('submit/', SubmitAssessmentView.as_view(), name='submit-assessment'),
    path('register/', RegisterView.as_view(), name='register'),
]
