import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { atsService, resumeService } from '../api/services';
import { 
  ScoreBadge 
} from '../components/common/ScoreBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Tag, 
  Sparkles, 
  ArrowRight, 
  MessageSquareCode, 
  ShieldCheck, 
  FileText,
  Layers,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export const ATSResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const analysisId = searchParams.get('id');

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        let res;
        if (analysisId) {
          res = await atsService.getAnalysis(analysisId);
        } else {
          // If no ID passed in query params, fetch latest for primary resume
          const resumeRes = await resumeService.getResumes();
          if (resumeRes.data.length > 0) {
            const latest = await atsService.getLatestForResume(resumeRes.data[0].id);
            res = latest;
          }
        }
        if (res?.data) {
          setAnalysis(res.data);
        } else {
          setError("No ATS analysis found. Match your resume against a job description first.");
        }
      } catch (err) {
        console.error("ATS load error:", err);
        setError("Failed to load ATS analysis results.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-700" />
        <p className="text-xs text-slate-500 font-medium">Calculating explainable ATS compatibility breakdown...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-4">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">No Analysis Available</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error || "Please run an ATS scan against a target job posting."}</p>
        <Link
          to="/job-match"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
        >
          <span>Match a Job Description</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header & Target Role Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
              ATS Compatibility Analysis
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Role Target: <span className="font-semibold text-slate-800">{analysis.job_title || 'Software Engineer'}</span>
            {analysis.job_company && ` at ${analysis.job_company}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/resume-optimize?id=${analysis.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Improve My Resume</span>
          </Link>

          <Link
            to={`/interview?jobId=${analysis.job_description_id}&resumeId=${analysis.resume_id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-slate-600" />
            <span>Mock Interview</span>
          </Link>
        </div>
      </div>

      {/* Top ATS Score Hero Banner */}
      <ScoreBadge
        score={analysis.overall_score}
        matchLevel={analysis.match_level}
        size="lg"
        subtitle={`Your resume achieves an estimated ${Math.round(analysis.overall_score)}/100 alignment with the ${analysis.job_title} requirements.`}
      />

      {/* 6-Pillar Explainable Weight Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Explainable Component Breakdown (100% Total)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Weighted Algorithm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ProgressBar
            label="Skills Match"
            score={analysis.skills_score}
            weight="30"
            description="Normalized overlap of required technical skills."
          />
          <ProgressBar
            label="Job-Specific Keywords"
            score={analysis.keyword_score}
            weight="25"
            description="Frequency and presence of target domain terms."
          />
          <ProgressBar
            label="Experience Match"
            score={analysis.experience_score}
            weight="15"
            description="Relevance of past roles & production evidence."
          />
          <ProgressBar
            label="Education Match"
            score={analysis.education_score}
            weight="10"
            description="Academic degree and discipline alignment."
          />
          <ProgressBar
            label="Semantic Similarity"
            score={analysis.semantic_score}
            weight="10"
            description="Contextual alignment of project architectures."
          />
          <ProgressBar
            label="Resume Structure"
            score={analysis.structure_score}
            weight="10"
            description="ATS parsing layout and bullet formatting."
          />
        </div>
      </div>

      {/* Two Column Grid: "What's Working" vs "What Needs Attention" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* What's Working */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>What's Working</span>
          </div>

          <div className="space-y-2.5">
            {analysis.working_points?.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg">
                <span className="text-emerald-700 font-bold select-none text-xs">✓</span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {pt}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* What Needs Attention */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>What Needs Attention</span>
          </div>

          <div className="space-y-2.5">
            {analysis.attention_points?.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 bg-amber-50/40 border border-amber-100 rounded-lg">
                <span className="text-amber-700 font-bold select-none text-xs">⚠</span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {pt}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* General Resume Improvement Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              General Recommendations to Improve Your Resume
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Core enhancements hiring managers and top ATS parsers prioritize
            </p>
          </div>
          <Link
            to={`/resume-optimize?id=${analysis.id}`}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <span>Apply 1-Click Suggestions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Recommendation 1: Numbers & Percentages (Google XYZ Formula) */}
          <div className="p-4 bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono text-xs">
                  %
                </div>
                <span>1. Keep More Numbers & Percentages</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                High Impact
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Recruiters and algorithmic screeners favor quantified outcomes over passive task lists. Adopt Google's proven <span className="font-semibold text-slate-900">XYZ Formula</span>: <em>Accomplished [X] measured by [Y], by doing [Z]</em>.
            </p>
            <div className="p-2.5 bg-white border border-emerald-200 rounded-lg text-[11px] space-y-1 font-mono">
              <div className="text-rose-700 flex items-start gap-1">
                <span className="font-bold select-none">✕ Before:</span>
                <span className="font-sans">"Built machine learning model for predictions"</span>
              </div>
              <div className="text-emerald-800 flex items-start gap-1 font-medium">
                <span className="font-bold select-none">✓ After:</span>
                <span className="font-sans">"Trained ML models across 25K+ samples, achieving 92.4% accuracy & cutting inference latency by 35%"</span>
              </div>
            </div>
          </div>

          {/* Recommendation 2: High-Impact Professional Action Verbs */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span>2. Keep More Professional Action Words</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                Leadership
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Replace passive words like <em>"worked on"</em> or <em>"responsible for"</em> with assertive engineering verbs that project ownership, seniority, and technical leadership.
            </p>
            <div className="p-2.5 bg-white border border-indigo-200 rounded-lg text-[11px] space-y-1 font-mono">
              <div className="text-rose-700 flex items-start gap-1">
                <span className="font-bold select-none">✕ Passive:</span>
                <span className="font-sans">"Worked on backend APIs and helped team with Docker"</span>
              </div>
              <div className="text-indigo-900 flex items-start gap-1 font-medium">
                <span className="font-bold select-none">✓ Executive:</span>
                <span className="font-sans">"Architected RESTful endpoints and containerized services via Docker, boosting reliability to 99.9%"</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Important Keywords: Matched vs Missing */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-600" />
            Important Role Keywords
          </h3>
          <span className="text-[11px] text-slate-400">Extracted from Job Description</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Matched Keywords */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Matched in Resume ({analysis.matched_keywords?.length || 0})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysis.matched_keywords?.map((kw, i) => (
                <span 
                  key={i} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{kw}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Missing Keywords */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Missing from Resume ({analysis.missing_keywords?.length || 0})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {analysis.missing_keywords?.map((kw, i) => (
                <span 
                  key={i} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-xs font-medium"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>{kw}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skill Alignment Table with Ethics Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Required Skill Alignment
            </h3>
            <p className="text-[11px] text-slate-500">
              Comparison of job requirements against candidate technical skills.
            </p>
          </div>

          {/* Mandatory AI Ethical Disclaimer */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-[11px] text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
            <span>Only include skills you genuinely have or can demonstrate.</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {analysis.skill_alignment?.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                item.matched 
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="truncate">
                <span className="text-xs font-semibold block truncate">{item.skill}</span>
                <span className="text-[10px] text-slate-500">{item.category}</span>
              </div>
              <span className={`text-xs font-bold shrink-0 ${item.matched ? 'text-emerald-700' : 'text-amber-600'}`}>
                {item.matched ? '✓ Matched' : '⚠ Missing'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="text-xs text-slate-600">
          Ready to close the missing skill gaps and raise your ATS compatibility score?
        </div>

        <Link
          to={`/resume-optimize?id=${analysis.id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
        >
          <span>Open Resume Optimization Center</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
};
