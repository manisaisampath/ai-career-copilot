import { resumeService } from '../api/services';

/**
 * Downloads a resume PDF using authenticated blob fetch with direct download anchor,
 * falling back to authenticated direct URL popup if needed.
 */
export async function downloadResumePdf(resume, setDownloadingState = null) {
  if (!resume || !resume.id) {
    alert('No resume selected to download.');
    return false;
  }

  if (typeof setDownloadingState === 'function') {
    setDownloadingState(true);
  }

  try {
    const response = await resumeService.downloadPDF(resume.id);
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const candidateName = (resume.full_name || resume.title || 'Resume')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    link.setAttribute('download', `${candidateName}_ATS_Resume.pdf`);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 2000);
    
    return true;
  } catch (error) {
    console.warn('Authenticated blob download failed, falling back to authenticated direct URL:', error);
    try {
      const fallbackUrl = resumeService.downloadPDFUrl(resume.id);
      window.open(fallbackUrl, '_blank');
      return true;
    } catch (fallbackError) {
      console.error('All download mechanisms failed:', fallbackError);
      alert('Failed to download resume PDF. Please check your connection and try again.');
      return false;
    }
  } finally {
    if (typeof setDownloadingState === 'function') {
      setDownloadingState(false);
    }
  }
}
