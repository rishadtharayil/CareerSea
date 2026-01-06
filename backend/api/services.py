import os
import requests
import json
import logging

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

def get_career_suggestion(answers):
    """
    Sends user answers to OpenRouter to get a career suggestion and roadmap.
    answers: dict {question_text: user_answer}
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY is not set.")
        raise Exception("OpenRouter API Key is missing.")

    prompt = f"""
    You are a career counselor. Based on the following user responses, suggest the ONE best career path and provide a very detailed, step-by-step roadmap to achieve it.
    
    User Responses:
    {json.dumps(answers, indent=2)}
    
    Return the output in the following STRICT JSON format (no markdown, no other text):
    {{
        "career": {{
            "title": "Career Title",
            "description": "Inspiring description of the career",
            "reasoning": "Why this matches the user's profile"
        }},
        "roadmap": [
            {{
                "title": "Detailed Step Title",
                "description": "Actionable instructions and details.",
                "duration": "e.g., 1 month",
                "resources": ["Resource Name or URL"]
            }}
        ]
    }}
    """
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "CareerSea"
    }
    
    # Using a capable free model or low-cost model
    model = "xiaomi/mimo-v2-flash:free"
    
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful and inspiring career coach."},
            {"role": "user", "content": prompt}
        ]
    }
    
    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        # Clean up markdown if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        return json.loads(content)
        
    except Exception as e:
        logger.exception("Error calling OpenRouter")
        raise e
