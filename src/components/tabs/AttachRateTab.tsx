import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatPercent } from '@/components/DataTable';
import { Target, Users, Settings2, Sigma, PercentCircle } from 'lucide-react';
import { getGroupCategory } from '@/lib/dataProcessor';
import { motion } from 'framer-motion';

// Default base categories mapped
const DEFAULT_CATEGORIES = [
  'iPhone', 'Mac', 'iPad', 'Apple Watch', 'Smartphone', 'Desktop', 'Notebook', 'Tablet',
  'Apple Care', 'Cover+', 'SIM', 'DIY', 'BTB(Apple)', 'BTB', 'Other'
];

export default function AttachRateTab() {
  const data = useData();
  const [kpiTarget, setKpiTarget] = useState<number>(20);
  const [filterBranch, setFilterBranch] = useState('All Branches');
  
  // Custom What vs What states
  const [baseCategories, setBaseCategories] = useState<string[]>(['iPhone', 'Mac', 'iPad', 'Apple Watch']);
  const [attachCategories, setAttachCategories] = useState<string[]>(['Apple Care', 'Cover+', 'SIM']);

  const branchesList = useMemo(() => {
    if (!data.targets.length) return [];
    const branches = new Set(data.targets.map(t => t.branchName).filter(Boolean));
    return ['All Branches', ...Array.from(branches)].sort();
  }, [data.targets]);

  // Dynamically load sub-categories and merge with defaults
  const ALL_CATEGORIES = useMemo(() => {
    const cats = new Set(DEFAULT_CATEGORIES);
    if (!data.isLoaded.currentPeriod) return Array.from(cats);
    
    data.currentPeriod.forEach(s => {
      if (s.subCategory) cats.add(s.subCategory);
    });
    
    // Sort so defaults are broadly visible, but alphabetize the rest
    const merged = Array.from(cats);
    return merged.sort((a, b) => {
      const aDef = DEFAULT_CATEGORIES.includes(a);
      const bDef = DEFAULT_CATEGORIES.includes(b);
      if (aDef && !bDef) return -1;
      if (!aDef && bDef) return 1;
      return a.localeCompare(b);
    });
  }, [data.currentPeriod, data.isLoaded.currentPeriod]);

  const attachData = useMemo(() => {
    if (!data.isLoaded.currentPeriod || !data.isLoaded.targets) return [];

    const filteredTargets = filterBranch !== 'All Branches' 
      ? data.targets.filter(t => t.branchName === filterBranch)
      : data.targets;

    const officersMap = new Map();
    filteredTargets.forEach(t => {
      if (!t.name) return;
      const key = `${t.name.trim()} ${t.surname.trim()}`.toLowerCase();
      if (!officersMap.has(key)) {
        officersMap.set(key, {
          name: `${t.name.trim()} ${t.surname.trim()}`,
          staffId: t.staffId,
          baseUnits: 0,
          attachMap: {} as Record<string, { units: number; rate: number; isHit: boolean }>,
        });
        
        // Initialize zeros for all selected attach categories
        attachCategories.forEach(cat => {
          officersMap.get(key).attachMap[cat] = { units: 0, rate: 0, isHit: false };
        });
      }
    });

    const officerRows = Array.from(officersMap.values());

    data.currentPeriod.forEach(s => {
      let mappedOfficer = null;
      if (s.officerId > 0) {
        mappedOfficer = officerRows.find(o => o.staffId === s.officerId);
      }
      if (!mappedOfficer && s.officerName) {
        const sName = s.officerName.trim().toLowerCase();
        mappedOfficer = officerRows.find(o => o.name.toLowerCase() === sName || sName.startsWith(o.name.toLowerCase().split(' ')[0] + ' '));
      }

      if (mappedOfficer) {
        let gc = getGroupCategory(s.categoryName || '', s.subCategory || '', data.categoryMaster, s.productName || '');
        if ((s.productName || '').toUpperCase().includes('COVER+')) gc = 'Cover+';
        const subCat = s.subCategory || '';

        const units = s.number || 0;
        
        if (baseCategories.includes(gc) || baseCategories.includes(subCat)) {
          mappedOfficer.baseUnits += units;
        }
        
        attachCategories.forEach(cat => {
          if (gc === cat || subCat === cat) {
            if (!mappedOfficer.attachMap[cat]) {
              mappedOfficer.attachMap[cat] = { units: 0, rate: 0, isHit: false };
            }
            mappedOfficer.attachMap[cat].units += units;
          }
        });
      }
    });

    return officerRows.map(o => {
      let totalAttachUnitsForSorting = 0;
      attachCategories.forEach(cat => {
        const units = o.attachMap[cat]?.units || 0;
        const rate = o.baseUnits > 0 ? (units / o.baseUnits) * 100 : 0;
        if (o.attachMap[cat]) {
           o.attachMap[cat].rate = rate;
           o.attachMap[cat].isHit = rate >= kpiTarget;
        }
        totalAttachUnitsForSorting += units;
      });

      return {
        ...o,
        totalAttachUnitsForSorting
      };
    }).sort((a, b) => b.totalAttachUnitsForSorting - a.totalAttachUnitsForSorting);

  }, [data.currentPeriod, data.targets, data.categoryMaster, filterBranch, kpiTarget, baseCategories, attachCategories]);

  // Overall calculations
  const totalBase = attachData.reduce((sum, r) => sum + r.baseUnits, 0);
  const totalAttachedEverything = attachData.reduce((sum, r) => sum + r.totalAttachUnitsForSorting, 0);
  const activeOfficers = attachData.filter(r => r.baseUnits > 0).length;

  const dynamicColumns = useMemo(() => {
    const cols: Array<{ key: string; label: string; align?: 'left' | 'center' | 'right'; format?: (v: any, row: any) => React.ReactNode }> = [
      { key: 'name', label: 'Officer', align: 'left', format: (v: string) => <span className="font-bold text-gray-800">{v}</span> },
      { key: 'baseUnits', label: 'Base Units', align: 'right', format: (v: number) => <span className="text-gray-500 font-medium">{v} <span className="text-[10px] ml-0.5">U</span></span> },
    ];

    attachCategories.forEach(cat => {
       cols.push({
         key: `attach_units_${cat}`,
         label: `${cat} (U)`,
         align: 'right' as const,
         format: (v: any, row: any) => (
           <span className="text-gray-700 font-bold">{row.attachMap[cat]?.units || 0}</span>
         )
       });
       cols.push({
         key: `attach_rate_${cat}`,
         label: `% Ach`,
         align: 'right' as const,
         format: (v: any, row: any) => {
           const rate = row.attachMap[cat]?.rate || 0;
           const isHit = row.attachMap[cat]?.isHit || false;
           return (
             <div className="flex items-center justify-end gap-2">
               <span className={`font-bold tabular-nums ${isHit ? 'text-emerald-600' : 'text-rose-500'}`}>
                 {formatPercent(rate)}
               </span>
             </div>
           );
         }
       });
    });

    return cols;
  }, [attachCategories, kpiTarget]);

  const toggleCategory = (cat: string, isBase: boolean) => {
    if (isBase) {
      if (baseCategories.includes(cat)) setBaseCategories(prev => prev.filter(c => c !== cat));
      else setBaseCategories(prev => [...prev, cat]);
    } else {
      if (attachCategories.includes(cat)) setAttachCategories(prev => prev.filter(c => c !== cat));
      else setAttachCategories(prev => [...prev, cat]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col xl:flex-row items-start justify-between gap-6">
        
        {/* Left Side: Category builder */}
        <div className="flex-1 w-full space-y-4">
           <div>
             <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 mb-2">
               <Target className="w-5 h-5 text-emerald-600" />
               Custom Attach Builder
             </h2>
             <div className="flex flex-col md:flex-row gap-4">
                {/* Base Categories */}
                <div className="flex-1 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-2">1. Base Target (ตัวหาร)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_CATEGORIES.map(cat => (
                      <button 
                        key={`base-${cat}`}
                        onClick={() => toggleCategory(cat, true)}
                        className={`px-2 py-1 text-[11px] font-bold rounded-md transition-colors border ${baseCategories.includes(cat) ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Attack Categories */}
                <div className="flex-1 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                  <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest block mb-2">2. Attach Target (ตัวแนบ)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_CATEGORIES.map(cat => (
                      <button 
                        key={`attach-${cat}`}
                        onClick={() => toggleCategory(cat, false)}
                        className={`px-2 py-1 text-[11px] font-bold rounded-md transition-colors border ${attachCategories.includes(cat) ? 'bg-pink-100 border-pink-200 text-pink-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
           </div>
        </div>
        
        {/* Right Side: Options */}
        <div className="flex flex-col gap-4 w-full xl:w-auto xl:min-w-[280px]">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50"
            >
              {branchesList.map(b => (
                <option key={b} value={b}>{b.replace(/^ID\d+ : /, '')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1"><Settings2 className="w-3 h-3" /> Target KPI</span>
              <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded-sm">{kpiTarget}%</span>
            </label>
            <input 
              type="range" 
              min="0" max="100" step="1"
              value={kpiTarget}
              onChange={(e) => setKpiTarget(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Top Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <Sigma className="w-6 h-6 text-blue-500 relative z-10 mb-3" />
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Base Units</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tabular-nums tracking-tight text-gray-900">
                {totalBase.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-blue-600 font-bold mt-2">
              {baseCategories.length} Categories Selected
            </p>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-pink-200 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-pink-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <PercentCircle className="w-6 h-6 text-pink-500 relative z-10 mb-3" />
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Attached Sold</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tabular-nums tracking-tight text-gray-900">
                {totalAttachedEverything.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-pink-600 font-bold mt-2">
              {attachCategories.length} Categories Attached
            </p>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="bg-[#10b981] p-5 rounded-2xl border border-transparent shadow-[0_4px_20px_rgba(16,185,129,0.3)] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500 ease-out" />
          <Users className="w-6 h-6 text-white relative z-10 mb-3" />
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Active Staff Base</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tabular-nums tracking-tight text-white">
                {activeOfficers}
              </span>
            </div>
            <p className="text-xs text-emerald-50 mt-2 font-medium">
              Officers sold at least 1 base unit
            </p>
          </div>
        </motion.div>
      </div>

      {/* Leaderboard */}
      <DataTable
        title="Custom Attach KPI Matrix"
        icon={<Users className="w-4 h-4" />}
        columns={dynamicColumns}
        data={attachData.filter(d => d.baseUnits > 0 || d.totalAttachUnitsForSorting > 0)}
        emptyMessage="Select categories and upload data to view the matrix."
      />
    </div>
  );
}
