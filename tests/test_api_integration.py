"""
Integration tests — exercise the actual FastAPI endpoints via TestClient,
covering the full pipeline and the error paths documented in FSD §1.8.

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


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_upload_document_txt(client):
    resp = client.post(
        "/documents/upload",
        files={"file": ("resume.txt", b"Skills: Python, SQL, Django", "text/plain")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "document_id" in body
    assert "Python" in body["extracted_text"]


def test_upload_unsupported_file_type(client):
    resp = client.post(
        "/documents/upload",
        files={"file": ("resume.xyz", b"junk", "application/octet-stream")},
    )
    assert resp.status_code == 400
    assert "Unsupported file type" in resp.json()["detail"]


def test_create_opportunity(client):
    resp = client.post("/opportunities", json={
        "text": "Required: Python, SQL, Docker.",
        "role_type": "Backend Internship",
        "region": "US",
    })
    assert resp.status_code == 200
    assert "opportunity_id" in resp.json()


def test_create_opportunity_empty_text_rejected(client):
    resp = client.post("/opportunities", json={"text": ""})
    assert resp.status_code == 400


def test_full_analysis_pipeline(client):
    doc_resp = client.post(
        "/documents/upload",
        files={"file": ("resume.txt", b"Skills: Python, SQL, Django, Git", "text/plain")},
    )
    doc_id = doc_resp.json()["document_id"]

    opp_resp = client.post("/opportunities", json={
        "text": "Required: Python, SQL, Django, Docker.",
    })
    opp_id = opp_resp.json()["opportunity_id"]

    analysis_resp = client.post("/analysis", json={
        "document_id": doc_id, "opportunity_id": opp_id,
    })
    assert analysis_resp.status_code == 200
    body = analysis_resp.json()
    assert "python" in [s.lower() for s in body["matched"]]
    assert "docker" in [s.lower() for s in body["missing"]]
    assert body["match_pct"] == pytest.approx(0.75)
    assert "STRENGTHS" in body["report_text"]


def test_analysis_with_missing_document_404s(client):
    opp_resp = client.post("/opportunities", json={"text": "Python required."})
    opp_id = opp_resp.json()["opportunity_id"]
    resp = client.post("/analysis", json={
        "document_id": "nonexistent-id", "opportunity_id": opp_id,
    })
    assert resp.status_code == 404


def test_get_analysis_by_id(client):
    doc_resp = client.post(
        "/documents/upload",
        files={"file": ("resume.txt", b"Skills: Python", "text/plain")},
    )
    opp_resp = client.post("/opportunities", json={"text": "Python required."})
    analysis_resp = client.post("/analysis", json={
        "document_id": doc_resp.json()["document_id"],
        "opportunity_id": opp_resp.json()["opportunity_id"],
    })
    analysis_id = analysis_resp.json()["analysis_id"]

    get_resp = client.get(f"/analysis/{analysis_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["analysis_id"] == analysis_id


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
