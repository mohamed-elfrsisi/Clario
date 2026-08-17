"""
Real bearer-token authentication, replacing the Sprint 1 demo-user stub.

Every request to a protected endpoint must send:
    Authorization: Bearer <token>
where <token> was issued by POST /auth/login or POST /auth/register.
"""
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app import models


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header. Expected: Bearer <token>.",
        )

    token = authorization.removeprefix("Bearer ").strip()
    auth_token = db.query(models.AuthToken).filter(models.AuthToken.token == token).first()
    if not auth_token:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user = db.query(models.User).filter(models.User.id == auth_token.user_id).first()
    if not user:
        # Token exists but its user was deleted — treat as invalid, don't 500.
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    return user
