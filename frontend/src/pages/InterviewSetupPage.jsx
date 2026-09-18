import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resumeService, jobService, interviewService } from '../api/services';
import { 
  MessageSquareCode, 
  Target, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu,
  Layers,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const InterviewSetupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramJobId = searchParams.get('jobId');
  const paramResumeId = searchParams.get('resumeId');

  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  const [selectedResumeId, setSelectedResumeId] = useState(paramResumeId || '');
  const [selectedJobId, setSelectedJobId] = useState(paramJobId || '');
  const [interviewType, setInterviewType] = useState('mixed'); // technical | hr | project_based | mixed
  const [numQuestions, setNumQuestions] = useState(5);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resRes, jobRes] = await Promise.all([
          resumeService.getResumes(),
          jobService.getJobs()
        ]);
        setResumes(resRes.data);
        setJobs(jobRes.data);

        if (resRes.data.length > 0 && !selectedResumeId) {
          setSelectedResumeId(resRes.data[0].id);
        }
        if (jobRes.data.length > 0 && !selectedJobId) {
          setSelectedJobId(jobRes.data[0].id);
        }
      } catch (err) {
        console.error("Setup fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !selectedJobId) {
      setError("Please ensure both a Resume and a Target Job are selected.");
      return;
    }

    setCreating(true);
    setError('');
    try {
      const res = await interviewService.createInterview({
        resume_id: parseInt(selectedResumeId),
        job_description_id: parseInt(selectedJobId),
        type: interviewType,
        num_questions: parseInt(numQuestions)
      });
      navigate(`/interview/session/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate personalized interview.");
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-700" />
        <p className="text-xs text-slate-500 font-medium">Loading interview setup options...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700 mb-1">
          <MessageSquareCode className="w-3.5 h-3.5 text-slate-900" />
          <span>Personalized Interview Simulator</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
          AI Mock Interview Practice
        </h1>
        <p className="text-xs text-slate-500">
          Questions are dynamically generated based on your real resume projects, declared skills, and the target role expectations.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {creating ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-800" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Generating Personalized Interview Questions...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Analyzing your technical projects, architecture trade-offs, and target job skills to create an authentic interview experience.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleStartInterview} className="space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-2xs">
            
            {/* 1. Resume & Job Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  1. Target Resume
                </label>
                {resumes.length > 0 ? (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} — {r.full_name || 'Resume'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-500">No resumes found. Please create one.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  2. Target Job Description
                </label>
                {jobs.length > 0 ? (
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} {j.company ? `(${j.company})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-500">No jobs saved. Please match a job first.</p>
                )}
              </div>
            </div>

            {/* 2. Track / Interview Type */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Interview Track
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'mixed',
                    title: 'Mixed Comprehensive (Recommended)',
                    desc: 'Combines project deep-dive, core technical concepts, and engineering problem-solving.'
                  },
                  {
                    id: 'project_based',
                    title: 'Project Architecture & Deep-Dive',
                    desc: 'Focuses deeply on your listed projects, technical trade-offs, and implementations.'
                  },
                  {
                    id: 'technical',
                    title: 'Technical Fundamentals & Systems',
                    desc: 'Tests algorithms, memory models, database indexing, and backend architectures.'
                  },
                  {
                    id: 'hr',
                    title: 'Behavioral & Leadership (STAR)',
                    desc: 'Assesses teamwork, technical compromises, conflict resolution, and communication.'
                  }
                ].map((track) => (
                  <label
                    key={track.id}
                    className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      interviewType === track.id
                        ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{track.title}</span>
                      <input
                        type="radio"
                        name="interviewType"
                        value={track.id}
                        checked={interviewType === track.id}
                        onChange={() => setInterviewType(track.id)}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {track.desc}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Number of Questions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700">Session Length</span>
              <div className="flex items-center gap-2">
                {[3, 5, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumQuestions(num)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      numQuestions === num
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={creating || !selectedResumeId || !selectedJobId}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Launch Mock Interview Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>
      )}

    </div>
  );
};
