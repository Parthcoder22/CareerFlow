// ============================================
// Application Constants (Frontend)
// ============================================

export const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied', color: '#3B82F6', bg: 'status-applied' },
  { value: 'oa', label: 'Online Assessment', color: '#F59E0B', bg: 'status-oa' },
  { value: 'technical', label: 'Technical Interview', color: '#8B5CF6', bg: 'status-technical' },
  { value: 'managerial', label: 'Managerial Round', color: '#EC4899', bg: 'status-managerial' },
  { value: 'hr', label: 'HR Interview', color: '#06B6D4', bg: 'status-hr' },
  { value: 'offer', label: 'Offer Received 🎉', color: '#10B981', bg: 'status-offer' },
  { value: 'rejected', label: 'Rejected', color: '#EF4444', bg: 'status-rejected' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#6B7280', bg: 'status-withdrawn' },
];

export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'hard', label: 'Hard', color: '#EF4444' },
  { value: 'very_hard', label: 'Very Hard', color: '#DC2626' },
];

export const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4',
  '#10b981', '#f59e0b', '#ef4444', '#64748b',
];

export const getStatusLabel = (status) => {
  return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
};

export const getStatusColor = (status) => {
  return STATUS_OPTIONS.find(s => s.value === status)?.color || '#6B7280';
};

export const getStatusBg = (status) => {
  return STATUS_OPTIONS.find(s => s.value === status)?.bg || 'status-applied';
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
};
