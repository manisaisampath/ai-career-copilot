from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base
from app.routers import auth, resumes, jobs, ats, interviews, career

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI Career Copilot — Connected ATS Resume Optimizer & Personalized Interview Coach",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits dev frontend running on 5173 or other ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(resumes.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(ats.router, prefix=settings.API_V1_STR)
app.include_router(interviews.router, prefix=settings.API_V1_STR)
app.include_router(career.router, prefix=settings.API_V1_STR)

@app.get("/api")
def api_root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": "Build smarter. Match better. Interview with confidence.",
        "status": "healthy",
        "docs": "/api/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "llm_provider": settings.LLM_PROVIDER,
        "database": "connected"
    }

# Mount static frontend and provide SPA routing
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

possible_dist_dirs = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
    os.path.abspath("backend/dist"),
    os.path.abspath("frontend/dist"),
    "/vercel/path0/backend/dist",
    "/vercel/path0/frontend/dist"
]

frontend_dist = None
for p in possible_dist_dirs:
    if os.path.isdir(p) and os.path.isfile(os.path.join(p, "index.html")):
        frontend_dist = p
        break

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

