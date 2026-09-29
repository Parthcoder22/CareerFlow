// ============================================
// Admin Placement Drives & Company Management
// ============================================
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Loader2, Building2, Globe, Trash2, Edit3, X,
  Award, DollarSign, Briefcase, Calendar, MapPin, Users,
  CheckCircle2, XCircle, Clock, ExternalLink, FileText, ChevronRight, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCompanies() {
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Applicants Drawer / Modal state
  const [selectedCompanyForApplicants, setSelectedCompanyForApplicants] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [applicantFilter, setApplicantFilter] = useState('all');
  const [applicantSearch, setApplicantSearch] = useState('');

  // Resume preview modal
  const [previewResumeUrl, setPreviewResumeUrl] = useState(null);

  const initialFormState = {
    name: '',
    website: '',
    industry: 'Technology',
    description: '',
    logo_url: '',
    min_cgpa: '7.0',
    package: '12.0 LPA',
    roles: 'Software Development Engineer',
    eligibility_criteria: 'B.Tech CS / IT / ECE with minimum CGPA and no active backlogs.',
    location: 'On-Campus / Bangalore',
    deadline: '',
    drive_date: '',
    job_description: '',
    status: 'active'
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchCompanies();
  }, [page, searchTerm]);

  // Handle URL query parameter `?view=<company_id>`
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && companies.length > 0) {
      const match = companies.find(c => c.id === viewId);
      if (match) openApplicantsModal(match);
    }
  }, [searchParams, companies]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getCompanies({ page, limit: 12, search: searchTerm });
      setCompanies(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormData(initialFormState);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (comp) => {
    setEditingCompany(comp);
    setFormData({
      name: comp.name || '',
      website: comp.website || '',
      industry: comp.industry || 'Technology',
      description: comp.description || '',
      logo_url: comp.logo_url || '',
      min_cgpa: comp.min_cgpa || '',
      package: comp.package || '',
      roles: comp.roles || '',
      eligibility_criteria: comp.eligibility_criteria || '',
      location: comp.location || 'On-Campus',
      deadline: comp.deadline ? comp.deadline.split('T')[0] : '',
      drive_date: comp.drive_date ? comp.drive_date.split('T')[0] : '',
      job_description: comp.job_description || '',
      status: comp.status || 'active'
    });
    setIsFormModalOpen(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCompany) {
        const { data } = await adminAPI.updateCompany(editingCompany.id, formData);
        setCompanies(companies.map(c => c.id === editingCompany.id ? { ...c, ...data.data } : c));
        toast.success(`Drive updated for ${formData.name}`);
      } else {
        const { data } = await adminAPI.addCompany(formData);
        setCompanies([data.data, ...companies]);
        toast.success(`New drive added for ${formData.name}!`);
      }
      setIsFormModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save company drive');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete drive for "${name}"? This will delete all applications submitted for this company.`)) return;
    try {
      await adminAPI.deleteCompany(id);
      setCompanies(companies.filter(c => c.id !== id));
      if (selectedCompanyForApplicants?.id === id) {
        setSelectedCompanyForApplicants(null);
      }
      toast.success('Company drive deleted');
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  // Open Applicants modal
  const openApplicantsModal = async (comp) => {
    setSelectedCompanyForApplicants(comp);
    setLoadingApplicants(true);
    try {
      const { data } = await adminAPI.getCompanyApplicants(comp.id);
      setApplicants(data.data || []);
    } catch (err) {
      toast.error('Failed to load applicants');
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Update an applicant's status: Applied -> Shortlisted -> Selected -> Rejected
  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await adminAPI.updateApplicationStatus(appId, { status: newStatus });
      setApplicants(applicants.map(a => a.application_id === appId ? { ...a, application_status: newStatus } : a));
      toast.success(`Applicant updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update applicant status');
    }
  };

  // Filter applicants
  const filteredApplicants = applicants.filter(a => {
    const matchesSearch =
      a.student_name?.toLowerCase().includes(applicantSearch.toLowerCase()) ||
      a.student_email?.toLowerCase().includes(applicantSearch.toLowerCase()) ||
      a.branch?.toLowerCase().includes(applicantSearch.toLowerCase());
    const matchesStatus = applicantFilter === 'all' || a.application_status === applicantFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Placement Drives & Companies</h1>
          <p className="text-surface-200/50 text-sm mt-1">Manage recruiting companies, eligibility criteria, and track drive applicants.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none text-white">
            <Plus size={18} /> Post Campus Drive
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-200/40" />
          <input
            type="text"
            placeholder="Search drives by company name, role, or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>
      ) : companies.length === 0 ? (
        <div className="glass-card py-20 flex flex-col items-center justify-center text-surface-200/50">
          <Building2 size={48} className="mb-4 opacity-20" />
          <p>No placement drives found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {companies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-6 flex flex-col justify-between border border-[#222] hover:border-emerald-500/30 transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden font-bold text-white text-lg">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                        company.name?.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        {company.name}
                        {company.website && (
                          <a href={company.website} target="_blank" rel="noreferrer" className="text-surface-200/40 hover:text-white">
                            <Globe size={14} />
                          </a>
                        )}
                      </h3>
                      <p className="text-xs text-surface-200/50">{company.industry || 'Technology'}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    company.status === 'closed'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {company.status || 'Active'}
                  </span>
                </div>

                {/* Key Badges */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2 rounded bg-black/40 border border-[#262626]">
                    <span className="text-[10px] uppercase tracking-wider text-surface-200/40 block">Package (CTC)</span>
                    <span className="text-sm font-bold text-emerald-400">{company.package || 'Competitive'}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-[#262626]">
                    <span className="text-[10px] uppercase tracking-wider text-surface-200/40 block">Min CGPA</span>
                    <span className="text-sm font-bold text-white">{company.min_cgpa ? `${company.min_cgpa} CGPA` : 'Any CGPA'}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-surface-200/70 mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-surface-200/40 flex-shrink-0" />
                    <span className="truncate">{company.roles || 'Software Engineer'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-surface-200/40 flex-shrink-0" />
                    <span className="truncate">{company.location || 'On-Campus'}</span>
                  </div>
                  {company.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-400/70 flex-shrink-0" />
                      <span>Deadline: {new Date(company.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-[#222] pt-4 mt-2 flex items-center justify-between">
                <button
                  onClick={() => openApplicantsModal(company)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Users size={14} /> View Applicants ({company.total_applicants || 0})
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(company)}
                    className="p-1.5 text-surface-200/60 hover:text-white rounded hover:bg-white/5 transition-colors"
                    title="Edit Drive"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(company.id, company.name)}
                    className="p-1.5 text-surface-200/60 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                    title="Delete Company"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL 1: Add / Edit Company Form */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0d0d0d] border border-[#2b2b2b] rounded-2xl p-6 overflow-hidden z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#222]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 size={20} className="text-emerald-400" />
                  {editingCompany ? `Edit Drive: ${editingCompany.name}` : 'Post New Campus Placement Drive'}
                </h3>
                <button onClick={() => setIsFormModalOpen(false)} className="text-surface-200/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-200/60 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google India"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-200/60 mb-1">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://careers.google.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-200/60 mb-1">Job Role(s) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer"
                      value={formData.roles}
                      onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-200/60 mb-1">Package / CTC *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24.5 LPA"
                      value={formData.package}
                      onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-200/60 mb-1">Minimum CGPA Cutoff</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="e.g. 7.50"
                      value={formData.min_cgpa}
                      onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-200/60 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore / Hybrid"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-200/60 mb-1">Application Deadline</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-200/60 mb-1">Drive Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input-field text-sm"
                    >
                      <option value="active">Active (Open to apply)</option>
                      <option value="closed">Closed</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-200/60 mb-1">Company Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-200/60 mb-1">Eligibility Criteria</label>
                  <textarea
                    rows={2}
                    placeholder="Specific branch restrictions, aggregate % across 10th/12th, or backlog limits..."
                    value={formData.eligibility_criteria}
                    onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-200/60 mb-1">Job Description & Responsibilities</label>
                  <textarea
                    rows={4}
                    placeholder="Role responsibilities, tech stack, and interview process details..."
                    value={formData.job_description}
                    onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                  <button type="button" onClick={() => setIsFormModalOpen(false)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary text-sm bg-emerald-600 hover:bg-emerald-500 border-none text-white">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {editingCompany ? 'Update Drive' : 'Publish Drive'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Applicants Manager Drawer */}
      <AnimatePresence>
        {selectedCompanyForApplicants && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedCompanyForApplicants(null)} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-5xl bg-[#0c0c0c] border border-[#282828] rounded-2xl p-6 overflow-hidden z-10 shadow-2xl flex flex-col max-h-[92vh]"
            >
              {/* Drawer Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#222]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedCompanyForApplicants.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      {selectedCompanyForApplicants.package}
                    </span>
                    <span className="text-xs text-surface-200/50">• {selectedCompanyForApplicants.roles}</span>
                  </div>
                  <p className="text-xs text-surface-200/50 mt-0.5">
                    Managing {applicants.length} registered candidate application(s)
                  </p>
                </div>
                <button onClick={() => setSelectedCompanyForApplicants(null)} className="text-surface-200/50 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {['all', 'applied', 'shortlisted', 'selected', 'rejected'].map(statusKey => (
                    <button
                      key={statusKey}
                      onClick={() => setApplicantFilter(statusKey)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        applicantFilter === statusKey
                          ? 'bg-white text-black'
                          : 'bg-[#181818] text-surface-200/60 hover:text-white'
                      }`}
                    >
                      {statusKey}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/40" />
                  <input
                    type="text"
                    placeholder="Search applicant name..."
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    className="input-field text-xs pl-8 py-1.5"
                  />
                </div>
              </div>

              {/* Applicants Table */}
              <div className="flex-1 overflow-y-auto border border-[#222] rounded-xl">
                {loadingApplicants ? (
                  <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>
                ) : filteredApplicants.length === 0 ? (
                  <div className="text-center py-20 text-surface-200/40 text-sm">
                    No applicants match this criteria.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[#141414] border-b border-[#252525] text-xs uppercase tracking-wider text-surface-200/50 font-semibold z-10">
                      <tr>
                        <th className="py-3 px-3.5">Candidate</th>
                        <th className="py-3 px-3">Branch & CGPA</th>
                        <th className="py-3 px-3">Applied On</th>
                        <th className="py-3 px-3">Resume</th>
                        <th className="py-3 px-3">Current Status</th>
                        <th className="py-3 px-3 text-right">T&P Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e1e]">
                      {filteredApplicants.map((app) => (
                        <tr key={app.application_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3.5">
                            <p className="font-semibold text-white">{app.student_name}</p>
                            <p className="text-xs text-surface-200/50">{app.student_email}</p>
                          </td>
                          <td className="py-3 px-3 text-xs">
                            <span className="text-white font-medium">{app.branch || 'Engineering'}</span>
                            <span className="block text-emerald-400 font-mono font-semibold">{app.cgpa ? `${app.cgpa} CGPA` : 'N/A'}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-surface-200/60 font-mono">
                            {new Date(app.applied_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            {app.resume_url ? (
                              <button
                                onClick={() => setPreviewResumeUrl(app.resume_url)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-white transition-colors"
                              >
                                <FileText size={13} className="text-emerald-400" />
                                <span className="truncate max-w-[100px]">{app.resume_name || 'Resume'}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-surface-200/30">None</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              app.application_status === 'selected'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : app.application_status === 'shortlisted'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : app.application_status === 'rejected'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                              {app.application_status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              {app.application_status !== 'shortlisted' && app.application_status !== 'selected' && (
                                <button
                                  onClick={() => handleUpdateStatus(app.application_id, 'shortlisted')}
                                  className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors"
                                  title="Shortlist for next round"
                                >
                                  Shortlist
                                </button>
                              )}
                              {app.application_status !== 'selected' && (
                                <button
                                  onClick={() => handleUpdateStatus(app.application_id, 'selected')}
                                  className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                                  title="Hire / Final Selection"
                                >
                                  Select (Hire)
                                </button>
                              )}
                              {app.application_status !== 'rejected' && (
                                <button
                                  onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                                  className="px-2 py-1 rounded text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                                  title="Reject candidate"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Resume Preview Modal */}
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
                <div className="flex items-center gap-3">
                  <a
                    href={previewResumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary-400 hover:underline flex items-center gap-1"
                  >
                    Open in new tab <ExternalLink size={12} />
                  </a>
                  <button onClick={() => setPreviewResumeUrl(null)} className="text-surface-200/50 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
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
