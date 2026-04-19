/*
 * Design: Crystal Report — Per-Branch KPI Dashboard
 * Branch-level dashboard showing aggregated KPIs for all staff in a branch,
 * staff ranking within branch, and category breakdown.
 * Dark mode supported.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { calculateOfficerSummary, calculateBranchSummary, formatCurrency, getGroupCategory } from '@/lib/dataProcessor';
import {
  Store,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Calendar,
  Zap,
  ChevronDown,
  Award,
  BarChart3,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmtCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
};

export default function BranchDashboardTab() {
  const data = useData();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [targetPercent, setTargetPercent] = useState(100);

  // Branch list
  const branchList = useMemo(() => {
    if (!data.targets.length) return [];
    return Array.from(new Set(data.targets.map(t => t.branchName.replace(/^ID\d+ : /, '')))).sort();
  }, [data.targets]);

  // Auto-select first branch
  useMemo(() => {
    if (!selectedBranch && branchList.length > 0) {
      setSelectedBranch(branchList[0]);
    }
  }, [branchList, selectedBranch]);

  // Branch summary
  const branchSummary = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod || !selectedBranch) return null;
    const all = calculateBranchSummary(
      data.targets, data.currentPeriod, data.lastMonth, data.lastYear, data.categoryMaster, 'All Category'
    );
    return all.find(b => b.branch === selectedBranch) || null;
  }, [data, selectedBranch]);

  // Staff in branch
  const staffInBranch = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod || !selectedBranch) return [];
    const officers = calculateOfficerSummary(
      data.targets, data.currentPeriod, data.lastMonth, data.lastYear, data.categoryMaster, 'All Category', 'All Positions'
    );
    return officers
      .filter(o => o.branch === selectedBranch && o.target > 0)
      .sort((a, b) => b.achPercent - a.achPercent);
  }, [data, selectedBranch]);

  // Category breakdown for branch
  const categoryBreakdown = useMemo(() => {
    if (!data.isLoaded.currentPeriod || !selectedBranch) return [];
    const branchSales = data.currentPeriod.filter(s =>
      s.branchName.replace(/^ID\d+ : /, '') === selectedBranch
    );

    const catMap = new Map<string, { name: string; actual: number; count: number }>();
    branchSales.forEach(s => {
      const gc = getGroupCategory(s.categoryName, s.subCategory, data.categoryMaster, s.productName);
      const existing = catMap.get(gc) || { name: gc, actual: 0, count: 0 };
      existing.actual += s.totalPrice;
      existing.count += s.number;
      catMap.set(gc, existing);
    });

    return Array.from(catMap.values()).sort((a, b) => b.actual - a.actual);
  }, [data, selectedBranch]);

  // Timeline info
  const timeline = useMemo(() => {
    const totalDays = data.targets[0]?.day || 30;
    const currentDay = new Date().getDate();
    return {
      totalDays,
      currentDay,
      remainingDays: Math.max(0, totalDays - currentDay),
      timePassPercent: (currentDay / totalDays) * 100,
    };
  }, [data.targets]);

  // Pace calculator
  const paceData = useMemo(() => {
    if (!branchSummary) return null;
    const goalAmount = branchSummary.target * (targetPercent / 100);
    const remainingSales = Math.max(0, goalAmount - branchSummary.actual);
    const dailyNeeded = timeline.remainingDays > 0 ? remainingSales / timeline.remainingDays : 0;
    const currentDailyAvg = timeline.currentDay > 0 ? branchSummary.actual / timeline.currentDay : 0;
    const alreadyAchieved = branchSummary.actual >= goalAmount;
    const paceRatio = currentDailyAvg > 0 ? dailyNeeded / currentDailyAvg : 0;
    return { goalAmount, remainingSales, dailyNeeded, currentDailyAvg, alreadyAchieved, paceRatio };
  }, [branchSummary, targetPercent, timeline]);

  // Chart data for staff
  const staffChartData = useMemo(() => {
    return staffInBranch.slice(0, 15).map(o => ({
      name: o.officerName.length > 12 ? o.officerName.substring(0, 12) + '...' : o.officerName,
      actual: o.actual / 1000000,
      target: o.target / 1000000,
      achPercent: o.achPercent,
    }));
  }, [staffInBranch]);

  if (!data.isMinimumLoaded) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-sm">Upload Target and Current Period files to see Branch Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Branch Selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative"
      >
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl" />
        <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {selectedBranch || 'Select Branch'}
              </h2>
              <p className="text-sm text-gray-500">Branch Performance Dashboard</p>
            </div>
          </div>

          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
          >
            {branchList.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {branchSummary && (
        <>
          {/* KPI Hero Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{fmtCompact(branchSummary.target)}</p>
              <p className="text-[10px] text-gray-400 mt-1">Monthly goal</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Actual</p>
              <p className="text-2xl font-black text-emerald-600 tabular-nums">{fmtCompact(branchSummary.actual)}</p>
              <div className="flex items-center gap-1 mt-1">
                {branchSummary.achPercent >= 100
                  ? <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  : <ArrowDownRight className="w-3 h-3 text-rose-500" />}
                <p className={`text-[10px] font-bold tabular-nums ${branchSummary.achPercent >= 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {branchSummary.achPercent.toFixed(1)}%
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Forecast</p>
              <p className="text-2xl font-black text-blue-600 tabular-nums">{fmtCompact(branchSummary.forecast)}</p>
              <p className={`text-[10px] font-bold tabular-nums mt-1 ${branchSummary.forecastPercent >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {branchSummary.forecastPercent.toFixed(1)}% of target
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Staff Count</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{staffInBranch.length}</p>
              <p className="text-[10px] text-gray-400 mt-1">officers in branch</p>
            </motion.div>
          </div>

          {/* Progress + Pace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Progress */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Time & Achievement
              </h3>
              {/* Achievement */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Achievement</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">{branchSummary.achPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(branchSummary.achPercent, 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${branchSummary.achPercent >= 100 ? 'bg-emerald-500' : branchSummary.achPercent >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  />
                </div>
              </div>
              {/* Time Pass */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Time Pass (Day {timeline.currentDay}/{timeline.totalDays})</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">{timeline.timePassPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(timeline.timePassPercent, 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  />
                </div>
              </div>
            </motion.div>

            {/* Pace Calculator */}
            {paceData && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Daily Pace
                  </h3>
                  <div className="flex items-center gap-1">
                    {[70, 80, 90, 100, 105].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setTargetPercent(pct)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                          targetPercent === pct
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >{pct}%</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-100 dark:border-blue-900/50">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Goal ({targetPercent}%)</p>
                    <p className="text-lg font-black text-blue-700 dark:text-blue-400 tabular-nums">{fmtCompact(paceData.goalAmount)}</p>
                  </div>
                  <div className={`rounded-xl p-3 border ${paceData.alreadyAchieved ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50' : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50'}`}>
                    <p className={`text-[10px] font-bold uppercase ${paceData.alreadyAchieved ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {paceData.alreadyAchieved ? 'Achieved! ✓' : 'Daily Needed'}
                    </p>
                    <p className={`text-lg font-black tabular-nums ${paceData.alreadyAchieved ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {paceData.alreadyAchieved ? '🎉' : fmtCompact(paceData.dailyNeeded)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Staff Ranking Chart */}
          {staffChartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Staff Sales vs Target (MB)
              </h3>
              <ResponsiveContainer width="100%" height={Math.max(200, staffChartData.length * 42)}>
                <BarChart data={staffChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v: number) => v.toFixed(1) + 'M'} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: '#4b5563' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: number) => [value.toFixed(2) + 'M', '']}
                  />
                  <Bar dataKey="target" fill="#e5e7eb" name="Target" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {staffChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.achPercent >= 100 ? '#10b981' : entry.achPercent >= 80 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Staff Performance Table */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Staff Ranking</h3>
              <span className="text-[10px] text-gray-400 ml-auto">{staffInBranch.length} officers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-800 dark:bg-blue-900 text-white">
                    <th className="px-3 py-3 text-xs font-semibold text-left">#</th>
                    <th className="px-3 py-3 text-xs font-semibold text-left">Officer</th>
                    <th className="px-3 py-3 text-xs font-semibold text-left">Position</th>
                    <th className="px-3 py-3 text-xs font-semibold text-right">Target</th>
                    <th className="px-3 py-3 text-xs font-semibold text-right">Actual</th>
                    <th className="px-3 py-3 text-xs font-semibold text-right">Ach.%</th>
                    <th className="px-3 py-3 text-xs font-semibold text-right">Forecast</th>
                    <th className="px-3 py-3 text-xs font-semibold text-right">MoM%</th>
                  </tr>
                </thead>
                <tbody>
                  {staffInBranch.map((o, i) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <tr key={i} className={`border-b border-gray-50 dark:border-gray-800/50 ${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'} hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-colors`}>
                        <td className="px-3 py-2.5 text-center text-sm">{medals[i] || i + 1}</td>
                        <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{o.officerName}</td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs">{o.position}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums dark:text-gray-200">{fmtCompact(o.target)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums dark:text-gray-200">{fmtCompact(o.actual)}</td>
                        <td className={`px-3 py-2.5 text-right font-bold tabular-nums ${o.achPercent >= 100 ? 'text-emerald-600' : o.achPercent >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {o.achPercent.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums dark:text-gray-200">{fmtCompact(o.forecast)}</td>
                        <td className={`px-3 py-2.5 text-right tabular-nums ${o.momPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {o.momPercent >= 0 ? '+' : ''}{o.momPercent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" /> Category Breakdown
            </h3>
            <div className="space-y-3">
              {categoryBreakdown.map((cat, i) => {
                const totalSales = categoryBreakdown.reduce((s, c) => s + c.actual, 0);
                const sharePercent = totalSales > 0 ? (cat.actual / totalSales) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-28 truncate">{cat.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sharePercent}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      />
                    </div>
                    <div className="text-right w-20">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums">{fmtCompact(cat.actual)}</span>
                      <span className="text-[10px] text-gray-400 ml-1 tabular-nums">({sharePercent.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
