/*
 * Design: Crystal Report — Swiss Precision
 * Oversized KPI numbers (text-3xl+) with small delta badges.
 * Soft shadows, rounded corners, gradient progress rings.
 * Dark mode supported.
 */
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  progress?: number;
  color?: 'green' | 'blue' | 'amber' | 'rose';
}

const colorMap = {
  green: {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    iconBg: 'bg-rose-100 dark:bg-rose-900/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
    progressBg: 'bg-rose-100 dark:bg-rose-900/60',
    progressFill: 'bg-rose-500',
    ring: 'ring-rose-500',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    progressBg: 'bg-blue-100 dark:bg-blue-900/60',
    progressFill: 'bg-blue-500',
    ring: 'ring-blue-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
    progressBg: 'bg-amber-100 dark:bg-amber-900/60',
    progressFill: 'bg-amber-500',
    ring: 'ring-amber-500',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    iconBg: 'bg-rose-100 dark:bg-rose-900/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
    progressBg: 'bg-rose-100 dark:bg-rose-900/60',
    progressFill: 'bg-rose-500',
    ring: 'ring-rose-500',
  },
};

export default function KpiCard({ title, value, subtitle, delta, deltaLabel, icon, progress, color = 'green' }: KpiCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</p>
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-2xl ${colors.iconBg} flex items-center justify-center`}>
            <div className={colors.iconColor}>{icon}</div>
          </div>
        )}
      </div>

      <div className="mb-2">
        <span className="text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums tracking-tight">{value}</span>
        {subtitle && <span className="text-sm text-gray-400 dark:text-gray-500 ml-2">{subtitle}</span>}
      </div>

      {(delta !== undefined || progress !== undefined) && (
        <div className="flex items-center gap-3">
          {delta !== undefined && (
            <div className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
              ${delta > 0 ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400' : delta < 0 ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}
            `}>
              {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
            </div>
          )}
          {deltaLabel && <span className="text-xs text-gray-400 dark:text-gray-500">{deltaLabel}</span>}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3">
          <div className={`h-1.5 rounded-full ${colors.progressBg} overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${colors.progressFill}`}
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-right tabular-nums">{progress.toFixed(1)}%</p>
        </div>
      )}
    </motion.div>
  );
}
