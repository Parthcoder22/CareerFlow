// ============================================
// Sidebar Navigation - College T&P System
// ============================================
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, FileText,
  Brain, Bell, User, LogOut,
  MessageSquare, BarChart3, X, Menu, Users, Briefcase, CheckSquare, LineChart
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const studentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/companies', icon: Building2, label: 'Campus Drives' },
    { to: '/applications', icon: Briefcase, label: 'My Applications' },
    { to: '/resumes', icon: FileText, label: 'Resume Manager' },
    { to: '/ai-analyzer', icon: Brain, label: 'AI ATS Scanner' },
    { to: '/experiences', icon: MessageSquare, label: 'Experiences' },
    { to: '/profile', icon: User, label: 'My Profile' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'T&P Dashboard' },
    { to: '/admin/companies', icon: Building2, label: 'Placement Drives' },
    { to: '/admin/applications', icon: CheckSquare, label: 'Student Applications' },
    { to: '/admin/students', icon: Users, label: 'Student Directory' },
    { to: '/admin/analytics', icon: LineChart, label: 'Placement Analytics' },
    { to: '/experiences', icon: MessageSquare, label: 'Experiences' },
    { to: '/profile', icon: User, label: 'Admin Profile' },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg border"
        style={{ background: '#0a0a0a', borderColor: '#333', color: '#ededed' }}
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 border-r
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#000000', borderColor: '#222' }}
      >
        <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: '#222' }}>
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard')}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)', borderColor: '#333' }}>
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>CF</span>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white">CareerFlow</h1>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
                {user?.role === 'admin' ? 'T&P Cell Authority' : 'Placement Portal'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden" style={{ color: '#888' }}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <p className="px-3 text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: '#555' }}>
            {user?.role === 'admin' ? 'Placement Operations' : 'Student Navigation'}
          </p>
          <ul className="space-y-1">
            {links.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/dashboard' || to === '/admin'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={({ isActive }) => isActive
                    ? { background: '#111', color: '#ededed', borderLeft: '3px solid #10b981' }
                    : { color: '#888' }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} style={{ color: isActive ? '#10b981' : '#666' }} />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t" style={{ borderColor: '#222' }}>
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500 text-black font-semibold text-sm">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs truncate" style={{ color: '#666' }}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#111]"
            style={{ color: '#888' }}
          >
            <LogOut size={18} style={{ color: '#666' }} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
