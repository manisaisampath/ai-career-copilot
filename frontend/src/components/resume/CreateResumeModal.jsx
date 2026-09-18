import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { resumeService } from '../../api/services';
import { 
  FilePlus, 
  Upload, 
  Check, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';

export const CreateResumeModal = ({ isOpen, onClose, onSuccess, user }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('blank'); // 'blank' | 'upload'
  const [title, setTitle] = useState('Software Engineer Resume');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const blankPayload = {
    title: title.trim() || "Untitled Resume",
    template: "modern",
    full_name: user?.name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    summary: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    languages: []
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      // Autocomplete title based on file name without extension
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      if (!title || title === 'Software Engineer Resume') {
        setTitle(baseName);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let createdResume = null;

      if (mode === 'upload') {
        if (!selectedFile) {
          setError('Please select a resume file (PDF or DOCX) to upload.');
          setLoading(false);
          return;
        }
        const res = await resumeService.uploadResume(selectedFile);
        createdResume = res.data;
      } else {
        const payload = {
          ...blankPayload,
          title: title.trim() || "Untitled Resume"
        };
        const res = await resumeService.createResume(payload);
        createdResume = res.data;
      }

      if (createdResume) {
        if (onSuccess) {
          onSuccess(createdResume);
        } else {
          navigate(`/resume?id=${createdResume.id}`);
        }
        onClose();
      }
    } catch (err) {
      console.error("Failed to create resume:", err);
      setError(err.response?.data?.detail || "Failed to create resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Resume"
      subtitle="Start fresh with a blank canvas or upload an existing file"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Creation Method Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Blank Option */}
          <button
            type="button"
            onClick={() => setMode('blank')}
            className={`p-3.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
              mode === 'blank'
                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-2.5">
                <FilePlus className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900">Blank Resume</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Clean blank slate to enter your details from scratch.
              </p>
            </div>
            {mode === 'blank' && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-900 mt-3">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Selected</span>
              </div>
            )}
          </button>

          {/* Upload Option */}
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`p-3.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
              mode === 'upload'
                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900">Upload File</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Auto-parse PDF or DOCX using our NLP parser.
              </p>
            </div>
            {mode === 'upload' && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-900 mt-3">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Selected</span>
              </div>
            )}
          </button>

        </div>

        {/* Input: Resume Title (for Template and Blank modes) */}
        {mode !== 'upload' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Resume Title / Target Profile
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer, Machine Learning Lead, Backend Specialist"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
              required
            />
            <p className="text-[11px] text-slate-500">
              Name this resume version so you can tailor and distinguish it across job applications.
            </p>
          </div>
        )}

        {/* Upload Dropzone / File Picker (for Upload mode) */}
        {mode === 'upload' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Select Resume Document (.PDF, .DOCX)
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <Upload className="w-7 h-7 mx-auto text-slate-400 mb-2" />
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a different file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Click to browse or drag & drop</p>
                  <p className="text-[11px] text-slate-500">Supports PDF, DOCX (Max 10MB)</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || (mode === 'upload' && !selectedFile)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{mode === 'upload' ? 'Parsing Document...' : 'Creating Resume...'}</span>
              </>
            ) : (
              <>
                <FilePlus className="w-3.5 h-3.5" />
                <span>{mode === 'upload' ? 'Upload & Parse Resume' : 'Create Resume'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
};
