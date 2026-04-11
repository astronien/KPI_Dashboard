/*
 * Design: Crystal Report — Swiss Precision
 * Deep dive analysis by category and sub-category with officer filter.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatDelta, formatMoney, formatDiff } from '@/components/DataTable';
import { Search, Layers, Maximize2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopBrand {
  name: string;
  units: number;
  revenue: string;
}

const PcBrandCard = ({ title, share, pcAtt, rev, units, color, brands }: { 
  title: string, share: string, pcAtt: string, rev: string, units: string, color: string, brands: TopBrand[] 
}) => {
  const bgMapping: Record<string, string> = {
    orange: 'bg-[#ff7b00]',
    blue: 'bg-[#3b5ae0]',
    emerald: 'bg-[#00b976]',
    pink: 'bg-[#f40f6c]',
    purple: 'bg-[#b624ff]',
    slate: 'bg-[#4b5563]',
  };
  
  const headerBg = bgMapping[color] || bgMapping.slate;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col shadow-lg border border-gray-800/20">
      {/* Top Half */}
      <div className={`${headerBg} p-5 pb-6 text-white relative`}>
        <button className="absolute top-4 right-4 p-1.5 bg-black/10 hover:bg-black/20 rounded-xl transition-colors">
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
        
        <h3 className="text-xl font-black tracking-tight mb-3 uppercase">{title}</h3>
        
        <div className="flex gap-2 mb-6">
          <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-[10px] font-bold">SHARE: {share}%</span>
          <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-[10px] font-bold">PC ATT: {pcAtt}%</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 rounded-xl p-3.5">
            <p className="text-[9px] font-bold text-white/70 uppercase mb-0.5">Total Revenue</p>
            <p className="text-xl font-black">฿{rev}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-3.5">
            <p className="text-[9px] font-bold text-white/70 uppercase mb-0.5">Total Units</p>
            <p className="text-xl font-black">{units}</p>
          </div>
        </div>
      </div>
      
      {/* Bottom Half */}
      <div className="bg-[#1a1f2e] p-5 flex-1 text-gray-300">
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4">Top Performer Brands</p>
        <div className="space-y-3">
          {brands.map((brand, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-200 uppercase truncate pr-2">{idx + 1}. {brand.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-gray-500">{brand.units} U</span>
                <span className="font-bold text-white w-16 text-right tabular-nums">{brand.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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

      {/* PC Brand KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
        <PcBrandCard 
          title="SUPER SALES" share="0.3" pcAtt="5.2" rev="0.07M" units="123" color="orange" 
          brands={[
            { name: 'TITANV', units: 58, revenue: '฿35.43K' },
            { name: 'BLUE BOX', units: 50, revenue: '฿22.84K' },
            { name: 'QPLUS', units: 11, revenue: '฿8.80K' },
            { name: 'TECHPRO', units: 2, revenue: '฿780.00' },
            { name: 'MUTURAL', units: 1, revenue: '฿750.00' },
            { name: 'BASEUS', units: 1, revenue: '฿299.00' },
          ]} 
        />
        <PcBrandCard 
          title="RTB" share="0.7" pcAtt="13.0" rev="0.17M" units="194" color="blue" 
          brands={[
            { name: 'UNIQ', units: 126, revenue: '฿114.59K' },
            { name: 'ENERGEA', units: 59, revenue: '฿45.72K' },
            { name: 'JISULIFE', units: 9, revenue: '฿11.20K' },
          ]} 
        />
        <PcBrandCard 
          title="MTJ" share="1.6" pcAtt="31.1" rev="0.41M" units="420" color="emerald" 
          brands={[
            { name: 'AMAZINGTHING', units: 298, revenue: '฿285.74K' },
            { name: 'SKINARMA', units: 54, revenue: '฿44.92K' },
            { name: 'JTL', units: 42, revenue: '฿44.76K' },
            { name: 'LAUT', units: 19, revenue: '฿23.21K' },
            { name: 'ENERGIZER', units: 5, revenue: '฿7.31K' },
            { name: 'JUST MUST', units: 2, revenue: '฿2.50K' },
          ]} 
        />
        <PcBrandCard 
          title="INCEN" share="1.0" pcAtt="18.4" rev="0.24M" units="25" color="pink" 
          brands={[
            { name: 'MARSHALL', units: 10, revenue: '฿145.10K' },
            { name: 'JBL', units: 3, revenue: '฿45.00K' },
            { name: 'LOGITECH', units: 6, revenue: '฿30.24K' },
          ]} 
        />
        <PcBrandCard 
          title="D+" share="0.9" pcAtt="17.4" rev="0.23M" units="308" color="purple" 
          brands={[
            { name: 'PIXEL', units: 281, revenue: '฿195.52K' },
            { name: 'ABLEMEN', units: 14, revenue: '฿19.88K' },
            { name: 'WHY', units: 13, revenue: '฿13.77K' },
          ]} 
        />
        <PcBrandCard 
          title="UNMAPPED BRANDS (NEED CONFIG)" share="95.6" pcAtt="1835.4" rev="24.19M" units="1,818" color="slate" 
          brands={[
            { name: 'APPLE', units: 1312, revenue: '฿24.00M' },
            { name: 'MICROSOFT', units: 37, revenue: '฿108.73K' },
            { name: 'SAPPHIRE', units: 1, revenue: '฿13.49K' },
          ]} 
        />
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


    </div>
  );
}
