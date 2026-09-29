// ============================================
// Admin Central Applications Management
// ============================================
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, CheckSquare, Building2, User,
  FileText, ExternalLink, X, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  // Preview Resume
  const [previewResumeUrl, setPreviewResumeUrl] = useState(null);

  useEffect(() => {
    fetchInitial();
  }, [page, search, companyId, statusFilter, branchFilter]);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const [appsRes, compRes] = await Promise.all([
        adminAPI.getAllApplications({
          page,
          limit: 15,
          search,
          company_id: companyId,
          status: statusFilter,
          branch: branchFilter
        }),
        adminAPI.getCompanies({ limit: 100 })
      ]);
      setApplications(appsRes.data.data || []);
      setTotalPages(appsRes.data.totalPages || 1);
      setCompanies(compRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await adminAPI.updateApplicationStatus(appId, { status: newStatus });
      setApplications(applications.map(a => a.application_id === appId ? { ...a, status: newStatus } : a));
      toast.success(`Application updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update application status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-[#222] pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Student Placement Applications</h1>
        <p className="text-surface-200/50 text-sm mt-1">
          Review, shortlist, and approve final selections across all campus recruitment drives.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/40" />
            <input
              type="text"
              placeholder="Search candidate, email, or role..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field text-xs pl-9 py-2"
            />
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={companyId}
              onChange={(e) => { setCompanyId(e.target.value); setPage(1); }}
              className="input-field text-xs py-2"
            >
              <option value="all">Company: All Drives</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field text-xs py-2"
            >
              <option value="all">Status: All</option>
              <option value="applied">Applied (New)</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="selected">Selected (Hired)</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
              className="input-field text-xs py-2"
            >
              <option value="all">Department: All</option>
              <option value="Computer Science">Computer Science / IT</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden border border-[#222]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-wider text-surface-200/50 bg-[#141414] border-b border-[#242424] font-semibold">
              <tr>
                <th className="px-4 py-3.5">Candidate</th>
                <th className="px-4 py-3.5">Recruiter Drive</th>
                <th className="px-3 py-3.5">Package</th>
                <th className="px-3 py-3.5 text-center">CGPA</th>
                <th className="px-3 py-3.5">Resume</th>
                <th className="px-3 py-3.5">Applied Date</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">T&P Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-surface-200/50">
                    <Loader2 size={28} className="animate-spin mx-auto text-emerald-500" />
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-surface-200/50">
                    <CheckSquare size={32} className="mb-2 mx-auto opacity-20" />
                    No applications found matching the criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.application_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{app.student_name}</p>
                      <p className="text-xs text-surface-200/50">{app.branch || 'Engineering'} • {app.student_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{app.company_name}</p>
                      <p className="text-xs text-surface-200/50">{app.role}</p>
                    </td>
                    <td className="px-3 py-3 font-semibold text-emerald-400 text-xs">
                      {app.package || 'Competitive'}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-white text-xs">
                      {app.cgpa ? parseFloat(app.cgpa).toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-3 py-3">
                      {app.resume_url ? (
                        <button
                          onClick={() => setPreviewResumeUrl(app.resume_url)}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-white transition-colors"
                        >
                          <FileText size={12} className="text-emerald-400" />
                          <span className="truncate max-w-[90px]">{app.resume_name || 'Resume'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-surface-200/30">None</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-surface-200/60 font-mono">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.status === 'selected'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : app.status === 'shortlisted'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : app.status === 'rejected'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {app.status !== 'shortlisted' && app.status !== 'selected' && (
                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'shortlisted')}
                            className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors"
                          >
                            Shortlist
                          </button>
                        )}
                        {app.status !== 'selected' && (
                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'selected')}
                            className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                          >
                            Select (Hire)
                          </button>
                        )}
                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                            className="px-2 py-1 rounded text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-[#222] text-xs text-surface-200/60">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded bg-[#181818] hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded bg-[#181818] hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {/* Resume Preview Modal */}
      <AnimatePresence>
        {previewResumeUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setPreviewResumeUrl(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl h-[85vh] bg-[#111] border border-[#333] rounded-2xl p-4 flex flex-col z-10"
            >
              <div className="flex justify-between items-center pb-2 border-b border-[#222]">
                <h3 className="font-semibold text-white text-sm">Resume Preview</h3>
                <button onClick={() => setPreviewResumeUrl(null)} className="text-surface-200/50 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 mt-3 rounded-lg overflow-hidden border border-[#222]">
                <iframe
                  src={previewResumeUrl}
                  title="Candidate Resume"
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
