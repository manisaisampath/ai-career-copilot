from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class InterviewCreateRequest(BaseModel):
    resume_id: int
    job_description_id: int
    type: Optional[str] = "mixed"  # technical | hr | project_based | mixed
    num_questions: Optional[int] = 5

class InterviewAnswerSubmit(BaseModel):
    question_id: int
    answer: str

class InterviewAnswerEvaluation(BaseModel):
    id: int
    question_id: int
    answer: str
    relevance_score: float
    technical_score: float
    completeness_score: float
    clarity_score: float
    overall_score: float
    feedback: str
    strong_points: List[str] = []
    improvement_areas: List[str] = []

    class Config:
        from_attributes = True

class InterviewQuestionResponse(BaseModel):
    id: int
    interview_id: int
    question: str
    category: str
    context_project: Optional[str] = None
    order_index: int
    answer: Optional[InterviewAnswerEvaluation] = None

    class Config:
        from_attributes = True

class InterviewResponse(BaseModel):
    id: int
    user_id: int
    resume_id: int
    job_description_id: int
    type: str
    status: str
    overall_score: Optional[float] = None
    technical_score: Optional[float] = None
    relevance_score: Optional[float] = None
    completeness_score: Optional[float] = None
    clarity_score: Optional[float] = None
    summary: Optional[str] = None
    strong_areas: Optional[List[str]] = []
    improvement_areas: Optional[List[str]] = []
    recommended_practice: Optional[List[str]] = []
    created_at: datetime
    questions: List[InterviewQuestionResponse] = []
    job_title: Optional[str] = ""
    job_company: Optional[str] = ""

    class Config:
        from_attributes = True

class InterviewReportResponse(BaseModel):
    interview_id: int
    job_title: str
    job_company: Optional[str] = ""
    interview_type: str
    overall_score: float
    technical_score: float
    relevance_score: float
    completeness_score: float
    clarity_score: float
    summary: str
    strong_areas: List[str]
    improvement_areas: List[str]
    recommended_practice: List[str]
    answered_questions_count: int
    total_questions_count: int
    question_evaluations: List[Dict[str, Any]]
