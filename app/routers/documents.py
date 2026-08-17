from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
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


@router.get("", response_model=list[schemas.DocumentOut])
def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """List all documents uploaded by the current user."""
    documents = (
        db.query(models.Document)
        .filter(models.Document.user_id == user.id)
        .order_by(models.Document.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return [
        schemas.DocumentOut(
            document_id=d.id,
            filename=d.filename,
            doc_type=d.doc_type,
            extracted_text=d.raw_text[:500] + ("..." if len(d.raw_text) > 500 else ""),  # truncated for list view
            parse_ability_score=d.parse_ability_score,
            parse_risk_flags=d.parse_risk_flags or [],
        )
        for d in documents
    ]


@router.get("/{document_id}", response_model=schemas.DocumentOut)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Get a specific document by ID."""
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == user.id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    return schemas.DocumentOut(
        document_id=doc.id,
        filename=doc.filename,
        doc_type=doc.doc_type,
        extracted_text=doc.raw_text,
        parse_ability_score=doc.parse_ability_score,
        parse_risk_flags=doc.parse_risk_flags or [],
    )


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Delete a document."""
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == user.id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    # Also delete associated analyses
    analyses = db.query(models.Analysis).filter(
        models.Analysis.document_id == document_id
    ).all()
    for analysis in analyses:
        db.delete(analysis)
    
    db.delete(doc)
    db.commit()
    
    return {"message": "Document deleted successfully."}
