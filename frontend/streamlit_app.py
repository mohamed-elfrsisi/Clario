"""
Clario — Streamlit frontend.

A thin UI over the FastAPI backend (see ../app/). Run separately from the
backend, in its own environment (see frontend/requirements.txt) — this
deliberately avoids adding streamlit to the backend's requirements.txt,
since streamlit pulls in a newer starlette that conflicts with the
pinned fastapi/starlette versions the API depends on.

Run:
    streamlit run frontend/streamlit_app.py
(with the FastAPI backend already running at API_BASE_URL, default below)
"""
import streamlit as st
import requests

API_BASE_URL = "http://localhost:8000"

st.set_page_config(page_title="Clario", page_icon="📄", layout="centered")

# --- Session state ---
if "token" not in st.session_state:
    st.session_state.token = None
if "email" not in st.session_state:
    st.session_state.email = None


def auth_headers() -> dict:
    return {"Authorization": f"Bearer {st.session_state.token}"}


def api_call(method: str, path: str, **kwargs):
    """Thin wrapper: adds base URL, surfaces errors as Streamlit messages
    instead of raising, so a backend hiccup doesn't crash the whole page."""
    try:
        resp = requests.request(method, f"{API_BASE_URL}{path}", timeout=15, **kwargs)
    except requests.exceptions.ConnectionError:
        st.error(f"Can't reach the backend at {API_BASE_URL}. Is it running?")
        return None

    if resp.status_code >= 400:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text
        st.error(f"Error {resp.status_code}: {detail}")
        return None

    return resp.json()


# --- Auth screen ---
def render_auth():
    st.title("📄 Clario")
    st.caption("Know exactly why you're a fit, before you apply.")

    tab_login, tab_register = st.tabs(["Log in", "Register"])

    with tab_login:
        with st.form("login_form"):
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_password")
            submitted = st.form_submit_button("Log in")
            if submitted:
                result = api_call("POST", "/auth/login", json={"email": email, "password": password})
                if result:
                    st.session_state.token = result["access_token"]
                    st.session_state.email = email
                    st.rerun()

    with tab_register:
        with st.form("register_form"):
            email = st.text_input("Email", key="reg_email")
            password = st.text_input("Password (min 8 characters)", type="password", key="reg_password")
            region = st.text_input("Region (optional, e.g. 'US', 'UK')", key="reg_region")
            submitted = st.form_submit_button("Create account")
            if submitted:
                result = api_call("POST", "/auth/register", json={
                    "email": email, "password": password, "region": region or None,
                })
                if result:
                    st.session_state.token = result["access_token"]
                    st.session_state.email = email
                    st.rerun()


# --- Main app (post-login) ---
def render_main():
    with st.sidebar:
        st.write(f"Signed in as **{st.session_state.email}**")
        if st.button("Log out"):
            st.session_state.token = None
            st.session_state.email = None
            st.rerun()

    st.title("📄 Clario")

    tab_analyze, tab_bullets, tab_draft, tab_profile = st.tabs(
        ["Analyze Resume", "Improve a Bullet", "Build From Scratch", "My Profile"]
    )

    # --- Tab 1: Analyze ---
    with tab_analyze:
        st.subheader("Upload your resume and a job description")

        uploaded_file = st.file_uploader("Resume (PDF, DOCX, or TXT)", type=["pdf", "docx", "txt"])
        opportunity_text = st.text_area("Paste the job/opportunity description", height=150)

        if st.button("Analyze", type="primary"):
            if not uploaded_file:
                st.warning("Please upload a resume first.")
            elif not opportunity_text.strip():
                st.warning("Please paste the opportunity text.")
            else:
                with st.spinner("Analyzing..."):
                    doc_result = api_call(
                        "POST", "/documents/upload", headers=auth_headers(),
                        files={"file": (uploaded_file.name, uploaded_file.getvalue())},
                    )
                    if not doc_result:
                        st.stop()

                    opp_result = api_call(
                        "POST", "/opportunities", headers=auth_headers(),
                        json={"text": opportunity_text},
                    )
                    if not opp_result:
                        st.stop()

                    analysis = api_call(
                        "POST", "/analysis", headers=auth_headers(),
                        json={
                            "document_id": doc_result["document_id"],
                            "opportunity_id": opp_result["opportunity_id"],
                        },
                    )

                if analysis:
                    st.session_state.last_analysis = analysis

        if st.session_state.get("last_analysis"):
            a = st.session_state.last_analysis
            st.divider()
            if a["match_pct"] is not None:
                st.metric("Job Match", f"{a['match_pct'] * 100:.1f}%")
            col1, col2 = st.columns(2)
            with col1:
                st.write("**✅ Matched skills**")
                for s in a["matched"]:
                    st.write(f"- {s}")
            with col2:
                st.write("**❌ Missing skills**")
                for s in a["missing"]:
                    st.write(f"- {s}")
            st.divider()
            st.write("**Full report**")
            st.text(a["report_text"])

    # --- Tab 2: Bullet rewriter ---
    with tab_bullets:
        st.subheader("Improve a weak experience description")
        bullet_text = st.text_area("Paste one or more bullets (one per line)", height=120)
        if st.button("Rewrite"):
            bullets = [b.strip() for b in bullet_text.split("\n") if b.strip()]
            if not bullets:
                st.warning("Paste at least one bullet.")
            else:
                results = api_call("POST", "/bullets/rewrite", json={"bullets": bullets})
                if results:
                    for r in results:
                        st.write("**Original:**", r["original"])
                        st.write("**Rewritten:**", r["rewritten"])
                        if r["needs_review"]:
                            st.info("This has placeholders — fill in your real details.")
                        st.divider()

    # --- Tab 3: Build from scratch ---
    with tab_draft:
        st.subheader("No resume yet? Start here.")
        st.caption("List anything you've done — projects, courses, activities, certifications — one per line.")
        activities_text = st.text_area("Your activities", height=150)
        if st.button("Build my draft"):
            activities = [a.strip() for a in activities_text.split("\n") if a.strip()]
            if not activities:
                st.warning("List at least one activity.")
            else:
                draft = api_call("POST", "/draft/build", json={"activities": activities})
                if draft:
                    if draft.get("note"):
                        st.info(draft["note"])
                    for section, entries in draft["sections"].items():
                        st.write(f"**{section}**")
                        for e in entries:
                            st.write(f"- {e['rewritten']}")
                    if draft["all_skills_detected"]:
                        st.write("**Skills detected:**", ", ".join(draft["all_skills_detected"]))

    # --- Tab 4: Profile ---
    with tab_profile:
        st.subheader("Your reusable profile")
        st.caption("Save your core skills once, then tailor them per opportunity without re-entering everything.")

        skills_text = st.text_area("Your skills (comma-separated)", height=80)
        if st.button("Save profile"):
            skills = [s.strip() for s in skills_text.split(",") if s.strip()]
            result = api_call("POST", "/profile", headers=auth_headers(), json={
                "master_skills": skills, "master_experience": [],
            })
            if result:
                st.success("Profile saved.")

        if st.button("Load my profile"):
            result = api_call("GET", "/profile", headers=auth_headers())
            if result:
                st.write("**Skills:**", ", ".join(result["master_skills"]))


# --- Router ---
if st.session_state.token:
    render_main()
else:
    render_auth()
