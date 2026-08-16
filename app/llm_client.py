"""
LLM client — EXTRACT and EXPLAIN steps (Architecture Doc §2.2).
Both use structured JSON output so downstream code never regex-parses text.

Uses Google Gemini (free tier available) rather than Claude — swap this
file if you switch providers later; nothing else in the pipeline needs to
change since matching.py and the API layer only depend on the return shape.

Guardrails (Technical Doc §3.2):
  - Extraction must not fabricate skills/experience not present in the input
  - Explanation is only ever given already-computed Compare/Format-check
    results — never raw resume text — so it can't invent metrics
"""
import os
import json
from google import genai
from google.genai import types
from google.genai import errors as genai_errors

_client = None
MODEL_NAME = "gemini-flash-latest"


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY not set. Add it to your .env file."
            )
        _client = genai.Client(api_key=api_key)
    return _client


def _generate_json(prompt: str) -> str:
    try:
        response = _get_client().models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
    except genai_errors.ClientError as e:
        # Wrap Gemini's own exceptions (bad key, quota, retired model, etc.)
        # so callers only ever need to catch RuntimeError, and the API layer
        # can turn this into a clean 502 instead of an unhandled 500.
        raise RuntimeError(f"Gemini API request failed: {e}")
    return response.text


def list_available_models() -> list[str]:
    """
    Diagnostic helper — not used by the pipeline itself. If MODEL_NAME ever
    404s again (Google retires/renames models frequently), run this to see
    what's actually available for your API key right now:

        python -c "from app.llm_client import list_available_models; print(list_available_models())"
    """
    client = _get_client()
    return [
        m.name for m in client.models.list()
        if "generateContent" in (m.supported_actions or [])
    ]


def _parse_json_response(raw_text: str, step_name: str) -> dict:
    """Shared defensive JSON parsing for both steps."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"{step_name} step returned invalid JSON: {e}\nRaw: {raw_text[:500]}")


EXTRACTION_SYSTEM_PROMPT = """You extract structured information from a student's \
resume/CV text and from a job/opportunity description. Do not invent, guess, \
or infer skills or experience that are not explicitly present in the text. \
If something is missing or unclear, omit it rather than guessing.

Respond with ONLY a JSON object, no other text, no markdown fences, matching \
exactly this shape:
{
  "student_skills": ["<skill>", ...],
  "student_experience": [{"title": "<short title>", "description": "<as written>"}],
  "opportunity_required_skills": ["<skill>", ...],
  "opportunity_preferred_skills": ["<skill>", ...],
  "role_type": "<short role type string or null>",
  "recommended_doc_type": "Resume" | "CV" | "Academic CV" | "Unclear"
}"""


def extract(resume_text: str, opportunity_text: str, context: dict | None = None) -> dict:
    """STEP 1 — single LLM call that parses both documents at once."""
    context = context or {}
    user_message = (
        f"{EXTRACTION_SYSTEM_PROMPT}\n\n"
        f"RESUME TEXT:\n---\n{resume_text}\n---\n\n"
        f"OPPORTUNITY TEXT:\n---\n{opportunity_text}\n---\n\n"
        f"CONTEXT: region={context.get('region', 'unknown')}, "
        f"opportunity_type={context.get('opportunity_type', 'unknown')}"
    )

    return _parse_json_response(_generate_json(user_message), "Extraction")


EXPLANATION_SYSTEM_PROMPT = """You write a short, honest, encouraging resume-analysis \
report for a student. You are given comparison and formatting results that have \
ALREADY been computed — ground every claim in that data, never invent metrics, \
skills, or experience. Missing skills must be phrased as "not detected in your \
document," never "you don't have this skill." Never suggest the student \
misrepresent themselves.

Respond with ONLY a JSON object, no other text, no markdown fences:
{
  "strengths": ["<short strength statement>", ...],
  "gaps": ["<short gap statement, phrased neutrally>", ...],
  "recommendations": ["<concrete, prioritized recommendation>", ...]
}"""


def explain(matched: list, missing_required: list, missing_preferred: list,
            parse_risk_flags: list, match_pct: float | None,
            doc_type_info: dict | None = None) -> dict:
    """STEP 3 — turns already-computed results into a human-readable report."""
    payload = {
        "matched_skills": matched,
        "missing_required_skills": missing_required,
        "missing_preferred_skills": missing_preferred,
        "parse_risk_flags": parse_risk_flags,
        "match_percentage": round(match_pct * 100, 1) if match_pct is not None else None,
        "document_type_recommendation": doc_type_info,
    }

    user_message = f"{EXPLANATION_SYSTEM_PROMPT}\n\n{json.dumps(payload, indent=2)}"
    return _parse_json_response(_generate_json(user_message), "Explanation")
