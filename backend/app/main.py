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
from fastapi import HTTPException

def get_frontend_dist():
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
        os.path.abspath("backend/dist"),
        os.path.abspath("frontend/dist"),
        os.path.abspath("dist"),
        "/var/task/dist",
        "/var/task/frontend/dist",
        "/var/task/backend/dist",
        "/vercel/path0/dist",
        "/vercel/path0/frontend/dist",
        "/vercel/path0/backend/dist"
    ]
    for p in candidates:
        if os.path.isdir(p) and os.path.isfile(os.path.join(p, "index.html")):
            return p
    return None

@app.get("/api/debug-dist")
def debug_dist():
    dist = get_frontend_dist()
    files = []
    if dist and os.path.isdir(dist):
        for root, _, filenames in os.walk(dist):
            for fn in filenames:
                files.append(os.path.relpath(os.path.join(root, fn), dist))
    return {
        "dist": dist,
        "cwd": os.getcwd(),
        "files": files
    }

@app.get("/")
async def serve_root():
    dist = get_frontend_dist()
    if dist:
        return FileResponse(os.path.join(dist, "index.html"), media_type="text/html")
    raise HTTPException(status_code=404, detail="Frontend dist not found")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API route not found")
        
    dist = get_frontend_dist()
    if not dist:
        raise HTTPException(status_code=500, detail="Frontend build not found")

    clean_path = full_path.lstrip("/")
    target = os.path.abspath(os.path.join(dist, clean_path))
    
    if clean_path and os.path.isfile(target):
        media_type = None
        if clean_path.endswith(".js") or clean_path.endswith(".mjs"):
            media_type = "application/javascript"
        elif clean_path.endswith(".css"):
            media_type = "text/css"
        elif clean_path.endswith(".svg"):
            media_type = "image/svg+xml"
        elif clean_path.endswith(".png"):
            media_type = "image/png"
        elif clean_path.endswith(".ico"):
            media_type = "image/x-icon"
        return FileResponse(target, media_type=media_type)
    
    if clean_path.startswith("assets/") or clean_path.endswith((".js", ".css", ".map")):
        raise HTTPException(status_code=404, detail=f"Asset {clean_path} not found")

    return FileResponse(os.path.join(dist, "index.html"), media_type="text/html")


