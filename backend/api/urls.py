from django.urls import path
from .views import QuestionListView, SubmitAssessmentView, RegisterView, UserHistoryView, RoadmapStepDeepDiveView

urlpatterns = [
    path('questions/', QuestionListView.as_view(), name='question-list'),
    path('submit/', SubmitAssessmentView.as_view(), name='submit-assessment'),
    path('register/', RegisterView.as_view(), name='register'),
    path('history/', UserHistoryView.as_view(), name='user-history'),
    path('steps/<int:step_id>/deep-dive/', RoadmapStepDeepDiveView.as_view(), name='step-deep-dive'),
]
