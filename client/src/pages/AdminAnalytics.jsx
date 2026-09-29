// ============================================
// Admin Placement Analytics & Company-Wise Reports
// ============================================
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  LineChart, TrendingUp, Users, Award, Building2,
  DollarSign, Search, CheckCircle2, XCircle, ArrowUpRight, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('applicants'); // 'applicants' | 'selected' | 'rate'

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getStatistics();
      setStats(data.data);
    } catch (err) {
      toast.error('Failed to load placement analytics');
    } finally {
      setLoading(false);
    }
  };

  const overview = stats?.overview || {};
  const companyWise = stats?.company_wise_stats || [];
  const monthlyTrends = stats?.monthly_trends || [];
  const packageDist = stats?.package_distribution || [];

  // Filter and sort company stats
  const filteredCompanies = companyWise
    .filter(c => c.company_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'selected') return b.selected - a.selected;
      if (sortOrder === 'rate') return parseFloat(b.selection_rate) - parseFloat(a.selection_rate);
      return b.total_applicants - a.total_applicants;
    });

  // Top hiring bar chart data
  const topHiring = [...companyWise]
    .sort((a, b) => b.selected - a.selected)
    .slice(0, 8);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-[#222] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Placement Intelligence & Analytics</h1>
          <p className="text-surface-200/50 text-sm mt-1">
            Comprehensive college placement ratios, recruiter conversion funnels, and CTC distribution.
          </p>
        </div>
      </div>

      {/* Overall Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-black/40 border border-[#222]">
          <span className="text-xs text-surface-200/50 font-medium">Placement Rate</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{overview.placement_percentage || 0}%</p>
          <span className="text-[10px] text-surface-200/40">Of total registered batch</span>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-[#222]">
          <span className="text-xs text-surface-200/50 font-medium">Placed Students</span>
          <p className="text-2xl font-bold text-white mt-1">{overview.placed_students || 0}</p>
          <span className="text-[10px] text-emerald-400 font-semibold">{overview.total_offers || 0} Total Offers</span>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-[#222]">
          <span className="text-xs text-surface-200/50 font-medium">Unplaced Students</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{overview.unplaced_students || 0}</p>
          <span className="text-[10px] text-surface-200/40">Eligible for upcoming drives</span>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-[#222]">
          <span className="text-xs text-surface-200/50 font-medium">Total Recruiters</span>
          <p className="text-2xl font-bold text-white mt-1">{overview.total_companies || 0}</p>
          <span className="text-[10px] text-surface-200/40">Visiting Campus</span>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-[#222]">
          <span className="text-xs text-surface-200/50 font-medium">Highest Package</span>
          <p className="text-2xl font-bold text-pink-400 mt-1">{overview.highest_package || 'N/A'}</p>
          <span className="text-[10px] text-surface-200/40">Peak CTC achieved</span>
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-[#222]">
          <span className="text-xs text-surface-200/50 font-medium">Average Package</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{overview.average_package || 'N/A'}</p>
          <span className="text-[10px] text-surface-200/40">Batch average CTC</span>
        </div>
      </div>

      {/* Analytics Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Hiring Companies */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
            <Award size={18} className="text-emerald-400" /> Top Recruiting Companies (By Hires)
          </h3>
          <p className="text-xs text-surface-200/50 mb-4">Recruiters who issued the most final job offers</p>
          {topHiring.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topHiring} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis dataKey="company_name" type="category" stroke="#fff" fontSize={11} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="selected" name="Hired Offers" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-20 text-center text-surface-200/40 text-sm">No hiring data yet</div>
          )}
        </div>

        {/* 12-Month Offer Velocity */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" /> Monthly Offer Velocity
          </h3>
          <p className="text-xs text-surface-200/50 mb-4">Volume of student offers closed month-by-month</p>
          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaSel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#666" fontSize={11} tickLine={false} />
                <YAxis stroke="#666" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="selected" stroke="#3b82f6" fillOpacity={1} fill="url(#areaSel)" strokeWidth={2} name="Offers Made" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-20 text-center text-surface-200/40 text-sm">No monthly trend data yet</div>
          )}
        </div>
      </div>

      {/* Main Company-Wise Placement Table (Required Specification) */}
      <div className="glass-card p-6 border border-[#222]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 size={20} className="text-emerald-400" /> Company-Wise Conversion Ratios
            </h3>
            <p className="text-xs text-surface-200/50 mt-0.5">
              Detailed breakdown of candidates applied, shortlisted, selected, and hiring rates per recruiter.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/40" />
              <input
                type="text"
                placeholder="Filter company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field text-xs pl-8 py-1.5"
              />
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="input-field text-xs py-1.5"
            >
              <option value="applicants">Sort: Most Applicants</option>
              <option value="selected">Sort: Most Hired</option>
              <option value="rate">Sort: Highest Selection %</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#242424] rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#141414] border-b border-[#252525] text-xs uppercase tracking-wider text-surface-200/50 font-semibold">
              <tr>
                <th className="py-3 px-4">Recruiter / Drive</th>
                <th className="py-3 px-3">Roles</th>
                <th className="py-3 px-3">Package (CTC)</th>
                <th className="py-3 px-3 text-center">Total Applicants</th>
                <th className="py-3 px-3 text-center">Shortlisted</th>
                <th className="py-3 px-3 text-center">Selected (Hired)</th>
                <th className="py-3 px-3 text-center">Rejected</th>
                <th className="py-3 px-4 text-right">Selection Rate %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-surface-200/40 text-sm">
                    No matching company drive statistics found.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => (
                  <tr key={c.company_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                          {c.company_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{c.company_name}</p>
                          <span className="text-[10px] text-surface-200/50">{c.min_cgpa ? `Min ${c.min_cgpa} CGPA` : 'Open Cutoff'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-surface-200/70 max-w-[150px] truncate">{c.roles || 'Software Engineer'}</td>
                    <td className="py-3.5 px-3 font-semibold text-emerald-400 text-xs">{c.package || 'Competitive'}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-white">{c.total_applicants}</td>
                    <td className="py-3.5 px-3 text-center font-medium text-blue-400">{c.shortlisted}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-400">{c.selected}</td>
                    <td className="py-3.5 px-3 text-center font-medium text-red-400">{c.rejected}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span className={`px-2.5 py-1 rounded text-xs ${
                        parseFloat(c.selection_rate) >= 20
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : parseFloat(c.selection_rate) > 0
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {c.selection_rate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
