// ============================================
// Applications Page
// ============================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationAPI, resumeAPI, companyAPI } from '../services/api';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/skeletons/Skeletons';
import { useForm } from 'react-hook-form';
import {
  Plus, Search, Filter, Building2, MapPin, Calendar,
  ExternalLink, Trash2, Edit, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { STATUS_OPTIONS, getStatusLabel, getStatusBg, formatDate } from '../utils/constants';
import toast from 'react-hot-toast';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', sort_by: 'created_at', sort_order: 'desc' });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchApplications();
    fetchResumes();
    fetchCompanies();
  }, [filters.search, filters.status, filters.sort_by, filters.sort_order, pagination.page]);

  const fetchApplications = async () => {
    try {
      const { data } = await applicationAPI.getAll({
        page: pagination.page,
        limit: 10,
        ...filters,
      });
      setApplications(data.data);
      setPagination(prev => ({
        ...prev,
        totalPages: data.pagination.totalPages,
        total: data.pagination.total,
      }));
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const { data } = await resumeAPI.getAll();
      setResumes(data.data);
    } catch (err) { /* silent */ }
  };

  const fetchCompanies = async () => {
    try {
      const { data } = await companyAPI.getAll();
      setAvailableCompanies(data.data || []);
    } catch (err) { /* silent */ }
  };

  const onSubmit = async (formData) => {
    try {
      if (editingApp) {
        await applicationAPI.update(editingApp.id, formData);
        toast.success('Application updated!');
      } else {
        await applicationAPI.create(formData);
        toast.success('Application added!');
      }
      setModalOpen(false);
      setEditingApp(null);
      reset();
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await applicationAPI.delete(id);
      toast.success('Application deleted');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openEditModal = (app) => {
    setEditingApp(app);
    Object.keys(app).forEach(key => {
      if (key === 'deadline' || key === 'oa_date' || key === 'interview_date') {
        setValue(key, app[key] ? new Date(app[key]).toISOString().split('T')[0] : '');
      } else {
        setValue(key, app[key] || '');
      }
    });
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingApp(null);
    reset();
    setModalOpen(true);
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-200">Applications</h1>
          <p className="text-surface-200/50 mt-1">{pagination.total} total applications</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary" id="add-application-btn">
          <Plus size={20} /> Add Application
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-200/40" />
          <input
            type="text"
            placeholder="Search company or role..."
            className="input-field pl-11"
            value={filters.search}
            onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
            id="search-applications"
          />
        </div>
        <select
          className="input-field w-full sm:w-48"
          value={filters.status}
          onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
          id="filter-status"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          className="input-field w-full sm:w-48"
          value={filters.sort_by}
          onChange={(e) => setFilters(f => ({ ...f, sort_by: e.target.value }))}
          id="sort-applications"
        >
          <option value="created_at">Date Added</option>
          <option value="company_name">Company</option>
          <option value="deadline">Deadline</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No applications yet"
          description="Start tracking your placement applications by adding your first company."
          action={<button onClick={openCreateModal} className="btn-primary"><Plus size={20} /> Add Application</button>}
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-5 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                {/* Company Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">{app.company_name?.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-surface-200 truncate">{app.company_name}</h3>
                    <p className="text-sm text-surface-200/50 truncate">{app.role}</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-surface-200/50">
                  {app.package && (
                    <span className="flex items-center gap-1">💰 {app.package}</span>
                  )}
                  {app.location && (
                    <span className="flex items-center gap-1"><MapPin size={14} /> {app.location}</span>
                  )}
                  {app.deadline && (
                    <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(app.deadline)}</span>
                  )}
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${getStatusBg(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                  {app.application_link && (
                    <a href={app.application_link} target="_blank" rel="noopener" className="p-2 rounded-lg hover:bg-white/10 text-surface-200/40 hover:text-primary-400 transition-all">
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button onClick={() => openEditModal(app)} className="p-2 rounded-lg hover:bg-white/10 text-surface-200/40 hover:text-primary-400 transition-all">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(app.id)} className="p-2 rounded-lg hover:bg-danger/10 text-surface-200/40 hover:text-danger transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="btn-secondary py-2 px-4 disabled:opacity-30"
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <span className="text-surface-200/60 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="btn-secondary py-2 px-4 disabled:opacity-30"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingApp(null); reset(); }}
        title={editingApp ? 'Edit Application' : 'Add Application'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Company Name *</label>
              <input className="input-field" placeholder="Google" list="company-options" {...register('company_name', { required: 'Required' })} />
              <datalist id="company-options">
                {availableCompanies.map(c => (
                  <option key={c.id} value={c.name}>{c.industry ? `${c.name} (${c.industry})` : c.name}</option>
                ))}
              </datalist>
              {errors.company_name && <p className="text-danger text-xs mt-1">{errors.company_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Role *</label>
              <input className="input-field" placeholder="SDE Intern" {...register('role', { required: 'Required' })} />
              {errors.role && <p className="text-danger text-xs mt-1">{errors.role.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Package</label>
              <input className="input-field" placeholder="12 LPA" {...register('package')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Location</label>
              <input className="input-field" placeholder="Bangalore" {...register('location')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Status</label>
              <select className="input-field" {...register('status')}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Resume</label>
              <select className="input-field" {...register('resume_id')}>
                <option value="">No resume linked</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (v{r.version})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Application Deadline</label>
              <input type="date" className="input-field" {...register('deadline')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">OA Date</label>
              <input type="date" className="input-field" {...register('oa_date')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Interview Date</label>
              <input type="date" className="input-field" {...register('interview_date')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Application Link</label>
              <input className="input-field" placeholder="https://..." {...register('application_link')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Eligibility</label>
            <input className="input-field" placeholder="CGPA > 7.0, CSE/IT" {...register('eligibility')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Job Description</label>
            <textarea rows={3} className="input-field" placeholder="Paste JD here..." {...register('job_description')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Notes</label>
            <textarea rows={2} className="input-field" placeholder="Personal notes..." {...register('notes')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editingApp ? 'Update Application' : 'Add Application'}
            </button>
            <button type="button" onClick={() => { setModalOpen(false); reset(); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
