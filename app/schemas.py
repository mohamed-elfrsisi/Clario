from typing import Optional
from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    document_id: str
    filename: Optional[str]
    doc_type: Optional[str]
    extracted_text: str
    parse_ability_score: Optional[float]
    parse_risk_flags: list[str]

    model_config = ConfigDict(from_attributes=True)


class OpportunityIn(BaseModel):
    text: str
    region: Optional[str] = None
    role_type: Optional[str] = None
    title: Optional[str] = None


class OpportunityOut(BaseModel):
    opportunity_id: str
    title: Optional[str]
    region: Optional[str]
    role_type: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class AnalysisRequest(BaseModel):
    document_id: str
    opportunity_id: str


class AnalysisOut(BaseModel):
    analysis_id: str
    matched: list[str]
    missing: list[str]
    match_pct: Optional[float]
    parse_ability_score: Optional[float]
    report_text: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class FuzzyMatchOut(BaseModel):
    required_skill: Optional[str] = None
    preferred_skill: Optional[str] = None
    matched_to: str
    similarity: float


class BulletRewriteIn(BaseModel):
    bullets: list[str]


class BulletRewriteOut(BaseModel):
    original: str
    rewritten: str
    placeholders_added: int
    needs_review: bool


class BuildDraftIn(BaseModel):
    activities: list[str]


class BuildDraftOut(BaseModel):
    sections: dict
    all_skills_detected: list[str]
    is_thin: bool
    note: Optional[str] = None
    status: Optional[str] = None


class ExperienceEntry(BaseModel):
    title: str
    description: str
    confirmed_metrics: list[str] = []


class ProfileIn(BaseModel):
    master_skills: list[str]
    master_experience: list[ExperienceEntry] = []


class ProfileOut(BaseModel):
    profile_id: str
    master_skills: list[str]
    master_experience: list[dict]

    model_config = ConfigDict(from_attributes=True)


class TailorProfileIn(BaseModel):
    opportunity_id: str


class TailorProfileOut(BaseModel):
    tailored_skills: list[str]
    tailored_experience: list[dict]
