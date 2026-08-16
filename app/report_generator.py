"""
STEP 3 — EXPLAIN, running entirely locally (no external API / no API key).

Replaces the previous Gemini-based app/llm_client.explain() call with
template-based natural-language generation grounded ONLY in the
already-computed Compare/Format-check results — same guardrail the
original EXTRACTION/EXPLANATION prompts stated, just enforced by
construction instead of by prompting an LLM not to hallucinate:
  - Every sentence is built from a value in `payload`; nothing is invented.
  - Missing skills are always phrased as "not detected in your document",
    never "you don't have this skill" (mirrors the original guardrail).
  - Never suggests the student misrepresent themselves.
"""


def _pct_label(match_pct: float | None) -> str:
    if match_pct is None:
        return "No required skills were listed for this opportunity, so no match percentage could be calculated."
    pct = round(match_pct * 100, 1)
    if pct >= 85:
        tone = "a strong match"
    elif pct >= 60:
        tone = "a solid match with a few gaps"
    elif pct >= 35:
        tone = "a partial match"
    else:
        tone = "an early-stage match"
    return f"Your document matches {pct}% of the required skills listed for this opportunity — {tone}."


def build_report(matched: list, missing_required: list, missing_preferred: list,
                  parse_risk_flags: list, match_pct: float | None,
                  doc_type_info: dict | None = None,
                  fuzzy_matches: list | None = None) -> dict:
    """
    Drop-in replacement for the old llm_client.explain(). Same return shape
    (strengths / gaps / recommendations), generated locally with no network
    call and no API key required.
    """
    fuzzy_matches = fuzzy_matches or []
    doc_type_info = doc_type_info or {}

    strengths = []
    if matched:
        shown = matched[:8]
        strengths.append(
            "Your document already demonstrates: " + ", ".join(shown) +
            ("." if len(matched) <= 8 else f", and {len(matched) - 8} more.")
        )
    if fuzzy_matches:
        strengths.append(
            f"{len(fuzzy_matches)} additional skill(s) were matched by close variant "
            "(e.g. a slightly different spelling or phrasing) rather than an exact match — "
            "worth double-checking those are phrased the way the opportunity expects."
        )
    if not strengths:
        strengths.append("No required skills from the opportunity were detected in your document yet.")

    gaps = []
    if missing_required:
        gaps.append(
            "The following required skills were not detected in your document: "
            + ", ".join(missing_required) + "."
        )
    if missing_preferred:
        gaps.append(
            "These preferred (nice-to-have) skills were also not detected: "
            + ", ".join(missing_preferred) + "."
        )
    for flag in parse_risk_flags:
        gaps.append(flag)
    if not gaps:
        gaps.append("No skill or formatting gaps were detected.")

    recommendations = []
    if missing_required:
        top = missing_required[:3]
        recommendations.append(
            "Prioritize adding concrete, truthful evidence of: " + ", ".join(top) +
            " — a bullet point describing real experience with each, if you have it, "
            "will do more for your match than just listing the keyword."
        )
    if parse_risk_flags:
        recommendations.append(
            "Address the formatting risk flags above (e.g. avoid image-only PDF pages or "
            "complex tables) so automated systems can read your document reliably."
        )
    recommended_type = doc_type_info.get("recommended_type")
    if recommended_type and recommended_type != "Unclear":
        recommendations.append(
            f"Based on the content and length of your document, a \"{recommended_type}\" "
            "format may suit this opportunity better than a generic resume."
        )
    if not recommendations:
        recommendations.append("Keep your document up to date as you gain more relevant experience.")

    # Lead with the headline number so the report reads naturally, matching
    # the previous LLM-generated report's structure.
    strengths.insert(0, _pct_label(match_pct))

    return {
        "strengths": strengths,
        "gaps": gaps,
        "recommendations": recommendations,
    }
