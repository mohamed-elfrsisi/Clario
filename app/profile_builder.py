"""
FR-10 — Guided Build for students with no existing document.

Takes free-text activities (courses, projects, hackathons, etc.) and
organizes them into standard resume sections, applying the same
Action-Tool-Result rewriting used in FR-11 to each entry. Per FSD §1.8:
the whole output is flagged "draft — needs review" until placeholders
are filled, and thin input is flagged rather than padded artificially.
"""
from app.bullet_rewriter import rewrite_bullet
from app.local_extractor import extract_skills

# Simple keyword routing into sections — a student's free-text entry is
# sorted by which category keywords it contains, defaulting to Projects
# since that's the most common entry type for students with no prior doc.
_SECTION_KEYWORDS = {
    "Education": ["course", "university", "degree", "gpa", "graduated", "major"],
    "Certifications": ["certificate", "certification", "certified", "credential"],
    "Activities": ["volunteer", "club", "hackathon", "competition", "society", "member"],
}


def _classify_section(entry: str) -> str:
    lower = entry.lower()
    for section, keywords in _SECTION_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return section
    return "Projects"


def build_draft(activities: list[str]) -> dict:
    """
    activities: free-text list, e.g. ["Built a to-do app with React",
    "Volunteered at a coding bootcamp", "Completed CS50 course"]

    Returns a structured draft with sections, plus flags for thin input
    (FSD §1.8 edge case) rather than inventing extra content to pad it.
    """
    activities = [a.strip() for a in activities if a and a.strip()]

    if not activities:
        return {
            "sections": {},
            "all_skills_detected": [],
            "is_thin": True,
            "note": "No activities provided — nothing to build a draft from.",
        }

    sections: dict[str, list[dict]] = {}
    all_skills: set[str] = set()

    # Only Projects/Activities entries get the full Action-Tool-Result
    # rewrite treatment — forcing a "resulting in [outcome]" placeholder
    # onto an Education or Certification line ("Completed CS50 course")
    # produces nonsense, since course completions don't have a measurable
    # "result" the way a project does.
    _REWRITE_ELIGIBLE_SECTIONS = {"Projects", "Activities"}

    for entry in activities:
        section = _classify_section(entry)
        skills_here = extract_skills(entry)
        all_skills.update(skills_here)

        if section in _REWRITE_ELIGIBLE_SECTIONS:
            rewritten = rewrite_bullet(entry)
            sections.setdefault(section, []).append({
                "original": rewritten["original"],
                "rewritten": rewritten["rewritten"],
                "needs_review": rewritten["needs_review"],
            })
        else:
            # Light-touch: just clean whitespace/trailing period —
            # no forced result placeholder for Education/Certifications.
            cleaned = entry.rstrip(".").strip() + "."
            sections.setdefault(section, []).append({
                "original": entry,
                "rewritten": cleaned,
                "needs_review": False,
            })

    is_thin = len(activities) <= 2
    note = None
    if is_thin:
        note = (
            "This draft is based on very few entries. Consider adding more: "
            "personal projects, coursework, volunteering, freelance work, or "
            "competitions — even small ones are worth including."
        )

    return {
        "sections": sections,
        "all_skills_detected": sorted(all_skills),
        "is_thin": is_thin,
        "note": note,
        "status": "draft — needs review",
    }
