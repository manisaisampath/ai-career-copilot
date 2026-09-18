from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class JobDescriptionCreate(BaseModel):
    title: str
    company: Optional[str] = ""
    location: Optional[str] = ""
    description: str

class JobDescriptionResponse(BaseModel):
    id: int
    user_id: int
    title: str
    company: Optional[str] = ""
    location: Optional[str] = ""
    description: str
    extracted_skills: Optional[List[str]] = []
    extracted_keywords: Optional[List[str]] = []
    created_at: datetime

    class Config:
        from_attributes = True
