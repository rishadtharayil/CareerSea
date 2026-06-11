import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Question

Question.objects.all().delete()
print("Cleared existing questions.")

questions = [
    {
        "text": "Scenario: Your team's project is failing and the deadline is tomorrow. What do you do first?",
        "choices": ["Analyze the data to find the root cause", "Organize an emergency brainstorming session", "Take charge and delegate tasks aggressively", "Focus on completing the most critical component myself"]
    },
    {
        "text": "When learning a complex new topic, what is your preferred approach?",
        "choices": ["Reading the official documentation and theory", "Building a small project immediately (trial and error)", "Watching a comprehensive video tutorial or lecture", "Discussing the concepts with a mentor or peer"]
    },
    {
        "text": "What type of impact motivates you the most?",
        "choices": ["Creating scalable systems or products", "Directly improving individual people's lives", "Driving business growth and strategy", "Advancing artistic or creative boundaries"]
    },
    {
        "text": "What is your current educational background and professional experience? (We'll use this to skip basic steps you already know.)",
        "choices": [] # Open text
    },
    {
        "text": "Are there any specific tools, technologies, or skills you already feel confident in?",
        "choices": [] # Open text
    }
]

for i, q in enumerate(questions):
    obj, created = Question.objects.get_or_create(text=q["text"], defaults={"order": i+1, "choices": q["choices"]})
    print(f"Created question: {q['text']}")

print("Seeding complete.")
