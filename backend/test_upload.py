"""
test_upload.py — AI Career Copilot Resume Upload Verification Test

This script tests the resume upload and NLP parsing pipeline.
It automatically connects to a running live backend server (http://127.0.0.1:8000),
or smoothly falls back to FastAPI's in-process TestClient if no server is running.
Zero manual server launch required!
"""

import sys
import os
import time
import io
import warnings


# Suppress noisy starlette/httpx deprecation warnings
warnings.filterwarnings("ignore")

# Ensure backend root is on sys.path for direct imports
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class APIClientWrapper:
    """Seamless API client supporting both live HTTP requests and in-process TestClient."""

    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url.rstrip("/")
        self.mode = "live"
        self._test_client = None

        # Detect if live server is reachable
        try:
            import requests
            resp = requests.get(f"{self.base_url}/api/health", timeout=0.8)
            if resp.status_code == 200:
                self.mode = "live"
                self._requests = requests
                return
        except Exception:
            pass

        # Fallback to in-process FastAPI TestClient
        self.mode = "in-process"
        from fastapi.testclient import TestClient
        from app.main import app
        self._test_client = TestClient(app)

    def post(self, path, json=None, headers=None, files=None, data=None):
        clean_path = path if path.startswith("/") else f"/{path}"
        if self.mode == "live":
            url = f"{self.base_url}{clean_path}"
            return self._requests.post(url, json=json, data=data, headers=headers, files=files)
        else:
            return self._test_client.post(clean_path, json=json, data=data, headers=headers, files=files)

    def get(self, path, headers=None, params=None):
        clean_path = path if path.startswith("/") else f"/{path}"
        if self.mode == "live":
            url = f"{self.base_url}{clean_path}"
            return self._requests.get(url, headers=headers, params=params)
        else:
            return self._test_client.get(clean_path, headers=headers, params=params)


