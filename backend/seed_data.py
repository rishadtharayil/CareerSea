import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Question

Question.objects.all().delete()
print("Cleared existing questions.")

questions = [
    {
        "text": "What is your age group?",
        "choices": [
            "8 - 11 years old (Elementary school)",
            "12 - 14 years old (Middle school)",
            "15 - 18 years old (High school)"
        ]
    },
    {
        "text": "Imagine you are given a free afternoon. Which of these activities sounds like the most fun?",
        "choices": [
            "Building a Lego set, fixing a toy, or gardening outdoors (Realistic)",
            "Solving a tricky riddle, doing a science experiment, or coding (Investigative)",
            "Drawing, painting, writing a story, or playing an instrument (Artistic)",
            "Helping a friend study, coaching a team, or volunteering (Social)",
            "Starting a mini-business (like a lemonade stand) or leading a club (Enterprising)",
            "Organizing a collection of cards/books, planning a schedule, or cataloging data (Conventional)"
        ]
    },
    {
        "text": "Which school subject do you look forward to the most?",
        "choices": [
            "P.E. (Gym), Woodshop, or Agriculture (Realistic)",
            "Math, Science, or Computer Programming (Investigative)",
            "Art, Music, English Literature, or Drama (Artistic)",
            "Social Studies, Psychology, or Peer Tutoring (Social)",
            "Speech/Debate, Economics, or Student Council (Enterprising)",
            "Accounting, Statistics, or Computer Applications (Conventional)"
        ]
    },
    {
        "text": "If you could build or create one thing right now, what would it be?",
        "choices": [
            "A wooden birdhouse, a simple robot, or a model car",
            "A program that predicts weather, or a math puzzle solver",
            "A song, a graphic novel, or a fashion line",
            "A community guide or an after-school tutoring group",
            "A new app that you can sell to others, or a charity campaign",
            "An organized database of all game stats, or a detailed study planner"
        ]
    },
    {
        "text": "What is your superpower or what do you enjoy doing to help others?",
        "choices": [
            "I can physically fix things or build things when they break",
            "I can research questions and find out how things work",
            "I can design things, write, or express ideas beautifully",
            "I listen, teach, and make others feel included and helped",
            "I can organize a team, lead, and get people excited about an idea",
            "I keep track of things, check for errors, and organize schedules"
        ]
    },
    {
        "text": "What kind of workspace sounds most exciting to you when you grow up?",
        "choices": [
            "Working outdoors in nature, or in a workshop/garage (Realistic)",
            "In a laboratory, research center, or quiet office solving math/science problems (Investigative)",
            "In a creative studio, theater, or design firm with lots of artistic freedom (Artistic)",
            "In a school, hospital, community center, or space helping people directly (Social)",
            "In a dynamic startup office, courtroom, or business boardroom leading teams (Enterprising)",
            "In an office with structured tasks, working with spreadsheets, databases, and organized records (Conventional)"
        ]
    },
    {
        "text": "What are some of your favorite hobbies, games (like Minecraft, Roblox), or books?",
        "choices": []  # Open text
    },
    {
        "text": "Is there any specific job or career you've dreamed about? (e.g., Astronaut, Game Developer, Doctor, Artist, Vet, etc.)",
        "choices": []  # Open text
    }
]

for i, q in enumerate(questions):
    obj, created = Question.objects.get_or_create(text=q["text"], defaults={"order": i+1, "choices": q["choices"]})
    print(f"Created question: {q['text']}")

print("Seeding complete.")
