// ============================================
// Profile Page
// ============================================
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Save, Loader2, Mail, Phone, GraduationCap, Globe } from 'lucide-react';
import { FiGithub, FiLinkedin } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await authAPI.getMe();
      setProfile(data.user);
      const u = data.user;
      setValue('full_name', u.full_name);
      setValue('college', u.college);
      setValue('branch', u.branch);
      setValue('graduation_year', u.graduation_year);
      setValue('cgpa', u.cgpa || '');
      setValue('phone', u.phone);
      setValue('linkedin_url', u.linkedin_url);
      setValue('github_url', u.github_url);
      setValue('portfolio_url', u.portfolio_url);
      setValue('bio', u.bio);
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await authAPI.updateProfile(formData);
      toast.success('Profile updated!');
      const { data } = await authAPI.getMe();
      updateUser(data.user);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-surface-200">Profile</h1>

      {/* Avatar + Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center">
          <span className="text-white text-4xl font-bold">{user?.full_name?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-2xl font-bold text-surface-200">{user?.full_name}</h2>
          <p className="text-surface-200/50 flex items-center gap-2 justify-center sm:justify-start mt-1">
            <Mail size={14} /> {user?.email}
          </p>
          <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
            <span className="text-xs px-3 py-1 rounded-full gradient-primary text-white capitalize">
              {user?.role}
            </span>
            {user?.cgpa && (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                CGPA: {parseFloat(user.cgpa).toFixed(2)} / 10.0
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8">
        <h3 className="text-lg font-semibold text-surface-200 mb-6">Edit Profile</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Full Name</label>
              <input className="input-field" {...register('full_name', { required: 'Required' })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Phone</label>
              <input className="input-field" placeholder="+91 XXXXXXXXXX" {...register('phone')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">College</label>
              <input className="input-field" {...register('college')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Branch</label>
              <input className="input-field" {...register('branch')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1">Graduation Year</label>
              <input type="number" className="input-field" {...register('graduation_year')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1 flex items-center justify-between">
                <span>CGPA (Out of 10.0)</span>
                <span className="text-xs text-primary-400">Used for Company Eligibility</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.45"
                className="input-field"
                {...register('cgpa', { min: 0, max: 10 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1 flex items-center gap-1"><FiLinkedin size={14} /> LinkedIn</label>
              <input className="input-field" placeholder="https://linkedin.com/in/..." {...register('linkedin_url')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1 flex items-center gap-1"><FiGithub size={14} /> GitHub</label>
              <input className="input-field" placeholder="https://github.com/..." {...register('github_url')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-200/70 mb-1 flex items-center gap-1"><Globe size={14} /> Portfolio</label>
              <input className="input-field" placeholder="https://..." {...register('portfolio_url')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-200/70 mb-1">Bio</label>
            <textarea rows={3} className="input-field" placeholder="Tell us about yourself..." {...register('bio')} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
