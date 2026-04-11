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

const VendorBrands: Record<string, string[]> = {
  'SUPER SALES': ['TITANV', 'BLUE BOX', 'QPLUS', 'TECHPRO', 'MUTURAL', 'BASEUS'],
  'RTB': ['UNIQ', 'ENERGEA', 'JISULIFE'],
  'MTJ': ['AMAZINGTHING', 'SKINARMA', 'JTL', 'LAUT', 'ENERGIZER', 'JUST MUST'],
  'INCEN': ['MARSHALL', 'JBL', 'LOGITECH'],
  'D+': ['PIXEL', 'ABLEMEN', 'WHY'],
};

const PcBrandCard = ({ title, share, pcAtt, rev, units, color, brands }: { 
  title: string, share: string, pcAtt: string, rev: string, units: string, color: string, brands: TopBrand[] 
}) => {
  const bgColors: Record<string, string> = {
    emerald: 'border-emerald-100/80 bg-emerald-50/20 hover:border-emerald-200 hover:shadow-emerald-100/50',
    blue: 'border-blue-100/80 bg-blue-50/20 hover:border-blue-200 hover:shadow-blue-100/50',
    amber: 'border-amber-100/80 bg-amber-50/20 hover:border-amber-200 hover:shadow-amber-100/50',
    purple: 'border-purple-100/80 bg-purple-50/20 hover:border-purple-200 hover:shadow-purple-100/50',
    rose: 'border-rose-100/80 bg-rose-50/20 hover:border-rose-200 hover:shadow-rose-100/50',
    slate: 'border-gray-200/80 bg-gray-50/40 hover:border-gray-300 hover:shadow-gray-100/50',
  };
  const textColors: Record<string, string> = {
    emerald: 'text-emerald-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    purple: 'text-purple-700',
    rose: 'text-rose-700',
    slate: 'text-gray-700',
  };
  
  const headerBg = bgColors[color] || bgColors.slate;
  const headerColor = textColors[color] || textColors.slate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${headerBg} p-5 shadow-sm transition-all duration-200 group relative flex flex-col`}
    >
      <div className="flex items-center justify-between mb-4 border-b border-gray-100/80 pb-3">
        <div>
          <h3 className={`text-sm font-bold tracking-tight uppercase mb-2 ${headerColor}`}>{title}</h3>
          <div className="flex gap-1.5">
            <span className="text-[9px] bg-white border border-gray-100 px-2 py-0.5 rounded-md text-gray-500 font-semibold shadow-sm">SHARE: {share}%</span>
            <span className="text-[9px] bg-white border border-gray-100 px-2 py-0.5 rounded-md text-gray-500 font-semibold shadow-sm">PC ATT: {pcAtt}%</span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-100 shadow-sm hover:border-gray-200">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100/80">
        <div className="bg-white/50 rounded-lg p-2.5 border border-white/60">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Total Rev (MB)</span>
          <span className="text-lg font-black text-gray-800">{rev}</span>
        </div>
        <div className="bg-white/50 rounded-lg p-2.5 border border-white/60">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Total Units</span>
          <span className="text-lg font-black text-gray-800">{units}</span>
        </div>
      </div>
      
      <div className="flex-1 mt-1">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Top Performer Brands</p>
        <div className="space-y-2">
          {brands.map((brand, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-gray-600 truncate pr-2">{idx + 1}. {brand.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-gray-400 text-[10px] font-medium">{brand.units} U</span>
                <span className="font-bold text-gray-800 w-16 text-right tabular-nums">{brand.revenue}</span>
              </div>
            </div>
          ))}
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
  const vendorGroups = useMemo(() => {
    // Initialize results structure
    const results: Record<string, { rev: number, units: number, brands: Record<string, { u: number, r: number }> }> = {
      'SUPER SALES': { rev: 0, units: 0, brands: {} },
      'RTB': { rev: 0, units: 0, brands: {} },
      'MTJ': { rev: 0, units: 0, brands: {} },
      'INCEN': { rev: 0, units: 0, brands: {} },
      'D+': { rev: 0, units: 0, brands: {} },
      'UNMAPPED BRANDS (NEED CONFIG)': { rev: 0, units: 0, brands: {} },
    };

    let totalCoreUnits = 0; // iPhone, iPad, Mac for PC ATT%
    let totalAllRev = 0;

    data.currentPeriod.forEach(sale => {
      // Avoid counting NaN
      if (!sale.totalPrice || !sale.number) return;
      
      const bBrand = (sale.brand || 'UNKNOWN').toUpperCase().trim();
      const cat = sale.categoryName?.toUpperCase() || '';
      
      // Calculate core units for attachment rate (heuristic)
      if (cat.includes('IPHONE') || cat.includes('MAC') || cat.includes('IPAD')) {
        totalCoreUnits += sale.number;
      }
      totalAllRev += sale.totalPrice;

      // Find which box this brand belongs to
      let assignedBox = 'UNMAPPED BRANDS (NEED CONFIG)';
      for (const [boxName, boxBrands] of Object.entries(VendorBrands)) {
        if (boxBrands.includes(bBrand)) {
          assignedBox = boxName;
          break;
        }
      }

      // Add to bucket
      const box = results[assignedBox];
      box.rev += sale.totalPrice;
      box.units += sale.number;
      
      if (!box.brands[bBrand]) {
        box.brands[bBrand] = { u: 0, r: 0 };
      }
      box.brands[bBrand].u += sale.number;
      box.brands[bBrand].r += sale.totalPrice;
    });

    // Format final arrays for the UI
    const formatNumber = (n: number) => {
      if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
      return (n / 1000).toFixed(2) + 'K';
    };

    return Object.entries(results).map(([title, stats]) => {
      // Sort brands by revenue descending
      const topBrandsDesc = Object.entries(stats.brands)
        .sort((a, b) => b[1].r - a[1].r)
        .slice(0, 6)
        .map(([name, bStats]) => ({
          name,
          units: bStats.u,
          revenue: '฿' + formatNumber(bStats.r),
        }));

      const shareStr = totalAllRev > 0 ? ((stats.rev / totalAllRev) * 100).toFixed(1) : '0.0';
      const attStr = totalCoreUnits > 0 ? ((stats.units / totalCoreUnits) * 100).toFixed(1) : '0.0';

      let color = 'slate';
      if (title === 'SUPER SALES') color = 'orange';
      if (title === 'RTB') color = 'blue';
      if (title === 'MTJ') color = 'emerald';
      if (title === 'INCEN') color = 'pink';
      if (title === 'D+') color = 'purple';

      return {
        title,
        share: shareStr,
        pcAtt: attStr,
        rev: formatNumber(stats.rev),
        units: stats.units.toLocaleString(),
        color,
        brands: topBrandsDesc
      };
    });
  }, [data.currentPeriod]);

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
        {vendorGroups.map((cardData, i) => (
          <PcBrandCard key={i} {...cardData} />
        ))}
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
