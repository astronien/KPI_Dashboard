/*
 * SkeletonCard — Animated loading placeholder
 * Provides skeleton placeholders for KPI cards, table rows, and charts.
 * Supports dark mode.
 */
import { motion } from 'framer-motion';

const shimmer = 'animate-pulse';

export function SkeletonKpiCard() {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 p-5 shadow-sm ${shimmer}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
      <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className={shimmer}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${i === 0 ? 'w-24' : 'w-16 ml-auto'}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonChart() {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-5 ${shimmer}`}>
      <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="flex items-end gap-3 h-48">
        {[40, 65, 50, 80, 35, 70, 55].map((h, i) => (
          <div key={i} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKpiCard key={i} />
        ))}
      </div>
      {/* Chart */}
      <SkeletonChart />
      {/* Table */}
      <div className={`bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden ${shimmer}`}>
        <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
