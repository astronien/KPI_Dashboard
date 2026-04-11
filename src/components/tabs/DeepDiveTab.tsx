/*
 * Design: Crystal Report — Swiss Precision
 * Deep dive analysis by category and sub-category with officer filter.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatDelta, formatMoney, formatDiff } from '@/components/DataTable';
import { Search, Layers, Maximize2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const PcCard = ({ title, share, pcAtt, rev, units, color }: any) => {
  const bgColors: Record<string, string> = {
    emerald: 'border-emerald-100/80 bg-emerald-50/20 hover:border-emerald-200 hover:shadow-emerald-100/50',
    blue: 'border-blue-100/80 bg-blue-50/20 hover:border-blue-200 hover:shadow-blue-100/50',
    amber: 'border-amber-100/80 bg-amber-50/20 hover:border-amber-200 hover:shadow-amber-100/50',
    purple: 'border-purple-100/80 bg-purple-50/20 hover:border-purple-200 hover:shadow-purple-100/50',
    rose: 'border-rose-100/80 bg-rose-50/20 hover:border-rose-200 hover:shadow-rose-100/50',
  };
  const textColors: Record<string, string> = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    purple: 'text-purple-700',
    rose: 'text-rose-700',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${bgColors[color]} p-4 shadow-sm transition-all duration-200 group relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-4 border-b border-gray-100/50 pb-2">
        <h3 className={`text-sm font-bold tracking-tight uppercase ${textColors[color]}`}>{title}</h3>
        <button className="text-gray-400 hover:text-gray-700 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 font-medium">Share %</span>
          <span className="font-bold text-gray-800">{share}%</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 font-medium">PC ATT %</span>
          <span className="font-bold text-gray-800">{pcAtt}%</span>
        </div>
        <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-50">
          <span className="text-gray-500 font-medium">Total Rev (MB)</span>
          <span className="font-bold text-gray-800">{rev}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 font-medium">Total Units</span>
          <span className="font-bold text-gray-800">{units}</span>
        </div>
      </div>
    </motion.div>
  );
};

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
  const [dayStart, setDayStart] = useState(1);
  const [dayEnd, setDayEnd] = useState(31);

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
    
    // Day filter for current period only to understand in-month pacing vs historical full months
    current = current.filter(s => {
      if (!s.docDate) return true;
      const day = new Date(s.docDate).getDate();
      if (isNaN(day)) return true;
      return day >= dayStart && day <= dayEnd;
    });

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

    // Day filter
    current = current.filter(s => {
      if (!s.docDate) return true;
      const day = new Date(s.docDate).getDate();
      if (isNaN(day)) return true;
      return day >= dayStart && day <= dayEnd;
    });

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
  }, [data, filterOfficer, filterCategory, dayStart, dayEnd]);

  // Officer data
  const officerData = useMemo(() => {
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

    // Day filter
    current = current.filter(s => {
      if (!s.docDate) return true;
      const day = new Date(s.docDate).getDate();
      if (isNaN(day)) return true;
      return day >= dayStart && day <= dayEnd;
    });

    const officerMap = new Map<string, DeepDiveRow>();

    current.forEach(s => {
      const key = s.officerName || 'Unknown';
      if (!officerMap.has(key)) {
        officerMap.set(key, { category: key, currentSales: 0, lastMonth: 0, diffLM: 0, momPercent: 0, lastYear: 0, diffLY: 0, yoyPercent: 0, currentUnits: 0, lastMonthUnits: 0, diffLMUnits: 0 });
      }
      const row = officerMap.get(key)!;
      row.currentSales += s.totalPrice;
      row.currentUnits += s.number;
    });

    lastMonth.forEach(s => {
      const key = s.officerName || 'Unknown';
      if (!officerMap.has(key)) {
        officerMap.set(key, { category: key, currentSales: 0, lastMonth: 0, diffLM: 0, momPercent: 0, lastYear: 0, diffLY: 0, yoyPercent: 0, currentUnits: 0, lastMonthUnits: 0, diffLMUnits: 0 });
      }
      const row = officerMap.get(key)!;
      row.lastMonth += s.totalPrice;
      row.lastMonthUnits += s.number;
    });

    lastYear.forEach(s => {
      const key = s.officerName || 'Unknown';
      if (!officerMap.has(key)) {
        officerMap.set(key, { category: key, currentSales: 0, lastMonth: 0, diffLM: 0, momPercent: 0, lastYear: 0, diffLY: 0, yoyPercent: 0, currentUnits: 0, lastMonthUnits: 0, diffLMUnits: 0 });
      }
      officerMap.get(key)!.lastYear += s.totalPrice;
    });

    return Array.from(officerMap.values()).map(row => ({
      ...row,
      diffLM: row.currentSales - row.lastMonth,
      momPercent: row.lastMonth > 0 ? ((row.currentSales - row.lastMonth) / row.lastMonth) * 100 : 0,
      diffLY: row.currentSales - row.lastYear,
      yoyPercent: row.lastYear > 0 ? ((row.currentSales - row.lastYear) / row.lastYear) * 100 : 0,
      diffLMUnits: row.currentUnits - row.lastMonthUnits,
    })).sort((a, b) => b.currentSales - a.currentSales);
  }, [data, filterOfficer, filterCategory, dayStart, dayEnd]);

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
        <h2 className="text-lg font-bold text-gray-800 mb-1">PC Zone Dashboard</h2>
        <p className="text-sm text-gray-500 mb-4">Analyze PC performance metrics: Super Sales, RTB, MTJ, INCEN, and D+.</p>
        
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
          
          <div className="flex items-center gap-3 ml-auto border-l pl-4 border-gray-100">
            <label className="text-xs font-medium text-gray-500">Day Range:</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min={1} max={31} 
                value={dayStart} 
                onChange={e => setDayStart(Number(e.target.value))} 
                className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none text-center"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="number" 
                min={1} max={31} 
                value={dayEnd} 
                onChange={e => setDayEnd(Number(e.target.value))} 
                className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none text-center"
              />
            </div>
            <button
              onClick={() => { setDayStart(1); setDayEnd(31); setFilterOfficer('All Officers'); setFilterCategory('All Categories'); }}
              className="text-xs text-gray-500 hover:text-emerald-600 font-medium px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* PC KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-2">
        <PcCard title="SUPER SALES" share="24.5" pcAtt="89.1" rev="2.4M" units="1,240" color="emerald" />
        <PcCard title="RTB" share="18.2" pcAtt="76.4" rev="1.8M" units="950" color="blue" />
        <PcCard title="MTJ" share="15.8" pcAtt="82.0" rev="1.5M" units="820" color="amber" />
        <PcCard title="INCEN" share="12.0" pcAtt="65.3" rev="1.1M" units="600" color="purple" />
        <PcCard title="D+" share="29.5" pcAtt="95.5" rev="3.1M" units="1,650" color="rose" />
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

      {/* By Officer */}
      <DataTable
        title="By Officer"
        icon={<Search className="w-4 h-4" />}
        columns={columns.map(c => c.key === 'category' ? { ...c, label: 'Officer Name' } : c)}
        data={officerData}
        emptyMessage="No data available."
      />

      {/* Unmapped Brands Alert Area */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 mt-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900 mb-1">Unmapped Brands Action Required</h3>
            <p className="text-xs text-amber-700/80 mb-3">The following items generated revenue but have not been mapped to any specific brand in the category master yet.</p>
            <div className="bg-white/60 rounded-lg border border-amber-100 p-3 text-xs">
               <span className="text-gray-500 italic block text-center py-2">All brands are currently mapped correctly. No action required.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
