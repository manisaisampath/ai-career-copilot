from pydantic_settings import BaseSettings
from typing import Optional, Dict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Career Copilot"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "copilot-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (Defaults to SQLite for local ease, supports PostgreSQL via env)
    default_db: str = "/tmp/career_copilot.db" if os.getenv("VERCEL") else "./career_copilot.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{default_db}")
    
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # gemini | openai | claude | local
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)
    
    # ATS Scoring Weights (Configurable)
    ATS_WEIGHT_SKILLS: float = 0.30
    ATS_WEIGHT_KEYWORDS: float = 0.25
    ATS_WEIGHT_EXPERIENCE: float = 0.15
    ATS_WEIGHT_EDUCATION: float = 0.10
    ATS_WEIGHT_SEMANTIC: float = 0.10
    ATS_WEIGHT_STRUCTURE: float = 0.10

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
