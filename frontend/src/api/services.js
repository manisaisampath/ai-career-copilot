import api from './client';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const resumeService = {
  getResumes: () => api.get('/resumes'),
  getResume: (id) => api.get(`/resumes/${id}`),
  createResume: (data) => api.post('/resumes', data),
  updateResume: (id, data) => api.put(`/resumes/${id}`, data),
  deleteResume: (id) => api.delete(`/resumes/${id}`),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  enhanceSection: (data) => api.post('/resumes/enhance', data),
  downloadPDF: (id) => api.get(`/resumes/${id}/pdf`, { responseType: 'blob' }),
  downloadPDFUrl: (id) => {
    const token = localStorage.getItem('token');
    return token ? `/api/resumes/${id}/pdf?token=${encodeURIComponent(token)}` : `/api/resumes/${id}/pdf`;
  },
};

export const jobService = {
  getJobs: () => api.get('/jobs'),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  uploadJobFile: (file, title, company) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/jobs/upload?title=${encodeURIComponent(title)}&company=${encodeURIComponent(company || '')}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const atsService = {
  analyze: (data) => api.post('/ats/analyze', data),
  getAnalysis: (id) => api.get(`/ats/${id}`),
  getLatestForResume: (resumeId) => api.get(`/ats/resume/${resumeId}/latest`),
  applySuggestion: (analysisId, data) => api.post(`/ats/${analysisId}/apply-suggestion`, data),
  undoSuggestion: (analysisId, data) => api.post(`/ats/${analysisId}/undo-suggestion`, data),
};

export const interviewService = {
  createInterview: (data) => api.post('/interviews', data),
  getInterview: (id) => api.get(`/interviews/${id}`),
  submitAnswer: (interviewId, data) => api.post(`/interviews/${interviewId}/answer`, data),
  getReport: (id) => api.get(`/interviews/${id}/report`),
};

export const careerService = {
  getDashboard: () => api.get('/career/dashboard'),
  getInsights: () => api.get('/career/insights'),
};
