from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class EducationItem(BaseModel):
    id: Optional[int] = None
    institution: str
    degree: str
    field: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    gpa: Optional[str] = ""
    description: Optional[str] = ""

class ExperienceItem(BaseModel):
    id: Optional[int] = None
    company: str
    role: str
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    is_current: Optional[bool] = False
    description: Optional[str] = ""

class ProjectItem(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = ""
    technologies: Optional[str] = ""
    link: Optional[str] = ""
    github_link: Optional[str] = ""
    live_link: Optional[str] = ""

class SkillItem(BaseModel):
    id: Optional[int] = None
    skill_name: str
    category: Optional[str] = "Technical"

class CertificationItem(BaseModel):
    name: str
    issuer: Optional[str] = ""
    date: Optional[str] = ""
    link: Optional[str] = ""

class AchievementItem(BaseModel):
    title: str
    description: Optional[str] = ""
    date: Optional[str] = ""

class LanguageItem(BaseModel):
    language: str
    proficiency: Optional[str] = "Fluent"  # Native, Fluent, Intermediate, Basic

class ResumeCreate(BaseModel):
    title: str = "My Resume"
    template: Optional[str] = "modern"
    full_name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    portfolio: Optional[str] = ""
    summary: Optional[str] = ""
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    skills: List[SkillItem] = []
    certifications: List[CertificationItem] = []
    achievements: List[AchievementItem] = []
    languages: List[LanguageItem] = []

class ResumeUpdate(ResumeCreate):
    title: Optional[str] = None

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    title: str
    template: str
    full_name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    portfolio: Optional[str] = ""
    summary: Optional[str] = ""
    education: List[Dict[str, Any]] = []
    experience: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    skills: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    achievements: List[Dict[str, Any]] = []
    languages: List[Dict[str, Any]] = []
    version: int
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResumeEnhanceRequest(BaseModel):
    section_type: str  # summary | project | experience | bullet_point
    original_text: Optional[str] = ""
    context_role: Optional[str] = ""
    context_tech: Optional[str] = ""

class ResumeEnhanceResponse(BaseModel):
    original_text: str
    suggested_text: str
    explanation: str
    changes_made: List[str] = []
