"""
test_full_suite.py — AI Career Copilot Complete End-to-End Test Suite

This suite tests the entire backend architecture:
1. System Health & DB Connectivity (/api/health)
2. User Registration (/api/auth/register)
3. User Authentication (/api/auth/login)
4. Resume Upload & NLP Parser (/api/resumes/upload)
5. Resume Retrieval & Integrity (/api/resumes/{id})
6. PDF Document Generation (/api/resumes/{id}/pdf)
7. Job Description Management (/api/jobs)
8. ATS Optimization Engine & Scoring (/api/ats/analyze)
9. AI Mock Interview Generation (/api/interviews)
10. Career Copilot Dashboard (/api/career/dashboard)

Runs automatically either against a live server (http://127.0.0.1:8000)
or directly in-process via FastAPI's TestClient if no server is running.
Guaranteed to never fail with ConnectionRefusedError!
"""

import sys
import os
import time
import io
import warnings

# Suppress starlette/httpx deprecation warnings
warnings.filterwarnings("ignore")

# Ensure backend directory is in python search path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class APIClientWrapper:
    """Seamless API client supporting both live HTTP requests and in-process TestClient."""

    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url.rstrip("/")
        self.mode = "live"
        self._test_client = None

        # Check if live server is reachable
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


def run_full_suite():
    print("=" * 75)
    print("      AI CAREER COPILOT -- COMPLETE END-TO-END VERIFICATION SUITE")
    print("=" * 75)

    client = APIClientWrapper()
    if client.mode == "live":
        print(f"[*] Execution Mode: LIVE SERVER (connected to {client.base_url})")
    else:
        print("[*] Execution Mode: IN-PROCESS TESTCLIENT (Zero-config standalone)")

    start_time = time.time()
    passed_tests = 0
    total_tests = 10

    # -------------------------------------------------------------
    # 1. Health Check
    # -------------------------------------------------------------
    print("\n[Step 1/10] Verifying System Health & Database Connectivity...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code} {res.text}"
    health_data = res.json()
    assert health_data.get("status") == "ok", "Status should be 'ok'"
    assert health_data.get("database") == "connected", "DB should be connected"
    print(f" [PASS] Health check OK (Database: {health_data.get('database')}, LLM Provider: {health_data.get('llm_provider')})")
    passed_tests += 1

    # -------------------------------------------------------------
    # 2. User Registration
    # -------------------------------------------------------------
    ts = int(time.time() * 1000)
    email = f"suite_{ts}@career.com"
    password = "CareerPassword123!"
    user_name = "Balaga Mani Sai Sampath"

    print(f"\n[Step 2/10] Registering New Account ({email})...")
    res = client.post("/api/auth/register", json={
        "name": user_name,
        "email": email,
        "password": password
    })
    assert res.status_code in (200, 201), f"Registration failed: {res.status_code} {res.text}"
    print(" [PASS] User registration succeeded.")
    passed_tests += 1

    # -------------------------------------------------------------
    # 3. User Login & Token
    # -------------------------------------------------------------
    print("\n[Step 3/10] Authenticating Account & Generating JWT...")
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert res.status_code == 200, f"Login failed: {res.status_code} {res.text}"
    login_data = res.json()
    token = login_data.get("access_token")
    assert token, "Access token missing from login response"
    headers = {"Authorization": f"Bearer {token}"}
    print(" [PASS] Login successful, Bearer token acquired.")
    passed_tests += 1

    # -------------------------------------------------------------
    # 4. Resume Upload & Parsing
    # -------------------------------------------------------------
    print("\n[Step 4/10] Uploading Comprehensive Resume & Running NLP Parser...")
    sample_resume = """Balaga Mani Sai Sampath
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
    files = {"file": ("Sampath_Resume.txt", sample_resume.encode("utf-8"), "text/plain")}
    res = client.post("/api/resumes/upload", headers=headers, files=files)
    assert res.status_code == 200, f"Upload failed: {res.status_code} {res.text}"
    resume = res.json()
    resume_id = resume["id"]
    print(f" [PASS] Resume uploaded with ID {resume_id}.")
    print(f"        Parsed Name: {resume.get('full_name')}")
    print(f"        Education items: {len(resume.get('education', []))}")
    print(f"        Projects parsed: {len(resume.get('projects', []))}")
    print(f"        Skills extracted: {len(resume.get('skills', []))}")
    passed_tests += 1

    # -------------------------------------------------------------
    # 5. Resume Retrieval & Integrity Check
    # -------------------------------------------------------------
    print(f"\n[Step 5/10] Verifying Resume Storage via GET /api/resumes/{resume_id}...")
    res = client.get(f"/api/resumes/{resume_id}", headers=headers)
    assert res.status_code == 200, f"Fetch resume failed: {res.status_code}"
    fetched = res.json()
    assert fetched["id"] == resume_id, "Fetched ID mismatch"
    print(" [PASS] Resume retrieval verified with database persistence.")
    passed_tests += 1

    # -------------------------------------------------------------
    # 6. PDF Generation Download
    # -------------------------------------------------------------
    print(f"\n[Step 6/10] Generating & Downloading Formatted PDF (/api/resumes/{resume_id}/pdf)...")
    res = client.get(f"/api/resumes/{resume_id}/pdf", headers=headers)
    assert res.status_code == 200, f"PDF export failed: {res.status_code}"
    pdf_bytes = len(res.content)
    assert pdf_bytes > 1000, f"PDF size too small: {pdf_bytes} bytes"
    print(f" [PASS] PDF generated successfully ({pdf_bytes} bytes).")
    passed_tests += 1

    # -------------------------------------------------------------
    # 7. Job Creation
    # -------------------------------------------------------------
    print("\n[Step 7/10] Creating Target Job Description (/api/jobs)...")
    res = client.post("/api/jobs", headers=headers, json={
        "title": "Machine Learning Engineer",
        "company": "NextGen AI Labs",
        "description": "Looking for an ML engineer skilled in Python, Scikit-learn, LangChain, RAG, Streamlit, and FastAPI."
    })
    assert res.status_code in (200, 201), f"Job create failed: {res.status_code} {res.text}"
    job = res.json()
    job_id = job["id"]
    print(f" [PASS] Target job registered (Job ID: {job_id}, Title: {job['title']}).")
    passed_tests += 1

    # -------------------------------------------------------------
    # 8. ATS Compatibility Analysis
    # -------------------------------------------------------------
    print(f"\n[Step 8/10] Executing ATS Scoring & Gap Analysis (/api/ats/analyze)...")
    res = client.post("/api/ats/analyze", headers=headers, json={
        "resume_id": resume_id,
        "job_id": job_id
    })
    assert res.status_code in (200, 201), f"ATS analysis failed: {res.status_code} {res.text}"
    ats = res.json()
    matched_skills = [s for s in ats.get("skill_alignment", []) if s.get("matched")]
    missing_skills = [s for s in ats.get("skill_alignment", []) if not s.get("matched")]
    print(f" [PASS] ATS Analysis Complete:")
    print(f"        Overall ATS Score:   {ats.get('overall_score')}%")
    print(f"        Skills Match Score:  {ats.get('skills_score')}%")
    print(f"        Keyword Score:       {ats.get('keyword_score', 0.0)}%")
    print(f"        Matched Skills:      {len(matched_skills)}")
    print(f"        Missing Skills:      {len(missing_skills)}")
    print(f"        Match Level:         {ats.get('match_level')}")
    passed_tests += 1

    # -------------------------------------------------------------
    # 9. AI Mock Interview Generation
    # -------------------------------------------------------------
    print("\n[Step 9/10] Generating Tailored AI Mock Interview (/api/interviews)...")
    res = client.post("/api/interviews", headers=headers, json={
        "resume_id": resume_id,
        "job_description_id": job_id,
        "type": "technical"
    })
    assert res.status_code in (200, 201), f"Interview generation failed: {res.status_code} {res.text}"
    interview = res.json()
    interview_id = interview.get("id")
    questions = interview.get("questions", [])
    print(f" [PASS] Mock interview generated (Interview ID: {interview_id}, Questions: {len(questions)}).")
    passed_tests += 1

    # -------------------------------------------------------------
    # 10. Career Copilot Dashboard
    # -------------------------------------------------------------
    print("\n[Step 10/10] Fetching Career Dashboard Readiness Report (/api/career/dashboard)...")
    res = client.get("/api/career/dashboard", headers=headers)
    assert res.status_code == 200, f"Dashboard retrieval failed: {res.status_code} {res.text}"
    dashboard = res.json()
    print(f" [PASS] Dashboard loaded successfully:")
    print(f"        User Name:       {dashboard.get('user_name')}")
    print(f"        Resume Linked:   {dashboard.get('has_resume')}")
    print(f"        Latest ATS Score: {dashboard.get('latest_ats_score')}")
    print(f"        Next Step:       {dashboard.get('recommended_next_step')}")
    passed_tests += 1

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 75)
    print(f"   ALL {passed_tests}/{total_tests} SUITE CHECKS COMPLETED SUCCESSFULLY in {elapsed}s!")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    run_full_suite()
