# Clario

An AI resume assistant that shows students exactly how well their resume
matches a specific opportunity — and explains why, not just a score.

See `/docs` (or the project documentation set) for full SRS, Architecture,
and Functional Spec detail. This README covers setup and current status only.

## Sprint Status

- [x] **Sprint 1 — Foundation** (this commit)
  - FastAPI backend + SQLite/Postgres schema (User, Profile, Document, Opportunity, Analysis)
  - Document parser (PDF/DOCX/TXT → text) with explicit error handling
  - Rule-based format/parse-ability checklist
  - Opportunity text input endpoint
  - Analysis endpoint (stub — returns empty match, full pipeline in Sprint 2)
- [ ] **Sprint 2 — Core Pipeline**: LLM extraction step, deterministic comparison step
- [ ] **Sprint 3 — Explainability**: LLM explanation step, polished report output
- [ ] **Sprint 4 — Depth Features**: doc-type recommendation, bullet rewriting, testing pass

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in ANTHROPIC_API_KEY when Sprint 2 lands
uvicorn app.main:app --reload
```

Server runs at `http://localhost:8000`. Interactive API docs (auto-generated
from the FastAPI schemas) at `http://localhost:8000/docs`.

Defaults to a local SQLite file (`clario.db`) — no setup required. Swap
`DATABASE_URL` in `.env` to a Postgres URL when deploying.

## API (current)

| Endpoint | Method | Status |
|---|---|---|
| `/health` | GET | done |
| `/documents/upload` | POST | done |
| `/opportunities` | POST | done |
| `/analysis` | POST | stub — Sprint 2 completes this |
| `/analysis/{id}` | GET | done |

## Project Structure

```
app/
  main.py         # FastAPI app entrypoint
  database.py     # DB engine/session setup
  models.py       # SQLAlchemy models (ERD)
  schemas.py      # Pydantic request/response schemas
  parsers.py      # Document parsing + format-risk checklist
  deps.py         # Temporary demo-user helper (no auth yet)
  routers/
    documents.py
    opportunities.py
    analysis.py
```

## Git Flow

```
main      <- always working
  develop <- integration branch
    feature/<story-id>-<short-name>   <- one branch per backlog item
```
