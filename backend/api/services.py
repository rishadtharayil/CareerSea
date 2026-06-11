import os
import json
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared config
# ---------------------------------------------------------------------------

# Set AI_PROVIDER=openrouter to fall back to OpenRouter (e.g. for local dev).
# Defaults to 'vertex' in production.
AI_PROVIDER = os.environ.get("AI_PROVIDER", "vertex").lower()

GCP_PROJECT    = os.environ.get("GCP_PROJECT", "project-bbccc83a-4d06-4b06-b85")
GCP_LOCATION   = os.environ.get("GCP_LOCATION", "us-central1")
VERTEX_MODEL   = os.environ.get("VERTEX_MODEL", "gemini-2.0-flash-001")

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_MODEL   = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")

AISTUDIO_API_KEY = os.environ.get("AISTUDIO_API_KEY")
AISTUDIO_MODEL   = os.environ.get("AISTUDIO_MODEL", "gemini-3.1-flash-lite")


# ---------------------------------------------------------------------------
# Shared: prompt builder & response parser
# ---------------------------------------------------------------------------

def _build_prompt(answers: dict) -> str:
    return f"""
You are a career counselor. Based on the following user responses, suggest THREE distinct career avenues:
1. "mainstream" (direct match to their skills/interests)
2. "adjacent" (a pivot leveraging their transferable skills)
3. "wildcard" (a bold, unexpected path based on their implicit traits)

For each path, provide a highly detailed, step-by-step roadmap to achieve it.
CRITICAL INSTRUCTION 1: Analyze their current background (education, current job) and SKIP roadmap steps they have already mastered. Tailor the guide strictly to their current level.
CRITICAL INSTRUCTION 2: Each roadmap must consist of at least 4-5 progressive milestones/steps. Do not truncate the roadmap to just 1 or 2 steps; even if they have some prior knowledge, map out a thorough journey from where they are today to professional mastery and job readiness.
CRITICAL INSTRUCTION 3: Each step's description must be extremely detailed, concrete, and rich (at least 3-5 sentences long). Provide specific sub-tasks, methodologies, tools/libraries to learn, and concrete projects they should build to prove their competence.
CRITICAL INSTRUCTION 4: For each step, provide 3-4 highly specific, real-world learning resources, official documentation links, books, or online courses. Avoid general descriptions like "tutorials" or "online resources".

User Responses:
{json.dumps(answers, indent=2)}

Return the output in the following STRICT JSON format (no markdown, no other text):
[
    {{
        "type": "mainstream",
        "career": {{
            "title": "Career Title",
            "description": "Inspiring description of the career",
            "reasoning": "Why this matches the user's profile"
        }},
        "roadmap": [
            {{
                "title": "Detailed Step Title",
                "description": "Detailed actionable instructions, concrete sub-tasks, libraries/methods, and projects to build.",
                "duration": "e.g., 2 months",
                "resources": [
                    "Free Code Camp - Responsive Web Design",
                    "Official Python Documentation",
                    "Udemy - Complete React Bootcamp"
                ]
            }}
        ]
    }},
    {{
        "type": "adjacent",
        ...
    }},
    {{
        "type": "wildcard",
        ...
    }}
]
""".strip()


def _parse_response(content: str) -> list:
    """Strip optional markdown fences and parse JSON."""
    raw = content.strip()
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0]
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0]
    return json.loads(raw.strip())


# ---------------------------------------------------------------------------
# Provider: Google Vertex AI (Gemini) — PRIMARY
# Uses Cloud Run's built-in service-account identity. No API key required.
# ---------------------------------------------------------------------------

def _get_career_suggestion_vertex(answers: dict) -> list:
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
    except ImportError:
        raise Exception(
            "google-cloud-aiplatform is not installed. "
            "Add it to requirements.txt or set AI_PROVIDER=openrouter."
        )

    vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)
    model = GenerativeModel(
        VERTEX_MODEL,
        system_instruction="You are a helpful and inspiring career coach.",
    )

    prompt = _build_prompt(answers)

    try:
        response = model.generate_content(prompt)
        return _parse_response(response.text)
    except Exception as e:
        logger.exception("Error calling Vertex AI")
        raise e


# ---------------------------------------------------------------------------
# Provider: OpenRouter — FALLBACK / LOCAL DEV
# Requires OPENROUTER_API_KEY environment variable.
# Switch with: AI_PROVIDER=openrouter
# ---------------------------------------------------------------------------

def _get_career_suggestion_openrouter(answers: dict) -> list:
    import requests

    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY is not set.")
        raise Exception("OpenRouter API Key is missing.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://careersea.in",
        "X-Title": "CareerSea",
    }

    data = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful and inspiring career coach."},
            {"role": "user",   "content": _build_prompt(answers)},
        ],
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=60,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return _parse_response(content)
    except Exception as e:
        logger.exception("Error calling OpenRouter")
        raise e

