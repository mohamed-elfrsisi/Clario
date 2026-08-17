"""
Integration tests — exercise the actual FastAPI endpoints via TestClient,
covering the full pipeline, auth, and the error paths documented in FSD §1.8.

Uses a temporary SQLite DB per test session so this never touches a
developer's real clario.db.
"""
import os
import tempfile
import pytest


@pytest.fixture(scope="module", autouse=True)
def temp_db():
    tmp_dir = tempfile.mkdtemp()
    db_path = os.path.join(tmp_dir, "test_clario.db")
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    yield
    if os.path.exists(db_path):
        os.remove(db_path)


@pytest.fixture(scope="module")
def client(temp_db):
    from fastapi.testclient import TestClient
    from app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_headers(client):
    """Registers one test user for this module and returns auth headers."""
    resp = client.post("/auth/register", json={
        "email": "pytest_user@test.com", "password": "testpass123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# --- Auth tests ---

def test_register_creates_working_token(client):
    resp = client.post("/auth/register", json={
        "email": "newuser@test.com", "password": "somepassword",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_register_short_password_rejected(client):
    resp = client.post("/auth/register", json={
        "email": "shortpw@test.com", "password": "short",
    })
    assert resp.status_code == 400


def test_register_duplicate_email_rejected(client, auth_headers):
    resp = client.post("/auth/register", json={
        "email": "pytest_user@test.com", "password": "anotherpass123",
    })
    assert resp.status_code == 409


def test_login_success(client):
    client.post("/auth/register", json={"email": "logintest@test.com", "password": "correctpass"})
    resp = client.post("/auth/login", json={"email": "logintest@test.com", "password": "correctpass"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password_rejected(client):
    client.post("/auth/register", json={"email": "logintest2@test.com", "password": "correctpass"})
    resp = client.post("/auth/login", json={"email": "logintest2@test.com", "password": "wrongpass"})
    assert resp.status_code == 401


def test_login_nonexistent_user_same_error_as_wrong_password(client):
    # Must not leak whether the account exists — same message either way.
    resp1 = client.post("/auth/login", json={"email": "doesnotexist@test.com", "password": "whatever123"})
    client.post("/auth/register", json={"email": "existstest@test.com", "password": "correctpass"})
    resp2 = client.post("/auth/login", json={"email": "existstest@test.com", "password": "wrongpass"})
    assert resp1.status_code == resp2.status_code == 401
    assert resp1.json()["detail"] == resp2.json()["detail"]


def test_protected_endpoint_without_token_401s(client):
    resp = client.get("/profile")
    assert resp.status_code == 401


def test_protected_endpoint_with_garbage_token_401s(client):
    resp = client.get("/profile", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


# --- Document / Opportunity / Analysis (now auth-protected) ---

def test_upload_document_txt(client, auth_headers):
    resp = client.post(
        "/documents/upload", headers=auth_headers,
        files={"file": ("resume.txt", b"Skills: Python, SQL, Django", "text/plain")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "document_id" in body
    assert "Python" in body["extracted_text"]


def test_upload_unsupported_file_type(client, auth_headers):
    resp = client.post(
        "/documents/upload", headers=auth_headers,
        files={"file": ("resume.xyz", b"junk", "application/octet-stream")},
    )
    assert resp.status_code == 400
    assert "Unsupported file type" in resp.json()["detail"]


def test_create_opportunity(client, auth_headers):
    resp = client.post("/opportunities", headers=auth_headers, json={
        "text": "Required: Python, SQL, Docker.",
        "role_type": "Backend Internship",
        "region": "US",
    })
    assert resp.status_code == 200
    assert "opportunity_id" in resp.json()


def test_create_opportunity_empty_text_rejected(client, auth_headers):
    resp = client.post("/opportunities", headers=auth_headers, json={"text": ""})
    assert resp.status_code == 400


def test_full_analysis_pipeline(client, auth_headers):
    doc_resp = client.post(
        "/documents/upload", headers=auth_headers,
        files={"file": ("resume.txt", b"Skills: Python, SQL, Django, Git", "text/plain")},
    )
    doc_id = doc_resp.json()["document_id"]

    opp_resp = client.post("/opportunities", headers=auth_headers, json={
        "text": "Required: Python, SQL, Django, Docker.",
    })
    opp_id = opp_resp.json()["opportunity_id"]

    analysis_resp = client.post("/analysis", headers=auth_headers, json={
        "document_id": doc_id, "opportunity_id": opp_id,
    })
    assert analysis_resp.status_code == 200
    body = analysis_resp.json()
    assert "python" in [s.lower() for s in body["matched"]]
    assert "docker" in [s.lower() for s in body["missing"]]
    assert body["match_pct"] == pytest.approx(0.75)
    assert "STRENGTHS" in body["report_text"]


def test_analysis_with_missing_document_404s(client, auth_headers):
    opp_resp = client.post("/opportunities", headers=auth_headers, json={"text": "Python required."})
    opp_id = opp_resp.json()["opportunity_id"]
    resp = client.post("/analysis", headers=auth_headers, json={
        "document_id": "nonexistent-id", "opportunity_id": opp_id,
    })
    assert resp.status_code == 404


def test_get_analysis_by_id(client, auth_headers):
    doc_resp = client.post(
        "/documents/upload", headers=auth_headers,
        files={"file": ("resume.txt", b"Skills: Python", "text/plain")},
    )
    opp_resp = client.post("/opportunities", headers=auth_headers, json={"text": "Python required."})
    analysis_resp = client.post("/analysis", headers=auth_headers, json={
        "document_id": doc_resp.json()["document_id"],
        "opportunity_id": opp_resp.json()["opportunity_id"],
    })
    analysis_id = analysis_resp.json()["analysis_id"]

    get_resp = client.get(f"/analysis/{analysis_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["analysis_id"] == analysis_id


def test_user_cannot_access_another_users_document(client, auth_headers):
    # User A uploads a document
    doc_resp = client.post(
        "/documents/upload", headers=auth_headers,
        files={"file": ("resume.txt", b"Skills: Python", "text/plain")},
    )
    doc_id = doc_resp.json()["document_id"]

    # User B (different account) tries to analyze against it
    client.post("/auth/register", json={"email": "userB@test.com", "password": "userbpass123"})
    login_resp = client.post("/auth/login", json={"email": "userB@test.com", "password": "userbpass123"})
    user_b_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    opp_resp = client.post("/opportunities", headers=user_b_headers, json={"text": "Python required."})
    opp_id = opp_resp.json()["opportunity_id"]

    resp = client.post("/analysis", headers=user_b_headers, json={
        "document_id": doc_id, "opportunity_id": opp_id,
    })
    assert resp.status_code == 404  # User A's document must not be visible to User B


# --- Bullets ---

def test_bullets_rewrite_endpoint(client):
    resp = client.post("/bullets/rewrite", json={
        "bullets": ["Made a website using Django."],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["needs_review"] is True


def test_bullets_rewrite_empty_list_rejected(client):
    resp = client.post("/bullets/rewrite", json={"bullets": []})
    assert resp.status_code == 400


# --- Draft ---

def test_build_draft_endpoint(client):
    resp = client.post("/draft/build", json={
        "activities": ["Built a to-do app using React.", "Completed CS50 course."],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "Projects" in body["sections"]
    assert "react" in body["all_skills_detected"]


def test_build_draft_empty_rejected(client):
    resp = client.post("/draft/build", json={"activities": []})
    assert resp.status_code == 400


# --- Profile ---

def test_profile_create_and_get(client, auth_headers):
    create_resp = client.post("/profile", headers=auth_headers, json={
        "master_skills": ["Python", "SQL", "Django"],
        "master_experience": [
            {"title": "Capstone", "description": "Built with Django", "confirmed_metrics": []}
        ],
    })
    assert create_resp.status_code == 200
    profile_id = create_resp.json()["profile_id"]

    get_resp = client.get("/profile", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["profile_id"] == profile_id
    assert "Python" in get_resp.json()["master_skills"]


def test_profile_update_overwrites_previous(client, auth_headers):
    client.post("/profile", headers=auth_headers, json={"master_skills": ["OldSkill"], "master_experience": []})
    client.post("/profile", headers=auth_headers, json={"master_skills": ["NewSkill"], "master_experience": []})
    resp = client.get("/profile", headers=auth_headers)
    assert resp.json()["master_skills"] == ["NewSkill"]


def test_profile_tailor(client, auth_headers):
    client.post("/profile", headers=auth_headers, json={
        "master_skills": ["C++", "Python", "SQL"],
        "master_experience": [],
    })
    opp_resp = client.post("/opportunities", headers=auth_headers, json={"text": "Required: Python, SQL."})
    opp_id = opp_resp.json()["opportunity_id"]

    tailor_resp = client.post("/profile/tailor", headers=auth_headers, json={"opportunity_id": opp_id})
    assert tailor_resp.status_code == 200
    tailored = tailor_resp.json()["tailored_skills"]
    assert set(tailored) == {"C++", "Python", "SQL"}  # nothing invented or dropped
    assert tailored.index("Python") < tailored.index("C++")


def test_profile_tailor_without_profile_404s(client):
    client.post("/auth/register", json={"email": "noprofile@test.com", "password": "nopassword123"})
    login_resp = client.post("/auth/login", json={"email": "noprofile@test.com", "password": "nopassword123"})
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    resp = client.post("/profile/tailor", headers=headers, json={"opportunity_id": "nonexistent"})
    assert resp.status_code == 404
