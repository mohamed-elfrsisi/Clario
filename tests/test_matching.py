"""Tests for app/matching.py — the deterministic Compare step (NFR-1)."""
from app.matching import compare_skills


def test_synonym_matching():
    r = compare_skills(
        student_skills=["Python", "SQL", "Django", "Git", "ML"],
        required_skills=["Python", "SQL", "Django", "Git", "Docker"],
        preferred_skills=["AWS", "Machine Learning"],
    )
    assert r["missing_required"] == ["Docker"]
    assert "AWS" in r["missing_preferred"]
    assert "Machine Learning" not in r["missing_preferred"]  # matched via ML synonym
    assert r["match_pct"] == 0.8


def test_no_requirements_returns_none_pct():
    r = compare_skills(student_skills=["Python"], required_skills=[])
    assert r["match_pct"] is None


def test_perfect_match():
    r = compare_skills(student_skills=["Python", "SQL"], required_skills=["Python", "SQL"])
    assert r["match_pct"] == 1.0
    assert r["missing_required"] == []


def test_case_insensitivity():
    r = compare_skills(student_skills=["python"], required_skills=["PYTHON"])
    assert r["matched"] == ["PYTHON"]


def test_required_wins_over_preferred_overlap():
    # BR-3 guard: a skill in both lists should only count as required.
    r = compare_skills(
        student_skills=[],
        required_skills=["AWS"],
        preferred_skills=["AWS"],
    )
    assert r["missing_required"] == ["AWS"]
    assert r["missing_preferred"] == []


def test_fuzzy_match_catches_near_spelling():
    r = compare_skills(
        student_skills=["Postgres 15"],
        required_skills=["PostgreSQL"],
    )
    # Should either exact-match via synonym normalization or fuzzy-match —
    # either way it must not be reported as missing.
    assert r["missing_required"] == []
    assert len(r["matched"]) == 1


def test_empty_string_skills_are_dropped():
    r = compare_skills(student_skills=["", "  ", "Python"], required_skills=["", "Python"])
    assert r["matched"] == ["Python"]
    assert r["match_pct"] == 1.0


def test_whitespace_normalization():
    r = compare_skills(student_skills=["  Python   3  "], required_skills=["python 3"])
    assert r["match_pct"] == 1.0
