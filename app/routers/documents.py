from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, parsers
from app.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=schemas.DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    file_bytes = await file.read()

    try:
        text = parsers.parse_document(file.filename, file_bytes)
    except parsers.UnparseableDocumentError as e:
        # Per FSD §1.8 error handling: explicit error, never a silent empty result
        raise HTTPException(status_code=400, detail=str(e))

    format_check = parsers.check_format_risks(file.filename, file_bytes)

    doc = models.Document(
        user_id=user.id,
        raw_text=text,
        filename=file.filename,
        doc_type=None,  # populated by FR-4 doc-type recommendation, Sprint 3
        parse_ability_score=format_check["parse_ability_score"],
        parse_risk_flags=format_check["parse_risk_flags"],
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return schemas.DocumentOut(
        document_id=doc.id,
        filename=doc.filename,
        doc_type=doc.doc_type,
        extracted_text=doc.raw_text,
        parse_ability_score=format_check["parse_ability_score"],
        parse_risk_flags=format_check["parse_risk_flags"],
    )
