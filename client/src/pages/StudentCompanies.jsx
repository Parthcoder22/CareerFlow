// ============================================
// Student Campus Drives & Application Portal
// ============================================
import { useState, useEffect } from 'react';
import { companyAPI, applicationAPI, resumeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Globe, Search, Loader2, CheckCircle2, XCircle,
  Sliders, Award, DollarSign, Briefcase, FileText, ChevronDown, ChevronUp,
  MapPin, Clock, ShieldAlert, ArrowUpRight, Check, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [studentMeta, setStudentMeta] = useState({ student_cgpa: 0, placement_permission: true, restriction_reason: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'eligible' | 'ineligible' | 'applied'
  const [expandedDescId, setExpandedDescId] = useState(null);

  // Apply Modal state
  const [applyModalCompany, setApplyModalCompany] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, resumeRes] = await Promise.all([
        companyAPI.getAll(),
        resumeAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);
      const compList = Array.isArray(compRes.data.data) ? compRes.data.data : [];
      setCompanies(compList);
      if (compRes.data.student_meta) {
        setStudentMeta(compRes.data.student_meta);
      }
      const rawResumes = resumeRes.data?.data;
      const resumeList = Array.isArray(rawResumes) ? rawResumes : rawResumes?.resumes || [];
      setResumes(resumeList);
      if (resumeList.length > 0) {
        setSelectedResumeId(resumeList[0].id);
      }
    } catch (error) {
      toast.error('Failed to load campus drives');
    } finally {
      setLoading(false);
    }
  };

  const studentCgpa = parseFloat(studentMeta.student_cgpa || user?.cgpa || 0);
  const hasPermission = studentMeta.placement_permission !== false;

  const isEligibleCgpa = (minCgpa) => {
    const cutoff = parseFloat(minCgpa || 0);
    return studentCgpa >= cutoff;
  };

  const isDeadlineOpen = (deadline) => {
    if (!deadline) return true;
    return new Date(deadline) >= new Date();
  };

  const handleOpenApply = (comp) => {
    if (!hasPermission) {
      return toast.error('Your placement application permission is restricted by T&P Cell.');
    }
    if (!isEligibleCgpa(comp.min_cgpa)) {
      return toast.error(`Your CGPA (${studentCgpa.toFixed(2)}) is below the required cutoff of ${comp.min_cgpa}.`);
    }
    if (!isDeadlineOpen(comp.deadline)) {
      return toast.error('Application deadline has passed.');
    }
    if (comp.has_applied) {
      return toast.error('You have already applied to this company.');
    }
    setApplyModalCompany(comp);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!applyModalCompany) return;
    setSubmittingApply(true);
    try {
      await applicationAPI.create({
        company_id: applyModalCompany.id,
        company_name: applyModalCompany.name,
        role: applyModalCompany.roles,
        package: applyModalCompany.package,
        location: applyModalCompany.location,
        deadline: applyModalCompany.deadline,
        resume_id: selectedResumeId || null,
        notes: applicationNotes || null,
      });

      toast.success(`Application submitted for ${applyModalCompany.name}!`);
      // Update local state
      setCompanies(companies.map(c => 
        c.id === applyModalCompany.id 
          ? { ...c, has_applied: true, application_status: 'applied' } 
          : c
      ));
      setApplyModalCompany(null);
      setApplicationNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmittingApply(false);
    }
  };

  // Filter companies
  const filtered = companies.filter(c => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase()) ||
      c.roles?.toLowerCase().includes(search.toLowerCase());

    const eligible = isEligibleCgpa(c.min_cgpa);

    if (!matchesSearch) return false;
    if (filterMode === 'eligible') return eligible;
    if (filterMode === 'ineligible') return !eligible;
    if (filterMode === 'applied') return c.has_applied;
    return true;
  });

  const eligibleCount = companies.filter(c => isEligibleCgpa(c.min_cgpa)).length;
  const appliedCount = companies.filter(c => c.has_applied).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Campus Placement Drives</h1>
          <p className="text-surface-200/50 text-sm mt-1">
            Official recruitment opportunities posted by the College Training & Placement Cell.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg border border-[#333] bg-[#111] text-xs">
            <span className="text-surface-200/50">My Profile CGPA: </span>
            <strong className="text-emerald-400 font-mono text-sm ml-1">
              {studentCgpa > 0 ? studentCgpa.toFixed(2) : 'Not set'}
            </strong>
          </div>
        </div>
      </div>

      {/* Permission Restriction Banner */}
      {!hasPermission && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3">
          <ShieldAlert size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-300">
            <strong className="font-bold text-red-200 text-sm block">Placement Application Permission Restricted</strong>
            Your permission to apply for campus drives has been temporarily restricted by the T&P Cell.
            {studentMeta.restriction_reason && ` Reason: "${studentMeta.restriction_reason}".`}
            You can view drive details, but the Apply button is disabled. Contact the T&P Cell for resolution.
          </div>
        </div>
      )}

      {/* Search & Filter Tabs */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-200/40" />
            <input
              type="text"
              placeholder="Search companies, roles, or tech stack..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-xs pl-10 py-2 w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'all' ? 'bg-white text-black' : 'bg-[#141414] text-surface-200/60 hover:text-white'
              }`}
            >
              All Drives ({companies.length})
            </button>
            <button
              onClick={() => setFilterMode('eligible')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'eligible' ? 'bg-emerald-500 text-black font-bold' : 'bg-[#141414] text-emerald-400/80 hover:text-emerald-400'
              }`}
            >
              Eligible for Me ({eligibleCount})
            </button>
            <button
              onClick={() => setFilterMode('ineligible')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'ineligible' ? 'bg-amber-500 text-black font-bold' : 'bg-[#141414] text-surface-200/60 hover:text-white'
              }`}
            >
              Above My Cutoff ({companies.length - eligibleCount})
            </button>
            <button
              onClick={() => setFilterMode('applied')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'applied' ? 'bg-blue-500 text-white font-bold' : 'bg-[#141414] text-surface-200/60 hover:text-white'
              }`}
            >
              Applied ({appliedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Companies Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card py-20 text-center text-surface-200/50">
          <Building2 size={48} className="mx-auto mb-3 opacity-20" />
          <p>No campus recruitment drives matched your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((company, i) => {
            const eligible = isEligibleCgpa(company.min_cgpa);
            const openDeadline = isDeadlineOpen(company.deadline);
            const canApply = hasPermission && eligible && openDeadline && !company.has_applied;

            return (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card p-6 flex flex-col justify-between border transition-all ${
                  company.has_applied
                    ? 'border-emerald-500/40 bg-emerald-950/5'
                    : eligible
                    ? 'border-[#262626] hover:border-emerald-500/30'
                    : 'border-[#222] opacity-80'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden font-bold text-white text-lg">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                        ) : (
                          company.name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-base flex items-center gap-1.5">
                          {company.name}
                          {company.website && (
                            <a href={company.website} target="_blank" rel="noreferrer" className="text-surface-200/40 hover:text-white">
                              <Globe size={13} />
                            </a>
                          )}
                        </h3>
                        <p className="text-xs text-surface-200/50">{company.industry || 'Technology'}</p>
                      </div>
                    </div>

                    {/* Eligibility Badge */}
                    {eligible ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={11} /> Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        <XCircle size={11} /> CGPA &lt; {company.min_cgpa}
                      </span>
                    )}
                  </div>

                  {/* CTC Package & Cutoff */}
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="p-2 rounded bg-black/40 border border-[#242424]">
                      <span className="text-[10px] uppercase tracking-wider text-surface-200/40 block">Package (CTC)</span>
                      <span className="text-sm font-bold text-emerald-400">{company.package || 'Competitive'}</span>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-[#242424]">
                      <span className="text-[10px] uppercase tracking-wider text-surface-200/40 block">Cutoff Requirement</span>
                      <span className="text-sm font-bold text-white">
                        {company.min_cgpa ? `${company.min_cgpa} CGPA` : 'No Cutoff'}
                      </span>
                    </div>
                  </div>

                  {/* Role & Location */}
                  <div className="space-y-1.5 text-xs text-surface-200/70 my-3">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-surface-200/40 flex-shrink-0" />
                      <span className="font-medium text-white truncate">{company.roles || 'Software Engineer'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-surface-200/40 flex-shrink-0" />
                      <span className="truncate">{company.location || 'On-Campus'}</span>
                    </div>
                    {company.deadline && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className={openDeadline ? 'text-amber-400' : 'text-red-400'} flex-shrink-0 />
                        <span className={openDeadline ? 'text-surface-200/70' : 'text-red-400 font-semibold'}>
                          {openDeadline ? `Deadline: ${new Date(company.deadline).toLocaleDateString()}` : 'Deadline Passed'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expandable Criteria / JD */}
                  {company.eligibility_criteria && (
                    <div className="mt-2 text-xs border-t border-[#1f1f1f] pt-2">
                      <p className="text-[11px] text-surface-200/50 line-clamp-2">
                        <strong className="text-surface-200/70">Criteria:</strong> {company.eligibility_criteria}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Section */}
                <div className="border-t border-[#222] pt-4 mt-3 flex items-center justify-between gap-2">
                  {company.has_applied ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 size={15} /> Status: {company.application_status || 'Applied'}
                      </span>
                      <Link to="/applications" className="text-xs text-surface-200/50 hover:text-white underline">
                        View Application
                      </Link>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenApply(company)}
                        disabled={!canApply}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          canApply
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 cursor-pointer'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                        }`}
                      >
                        {!hasPermission
                          ? 'Permission Restricted'
                          : !eligible
                          ? `CGPA Below ${company.min_cgpa}`
                          : !openDeadline
                          ? 'Deadline Passed'
                          : 'Apply for Drive'}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* APPLY CONFIRMATION MODAL */}
      <AnimatePresence>
        {applyModalCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setApplyModalCompany(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-[#2c2c2c] rounded-2xl p-6 z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#222] mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Apply to {applyModalCompany.name}</h3>
                  <p className="text-xs text-surface-200/50">{applyModalCompany.roles} • {applyModalCompany.package}</p>
                </div>
                <button onClick={() => setApplyModalCompany(null)} className="text-surface-200/50 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitApplication} className="space-y-4">
                {/* Resume Selector */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-surface-200/70">Select Resume to Attach *</label>
                    <Link to="/resumes" className="text-[11px] text-emerald-400 hover:underline">
                      + Upload New Resume
                    </Link>
                  </div>

                  {resumes.length > 0 ? (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="input-field text-sm"
                      required
                    >
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.target_company ? `(${r.target_company})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300">
                      No uploaded resumes found. You can submit without a resume or upload one in Resume Manager.
                    </div>
                  )}
                </div>

                {/* Candidate Notes */}
                <div>
                  <label className="block text-xs font-semibold text-surface-200/70 mb-1">
                    Notes for T&P Placement Cell (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mention relevant certifications, projects, or notes for the coordinator..."
                    value={applicationNotes}
                    onChange={(e) => setApplicationNotes(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                {/* Summary Box */}
                <div className="p-3 rounded-lg bg-black/50 border border-[#222] space-y-1 text-xs text-surface-200/60">
                  <div className="flex justify-between">
                    <span>Minimum Cutoff:</span>
                    <strong className="text-white">{applyModalCompany.min_cgpa || 'None'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Verified CGPA:</span>
                    <strong className="text-emerald-400 font-mono">{studentCgpa.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Eligibility Status:</span>
                    <span className="text-emerald-400 font-bold">100% Eligible</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                  <button
                    type="button"
                    onClick={() => setApplyModalCompany(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApply}
                    className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500 border-none text-white flex items-center gap-1.5"
                  >
                    {submittingApply ? <Loader2 size={14} className="animate-spin" /> : null}
                    Confirm Application
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
