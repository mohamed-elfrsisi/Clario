from fastapi import APIRouter, HTTPException

from app import schemas, bullet_rewriter

router = APIRouter(prefix="/bullets", tags=["bullets"])


@router.post("/rewrite", response_model=list[schemas.BulletRewriteOut])
def rewrite_bullets(payload: schemas.BulletRewriteIn):
    """
    FR-11 — rewrites weak experience bullets into an Action-Tool-Result
    shape. Runs entirely locally; never invents a metric the student
    didn't provide (placeholders are inserted instead — see BR-7).
    """
    if not payload.bullets:
        raise HTTPException(status_code=400, detail="At least one bullet is required.")

    results = bullet_rewriter.rewrite_bullets(payload.bullets)
    return [schemas.BulletRewriteOut(**r) for r in results]
