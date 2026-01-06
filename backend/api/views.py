from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Question, UserResponse, CareerSuggestion, RoadmapStep
from .serializers import QuestionSerializer, UserResponseSerializer
from .services import get_career_suggestion

class QuestionListView(generics.ListAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class SubmitAssessmentView(APIView):
    def post(self, request):
        # We expect a payload like {"answers": {"Question 1": "Answer 1", ...}}
        serializer = UserResponseSerializer(data=request.data)
        if serializer.is_valid():
            answers = serializer.validated_data['answers']
            
            try:
                # Call AI Service BEFORE saving to ensure we can get result
                # Or save first. Saving first is safer for data persistence.
                user_response = serializer.save()
                
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
                
                # Return full response with suggestions
                # Re-serialize to include the new suggestions
                return Response(UserResponseSerializer(user_response).data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({"error": "AI Service Failed: " + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