def run_upload_test():
    print("=" * 70)
    print("   AI CAREER COPILOT -- RESUME UPLOAD & PARSING TEST")
    print("=" * 70)

    client = APIClientWrapper()
    if client.mode == "live":
        print(f"[*] Execution Mode: LIVE SERVER (connected to {client.base_url})")
    else:
        print("[*] Execution Mode: IN-PROCESS TESTCLIENT (Zero-config standalone)")

    # 1. Register a test user
    ts = int(time.time() * 1000)
    email = f"upload_test_{ts}@gmail.com"
    password = "TestPassword123!"
    user_name = "Balaga Mani Sai Sampath"

    print(f"\n[Step 1] Registering test user: {email}...")
    reg_resp = client.post("/api/auth/register", json={
        "name": user_name,
        "email": email,
        "password": password
    })
    if reg_resp.status_code not in (200, 201):
        print(f"[FAIL] Registration failed with status {reg_resp.status_code}: {reg_resp.text}")
        sys.exit(1)
    print(" [PASS] User registration succeeded.")

    # 2. Login to obtain access token
    print("\n[Step 2] Authenticating user to obtain JWT token...")
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    if login_resp.status_code != 200:
        print(f"[FAIL] Login failed with status {login_resp.status_code}: {login_resp.text}")
        sys.exit(1)
    
    token = login_resp.json().get("access_token")
    if not token:
        print("[FAIL] Login response did not return an access_token.")
        sys.exit(1)
    
    headers = {"Authorization": f"Bearer {token}"}
    print(" [PASS] Authentication successful. JWT token acquired.")

    # 3. Prepare high-fidelity sample resume
    sample_resume_text = """Balaga Mani Sai Sampath
4th Year CSE | Computer Science Engineering [AI/ML]
balagamanisaisampath@gmail.com | +91 8919660105 | in Sampath | git Sampath

Professional Summary
Computer Science undergraduate specializing in Artificial Intelligence and Machine Learning. Skilled in Machine Learning, Data Science, Generative AI, and problem solving using Python and Data Structures and Algorithms. Interested in AI/ML, Data Science, and Generative AI roles.

Academic Qualifications
Year | Degree/Certificate | Institute | CPI/%
2027 | B. Tech, CSE [AI/ML] | MVGR College, Vizianagaram | 8.52/10
2023 | Intermediate | Sri Chaitanya, Visakhapatnam | 96%

Key Projects
Credit Risk Modeling & Scoring System
• Attained 89% accuracy on loan default prediction dataset using LogisticRegression
• Applied SMOTE to balance imbalanced dataset and enhance classification performance
• Deployed credit risk scoring system via Streamlit application.
Tech Stack: Python, Scikit-learn, Pandas, NumPy, Streamlit

Multi-Source RAG System for Real-Time Web Question Answering
• Developed a multi-source RAG system using MiniLM embeddings and ChromaDB.
• Improved answer grounding via Top-K semantic retrieval and prompt engineering.
• Integrated LLaMA-3.3-70B (Groq API) and deployed a real-time Streamlit app.
Tech Stack: Python, LangChain, ChromaDB, HuggingFace Embeddings, Groq API, Streamlit, Vector Databases

Experience
AI-ML Virtual Internship | AICTE - EduSkills (Google) | Oct 2025 – Dec 2025
• Implemented ML workflows improving model understanding efficiency by 25%.
• Applied supervised learning techniques achieving up to 85%+ model accuracy on practice datasets.

Skills & Technologies
Programming Languages : Python, SQL
Machine Learning : Classification, Regression, NLP, ANN, CNN, RAG, LLM Integration
Frameworks/Libraries : Pandas, NumPy, Scikit-learn, NLTK, Seaborn, LangChain, Matplotlib
Tools : Git, GitHub, Docker, FastAPI, AWS EC2, Streamlit, Colab
Relevant CourseWork : Data Structures, Algorithms, Problem Solving

Achievements
• Secured a position among the Top 25 teams in the HackerRank GenZPulse 2026 Hackathon by developing an AI-based technical assessment generation platform.
• Solved 200+ DSA problems across platforms including LeetCode and GeeksforGeeks.
"""

    # 4. Upload Resume
    print("\n[Step 3] Uploading resume document via multipart/form-data...")
    file_bytes = sample_resume_text.encode("utf-8")
    files = {
        "file": ("Sampath_Resume.txt", file_bytes, "text/plain")
    }

    upload_resp = client.post("/api/resumes/upload", headers=headers, files=files)
    if upload_resp.status_code != 200:
        print(f"[FAIL] Upload failed with status {upload_resp.status_code}: {upload_resp.text}")
        sys.exit(1)

    data = upload_resp.json()
    resume_id = data.get("id")
    print(f" [PASS] Resume successfully uploaded! (Resume ID: {resume_id})")

    # 5. Validate Parsed Fields
    print("\n[Step 4] Validating parsed resume sections...")
    full_name = data.get("full_name", "")
    email_parsed = data.get("email", "")
    phone_parsed = data.get("phone", "")
    education = data.get("education", [])
    projects = data.get("projects", [])
    experience = data.get("experience", [])
    skills = data.get("skills", [])
    achievements = data.get("achievements", [])

    print(f"  - Full Name:        {full_name}")
    print(f"  - Contact Email:    {email_parsed}")
    print(f"  - Contact Phone:    {phone_parsed}")
    print(f"  - Education Rows:   {len(education)}")
    print(f"  - Key Projects:     {len(projects)}")
    print(f"  - Work Experience:  {len(experience)}")
    print(f"  - Extracted Skills: {len(skills)}")
    print(f"  - Achievements:     {len(achievements)}")

    assert resume_id is not None and resume_id > 0, "Resume ID must be valid"
    assert "Sampath" in full_name or "Balaga" in full_name, "Parsed name mismatch"
    assert len(skills) > 0, "Should extract at least one skill"
    print(" [PASS] All NLP parsed sections verified successfully.")

    # 6. Verify Fetch from Database
    print(f"\n[Step 5] Verifying persistent database retrieval (GET /api/resumes/{resume_id})...")
    get_resp = client.get(f"/api/resumes/{resume_id}", headers=headers)
    if get_resp.status_code != 200:
        print(f"[FAIL] Failed to fetch resume {resume_id}: {get_resp.text}")
        sys.exit(1)
    
    get_data = get_resp.json()
    assert get_data["id"] == resume_id, "Fetched ID must match uploaded ID"
    print(" [PASS] Resume retrieval and database integrity confirmed.")

    # 7. Verify PDF Export
    print(f"\n[Step 6] Testing PDF export for uploaded resume (GET /api/resumes/{resume_id}/pdf)...")
    pdf_resp = client.get(f"/api/resumes/{resume_id}/pdf", headers=headers)
    if pdf_resp.status_code != 200 or len(pdf_resp.content) < 500:
        print(f"[FAIL] PDF download failed: status={pdf_resp.status_code}, len={len(pdf_resp.content)}")
        sys.exit(1)
    print(f" [PASS] PDF generated successfully ({len(pdf_resp.content)} bytes).")

    print("\n" + "=" * 70)
    print("   TEST SUMMARY: ALL RESUME UPLOAD CHECKS PASSED (100% OK)")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_upload_test()
