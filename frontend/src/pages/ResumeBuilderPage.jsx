import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resumeService } from '../api/services';
import { 
  Plus, Trash2, Save, Upload, Sparkles, Download, 
  ChevronDown, ChevronUp, Eye, FileText, CheckCircle2,
  AlertCircle, RefreshCw, Layers, ExternalLink, Github, FilePlus, Loader2,
  Columns, Edit3, Maximize2, ArrowRight
} from 'lucide-react';
import { ResumePreview } from '../components/resume/ResumePreview';
import { AIEnhanceModal } from '../components/resume/AIEnhanceModal';
import { CreateResumeModal } from '../components/resume/CreateResumeModal';
import { downloadResumePdf } from '../utils/resumeDownload';

export const ResumeBuilderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [resumes, setResumes] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // View Mode: 'split' (side-by-side) | 'full_preview' (full width resume) | 'editor' (editor only)
  const [viewMode, setViewMode] = useState('split');

  // Active section tab in editor
  const [activeTab, setActiveTab] = useState('personal');
  const [previewTab, setPreviewTab] = useState(false);

  // AI Enhance Modal state
  const [aiModal, setAiModal] = useState({
    isOpen: false,
    sectionType: '',
    originalText: '',
    callback: null
  });

  const loadResumes = async (selectId = null) => {
    try {
      setLoading(true);
      const res = await resumeService.getResumes();
      setResumes(res.data);
      if (res.data.length > 0) {
        const targetId = selectId || (queryId ? parseInt(queryId) : null);
        if (targetId) {
          const found = res.data.find(r => r.id === targetId);
          setActiveResume(found || res.data[0]);
        } else {
          setActiveResume(res.data[0]);
        }
      } else {
        handleCreateNewResume(true);
      }
    } catch (err) {
      console.error("Failed to load resumes:", err);
      setError("Failed to load resumes. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleCreateNewResume = async (isInitial = false) => {
    try {
      const defaultPayload = {
        title: isInitial ? "Primary Engineering Resume" : `New Resume ${resumes.length + 1}`,
        template: "academic",
        full_name: user?.name || "Balaga Mani Sai Sampath",
        email: user?.email || "balagamanisaisampath@gmail.com",
        phone: "+91 8919660105",
        location: "Vizianagaram, India",
        linkedin: "https://linkedin.com/in/sampath",
        github: "https://github.com/sampath",
        portfolio: "",
        summary: "Computer Science undergraduate specializing in Artificial Intelligence and Machine Learning. Skilled in Machine Learning, Data Science, Generative AI, and problem solving using Python and Data Structures and Algorithms.",
        education: [
          {
            institution: "MVGR College, Vizianagaram",
            degree: "B. Tech, CSE",
            field: "AI/ML",
            start_date: "2023",
            end_date: "2027",
            gpa: "8.52/10",
            description: "Computer Science Engineering with specialization in Artificial Intelligence & Machine Learning."
          },
          {
            institution: "Sri Chaitanya, Visakhapatnam",
            degree: "Intermediate",
            field: "MPC",
            start_date: "2021",
            end_date: "2023",
            gpa: "96%",
            description: "Mathematics, Physics, Chemistry."
          }
        ],
        skills: [
          { skill_name: "Python", category: "Programming Languages" },
          { skill_name: "SQL", category: "Programming Languages" },
          { skill_name: "Classification", category: "Machine Learning" },
          { skill_name: "Regression", category: "Machine Learning" },
          { skill_name: "NLP", category: "Machine Learning" },
          { skill_name: "ANN", category: "Machine Learning" },
          { skill_name: "CNN", category: "Machine Learning" },
          { skill_name: "RAG", category: "Machine Learning" },
          { skill_name: "LLM Integration", category: "Machine Learning" },
          { skill_name: "Pandas", category: "Frameworks/Libraries" },
          { skill_name: "NumPy", category: "Frameworks/Libraries" },
          { skill_name: "Scikit-learn", category: "Frameworks/Libraries" },
          { skill_name: "NLTK", category: "Frameworks/Libraries" },
          { skill_name: "LangChain", category: "Frameworks/Libraries" },
          { skill_name: "Git", category: "Tools" },
          { skill_name: "GitHub", category: "Tools" },
          { skill_name: "Docker", category: "Tools" },
          { skill_name: "FastAPI", category: "Tools" },
          { skill_name: "AWS EC2", category: "Tools" },
          { skill_name: "Streamlit", category: "Tools" },
          { skill_name: "Data Structures", category: "Relevant CourseWork" },
          { skill_name: "Algorithms", category: "Relevant CourseWork" },
          { skill_name: "Problem Solving", category: "Relevant CourseWork" }
        ],
        experience: [
          {
            company: "AICTE – EduSkills (Google)",
            role: "AI-ML Virtual Internship",
            location: "",
            start_date: "Oct 2025",
            end_date: "Dec 2025",
            is_current: false,
            description: "• Implemented ML workflows improving model understanding efficiency by 25%.\n• Applied supervised learning techniques achieving up to 85%+ model accuracy on practice datasets."
          }
        ],
        projects: [
          {
            title: "Credit Risk Modeling & Scoring System",
            technologies: "Python, Scikit-learn, Pandas, NumPy, Streamlit",
            link: "https://github.com/sampath/credit-risk",
            description: "• Attained 89% accuracy on loan default prediction dataset using LogisticRegression.\n• Applied SMOTE to balance imbalanced dataset and enhance classification performance.\n• Deployed credit risk scoring system via Streamlit application."
          },
          {
            title: "Multi-Source RAG System for Real-Time Web Question Answering",
            technologies: "Python, LangChain, ChromaDB, HuggingFace Embeddings, Groq API, Streamlit, Vector Databases",
            link: "https://github.com/sampath/rag-system",
            description: "• Developed a multi-source RAG system using MiniLM embeddings and ChromaDB.\n• Improved answer grounding via Top-K semantic retrieval and prompt engineering.\n• Integrated LLaMA-3.3-70B (Groq API) and deployed a real-time Streamlit app."
          },
          {
            title: "Health Insurance Premium Prediction API Deployment",
            technologies: "Python, FastAPI, Docker, AWS EC2, Streamlit, Scikit-learn",
            link: "https://github.com/sampath/insurance-api",
            description: "• Developed and deployed a Machine Learning API for health insurance premium prediction using FastAPI.\n• Containerized the application using Docker and deployed it on AWS EC2 for real-time inference.\n• Integrated a Streamlit frontend and built REST API endpoints with Swagger documentation."
          }
        ],
        achievements: [
          {
            title: "HackerRank GenZPulse 2026 Hackathon",
            description: "Secured a position among the Top 25 teams in the HackerRank GenZPulse 2026 Hackathon by developing an AI-based technical assessment generation platform.",
            date: "2026"
          },
          {
            title: "200+ DSA Problems Solved",
            description: "Solved 200+ DSA problems across platforms including LeetCode and GeeksforGeeks.",
            date: "2026"
          }
        ],
        certifications: [],
        languages: [{ language: "English", proficiency: "Fluent" }]
      };

      const res = await resumeService.createResume(defaultPayload);
      setResumes([res.data, ...resumes]);
      setActiveResume(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Create failed:", err);
      setError("Failed to create new resume.");
    }
  };

  const handleDeleteActiveResume = async () => {
    if (!activeResume) return;
    if (!window.confirm(`Are you sure you want to delete "${activeResume.title}"?`)) return;
    setDeleting(true);
    try {
      await resumeService.deleteResume(activeResume.id);
      const remaining = resumes.filter(r => r.id !== activeResume.id);
      setResumes(remaining);
      if (remaining.length > 0) {
        setActiveResume(remaining[0]);
      } else {
        handleCreateNewResume(true);
      }
    } catch (err) {
      setError("Failed to delete resume.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!activeResume) return;
    setSaving(true);
    setSaveSuccess(false);
    setError('');
    try {
      const res = await resumeService.updateResume(activeResume.id, activeResume);
      setActiveResume(res.data);
      // Update item in resumes array
      setResumes(resumes.map(r => r.id === res.data.id ? res.data : r));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save resume. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!activeResume?.id) return;
    try {
      setSaving(true);
      const res = await resumeService.updateResume(activeResume.id, activeResume);
      setActiveResume(res.data);
      setResumes(resumes.map(r => r.id === res.data.id ? res.data : r));
    } catch (saveErr) {
      console.warn("Auto-save before download failed:", saveErr);
    } finally {
      setSaving(false);
    }
    await downloadResumePdf(activeResume, setDownloading);
  };

  const handleNextToATSOptimization = async () => {
    if (activeResume?.id) {
      try {
        setSaving(true);
        const res = await resumeService.updateResume(activeResume.id, activeResume);
        setActiveResume(res.data);
        setResumes(resumes.map(r => r.id === res.data.id ? res.data : r));
      } catch (saveErr) {
        console.warn("Auto-save before navigating to ATS optimization:", saveErr);
      } finally {
        setSaving(false);
      }
      navigate(`/job-match?resume_id=${activeResume.id}`);
    } else {
      navigate('/job-match');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await resumeService.uploadResume(file);
      setResumes([res.data, ...resumes]);
      setActiveResume(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to parse resume file. Upload PDF or DOCX.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openAIEnhancer = (sectionType, originalText, callback) => {
    setAiModal({
      isOpen: true,
      sectionType,
      originalText: originalText || '',
      callback
    });
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-700" />
        <p className="text-xs text-slate-500 font-medium">Loading resume workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-[1720px] mx-auto">
      
      {/* 1. Resume Switcher & Management Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
        
        {/* Left: Resume Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-slate-800 shrink-0" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Active Resume:</span>
              <select
                value={activeResume?.id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const target = resumes.find(r => r.id === id);
                  if (target) {
                    setActiveResume(target);
                    setSearchParams({ id });
                  }
                }}
                className="font-bold text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.full_name || 'Resume'})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              ATS-Standard Academic & Technical Format • Full Section Preservation
            </p>
          </div>
        </div>

        {/* Right: Actions (View Mode Switcher, Create New, Upload New, Delete, Save) */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
            <button
              onClick={() => setViewMode('split')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'split' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Split View (Editor + Resume Preview)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>

            <button
              onClick={() => setViewMode('full_preview')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'full_preview' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-indigo-600'
              }`}
              title="Full Resume View (Maximum Width, Full A4)"
              id="btn-view-mode-full"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Full Resume View</span>
            </button>

            <button
              onClick={() => setViewMode('editor')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'editor' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Editor Only (Focus on Writing)"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editor Only</span>
            </button>
          </div>

          {/* Create New Resume Trigger */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
            id="btn-builder-create-resume"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>+ Create New Resume</span>
          </button>

          {/* Upload New Resume */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Parsing...' : 'Upload New Resume'}</span>
          </button>

          {/* Delete Active Resume */}
          {resumes.length > 1 && (
            <button
              onClick={handleDeleteActiveResume}
              disabled={deleting}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
              title="Delete Active Resume"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>

          {/* Download ATS PDF Button */}
          <button
            onClick={handleDownload}
            disabled={downloading || saving || !activeResume}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs disabled:opacity-50"
            title="Download ATS PDF"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>

          {/* Next: ATS Optimization Button */}
          <button
            onClick={handleNextToATSOptimization}
            disabled={saving || !activeResume}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs disabled:opacity-50"
            id="btn-builder-next-ats"
            title="Save and proceed to ATS Optimization & Job Match"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Next: ATS Optimization</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Preview Toggle */}
          <button
            onClick={() => setPreviewTab(!previewTab)}
            className="md:hidden inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-medium rounded-lg"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewTab ? 'Editor' : 'Preview'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Resume saved successfully. Changes are live in your ATS document preview and downloads.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout: Split, Full Preview, or Editor Only based on viewMode */}
      <div className={`grid grid-cols-1 gap-6 min-h-[750px] ${viewMode === 'split' ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        
        {/* Left Column: 10-Section Builder */}
        {viewMode !== 'full_preview' && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5 xl:col-span-5' : 'max-w-4xl mx-auto w-full'} space-y-4 ${previewTab && viewMode === 'split' ? 'hidden lg:block' : 'block'}`}>
          
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-medium scrollbar-none">
            {[
              { id: 'personal', label: '1. Contact' },
              { id: 'summary', label: '2. Summary' },
              { id: 'education', label: '3. Academic Table' },
              { id: 'projects', label: '4. Key Projects' },
              { id: 'experience', label: '5. Experience' },
              { id: 'skills', label: '6. Skills & Tech' },
              { id: 'achievements', label: '7. Achievements' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-t-lg whitespace-nowrap transition-colors border-b-2 font-semibold ${
                  activeTab === tab.id
                    ? 'border-slate-900 text-slate-950 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Section Content Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5 shadow-2xs">
            
            {/* 1. Personal Information */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Contact Information & Title
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Resume Title</label>
                    <input
                      type="text"
                      value={activeResume?.title || ''}
                      onChange={(e) => setActiveResume({ ...activeResume, title: e.target.value })}
                      placeholder="e.g. AI-ML Resume"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={activeResume?.full_name || ''}
                      onChange={(e) => setActiveResume({ ...activeResume, full_name: e.target.value })}
                      placeholder="Balaga Mani Sai Sampath"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Headline / Subtitle</label>
                    <input
                      type="text"
                      value={activeResume?.headline || ''}
                      onChange={(e) => setActiveResume({ ...activeResume, headline: e.target.value })}
                      placeholder="4th Year CSE | Computer Science Engineering [AI/ML]"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={activeResume?.email || ''}
                      onChange={(e) => setActiveResume({ ...activeResume, email: e.target.value })}
                      placeholder="balagamanisaisampath@gmail.com"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={activeResume?.phone || ''}
                      onChange={(e) => setActiveResume({ ...activeResume, phone: e.target.value })}
                      placeholder="+91 8919660105"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={activeResume?.location || ''}
                      onChange={(e) => setActiveResume({ ...activeResume, location: e.target.value })}
                      placeholder="Vizianagaram, India"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={activeResume?.linkedin || ''}
                      onChange={(e) => setActiveResume({ ...activeResume, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/sampath"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">GitHub URL</label>
                    <input
                      type="text"
                      value={activeResume?.github || ''}
                      onChange={(e) => setActiveResume({ ...activeResume, github: e.target.value })}
                      placeholder="https://github.com/sampath"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Professional Summary */}
            {activeTab === 'summary' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Professional Summary
                  </h3>
                  <button
                    type="button"
                    onClick={() => openAIEnhancer('summary', activeResume?.summary, (enhanced) => {
                      setActiveResume({ ...activeResume, summary: enhanced });
                    })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-md transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-slate-700" />
                    <span>AI Enhance Summary</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={activeResume?.summary || ''}
                  onChange={(e) => setActiveResume({ ...activeResume, summary: e.target.value })}
                  placeholder="Computer Science undergraduate specializing in Artificial Intelligence and Machine Learning..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            )}

            {/* 3. Academic Qualifications Table */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Academic Qualifications Table ({activeResume?.education?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeResume.education || [];
                      setActiveResume({
                        ...activeResume,
                        education: [...current, {
                          institution: '',
                          degree: 'B. Tech, CSE',
                          field: 'AI/ML',
                          start_date: '2023',
                          end_date: '2027',
                          gpa: '8.5/10',
                          description: ''
                        }]
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md hover:bg-slate-800"
                  >
                    <Plus className="w-3 h-3" /> Add Qualification
                  </button>
                </div>

                <div className="space-y-4">
                  {(activeResume?.education || []).map((edu, index) => (
                    <div key={index} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {edu.degree || 'Degree'} {edu.institution && `— ${edu.institution}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = activeResume.education.filter((_, i) => i !== index);
                            setActiveResume({ ...activeResume, education: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 text-xs p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Year</label>
                          <input
                            type="text"
                            value={edu.end_date || ''}
                            onChange={(e) => {
                              const updated = [...activeResume.education];
                              updated[index].end_date = e.target.value;
                              setActiveResume({ ...activeResume, education: updated });
                            }}
                            placeholder="e.g. 2027"
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">CPI / %</label>
                          <input
                            type="text"
                            value={edu.gpa || ''}
                            onChange={(e) => {
                              const updated = [...activeResume.education];
                              updated[index].gpa = e.target.value;
                              setActiveResume({ ...activeResume, education: updated });
                            }}
                            placeholder="e.g. 8.52/10 or 96%"
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Degree / Certificate</label>
                          <input
                            type="text"
                            value={edu.degree || ''}
                            onChange={(e) => {
                              const updated = [...activeResume.education];
                              updated[index].degree = e.target.value;
                              setActiveResume({ ...activeResume, education: updated });
                            }}
                            placeholder="e.g. B. Tech, CSE [AI/ML] or Intermediate"
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Institute / College</label>
                          <input
                            type="text"
                            value={edu.institution || ''}
                            onChange={(e) => {
                              const updated = [...activeResume.education];
                              updated[index].institution = e.target.value;
                              setActiveResume({ ...activeResume, education: updated });
                            }}
                            placeholder="e.g. MVGR College, Vizianagaram"
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Key Projects */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Key Projects ({activeResume?.projects?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeResume.projects || [];
                      setActiveResume({
                        ...activeResume,
                        projects: [...current, {
                          title: '',
                          technologies: '',
                          link: '',
                          description: ''
                        }]
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md hover:bg-slate-800"
                  >
                    <Plus className="w-3 h-3" /> Add Project
                  </button>
                </div>

                <div className="space-y-4">
                  {(activeResume?.projects || []).map((proj, index) => (
                    <div key={index} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {proj.title || 'New Project'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = activeResume.projects.filter((_, i) => i !== index);
                            setActiveResume({ ...activeResume, projects: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 text-xs p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={proj.title || ''}
                          onChange={(e) => {
                            const updated = [...activeResume.projects];
                            updated[index].title = e.target.value;
                            setActiveResume({ ...activeResume, projects: updated });
                          }}
                          placeholder="Project Title (e.g. Credit Risk Modeling)"
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold"
                        />
                        <input
                          type="text"
                          value={proj.technologies || ''}
                          onChange={(e) => {
                            const updated = [...activeResume.projects];
                            updated[index].technologies = e.target.value;
                            setActiveResume({ ...activeResume, projects: updated });
                          }}
                          placeholder="Tech Stack: Python, Scikit-learn, Streamlit..."
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="relative">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                          <input
                            type="text"
                            value={proj.live_link !== undefined ? proj.live_link : ((proj.link && !proj.link.includes('github.com')) ? proj.link : '')}
                            onChange={(e) => {
                              const updated = [...activeResume.projects];
                              updated[index] = {
                                ...updated[index],
                                live_link: e.target.value,
                                link: e.target.value || updated[index].github_link || ''
                              };
                              setActiveResume({ ...activeResume, projects: updated });
                            }}
                            placeholder="Live Demo URL (e.g. https://demo.app)"
                            className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>

                        <div className="relative">
                          <Github className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                          <input
                            type="text"
                            value={proj.github_link !== undefined ? proj.github_link : ((proj.link && proj.link.includes('github.com')) ? proj.link : '')}
                            onChange={(e) => {
                              const updated = [...activeResume.projects];
                              updated[index] = {
                                ...updated[index],
                                github_link: e.target.value,
                                link: updated[index].live_link || e.target.value || ''
                              };
                              setActiveResume({ ...activeResume, projects: updated });
                            }}
                            placeholder="GitHub Repo URL (e.g. https://github.com/...)"
                            className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-600">Bullet Points</label>
                          <button
                            type="button"
                            onClick={() => openAIEnhancer('project', proj.description, (enhanced) => {
                              const updated = [...activeResume.projects];
                              updated[index].description = enhanced;
                              setActiveResume({ ...activeResume, projects: updated });
                            })}
                            className="text-[10px] font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5" /> AI Enhance Bullets
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={proj.description || ''}
                          onChange={(e) => {
                            const updated = [...activeResume.projects];
                            updated[index].description = e.target.value;
                            setActiveResume({ ...activeResume, projects: updated });
                          }}
                          placeholder="• Attained 89% accuracy on loan default prediction dataset...\n• Applied SMOTE to balance dataset..."
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs leading-relaxed font-serif"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Experience */}
            {activeTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Experience & Virtual Internships ({activeResume?.experience?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeResume.experience || [];
                      setActiveResume({
                        ...activeResume,
                        experience: [...current, {
                          company: 'AICTE – EduSkills (Google)',
                          role: 'AI-ML Virtual Internship',
                          location: '',
                          start_date: 'Oct 2025',
                          end_date: 'Dec 2025',
                          is_current: false,
                          description: ''
                        }]
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md hover:bg-slate-800"
                  >
                    <Plus className="w-3 h-3" /> Add Experience
                  </button>
                </div>

                <div className="space-y-4">
                  {(activeResume?.experience || []).map((exp, index) => (
                    <div key={index} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {exp.role || 'Role'} {exp.company && `— ${exp.company}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = activeResume.experience.filter((_, i) => i !== index);
                            setActiveResume({ ...activeResume, experience: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 text-xs p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.role || ''}
                          onChange={(e) => {
                            const updated = [...activeResume.experience];
                            updated[index].role = e.target.value;
                            setActiveResume({ ...activeResume, experience: updated });
                          }}
                          placeholder="Role (e.g. AI-ML Virtual Internship)"
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-bold"
                        />
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={(e) => {
                            const updated = [...activeResume.experience];
                            updated[index].company = e.target.value;
                            setActiveResume({ ...activeResume, experience: updated });
                          }}
                          placeholder="Organization (e.g. AICTE – EduSkills (Google))"
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                        <input
                          type="text"
                          value={exp.start_date || ''}
                          onChange={(e) => {
                            const updated = [...activeResume.experience];
                            updated[index].start_date = e.target.value;
                            setActiveResume({ ...activeResume, experience: updated });
                          }}
                          placeholder="Start Date (e.g. Oct 2025)"
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                        <input
                          type="text"
                          value={exp.end_date || ''}
                          onChange={(e) => {
                            const updated = [...activeResume.experience];
                            updated[index].end_date = e.target.value;
                            setActiveResume({ ...activeResume, experience: updated });
                          }}
                          placeholder="End Date (e.g. Dec 2025)"
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-600">Bullet Points</label>
                          <button
                            type="button"
                            onClick={() => openAIEnhancer('experience', exp.description, (enhanced) => {
                              const updated = [...activeResume.experience];
                              updated[index].description = enhanced;
                              setActiveResume({ ...activeResume, experience: updated });
                            })}
                            className="text-[10px] font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5" /> AI Enhance Bullets
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={exp.description || ''}
                          onChange={(e) => {
                            const updated = [...activeResume.experience];
                            updated[index].description = e.target.value;
                            setActiveResume({ ...activeResume, experience: updated });
                          }}
                          placeholder="• Implemented ML workflows improving model understanding efficiency by 25%..."
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs leading-relaxed font-serif"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Skills & Technologies */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Categorized Skills & Technologies ({activeResume?.skills?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeResume.skills || [];
                      setActiveResume({
                        ...activeResume,
                        skills: [...current, { skill_name: '', category: 'Programming Languages' }]
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md hover:bg-slate-800"
                  >
                    <Plus className="w-3 h-3" /> Add Skill
                  </button>
                </div>

                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {(activeResume?.skills || []).map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <input
                        type="text"
                        value={skill.skill_name || ''}
                        onChange={(e) => {
                          const updated = [...activeResume.skills];
                          updated[index].skill_name = e.target.value;
                          setActiveResume({ ...activeResume, skills: updated });
                        }}
                        placeholder="Skill Name (e.g. Python, RAG, PyTorch)"
                        className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-900 font-medium focus:outline-none"
                      />
                      <input
                        type="text"
                        value={skill.category || 'Programming Languages'}
                        onChange={(e) => {
                          const updated = [...activeResume.skills];
                          updated[index].category = e.target.value;
                          setActiveResume({ ...activeResume, skills: updated });
                        }}
                        placeholder="Category (e.g. Machine Learning, Tools)"
                        className="w-44 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = activeResume.skills.filter((_, i) => i !== index);
                          setActiveResume({ ...activeResume, skills: updated });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Achievements */}
            {activeTab === 'achievements' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Achievements & Honors ({activeResume?.achievements?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeResume.achievements || [];
                      setActiveResume({
                        ...activeResume,
                        achievements: [...current, { title: '', description: '' }]
                      });
                    }}
                    className="text-[11px] text-slate-900 font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Achievement
                  </button>
                </div>
                {(activeResume?.achievements || []).map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <textarea
                      rows={2}
                      value={a.description || a.title || ''}
                      onChange={(e) => {
                        const updated = [...activeResume.achievements];
                        updated[i].description = e.target.value;
                        updated[i].title = e.target.value.slice(0, 50);
                        setActiveResume({ ...activeResume, achievements: updated });
                      }}
                      placeholder="• Secured a position among the Top 25 teams in HackerRank Hackathon..."
                      className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs leading-relaxed"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = activeResume.achievements.filter((_, idx) => idx !== i);
                        setActiveResume({ ...activeResume, achievements: updated });
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Next Step Action Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-xs border border-slate-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Ready for ATS Matching & Optimization?</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Proceed to ATS Optimization to compare this resume with job openings and get tailored bullet recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={handleNextToATSOptimization}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all whitespace-nowrap cursor-pointer"
              id="btn-editor-next-ats"
            >
              <span>Next: ATS Optimization</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
        )}

        {/* Right Column: Live ATS Preview */}
        {viewMode !== 'editor' && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7 xl:col-span-7' : 'w-full max-w-6xl mx-auto'} ${previewTab || viewMode === 'full_preview' ? 'block' : 'hidden lg:block'}`}>
            {viewMode === 'full_preview' && (
              <div className="flex items-center justify-between p-3 mb-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="font-bold">Full Resume View:</span> Complete unclipped A4 document format at true dimensions.
                  </div>
                </div>
                <button
                  onClick={() => setViewMode('split')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition-colors shadow-2xs"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Back to Split View / Edit</span>
                </button>
              </div>
            )}
            <div className={`sticky top-20 ${viewMode === 'full_preview' ? 'h-auto min-h-[calc(100vh-8rem)]' : 'h-[calc(100vh-6.5rem)]'}`}>
              <ResumePreview resume={activeResume} isFullPageMode={viewMode === 'full_preview'} />
            </div>
          </div>
        )}

      </div>

      {/* AI Enhancement Modal */}
      <AIEnhanceModal
        isOpen={aiModal.isOpen}
        onClose={() => setAiModal({ ...aiModal, isOpen: false })}
        sectionType={aiModal.sectionType}
        originalText={aiModal.originalText}
        targetRole={user?.target_role}
        onApply={(enhancedText) => {
          if (aiModal.callback) {
            aiModal.callback(enhancedText);
          }
        }}
      />

      {/* Create New Resume Modal */}
      <CreateResumeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        user={user}
        onSuccess={(created) => {
          setResumes([created, ...resumes.filter(r => r.id !== created.id)]);
          setActiveResume(created);
          setSearchParams({ id: created.id });
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }}
      />

    </div>
  );
};
