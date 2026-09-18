import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Target, 
  Sparkles, 
  MessageSquareCode, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  Cpu,
  Layers,
  BarChart3
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const workflowSteps = [
    {
      num: "01",
      title: "Create",
      subtitle: "Build or upload your resume.",
      desc: "Use an ATS-compliant structure designed for maximum parsing accuracy across standard recruiting software.",
      icon: FileText
    },
    {
      num: "02",
      title: "Match",
      subtitle: "Compare it with a real job description.",
      desc: "Extract required technical skills, keyword frequency, and semantic expectations from target postings.",
      icon: Target
    },
    {
      num: "03",
      title: "Improve",
      subtitle: "Find gaps and optimize your resume.",
      desc: "Receive explainable scoring across 6 pillars with strictly grounded phrasing improvements.",
      icon: Sparkles
    },
    {
      num: "04",
      title: "Prepare",
      subtitle: "Practice a personalized AI interview.",
      desc: "Answer dynamic technical and behavioral questions generated directly from your projects and skills.",
      icon: MessageSquareCode
    }
  ];

  return (
    <div className="space-y-16 py-6 sm:py-12">
      
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-4">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
          <span>Connected Career Preparation Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
          Your resume is more than a document.
          <span className="block text-slate-600 font-normal mt-2 text-3xl sm:text-4xl lg:text-5xl">
            It's your first step toward the right opportunity.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
          Create an ATS-friendly resume, understand how well it matches your target role, improve it with personalized suggestions, and prepare for interviews using your own resume.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to={isAuthenticated ? "/resume" : "/register"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-sm"
          >
            <span>Build My Resume</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to={isAuthenticated ? "/job-match" : "/login"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all"
          >
            <span>Analyze a Resume</span>
          </Link>
        </div>

      </section>

      {/* 4-Step Visual Workflow Section */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            The Connected Workflow
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            One unified loop from resume creation to interview success
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.num}
                className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono text-slate-300">
                      {step.num}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {step.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Role-specific feedback</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Explainable Architecture Pillar Summary */}
      <section className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-900" />
            <h3 className="text-lg font-bold text-slate-900">
              Explainable 6-Pillar ATS Scoring Model
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike opaque systems that assign arbitrary numbers, our scoring engine provides transparent attribution across the core criteria hiring systems evaluate:
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {[
              { label: "Skills Alignment", weight: "30%" },
              { label: "Target Keywords", weight: "25%" },
              { label: "Experience Context", weight: "15%" },
              { label: "Education Match", weight: "10%" },
              { label: "Semantic Similarity", weight: "10%" },
              { label: "Resume Structure", weight: "10%" },
            ].map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="text-xs font-bold text-slate-900">{p.label}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{p.weight} weight</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
