// ============================================
// Empty State Component
// ============================================
import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 opacity-50">
        <Icon size={40} className="text-white" />
      </div>
      <h3 className="text-xl font-semibold text-surface-200 mb-2">{title}</h3>
      <p className="text-surface-200/50 text-center max-w-md mb-6">{description}</p>
      {action}
    </motion.div>
  );
}
