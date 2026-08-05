// ============================================
// AI JD Analyzer Page
// ============================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI } from '../services/api';
import {
  Brain, Loader2, Code, BookOpen, Lightbulb,
  Target, Rocket, GraduationCap, HelpCircle, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIAnalyzer() {
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (jd.trim().length < 50) {
      return toast.error('Please paste a more detailed job description (min 50 chars)');
    }

    setLoading(true);
    setResult(null);
    try {
      const { data } = await aiAPI.analyzeJD({ job_description: jd });
      setResult(data.data);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const sections = result ? [
    { icon: Briefcase, title: 'Job Summary', color: '#6366f1', content: result.job_summary },
    { icon: Code, title: 'Required Skills', color: '#8b5cf6', content: result.required_skills },
    { icon: Target, title: 'Missing Skills Tips', color: '#ef4444', content: result.missing_skills_tips },
    { icon: Lightbulb, title: 'Resume Improvements', color: '#f59e0b', content: result.resume_improvements },
    { icon: HelpCircle, title: 'Likely Interview Questions', color: '#06b6d4', content: result.likely_interview_questions },
    { icon: BookOpen, title: 'Topics to Study', color: '#10b981', content: result.topics_to_study },
    { icon: Rocket, title: 'Relevant Projects', color: '#ec4899', content: result.relevant_projects },
    { icon: GraduationCap, title: 'Learning Roadmap', color: '#f97316', content: result.learning_roadmap },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-200 flex items-center gap-3">
          <Brain className="text-primary-400" /> AI JD Analyzer
        </h1>
        <p className="text-surface-200/50 mt-1">Paste a job description and get AI-powered insights powered by Google Gemini.</p>
      </div>

      {/* Input Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <textarea
          rows={8}
          className="input-field mb-4"
          placeholder="Paste the full job description here...&#10;&#10;Example: We are looking for a Software Development Engineer with experience in React, Node.js, PostgreSQL..."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          id="jd-input"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-surface-200/40">{jd.length} characters</p>
          <button
            onClick={handleAnalyze}
            disabled={loading || jd.length < 50}
            className="btn-primary"
            id="analyze-btn"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Brain size={20} />}
            {loading ? 'Analyzing...' : 'Analyze JD'}
          </button>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 animate-pulse-glow">
            <Brain size={40} className="text-white" />
          </div>
          <p className="text-surface-200/60 text-lg">AI is analyzing your job description...</p>
          <p className="text-surface-200/40 text-sm mt-2">This may take 10-15 seconds</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Job Summary */}
            {result.job_summary && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <h3 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
                  <Briefcase size={20} style={{ color: '#6366f1' }} /> Job Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-surface-200/50">Role:</span> <span className="text-surface-200 ml-2">{result.job_summary.role}</span></div>
                  <div><span className="text-surface-200/50">Experience:</span> <span className="text-surface-200 ml-2 capitalize">{result.job_summary.experience_level}</span></div>
                  <div><span className="text-surface-200/50">Company Type:</span> <span className="text-surface-200 ml-2 capitalize">{result.job_summary.company_type}</span></div>
                </div>
                {result.job_summary.key_responsibilities?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-surface-200/50 mb-2">Key Responsibilities:</p>
                    <ul className="space-y-1">
                      {result.job_summary.key_responsibilities.map((r, i) => (
                        <li key={i} className="text-sm text-surface-200/70 flex items-start gap-2">
                          <span className="text-primary-400 mt-0.5">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {/* Required Skills */}
            {result.required_skills?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <h3 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
                  <Code size={20} style={{ color: '#8b5cf6' }} /> Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.required_skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-medium"
                      style={{
                        background: skill.level === 'advanced' ? 'rgba(239,68,68,0.15)' : skill.level === 'intermediate' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: skill.level === 'advanced' ? '#f87171' : skill.level === 'intermediate' ? '#fbbf24' : '#34d399',
                      }}>
                      {skill.skill} <span className="opacity-60 text-xs">({skill.level})</span>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Interview Questions */}
            {result.likely_interview_questions?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
                <h3 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
                  <HelpCircle size={20} style={{ color: '#06b6d4' }} /> Likely Interview Questions
                </h3>
                <div className="space-y-3">
                  {result.likely_interview_questions.map((q, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-surface-200 font-medium">{q.question}</p>
                        <span className="text-xs px-2 py-0.5 rounded-lg flex-shrink-0"
                          style={{
                            background: q.difficulty === 'hard' ? 'rgba(239,68,68,0.15)' : q.difficulty === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                            color: q.difficulty === 'hard' ? '#f87171' : q.difficulty === 'medium' ? '#fbbf24' : '#34d399',
                          }}>
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-surface-200/50 mt-2 capitalize">{q.category}</p>
                      {q.tip && <p className="text-xs text-primary-400/80 mt-1">💡 {q.tip}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Learning Roadmap */}
            {result.learning_roadmap?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
                <h3 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
                  <GraduationCap size={20} style={{ color: '#f97316' }} /> Learning Roadmap
                </h3>
                <div className="space-y-4">
                  {result.learning_roadmap.map((week, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        {i < result.learning_roadmap.length - 1 && <div className="w-0.5 flex-1 bg-primary-500/20 my-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-surface-200">{week.week}</p>
                        <p className="text-sm text-surface-200/60 mb-2">{week.focus}</p>
                        <ul className="space-y-1">
                          {week.tasks?.map((task, j) => (
                            <li key={j} className="text-xs text-surface-200/50 flex items-start gap-1">
                              <span className="text-primary-400">→</span> {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Resume Improvements */}
            {result.resume_improvements?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
                <h3 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
                  <Lightbulb size={20} style={{ color: '#f59e0b' }} /> Resume Improvements
                </h3>
                <div className="space-y-3">
                  {result.resume_improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                      <span className={`text-xs px-2 py-0.5 rounded-lg flex-shrink-0 ${
                        imp.priority === 'high' ? 'bg-danger/15 text-danger' : imp.priority === 'medium' ? 'bg-warning/15 text-warning' : 'bg-info/15 text-info'
                      }`}>{imp.priority}</span>
                      <div>
                        <p className="text-sm font-medium text-surface-200">{imp.section}</p>
                        <p className="text-xs text-surface-200/60 mt-1">{imp.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Projects */}
            {result.relevant_projects?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
                <h3 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
                  <Rocket size={20} style={{ color: '#ec4899' }} /> Relevant Projects to Build
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.relevant_projects.map((proj, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5">
                      <h4 className="font-semibold text-surface-200 mb-1">{proj.project_idea}</h4>
                      <p className="text-xs text-surface-200/60 mb-2">{proj.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {proj.skills_demonstrated?.map((s, j) => (
                          <span key={j} className="text-xs bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
