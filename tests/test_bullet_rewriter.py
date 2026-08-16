"""Tests for app/bullet_rewriter.py — FR-11, local, no invented metrics."""
from app.bullet_rewriter import rewrite_bullet, rewrite_bullets


def test_well_formed_bullet_left_unchanged():
    original = "Built a full-stack e-commerce platform using Django, resulting in a 40% faster checkout flow."
    r = rewrite_bullet(original)
    assert r["rewritten"] == original
    assert r["placeholders_added"] == 0
    assert r["needs_review"] is False


def test_weak_starter_gets_flagged():
    r = rewrite_bullet("Made an e-commerce website using Django.")
    assert "[Choose a stronger verb" in r["rewritten"]
    assert r["needs_review"] is True


def test_never_invents_a_number():
    r = rewrite_bullet("Helped with testing.")
    assert "%" not in r["rewritten"] or "%" in "Helped with testing."  # no invented percentages
    assert "[describe the outcome" in r["rewritten"]


def test_leadership_bullet_not_forced_to_have_tool():
    # Regression test: this used to produce "...project. using [tool/technology]"
    original = "Led a team of 4 students to deliver a capstone project."
    r = rewrite_bullet(original)
    assert "[tool/technology]" not in r["rewritten"]
    assert r["rewritten"] == original  # already has action verb + measurable result


def test_technical_verb_without_tool_gets_tool_placeholder():
    # No recognized tool/tech name in this sentence at all.
    r = rewrite_bullet("Developed a scheduling system for the student club.")
    assert "[tool/technology]" in r["rewritten"]


def test_technical_verb_with_recognized_tool_no_placeholder_needed():
    # "REST API" is itself a recognized tool/tech in the taxonomy.
    r = rewrite_bullet("Developed a REST API for a task management app using Flask.")
    assert "[tool/technology]" not in r["rewritten"]


def test_no_trailing_period_bug():
    r = rewrite_bullet("Made an e-commerce website using Django.")
    # Regression: previous version produced "Django. , resulting in..."
    assert ". ," not in r["rewritten"]
    assert not r["rewritten"].rstrip().endswith("..")


def test_empty_bullet_handled():
    r = rewrite_bullet("")
    assert r["rewritten"] == ""
    assert r["placeholders_added"] == 0


def test_rewrite_bullets_filters_blank_entries():
    results = rewrite_bullets(["Built an app using Flask, increased signups by 20%.", "", "   "])
    assert len(results) == 1
