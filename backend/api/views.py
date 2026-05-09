import logging
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from .models import Question, UserResponse, CareerSuggestion, RoadmapStep
from .serializers import QuestionSerializer, UserResponseSerializer, UserSerializer
from .services import get_career_suggestion

User = get_user_model()
logger = logging.getLogger(__name__)

# VERSION: 1.0.3 - Explicit get_user_model
print("--- STARTING CAREERSEA API VIEWS ---")

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserHistoryView(generics.ListAPIView):
    serializer_class = UserResponseSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return UserResponse.objects.filter(user=self.request.user).order_by('-created_at')
        return UserResponse.objects.none()

class AssessmentBurstThrottle(AnonRateThrottle):
    scope = 'assessment_burst'

class AssessmentSustainedThrottle(AnonRateThrottle):
    scope = 'assessment_sustained'

class QuestionListView(generics.ListAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class SubmitAssessmentView(APIView):
    throttle_classes = [AssessmentBurstThrottle, AssessmentSustainedThrottle]

    def post(self, request):
        serializer = UserResponseSerializer(data=request.data)
        if serializer.is_valid():
            answers = serializer.validated_data['answers']
            
            try:
                # Link to user if authenticated
                user = request.user if request.user.is_authenticated else None
                user_response = serializer.save(user=user)
                
                suggestion_data = get_career_suggestion(answers)
                
                # Save CareerSuggestion
                career_data = suggestion_data.get('career', {})
                roadmap_data = suggestion_data.get('roadmap', [])
                
                suggestion = CareerSuggestion.objects.create(
                    user_response=user_response,
                    title=career_data.get('title', 'Unknown Career'),
                    description=career_data.get('description', ''),
                    reasoning=career_data.get('reasoning', '')
                )
                
                # Save RoadmapSteps
                for i, step in enumerate(roadmap_data):
                    RoadmapStep.objects.create(
                        career=suggestion,
                        title=step.get('title', ''),
                        description=step.get('description', ''),
                        duration=step.get('duration', ''),
                        resources=step.get('resources', []),
                        order=i+1
                    )
                
                return Response(UserResponseSerializer(user_response).data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.exception("Error in SubmitAssessmentView")
                return Response({"error": "AI Service Failed: " + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