# ---------------------------------------------------------------------------
# Provider: Google AI Studio
# Requires AISTUDIO_API_KEY environment variable.
# Switch with: AI_PROVIDER=aistudio
# ---------------------------------------------------------------------------

def _get_career_suggestion_aistudio(answers: dict) -> list:
    import requests

    if not AISTUDIO_API_KEY:
        logger.error("AISTUDIO_API_KEY is not set.")
        raise Exception("AI Studio API Key is missing.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{AISTUDIO_MODEL}:generateContent?key={AISTUDIO_API_KEY}"
    
    headers = {"Content-Type": "application/json"}
    
    data = {
        "system_instruction": {
            "parts": [{"text": "You are a helpful and inspiring career coach."}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": _build_prompt(answers)}]}
        ],
        "generationConfig": {
            "temperature": 0.7
        }
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return _parse_response(content)
    except Exception as e:
        logger.exception("Error calling AI Studio")
        raise e


# ---------------------------------------------------------------------------
# Public API — dispatches based on AI_PROVIDER env var
# ---------------------------------------------------------------------------

def get_career_suggestion(answers: dict) -> list:
    """
    Dispatches to the configured AI provider.

    AI_PROVIDER=vertex     → Vertex AI Gemini (default, production)
    AI_PROVIDER=openrouter → OpenRouter API   (fallback / local dev)
    AI_PROVIDER=aistudio   → Google AI Studio
    """
    logger.info("AI provider: %s", AI_PROVIDER)

    if AI_PROVIDER == "vertex":
        return _get_career_suggestion_vertex(answers)
    elif AI_PROVIDER == "openrouter":
        return _get_career_suggestion_openrouter(answers)
    elif AI_PROVIDER == "aistudio":
        return _get_career_suggestion_aistudio(answers)
    else:
        raise Exception(
            f"Unknown AI_PROVIDER '{AI_PROVIDER}'. "
            "Valid values: 'vertex', 'openrouter', 'aistudio'."
        )


def _build_deep_dive_prompt(career_title: str, step_title: str, step_description: str, duration: str, resources: list) -> str:
    resources_str = ", ".join(resources) if resources else "None provided"
    return f"""
You are a senior mentor and career coach in the field of "{career_title}".
Provide a highly detailed, comprehensive study guide for this specific roadmap step:
Step Title: {step_title}
Description: {step_description}
Estimated Duration: {duration}
Key Resources: {resources_str}

Your guide should be structured, practical, and motivating. Write in clean Markdown format. You must cover the following sections:
1.  **Core Concepts to Master**: Break down this step into 3-4 essential technical concepts or skills the user must learn. Explain what each is and why it's important.
2.  **Weekly Study Plan / Milestones**: Suggest a timeline or progressive milestones (e.g., Week 1-2, Week 3-4, etc.) to cover this step within the {duration} timeframe.
3.  **Hands-on Project to Build**: Propose one specific, concrete mini-project the user should build to prove they have mastered this step. Give it a title, a brief description, and a list of key features.
4.  **Advanced Resources & Communities**: Suggest 2-3 additional real-world learning materials, documentation links, or communities (like Discord channels, subreddits, or forums) where they can get help.

Write in a direct, encouraging, Neubrutalist-adjacent style (bold headings, no fluff, extremely actionable).
""".strip()


def _get_step_deep_dive_vertex(career_title: str, step_title: str, step_description: str, duration: str, resources: list) -> str:
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
    except ImportError:
        raise Exception("google-cloud-aiplatform is not installed.")

    vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)
    model = GenerativeModel(
        VERTEX_MODEL,
        system_instruction="You are a helpful and inspiring senior mentor.",
    )

    prompt = _build_deep_dive_prompt(career_title, step_title, step_description, duration, resources)
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.exception("Error calling Vertex AI for deep dive")
        raise e


def _get_step_deep_dive_openrouter(career_title: str, step_title: str, step_description: str, duration: str, resources: list) -> str:
    import requests

    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY is not set.")
        raise Exception("OpenRouter API Key is missing.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://careersea.in",
        "X-Title": "CareerSea",
    }

    data = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful and inspiring senior mentor."},
            {"role": "user",   "content": _build_deep_dive_prompt(career_title, step_title, step_description, duration, resources)},
        ],
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=60,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return content
    except Exception as e:
        logger.exception("Error calling OpenRouter for deep dive")
        raise e


def _get_step_deep_dive_aistudio(career_title: str, step_title: str, step_description: str, duration: str, resources: list) -> str:
    import requests

    if not AISTUDIO_API_KEY:
        logger.error("AISTUDIO_API_KEY is not set.")
        raise Exception("AI Studio API Key is missing.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{AISTUDIO_MODEL}:generateContent?key={AISTUDIO_API_KEY}"
    
    headers = {"Content-Type": "application/json"}
    
    data = {
        "system_instruction": {
            "parts": [{"text": "You are a helpful and inspiring senior mentor."}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": _build_deep_dive_prompt(career_title, step_title, step_description, duration, resources)}]}
        ],
        "generationConfig": {
            "temperature": 0.7
        }
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return content
    except Exception as e:
        logger.exception("Error calling AI Studio for deep dive")
        raise e


def get_step_deep_dive(career_title: str, step_title: str, step_description: str, duration: str, resources: list) -> str:
    logger.info("AI provider for deep dive: %s", AI_PROVIDER)

    if AI_PROVIDER == "vertex":
        return _get_step_deep_dive_vertex(career_title, step_title, step_description, duration, resources)
    elif AI_PROVIDER == "openrouter":
        return _get_step_deep_dive_openrouter(career_title, step_title, step_description, duration, resources)
    elif AI_PROVIDER == "aistudio":
        return _get_step_deep_dive_aistudio(career_title, step_title, step_description, duration, resources)
    else:
        raise Exception(
            f"Unknown AI_PROVIDER '{AI_PROVIDER}'. "
            "Valid values: 'vertex', 'openrouter', 'aistudio'."
        )


def _build_chat_prompt(career_title: str, step_title: str, step_description: str, deep_dive: str, chat_history: list, new_message: str) -> str:
    history_str = ""
    for msg in chat_history:
        role = "Student" if msg.sender == "user" else "AI Mentor"
        history_str += f"{role}: {msg.text}\n"

    return f"""
You are a senior mentor and career coach in the field of "{career_title}".
You are helping a student master this roadmap step:
Step Title: {step_title}
Step Description: {step_description}

Here is the detailed study guide for this step:
{deep_dive}

Below is the chat history of your conversation so far:
{history_str}
Student: {new_message}

Provide a helpful, direct, and highly actionable response to the student's message. Stay strictly in character as an inspiring, supportive senior mentor. Write in clean Markdown format. Keep your response concise (1-3 paragraphs) and focused, providing code snippets or library names if requested. Avoid generic filler.
""".strip()


def _get_step_chat_vertex(career_title: str, step_title: str, step_description: str, deep_dive: str, chat_history: list, new_message: str) -> str:
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
    except ImportError:
        raise Exception("google-cloud-aiplatform is not installed.")

    vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)
    model = GenerativeModel(
        VERTEX_MODEL,
        system_instruction="You are a helpful and inspiring senior mentor.",
    )

    prompt = _build_chat_prompt(career_title, step_title, step_description, deep_dive, chat_history, new_message)
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.exception("Error calling Vertex AI for step chat")
        raise e


def _get_step_chat_openrouter(career_title: str, step_title: str, step_description: str, deep_dive: str, chat_history: list, new_message: str) -> str:
    import requests

    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY is not set.")
        raise Exception("OpenRouter API Key is missing.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://careersea.in",
        "X-Title": "CareerSea",
    }

    prompt = _build_chat_prompt(career_title, step_title, step_description, deep_dive, chat_history, new_message)

    data = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful and inspiring senior mentor."},
            {"role": "user",   "content": prompt},
        ],
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=60,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return content
    except Exception as e:
        logger.exception("Error calling OpenRouter for step chat")
        raise e


def _get_step_chat_aistudio(career_title: str, step_title: str, step_description: str, deep_dive: str, chat_history: list, new_message: str) -> str:
    import requests

    if not AISTUDIO_API_KEY:
        logger.error("AISTUDIO_API_KEY is not set.")
        raise Exception("AI Studio API Key is missing.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{AISTUDIO_MODEL}:generateContent?key={AISTUDIO_API_KEY}"
    
    headers = {"Content-Type": "application/json"}
    
    prompt = _build_chat_prompt(career_title, step_title, step_description, deep_dive, chat_history, new_message)
    
    data = {
        "system_instruction": {
            "parts": [{"text": "You are a helpful and inspiring senior mentor."}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.7
        }
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return content
    except Exception as e:
        logger.exception("Error calling AI Studio for step chat")
        raise e


def get_step_chat(career_title: str, step_title: str, step_description: str, deep_dive: str, chat_history: list, new_message: str) -> str:
    logger.info("AI provider for step chat: %s", AI_PROVIDER)

    if AI_PROVIDER == "vertex":
        return _get_step_chat_vertex(career_title, step_title, step_description, deep_dive, chat_history, new_message)
    elif AI_PROVIDER == "openrouter":
        return _get_step_chat_openrouter(career_title, step_title, step_description, deep_dive, chat_history, new_message)
    elif AI_PROVIDER == "aistudio":
        return _get_step_chat_aistudio(career_title, step_title, step_description, deep_dive, chat_history, new_message)
    else:
        raise Exception(
            f"Unknown AI_PROVIDER '{AI_PROVIDER}'. "
            "Valid values: 'vertex', 'openrouter', 'aistudio'."
        )
