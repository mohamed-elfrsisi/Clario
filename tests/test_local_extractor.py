"""Tests for app/local_extractor.py — Step 1, rule-based, no external API."""
from app.local_extractor import (
    extract_skills, split_required_preferred, recommend_doc_type, extract,
)


def test_extract_skills_basic():
    skills = extract_skills("I know Python, Django, and SQL well.")
    assert "python" in skills
    assert "django" in skills
    assert "sql" in skills


def test_extract_skills_word_boundary_no_false_positive():
    # "java" should not match inside "javascript"
    skills = extract_skills("I use javascript daily.")
    assert "java" not in skills
    assert "javascript" in skills


def test_extract_skills_empty_text():
    assert extract_skills("") == []
    assert extract_skills(None) == []


def test_split_required_preferred():
    text = "Required: Python, SQL.\nPreferred: AWS is a plus.\nDocker is nice to have."
    required, preferred = split_required_preferred(text)
    assert "python" in required
    assert "sql" in required
    assert "aws" in preferred
    assert "docker" in preferred
    assert "aws" not in required


def test_split_required_preferred_no_markers_defaults_to_required():
    text = "We need Python and Django experience."
    required, preferred = split_required_preferred(text)
    assert "python" in required
    assert preferred == []


def test_recommend_doc_type_short_resume():
    text = "Skills: Python, Django. Projects: built a small app."
    assert recommend_doc_type(text) == "Resume"


def test_recommend_doc_type_academic():
    text = ("Publications: 3 peer-reviewed papers. Research assistant for 2 years. "
            "Currently working on my dissertation. Teaching assistant for CS101.")
    assert recommend_doc_type(text) == "Academic CV"


def test_recommend_doc_type_unclear_on_empty():
    assert recommend_doc_type("") == "Unclear"


def test_extract_full_pipeline_shape():
    result = extract(
        resume_text="Skills: Python, SQL, Django",
        opportunity_text="Required: Python, SQL, Docker",
    )
    assert set(result.keys()) == {
        "student_skills", "student_experience", "opportunity_required_skills",
        "opportunity_preferred_skills", "role_type", "recommended_doc_type",
    }
    assert "python" in result["student_skills"]
    assert "docker" in result["opportunity_required_skills"]


def test_extract_ungrouped_opportunity_skills_default_to_required():
    # A skill mentioned without any required/preferred marker anywhere in
    # the text should still count as required (documented BR-3 fallback).
    result = extract(resume_text="", opportunity_text="We use Kubernetes extensively.")
    assert "kubernetes" in result["opportunity_required_skills"]
