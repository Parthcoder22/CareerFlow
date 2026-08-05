// ============================================
// Admin Dashboard Page
// ============================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../services/api';
import StatsCard from '../components/ui/StatsCard';
import { DashboardSkeleton } from '../components/skeletons/Skeletons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, Award, TrendingUp, Building2 } from 'lucide-react';
import { CHART_COLORS, getStatusLabel, getStatusColor } from '../utils/constants';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const { data } = await adminAPI.getStatistics();
      setStats(data.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  const overview = stats?.overview || {};

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-200">Admin Dashboard</h1>
        <p className="text-surface-200/50 mt-1">Placement statistics overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Students" value={overview.total_students || 0} icon={Users} color="#6366f1" delay={0} />
        <StatsCard title="Total Applications" value={overview.total_applications || 0} icon={FileText} color="#8b5cf6" delay={0.1} />
        <StatsCard title="Total Offers" value={overview.total_offers || 0} icon={Award} color="#10b981" delay={0.2} />
        <StatsCard title="Success Rate" value={`${overview.average_success_rate || 0}%`} icon={TrendingUp} color="#f59e0b" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="text-lg font-semibold text-surface-200 mb-6 flex items-center gap-2">
            <Building2 size={20} className="text-primary-400" /> Most Applied Companies
          </h3>
          {stats?.top_companies?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.top_companies.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="company_name" type="category" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }} />
                <Bar dataKey="application_count" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-surface-200/40 text-center py-20">No data yet</p>}
        </motion.div>

        {/* Status Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h3 className="text-lg font-semibold text-surface-200 mb-6">Application Status Breakdown</h3>
          {stats?.status_breakdown?.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={250}>
                <PieChart>
                  <Pie data={stats.status_breakdown.map(s => ({ name: getStatusLabel(s.status), value: parseInt(s.count), color: getStatusColor(s.status) }))}
                    innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                    {stats.status_breakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.status_breakdown.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-surface-200/70 truncate">{getStatusLabel(s.status)}</span>
                    <span className="text-surface-200 font-semibold ml-auto">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-surface-200/40 text-center py-20">No data yet</p>}
        </motion.div>
      </div>

      {/* Selected Students */}
      {stats?.selected_students?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
          <h3 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
            <Award size={20} className="text-success" /> Placed Students
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-surface-200/50 border-b border-white/5">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">College</th>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Package</th>
                </tr>
              </thead>
              <tbody>
                {stats.selected_students.map((s, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-surface-200">{s.full_name}</td>
                    <td className="py-3 px-4 text-surface-200/60">{s.college || 'N/A'}</td>
                    <td className="py-3 px-4 text-surface-200">{s.company_name}</td>
                    <td className="py-3 px-4 text-surface-200/60">{s.role}</td>
                    <td className="py-3 px-4 text-success font-medium">{s.package || 'N/A'}</td>
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
