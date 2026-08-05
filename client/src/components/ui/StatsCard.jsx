// ============================================
// Stats Card Component - SaaS Design
// ============================================
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, icon: Icon, color, change, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="p-5 rounded-xl border relative overflow-hidden group transition-all"
      style={{ background: '#0a0a0a', borderColor: '#222', color: '#ededed' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#444'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#222'; }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-20" style={{ color }}>
        <Icon size={64} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium tracking-wide" style={{ color: '#888' }}>{title}</p>
          <Icon size={18} style={{ color }} />
        </div>
        
        <div className="flex items-baseline gap-2">
          <h4 className="text-3xl font-semibold tracking-tight">{value}</h4>
          {change !== undefined && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: change >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: change >= 0 ? '#10b981' : '#ef4444' }}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
