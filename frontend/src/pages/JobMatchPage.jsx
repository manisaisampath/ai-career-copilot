import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resumeService, jobService, atsService } from '../api/services';
import { 
  Target, 
  FileText, 
  Upload, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  FileCheck2,
  ChevronDown
} from 'lucide-react';

const STANDARD_JOB_ROLES = [
  {
    title: "Machine Learning Engineer",
    defaultDescription: "We are seeking a Machine Learning Engineer to design, build, and deploy production ML and deep learning models. Requirements: Proficiency in Python, PyTorch or TensorFlow, Scikit-Learn, Pandas, NumPy, NLP, Embeddings, RAG, Docker, FastAPI, and model evaluation metrics."
  },
  {
    title: "Software Engineer",
    defaultDescription: "Looking for a Software Engineer to develop scalable applications and backend services. Requirements: Strong computer science fundamentals, Python, SQL, REST APIs, Git, Unit Testing, System Design, Data Structures, and Algorithms."
  },
  {
    title: "Backend Engineer",
    defaultDescription: "Backend Engineer to build high-throughput APIs, database schemas, and microservices. Requirements: Python, FastAPI or Django, PostgreSQL, Redis caching, Docker, CI/CD pipelines, and cloud deployment."
  },
  {
    title: "Frontend Developer",
    defaultDescription: "Frontend Developer to create responsive, performant user interfaces. Requirements: JavaScript, TypeScript, React.js, Tailwind CSS, HTML5, CSS3, REST API integration, and modern state management."
  },
  {
    title: "Full-Stack Developer",
    defaultDescription: "Full-Stack Developer with expertise across frontend and backend systems. Requirements: React, Node.js or Python, FastAPI, PostgreSQL, MongoDB, Docker, Git, and end-to-end API integration."
  },
  {
    title: "Data Scientist",
    defaultDescription: "Data Scientist to perform statistical analysis, predictive modeling, and data visualization. Requirements: Python, SQL, Scikit-learn, Pandas, NumPy, Data Analysis, Regression, Classification, and Tableau/Matplotlib."
  },
  {
    title: "Data Analyst",
    defaultDescription: "Data Analyst to extract insights, create dashboards, and query large datasets. Requirements: SQL, Python, Excel, PowerBI/Tableau, Data Cleaning, and Statistical Reporting."
  },
  {
    title: "Cloud / DevOps Engineer",
    defaultDescription: "DevOps Engineer to manage cloud infrastructure, automation, and CI/CD pipelines. Requirements: Docker, Kubernetes, AWS or GCP, Terraform, Linux, CI/CD GitHub Actions, and container orchestration."
  },
  {
    title: "AI / NLP Engineer",
    defaultDescription: "AI Engineer specializing in NLP, Large Language Models (LLMs), and RAG systems. Requirements: Python, LangChain, ChromaDB, HuggingFace, Sentence Transformers, Vector Databases, LLaMA/GPT APIs, and model fine-tuning."
  },
  {
    title: "Custom / Other",
    defaultDescription: ""
  }
];

