"""
STEP 2 — COMPARE. Deterministic, no LLM call.

Per Architecture Doc §2.4 and Technical Doc §3.2: intentionally plain code,
not an LLM call, to remove hallucination risk from the one part of the
system that most needs to be trustworthy — whether a required skill is
present or not (NFR-1).

Implements:
  - BR-3: required skills drive match_pct; preferred skills are reported
    separately so a student isn't penalized in the headline number for
    "nice to have" gaps.
  - Synonym normalization (FSD §1.8 edge case: "ML" vs "Machine Learning")
  - Fuzzy near-match fallback (new): catches spelling/punctuation variants
    that aren't in the hardcoded synonym dict (e.g. "Postgres 15" vs
    "PostgreSQL", trailing whitespace, minor typos). Still deterministic —
    same threshold, same result every run — just less brittle than
    exact-string-after-lookup matching.
"""
from difflib import SequenceMatcher

SYNONYMS = {
    "ml": "machine learning",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "nlp": "natural language processing",
    "cv": "computer vision",
    "rest api": "rest apis",
    "restful api": "rest apis",
    "restful apis": "rest apis",
}

# Similarity threshold for the fuzzy fallback. Chosen conservatively high
# (close to exact match) so we don't start "matching" unrelated skills —
# the whole point of keeping this step non-LLM is to avoid false positives.
FUZZY_THRESHOLD = 0.88


def _normalize(skill: str) -> str:
    cleaned = " ".join(skill.strip().lower().split())  # collapse internal whitespace too
    if cleaned in SYNONYMS:
        return SYNONYMS[cleaned]
    # Fall back to matching on the leading token, so version-suffixed
    # variants like "Postgres 15" or "Python 3" still resolve to their
    # canonical synonym instead of only being caught (or missed) by the
    # fuzzy fallback.
    first_word = cleaned.split(" ", 1)[0] if cleaned else cleaned
    return SYNONYMS.get(first_word, cleaned)


def _best_fuzzy_match(target: str, candidates: list[str]) -> tuple[str | None, float]:
    """Returns (best matching candidate, score) or (None, 0.0) if nothing clears the threshold."""
    best_candidate, best_score = None, 0.0
    for candidate in candidates:
        score = SequenceMatcher(None, target, candidate).ratio()
        if score > best_score:
            best_candidate, best_score = candidate, score
    if best_score >= FUZZY_THRESHOLD:
        return best_candidate, best_score
    return None, 0.0


def compare_skills(student_skills: list[str], required_skills: list[str],
                    preferred_skills: list[str] | None = None) -> dict:
    """
    student_skills: what the student's document contains
    required_skills: must-have requirements from the opportunity
    preferred_skills: nice-to-have requirements from the opportunity

    Returns: {matched, missing_required, missing_preferred, match_pct, fuzzy_matches}
    """
    preferred_skills = preferred_skills or []

    # Drop empty/whitespace-only entries defensively — an extractor bug
    # upstream shouldn't be able to inflate match_pct with a "" == "" match.
    student_skills = [s for s in student_skills if s and s.strip()]
    required_skills = [s for s in required_skills if s and s.strip()]
    preferred_skills = [s for s in preferred_skills if s and s.strip()]

    student_norm = {_normalize(s): s for s in student_skills}
    required_norm = {_normalize(s): s for s in required_skills}
    preferred_norm = {_normalize(s): s for s in preferred_skills}

    # Guard: never let a skill count as both required and preferred —
    # if extraction returns overlap, required wins (required gaps matter more).
    preferred_norm = {n: o for n, o in preferred_norm.items() if n not in required_norm}

    student_keys = list(student_norm.keys())

    matched = []
    missing_required = []
    fuzzy_matches = []  # transparency: which matches were fuzzy, not exact

    for norm, orig in required_norm.items():
        if norm in student_norm:
            matched.append(orig)
            continue
        fuzzy_hit, score = _best_fuzzy_match(norm, student_keys)
        if fuzzy_hit:
            matched.append(orig)
            fuzzy_matches.append({
                "required_skill": orig,
                "matched_to": student_norm[fuzzy_hit],
                "similarity": round(score, 3),
            })
        else:
            missing_required.append(orig)

    missing_preferred = []
    for norm, orig in preferred_norm.items():
        if norm in student_norm:
            continue
        fuzzy_hit, score = _best_fuzzy_match(norm, student_keys)
        if fuzzy_hit:
            fuzzy_matches.append({
                "preferred_skill": orig,
                "matched_to": student_norm[fuzzy_hit],
                "similarity": round(score, 3),
            })
        else:
            missing_preferred.append(orig)

    match_pct = (len(matched) / len(required_norm)) if required_norm else None

    return {
        "matched": matched,
        "missing_required": missing_required,
        "missing_preferred": missing_preferred,
        "match_pct": round(match_pct, 4) if match_pct is not None else None,
        "fuzzy_matches": fuzzy_matches,
    }
