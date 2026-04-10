/*
 * Design: Crystal Report — Swiss Precision
 * Staff tab showing individual officer performance with filters.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatPercent, formatDelta, formatMoney, formatDiff } from '@/components/DataTable';
import { calculateOfficerSummary, calculateCategorySummary } from '@/lib/dataProcessor';
import { Users, BarChart3 } from 'lucide-react';

export default function StaffTab() {
  const data = useData();
  const [filterCategory, setFilterCategory] = useState('All Category');
  const [filterPosition, setFilterPosition] = useState('All Positions');
  const [filterStaff, setFilterStaff] = useState('All Staff');
  const [filterBranch, setFilterBranch] = useState('All Branches');

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
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          Staff Page Filters
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Branch:</label>
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option>All Staff</option>
              {staffNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

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
        title="Sales by Officer vs. Target"
        icon={<Users className="w-4 h-4" />}
        columns={officerColumns}
        data={officerSummary}
        emptyMessage="No officers found. Upload required files."
      />
    </div>
  );
}
