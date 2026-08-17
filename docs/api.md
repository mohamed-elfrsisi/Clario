# Clario - API Documentation

Interactive API documentation is available at `http://localhost:8000/docs` when the server is running.

## Base URL

```
http://localhost:8000
```

## Authentication

All endpoints except `/health` and `/auth/*` require authentication.

### Getting a Token

**Register:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

### Using the Token

Include the token in the Authorization header:
```bash
curl http://localhost:8000/health \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Endpoints

### Health Check

**GET /health**

Check if the server is running.

Response: `{"status": "ok"}`

---

### Authentication

#### Register

**POST /auth/register**

Create a new user account.

Request:
```json
{
    "email": "user@example.com",
    "password": "securepassword123",
    "region": "US",         // optional
    "field_of_study": "CS"  // optional
}
```

Response:
```json
{
    "access_token": "token...",
    "user_id": "uuid...",
    "token_type": "bearer"
}
```

#### Login

**POST /auth/login**

Authenticate and get a token.

Request:
```json
{
    "email": "user@example.com",
    "password": "securepassword123"
}
```

Response: Same as register.

---

### Documents

#### Upload Document

**POST /documents/upload**

Upload and parse a document (PDF, DOCX, or TXT).

Request: Multipart form with file field.

Response:
```json
{
    "document_id": "uuid...",
    "filename": "resume.pdf",
    "doc_type": null,                    // Populated after analysis
    "extracted_text": "Full text content...",
    "parse_ability_score": 1.0,
    "parse_risk_flags": []
}
```

#### List Documents

**GET /documents**

List all documents for the current user.

Query parameters:
- `skip` (int): Pagination offset
- `limit` (int): Max items to return

Response: Array of document objects (truncated text for list view).

#### Get Document

**GET /documents/{document_id}**

Get a specific document by ID.

Response: Full document object with complete text.

#### Delete Document

**DELETE /documents/{document_id}**

Delete a document and its associated analyses.

Response: `{"message": "Document deleted successfully."}`

---

### Opportunities

#### Create Opportunity

**POST /opportunities**

Create a job/opportunity for analysis.

Request:
```json
{
    "text": "Full job description text...",
    "title": "Job Title",        // optional
    "region": "US",              // optional
    "role_type": "Backend Dev"  // optional
}
```

Response:
```json
{
    "opportunity_id": "uuid...",
    "title": "Job Title",
    "region": "US",
    "role_type": "Backend Dev"
}
```

#### List Opportunities

**GET /opportunities**

List all opportunities for the current user.

Response: Array of opportunity objects.

#### Get Opportunity

**GET /opportunities/{opportunity_id}**

Get a specific opportunity.

#### Delete Opportunity

**DELETE /opportunities/{opportunity_id}**

Delete an opportunity and its associated analyses.

---

### Analysis

#### Run Analysis

**POST /analysis**

Run the full analysis pipeline: extract → compare → explain.

Request:
```json
{
    "document_id": "uuid...",
    "opportunity_id": "uuid..."
}
```

Response:
```json
{
    "analysis_id": "uuid...",
    "matched": ["python", "sql", "django"],
    "missing": ["docker"],
    "match_pct": 0.75,
    "parse_ability_score": 1.0,
    "report_text": "STRENGTHS:\n...\n\nGAPS:\n...\n\nRECOMMENDATIONS:\n..."
}
```

#### Get Analysis

**GET /analysis/{analysis_id}**

Get a previously run analysis.

---

### Bullet Rewriting

#### Rewrite Bullets

**POST /bullets/rewrite**

Improve weak bullet points.

Request:
```json
{
    "bullets": [
        "Made a website using Django",
        "Helped with testing"
    ]
}
```

Response:
```json
[
    {
        "original": "Made a website using Django",
        "rewritten": "Built a website using Django, resulting in [describe the outcome, if any]",
        "placeholders_added": 1,
        "needs_review": true
    }
]
```

---

### Draft Building

#### Build Draft Resume

**POST /draft/build**

Build a structured resume draft from free-text activities.

Request:
```json
{
    "activities": [
        "Built a to-do app with React",
        "Completed CS50 course",
        "Volunteered as coding mentor"
    ]
}
```

Response:
```json
{
    "sections": {
        "Projects": [...],
        "Education": [...],
        "Activities": [...]
    },
    "all_skills_detected": ["react"],
    "is_thin": false,
    "note": null,
    "status": "draft — needs review"
}
```

---

### Profile Management

#### Create/Update Profile

**POST /profile**

Create or update the user's master profile.

Request:
```json
{
    "master_skills": ["Python", "SQL", "Django"],
    "master_experience": [
        {
            "title": "Capstone",
            "description": "Built with Django",
            "confirmed_metrics": []
        }
    ]
}
```

#### Get Profile

**GET /profile**

Get the current user's profile.

#### Tailor Profile

**POST /profile/tailor**

Reorder profile skills/experience for a specific opportunity.

Request:
```json
{
    "opportunity_id": "uuid..."
}
```

Response:
```json
{
    "tailored_skills": ["Python", "SQL", "Django"],
    "tailored_experience": [...]
}
```

## Error Responses

All errors return:
```json
{
    "detail": "Error message"
}
```

See [Error Handling Guide](./error_handling.md) for details.

## OpenAPI Schema

The full OpenAPI 3.1 specification is available at:
- `/docs` - Interactive Swagger UI
- `/openapi.json` - Raw JSON specification
- `/redoc` - Alternative documentation format

## Version

Current API version: 0.2.0
