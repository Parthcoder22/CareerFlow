// ============================================
// Student Companies & Eligibility Filter Portal
// ============================================
import { useState, useEffect } from 'react';
import { companyAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Globe, Search, Loader2, CheckCircle2, XCircle,
  Sliders, Award, DollarSign, Briefcase, FileText, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [studentCgpa, setStudentCgpa] = useState(user?.cgpa ? parseFloat(user.cgpa) : 7.5);
  const [savedProfileCgpa, setSavedProfileCgpa] = useState(user?.cgpa ? parseFloat(user.cgpa) : null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'eligible' | 'ineligible'
  const [expandedCriteriaId, setExpandedCriteriaId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch latest profile CGPA
      const profileRes = await authAPI.getMe().catch(() => null);
      if (profileRes?.data?.user?.cgpa) {
        const cgpaVal = parseFloat(profileRes.data.user.cgpa);
        setSavedProfileCgpa(cgpaVal);
        setStudentCgpa(cgpaVal);
      }

      // Fetch companies
      const { data } = await companyAPI.getAll();
      setCompanies(data.data || []);
    } catch (error) {
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const isEligible = (minCgpa) => {
    const cutoff = parseFloat(minCgpa || 0);
    return studentCgpa >= cutoff;
  };

  // Filter logic
  const filtered = companies.filter(c => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase()) ||
      c.roles?.toLowerCase().includes(search.toLowerCase());

    const eligible = isEligible(c.min_cgpa);

    if (!matchesSearch) return false;
    if (filterMode === 'eligible') return eligible;
    if (filterMode === 'ineligible') return !eligible;
    return true;
  });

  const eligibleCount = companies.filter(c => isEligible(c.min_cgpa)).length;
  const ineligibleCount = companies.length - eligibleCount;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-200 flex items-center gap-3">
            <span>Placement Companies & CGPA Eligibility Filter</span>
          </h1>
          <p className="text-surface-200/50 mt-1">
            Check cutoffs, eligibility criteria, packages, and view interview experiences for hiring companies.
          </p>
        </div>
      </div>

      {/* Interactive CGPA Eligibility Filter Control Box */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border border-primary-500/20 bg-gradient-to-r from-primary-950/40 via-surface-900/60 to-surface-950/80 relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* CGPA Slider & Input */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm font-semibold text-surface-200 flex items-center gap-2">
                <Sliders size={18} className="text-primary-400" />
                <span>Adjust CGPA Criteria Filter:</span>
              </label>
              <div className="flex items-center gap-2">
                {savedProfileCgpa !== null && (
                  <button
                    onClick={() => setStudentCgpa(savedProfileCgpa)}
                    className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-primary-300 border border-primary-500/30 transition-colors"
                  >
                    Reset to My CGPA ({savedProfileCgpa.toFixed(2)})
                  </button>
                )}
                <span className="text-2xl font-extrabold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-xl border border-primary-500/30">
                  {studentCgpa.toFixed(2)} <span className="text-xs text-surface-200/60 font-normal">/ 10.0</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.0"
                max="10.0"
                step="0.05"
                value={studentCgpa}
                onChange={(e) => setStudentCgpa(parseFloat(e.target.value))}
                className="w-full h-2 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={studentCgpa}
                onChange={(e) => setStudentCgpa(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="input-field w-20 text-center font-bold text-sm py-1.5"
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
            <div className="text-center px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex-1 lg:flex-initial">
              <p className="text-xs text-emerald-400 font-medium">Eligible Companies</p>
              <p className="text-2xl font-bold text-emerald-400">{eligibleCount}</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex-1 lg:flex-initial">
              <p className="text-xs text-rose-400 font-medium">Ineligible Companies</p>
              <p className="text-2xl font-bold text-rose-400">{ineligibleCount}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                : 'text-surface-200/60 hover:text-surface-200 hover:bg-white/5'
            }`}
          >
            All Companies ({companies.length})
          </button>
          <button
            onClick={() => setFilterMode('eligible')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              filterMode === 'eligible'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle2 size={14} /> Eligible ({eligibleCount})
          </button>
          <button
            onClick={() => setFilterMode('ineligible')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              filterMode === 'ineligible'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <XCircle size={14} /> Ineligible ({ineligibleCount})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-200/40" />
          <input
            type="text"
            placeholder="Search company or role..."
            className="input-field pl-10 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Company Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card py-16 flex flex-col items-center justify-center text-surface-200/50">
          <Building2 size={48} className="mb-4 opacity-20 text-primary-400" />
          <p className="text-lg font-medium text-surface-200">No companies found</p>
          <p className="text-sm mt-1">Try resetting search query or adjusting CGPA filter settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((company, i) => {
            const minCutoff = parseFloat(company.min_cgpa || 0);
            const eligible = isEligible(minCutoff);
            const deficit = (minCutoff - studentCgpa).toFixed(2);
            const isExpanded = expandedCriteriaId === company.id;

            return (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card p-6 flex flex-col relative overflow-hidden transition-all border ${
                  eligible
                    ? 'hover:border-emerald-500/40 border-emerald-500/20 bg-gradient-to-b from-surface-900/80 via-surface-900/60 to-emerald-950/10'
                    : 'hover:border-rose-500/40 border-rose-500/20 bg-gradient-to-b from-surface-900/80 via-surface-900/60 to-rose-950/10 opacity-90'
                }`}
              >
                {/* Top Header: Logo + Eligibility Pill */}
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface-800/80 flex items-center justify-center border border-white/10 overflow-hidden shrink-0 shadow-inner">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={28} className="text-primary-400" />
                    )}
                  </div>

                  {/* Dynamic Eligibility Badge */}
                  <div className="text-right">
                    {eligible ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
                        <CheckCircle2 size={14} /> Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40 shadow-sm shadow-rose-500/10">
                        <XCircle size={14} /> Need +{deficit} CGPA
                      </span>
                    )}
                  </div>
                </div>

                {/* Company Name & Industry */}
                <h3 className="text-xl font-bold text-surface-200">{company.name}</h3>
                <p className="text-xs text-primary-400 font-semibold uppercase tracking-wider mb-3">
                  {company.industry || 'Tech & Enterprise'}
                </p>

                {/* Key Placement Info Pills */}
                <div className="space-y-2 mb-4">
                  {/* CGPA Requirement Row */}
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-surface-200/60 flex items-center gap-1.5 font-medium">
                      <Award size={14} className="text-primary-400" /> Min CGPA Cutoff
                    </span>
                    <span className={`font-bold ${eligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {minCutoff > 0 ? `${minCutoff.toFixed(2)} / 10.0` : 'No CGPA Cutoff'}
                    </span>
                  </div>

                  {/* Package Row */}
                  {company.package && (
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-surface-200/60 flex items-center gap-1.5 font-medium">
                        <DollarSign size={14} className="text-emerald-400" /> CTC Package
                      </span>
                      <span className="font-bold text-emerald-400">{company.package}</span>
                    </div>
                  )}

                  {/* Roles Row */}
                  {company.roles && (
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-surface-200/60 flex items-center gap-1.5 font-medium">
                        <Briefcase size={14} className="text-accent-400" /> Hiring Roles
                      </span>
                      <span className="font-bold text-surface-200 truncate max-w-[150px]">{company.roles}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-surface-200/70 line-clamp-2 mb-4 flex-1">
                  {company.description || 'Verified placement partner company hiring from campus.'}
                </p>

                {/* Expandable Criteria Snippet */}
                {company.eligibility_criteria && (
                  <div className="mb-4">
                    <button
                      onClick={() => setExpandedCriteriaId(isExpanded ? null : company.id)}
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <FileText size={12} />
                      {isExpanded ? 'Hide Criteria' : 'View Detailed Criteria'}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-surface-200/80 space-y-1"
                        >
                          <p className="font-semibold text-primary-300">Eligibility & Policy:</p>
                          <p className="whitespace-pre-wrap">{company.eligibility_criteria}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2 mt-auto text-xs">
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-surface-200/50 hover:text-surface-200 transition-colors"
                    >
                      <Globe size={13} /> Website
                    </a>
                  ) : <span />}

                  <Link
                    to={`/experiences?search=${encodeURIComponent(company.name)}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-300 font-medium transition-colors border border-primary-500/20"
                  >
                    <MessageSquare size={13} /> View Experiences
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
