from contextlib import asynccontextmanager
import os

from dotenv import load_dotenv
load_dotenv()  # must run before other app modules import, since database.py
                # reads DATABASE_URL at import time via os.getenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.database import Base, engine
from app.routers import documents, opportunities, analysis, bullets, draft, profile, auth
from app import models  # noqa: F401 -- ensures models are registered before create_all
from app.logging_config import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Replaces the deprecated @app.on_event("startup") decorator
    # (removed in newer FastAPI/Starlette).
    
    # Setup logging based on environment
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_file = os.getenv("LOG_FILE")  # Optional: path to log file
    setup_logging(level=log_level, log_file=log_file)
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    yield


app = FastAPI(
    title="Clario API",
    description="AI resume assistant — explainable resume-to-opportunity matching. "
                 "Extraction and explanation run entirely locally (no external LLM API).",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS - configure for production
# In development, allow all origins. In production, specify exact origins.
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins] if allowed_origins != ["*"] else ["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
)

# Trusted host middleware for production security
# In production, set ALLOWED_HOSTS environment variable
allowed_hosts = os.getenv("ALLOWED_HOSTS", "*").split(",")
if allowed_hosts != ["*"]:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[host.strip() for host in allowed_hosts],
    )


@app.get("/health")
def health():
    return {"status": "ok"}


# Include routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(opportunities.router)
app.include_router(analysis.router)
app.include_router(bullets.router)
app.include_router(draft.router)
app.include_router(profile.router)
