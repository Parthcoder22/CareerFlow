// ============================================
// Notifications Page
// ============================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationAPI } from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import { Bell, CheckCheck, Calendar, Briefcase, Clock, Award, XCircle, Info } from 'lucide-react';
import { timeAgo } from '../utils/constants';
import toast from 'react-hot-toast';

const typeIcons = {
  oa_reminder: { icon: Calendar, color: '#f59e0b' },
  interview_reminder: { icon: Briefcase, color: '#6366f1' },
  deadline_reminder: { icon: Clock, color: '#ef4444' },
  offer_received: { icon: Award, color: '#10b981' },
  rejected: { icon: XCircle, color: '#ef4444' },
  general: { icon: Info, color: '#06b6d4' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.data);
      setUnreadCount(data.unread_count);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { /* silent */ }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-200">Notifications</h1>
          <p className="text-surface-200/50 mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary text-sm py-2">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications about OAs, interviews, and deadlines will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => {
            const typeInfo = typeIcons[notif.type] || typeIcons.general;
            const IconComp = typeInfo.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`glass-card p-4 flex items-start gap-4 cursor-pointer transition-all
                  ${!notif.is_read ? 'border-l-4' : 'opacity-60'}`}
                style={{ borderLeftColor: !notif.is_read ? typeInfo.color : 'transparent' }}
              >
                <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${typeInfo.color}15` }}>
                  <IconComp size={20} style={{ color: typeInfo.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-surface-200">{notif.title}</h3>
                  <p className="text-xs text-surface-200/60 mt-1">{notif.message}</p>
                  <p className="text-xs text-surface-200/30 mt-2">{timeAgo(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: typeInfo.color }} />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
