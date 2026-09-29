// ============================================
// Resume Manager Page
// ============================================
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeAPI } from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/skeletons/Skeletons';
import { FileText, Upload, Trash2, ExternalLink, File, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/constants';
import toast from 'react-hot-toast';

export default function ResumeManager() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const fileRef = useRef();

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await resumeAPI.getAll();
      setResumes(data.data);
    } catch (error) {
      toast.error('Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error('Please select a PDF file');
    if (file.type !== 'application/pdf') return toast.error('Only PDF files allowed');
    if (file.size > 5 * 1024 * 1024) return toast.error('File too large (max 5MB)');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('name', name || file.name.replace('.pdf', ''));
    if (targetCompany) formData.append('target_company', targetCompany);

    setUploading(true);
    try {
      await resumeAPI.upload(formData);
      toast.success('Resume uploaded!');
      setName('');
      setTargetCompany('');
      fileRef.current.value = '';
      fetchResumes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await resumeAPI.delete(id);
      toast.success('Resume deleted');
      fetchResumes();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-200">Resume Manager</h1>
        <p className="text-surface-200/50 mt-1">Upload and manage multiple versions of your resume.</p>
      </div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
          <Upload size={20} className="text-primary-400" /> Upload New Resume
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            className="input-field"
            placeholder="Resume name (e.g., SDE Resume)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Target company (optional)"
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
          />
          <input
            type="file"
            ref={fileRef}
            accept=".pdf"
            className="input-field file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary-500/20 file:text-primary-400 file:text-sm file:font-medium"
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary mt-4"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {uploading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </motion.div>

      {/* Resume List */}
      {resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes uploaded"
          description="Upload your first resume to start linking it with applications."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {resumes.map((resume, i) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/15 flex items-center justify-center flex-shrink-0">
                    <File size={24} className="text-primary-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-surface-200 truncate">{resume.name}</h3>
                    {resume.target_company && (
                      <p className="text-xs text-surface-200/50 mt-1">Target: {resume.target_company}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-surface-200/50 flex-1">
                  <p>Version: <span className="text-surface-200">v{resume.version}</span></p>
                  <p>Size: <span className="text-surface-200">{(resume.file_size / 1024).toFixed(1)} KB</span></p>
                  <p>Uploaded: <span className="text-surface-200">{formatDate(resume.created_at)}</span></p>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                  <a
                    href={resume.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary flex-1 py-2 text-sm"
                  >
                    <ExternalLink size={16} /> View
                  </a>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="btn-danger py-2 text-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
