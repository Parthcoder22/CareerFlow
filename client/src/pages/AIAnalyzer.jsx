// ============================================
// AIAnalyzer.jsx - AI Resume Analyzer & ATS Scanner
// ============================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI, resumeAPI, companyAPI } from '../services/api';
import {
  Brain, Loader2, Sparkles, CheckCircle2, XCircle, AlertTriangle,
  FileText, Building2, Briefcase, Zap, ArrowRight, BookOpen,
  HelpCircle, RefreshCw, ShieldCheck, ChevronRight, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIAnalyzer() {
  const [resumes, setResumes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [useManualText, setUseManualText] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [resumesRes, companiesRes] = await Promise.all([
        resumeAPI.getAll().catch(() => ({ data: { data: [] } })),
        companyAPI.getAll().catch(() => ({ data: { data: [] } })),
      ]);

      // Parse Resumes
      const rawRes = resumesRes.data?.data;
      const resumeList = Array.isArray(rawRes) ? rawRes : rawRes?.resumes || [];
      setResumes(resumeList);

      // Parse Companies
      const rawComp = companiesRes.data?.data;
      const compList = Array.isArray(rawComp) ? rawComp : [];
      setCompanies(compList);

      // Set default resume
      if (resumeList.length > 0) {
        setSelectedResumeId(resumeList[0].id);
      } else {
        setUseManualText(true);
      }

      // If companies available, default to first company drive
      if (compList.length > 0) {
        applyCompanyData(compList[0]);
      }
    } catch {
      // Non-blocking
    } finally {
      setFetchingData(false);
    }
  };

  const applyCompanyData = (comp) => {
    if (!comp) return;
    setSelectedCompanyId(comp.id);
    setIsCustomCompany(false);
    setTargetCompany(comp.name);
    setTargetRole(comp.roles || 'Software Development Engineer');

    // Synthesize comprehensive description from drive details
    const compiledDescription = [
      comp.job_description || comp.description || '',
      comp.roles ? `Target Role: ${comp.roles}` : '',
      comp.min_cgpa ? `Eligibility Cutoff: Minimum ${comp.min_cgpa} CGPA` : '',
      comp.eligibility_criteria ? `Eligibility Criteria: ${comp.eligibility_criteria}` : '',
      comp.package ? `Package Details: ${comp.package}` : '',
      comp.location ? `Job Location: ${comp.location}` : '',
    ].filter(Boolean).join('\n\n');

    setJobDescription(compiledDescription);
  };

  const handleCompanySelectChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomCompany(true);
      setSelectedCompanyId('custom');
      setTargetCompany('');
      setTargetRole('');
      setJobDescription('');
    } else {
      const comp = companies.find(c => c.id === val);
      if (comp) {
        applyCompanyData(comp);
        toast.success(`Loaded details from ${comp.name} drive`, { duration: 1800 });
      }
    }
  };

  const handleResumeSelect = (e) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    const chosen = resumes.find(r => r.id === id);
    if (chosen && chosen.target_company && !targetCompany) {
      setTargetCompany(chosen.target_company);
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();

    const compName = targetCompany.trim();
    const roleName = targetRole.trim();
    const jdText = jobDescription.trim();

    if (!compName && !jdText) {
      return toast.error('Please select a campus company drive or enter a target company / description.');
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        resume_id: useManualText ? null : selectedResumeId,
        target_company: compName || 'Campus Placement Drive',
        role: roleName || 'Software Development Engineer',
        job_description: jdText,
        resume_text: useManualText ? resumeText.trim() : '',
      };

      const res = await aiAPI.analyzeResume(payload);
      setResult(res.data.data);
      toast.success('ATS resume analysis generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-surface-200 flex items-center gap-3">
          <Brain className="text-primary-400" /> AI Resume Analyzer & ATS Scanner
        </h1>
        <p className="text-surface-200/50 mt-1">
          Scan your resume directly against official campus placement drives. Get ATS match scores, missing skills, keyword gap analysis, and STAR-format bullet point rewrites.
        </p>
      </div>

      {/* Input Section */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <form onSubmit={handleAnalyze} className="space-y-5">
          

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Resume Selection */}
            <div>
              <label className="block text-xs font-semibold text-surface-200/70 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Select Resume</span>
                {resumes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseManualText(!useManualText)}
                    className="text-xs text-primary-400 hover:underline normal-case font-normal"
                  >
                    {useManualText ? 'Use uploaded' : 'Paste highlights'}
                  </button>
                )}
              </label>

              {!useManualText && resumes.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedResumeId}
                    onChange={handleResumeSelect}
                    className="input-field appearance-none cursor-pointer"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id} className="bg-surface-800 text-surface-100">
                        {r.name} {r.target_company ? `(${r.target_company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. My SDE Resume v2"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="input-field"
                />
              )}
            </div>

            {/* Target Company (Dropdown + Custom input) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-surface-200/70 uppercase tracking-wider">
                  Target Company
                </label>
                {companies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCustomCompany) {
                        setIsCustomCompany(true);
                        setSelectedCompanyId('custom');
                        setTargetCompany('');
                        setTargetRole('');
                        setJobDescription('');
                      } else {
                        setIsCustomCompany(false);
                        applyCompanyData(companies[0]);
                      }
                    }}
                    className="text-xs text-primary-400 hover:underline font-normal"
                  >
                    {isCustomCompany ? 'Choose campus drive' : 'Custom company'}
                  </button>
                )}
              </div>
              {!isCustomCompany && companies.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedCompanyId}
                    onChange={handleCompanySelectChange}
                    className="input-field appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Select Campus Company Drive --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id} className="bg-surface-800 text-surface-100">
                        {c.name} {c.roles ? `(${c.roles})` : ''}
                      </option>
                    ))}
                    <option value="custom" className="bg-surface-800 text-primary-400 font-semibold">
                      ➕ Custom / Other Company...
                    </option>
                  </select>
                </div>
              ) : (
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-3 text-surface-200/40" />
                  <input
                    type="text"
                    placeholder="e.g. Google, Microsoft, NJ, TCS"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              )}
            </div>

            {/* Target Role */}
            <div>
              <label className="block text-xs font-semibold text-surface-200/70 uppercase tracking-wider mb-2">
                Target Job Role
              </label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3.5 top-3 text-surface-200/40" />
                <input
                  type="text"
                  placeholder="e.g. Software Development Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Job Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-surface-200/70 uppercase tracking-wider">
                  Job Description / Drive Reference
                </label>
                {selectedCompanyId && selectedCompanyId !== 'custom' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    ✓ Auto-linked from {targetCompany} drive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedCompanyId && selectedCompanyId !== 'custom' && (
                  <button
                    type="button"
                    onClick={() => {
                      const comp = companies.find(c => c.id === selectedCompanyId);
                      if (comp) applyCompanyData(comp);
                    }}
                    className="text-xs text-primary-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={11} /> Reset to drive specs
                  </button>
                )}
                <span className="text-xs text-surface-200/40">{jobDescription.length} characters</span>
              </div>
            </div>
            
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Company drive details are auto-loaded above. You can also paste or customize the job description and eligibility criteria here..."
              className="input-field font-sans text-xs leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-surface-200/50 hidden sm:block">
              {targetCompany 
                ? `AI will cross-reference your resume with ${targetCompany}'s hiring profile & technical requirements.`
                : 'AI evaluates syntax, keyword density, technical competencies, and impact metrics.'}
            </p>
            <button
              type="submit"
              disabled={loading || (!targetCompany.trim() && !jobDescription.trim())}
              className="btn-primary flex items-center gap-2 px-6 ml-auto shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Scanning with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Run ATS Scanner</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Loading Animation */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 animate-pulse-glow">
            <Brain size={32} className="text-white animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-surface-200">Evaluating Resume & Job Description</h3>
          <p className="text-surface-200/50 text-sm mt-1">Cross-referencing industry keywords, ATS parsing benchmarks, and technical requirements...</p>
        </div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Top Score Banner */}
            <div className="glass-card p-6 border-l-4 border-l-primary-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-primary-500/20 text-primary-400">
                      {result.match_level || 'Good Match'}
                    </span>
                    <span className="text-xs text-surface-200/50">Target: {targetCompany || 'Campus Drive'} — {targetRole || 'Software Engineer'}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-surface-200 mt-2">Resume Fit & ATS Alignment</h2>
                  <p className="text-sm text-surface-200/70 mt-1 max-w-2xl">{result.summary}</p>
                </div>

                {/* Score Circular Badge */}
                <div className="flex items-center gap-4 flex-shrink-0 bg-surface-800/80 px-5 py-3 rounded-2xl border border-white/5">
                  <div className="text-center">
                    <span className={`text-4xl font-extrabold ${
                      result.match_score >= 80 ? 'text-success' : result.match_score >= 65 ? 'text-warning' : 'text-danger'
                    }`}>
                      {result.match_score}%
                    </span>
                    <p className="text-[10px] text-surface-200/40 uppercase font-semibold mt-0.5">ATS Match Score</p>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="text-xs text-surface-200/60 max-w-[120px]">
                    {result.match_score >= 80
                      ? 'High likelihood of passing automated ATS filters.'
                      : 'Recommended to address missing keywords before applying.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Skills & Keywords Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Matching Skills */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-surface-200 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-success" />
                  <span>Matching Skills & Strengths ({result.matching_skills?.length || 0})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.matching_skills?.map((item, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-success/10 text-success border border-success/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={12} />
                      <span>{item.skill || item}</span>
                      {item.strength && <span className="opacity-60 text-[10px]">({item.strength})</span>}
                    </span>
                  ))}
                  {(!result.matching_skills || result.matching_skills.length === 0) && (
                    <p className="text-xs text-surface-200/40 italic">No direct matching skills detected.</p>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-surface-200 mb-4 flex items-center gap-2">
                  <XCircle size={18} className="text-danger" />
                  <span>Missing Skills in Resume ({result.missing_skills?.length || 0})</span>
                </h3>
                <div className="space-y-2.5">
                  {result.missing_skills?.map((item, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-danger/5 border border-danger/15 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-danger">{item.skill || item}</p>
                        {item.recommendation && (
                          <p className="text-[11px] text-surface-200/60 mt-0.5">{item.recommendation}</p>
                        )}
                      </div>
                      {item.importance && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-danger/20 text-danger flex-shrink-0">
                          {item.importance}
                        </span>
                      )}
                    </div>
                  ))}
                  {(!result.missing_skills || result.missing_skills.length === 0) && (
                    <p className="text-xs text-surface-200/40 italic">All essential core skills matched!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Keyword Match Density */}
            {result.important_keywords?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-surface-200 mb-3 flex items-center gap-2">
                  <Zap size={18} className="text-warning" />
                  <span>Important JD Keywords Scan</span>
                </h3>
                <p className="text-xs text-surface-200/50 mb-4">
                  Recruiters and campus automated screening engines scan for these exact phrases.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {result.important_keywords.map((kw, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        kw.in_resume
                          ? 'bg-success/5 border-success/20 text-success'
                          : 'bg-surface-800/60 border-white/5 text-surface-200/50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        {kw.in_resume ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} className="text-warning" />}
                        <span className="text-xs font-semibold text-surface-200">{kw.keyword || kw}</span>
                      </div>
                      <span className="text-[10px] block opacity-70">
                        {kw.in_resume ? 'Found in resume' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weak Bullet Points & AI Improvements */}
            {result.weak_bullet_points?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-surface-200 mb-2 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-400" />
                  <span>Weak Bullet Point Rewrites (STAR Method)</span>
                </h3>
                <p className="text-xs text-surface-200/50 mb-5">
                  Replace passive or unquantified project descriptions with metrics-driven action verbs.
                </p>

                <div className="space-y-4">
                  {result.weak_bullet_points.map((bp, i) => (
                    <div key={i} className="p-4 rounded-xl bg-surface-800/80 border border-white/5 space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-danger bg-danger/10 px-2 py-0.5 rounded">
                          Before / Current
                        </span>
                        <p className="text-xs text-surface-200/70 mt-1 italic line-through opacity-75">
                          "{bp.original}"
                        </p>
                        {bp.critique && (
                          <p className="text-[11px] text-warning mt-1 flex items-center gap-1">
                            <AlertTriangle size={11} /> {bp.critique}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <span className="text-[10px] uppercase font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                          AI Suggested Rewrite
                        </span>
                        <p className="text-xs font-medium text-surface-100 mt-1.5 leading-relaxed bg-primary-500/5 p-3 rounded-lg border border-primary-500/20">
                          {bp.suggested}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Sections & ATS Optimization Suggestions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Missing Sections */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-surface-200 mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-info" />
                  <span>Resume Completeness & Missing Sections</span>
                </h3>
                <div className="space-y-2">
                  {result.missing_sections?.map((sec, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 text-xs text-surface-200/80">
                      <ChevronRight size={14} className="text-info flex-shrink-0 mt-0.5" />
                      <span>{sec}</span>
                    </div>
                  ))}
                  {(!result.missing_sections || result.missing_sections.length === 0) && (
                    <p className="text-xs text-surface-200/40">All standard resume sections are well formed.</p>
                  )}
                </div>
              </div>

              {/* ATS Formatting & Optimization Tips */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-surface-200 mb-3 flex items-center gap-2">
                  <Zap size={18} className="text-warning" />
                  <span>ATS Engine Optimization Tips</span>
                </h3>
                <div className="space-y-2">
                  {result.ats_optimization_tips?.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/5 border border-warning/10 text-xs text-surface-200/80">
                      <span className="text-warning font-bold">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                  {(!result.ats_optimization_tips || result.ats_optimization_tips.length === 0) && (
                    <p className="text-xs text-surface-200/40">Your layout aligns with standard ATS guidelines.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role-Specific Preparation Roadmap */}
            {result.preparation_suggestions?.length > 0 && (
              <div className="glass-card p-6 border-t-2 border-t-primary-500">
                <h3 className="text-base font-semibold text-surface-200 mb-2 flex items-center gap-2">
                  <BookOpen size={18} className="text-primary-400" />
                  <span>Interview Preparation Roadmap for this Drive</span>
                </h3>
                <p className="text-xs text-surface-200/50 mb-4">
                  Focused study points for upcoming online assessments and technical rounds.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.preparation_suggestions.map((prep, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-surface-800/80 border border-white/5">
                      <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold mb-2">
                        {i + 1}
                      </div>
                      <p className="text-xs text-surface-200/80 leading-relaxed">{prep}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
