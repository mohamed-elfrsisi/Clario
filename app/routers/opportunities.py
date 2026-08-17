from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.post("", response_model=schemas.OpportunityOut)
def create_opportunity(
    payload: schemas.OpportunityIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not payload.text or not payload.text.strip():
        # Per FSD §1.8: never guess requirements from empty/invalid input
        raise HTTPException(status_code=400, detail="Opportunity text cannot be empty.")

    opp = models.Opportunity(
        user_id=user.id,
        raw_text=payload.text,
        title=payload.title,
        region=payload.region,
        role_type=payload.role_type,
    )
    db.add(opp)
    db.commit()
    db.refresh(opp)

    return schemas.OpportunityOut(
        opportunity_id=opp.id,
        title=opp.title,
        region=opp.region,
        role_type=opp.role_type,
    )
