import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { careerService } from '../api/services';
import { 
  TrendingUp, 
  Target, 
  Sparkles, 
  MessageSquareCode, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass
} from 'lucide-react';
import { ProgressBar } from '../components/common/ProgressBar';

export const CareerInsightsPage = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCareerData = async () => {
      try {
        setLoading(true);
        const [insRes, dashRes] = await Promise.all([
          careerService.getInsights(),
          careerService.getDashboard()
        ]);
        setInsights(insRes.data);
        setDashboard(dashRes.data);
      } catch (err) {
        console.error("Career insights error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCareerData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-700" />
        <p className="text-xs text-slate-500 font-medium">Aggregating career trajectory insights...</p>
      </div>
    );
  }

  const resumeScore = dashboard?.latest_ats_score || insights?.resume_alignment || 0;
  const interviewScore = dashboard?.latest_interview_score || insights?.interview_readiness || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700 mb-1">
          <Compass className="w-3.5 h-3.5 text-slate-900" />
          <span>Holistic Readiness & Guidance</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
          Career Insights & Action Plan
        </h1>
        <p className="text-xs text-slate-500">
          Synthesizing your ATS keyword compatibility, technical project evidence, and mock interview communication.
        </p>
      </div>

      {/* Holistic Career Readiness Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Resume Alignment Pillar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-700" />
              Resume ATS Alignment
            </span>
            <span className="text-2xl font-extrabold text-slate-950">
              {Math.round(resumeScore)}%
            </span>
          </div>
          
          <ProgressBar
            label="Document Qualification Alignment"
            score={resumeScore}
            description="Matches job keywords, skills taxonomy, and ATS formatting standards."
          />

          <div className="pt-2">
            <Link
              to="/job-match"
              className="text-xs font-semibold text-slate-800 hover:text-slate-950 inline-flex items-center gap-1"
            >
              <span>Scan another job opening</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mock Interview Readiness Pillar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquareCode className="w-4 h-4 text-slate-700" />
              Interview Verbal Readiness
            </span>
            <span className="text-2xl font-extrabold text-slate-950">
              {interviewScore ? `${Math.round(interviewScore)}%` : 'Not tested'}
            </span>
          </div>
          
          <ProgressBar
            label="Verbal Technical Articulation"
            score={interviewScore || 40}
            description="Measures technical depth, relevance, completeness, and clarity."
          />

          <div className="pt-2">
            <Link
              to="/interview"
              className="text-xs font-semibold text-slate-800 hover:text-slate-950 inline-flex items-center gap-1"
            >
              <span>Practice next interview session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Recommended Roadmap Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-900" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Personalized Priority Focus Areas
          </h3>
        </div>

        <div className="space-y-3">
          {insights?.top_improvements?.map((area, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{area}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Build concrete project implementation evidence and practice verbal trade-off explanations.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Next Step Banner */}
      <div className="p-5 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recommended Action
          </span>
          <p className="text-xs sm:text-sm font-medium text-slate-100 max-w-2xl">
            {insights?.recommended_step || dashboard?.recommended_next_step}
          </p>
        </div>

        <Link
          to="/resume"
          className="shrink-0 px-4 py-2 bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          Open Resume Builder
        </Link>
      </div>

      {/* Ethical Reality Disclaimer */}
      <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-slate-800" />
          <span>Ethical AI & Career Notice</span>
        </div>
        <p className="max-w-xl mx-auto text-[11px] text-slate-500 leading-normal">
          AI Career Copilot provides structured preparation, syntax optimization, and practice feedback. We do not guarantee recruitment outcomes or encourage embellishment of unverified credentials.
        </p>
      </div>

    </div>
  );
};
