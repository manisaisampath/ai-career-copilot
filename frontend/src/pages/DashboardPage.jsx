import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { careerService } from '../api/services';
import { 
  FileText, 
  Target, 
  MessageSquareCode, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  FilePlus
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { ScoreBadge } from '../components/common/ScoreBadge';
import { CreateResumeModal } from '../components/resume/CreateResumeModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await careerService.getDashboard();
        setData(res.data);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-36 bg-slate-200 rounded-xl"></div>
          <div className="h-36 bg-slate-200 rounded-xl"></div>
          <div className="h-36 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const greeting = `${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
            {greeting}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Here's where you stand for your target role: <span className="font-semibold text-slate-700">{user?.target_role || 'Software Engineer'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-xs"
            id="btn-dashboard-create-resume"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Create New Resume</span>
          </button>

          <Link
            to="/job-match"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
          >
            <Target className="w-3.5 h-3.5 text-slate-600" />
            <span>Match New Job</span>
          </Link>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Active Resume */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Active Resume</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>

            {data?.has_resume ? (
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {data.resume_title}
                </h3>
                <p className="text-xs text-slate-500">
                  Last updated: {data.resume_last_updated ? new Date(data.resume_last_updated).toLocaleDateString() : 'Today'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-xs text-slate-500 mb-2">No resume created yet.</p>
                <button 
                  onClick={() => setShowCreateModal(true)} 
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Create or Upload Resume
                </button>
              </div>
            )}
          </div>

          {data?.has_resume && (
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <Link 
                to="/resume" 
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950"
              >
                <span>Edit in Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3 h-3" />
                <span>New Resume</span>
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Latest ATS Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">ATS Compatibility</span>
              <Target className="w-4 h-4 text-slate-400" />
            </div>

            {data?.has_ats_analysis ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-950">
                    {Math.round(data.latest_ats_score)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ 100</span>
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    {data.latest_match_level}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  For: {data.latest_job_title} {data.latest_job_company ? `(${data.latest_job_company})` : ''}
                </p>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-xs text-slate-500 mb-2">No job analyzed yet.</p>
                <Link 
                  to="/job-match" 
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Analyze First Job
                </Link>
              </div>
            )}
          </div>

          {data?.has_ats_analysis && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link 
                to="/ats-result" 
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950"
              >
                <span>View Full Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Card 3: Interview Readiness */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Interview Readiness</span>
              <MessageSquareCode className="w-4 h-4 text-slate-400" />
            </div>

            {data?.has_interview ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-950">
                    {Math.round(data.latest_interview_score)}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Quality Score</span>
                </div>
                <p className="text-xs text-slate-500">
                  Based on project and technical responses.
                </p>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-xs text-slate-500 mb-2">Practice personalized Q&A.</p>
                <Link 
                  to="/interview" 
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
                >
                  <MessageSquareCode className="w-3.5 h-3.5" /> Start Mock Interview
                </Link>
              </div>
            )}
          </div>

          {data?.has_interview && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link 
                to="/interview" 
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-950"
              >
                <span>Practice Next Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Recommended Next Action Banner */}
      <div className="p-5 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Recommended Next Step
            </span>
          </div>
          <p className="text-sm font-medium text-slate-100 max-w-2xl">
            {data?.recommended_next_step}
          </p>
        </div>

        <Link
          to={!data?.has_resume ? "/resume" : (!data?.has_ats_analysis ? "/job-match" : "/ats-result")}
          className="shrink-0 px-4 py-2 bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          Take Action
        </Link>
      </div>

      {/* Two Column Section: Priority Focus Areas & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Priority Focus Areas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            Target Profile Focus Areas
          </h3>

          <div className="space-y-2.5">
            {data?.top_focus_areas?.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            Recent Preparation Activity
          </h3>

          {data?.recent_activities && data.recent_activities.length > 0 ? (
            <div className="space-y-3">
              {data.recent_activities.map((act) => (
                <div key={act.id} className="flex items-start justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-900">{act.title}</p>
                    <p className="text-[11px] text-slate-500">{act.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No recent activity recorded yet.
            </div>
          )}
        </div>

      </div>

      <CreateResumeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        user={user}
        onSuccess={(created) => {
          navigate(`/resume?id=${created.id}`);
        }}
      />

    </div>
  );
};
