from fastapi import APIRouter, HTTPException

from app import schemas, profile_builder

router = APIRouter(prefix="/draft", tags=["draft"])


@router.post("/build", response_model=schemas.BuildDraftOut)
def build_draft(payload: schemas.BuildDraftIn):
    """
    FR-10 — Guided Build. For a student with no prior document: turns a
    free-text list of activities into a structured, sectioned draft.
    Runs entirely locally. Flags thin input rather than padding it.
    """
    if not payload.activities:
        raise HTTPException(status_code=400, detail="At least one activity is required.")

    result = profile_builder.build_draft(payload.activities)
    return schemas.BuildDraftOut(**result)
