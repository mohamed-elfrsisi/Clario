from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, profile_tailor
from app.deps import get_current_user
from app.local_extractor import extract

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("", response_model=schemas.ProfileOut)
def create_or_update_profile(
    payload: schemas.ProfileIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """
    FR-12 — stores the student's reusable master profile (skills +
    experience). One profile per user (1:1 per the ERD, Architecture §2.6).
    """
    profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    experience_dicts = [e.model_dump() for e in payload.master_experience]

    if profile:
        profile.master_skills = payload.master_skills
        profile.master_experience = experience_dicts
    else:
        profile = models.Profile(
            user_id=user.id,
            master_skills=payload.master_skills,
            master_experience=experience_dicts,
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)

    return schemas.ProfileOut(
        profile_id=profile.id,
        master_skills=profile.master_skills,
        master_experience=profile.master_experience,
    )


@router.get("", response_model=schemas.ProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found. Create one with POST /profile first.")

    return schemas.ProfileOut(
        profile_id=profile.id,
        master_skills=profile.master_skills,
        master_experience=profile.master_experience,
    )


@router.post("/tailor", response_model=schemas.TailorProfileOut)
def tailor_profile(
    payload: schemas.TailorProfileIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """
    FR-12 — reorders (never invents) the stored profile's skills/experience
    to emphasize what a specific opportunity requires. Per BR-8, this is
    ordering/emphasis only.
    """
    profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found. Create one with POST /profile first.")

    opp = db.query(models.Opportunity).filter(
        models.Opportunity.id == payload.opportunity_id, models.Opportunity.user_id == user.id
    ).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found.")

    extracted = extract(resume_text="", opportunity_text=opp.raw_text)
    required = extracted["opportunity_required_skills"]
    preferred = extracted["opportunity_preferred_skills"]

    tailored_skills = profile_tailor.tailor_skills_for_opportunity(
        profile.master_skills, required, preferred
    )
    tailored_experience = profile_tailor.tailor_experience_for_opportunity(
        profile.master_experience, required
    )

    return schemas.TailorProfileOut(
        tailored_skills=tailored_skills,
        tailored_experience=tailored_experience,
    )
