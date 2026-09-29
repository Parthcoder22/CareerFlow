// ============================================
// Student Applications Tracker (Read-Only Status)
// ============================================
// Students can track the exact status of their campus drive applications.
// Selection & shortlisting status is strictly controlled by T&P Cell.

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationAPI } from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/skeletons/Skeletons';
import {
  Search, Building2, MapPin, Calendar, ExternalLink,
  FileText, CheckCircle2, Clock, XCircle, Award, X, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: 'all', sort_by: 'created_at', sort_order: 'desc' });
  const [previewResumeUrl, setPreviewResumeUrl] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [filters.search, filters.status, filters.sort_by, filters.sort_order, pagination.page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data } = await applicationAPI.getAll({
        page: pagination.page,
        limit: 12,
        ...filters,
      });
      setApplications(data.data || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      }));
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id, companyName, status) => {
    if (['shortlisted', 'selected'].includes(status)) {
      return toast.error('You cannot withdraw an application that has already been shortlisted or selected by T&P Cell.');
    }
    if (!window.confirm(`Withdraw application for ${companyName}?`)) return;

    try {
      await applicationAPI.delete(id);
      toast.success('Application withdrawn successfully');
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to withdraw application');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Campus Drive Applications</h1>
          <p className="text-surface-200/50 text-sm mt-1">
            Track official hiring decisions, shortlisting status, and interview rounds.
          </p>
        </div>

        <Link to="/companies" className="btn-primary text-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none text-white">
          <Building2 size={16} /> Explore New Drives
        </Link>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-3 text-xs text-surface-200/70">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-emerald-400 flex-shrink-0" />
          <span>Application and selection statuses are updated directly by the College Training & Placement Cell.</span>
        </div>
        <span className="font-mono text-emerald-400 font-semibold">{pagination.total} Applications Submitted</span>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/40" />
            <input
              type="text"
              placeholder="Search by recruiter or role..."
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPagination(p => ({ ...p, page: 1 })); }}
              className="input-field text-xs pl-9 py-2 w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['all', 'applied', 'shortlisted', 'selected', 'rejected'].map(statusKey => (
              <button
                key={statusKey}
                onClick={() => { setFilters({ ...filters, status: statusKey }); setPagination(p => ({ ...p, page: 1 })); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filters.status === statusKey
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#141414] text-surface-200/60 hover:text-white'
                }`}
              >
                {statusKey}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Applications Cards Grid */}
      {loading ? (
        <PageSkeleton />
      ) : applications.length === 0 ? (
        <div className="glass-card py-20 flex flex-col items-center justify-center text-center">
          <Building2 size={48} className="text-surface-200/20 mb-3" />
          <h3 className="text-lg font-semibold text-white">No Applications Found</h3>
          <p className="text-xs text-surface-200/50 mt-1 max-w-sm mb-4">
            {filters.status !== 'all' || filters.search
              ? 'No applications match the current filter.'
              : 'You have not applied for any placement opportunities yet.'}
          </p>
          <Link to="/companies" className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500 border-none text-white">
            Browse Open Campus Drives
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card p-6 flex flex-col justify-between border transition-all ${
                app.status === 'selected'
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : app.status === 'shortlisted'
                  ? 'border-blue-500/40 bg-blue-950/10'
                  : app.status === 'rejected'
                  ? 'border-red-500/20 opacity-80'
                  : 'border-[#262626]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 font-bold text-white text-lg overflow-hidden">
                      {app.company_logo_url ? (
                        <img src={app.company_logo_url} alt={app.company_name} className="w-full h-full object-cover" />
                      ) : (
                        app.company_name?.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">{app.company_name}</h3>
                      <p className="text-xs text-surface-200/50">{app.role}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    app.status === 'selected'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : app.status === 'shortlisted'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : app.status === 'rejected'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {app.status === 'selected' ? 'Offer / Selected 🎉' : app.status}
                  </span>
                </div>

                {/* Package & Location */}
                <div className="grid grid-cols-2 gap-2 my-3">
                  <div className="p-2 rounded bg-black/40 border border-[#242424]">
                    <span className="text-[10px] uppercase tracking-wider text-surface-200/40 block">Package (CTC)</span>
                    <span className="text-sm font-bold text-emerald-400">{app.package || 'Competitive'}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-[#242424]">
                    <span className="text-[10px] uppercase tracking-wider text-surface-200/40 block">Applied On</span>
                    <span className="text-xs font-semibold text-white font-mono">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Attached Resume */}
                <div className="text-xs text-surface-200/70 space-y-1.5 my-3">
                  {app.resume_url && (
                    <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-[#222]">
                      <span className="flex items-center gap-1.5 truncate text-[11px] text-surface-200/80">
                        <FileText size={13} className="text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{app.resume_name || 'Attached Resume'}</span>
                      </span>
                      <button
                        onClick={() => setPreviewResumeUrl(app.resume_url)}
                        className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-0.5 ml-2"
                      >
                        Preview <ExternalLink size={10} />
                      </button>
                    </div>
                  )}

                  {app.notes && (
                    <p className="text-[11px] text-surface-200/50 italic bg-black/30 p-2 rounded border border-[#202020]">
                      "{app.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Status Message Footer */}
              <div className="border-t border-[#222] pt-3 mt-2 flex items-center justify-between text-xs">
                {app.status === 'selected' ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Final selection offer verified by T&P
                  </span>
                ) : app.status === 'shortlisted' ? (
                  <span className="text-blue-400 font-semibold flex items-center gap-1">
                    <Clock size={13} /> Shortlisted for technical rounds
                  </span>
                ) : app.status === 'applied' ? (
                  <>
                    <span className="text-surface-200/50">Under review by coordinator</span>
                    <button
                      onClick={() => handleWithdraw(app.id, app.company_name, app.status)}
                      className="text-red-400/80 hover:text-red-300 text-xs hover:underline"
                    >
                      Withdraw
                    </button>
                  </>
                ) : (
                  <span className="text-red-400/80">Application closed</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 border-t border-[#222] text-xs text-surface-200/60">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              className="px-3 py-1 rounded bg-[#181818] hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              className="px-3 py-1 rounded bg-[#181818] hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

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
                <h3 className="font-semibold text-white text-sm">Attached Resume Preview</h3>
                <button onClick={() => setPreviewResumeUrl(null)} className="text-surface-200/50 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 mt-3 rounded-lg overflow-hidden border border-[#222]">
                <iframe
                  src={previewResumeUrl}
                  title="Application Resume"
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
