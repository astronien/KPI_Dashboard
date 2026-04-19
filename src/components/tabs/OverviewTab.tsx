/*
 * Design: Crystal Report — Swiss Precision
 * Overview tab with KPI cards, branch summary, category summary tables.
 * Uses forest green accents, clean whitespace, and animated elements.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import KpiCard from '@/components/KpiCard';
import DataTable, { formatPercent, formatDelta, formatMoney, formatDiff } from '@/components/DataTable';
import { calculateBranchSummary, calculateCategorySummary, calculateOfficerSummary, formatCurrency } from '@/lib/dataProcessor';
import { BarChart3, TrendingUp, TrendingDown, Target, DollarSign, Users, ShoppingBag, AlertTriangle, Award, Bell, ChevronDown, Trophy, AlertCircle, PartyPopper, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_IMAGE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663113035049/QEeU9YZXUQKMMUHwtjvw9N/hero-pattern-FG6x6Wewo3JDoZZdN4SrnL.webp';

export default function OverviewTab() {
  const data = useData();
  const [filterCategory, setFilterCategory] = useState('All Category');
  const [filterPosition, setFilterPosition] = useState('All Positions');
  const [filterBranch, setFilterBranch] = useState('All Branches');
  const [alertsOpen, setAlertsOpen] = useState(true);

  const positions = useMemo(() => {
    if (!data.targets.length) return [];
    return Array.from(new Set(data.targets.map(t => t.position))).sort();
  }, [data.targets]);

  const branchesList = useMemo(() => {
    if (!data.targets.length) return [];
    return Array.from(new Set(data.targets.map(t => t.branchName.replace(/^ID\d+ : /, '')))).sort();
  }, [data.targets]);

  const branchSummary = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod) return [];
    let summary = calculateBranchSummary(
      data.targets,
      data.currentPeriod,
      data.lastMonth,
      data.lastYear,
      data.categoryMaster,
      filterCategory
    );
    if (filterBranch !== 'All Branches') {
      summary = summary.filter(b => b.branch === filterBranch);
    }
    return summary;
  }, [data, filterCategory, filterBranch]);

  const categorySummary = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod) return [];
    return calculateCategorySummary(
      data.targets,
      data.currentPeriod,
      data.lastMonth,
      data.lastYear,
      data.categoryMaster,
      filterPosition
    );
  }, [data, filterPosition]);

  // KPI calculations
  const kpis = useMemo(() => {
    if (!branchSummary.length) return null;
    const totalTarget = branchSummary.reduce((s, b) => s + b.target, 0);
    const totalActual = branchSummary.reduce((s, b) => s + b.actual, 0);
    const totalLastMonth = branchSummary.reduce((s, b) => s + b.lastMonth, 0);
    const totalLastYear = branchSummary.reduce((s, b) => s + b.lastYear, 0);
    const achPercent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const momPercent = totalLastMonth > 0 ? ((totalActual - totalLastMonth) / totalLastMonth) * 100 : 0;
    const yoyPercent = totalLastYear > 0 ? ((totalActual - totalLastYear) / totalLastYear) * 100 : 0;
    const totalDays = data.targets[0]?.day || 30;
    const currentDay = new Date().getDate();
    const forecast = currentDay > 0 ? (totalActual / currentDay) * totalDays : 0;
    const forecastPercent = totalTarget > 0 ? (forecast / totalTarget) * 100 : 0;

    return { totalTarget, totalActual, achPercent, momPercent, yoyPercent, forecast, forecastPercent };
  }, [branchSummary, data.targets]);

  // Leaderboard data
  const leaderboard = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod) return { top: [], bottom: [] };
    const officers = calculateOfficerSummary(
      data.targets, data.currentPeriod, data.lastMonth, data.lastYear, data.categoryMaster, 'All Category', 'All Positions'
    ).filter(o => o.target > 0);
    const sorted = [...officers].sort((a, b) => b.achPercent - a.achPercent);
    return {
      top: sorted.slice(0, 5),
      bottom: sorted.slice(-5).reverse(),
    };
  }, [data]);

  // Alert system
  const alerts = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod) return { danger: [], warning: [], success: [] };
    const officers = calculateOfficerSummary(
      data.targets, data.currentPeriod, data.lastMonth, data.lastYear, data.categoryMaster, 'All Category', 'All Positions'
    ).filter(o => o.target > 0);
    return {
      danger: officers.filter(o => o.achPercent < 50).sort((a, b) => a.achPercent - b.achPercent),
      warning: branchSummary.filter(b => b.forecastPercent < 80 && b.target > 0),
      success: officers.filter(o => o.achPercent >= 100).sort((a, b) => b.achPercent - a.achPercent),
    };
  }, [data, branchSummary]);

  // Chart data for category performance
  const chartData = useMemo(() => {
    return categorySummary.map(c => ({
      name: c.groupCategory,
      target: c.target / 1000000,
      actual: c.actual / 1000000,
      achPercent: c.achPercent,
    }));
  }, [categorySummary]);

  // Chart data for iPhone vs Other Ratio
  const branchRatioData = useMemo(() => {
    if (!data.isLoaded.currentPeriod) return [];
    let current = data.currentPeriod;
    if (filterBranch !== 'All Branches') {
      current = current.filter(s => s.branchName.replace(/^ID\d+ : /, '') === filterBranch);
    }
    
    const branchMap = new Map<string, { branch: string, iPhone: number, Other: number }>();
    current.forEach(s => {
      const bName = s.branchName.replace(/^ID\d+ : /, '');
      if (!branchMap.has(bName)) {
        branchMap.set(bName, { branch: bName, iPhone: 0, Other: 0 });
      }
      const isIphone = s.categoryName === 'iPhone';
      const row = branchMap.get(bName)!;
      if (isIphone) row.iPhone += s.totalPrice / 1000000;
      else row.Other += s.totalPrice / 1000000;
    });
    
    return Array.from(branchMap.values()).sort((a, b) => (b.iPhone + b.Other) - (a.iPhone + a.Other));
  }, [data.currentPeriod, filterBranch, data.isLoaded.currentPeriod]);

  const branchColumns = [
    { key: 'branch', label: 'Branch', align: 'left' as const, format: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'target', label: 'Target', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'actual', label: 'Actual', align: 'right' as const, format: (v: number) => <span className="font-semibold">{formatMoney(v)}</span> },
    { key: 'achPercent', label: 'Ach. %', align: 'right' as const, format: (v: number) => formatPercent(v) },
    { key: 'forecast', label: 'Forecast', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'forecastPercent', label: '%Forecast', align: 'right' as const, format: (v: number) => formatPercent(v) },
    { key: 'lastMonth', label: 'Last Month', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'momPercent', label: '% MoM', align: 'right' as const, format: (v: number) => formatDelta(v) },
    { key: 'lastYear', label: 'Last Year', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'yoyPercent', label: '% YoY', align: 'right' as const, format: (v: number) => formatDelta(v) },
    { key: 'targetDay', label: 'Target Day', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'actualDay', label: 'Actual Day', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'diffDay', label: 'Diff Day', align: 'right' as const, format: (v: number) => formatDiff(v) },
  ];

  const categoryColumns = [
    { key: 'groupCategory', label: 'Group Category', align: 'left' as const, format: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'target', label: 'Target', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'actual', label: 'Actual', align: 'right' as const, format: (v: number) => <span className="font-semibold">{formatMoney(v)}</span> },
    { key: 'achPercent', label: 'Ach. %', align: 'right' as const, format: (v: number) => formatPercent(v) },
    { key: 'forecast', label: 'Forecast', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'forecastPercent', label: '%Forecast', align: 'right' as const, format: (v: number) => formatPercent(v) },
    { key: 'lastMonth', label: 'Last Month', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'momPercent', label: '% MoM', align: 'right' as const, format: (v: number) => formatDelta(v) },
    { key: 'lastYear', label: 'Last Year', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'yoyPercent', label: '% YoY', align: 'right' as const, format: (v: number) => formatDelta(v) },
    { key: 'targetDay', label: 'Target Day', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'actualDay', label: 'Actual Day', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'diffDay', label: 'Diff Day', align: 'right' as const, format: (v: number) => formatDiff(v) },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 md:p-8">
        <img 
          src={HERO_IMAGE} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-1">Monthly Overall Performance</h2>
          <p className="text-emerald-100 text-sm">Performance snapshot across all categories and branches</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Branch:</label>
          <select
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option>All Branches</option>
            {branchesList.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Position:</label>
          <select
            value={filterPosition}
            onChange={e => setFilterPosition(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option>All Positions</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">View by Category:</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option>All Category</option>
            <option>iPhone</option>
            <option>Mac</option>
            <option>iPad</option>
            <option>Apple Watch</option>
          </select>
        </div>
      </div>

      {/* Alert System */}
      {(alerts.danger.length > 0 || alerts.warning.length > 0 || alerts.success.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
        >
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Performance Alerts</h3>
              <div className="flex items-center gap-1.5">
                {alerts.danger.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                    {alerts.danger.length} Danger
                  </span>
                )}
                {alerts.warning.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                    {alerts.warning.length} Warning
                  </span>
                )}
                {alerts.success.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    {alerts.success.length} Achieved
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${alertsOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {alertsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Danger */}
                  <div className="bg-rose-50/50 dark:bg-rose-950/30 rounded-xl p-4 border border-rose-100 dark:border-rose-900/50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Ach. &lt; 50%</span>
                    </div>
                    {alerts.danger.length === 0 ? (
                      <p className="text-xs text-rose-400">No critical staff</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {alerts.danger.slice(0, 8).map((o, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-rose-800 dark:text-rose-300 font-medium truncate max-w-[140px]">{o.officerName}</span>
                            <span className="text-rose-600 font-bold tabular-nums">{o.achPercent.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Warning */}
                  <div className="bg-amber-50/50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Branch Forecast &lt; 80%</span>
                    </div>
                    {alerts.warning.length === 0 ? (
                      <p className="text-xs text-amber-400">All branches on track</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {alerts.warning.map((b, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-amber-800 dark:text-amber-300 font-medium truncate max-w-[140px]">{b.branch}</span>
                            <span className="text-amber-600 font-bold tabular-nums">{b.forecastPercent.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Success */}
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Ach. ≥ 100%</span>
                    </div>
                    {alerts.success.length === 0 ? (
                      <p className="text-xs text-emerald-400">No one yet — keep pushing!</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {alerts.success.slice(0, 8).map((o, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              {i < 3 && <span>{['🥇','🥈','🥉'][i]}</span>}
                              <span className="text-emerald-800 dark:text-emerald-300 font-medium truncate max-w-[120px]">{o.officerName}</span>
                            </div>
                            <span className="text-emerald-600 font-bold tabular-nums">{o.achPercent.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Sales"
            value={formatCurrency(kpis.totalActual)}
            icon={<DollarSign className="w-4 h-4" />}
            progress={kpis.achPercent}
            color="green"
          />
          <KpiCard
            title="Achievement"
            value={kpis.achPercent.toFixed(1) + '%'}
            subtitle={`of ${formatCurrency(kpis.totalTarget)}`}
            icon={<Target className="w-4 h-4" />}
            color={kpis.achPercent >= 100 ? 'green' : kpis.achPercent >= 80 ? 'amber' : 'rose'}
          />
          <KpiCard
            title="Forecast"
            value={formatCurrency(kpis.forecast)}
            subtitle={kpis.forecastPercent.toFixed(1) + '%'}
            icon={<TrendingUp className="w-4 h-4" />}
            color="blue"
          />
          <KpiCard
            title="vs Last Month"
            value={(kpis.momPercent >= 0 ? '+' : '') + kpis.momPercent.toFixed(1) + '%'}
            delta={kpis.yoyPercent}
            deltaLabel="vs Last Year"
            icon={<BarChart3 className="w-4 h-4" />}
            color={kpis.momPercent >= 0 ? 'green' : 'rose'}
          />
        </div>
      )}

      {/* Staff Leaderboard */}
      {leaderboard.top.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top 5 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Top 5 Performers</h3>
            </div>
            <div className="space-y-2">
              {leaderboard.top.map((o, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      i === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-100 dark:border-amber-900/50'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="text-lg w-7 text-center">{medals[i] || `#${i + 1}`}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{o.officerName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{o.position} · {o.branch}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black tabular-nums ${o.achPercent >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {o.achPercent.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-gray-400 tabular-nums">{formatMoney(o.actual)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Bottom 5 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-sm">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Bottom 5 — Needs Attention</h3>
            </div>
            <div className="space-y-2">
              {leaderboard.bottom.map((o, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    i === 0 ? 'bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="text-xs font-bold text-rose-400 w-7 text-center">#{leaderboard.top.length + leaderboard.bottom.length - leaderboard.bottom.length + i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{o.officerName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{o.position} · {o.branch}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black tabular-nums ${
                      o.achPercent < 50 ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {o.achPercent.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-gray-400 tabular-nums">{formatMoney(o.actual)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Performance Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
        >
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Sales by Category vs. Target (MB)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(value: number) => [value.toFixed(2) + 'M', '']}
              />
              <Bar dataKey="target" fill="#d1d5db" radius={[4, 4, 0, 0]} name="Target" />
              <Bar dataKey="actual" radius={[4, 4, 0, 0]} name="Actual">
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.achPercent >= 100 ? '#059669' : entry.achPercent >= 80 ? '#d97706' : '#e11d48'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Sales Ratio Chart */}
      {branchRatioData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
        >
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Sales Ratio vs. iPhone by Branch (MB)
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(250, branchRatioData.length * 55 + 50)}>
            <BarChart data={branchRatioData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="branch" width={100} tick={{ fontSize: 10, fill: '#4b5563' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(value: number) => [value.toFixed(2) + 'M', '']}
              />
              <Bar dataKey="iPhone" stackId="a" fill="#0ea5e9" name="iPhone" radius={[0, 0, 0, 0]} maxBarSize={48} />
              <Bar dataKey="Other" stackId="a" fill="#10b981" name="Other Categories" radius={[0, 4, 4, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Branch Summary Table */}
      <DataTable
        title={`Sales by Branch vs. Target (${filterCategory})`}
        icon={<ShoppingBag className="w-4 h-4" />}
        columns={branchColumns}
        data={branchSummary}
        emptyMessage="Upload Target and Current Period files to see data."
        searchable
        searchKeys={['branch']}
      />

      {/* Category Summary Table */}
      <DataTable
        title="Sales by Group Category vs. Target"
        icon={<BarChart3 className="w-4 h-4" />}
        columns={categoryColumns}
        data={categorySummary}
        emptyMessage="Upload Category Master and Current Period files to see data."
        searchable
        searchKeys={['groupCategory']}
      />
    </div>
  );
}
