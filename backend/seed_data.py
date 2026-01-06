import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Question

questions = [
    {
        "text": "What fields interest you the most?",
        "choices": ["Technology & Engineering", "Healthcare & Medicine", "Arts & Design", "Business & Finance", "Social Sciences & Education"]
    },
    {
        "text": "How do you prefer to solve problems?",
        "choices": ["Analyzing data and logic", "Brainstorming creative solutions", "Discussing with others", "Hands-on experimentation"]
    },
    {
        "text": "What kind of work environment do you thrive in?",
        "choices": ["Structured and organized", "Flexible and dynamic", "Collaborative team setting", "Quiet and independent"]
    },
    {
        "text": "What is a key value you look for in a career?",
        "choices": ["High income potential", "Work-life balance", "Helping others", "Creative freedom", "Innovation"]
    },
    {
        "text": "Briefly describe your dream job or passion.",
        "choices": [] # Open text
    }
]

for i, q in enumerate(questions):
    obj, created = Question.objects.get_or_create(text=q["text"], defaults={"order": i+1, "choices": q["choices"]})
    if created:
        print(f"Created question: {q['text']}")
    else:
        print(f"Question already exists: {q['text']}")

print("Seeding complete.")
