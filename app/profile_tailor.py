"""
FR-12 — Master Profile Reuse (tailoring across opportunities).

Per BR-8 (FSD §1.8): tailoring changes ordering/emphasis only — it never
invents a skill or experience entry not already present in the master
Profile. This module contains the pure tailoring logic; persistence and
the demo-user wiring live in the profile router.
"""


def tailor_skills_for_opportunity(master_skills: list[str], required_skills: list[str],
                                    preferred_skills: list[str] | None = None) -> list[str]:
    """
    Reorders (never adds/removes) the student's master skill list so that
    skills matching this opportunity's requirements appear first — this is
    the "customize per opportunity" behavior from Problem #3 in the
    original problem statement, applied to a stored profile instead of a
    freshly uploaded document each time.
    """
    preferred_skills = preferred_skills or []
    required_lower = {s.lower() for s in required_skills}
    preferred_lower = {s.lower() for s in preferred_skills}

    def _priority(skill: str) -> int:
        s = skill.lower()
        if s in required_lower:
            return 0
        if s in preferred_lower:
            return 1
        return 2

    # Stable sort preserves original relative order within each priority
    # tier, so this never reorders unrelated skills arbitrarily.
    return sorted(master_skills, key=_priority)


def tailor_experience_for_opportunity(master_experience: list[dict], required_skills: list[str]) -> list[dict]:
    """
    Reorders experience entries so ones mentioning a required skill (in
    their description) surface first. Entries themselves are returned
    unmodified — only order changes, per BR-8.
    """
    required_lower = [s.lower() for s in required_skills]

    def _relevance(entry: dict) -> int:
        desc = (entry.get("description", "") or "").lower()
        matches = sum(1 for skill in required_lower if skill in desc)
        return -matches  # more matches = higher priority = sorts first

    return sorted(master_experience, key=_relevance)
