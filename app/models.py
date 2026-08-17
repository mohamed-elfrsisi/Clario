"""
ORM models — implements the ERD from Architecture Documentation §2.6.

User 1:1 Profile
User 1:many Document, Opportunity, Analysis
Document + Opportunity -> Analysis (the core join, per §2.6 notes)
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    region = Column(String, nullable=True)
    field_of_study = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    profile = relationship("Profile", back_populates="user", uselist=False)
    documents = relationship("Document", back_populates="user")
    opportunities = relationship("Opportunity", back_populates="user")
    analyses = relationship("Analysis", back_populates="user")
    tokens = relationship("AuthToken", back_populates="user")


class AuthToken(Base):
    """Opaque bearer token — simple session auth, no JWT library needed."""
    __tablename__ = "auth_tokens"

    id = Column(String, primary_key=True, default=_uuid)
    token = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="tokens")


class Profile(Base):
    """Master profile — reusable base data. See FR-12 (Profile Reuse)."""
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    master_skills = Column(JSON, default=list)          # ["Python", "SQL", ...]
    master_experience = Column(JSON, default=list)       # [{title, description, confirmed_metrics}, ...]
    confirmed_metrics = Column(JSON, default=list)

    user = relationship("User", back_populates="profile")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    raw_text = Column(String, nullable=False)
    doc_type = Column(String, nullable=True)  # "Resume" | "CV" | "Academic CV" | None until analyzed
    filename = Column(String, nullable=True)
    parse_ability_score = Column(Float, nullable=True)
    parse_risk_flags = Column(JSON, default=list)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="documents")


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    raw_text = Column(String, nullable=False)
    region = Column(String, nullable=True)
    role_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="opportunities")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    opportunity_id = Column(String, ForeignKey("opportunities.id"), nullable=False)

    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    match_pct = Column(Float, nullable=True)

    parse_ability_score = Column(Float, nullable=True)
    parse_risk_flags = Column(JSON, default=list)

    fuzzy_matches = Column(JSON, default=list)
    report_text = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="analyses")
