"""
Clario - Local Document Extraction Documentation

This module provides rule-based, local document extraction for the Clario AI resume assistant.
It replaces external LLM-based extraction with deterministic, auditable code.

## Overview

The extraction system works in three main phases:

1. **Skill Extraction** - Identify skills mentioned in text using a taxonomy
2. **Requirement Splitting** - Separate required vs preferred skills from job descriptions
3. **Experience Extraction** - Identify bullet points and action verbs from resumes

## Components

### 1. Skills Taxonomy (skills_taxonomy.py)

A maintained dictionary of canonical skills and their aliases:

```python
SKILLS_TAXONOMY = {
    "python": ["py"],
    "javascript": ["js", "ecmascript"],
    "react": ["react.js", "reactjs"],
    # ... 80+ skills total
}
```

**Supported Skill Categories:**
- Programming languages (Python, Java, JavaScript, etc.)
- Frameworks (React, Django, Flask, Spring Boot, etc.)
- Databases (PostgreSQL, MongoDB, SQLite, etc.)
- Cloud platforms (AWS, Azure, GCP)
- DevOps (Docker, Kubernetes, CI/CD)
- ML/AI (Machine Learning, NLP, Computer Vision, etc.)
- Soft skills (Communication, Leadership, Teamwork, etc.)

### 2. Skill Extraction (extract_skills)

```python
def extract_skills(text: str) -> list[str]:
    """Return canonical skill names found in text via alias phrase matching."""
```

**How it works:**
- Uses word-boundary regex patterns to avoid false positives
- Example: "java" won't match inside "javascript"
- Returns sorted list of canonical skill names
- Case-insensitive matching

**Edge cases handled:**
- Empty/null input returns empty list
- Word boundaries prevent substring false matches
- All aliases map to canonical names

### 3. Required/Preferred Splitting (split_required_preferred)

```python
def split_required_preferred(opportunity_text: str) -> tuple[list[str], list[str]]:
    """
    Heuristic split: skills near 'preferred' markers → preferred.
    Everything else → required (conservative default).
    """
```

**Marker patterns:**
- Required: "required", "must have", "minimum qualifications"
- Preferred: "preferred", "nice to have", "bonus", "a plus", "ideally"

**Logic:**
- Processes text line-by-line
- Skills near preferred markers → preferred bucket
- Skills near required markers OR no markers → required bucket
- If a skill appears in both buckets, required wins

### 4. Experience Extraction (extract_experience)

```python
def extract_experience(resume_text: str, max_items: int = 8) -> list[dict]:
    """
    Pulls plausible experience bullets: lines that look like bullet points
    or start with a resume action verb.
    """
```

**Bullet detection patterns:**
- Lines starting with `-`, `*`, `•`, or bullet character
- Lines starting with action verbs: led, built, developed, designed, managed, etc.

**Output format:**
```python
[
    {"title": "Built a full-stack app...", "description": "Built a full-stack e-commerce..."},
    # ... up to max_items
]
```

### 5. Document Type Recommendation (recommend_doc_type)

```python
def recommend_doc_type(resume_text: str) -> str:
    """Returns 'Resume', 'CV', 'Academic CV', or 'Unclear'."""
```

**Heuristics:**
- 2+ academic markers (publications, dissertation, etc.) → "Academic CV"
- 1 academic marker OR text > 6000 chars → "CV"
- Otherwise → "Resume"
- Empty text → "Unclear"

### 6. Main Extract Function (extract)

```python
def extract(resume_text: str, opportunity_text: str, context: dict | None = None) -> dict:
    """
    Drop-in replacement for llm_client.extract(). Same return shape,
    computed locally with no network call.
    """
```

**Returns:**
```python
{
    "student_skills": [...],           # Skills from resume
    "student_experience": [...],       # Extracted experience bullets
    "opportunity_required_skills": [...],  # Required skills from job
    "opportunity_preferred_skills": [...], # Preferred skills from job
    "role_type": "...",                # First line of opportunity text
    "recommended_doc_type": "...",    # Recommended document format
}
```

## Matching Logic (matching.py)

After extraction, skills are compared deterministically:

### Normalization
- Lowercase, whitespace collapsed
- Synonym resolution: "ML" → "machine learning", "js" → "javascript"
- Leading token matching for versioned skills: "Postgres 15" → "postgresql"

### Comparison
- Exact match after normalization
- Fuzzy match fallback (threshold: 0.88 similarity) for near-misses
- Required skills drive match percentage
- Preferred skills reported separately

### Output
```python
{
    "matched": [...],
    "missing_required": [...],
    "missing_preferred": [...],
    "match_pct": 0.75,  # 75% of required skills matched
    "fuzzy_matches": [...],  # Transparency: which matches were fuzzy
}
```

## Limitations

1. **Taxonomy-based**: Only recognizes skills in the maintained taxonomy
   - Novel skill phrasings may be missed
   - Mitigated by fuzzy matching for near-misses

2. **Heuristic-based**: No ML/LLM, so some edge cases may not be handled perfectly
   - Document type detection is approximate
   - Role type is just the first line

3. **English-only**: Currently optimized for English text
   - Arabic documents may need additional handling

## Testing

Run extraction tests:
```bash
python -m pytest tests/test_local_extractor.py -v
```

Key test cases:
- Basic skill extraction
- Word boundary false positive prevention
- Empty text handling
- Required/preferred splitting
- Document type recommendation
- Full pipeline output shape

## Usage Example

```python
from app.local_extractor import extract

result = extract(
    resume_text="Skills: Python, Django, SQL. Built a web app using React.",
    opportunity_text="Required: Python, SQL. Preferred: AWS, Docker.",
)

print(result["student_skills"])  # ['django', 'python', 'sql']
print(result["opportunity_required_skills"])  # ['docker', 'postgresql', 'python', 'sql']
print(result["match_pct"])  # Will be calculated by matching.py
```

## Adding New Skills

To add a new skill to the taxonomy:

1. Edit `app/skills_taxonomy.py`
2. Add to `SKILLS_TAXONOMY` dictionary:
   ```python
   "new skill": ["alias1", "alias2"],
   ```
3. Canonical name is also matched (no alias needed for primary name)

No model retraining or API changes required.
