"""Tests for app/profile_builder.py — FR-10, local, no invented content."""
from app.profile_builder import build_draft


def test_empty_activities():
    r = build_draft([])
    assert r["is_thin"] is True
    assert r["sections"] == {}


def test_classifies_into_correct_sections():
    r = build_draft([
        "Built a to-do app using React.",
        "Completed CS50 course from Harvard.",
        "Volunteered teaching coding.",
        "Certified in AWS Cloud Practitioner.",
    ])
    assert "Projects" in r["sections"]
    assert "Education" in r["sections"]
    assert "Activities" in r["sections"]
    assert "Certifications" in r["sections"]


def test_education_entries_not_forced_to_have_result_placeholder():
    # Regression: previously forced "resulting in [outcome]" onto course
    # completions, which doesn't make sense for that entry type.
    r = build_draft(["Completed CS50 course from Harvard."])
    entry = r["sections"]["Education"][0]
    assert "[describe the outcome" not in entry["rewritten"]
    assert entry["needs_review"] is False


def test_project_entries_still_get_full_rewrite_treatment():
    r = build_draft(["Made a website using Django."])
    entry = r["sections"]["Projects"][0]
    assert "[Choose a stronger verb" in entry["rewritten"]


def test_thin_input_flagged_not_padded():
    r = build_draft(["One small thing."])
    assert r["is_thin"] is True
    assert r["note"] is not None
    assert len(r["sections"]["Projects"]) == 1  # not padded with invented entries


def test_skills_detected_across_entries():
    r = build_draft([
        "Built an app using Python and Flask.",
        "Volunteered using SQL for a nonprofit's database.",
    ])
    assert "python" in r["all_skills_detected"]
    assert "flask" in r["all_skills_detected"]
    assert "sql" in r["all_skills_detected"]
