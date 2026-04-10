/*
 * Design: Crystal Report — Swiss Precision
 * Commission calculator tab - shows estimated commission by staff.
 * Uses target achievement tiers to calculate commission rates.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatPercent, formatMoney } from '@/components/DataTable';
import { calculateOfficerSummary } from '@/lib/dataProcessor';
import { Calculator, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

// Commission tier structure
function getCommissionTier(achPercent: number): { tier: string; rate: number } {
  if (achPercent >= 120) return { tier: 'S', rate: 3.0 };
  if (achPercent >= 100) return { tier: 'A', rate: 2.5 };
  if (achPercent >= 90) return { tier: 'B', rate: 2.0 };
  if (achPercent >= 80) return { tier: 'C', rate: 1.5 };
  if (achPercent >= 70) return { tier: 'D', rate: 1.0 };
  return { tier: '-', rate: 0 };
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'S': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'A': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'B': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'C': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'D': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-50 text-gray-400 border-gray-100';
  }
}

export default function CommissionTab() {
  const data = useData();
  const [filterPosition, setFilterPosition] = useState('All Positions');

  const positions = useMemo(() => {
    if (!data.targets.length) return [];
    return Array.from(new Set(data.targets.map(t => t.position))).sort();
  }, [data.targets]);

  const commissionData = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod) return [];

    const officers = calculateOfficerSummary(
      data.targets,
      data.currentPeriod,
      data.lastMonth,
      data.lastYear,
      data.categoryMaster,
      'All Category',
      filterPosition
    );

    return officers.map(o => {
      const { tier, rate } = getCommissionTier(o.achPercent);
      const estimatedComm = o.actual * (rate / 100);
      return {
        ...o,
        tier,
        schemePercent: rate,
        estimatedComm,
      };
    }).sort((a, b) => b.achPercent - a.achPercent);
  }, [data, filterPosition]);

  // Summary stats
  const summary = useMemo(() => {
    if (!commissionData.length) return null;
    const totalSales = commissionData.reduce((s, c) => s + c.actual, 0);
    const totalComm = commissionData.reduce((s, c) => s + c.estimatedComm, 0);
    const avgAch = commissionData.reduce((s, c) => s + c.achPercent, 0) / commissionData.length;
    const tierCounts = commissionData.reduce((acc, c) => {
      acc[c.tier] = (acc[c.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { totalSales, totalComm, avgAch, tierCounts };
  }, [commissionData]);

  const columns = [
    { key: 'officerName', label: 'Officer Name', align: 'left' as const, format: (v: string) => <span className="font-semibold text-gray-800">{v}</span> },
    { key: 'position', label: 'Position', align: 'left' as const, format: (v: string) => <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{v}</span> },
    { key: 'target', label: 'Target', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'actual', label: 'Actual', align: 'right' as const, format: (v: number) => <span className="font-semibold">{formatMoney(v)}</span> },
    { key: 'achPercent', label: 'Ach. %', align: 'right' as const, format: (v: number) => formatPercent(v) },
    { key: 'forecast', label: 'Forecast', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'forecastPercent', label: '%Forecast', align: 'right' as const, format: (v: number) => formatPercent(v) },
    { key: 'tier', label: 'Tier', align: 'center' as const, format: (v: string) => (
      <span className={`inline-flex items-center justify-center w-8 h-6 text-xs font-bold rounded-md border ${getTierColor(v)}`}>
        {v}
      </span>
    )},
    { key: 'schemePercent', label: 'Scheme %', align: 'right' as const, format: (v: number) => <span className="font-medium">{v.toFixed(1)}%</span> },
    { key: 'estimatedComm', label: 'Est. Commission', align: 'right' as const, format: (v: number) => (
      <span className="font-semibold text-emerald-700">
        {v >= 1000000 ? '฿' + (v / 1000000).toFixed(2) + 'M' : '฿' + v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Commission Calculator
            </h2>
            <p className="text-sm text-gray-500">Estimated commission based on achievement tiers. Actual commission may vary based on company policy.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Position:</label>
            <select
              value={filterPosition}
              onChange={e => setFilterPosition(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option>All Positions</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tier Legend */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
      >
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Commission Tiers</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { tier: 'S', range: '120%+', rate: '3.0%' },
            { tier: 'A', range: '100-119%', rate: '2.5%' },
            { tier: 'B', range: '90-99%', rate: '2.0%' },
            { tier: 'C', range: '80-89%', rate: '1.5%' },
            { tier: 'D', range: '70-79%', rate: '1.0%' },
          ].map(t => (
            <div key={t.tier} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className={`inline-flex items-center justify-center w-7 h-6 text-xs font-bold rounded-md border ${getTierColor(t.tier)}`}>
                {t.tier}
              </span>
              <div className="text-xs">
                <span className="text-gray-600 font-medium">{t.range}</span>
                <span className="text-gray-400 mx-1">→</span>
                <span className="text-emerald-700 font-semibold">{t.rate}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Total Sales</p>
            <p className="text-2xl font-extrabold text-gray-900 tabular-nums">
              ฿{(summary.totalSales / 1000000).toFixed(2)}M
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Est. Total Commission</p>
            <p className="text-2xl font-extrabold text-emerald-700 tabular-nums">
              ฿{summary.totalComm >= 1000000 ? (summary.totalComm / 1000000).toFixed(2) + 'M' : summary.totalComm.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Avg Achievement</p>
            <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{summary.avgAch.toFixed(1)}%</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Tier Distribution</p>
            <div className="flex items-center gap-1.5 mt-1">
              {['S', 'A', 'B', 'C', 'D'].map(t => (
                <div key={t} className="text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-5 text-[10px] font-bold rounded border ${getTierColor(t)}`}>
                    {t}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5 tabular-nums">{summary.tierCounts[t] || 0}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Commission Table */}
      <DataTable
        title="Sales by Staff vs. Target & Commission"
        icon={<Users className="w-4 h-4" />}
        columns={columns}
        data={commissionData}
        emptyMessage="Upload Target and Current Period files to calculate commissions."
      />
    </div>
  );
}
