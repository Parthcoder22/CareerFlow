// ============================================
// Dashboard Layout (Sidebar + Content Area)
// ============================================
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen" style={{ background: '#000000', color: '#ededed' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '8px',
            fontSize: '0.9rem'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#000' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#000' } },
        }}
      />
      <Sidebar />
      <main className="lg:ml-64 min-h-screen p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative">
        {/* Subtle background glow for the main content area */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.03] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)' }} />
        
        <Outlet />
      </main>
    </div>
  );
}
