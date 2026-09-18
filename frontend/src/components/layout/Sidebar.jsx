import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Sparkles, 
  Target, 
  MessageSquareCode, 
  TrendingUp,
  FileCheck2,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Resume Builder', to: '/resume', icon: FileText },
  { name: 'Job Match', to: '/job-match', icon: Target },
  { name: 'ATS Analysis', to: '/ats-result', icon: FileCheck2 },
  { name: 'Mock Interview', to: '/interview', icon: MessageSquareCode },
  { name: 'Career Insights', to: '/career-insights', icon: TrendingUp },
];

export const Sidebar = ({ isOpen, isCollapsed, onToggleCollapse, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-20 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Floating Expand Tab (Desktop when sidebar is collapsed) */}
      {isCollapsed && (
        <button
          id="btn-slide-open-sidebar"
          onClick={onToggleCollapse}
          className="hidden md:flex fixed left-0 top-20 z-30 items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-xs border border-l-0 border-slate-300 rounded-r-lg shadow-md text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 hover:border-indigo-300 transition-all cursor-pointer group text-xs font-semibold"
          title="Slide Open Navigation (Preparation Workflow)"
        >
          <PanelLeftOpen className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] uppercase tracking-wider text-slate-600 group-hover:text-indigo-600">Workflow</span>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Sidebar container with sliding transition */}
      <aside 
        className={`
          fixed md:sticky top-16 left-0 z-20 h-[calc(100vh-4rem)] bg-white border-r border-slate-200
          flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed 
            ? 'md:w-0 md:min-w-0 md:max-w-0 md:opacity-0 md:-translate-x-4 md:border-r-0 md:pointer-events-none overflow-hidden' 
            : 'md:w-64 md:opacity-100 md:translate-x-0'}
        `}
      >
        <div className="w-64 px-3 py-4 space-y-1">
          {/* Header with Title and Slide Collapse Button */}
          <div className="flex items-center justify-between px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Preparation Workflow</span>
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Slide sidebar away (collapse)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all
                    ${isActive 
                      ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Workflow Guide Card */}
        <div className="w-64 p-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-800 text-xs font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-700" />
              <span>Connected Cycle</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Resume → Match JD → ATS Score → Optimize → Mock Interview → Feedback.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
