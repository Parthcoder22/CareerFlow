// ============================================
// Student Dashboard - College Placement Portal
// ============================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import StatsCard from '../components/ui/StatsCard';
import { DashboardSkeleton } from '../components/skeletons/Skeletons';
import {
  FileText, Award, XCircle, TrendingUp, Clock,
  Briefcase, Building2, CheckCircle2, ShieldAlert,
  ChevronRight, ArrowUpRight, DollarSign, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.getStats();
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const personal = data?.personal || {};
  const college = data?.college_overview || {};
  const activeOpps = data?.active_opportunities || [];
  const recentApps = data?.recent_applications || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Candidate Portal
            </span>
            <span className="text-xs text-surface-200/40">• Class of 2026</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-surface-200/50 text-sm mt-1">
            Track your campus placement journey, drive eligibility, and hiring updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/companies" className="btn-primary text-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none text-white">
            <Building2 size={16} /> Browse Campus Drives
          </Link>
        </div>
      </div>

      {/* RESTRICTION WARNING BANNER (If Permission is False) */}
      {!personal.placement_permission && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3.5"
        >
          <ShieldAlert size={22} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-200">
              Placement Application Permission Restricted
            </h4>
            <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
              Your placement application privileges have been restricted by the Training & Placement Cell.
              {personal.restriction_reason && (
                <span className="block mt-1 font-semibold text-red-200">
                  Reason: "{personal.restriction_reason}"
                </span>
              )}
              You can still browse active campus drives and track your past submissions, but you cannot submit new applications. Please contact the T&P Cell if you believe this is an error.
            </p>
          </div>
        </motion.div>
      )}

      {/* Row 1: Student Personal Placement Status Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-surface-200/50 mb-3 flex items-center gap-2">
          <Briefcase size={14} className="text-emerald-400" /> My Placement Journey
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-black/40 border border-[#222]">
            <span className="text-xs text-surface-200/50 font-medium">Placement Status</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                personal.is_placed
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {personal.is_placed ? 'Placed 🎉' : 'Unplaced'}
              </span>
            </div>
            {personal.placed_company && (
              <span className="text-[10px] text-white font-semibold mt-1 block truncate">
                {personal.placed_company} ({personal.placed_package})
              </span>
            )}
          </div>

          <StatsCard
            title="Drives Available"
            value={personal.total_companies_available || 0}
            icon={Building2}
            color="#3b82f6"
            delay={0.05}
          />
          <StatsCard
            title="Drives Applied"
            value={personal.companies_applied || 0}
            icon={FileText}
            color="#6366f1"
            delay={0.1}
          />
          <StatsCard
            title="In Progress"
            value={personal.in_progress || 0}
            icon={Clock}
            color="#f59e0b"
            delay={0.15}
          />
          <StatsCard
            title="Offers Received"
            value={personal.selected || 0}
            icon={Award}
            color="#10b981"
            delay={0.2}
          />
          <StatsCard
            title="Rejected"
            value={personal.rejected || 0}
            icon={XCircle}
            color="#ef4444"
            delay={0.25}
          />
        </div>
      </div>

      {/* Row 2: College Placement Overview (Required Specification) */}
      <div className="glass-card p-6 border border-[#222]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-[#222] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" /> College Placement Overview
            </h3>
            <p className="text-xs text-surface-200/50 mt-0.5">
              Aggregate batch statistics and placement performance published by T&P Cell.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 text-surface-200/70">
            Batch Aggregate • Private Data Masked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
          <div className="p-3.5 rounded-lg border border-[#262626] bg-[#0c0c0c]">
            <span className="text-xs text-surface-200/50 font-medium">Overall Placement %</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{college.placement_percentage || 0}%</p>
            <span className="text-[10px] text-surface-200/40">Of eligible batch</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#262626] bg-[#0c0c0c]">
            <span className="text-xs text-surface-200/50 font-medium">Students Placed</span>
            <p className="text-2xl font-bold text-white mt-1">{college.total_students_placed || 0}</p>
            <span className="text-[10px] text-emerald-400 font-semibold">{college.total_offers || 0} Offers Made</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#262626] bg-[#0c0c0c]">
            <span className="text-xs text-surface-200/50 font-medium">Partner Companies</span>
            <p className="text-2xl font-bold text-white mt-1">{college.total_companies || 0}</p>
            <span className="text-[10px] text-surface-200/40">Visiting Campus</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#262626] bg-[#0c0c0c]">
            <span className="text-xs text-surface-200/50 font-medium">Highest Package</span>
            <p className="text-2xl font-bold text-pink-400 mt-1">{college.highest_package || 'N/A'}</p>
            <span className="text-[10px] text-surface-200/40">Peak CTC achieved</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#262626] bg-[#0c0c0c]">
            <span className="text-xs text-surface-200/50 font-medium">Average Package</span>
            <p className="text-2xl font-bold text-blue-400 mt-1">{college.average_package || 'N/A'}</p>
            <span className="text-[10px] text-surface-200/40">Batch average CTC</span>
          </div>
        </div>
      </div>

      {/* Row 3: Active Placement Opportunities (Recruitment Drives) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 size={18} className="text-emerald-400" /> Active Campus Recruitment Drives
            </h3>
            <Link to="/companies" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              View all drives <ChevronRight size={14} />
            </Link>
          </div>

          {activeOpps.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeOpps.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl border border-[#242424] bg-black/40 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                          {opp.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm">{opp.name}</h4>
                          <span className="text-[11px] text-surface-200/50">{opp.roles || 'Software Engineer'}</span>
                        </div>
                      </div>

                      <span className="font-bold text-xs text-emerald-400">
                        {opp.package || 'Competitive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-surface-200/60 my-2">
                      <span>Min CGPA: <strong className="text-white">{opp.min_cgpa || 'Open'}</strong></span>
                      {opp.deadline && (
                        <span>Deadline: <strong className="text-amber-400">{new Date(opp.deadline).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1f1f1f] flex items-center justify-between mt-2">
                    {opp.has_applied ? (
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={13} /> {opp.application_status || 'Applied'}
                      </span>
                    ) : (
                      <Link
                        to={`/companies`}
                        className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        Check & Apply <ArrowUpRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-surface-200/40 text-sm glass-card">
              No active drives posted at the moment.
            </div>
          )}
        </div>

        {/* Recent Applications Sidebar */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" /> My Recent Applications
            </h3>
            <Link to="/applications" className="text-xs text-surface-200/50 hover:text-white">
              View all
            </Link>
          </div>

          {recentApps.length > 0 ? (
            <div className="space-y-2.5">
              {recentApps.map((app) => (
                <div key={app.id} className="p-3 rounded-lg bg-black/40 border border-[#222] flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-xs">{app.company_name}</p>
                    <p className="text-[11px] text-surface-200/50">{app.role}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    app.status === 'selected'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : app.status === 'shortlisted'
                      ? 'bg-blue-500/15 text-blue-400'
                      : app.status === 'rejected'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-surface-200/40">
              No applications submitted yet. Browse active drives!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
