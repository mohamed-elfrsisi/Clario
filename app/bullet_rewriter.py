"""
FR-11 — Bullet Point Rewriting, running entirely locally (no external API).

Per FSD §1.8 guardrails: never invent a metric, tool, or outcome the
student didn't write. This module restructures what's already there into
an Action-Tool-Result shape and inserts a [placeholder] wherever a result
isn't stated — it never fills that placeholder with a plausible-sounding
number, matching the same rule the old LLM-based prompt was given.
"""
import re

_ACTION_VERBS = [
    "built", "developed", "designed", "led", "managed", "created",
    "implemented", "launched", "improved", "reduced", "increased",
    "analyzed", "coordinated", "delivered", "owned", "drove",
    "architected", "automated", "optimized", "mentored", "researched",
]

# Only these imply "a tool/technology should be named" — leadership and
# soft-skill verbs (led, managed, mentored, coordinated) don't need a tool
# placeholder forced onto them; forcing one produced nonsense like
# "Led a team of 4 students... using [tool/technology]" in testing.
_TECHNICAL_VERBS = [
    "built", "developed", "designed", "implemented", "architected",
    "automated", "optimized", "created", "launched",
]

_WEAK_STARTERS = re.compile(
    r"^\s*(made|did|worked on|helped with|was responsible for|helped)\b",
    re.IGNORECASE,
)

_RESULT_MARKERS = re.compile(
    r"(\d+%|\d+x\b|reduced|increased|improved|saved|grew|cut|from \d+ to \d+|"
    r"\bof \d+\b|\d+\s+(students?|people|users?|members?|clients?|projects?|hours?|days?|weeks?))",
    re.IGNORECASE,
)

# Tools/tech are pulled from the same taxonomy the extractor already uses,
# so "what tool was used" detection stays consistent across the app.
from app.skills_taxonomy import ALIAS_TO_CANONICAL, ALL_SURFACE_FORMS

_TOOL_PATTERN_CACHE: dict[str, re.Pattern] = {}


def _find_tools(text: str) -> list[str]:
    found = []
    for surface_form in ALL_SURFACE_FORMS:
        if surface_form not in _TOOL_PATTERN_CACHE:
            escaped = re.escape(surface_form)
            _TOOL_PATTERN_CACHE[surface_form] = re.compile(
                rf"(?<![a-zA-Z0-9]){escaped}(?![a-zA-Z0-9])", re.IGNORECASE
            )
        if _TOOL_PATTERN_CACHE[surface_form].search(text):
            found.append(ALIAS_TO_CANONICAL[surface_form])
    return found


def _has_result(text: str) -> bool:
    return bool(_RESULT_MARKERS.search(text))


def rewrite_bullet(original: str) -> dict:
    """
    Returns {original, rewritten, placeholders_added, needs_review}.
    Never invents a number — if no measurable result is stated, the
    rewrite includes a [describe the outcome, if any] placeholder instead
    of a fabricated one, per FSD §1.8 BR-7.
    """
    original = original.strip()
    if not original:
        return {"original": original, "rewritten": "", "placeholders_added": 0, "needs_review": False}

    tools = _find_tools(original)
    has_result = _has_result(original)
    starts_weak = bool(_WEAK_STARTERS.match(original))
    lower = original.lower()
    starts_with_action_verb = any(lower.startswith(v) for v in _ACTION_VERBS)
    starts_with_technical_verb = any(lower.startswith(v) for v in _TECHNICAL_VERBS)

    # If it's already well-formed (action verb + result, and a tool if the
    # verb is technical), leave it alone rather than rewriting for the sake
    # of rewriting — mirrors the edge case documented in FSD §1.8 for FR-11.
    needs_tool = starts_with_technical_verb and not tools
    if starts_with_action_verb and has_result and not needs_tool:
        return {
            "original": original,
            "rewritten": original,
            "placeholders_added": 0,
            "needs_review": False,
            "note": "Already includes an action verb and a measurable result — left as-is.",
        }

    placeholders_added = 0

    # Work with the sentence stripped of its trailing period so pieces can
    # be joined cleanly, then add exactly one period at the end.
    base = original.rstrip(".").strip()
    if starts_weak:
        base = _WEAK_STARTERS.sub("", base).strip()
        base = f"[Choose a stronger verb, e.g. Built/Led/Designed] {base}"

    suffix_parts = []
    if needs_tool:
        suffix_parts.append("using [tool/technology]")
        placeholders_added += 1
    if not has_result:
        suffix_parts.append(
            "resulting in [describe the outcome, if any — e.g. faster load time, more users, less manual work]"
        )
        placeholders_added += 1

    rewritten = base
    if suffix_parts:
        rewritten += ", " + ", ".join(suffix_parts)
    rewritten += "."

    return {
        "original": original,
        "rewritten": rewritten,
        "placeholders_added": placeholders_added,
        "needs_review": placeholders_added > 0,
    }


def rewrite_bullets(bullets: list[str]) -> list[dict]:
    return [rewrite_bullet(b) for b in bullets if b and b.strip()]