export const JobMatchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryResumeId = searchParams.get('resume_id');
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedRoleOption, setSelectedRoleOption] = useState('Machine Learning Engineer');
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState(STANDARD_JOB_ROLES[0].defaultDescription);

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoadingResumes(true);
        const res = await resumeService.getResumes();
        setResumes(res.data);
        if (res.data.length > 0) {
          if (queryResumeId) {
            const matched = res.data.find(r => String(r.id) === String(queryResumeId));
            setSelectedResumeId(matched ? matched.id : res.data[0].id);
          } else {
            setSelectedResumeId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error("Fetch resumes error:", err);
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchResumes();
  }, [queryResumeId]);

  const handleRoleChange = (e) => {
    const roleTitle = e.target.value;
    setSelectedRoleOption(roleTitle);
    const matched = STANDARD_JOB_ROLES.find(r => r.title === roleTitle);
    if (matched && matched.defaultDescription) {
      setJobDescription(matched.defaultDescription);
    } else if (roleTitle === "Custom / Other") {
      setJobDescription('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const activeTitle = selectedRoleOption === "Custom / Other" ? customJobTitle : selectedRoleOption;
      const res = await jobService.uploadJobFile(file, activeTitle || file.name.split('.')[0], '');
      setJobDescription(res.data.description);
      if (res.data.title && res.data.title !== "Target Job") {
        setCustomJobTitle(res.data.title);
        setSelectedRoleOption("Custom / Other");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to parse job description document.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setError("Please select or upload a resume first.");
      return;
    }

    const finalTitle = selectedRoleOption === "Custom / Other" 
      ? (customJobTitle.trim() || "Software Engineer")
      : selectedRoleOption;

    // If description is empty, use role standard description
    let finalDescription = jobDescription.trim();
    if (!finalDescription) {
      const matched = STANDARD_JOB_ROLES.find(r => r.title === selectedRoleOption);
      finalDescription = matched?.defaultDescription || `Standard requirements and skills for ${finalTitle}.`;
    }

    setAnalyzing(true);
    setError('');
    try {
      const res = await atsService.analyze({
        resume_id: parseInt(selectedResumeId),
        job_title: finalTitle,
        job_company: "",
        job_description_text: finalDescription
      });
      navigate(`/ats-result?id=${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "ATS analysis failed. Please verify input and try again.");
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
          <Target className="w-3.5 h-3.5 text-slate-900" />
          <span>Role Matching Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
          Target Job Description Alignment
        </h1>
        <p className="text-xs text-slate-500">
          Select your target role from the dropdown to run ATS keyword scanning and skill compatibility analysis.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {analyzing ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-800" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Comparing skills and job requirements against your resume...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Running 6-pillar explainable evaluation: parsing taxonomy, computing semantic similarity, and identifying missing technical keywords.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleAnalyze} className="space-y-6">
          
          {/* 1. Resume Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Select Resume to Compare
              </label>
              <button
                type="button"
                onClick={() => navigate('/resume')}
                className="text-[11px] font-semibold text-slate-800 hover:underline inline-flex items-center gap-1"
              >
                <FileText className="w-3 h-3" /> Edit in Resume Builder
              </button>
            </div>

            {loadingResumes ? (
              <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
            ) : resumes.length > 0 ? (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} — {r.full_name || 'Resume'} (Updated: {new Date(r.updated_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>No resume available. Create a resume to begin analysis.</span>
                <button
                  type="button"
                  onClick={() => navigate('/resume')}
                  className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-semibold"
                >
                  Create Resume
                </button>
              </div>
            )}
          </div>

          {/* 2. Target Job Role Dropdown (Description Optional, No Company Name) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Target Job Role
              </label>

              {/* Upload JD File (Optional) */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Parsing...' : 'Upload Specific JD File (Optional)'}</span>
              </button>
            </div>

            {/* Role Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Select Job Title / Target Role *
              </label>
              <select
                value={selectedRoleOption}
                onChange={handleRoleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              >
                {STANDARD_JOB_ROLES.map((role) => (
                  <option key={role.title} value={role.title}>
                    {role.title}
                  </option>
                ))}
              </select>
            </div>

            {/* If Custom Role Selected */}
            {selectedRoleOption === "Custom / Other" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Enter Custom Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={customJobTitle}
                  onChange={(e) => setCustomJobTitle(e.target.value)}
                  placeholder="e.g. AI Research Engineer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>
            )}

            {/* Optional Job Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Job Description / Key Requirements <span className="text-slate-400 font-normal">(Optional — auto-filled with role standards)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {jobDescription ? `${jobDescription.split(/\s+/).filter(Boolean).length} words` : 'Auto-default'}
                </span>
              </div>
              <textarea
                rows={7}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Optional: Paste specific job requirements or leave as default for standard role benchmarking..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={analyzing || !selectedResumeId}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Analyze Resume Against This Job</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>
      )}

    </div>
  );
};
