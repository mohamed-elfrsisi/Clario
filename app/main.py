from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()  # must run before other app modules import, since database.py
                # reads DATABASE_URL at import time via os.getenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import documents, opportunities, analysis, bullets, draft, profile, auth
from app import models  # noqa: F401 -- ensures models are registered before create_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Replaces the deprecated @app.on_event("startup") decorator
    # (removed in newer FastAPI/Starlette).
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Clario API",
    description="AI resume assistant — explainable resume-to-opportunity matching. "
                 "Extraction and explanation run entirely locally (no external LLM API).",
    version="0.2.0",
    lifespan=lifespan,
)

# Local-dev friendly default; tighten allow_origins before deploying.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(opportunities.router)
app.include_router(analysis.router)
app.include_router(bullets.router)
app.include_router(draft.router)
app.include_router(profile.router)
