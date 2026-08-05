// ============================================
// Global Experience Portal Page
// ============================================
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { experienceAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/skeletons/Skeletons';
import { useForm } from 'react-hook-form';
import {
  MessageSquare, Plus, Search, Heart, Bookmark, ChevronDown, ChevronUp,
  Award, CheckCircle2, XCircle, DollarSign
} from 'lucide-react';
import { DIFFICULTY_OPTIONS, timeAgo } from '../utils/constants';
import toast from 'react-hot-toast';

export default function ExperiencePortal() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [studentCgpa, setStudentCgpa] = useState(user?.cgpa ? parseFloat(user.cgpa) : null);
  const [expandedId, setExpandedId] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    fetchExperiences();
  }, [search]);

  const fetchUserData = async () => {
    try {
      const { data } = await authAPI.getMe();
      if (data?.user?.cgpa) {
        setStudentCgpa(parseFloat(data.user.cgpa));
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchExperiences = async () => {
    try {
      const { data } = await experienceAPI.getAll({ search, limit: 50 });
      setExperiences(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch experiences');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      await experienceAPI.create(formData);
      toast.success('Experience shared!');
      setModalOpen(false);
      reset();
      fetchExperiences();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share');
    }
  };

  const handleLike = async (id) => {
    try {
      const { data } = await experienceAPI.toggleLike(id);
      setExperiences(prev => prev.map(e =>
        e.id === id ? { ...e, is_liked: data.liked, likes_count: data.liked ? e.likes_count + 1 : e.likes_count - 1 } : e
      ));
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleBookmark = async (id) => {
    try {
      const { data } = await experienceAPI.toggleBookmark(id);
      setExperiences(prev => prev.map(e =>
        e.id === id ? { ...e, is_bookmarked: data.bookmarked } : e
      ));
      toast.success(data.bookmarked ? 'Bookmarked!' : 'Removed bookmark');
    } catch (error) {
      toast.error('Failed to bookmark');
    }
  };

  const getDiffColor = (d) => DIFFICULTY_OPTIONS.find(o => o.value === d)?.color || '#6B7280';

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-200">Global Experience Portal</h1>
          <p className="text-surface-200/50 mt-1">
            Explore verified placement experiences & check company CGPA requirements.
          </p>
        </div>
        <button onClick={() => { reset(); setModalOpen(true); }} className="btn-primary">
          <Plus size={20} /> Share Experience
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-200/40" />
        <input
          type="text"
          placeholder="Search company, role, or questions..."
          className="input-field pl-11"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {experiences.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No experiences shared yet" description="Be the first to share your placement experience!" />
      ) : (
        <div className="space-y-4">
          {experiences.map((exp, i) => {
            const minCgpa = exp.company_min_cgpa ? parseFloat(exp.company_min_cgpa) : null;
            const isEligible = studentCgpa !== null && minCgpa !== null ? studentCgpa >= minCgpa : null;

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card overflow-hidden border border-white/10 hover:border-white/20 transition-all"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center overflow-hidden shrink-0">
                        {exp.company_logo ? (
                          <img src={exp.company_logo} alt={exp.company_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-lg">{exp.company_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-surface-200">{exp.company_name}</h3>
                          {exp.company_package && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1 border border-emerald-500/30">
                              <DollarSign size={12} /> {exp.company_package}
                            </span>
                          )}
                          {minCgpa !== null && (
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
                                isEligible === false
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-primary-500/20 text-primary-300 border-primary-500/30'
                              }`}
                            >
                              <Award size={12} /> Cutoff: {minCgpa.toFixed(2)} CGPA
                              {isEligible === true && <CheckCircle2 size={12} className="text-emerald-400" />}
                              {isEligible === false && <XCircle size={12} className="text-rose-400" />}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-200/50 mt-1">
                          {exp.author_name || 'Anonymous'} • {timeAgo(exp.created_at)}
                          {exp.role && ` • ${exp.role}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2.5 py-1 rounded-lg capitalize font-medium"
                        style={{ background: `${getDiffColor(exp.difficulty)}20`, color: getDiffColor(exp.difficulty) }}
                      >
                        {exp.difficulty?.replace('_', ' ')}
                      </span>
                      {expandedId === exp.id ? (
                        <ChevronUp size={18} className="text-surface-200/40" />
                      ) : (
                        <ChevronDown size={18} className="text-surface-200/40" />
                      )}
                    </div>
                  </div>

                  {exp.experience && (
                    <p className="text-sm text-surface-200/70 mt-3 line-clamp-2">{exp.experience}</p>
                  )}
                </div>

                <AnimatePresence>
                  {expandedId === exp.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-black/20"
                    >
                      <div className="p-5 space-y-4">
                        {exp.rounds && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-400 mb-1">Rounds Cleared</h4>
                            <p className="text-sm text-surface-200/80 whitespace-pre-wrap">{exp.rounds}</p>
                          </div>
                        )}
                        {exp.questions && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-400 mb-1">Interview Questions</h4>
                            <p className="text-sm text-surface-200/80 whitespace-pre-wrap">{exp.questions}</p>
                          </div>
                        )}
                        {exp.tips && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">Preparation Tips</h4>
                            <p className="text-sm text-surface-200/80 whitespace-pre-wrap">{exp.tips}</p>
                          </div>
                        )}
                        {exp.experience && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">Full Detailed Experience</h4>
                            <p className="text-sm text-surface-200/80 whitespace-pre-wrap">{exp.experience}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Buttons */}
                <div className="px-5 py-3 border-t border-white/5 flex items-center gap-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLike(exp.id); }}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
                      exp.is_liked ? 'text-rose-400' : 'text-surface-200/40 hover:text-rose-400'
                    }`}
                  >
                    <Heart size={16} fill={exp.is_liked ? 'currentColor' : 'none'} /> {exp.likes_count || 0}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBookmark(exp.id); }}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
                      exp.is_bookmarked ? 'text-primary-400' : 'text-surface-200/40 hover:text-primary-400'
                    }`}
                  >
                    <Bookmark size={16} fill={exp.is_bookmarked ? 'currentColor' : 'none'} /> {exp.is_bookmarked ? 'Saved' : 'Save'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Share Experience Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Share Your Interview Experience" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Company Name *</label>
              <input className="input-field" placeholder="e.g. Google, Microsoft" {...register('company_name', { required: 'Required' })} />
              {errors.company_name && <p className="text-rose-400 text-xs mt-1">{errors.company_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Role</label>
              <input className="input-field" placeholder="e.g. Software Engineer" {...register('role')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Difficulty Level</label>
              <select className="input-field" {...register('difficulty')}>
                {DIFFICULTY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-3">
                <input type="checkbox" defaultChecked {...register('is_anonymous')} className="w-4 h-4 accent-primary-500" />
                <span className="text-sm text-surface-200/70">Post Anonymously</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Rounds</label>
            <textarea rows={2} className="input-field" placeholder="e.g., Round 1: OA, Round 2: DSA & System Design, Round 3: HR" {...register('rounds')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Questions Asked</label>
            <textarea rows={3} className="input-field" placeholder="Share coding problems, DSA topics, or conceptual questions..." {...register('questions')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Preparation Tips</label>
            <textarea rows={2} className="input-field" placeholder="Advice on topics to prepare or key takeaways..." {...register('tips')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Full Detailed Experience</label>
            <textarea rows={3} className="input-field" placeholder="Overall experience, interview atmosphere, feedback..." {...register('experience')} />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 font-bold">Share Experience</button>
        </form>
      </Modal>
    </div>
  );
}
