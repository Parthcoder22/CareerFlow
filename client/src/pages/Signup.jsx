// ============================================
// Signup Page - SaaS Design
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      await signup(data);
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      let msg = 'Signup failed. Please try again.';
      if (error.response?.data?.errors?.length) {
        msg = error.response.data.errors.map(e => e.message).join('. ');
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: '#0a0a0a', borderColor: '#333', fontSize: '0.95rem' };
  const handleFocus = (e) => { e.target.style.borderColor = '#666'; };
  const handleBlur = (e) => { e.target.style.borderColor = '#333'; };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: '#000000', color: '#ededed' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333' } }} />

      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(120,119,198,1) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10 relative"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-6 group transition-transform hover:scale-105">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)', borderColor: '#333' }}>
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>CF</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">CareerFlow</span>
          </Link>
          <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">Create an account</h2>
          <p className="text-sm" style={{ color: '#888' }}>Enter your details to get started</p>
        </div>

        <div className="p-8 rounded-2xl border" style={{ background: 'rgba(10, 10, 10, 0.6)', borderColor: '#222', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <AnimatePresence>
              {serverError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-3 rounded-lg flex items-center gap-3 text-sm border mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{serverError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Full Name *</label>
              <input type="text" className="w-full px-4 py-2.5 rounded-lg text-white outline-none transition-all duration-200 border" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="John Doe"
                {...register('full_name', { required: 'Full name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })} />
              {errors.full_name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Email *</label>
              <input type="email" className="w-full px-4 py-2.5 rounded-lg text-white outline-none transition-all duration-200 border" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="name@example.com"
                {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email is required' } })} />
              {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Password *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="w-full px-4 py-2.5 pr-10 rounded-lg text-white outline-none transition-all duration-200 border" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="e.g. Pass1234"
                  {...register('password', { 
                    required: 'Password is required', 
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Must include uppercase, lowercase, and a number'
                    }
                  })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#666' }} onMouseEnter={(e) => e.target.style.color = '#ededed'} onMouseLeave={(e) => e.target.style.color = '#666'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] mt-1" style={{ color: '#666' }}>Must be 8+ chars with uppercase, lowercase & number (e.g. Pass1234)</p>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>College</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-lg text-white outline-none transition-all duration-200 border" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="MIT" {...register('college')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Branch</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-lg text-white outline-none transition-all duration-200 border" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="CS" {...register('branch')} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Graduation Year</label>
              <input type="number" className="w-full px-4 py-2.5 rounded-lg text-white outline-none transition-all duration-200 border" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} placeholder="2026"
                {...register('graduation_year', { min: { value: 2020, message: 'Invalid year' }, max: { value: 2035, message: 'Invalid year' } })} />
              {errors.graduation_year && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.graduation_year.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-black flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              style={{ background: '#ededed', fontSize: '0.95rem' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: '#888' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium transition-colors hover:underline" style={{ color: '#ededed' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
