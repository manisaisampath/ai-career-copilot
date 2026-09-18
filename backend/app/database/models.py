from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    headline = Column(String(255), nullable=True)
    target_role = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    ats_analyses = relationship("ATSAnalysis", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    career_insights = relationship("CareerInsight", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="My Resume")
    template = Column(String(50), default="modern")  # modern | classic | technical
    
    # Personal Info fields
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)
    github = Column(String(255), nullable=True)
    portfolio = Column(String(255), nullable=True)
    
    summary = Column(Text, nullable=True)
    
    # Stored sections / full data cache
    content = Column(JSON, nullable=True)
    version = Column(Integer, default=1)
    is_primary = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="resumes")
    education_items = relationship("Education", back_populates="resume", cascade="all, delete-orphan")
    experience_items = relationship("Experience", back_populates="resume", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="resume", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="resume", cascade="all, delete-orphan")
    ats_analyses = relationship("ATSAnalysis", back_populates="resume", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="resume", cascade="all, delete-orphan")


class Education(Base):
    __tablename__ = "education"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    institution = Column(String(255), nullable=False)
    degree = Column(String(255), nullable=False)
    field = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    gpa = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    
    resume = relationship("Resume", back_populates="education_items")


class Experience(Base):
    __tablename__ = "experience"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    is_current = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    
    resume = relationship("Resume", back_populates="experience_items")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    technologies = Column(String(500), nullable=True)
    link = Column(String(255), nullable=True)
    
    resume = relationship("Resume", back_populates="projects")


class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False)
    category = Column(String(50), default="Technical")  # Technical, Frameworks, Tools, Soft Skills, Languages
    
    resume = relationship("Resume", back_populates="skills")


class JobDescription(Base):
    __tablename__ = "job_descriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    extracted_skills = Column(JSON, nullable=True)
    extracted_keywords = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="job_descriptions")
    ats_analyses = relationship("ATSAnalysis", back_populates="job_description", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="job_description", cascade="all, delete-orphan")


class ATSAnalysis(Base):
    __tablename__ = "ats_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    
    overall_score = Column(Float, nullable=False)  # 0 to 100
    skills_score = Column(Float, nullable=False)   # 30% weight
    keyword_score = Column(Float, nullable=False)  # 25% weight
    experience_score = Column(Float, nullable=False) # 15% weight
    education_score = Column(Float, nullable=False) # 10% weight
    semantic_score = Column(Float, nullable=False) # 10% weight
    structure_score = Column(Float, nullable=False) # 10% weight
    
    match_level = Column(String(50), nullable=False)  # Strong Match, Moderate Match, Needs Improvement
    summary = Column(Text, nullable=True)
    
    # Rich structured breakdown
    working_points = Column(JSON, nullable=True)
    attention_points = Column(JSON, nullable=True)
    matched_keywords = Column(JSON, nullable=True)
    missing_keywords = Column(JSON, nullable=True)
    skill_alignment = Column(JSON, nullable=True)
    optimization_suggestions = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="ats_analyses")
    resume = relationship("Resume", back_populates="ats_analyses")
    job_description = relationship("JobDescription", back_populates="ats_analyses")
    gaps = relationship("ATSGap", back_populates="analysis", cascade="all, delete-orphan")


class ATSGap(Base):
    __tablename__ = "ats_gaps"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("ats_analyses.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # missing_keyword, missing_skill, weak_section, suggestion
    item = Column(String(255), nullable=False)
    severity = Column(String(20), default="medium")  # high, medium, low
    recommendation = Column(Text, nullable=False)
    
    analysis = relationship("ATSAnalysis", back_populates="gaps")


class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    
    type = Column(String(50), default="mixed")  # technical | hr | project_based | mixed
    status = Column(String(20), default="in_progress")  # in_progress | completed
    
    overall_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    completeness_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    
    summary = Column(Text, nullable=True)
    strong_areas = Column(JSON, nullable=True)
    improvement_areas = Column(JSON, nullable=True)
    recommended_practice = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="interviews")
    resume = relationship("Resume", back_populates="interviews")
    job_description = relationship("JobDescription", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview", cascade="all, delete-orphan", order_by="InterviewQuestion.order_index")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    category = Column(String(50), default="technical")  # technical, behavioral, project, problem_solving
    context_project = Column(String(255), nullable=True)  # Links to user's real project if project-based
    order_index = Column(Integer, default=0)
    
    interview = relationship("Interview", back_populates="questions")
    answer = relationship("InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False)
    answer = Column(Text, nullable=False)
    
    relevance_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    completeness_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)
    
    feedback = Column(Text, nullable=True)
    strong_points = Column(JSON, nullable=True)
    improvement_areas = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    question = relationship("InterviewQuestion", back_populates="answer")


class CareerInsight(Base):
    __tablename__ = "career_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_alignment = Column(Float, default=0.0)
    interview_readiness = Column(Float, default=0.0)
    top_improvements = Column(JSON, nullable=True)
    recommended_step = Column(Text, nullable=True)
    priority = Column(String(20), default="high")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="career_insights")
