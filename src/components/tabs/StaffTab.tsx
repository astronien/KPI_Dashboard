/*
 * Design: Crystal Report — Swiss Precision
 * Staff tab showing individual officer performance with filters.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatPercent, formatDelta, formatMoney, formatDiff } from '@/components/DataTable';
import { calculateOfficerSummary, calculateCategorySummary } from '@/lib/dataProcessor';
import { Users, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import OfficerModal from '@/components/OfficerModal';

export default function StaffTab() {
  const data = useData();
  const [filterCategory, setFilterCategory] = useState('All Category');
  const [filterPosition, setFilterPosition] = useState('All Positions');
  const [filterStaff, setFilterStaff] = useState('All Staff');
  const [filterBranch, setFilterBranch] = useState('All Branches');
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);

  const branchesList = useMemo(() => {
    if (!data.targets.length) return [];
    return Array.from(new Set(data.targets.map(t => t.branchName.replace(/^ID\d+ : /, '')))).sort();
  }, [data.targets]);

  const positions = useMemo(() => {
    if (!data.targets.length) return [];
    return Array.from(new Set(data.targets.map(t => t.position))).sort();
  }, [data.targets]);

  const staffNames = useMemo(() => {
    if (!data.targets.length) return [];
    return Array.from(new Set(data.targets.map(t => t.name))).sort();
  }, [data.targets]);

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

  const officerSummary = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod) return [];
    let result = calculateOfficerSummary(
      data.targets,
      data.currentPeriod,
      data.lastMonth,
      data.lastYear,
      data.categoryMaster,
      filterCategory,
      filterPosition
    );
    if (filterBranch !== 'All Branches') {
      result = result.filter(o => o.branch.replace(/^ID\d+ : /, '') === filterBranch);
    }
    if (filterStaff !== 'All Staff') {
      result = result.filter(o => o.officerName === filterStaff);
    }
    return result;
  }, [data, filterCategory, filterPosition, filterStaff, filterBranch]);

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
  ];

  const officerColumns = [
    { key: 'officerName', label: 'Officer Name', align: 'left' as const, format: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'position', label: 'Position', align: 'left' as const, format: (v: string) => <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{v}</span> },
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
    { key: 'diffDay', label: 'Diff Day', align: 'right' as const, format: (v: number) => formatDiff(v) },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-rose-600" />
          Staff Page Filters
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Branch:</label>
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
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
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            >
              <option>All Positions</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Category:</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            >
              <option>All Category</option>
              <option>iPhone</option>
              <option>Mac</option>
              <option>iPad</option>
              <option>Apple Watch</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Staff:</label>
            <select
              value={filterStaff}
              onChange={e => setFilterStaff(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            >
              <option>All Staff</option>
              {staffNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Officer Target vs Actual Chart */}
      {officerSummary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-5"
        >
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-600" />
            Officer Sales vs. Target (MB)
          </h3>
          <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div style={{ minWidth: `${Math.max(100, officerSummary.length * 60)}px`, height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={officerSummary} margin={{ top: 20, right: 20, left: 0, bottom: 40 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="officerName" 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    angle={-45} 
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#4b5563' }} 
                    tickFormatter={(val) => (val/1000000).toFixed(1) + 'M'} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: number, name: string) => [
                      value >= 1000000 ? (value/1000000).toFixed(2) + 'M' : value.toLocaleString(), 
                      name === 'target' ? 'Target' : 'Actual'
                    ]}
                  />
                  <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Target" maxBarSize={40} />
                  <Bar dataKey="actual" radius={[4, 4, 0, 0]} name="Actual" maxBarSize={40}>
                    {officerSummary.map((entry, index) => (
                      <Cell key={index} fill={entry.achPercent >= 100 ? '#10b981' : entry.achPercent >= 80 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Summary */}
      <DataTable
        title="Sales by Group Category vs. Target"
        icon={<BarChart3 className="w-4 h-4" />}
        columns={categoryColumns}
        data={categorySummary}
        emptyMessage="Upload Category Master and Current Period files."
      />

      {/* Officer Summary */}
      <DataTable
        title="Sales by Officer vs. Target (Click to view Mix Breakdown)"
        icon={<Users className="w-4 h-4" />}
        columns={officerColumns}
        data={officerSummary}
        onRowClick={(row) => setSelectedOfficer(row.officerName)}
        emptyMessage="No officers found. Upload required files."
      />

      <OfficerModal 
        isOpen={!!selectedOfficer} 
        onClose={() => setSelectedOfficer(null)} 
        officerName={selectedOfficer || ''} 
      />
    </div>
  );
}
