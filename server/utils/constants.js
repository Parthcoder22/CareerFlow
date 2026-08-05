// ============================================
// Application Constants
// ============================================

const APPLICATION_STATUSES = [
  'applied', 'oa', 'technical', 'managerial', 'hr', 'offer', 'rejected', 'withdrawn'
];

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'very_hard'];

const NOTIFICATION_TYPES = [
  'oa_reminder', 'interview_reminder', 'deadline_reminder',
  'offer_received', 'rejected', 'general'
];

const USER_ROLES = ['student', 'admin'];

// Status display labels for the frontend
const STATUS_LABELS = {
  applied: 'Applied',
  oa: 'Online Assessment',
  technical: 'Technical Interview',
  managerial: 'Managerial Round',
  hr: 'HR Interview',
  offer: 'Offer Received 🎉',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

// Status colors for the frontend
const STATUS_COLORS = {
  applied: '#3B82F6',     // Blue
  oa: '#F59E0B',          // Amber
  technical: '#8B5CF6',   // Purple
  managerial: '#EC4899',  // Pink
  hr: '#06B6D4',          // Cyan
  offer: '#10B981',       // Green
  rejected: '#EF4444',    // Red
  withdrawn: '#6B7280',   // Gray
};

module.exports = {
  APPLICATION_STATUSES,
  DIFFICULTY_LEVELS,
  NOTIFICATION_TYPES,
  USER_ROLES,
  STATUS_LABELS,
  STATUS_COLORS,
};
