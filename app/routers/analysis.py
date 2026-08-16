from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, matching, local_extractor, report_generator
from app.deps import get_or_create_demo_user

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("", response_model=schemas.AnalysisOut)
def run_analysis(payload: schemas.AnalysisRequest, db: Session = Depends(get_db)):
    """
    Full pipeline per Architecture §2.2 / FSD §1.8 FR-6/FR-9:
      1. Extract  (local, rule-based) -> skills/experience/requirements
         from both documents (app/local_extractor.py — no external API)
      2. Compare  (code)              -> matched/missing skills, match %
         (app/matching.py)
      3. Explain  (local, template)   -> strengths/gaps/recommendations
         grounded in step 2 (app/report_generator.py — no external API)
    """
    user = get_or_create_demo_user(db)

    doc = db.query(models.Document).filter(models.Document.id == payload.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    opp = db.query(models.Opportunity).filter(models.Opportunity.id == payload.opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    # Step 1 — Extract (local, deterministic — no network call)
    extracted = local_extractor.extract(
        resume_text=doc.raw_text,
        opportunity_text=opp.raw_text,
        context={"region": opp.region, "opportunity_type": opp.role_type},
    )

    student_skills = extracted.get("student_skills", [])
    required_skills = extracted.get("opportunity_required_skills", [])
    preferred_skills = extracted.get("opportunity_preferred_skills", [])

    if not student_skills and not required_skills:
        # Per FSD §1.8 edge case: zero skills on both sides is a parsing
        # failure signal, not a valid zero-match result.
        raise HTTPException(
            status_code=422,
            detail="Could not extract meaningful content from the resume or "
                   "opportunity text. Please check the input and try again.",
        )

    # Step 2 — Compare (deterministic)
    comparison = matching.compare_skills(student_skills, required_skills, preferred_skills)

    doc_type_info = {
        "recommended_type": extracted.get("recommended_doc_type"),
    }

    # Step 3 — Explain (local template generator, grounded only in step 2's output)
    explanation = report_generator.build_report(
        matched=comparison["matched"],
        missing_required=comparison["missing_required"],
        missing_preferred=comparison["missing_preferred"],
        parse_risk_flags=doc.parse_risk_flags or [],
        match_pct=comparison["match_pct"],
        doc_type_info=doc_type_info,
        fuzzy_matches=comparison.get("fuzzy_matches", []),
    )

    report_lines = []
    if explanation.get("strengths"):
        report_lines.append("STRENGTHS:\n" + "\n".join(f"- {s}" for s in explanation["strengths"]))
    if explanation.get("gaps"):
        report_lines.append("GAPS:\n" + "\n".join(f"- {g}" for g in explanation["gaps"]))
    if explanation.get("recommendations"):
        report_lines.append("RECOMMENDATIONS:\n" + "\n".join(f"- {r}" for r in explanation["recommendations"]))
    report_text = "\n\n".join(report_lines)

    analysis = models.Analysis(
        user_id=user.id,
        document_id=doc.id,
        opportunity_id=opp.id,
        matched_skills=comparison["matched"],
        missing_skills=comparison["missing_required"],  # headline gaps = required only, per BR-3
        match_pct=comparison["match_pct"],
        parse_ability_score=doc.parse_ability_score,
        parse_risk_flags=doc.parse_risk_flags or [],
        fuzzy_matches=comparison.get("fuzzy_matches", []),
        report_text=report_text,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return schemas.AnalysisOut(
        analysis_id=analysis.id,
        matched=analysis.matched_skills,
        missing=analysis.missing_skills,
        match_pct=analysis.match_pct,
        parse_ability_score=analysis.parse_ability_score,
        report_text=analysis.report_text,
    )


@router.get("/{analysis_id}", response_model=schemas.AnalysisOut)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return schemas.AnalysisOut(
        analysis_id=analysis.id,
        matched=analysis.matched_skills,
        missing=analysis.missing_skills,
        match_pct=analysis.match_pct,
        parse_ability_score=analysis.parse_ability_score,
        report_text=analysis.report_text,
    )
