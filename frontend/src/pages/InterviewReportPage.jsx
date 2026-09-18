import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { interviewService } from '../api/services';
import { 
  FileCheck2, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  TrendingUp,
  RotateCcw,
  RefreshCw,
  HelpCircle,
  MessageSquareCode
} from 'lucide-react';
import { ProgressBar } from '../components/common/ProgressBar';

export const InterviewReportPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await interviewService.getReport(id);
        setReport(res.data);
      } catch (err) {
        console.error("Report load error:", err);
        setError("Failed to load interview report.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-700" />
        <p className="text-xs text-slate-500 font-medium">Compiling interview readiness evaluation report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <p className="text-xs text-rose-600 font-medium">{error || "Report not found."}</p>
        <Link to="/interview" className="text-xs font-bold text-slate-900 underline">
          Return to Interviews
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700 mb-1">
            <FileCheck2 className="w-3.5 h-3.5 text-slate-900" />
            <span>Interview Performance Report</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
            Mock Interview Evaluation Summary
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role: <span className="font-semibold text-slate-800">{report.job_title}</span> • {report.answered_questions_count} of {report.total_questions_count} questions evaluated
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/interview"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </Link>
          <Link
            to="/career-insights"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all shadow-xs"
          >
            <span>View Career Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Hero Score Banner */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-18 h-18 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-2xl shadow-xs">
            {Math.round(report.overall_score)}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Estimated Interview Readiness Score
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-md">
              {report.summary}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Track</span>
          <p className="text-sm font-bold text-slate-900 uppercase">{report.interview_type}</p>
        </div>
      </div>

      {/* 4 Performance Indicators Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
          Response Quality Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProgressBar
            label="Technical Understanding"
            score={report.technical_score}
            description="Depth of concepts & terminology."
          />
          <ProgressBar
            label="Relevance"
            score={report.relevance_score}
            description="Direct alignment with question."
          />
          <ProgressBar
            label="Completeness"
            score={report.completeness_score}
            description="Coverage of trade-offs & examples."
          />
          <ProgressBar
            label="Clarity & Structure"
            score={report.clarity_score}
            description="Logical flow and concise delivery."
          />
        </div>
      </div>

      {/* Strong Areas vs Areas to Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Strong Areas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Demonstrated Strengths</span>
          </div>

          <div className="space-y-2">
            {report.strong_areas?.map((pt, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-emerald-50/40 border border-emerald-100 rounded-lg">
                <span className="text-emerald-600 font-bold select-none text-xs">✓</span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{pt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Areas to Improve */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Targeted Areas to Improve</span>
          </div>

          <div className="space-y-2">
            {report.improvement_areas?.map((pt, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50/40 border border-amber-100 rounded-lg">
                <span className="text-amber-600 font-bold select-none text-xs">⚠</span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{pt}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recommended Practice Topics */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-900 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4 text-slate-700" />
          <span>Recommended Technical Practice Topics</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {report.recommended_practice?.map((topic, i) => (
            <span 
              key={i} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
              <span>{topic}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Question-by-Question Detailed Evaluations */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Question-by-Question Response Log
        </h3>

        <div className="space-y-4">
          {report.question_evaluations?.map((qEval, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Question {idx + 1} • {qEval.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-950 mt-0.5">{qEval.question}</h4>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-900 rounded font-bold text-xs shrink-0">
                  {Math.round(qEval.score || 0)}/100
                </span>
              </div>

              {/* Candidate Answer */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Your Answer:</span>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{qEval.answer}</p>
              </div>

              {/* AI Feedback */}
              <div className="text-xs text-slate-600 leading-relaxed font-medium">
                <b>Evaluator Feedback:</b> {qEval.feedback}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
