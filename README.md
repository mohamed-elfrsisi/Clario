# Clario

An AI resume assistant that shows students exactly how well their resume
matches a specific opportunity — and explains why, not just a score.

## Current Sprint Status

- [x] **Sprint 1 — Foundation**
  - FastAPI backend + SQLite database
  - Document parser (PDF/DOCX/TXT → text) with explicit error handling
  - Rule-based format/parse-ability checklist
  - User authentication (register/login with bearer tokens)
  - User data isolation

- [x] **Sprint 2 — Core Pipeline**
  - Local rule-based extraction (no external LLM API)
  - Deterministic comparison/matching with synonym and fuzzy matching
  - Profile builder for guided resume creation
  - Profile tailoring for opportunity-specific customization

- [x] **Sprint 3 — Explainability**
  - Template-based report generation (grounded in extracted data)
  - Strengths/gaps/recommendations output
  - Document type recommendation (Resume/CV/Academic CV)

- [x] **Sprint 4 — Depth Features**
  - Bullet rewriting with placeholder-based improvement suggestions
  - Never invents metrics or facts
  - Improvements: action verb suggestions, tool placeholders, result placeholders

- [x] **Sprint 5 — Profile & Tailoring**
  - Master profile storage (skills + experience per user)
  - Profile tailoring per opportunity (reordering only, no invention)
  - 55+ tests covering all major functionality

- [x] **Sprint 6 — Authentication & Security**
  - Full user authentication with bearer tokens
  - All user data isolated per account
  - Password hashing with PBKDF2-HMAC-SHA256
  - Protected endpoints with proper auth middleware

- [x] **Sprint 7 — Docker & Frontend**
  - Docker deployment (verified working)
  - Streamlit frontend with enhanced UI
  - Complete end-to-end workflow: Upload → Extract → Analyze → Display
  - Document and opportunity management
  - Profile management with experience entries

## What's Implemented

### Backend API (FastAPI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/auth/register` | POST | Create new account |
| `/auth/login` | POST | Login and get token |
| `/documents/upload` | POST | Upload and parse document |
| `/documents` | GET | List user's documents |
| `/documents/{id}` | GET | Get specific document |
| `/documents/{id}` | DELETE | Delete document |
| `/opportunities` | POST | Create opportunity |
| `/opportunities` | GET | List user's opportunities |
| `/opportunities/{id}` | GET | Get specific opportunity |
| `/opportunities/{id}` | DELETE | Delete opportunity |
| `/analysis` | POST | Run resume-opportunity analysis |
| `/analysis/{id}` | GET | Get specific analysis |
| `/bullets/rewrite` | POST | Rewrite weak bullets |
| `/draft/build` | POST | Build resume from activities |
| `/profile` | POST/GET | Create/get user profile |
| `/profile/tailor` | POST | Tailor profile to opportunity |

### Frontend (Streamlit)

- User authentication (login/register)
- Document upload (PDF, DOCX, TXT)
- Opportunity description input
- Match analysis with visual percentage display
- Matched/missing skills display
- Detailed report with strengths/gaps/recommendations
- Bullet rewriting with original/improved comparison
- Draft resume builder from activities
- Profile management (skills + experience)
- Profile tailoring to opportunities
- Analysis history
- Export results as text files

### Local Extraction

- Rule-based skill extraction from skills taxonomy
- Required/preferred skill splitting from opportunity text
- Experience bullet extraction
- Document type recommendation
- Role type detection

### Supported File Types

- PDF (text-based)
- DOCX (Microsoft Word)
- TXT (plain text)

## Setup

### Prerequisites

- Python 3.12+ (or use Docker)
- pip (for local development)

### Local Development

```bash
# Clone the repository
cd Clario

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install frontend dependencies
pip install -r frontend/requirements.txt

# Copy environment file
cp .env.example .env

# Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, start the frontend
streamlit run frontend/streamlit_app.py
```

### With Docker

```bash
# Build and run
docker compose up --build

# Access the API at http://localhost:8000
# Access interactive docs at http://localhost:8000/docs
```

### Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_local_extractor.py -v
```

## Project Structure

```
Clario/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── parsers.py           # Document parsing (PDF/DOCX/TXT)
│   ├── deps.py              # Dependencies (auth, DB session)
│   ├── auth_utils.py        # Authentication utilities
│   ├── local_extractor.py   # Rule-based document extraction
│   ├── bullet_rewriter.py   # Bullet improvement logic
│   ├── profile_builder.py   # Resume draft builder
│   ├── profile_tailor.py    # Profile tailoring logic
│   ├── matching.py          # Skill matching/comparison
│   ├── report_generator.py  # Report generation
│   ├── skills_taxonomy.py   # Skills database
│   └── routers/
│       ├── auth.py          # Authentication endpoints
│       ├── documents.py     # Document management
│       ├── opportunities.py # Opportunity management
│       ├── analysis.py      # Analysis pipeline
│       ├── bullets.py       # Bullet rewriting
│       ├── draft.py         # Draft building
│       └── profile.py       # Profile management
├── frontend/
│   ├── streamlit_app.py     # Streamlit user interface
│   └── requirements.txt     # Frontend dependencies
├── tests/
│   ├── test_local_extractor.py
│   ├── test_bullet_rewriter.py
│   ├── test_matching.py
│   ├── test_profile_builder.py
│   ├── test_profile_tailor.py
│   ├── test_api_integration.py
│   └── test_auth_utils.py
├── .env.example              # Environment configuration template
├── docker-compose.yml        # Docker orchestration
├── Dockerfile                # Container build
├── requirements.txt          # Backend dependencies
├── README.md                 # This file
└── DEPLOYMENT.md             # Deployment guide
```

## API Documentation

Interactive API documentation is available at `http://localhost:8000/docs` when the server is running.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./clario.db` | Database connection string |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `API_BASE_URL` | `http://localhost:8000` | Frontend API URL |
| `SECRET_KEY` | (random) | Application secret key |
| `LOG_LEVEL` | `info` | Logging level |
| `MAX_UPLOAD_SIZE` | `10485760` | Max upload size in bytes |
| `SUPPORTED_FILE_TYPES` | `pdf,docx,txt` | Allowed file types |

## Troubleshooting

### Common Issues

1. **Backend not reachable**: Ensure uvicorn is running at the configured port
2. **Database errors**: Check that DATABASE_URL is correct and the database file is accessible
3. **File upload errors**: Verify file type is supported and within size limits
4. **Auth errors**: Ensure you're sending the Bearer token in the Authorization header

### Logs

Logs are output to stdout by default. Set `LOG_LEVEL=debug` in .env for more verbose output.

## Security Notes

- Never commit the `.env` file with real secrets
- Change `SECRET_KEY` in production
- Use Postgres instead of SQLite for production deployments
- Enable HTTPS in production environments
- Review and update dependencies regularly for security patches

## License

This is a personal/project project. See the repository for license information.
