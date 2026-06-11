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


# ---------------------------------------------------------------------------
# Shared: prompt builder & response parser
# ---------------------------------------------------------------------------

def _build_prompt(answers: dict) -> str:
    return f"""
You are a career counselor. Based on the following user responses, suggest THREE distinct career avenues:
1. "mainstream" (direct match to their skills/interests)
2. "adjacent" (a pivot leveraging their transferable skills)
3. "wildcard" (a bold, unexpected path based on their implicit traits)

For each path, provide a very detailed, step-by-step roadmap to achieve it.
CRITICAL INSTRUCTION: Analyze their current background (education, current job) and SKIP roadmap steps they have already mastered. Tailor the guide strictly to their current level.

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
                "description": "Actionable instructions and details.",
                "duration": "e.g., 1 month",
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

IMPORTANT: For "resources", provide at least 2-3 specific, real-world learning resources, documentation links, or course names. Do not use generic placeholders.
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
# Public API — dispatches based on AI_PROVIDER env var
# ---------------------------------------------------------------------------

def get_career_suggestion(answers: dict) -> list:
    """
    Dispatches to the configured AI provider.

    AI_PROVIDER=vertex     → Vertex AI Gemini (default, production)
    AI_PROVIDER=openrouter → OpenRouter API   (fallback / local dev)
    """
    logger.info("AI provider: %s", AI_PROVIDER)

    if AI_PROVIDER == "vertex":
        return _get_career_suggestion_vertex(answers)
    elif AI_PROVIDER == "openrouter":
        return _get_career_suggestion_openrouter(answers)
    else:
        raise Exception(
            f"Unknown AI_PROVIDER '{AI_PROVIDER}'. "
            "Valid values: 'vertex', 'openrouter'."
        )
