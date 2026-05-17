import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="p-4 rounded-2xl bg-surface-800/50 border border-surface-700/30 mb-4">
        <Icon className="w-10 h-10 text-surface-500" />
      </div>
      <h3 className="text-lg font-semibold text-surface-200 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-surface-400 text-center max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
