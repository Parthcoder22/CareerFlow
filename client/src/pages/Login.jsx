// ============================================
// Login Page - SaaS Design
// ============================================
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const from = location.state?.from?.pathname || '/dashboard';

  const fillDemo = (role) => {
    if (role === 'admin') {
      setValue('email', 'admin@careerflow.com');
      setValue('password', 'Admin@123');
    } else {
      setValue('email', 'student@careerflow.com');
      setValue('password', 'Student@123');
    }
    toast.success(`Loaded ${role === 'admin' ? 'Admin / TNP' : 'Student'} demo credentials!`, { duration: 2000 });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const result = await login(data);
      toast.success(`Welcome back, ${result.user.full_name}!`);
      navigate(result.user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (error) {
      let msg = 'Login failed. Please check your credentials and try again.';
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: '#000000', color: '#ededed' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333' } }} />

      {/* Ambient background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(120,119,198,1) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)' }} />

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
          <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">Welcome back</h2>
          <p className="text-sm" style={{ color: '#888' }}>Enter your details or choose a demo role below</p>
        </div>

        <div className="p-8 rounded-2xl border" style={{ background: 'rgba(10, 10, 10, 0.6)', borderColor: '#222', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Quick Demo Credentials Switcher */}
            <div className="space-y-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-200/50">Quick Demo Accounts (Click to Fill):</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('admin')}
                  className="p-2.5 rounded-lg border text-left transition-all hover:border-primary-500/50 active:scale-95 cursor-pointer"
                  style={{ background: '#111', borderColor: '#262626' }}
                >
                  <p className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <span>👑 Admin / TNP</span>
                  </p>
                  <p className="text-[11px] text-primary-400 font-mono mt-0.5 truncate">admin@careerflow.com</p>
                  <p className="text-[10px] text-surface-200/40">Pass: Admin@123</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo('student')}
                  className="p-2.5 rounded-lg border text-left transition-all hover:border-success/50 active:scale-95 cursor-pointer"
                  style={{ background: '#111', borderColor: '#262626' }}
                >
                  <p className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <span>🎓 Student</span>
                  </p>
                  <p className="text-[11px] text-emerald-400 font-mono mt-0.5 truncate">student@careerflow.com</p>
                  <p className="text-[10px] text-surface-200/40">Pass: Student@123</p>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-lg flex items-center gap-3 text-sm border" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{serverError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-lg text-white outline-none transition-all duration-200 border"
                style={{ background: '#0a0a0a', borderColor: '#333', fontSize: '0.95rem' }}
                onFocus={(e) => { e.target.style.borderColor = '#666'; }}
                onBlur={(e) => { e.target.style.borderColor = '#333'; }}
                placeholder="name@example.com"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email' }
                })}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg text-white outline-none transition-all duration-200 border"
                  style={{ background: '#0a0a0a', borderColor: '#333', fontSize: '0.95rem' }}
                  onFocus={(e) => { e.target.style.borderColor = '#666'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#333'; }}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#666' }}
                  onMouseEnter={(e) => e.target.style.color = '#ededed'}
                  onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-black cursor-pointer appearance-none checked:bg-white checked:border-white transition-all relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[4px] after:top-[1px] after:w-[6px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-black after:rotate-45" style={{ border: '1px solid #444' }} />
                <span className="text-sm select-none transition-colors" style={{ color: '#888' }} onMouseEnter={(e) => e.target.style.color = '#ccc'} onMouseLeave={(e) => e.target.style.color = '#888'}>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium transition-colors hover:underline" style={{ color: '#888' }} onMouseEnter={(e) => e.target.style.color = '#ededed'} onMouseLeave={(e) => e.target.style.color = '#888'}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-black flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              style={{ background: '#ededed', fontSize: '0.95rem' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: '#888' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium transition-colors hover:underline" style={{ color: '#ededed' }}>
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
