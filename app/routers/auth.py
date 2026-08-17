from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth_utils

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenOut)
def register(payload: schemas.RegisterIn, db: Session = Depends(get_db)):
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = models.User(
        email=payload.email,
        password_hash=auth_utils.hash_password(payload.password),
        region=payload.region,
        field_of_study=payload.field_of_study,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth_utils.generate_token()
    db.add(models.AuthToken(token=token, user_id=user.id))
    db.commit()

    return schemas.TokenOut(access_token=token, user_id=user.id)


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    # Same error for "no such user" and "wrong password" — don't leak
    # which one it was, that's a user-enumeration vector.
    if not user or not auth_utils.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = auth_utils.generate_token()
    db.add(models.AuthToken(token=token, user_id=user.id))
    db.commit()

    return schemas.TokenOut(access_token=token, user_id=user.id)
