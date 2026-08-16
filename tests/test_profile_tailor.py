"""Tests for app/profile_tailor.py — FR-12, ordering only, per BR-8."""
from app.profile_tailor import tailor_skills_for_opportunity, tailor_experience_for_opportunity


def test_required_skills_surface_first():
    skills = ["C++", "Python", "Django", "Photoshop", "SQL"]
    result = tailor_skills_for_opportunity(skills, required_skills=["Python", "SQL"])
    assert result[0] in ("Python", "SQL")
    assert result[1] in ("Python", "SQL")


def test_never_adds_or_removes_skills():
    skills = ["A", "B", "C"]
    result = tailor_skills_for_opportunity(skills, required_skills=["Z"])  # Z not in profile
    assert set(result) == set(skills)  # Z must never appear — that would be inventing a skill
    assert "Z" not in result


def test_preferred_skills_rank_below_required():
    skills = ["A", "B", "C"]
    result = tailor_skills_for_opportunity(skills, required_skills=["C"], preferred_skills=["B"])
    assert result == ["C", "B", "A"]


def test_no_requirements_leaves_order_unchanged():
    skills = ["A", "B", "C"]
    assert tailor_skills_for_opportunity(skills, required_skills=[]) == skills


def test_experience_relevance_ordering():
    exp = [
        {"title": "Unrelated gig", "description": "Edited photos using Photoshop"},
        {"title": "Relevant project", "description": "Built REST API using Django and PostgreSQL"},
    ]
    result = tailor_experience_for_opportunity(exp, required_skills=["Django", "PostgreSQL"])
    assert result[0]["title"] == "Relevant project"


def test_experience_entries_never_modified_only_reordered():
    exp = [{"title": "X", "description": "uses Python"}]
    result = tailor_experience_for_opportunity(exp, required_skills=["Python"])
    assert result[0] == exp[0]  # same dict content, not mutated/rewritten
