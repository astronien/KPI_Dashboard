/*
 * Design: Crystal Report — Swiss Precision
 * Deep dive analysis by category and sub-category with officer filter.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatDelta, formatMoney, formatDiff } from '@/components/DataTable';
import { Search, Layers } from 'lucide-react';

interface DeepDiveRow {
  category: string;
  currentSales: number;
  lastMonth: number;
  diffLM: number;
  momPercent: number;
  lastYear: number;
  diffLY: number;
  yoyPercent: number;
  currentUnits: number;
  lastMonthUnits: number;
  diffLMUnits: number;
}

export default function DeepDiveTab() {
  const data = useData();
  const [filterOfficer, setFilterOfficer] = useState('All Officers');
  const [filterCategory, setFilterCategory] = useState('All Categories');

  const officers = useMemo(() => {
    if (!data.currentPeriod.length) return [];
    return Array.from(new Set(data.currentPeriod.map(s => s.officerName))).filter(Boolean).sort();
  }, [data.currentPeriod]);

  const categories = useMemo(() => {
    if (!data.currentPeriod.length) return [];
    return Array.from(new Set(data.currentPeriod.map(s => s.categoryName))).filter(Boolean).sort();
  }, [data.currentPeriod]);

  const categoryData = useMemo(() => {
    if (!data.isLoaded.currentPeriod) return [];

    let current = data.currentPeriod;
    let lastMonth = data.lastMonth;
    let lastYear = data.lastYear;

    if (filterOfficer !== 'All Officers') {
      current = current.filter(s => s.officerName === filterOfficer);
      lastMonth = lastMonth.filter(s => s.officerName === filterOfficer);
      lastYear = lastYear.filter(s => s.officerName === filterOfficer);
    }

    if (filterCategory !== 'All Categories') {
      current = current.filter(s => s.categoryName === filterCategory);
      lastMonth = lastMonth.filter(s => s.categoryName === filterCategory);
      lastYear = lastYear.filter(s => s.categoryName === filterCategory);
    }

    // Group by category
    const catMap = new Map<string, DeepDiveRow>();
    
    current.forEach(s => {
      const key = s.categoryName;
      if (!catMap.has(key)) {
        catMap.set(key, { category: key, currentSales: 0, lastMonth: 0, diffLM: 0, momPercent: 0, lastYear: 0, diffLY: 0, yoyPercent: 0, currentUnits: 0, lastMonthUnits: 0, diffLMUnits: 0 });
      }
      const row = catMap.get(key)!;
      row.currentSales += s.totalPrice;
      row.currentUnits += s.number;
    });

    lastMonth.forEach(s => {
      const key = s.categoryName;
      if (!catMap.has(key)) {
        catMap.set(key, { category: key, currentSales: 0, lastMonth: 0, diffLM: 0, momPercent: 0, lastYear: 0, diffLY: 0, yoyPercent: 0, currentUnits: 0, lastMonthUnits: 0, diffLMUnits: 0 });
      }
      const row = catMap.get(key)!;
      row.lastMonth += s.totalPrice;
      row.lastMonthUnits += s.number;
    });

    lastYear.forEach(s => {
      const key = s.categoryName;
      if (!catMap.has(key)) {
        catMap.set(key, { category: key, currentSales: 0, lastMonth: 0, diffLM: 0, momPercent: 0, lastYear: 0, diffLY: 0, yoyPercent: 0, currentUnits: 0, lastMonthUnits: 0, diffLMUnits: 0 });
      }
      catMap.get(key)!.lastYear += s.totalPrice;
    });

    return Array.from(catMap.values()).map(row => ({
      ...row,
      diffLM: row.currentSales - row.lastMonth,
      momPercent: row.lastMonth > 0 ? ((row.currentSales - row.lastMonth) / row.lastMonth) * 100 : 0,
      diffLY: row.currentSales - row.lastYear,
      yoyPercent: row.lastYear > 0 ? ((row.currentSales - row.lastYear) / row.lastYear) * 100 : 0,
      diffLMUnits: row.currentUnits - row.lastMonthUnits,
    })).sort((a, b) => b.currentSales - a.currentSales);
  }, [data, filterOfficer, filterCategory]);

  // Sub-category data
  const subCategoryData = useMemo(() => {
    if (!data.isLoaded.currentPeriod) return [];

    let current = data.currentPeriod;
    let lastMonth = data.lastMonth;
    let lastYear = data.lastYear;

    if (filterOfficer !== 'All Officers') {
      current = current.filter(s => s.officerName === filterOfficer);
      lastMonth = lastMonth.filter(s => s.officerName === filterOfficer);
      lastYear = lastYear.filter(s => s.officerName === filterOfficer);
    }

    if (filterCategory !== 'All Categories') {
      current = current.filter(s => s.categoryName === filterCategory);
      lastMonth = lastMonth.filter(s => s.categoryName === filterCategory);
      lastYear = lastYear.filter(s => s.categoryName === filterCategory);
    }

    const subMap = new Map<string, DeepDiveRow>();

    current.forEach(s => {
      const key = s.subCategory;
      if (!subMap.has(key)) {
        subMap.set(key, { category: key, currentSales: 0, lastMonth: 0, diffLM: 0, momPercent: 0, lastYear: 0, diffLY: 0, yoyPercent: 0, currentUnits: 0, lastMonthUnits: 0, diffLMUnits: 0 });
      }
      const row = subMap.get(key)!;
      row.currentSales += s.totalPrice;
      row.currentUnits += s.number;
    });

    lastMonth.forEach(s => {
      const key = s.subCategory;
      if (!subMap.has(key)) {
        subMap.set(key, { category: key, currentSales: 0, lastMonth: 0, diffLM: 0, momPercent: 0, lastYear: 0, diffLY: 0, yoyPercent: 0, currentUnits: 0, lastMonthUnits: 0, diffLMUnits: 0 });
      }
      const row = subMap.get(key)!;
      row.lastMonth += s.totalPrice;
      row.lastMonthUnits += s.number;
    });

    lastYear.forEach(s => {
      const key = s.subCategory;
      if (!subMap.has(key)) {
        subMap.set(key, { category: key, currentSales: 0, lastMonth: 0, diffLM: 0, momPercent: 0, lastYear: 0, diffLY: 0, yoyPercent: 0, currentUnits: 0, lastMonthUnits: 0, diffLMUnits: 0 });
      }
      subMap.get(key)!.lastYear += s.totalPrice;
    });

    return Array.from(subMap.values()).map(row => ({
      ...row,
      diffLM: row.currentSales - row.lastMonth,
      momPercent: row.lastMonth > 0 ? ((row.currentSales - row.lastMonth) / row.lastMonth) * 100 : 0,
      diffLY: row.currentSales - row.lastYear,
      yoyPercent: row.lastYear > 0 ? ((row.currentSales - row.lastYear) / row.lastYear) * 100 : 0,
      diffLMUnits: row.currentUnits - row.lastMonthUnits,
    })).sort((a, b) => b.currentSales - a.currentSales);
  }, [data, filterOfficer, filterCategory]);

  const columns = [
    { key: 'category', label: 'Category', align: 'left' as const, format: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'currentSales', label: 'Current', align: 'right' as const, format: (v: number) => <span className="font-semibold">{formatMoney(v)}</span> },
    { key: 'lastMonth', label: 'Last Month', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'diffLM', label: 'Diff LM', align: 'right' as const, format: (v: number) => formatDiff(v) },
    { key: 'momPercent', label: '% MoM', align: 'right' as const, format: (v: number) => formatDelta(v) },
    { key: 'lastYear', label: 'Last Year', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'diffLY', label: 'Diff LY', align: 'right' as const, format: (v: number) => formatDiff(v) },
    { key: 'yoyPercent', label: '% YoY', align: 'right' as const, format: (v: number) => formatDelta(v) },
    { key: 'currentUnits', label: 'Units', align: 'right' as const, format: (v: number) => v.toLocaleString() },
    { key: 'lastMonthUnits', label: 'LM Units', align: 'right' as const, format: (v: number) => v.toLocaleString() },
    { key: 'diffLMUnits', label: 'Diff Units', align: 'right' as const, format: (v: number) => formatDiff(v) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Category Deep Dive</h2>
        <p className="text-sm text-gray-500 mb-4">Analyze sales performance for key product categories to identify trends and issues.</p>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Officer:</label>
            <select
              value={filterOfficer}
              onChange={e => setFilterOfficer(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option>All Officers</option>
              {officers.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Category:</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option>All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Overall by Category */}
      <DataTable
        title="Overall by Category"
        icon={<Search className="w-4 h-4" />}
        columns={columns}
        data={categoryData}
        emptyMessage="No data available. Upload Current Period file."
      />

      {/* By Sub Category */}
      <DataTable
        title="By Sub Category"
        icon={<Layers className="w-4 h-4" />}
        columns={columns.map(c => c.key === 'category' ? { ...c, label: 'Sub Category' } : c)}
        data={subCategoryData}
        emptyMessage="No data available."
      />
    </div>
  );
}
