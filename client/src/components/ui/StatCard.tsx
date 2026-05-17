import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  color?: string;
  index?: number;
  onClick?: () => void;
}

const colorMap: Record<string, { bg: string; icon: string; glow: string }> = {
  indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', glow: 'shadow-indigo-500/10' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
  violet: { bg: 'bg-violet-500/10', icon: 'text-violet-400', glow: 'shadow-violet-500/10' },
  amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', glow: 'shadow-amber-500/10' },
  rose: { bg: 'bg-rose-500/10', icon: 'text-rose-400', glow: 'shadow-rose-500/10' },
  sky: { bg: 'bg-sky-500/10', icon: 'text-sky-400', glow: 'shadow-sky-500/10' },
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'indigo', index = 0, onClick }: StatCardProps) {
  const colors = colorMap[color] || colorMap.indigo;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="relative group w-full text-left"
    >
      <div className={`relative p-5 rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm hover:border-surface-600/50 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-lg ${colors.bg}`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
          {trend && (
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
        <p className="text-xs text-surface-400 font-medium">{title}</p>
      </div>
    </motion.button>
  );
}
