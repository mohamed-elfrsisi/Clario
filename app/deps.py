"""
Temporary stand-in for authentication.

Sprint 1 has no auth system yet — every request is attributed to one
demo user so the rest of the schema (User -> Document/Opportunity/Analysis)
can be built and tested. Replace with real auth (JWT/session) before
this goes anywhere beyond local development.
"""
from sqlalchemy.orm import Session
from app import models

DEMO_EMAIL = "demo@clario.local"


def get_or_create_demo_user(db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.email == DEMO_EMAIL).first()
    if user:
        return user

    user = models.User(email=DEMO_EMAIL)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
