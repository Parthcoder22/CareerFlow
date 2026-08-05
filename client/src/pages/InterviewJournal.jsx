// ============================================
// Interview Journal Page
// ============================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { interviewAPI } from '../services/api';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/skeletons/Skeletons';
import { useForm } from 'react-hook-form';
import { BookOpen, Plus, Edit, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { DIFFICULTY_OPTIONS, formatDate } from '../utils/constants';
import toast from 'react-hot-toast';

export default function InterviewJournal() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => { fetchNotes(); }, [search]);

  const fetchNotes = async () => {
    try {
      const { data } = await interviewAPI.getAll({ search, limit: 50 });
      setNotes(data.data);
    } catch (error) {
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      if (editingNote) {
        await interviewAPI.update(editingNote.id, formData);
        toast.success('Note updated!');
      } else {
        await interviewAPI.create(formData);
        toast.success('Note saved!');
      }
      setModalOpen(false);
      setEditingNote(null);
      reset();
      fetchNotes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await interviewAPI.delete(id);
      toast.success('Note deleted');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (note) => {
    setEditingNote(note);
    Object.keys(note).forEach(key => {
      if (key === 'interview_date') {
        setValue(key, note[key] ? new Date(note[key]).toISOString().split('T')[0] : '');
      } else {
        setValue(key, note[key] || '');
      }
    });
    setModalOpen(true);
  };

  const getDifficultyColor = (d) => DIFFICULTY_OPTIONS.find(o => o.value === d)?.color || '#6B7280';

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-200">Interview Journal</h1>
          <p className="text-surface-200/50 mt-1">Record and review your interview experiences.</p>
        </div>
        <button onClick={() => { setEditingNote(null); reset(); setModalOpen(true); }} className="btn-primary">
          <Plus size={20} /> Add Note
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-200/40" />
        <input
          type="text"
          placeholder="Search by company, round, questions..."
          className="input-field pl-11"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No interview notes"
          description="After your next interview, save your experience here for future reference."
          action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={20} /> Add Note</button>}
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {notes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card overflow-hidden"
              >
                {/* Header - always visible */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <span className="text-white font-bold">{note.company_name?.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-200">{note.company_name}</h3>
                      <p className="text-sm text-surface-200/50">{note.round} • {formatDate(note.interview_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-lg"
                      style={{ background: `${getDifficultyColor(note.difficulty)}20`, color: getDifficultyColor(note.difficulty) }}
                    >
                      {note.difficulty?.replace('_', ' ')}
                    </span>
                    {expandedId === note.id ? <ChevronUp size={18} className="text-surface-200/40" /> : <ChevronDown size={18} className="text-surface-200/40" />}
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {expandedId === note.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5"
                    >
                      <div className="p-5 space-y-4">
                        {note.questions && (
                          <div>
                            <h4 className="text-sm font-semibold text-primary-400 mb-1">Questions Asked</h4>
                            <p className="text-sm text-surface-200/70 whitespace-pre-wrap">{note.questions}</p>
                          </div>
                        )}
                        {note.experience && (
                          <div>
                            <h4 className="text-sm font-semibold text-accent-400 mb-1">Experience</h4>
                            <p className="text-sm text-surface-200/70 whitespace-pre-wrap">{note.experience}</p>
                          </div>
                        )}
                        {note.mistakes && (
                          <div>
                            <h4 className="text-sm font-semibold text-danger mb-1">Mistakes</h4>
                            <p className="text-sm text-surface-200/70 whitespace-pre-wrap">{note.mistakes}</p>
                          </div>
                        )}
                        {note.feedback && (
                          <div>
                            <h4 className="text-sm font-semibold text-success mb-1">Feedback</h4>
                            <p className="text-sm text-surface-200/70 whitespace-pre-wrap">{note.feedback}</p>
                          </div>
                        )}
                        {note.topics_to_revise && (
                          <div>
                            <h4 className="text-sm font-semibold text-warning mb-1">Topics to Revise</h4>
                            <p className="text-sm text-surface-200/70 whitespace-pre-wrap">{note.topics_to_revise}</p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => openEdit(note)} className="btn-secondary py-2 text-sm"><Edit size={16} /> Edit</button>
                          <button onClick={() => handleDelete(note.id)} className="btn-danger py-2 text-sm"><Trash2 size={16} /> Delete</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title={editingNote ? 'Edit Note' : 'Add Interview Note'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Company *</label>
              <input className="input-field" {...register('company_name', { required: 'Required' })} />
              {errors.company_name && <p className="text-danger text-xs mt-1">{errors.company_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Round *</label>
              <input className="input-field" placeholder="e.g., Technical Round 1" {...register('round', { required: 'Required' })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Interview Date *</label>
              <input type="date" className="input-field" {...register('interview_date', { required: 'Required' })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Difficulty</label>
              <select className="input-field" {...register('difficulty')}>
                {DIFFICULTY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Questions Asked</label>
            <textarea rows={3} className="input-field" placeholder="List the questions..." {...register('questions')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Experience</label>
            <textarea rows={2} className="input-field" placeholder="How did it go?" {...register('experience')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Mistakes</label>
            <textarea rows={2} className="input-field" placeholder="What went wrong?" {...register('mistakes')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Feedback</label>
            <textarea rows={2} className="input-field" placeholder="Interviewer feedback..." {...register('feedback')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Topics to Revise</label>
            <textarea rows={2} className="input-field" placeholder="Things to study..." {...register('topics_to_revise')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editingNote ? 'Update' : 'Save Note'}</button>
            <button type="button" onClick={() => { setModalOpen(false); reset(); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
