/*
 * Design: Crystal Report — Swiss Precision
 * Overview tab with KPI cards, branch summary, category summary tables.
 * Uses forest green accents, clean whitespace, and animated elements.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import KpiCard from '@/components/KpiCard';
import DataTable, { formatPercent, formatDelta, formatMoney, formatDiff } from '@/components/DataTable';
import { calculateBranchSummary, calculateCategorySummary, formatCurrency } from '@/lib/dataProcessor';
import { BarChart3, TrendingUp, Target, DollarSign, Users, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const HERO_IMAGE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663113035049/QEeU9YZXUQKMMUHwtjvw9N/hero-pattern-FG6x6Wewo3JDoZZdN4SrnL.webp';

export default function OverviewTab() {
  const data = useData();
  const [filterCategory, setFilterCategory] = useState('All Category');
  const [filterPosition, setFilterPosition] = useState('All Positions');

  const positions = useMemo(() => {
    if (!data.targets.length) return [];
    return Array.from(new Set(data.targets.map(t => t.position))).sort();
  }, [data.targets]);

  const branchSummary = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod) return [];
    return calculateBranchSummary(
      data.targets,
      data.currentPeriod,
      data.lastMonth,
      data.lastYear,
      data.categoryMaster,
      filterCategory
    );
  }, [data, filterCategory]);

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

  // Chart data for category performance
  const chartData = useMemo(() => {
    return categorySummary.map(c => ({
      name: c.groupCategory,
      target: c.target / 1000000,
      actual: c.actual / 1000000,
      achPercent: c.achPercent,
    }));
  }, [categorySummary]);

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
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Filter by Position:</label>
          <select
            value={filterPosition}
            onChange={e => setFilterPosition(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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

      {/* Category Performance Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
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

      {/* Branch Summary Table */}
      <DataTable
        title={`Sales by Branch vs. Target (${filterCategory})`}
        icon={<ShoppingBag className="w-4 h-4" />}
        columns={branchColumns}
        data={branchSummary}
        emptyMessage="Upload Target and Current Period files to see data."
      />

      {/* Category Summary Table */}
      <DataTable
        title="Sales by Group Category vs. Target"
        icon={<BarChart3 className="w-4 h-4" />}
        columns={categoryColumns}
        data={categorySummary}
        emptyMessage="Upload Category Master and Current Period files to see data."
      />
    </div>
  );
}
