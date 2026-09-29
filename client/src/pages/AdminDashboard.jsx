// ============================================
// College Training & Placement (TNP) Admin Dashboard
// ============================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../services/api';
import StatsCard from '../components/ui/StatsCard';
import { DashboardSkeleton } from '../components/skeletons/Skeletons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  Users, UserCheck, UserX, FileText, Award, TrendingUp,
  Building2, Briefcase, DollarSign, CheckCircle2, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { CHART_COLORS } from '../utils/constants';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await adminAPI.getStatistics();
      setStats(data.data);
    } catch (error) {
      toast.error('Failed to load placement statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const overview = stats?.overview || {};
  const statusBreakdown = stats?.status_breakdown || [];
  const topCompanies = stats?.top_companies || [];
  const monthlyTrends = stats?.monthly_trends || [];
  const selectedStudents = stats?.selected_students || [];
  const companyWise = stats?.company_wise_stats || [];
  const packageDist = stats?.package_distribution || [];

  // Selected vs Rejected Pie data
  const selectedCount = overview.total_offers || 0;
  const rejectedCount = statusBreakdown.find(s => s.status_name === 'rejected')?.count || 0;
  const inReviewCount = Math.max(0, (overview.total_applications || 0) - selectedCount - rejectedCount);

  const outcomePieData = [
    { name: 'Selected / Placed', value: parseInt(selectedCount), color: '#10b981' },
    { name: 'In Review / Shortlisted', value: parseInt(inReviewCount), color: '#3b82f6' },
    { name: 'Rejected', value: parseInt(rejectedCount), color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Campus Placement Season 2025–26
            </span>
            <span className="text-xs text-surface-200/40">• T&P Authority Console</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Placement Command Center</h1>
          <p className="text-surface-200/50 text-sm mt-1">Real-time college placement metrics, student status, and drive operations.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/companies" className="btn-secondary text-sm flex items-center gap-2">
            <Building2 size={16} /> Manage Drives
          </Link>
          <Link to="/admin/analytics" className="btn-primary text-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none text-white">
            <TrendingUp size={16} /> Deep Analytics
          </Link>
        </div>
      </div>

      {/* Row 1: Primary Metrics Grid (10 Required KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Students"
          value={overview.total_students || 0}
          icon={Users}
          color="#3b82f6"
          delay={0.0}
        />
        <StatsCard
          title="Eligible / Allowed"
          value={overview.eligible_students || 0}
          icon={UserCheck}
          color="#10b981"
          delay={0.05}
        />
        <StatsCard
          title="Students Placed"
          value={overview.placed_students || 0}
          icon={Award}
          color="#059669"
          delay={0.1}
        />
        <StatsCard
          title="Students Unplaced"
          value={overview.unplaced_students || 0}
          icon={UserX}
          color="#f59e0b"
          delay={0.15}
        />
        <StatsCard
          title="Placement Rate"
          value={`${overview.placement_percentage || 0}%`}
          icon={TrendingUp}
          color="#8b5cf6"
          delay={0.2}
        />

        <StatsCard
          title="Total Companies"
          value={overview.total_companies || 0}
          icon={Building2}
          color="#06b6d4"
          delay={0.25}
        />
        <StatsCard
          title="Total Applications"
          value={overview.total_applications || 0}
          icon={FileText}
          color="#6366f1"
          delay={0.3}
        />
        <StatsCard
          title="Offers Made"
          value={overview.total_offers || 0}
          icon={CheckCircle2}
          color="#10b981"
          delay={0.35}
        />
        <StatsCard
          title="Highest Package"
          value={overview.highest_package || 'N/A'}
          icon={DollarSign}
          color="#ec4899"
          delay={0.4}
        />
        <StatsCard
          title="Average Package"
          value={overview.average_package || 'N/A'}
          icon={Briefcase}
          color="#f97316"
          delay={0.45}
        />
      </div>

      {/* Row 2: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications per Company */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 lg:col-span-2 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Building2 size={18} className="text-emerald-400" /> Applications by Company
              </h3>
              <p className="text-xs text-surface-200/50">Volume of student applications across top visiting recruiters</p>
            </div>
            <Link to="/admin/companies" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {topCompanies.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topCompanies} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="company_name" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="application_count" name="Applicants" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="selected_count" name="Hired" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-20 text-center text-surface-200/40 text-sm">No applications recorded yet</div>
          )}
        </motion.div>

        {/* Selected vs Rejected Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Award size={18} className="text-emerald-400" /> Selection vs Rejection Ratio
            </h3>
            <p className="text-xs text-surface-200/50">Overall application outcome distribution</p>
          </div>

          {outcomePieData.length > 0 ? (
            <div className="flex flex-col items-center justify-center my-2">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={outcomePieData}
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {outcomePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="w-full space-y-1.5 mt-2">
                {outcomePieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-surface-200/70">{d.name}</span>
                    </div>
                    <span className="font-semibold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-surface-200/40 text-sm">No application data yet</div>
          )}
        </motion.div>
      </div>

      {/* Row 3: Placement Trend & Package Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Placement Trend */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-400" /> 12-Month Placement Trajectory
            </h3>
            <p className="text-xs text-surface-200/50">Monthly offers generated and applications processed</p>
          </div>

          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="selectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="selected" stroke="#10b981" fillOpacity={1} fill="url(#selectedGrad)" strokeWidth={2} name="Offers" />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={0} strokeWidth={1.5} name="Total Applications" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-20 text-center text-surface-200/40 text-sm">No historical trend data yet</div>
          )}
        </motion.div>

        {/* Package Distribution Brackets */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-6"
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <DollarSign size={18} className="text-amber-400" /> Package (CTC) Distribution Brackets
            </h3>
            <p className="text-xs text-surface-200/50">Number of visiting opportunities per salary tier</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            {packageDist.map((p, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-[#262626] bg-[#0c0c0c] text-center">
                <p className="text-xs text-surface-200/50 font-medium">{p.range}</p>
                <p className="text-2xl font-bold text-white mt-1">{p.count}</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">Companies</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={packageDist} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="range" stroke="#666" fontSize={11} tickLine={false} />
              <YAxis stroke="#666" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Companies" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 4: Company-Wise Placement Snapshot Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Building2 size={18} className="text-emerald-400" /> Company-Wise Drive Performance
            </h3>
            <p className="text-xs text-surface-200/50">Recruiter applicant funnel: Applied ➔ Shortlisted ➔ Selected (Hire Rate)</p>
          </div>
          <Link to="/admin/analytics" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            Full Company Analytics <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#222] text-xs uppercase tracking-wider text-surface-200/50 font-semibold">
                <th className="py-3 px-3">Recruiter</th>
                <th className="py-3 px-3">Roles</th>
                <th className="py-3 px-3">Package</th>
                <th className="py-3 px-3">Min CGPA</th>
                <th className="py-3 px-3 text-center">Applicants</th>
                <th className="py-3 px-3 text-center">Shortlisted</th>
                <th className="py-3 px-3 text-center">Selected</th>
                <th className="py-3 px-3 text-center">Selection %</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {companyWise.slice(0, 6).map((c) => (
                <tr key={c.company_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                        {c.company_name?.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{c.company_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-surface-200/70 text-xs max-w-[150px] truncate">{c.roles || 'Software Engineer'}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-400 text-xs">{c.package || 'N/A'}</td>
                  <td className="py-3 px-3 text-surface-200/60 text-xs">{c.min_cgpa ? `${c.min_cgpa} CGPA` : 'Open'}</td>
                  <td className="py-3 px-3 text-center font-medium text-white">{c.total_applicants}</td>
                  <td className="py-3 px-3 text-center text-blue-400 font-medium">{c.shortlisted}</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-semibold">{c.selected}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      parseFloat(c.selection_rate) > 20
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : parseFloat(c.selection_rate) > 0
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {c.selection_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/admin/companies?view=${c.company_id}`}
                      className="px-2.5 py-1 rounded text-xs border border-[#333] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-white transition-colors"
                    >
                      Applicants
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Row 5: Placed Students Wall of Fame */}
      {selectedStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Award size={18} className="text-emerald-400" /> Recent Placed Students (Wall of Fame)
              </h3>
              <p className="text-xs text-surface-200/50">Students who successfully converted offers in active placement season</p>
            </div>
            <Link to="/admin/students?placement_status=placed" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              All placed students <ChevronRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#222] text-xs uppercase tracking-wider text-surface-200/50">
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Department & Branch</th>
                  <th className="py-2.5 px-3">CGPA</th>
                  <th className="py-2.5 px-3">Company Hired In</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">CTC Package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {selectedStudents.map((s, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-medium text-white">{s.full_name}</td>
                    <td className="py-3 px-3 text-surface-200/60 text-xs">{s.branch || s.college || 'Engineering'}</td>
                    <td className="py-3 px-3 text-surface-200/80 text-xs font-mono">{s.cgpa || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-white text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {s.company_name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-surface-200/70 text-xs">{s.role}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400 text-xs">{s.package || 'Competitive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
