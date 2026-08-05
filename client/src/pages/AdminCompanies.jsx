import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Building2, Globe, Trash2, X, Award, DollarSign, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
    logo_url: '',
    min_cgpa: '',
    package: '',
    roles: '',
    eligibility_criteria: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, [page]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getCompanies({ page, limit: 12 });
      setCompanies(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await adminAPI.addCompany(formData);
      setCompanies([data.data, ...companies]);
      setIsModalOpen(false);
      setFormData({
        name: '', website: '', industry: '', description: '', logo_url: '',
        min_cgpa: '', package: '', roles: '', eligibility_criteria: ''
      });
      toast.success('Company added successfully');
    } catch (error) {
      toast.error('Failed to add company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await adminAPI.deleteCompany(id);
      setCompanies(companies.filter(c => c.id !== id));
      toast.success('Company deleted');
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-200">Companies Master</h1>
          <p className="text-surface-200/50 mt-1">Manage partner hiring companies & CGPA cutoffs.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={18} /> Add Company
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-500" /></div>
      ) : companies.length === 0 ? (
        <div className="glass-card py-20 flex flex-col items-center justify-center text-surface-200/50">
          <Building2 size={48} className="mb-4 opacity-20" />
          <p>No companies registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {companies.map((company, i) => (
            <motion.div key={company.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-6 flex flex-col relative group overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} className="text-surface-200/50" />
                  )}
                </div>
                <button onClick={() => handleDelete(company.id, company.name)} className="p-2 text-surface-200/30 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-lg font-bold text-surface-200 relative z-10">{company.name}</h3>
              <p className="text-sm text-primary-400 font-medium mb-3 relative z-10">{company.industry || 'Various Industries'}</p>

              <div className="space-y-1.5 mb-3 text-xs relative z-10">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                  <span className="text-surface-200/60 flex items-center gap-1"><Award size={12} /> Min CGPA Cutoff</span>
                  <span className="font-bold text-primary-400">{company.min_cgpa ? `${parseFloat(company.min_cgpa).toFixed(2)} / 10.0` : 'None'}</span>
                </div>
                {company.package && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-surface-200/60 flex items-center gap-1"><DollarSign size={12} /> CTC Package</span>
                    <span className="font-bold text-emerald-400">{company.package}</span>
                  </div>
                )}
                {company.roles && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-surface-200/60 flex items-center gap-1"><Briefcase size={12} /> Roles</span>
                    <span className="font-medium text-surface-200 truncate max-w-[140px]">{company.roles}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-surface-200/60 line-clamp-2 mb-4 flex-1 relative z-10">{company.description || 'No description provided.'}</p>

              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-surface-200/40 hover:text-surface-200 transition-colors mt-auto pt-4 border-t border-white/5 relative z-10">
                  <Globe size={14} /> Visit Website
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="glass-card w-full max-w-lg p-6 relative z-10 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-surface-200">Add New Hiring Company</h2>
                <button onClick={() => !submitting && setIsModalOpen(false)} className="text-surface-200/50 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddCompany} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-200/70 mb-1">Company Name *</label>
                    <input type="text" required className="input-field w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Google" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-200/70 mb-1">Industry</label>
                    <input type="text" className="input-field w-full" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="e.g. Software & Cloud" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-200/70 mb-1">Min CGPA Cutoff (0 - 10)</label>
                    <input type="number" step="0.01" min="0" max="10" className="input-field w-full" value={formData.min_cgpa} onChange={e => setFormData({...formData, min_cgpa: e.target.value})} placeholder="e.g. 7.50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-200/70 mb-1">CTC Package</label>
                    <input type="text" className="input-field w-full" value={formData.package} onChange={e => setFormData({...formData, package: e.target.value})} placeholder="e.g. 18.5 LPA" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-200/70 mb-1">Roles Offered</label>
                  <input type="text" className="input-field w-full" value={formData.roles} onChange={e => setFormData({...formData, roles: e.target.value})} placeholder="e.g. SDE-1, Cloud Associate" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-200/70 mb-1">Website URL</label>
                    <input type="url" className="input-field w-full" placeholder="https://..." value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-200/70 mb-1">Logo URL (Optional)</label>
                    <input type="url" className="input-field w-full" placeholder="https://..." value={formData.logo_url} onChange={e => setFormData({...formData, logo_url: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-200/70 mb-1">Detailed Eligibility Criteria</label>
                  <textarea rows={2} className="input-field w-full" value={formData.eligibility_criteria} onChange={e => setFormData({...formData, eligibility_criteria: e.target.value})} placeholder="e.g. CS/IT branches only, no active backlogs allowed." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-200/70 mb-1">Company Description</label>
                  <textarea rows={2} className="input-field w-full" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief overview of company..." />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => !submitting && setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 font-bold">
                    {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Save & Register Company'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
