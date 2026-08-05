// ============================================
// Student Dashboard Page - SaaS Design
// ============================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import StatsCard from '../components/ui/StatsCard';
import { DashboardSkeleton } from '../components/skeletons/Skeletons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
  FileText, Award, XCircle, TrendingUp,
  Calendar, Clock, Target, Briefcase
} from 'lucide-react';
import { getStatusLabel, getStatusColor, formatDate } from '../utils/constants';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await dashboardAPI.getStats();
      setStats(data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const overview = stats?.overview || {};
  const statusData = stats?.status_breakdown
    ? Object.entries(stats.status_breakdown).map(([key, value]) => ({
        name: getStatusLabel(key),
        value,
        color: getStatusColor(key),
      }))
    : [];
  const monthlyData = stats?.monthly_stats || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto" style={{ color: '#ededed' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1" style={{ color: '#888' }}>Here's your placement overview.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Applications" value={overview.total_applications || 0} icon={FileText} color="#ededed" delay={0} />
        <StatsCard title="Offers Received" value={overview.offers || 0} icon={Award} color="#10b981" delay={0.1} />
        <StatsCard title="In Progress" value={overview.in_progress || 0} icon={Clock} color="#f59e0b" delay={0.2} />
        <StatsCard title="Success Rate" value={`${overview.success_rate || 0}%`} icon={TrendingUp} color="#a855f7" delay={0.3} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-6 rounded-xl border" style={{ background: '#0a0a0a', borderColor: '#222' }}>
          <h3 className="text-lg font-medium mb-6">Application Trends</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ededed" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ededed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#ededed' }} />
                <Area type="monotone" dataKey="total" stroke="#ededed" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                <Line type="monotone" dataKey="offers" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm" style={{ color: '#666' }}>No data yet. Start adding applications!</div>
          )}
        </motion.div>

        {/* Status Distribution Pie */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="p-6 rounded-xl border flex flex-col" style={{ background: '#0a0a0a', borderColor: '#222' }}>
          <h3 className="text-lg font-medium mb-6">Status Distribution</h3>
          {statusData.length > 0 ? (
            <div className="flex items-center gap-6 flex-1">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#ededed' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {statusData.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span style={{ color: '#888' }} className="truncate">{item.name}</span>
                    <span className="font-medium ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm" style={{ color: '#666' }}>No data yet.</div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="p-6 rounded-xl border" style={{ background: '#0a0a0a', borderColor: '#222' }}>
          <h3 className="text-base font-medium mb-4 flex items-center gap-2">
            <Calendar size={18} style={{ color: '#f59e0b' }} /> Upcoming OAs
          </h3>
          {stats?.upcoming_oa?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcoming_oa.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: '#111', borderColor: '#222' }}>
                  <div>
                    <p className="text-sm font-medium">{item.company_name}</p>
                    <p className="text-xs" style={{ color: '#888' }}>{item.role}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    {formatDate(item.oa_date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#666' }}>No upcoming OAs</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="p-6 rounded-xl border" style={{ background: '#0a0a0a', borderColor: '#222' }}>
          <h3 className="text-base font-medium mb-4 flex items-center gap-2">
            <Briefcase size={18} style={{ color: '#3b82f6' }} /> Upcoming Interviews
          </h3>
          {stats?.upcoming_interviews?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcoming_interviews.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: '#111', borderColor: '#222' }}>
                  <div>
                    <p className="text-sm font-medium">{item.company_name}</p>
                    <p className="text-xs" style={{ color: '#888' }}>{item.role}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                    {formatDate(item.interview_date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#666' }}>No upcoming interviews</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="p-6 rounded-xl border" style={{ background: '#0a0a0a', borderColor: '#222' }}>
          <h3 className="text-base font-medium mb-4 flex items-center gap-2">
            <Target size={18} style={{ color: '#a855f7' }} /> Recent Applications
          </h3>
          {stats?.recent_applications?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_applications.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: '#111', borderColor: '#222' }}>
                  <div>
                    <p className="text-sm font-medium">{item.company_name}</p>
                    <p className="text-xs" style={{ color: '#888' }}>{item.role}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ border: '1px solid #333', color: getStatusColor(item.status) }}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#666' }}>No recent applications</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
