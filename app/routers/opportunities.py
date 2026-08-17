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


@router.get("", response_model=list[schemas.OpportunityOut])
def list_opportunities(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """List all opportunities created by the current user."""
    opportunities = (
        db.query(models.Opportunity)
        .filter(models.Opportunity.user_id == user.id)
        .order_by(models.Opportunity.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return [
        schemas.OpportunityOut(
            opportunity_id=o.id,
            title=o.title,
            region=o.region,
            role_type=o.role_type,
        )
        for o in opportunities
    ]


@router.get("/{opportunity_id}", response_model=schemas.OpportunityOut)
def get_opportunity(
    opportunity_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Get a specific opportunity by ID."""
    opp = db.query(models.Opportunity).filter(
        models.Opportunity.id == opportunity_id,
        models.Opportunity.user_id == user.id
    ).first()
    
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found.")
    
    return schemas.OpportunityOut(
        opportunity_id=opp.id,
        title=opp.title,
        region=opp.region,
        role_type=opp.role_type,
    )


@router.delete("/{opportunity_id}")
def delete_opportunity(
    opportunity_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Delete an opportunity."""
    opp = db.query(models.Opportunity).filter(
        models.Opportunity.id == opportunity_id,
        models.Opportunity.user_id == user.id
    ).first()
    
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found.")
    
    # Also delete associated analyses
    analyses = db.query(models.Analysis).filter(
        models.Analysis.opportunity_id == opportunity_id
    ).all()
    for analysis in analyses:
        db.delete(analysis)
    
    db.delete(opp)
    db.commit()
    
    return {"message": "Opportunity deleted successfully."}
