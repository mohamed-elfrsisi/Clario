"""
STEP 1 — EXTRACT, running entirely locally (no external API / no API key).

Replaces the previous Gemini-based app/llm_client.extract() call. This is a
deterministic, rule-based extractor over the local skills taxonomy
(app/skills_taxonomy.py) plus lightweight heuristics for experience bullets
and document-type recommendation.

Why rule-based instead of another hosted LLM:
  - Zero external dependency / no network call / no API key to manage.
  - Fully deterministic and auditable — same input always gives same output,
    which matters for the "trustworthy compare step" requirement (NFR-1)
    that matching.py already follows.
  - Cheap and fast enough to run per-request with no rate limits.

Trade-off (documented, not hidden): a maintained taxonomy is less flexible
than an LLM at catching totally novel skill phrasings. Mitigate by growing
SKILLS_TAXONOMY over time and by the fuzzy-matching layer in matching.py,
which catches near-miss spellings/variants that aren't literal aliases.
"""
import re

from app.skills_taxonomy import ALIAS_TO_CANONICAL, ALL_SURFACE_FORMS

_WORD_BOUNDARY_CACHE: dict[str, re.Pattern] = {}


def _pattern_for(term: str) -> re.Pattern:
    if term not in _WORD_BOUNDARY_CACHE:
        # Allow the term to contain punctuation like "c++", "node.js" —
        # escape it, but still require it not be glued to surrounding letters.
        escaped = re.escape(term)
        _WORD_BOUNDARY_CACHE[term] = re.compile(
            rf"(?<![a-zA-Z0-9]){escaped}(?![a-zA-Z0-9])", re.IGNORECASE
        )
    return _WORD_BOUNDARY_CACHE[term]


def extract_skills(text: str) -> list[str]:
    """Return canonical skill names found in `text` via alias phrase matching."""
    if not text:
        return []
    found: set[str] = set()
    for surface_form in ALL_SURFACE_FORMS:
        if _pattern_for(surface_form).search(text):
            found.add(ALIAS_TO_CANONICAL[surface_form])
    return sorted(found)


_REQUIRED_MARKERS = re.compile(
    r"(required|must have|minimum qualifications|you have|you must)", re.IGNORECASE
)
_PREFERRED_MARKERS = re.compile(
    r"(preferred|nice to have|bonus|a plus|ideally)", re.IGNORECASE
)


def split_required_preferred(opportunity_text: str) -> tuple[list[str], list[str]]:
    """
    Heuristic split: skills found in a sentence/line near a "preferred"-style
    marker are treated as preferred; everything else found is required.
    This is intentionally conservative (defaults to required) since BR-3
    treats required gaps as the ones that matter most.
    """
    if not opportunity_text:
        return [], []

    required: set[str] = set()
    preferred: set[str] = set()

    # Work line-by-line / sentence-by-sentence so a "preferred" section
    # doesn't leak into the required bucket just because both appear
    # somewhere in the same document.
    chunks = re.split(r"[\n\.]", opportunity_text)
    for chunk in chunks:
        chunk_skills = extract_skills(chunk)
        if not chunk_skills:
            continue
        if _PREFERRED_MARKERS.search(chunk) and not _REQUIRED_MARKERS.search(chunk):
            preferred.update(chunk_skills)
        else:
            required.update(chunk_skills)

    # A skill mentioned in both a required-flavored and preferred-flavored
    # chunk stays required (required wins — mirrors the guard already in
    # app/matching.py).
    preferred -= required
    return sorted(required), sorted(preferred)


_BULLET_LINE = re.compile(r"^\s*[-*•\u2022]|^\s*\d+[.)]\s+")
_ACTION_VERB_START = re.compile(
    r"^\s*(led|built|developed|designed|managed|created|implemented|launched|"
    r"improved|reduced|increased|analyzed|coordinated|delivered|owned|drove|"
    r"architected|automated|optimized|mentored|presented|researched)",
    re.IGNORECASE,
)


def extract_experience(resume_text: str, max_items: int = 8) -> list[dict]:
    """
    Pulls plausible experience bullets: lines that look like bullet points
    or start with a resume action verb. Kept verbatim (no rewriting) so
    nothing invented gets attributed to the student — matches the guardrail
    the original EXTRACTION_SYSTEM_PROMPT stated ("as written").
    """
    if not resume_text:
        return []

    items = []
    for line in resume_text.splitlines():
        stripped = line.strip()
        if not stripped or len(stripped) < 8:
            continue
        if _BULLET_LINE.match(line) or _ACTION_VERB_START.match(stripped):
            title = stripped[:60] + ("..." if len(stripped) > 60 else "")
            items.append({"title": title, "description": stripped})
        if len(items) >= max_items:
            break
    return items


_ACADEMIC_MARKERS = re.compile(
    r"(publications?|peer[- ]reviewed|conference proceedings|dissertation|"
    r"thesis|research assistant|teaching assistant|grant|fellowship)",
    re.IGNORECASE,
)
_CV_LENGTH_THRESHOLD = 6000  # chars — long documents skew toward CV/Academic CV


def recommend_doc_type(resume_text: str) -> str:
    if not resume_text or not resume_text.strip():
        return "Unclear"
    academic_hits = len(_ACADEMIC_MARKERS.findall(resume_text))
    if academic_hits >= 2:
        return "Academic CV"
    if academic_hits == 1 or len(resume_text) > _CV_LENGTH_THRESHOLD:
        return "CV"
    return "Resume"


def guess_role_type(opportunity_text: str) -> str | None:
    """Very light heuristic — first Title Case-ish phrase near the top of the text."""
    if not opportunity_text:
        return None
    first_line = opportunity_text.strip().splitlines()[0].strip()
    if 0 < len(first_line) <= 80:
        return first_line
    return None


def extract(resume_text: str, opportunity_text: str, context: dict | None = None) -> dict:
    """
    Drop-in replacement for the old llm_client.extract(). Same return shape,
    computed locally with no network call and no API key required.
    """
    student_skills = extract_skills(resume_text)
    required_skills, preferred_skills = split_required_preferred(opportunity_text)
    # Anything mentioned in the opportunity text but not bucketed by the
    # required/preferred heuristic (e.g. skills mentioned outside a
    # requirements section) still counts as required by default — BR-3
    # says required drives the headline number, so under-counting required
    # skills is the riskier failure mode to avoid.
    all_opportunity_skills = set(extract_skills(opportunity_text))
    bucketed = set(required_skills) | set(preferred_skills)
    required_skills = sorted(set(required_skills) | (all_opportunity_skills - bucketed))

    return {
        "student_skills": student_skills,
        "student_experience": extract_experience(resume_text),
        "opportunity_required_skills": required_skills,
        "opportunity_preferred_skills": preferred_skills,
        "role_type": guess_role_type(opportunity_text),
        "recommended_doc_type": recommend_doc_type(resume_text),
    }
