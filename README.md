# 🚀 AI Career Copilot

> **Build smarter. Match better. Interview with confidence.**  
> A full-stack, AI-powered career copilot that bridges the gap between your resume and your dream job: from ATS scoring and targeted resume optimization to personalized mock interview simulations.

---

## ✨ Features

- 🎯 **ATS Resume Scanner & Score Breakdown**: In-depth analysis across Skills (30%), Keywords (25%), Experience (15%), Education (10%), Semantic Relevance (10%), and Formatting/Structure (10%).
- 🔍 **Real-Time Keyword & Gap Analysis**: Pinpoints matching, missing, and recommended industry keywords tailored to specific Job Descriptions.
- ⚡ **AI Resume Optimizer**: Interactive suggestions, section rewrites, and instant side-by-side comparisons with exportable clean PDF format.
- 🎙️ **Personalized Mock Interview Coach**: Generates role-specific behavioral, technical, and situational interview questions dynamically calibrated to the candidate's actual resume gaps.
- 📊 **Interview Performance & Feedback**: In-depth evaluation of candidate answers with scoring rubric, strengths, and actionable areas for improvement.
- 🔐 **JWT Authentication & Profile Management**: Secure user accounts, persistent resume histories, and saved job match profiles.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database**: [SQLAlchemy](https://www.sqlalchemy.org/) ORM (SQLite / PostgreSQL)
- **Document Parsing**: PyMuPDF (`fitz`), `python-docx`
- **PDF Generation**: ReportLab
- **Security**: Passlib (`bcrypt`), Python-JOSE (JWT tokens)
- **Validation**: Pydantic v2

---

## 📂 Project Structure

```plaintext
ai-career-copilot/
├── backend/
│   ├── app/
│   │   ├── core/         # Security, JWT, configuration
│   │   ├── database/     # SQLAlchemy models & sessions
│   │   ├── routers/      # Auth, Resumes, Jobs, ATS, Interviews, Career
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   └── services/     # ATS scoring, AI integrations, PDF generator
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client & API endpoints
│   │   ├── components/   # UI components, layout, navbar
│   │   └── pages/        # Dashboard, ATS Checker, Resume Optimizer, Interview Coach
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── vercel.json           # Root Vercel configuration
└── README.md
```

---

## 🏃 Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python run.py
```
*Backend API will run at `http://127.0.0.1:8000` (API Docs at `http://127.0.0.1:8000/api/docs`).*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run at `http://localhost:5173` with proxy configured to `/api`.*

---

## 🌐 Deployment Guide

### Deploying Frontend to Vercel

1. Push this repository to your GitHub account:
   ```bash
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Click **Add New Project** and import your `ai-career-copilot` repository.
4. Set **Root Directory** to `frontend` (or leave as root since `vercel.json` is configured).
5. In **Environment Variables**, set:
   - `VITE_API_URL`: URL of your deployed backend (e.g. `https://your-backend.onrender.com/api`).
6. Click **Deploy**!

### Deploying Backend (Render / Railway / Fly.io)

You can easily deploy the FastAPI backend on **Render** (free Web Service) or **Railway**:
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `SECRET_KEY`: A strong random string
  - `LLM_PROVIDER`: `gemini` (or `openai`)
  - `GEMINI_API_KEY`: Your Google Gemini API Key

---

## 📄 License
MIT License
