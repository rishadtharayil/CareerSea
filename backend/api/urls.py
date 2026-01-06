from django.urls import path
from .views import QuestionListView, SubmitAssessmentView

urlpatterns = [
    path('questions/', QuestionListView.as_view(), name='question-list'),
    path('submit/', SubmitAssessmentView.as_view(), name='submit-assessment'),
]
