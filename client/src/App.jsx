// ============================================
// App.jsx - Main Application with TNP & Student Routing
// ============================================
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Public & Auth Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

// Student Pages
import Dashboard from './pages/Dashboard';
import StudentCompanies from './pages/StudentCompanies';
import Applications from './pages/Applications';
import ResumeManager from './pages/ResumeManager';
import AIAnalyzer from './pages/AIAnalyzer';

// Shared Pages
import ExperiencePortal from './pages/ExperiencePortal';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Admin / TNP Authority Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminStudents from './pages/AdminStudents';
import AdminCompanies from './pages/AdminCompanies';
import AdminApplications from './pages/AdminApplications';
import AdminAnalytics from './pages/AdminAnalytics';

function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#000000', color: '#ededed' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center border animate-pulse" style={{ background: '#111', borderColor: '#333' }}>
        <span className="text-white font-bold text-sm">CF</span>
      </div>
    </div>
  );
}

// Smart redirect: if logged in, route to respective role portal
function HomeRedirect() {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <AuthLoader />;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return <Landing />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <AuthLoader />;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

            {/* Student Protected Routes */}
            <Route element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/companies" element={<StudentCompanies />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/resumes" element={<ResumeManager />} />
              <Route path="/ai-analyzer" element={<AIAnalyzer />} />
              {/* Deprecated interview journal redirects cleanly to student dashboard */}
              <Route path="/interviews" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Admin / TNP Authority Protected Routes */}
            <Route element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin/companies" element={<AdminCompanies />} />
              <Route path="/admin/applications" element={<AdminApplications />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
            </Route>

            {/* Shared Protected Routes (Student & Admin) */}
            <Route element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/experiences" element={<ExperiencePortal />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
