import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatPercent } from '@/components/DataTable';
import { Target, Users, Settings2, Sigma, PercentCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { getGroupCategory } from '@/lib/dataProcessor';
import { motion, AnimatePresence } from 'framer-motion';

// Default base categories mapped
const DEFAULT_CATEGORIES = [
  'iPhone', 'Mac', 'iPad', 'Apple Watch', 'Smartphone', 'Desktop', 'Notebook', 'Tablet',
  'Apple Care', 'Cover+', 'SIM', 'DIY', 'BTB(Apple)', 'BTB', 'Other'
];

function CategoryTreePicker({ 
  treeMap, 
  selected, 
  toggle, 
  themeColor 
}: { 
  treeMap: Map<string, Set<string>>, 
  selected: string[], 
  toggle: (cat: string) => void,
  themeColor: 'blue' | 'pink'
}) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleExpand = (cat: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 pb-4">
      {Array.from(treeMap.entries()).map(([mainCat, subCats]) => {
        const isMainSelected = selected.includes(mainCat);
        const isExpanded = expandedCats.has(mainCat);
        const hasSub = subCats.size > 0;

        const bgClass = isMainSelected 
          ? (themeColor === 'blue' ? 'bg-blue-100 border-blue-500' : 'bg-pink-100 border-pink-500') 
          : 'bg-white border-gray-200';
          
        const textClass = isMainSelected
          ? (themeColor === 'blue' ? 'text-blue-900' : 'text-pink-900')
          : 'text-gray-900';

        return (
          <div key={mainCat} className={`border-2 rounded-2xl transition-all ${bgClass}`}>
            <div 
              className="px-4 py-3 flex items-center justify-between cursor-pointer"
              onClick={() => toggle(mainCat)}
            >
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  checked={isMainSelected}
                  readOnly
                  className={`w-4 h-4 cursor-pointer ${themeColor === 'blue' ? 'accent-blue-600' : 'accent-pink-600'}`}
                />
                <span className={`text-sm font-bold ${textClass}`}>
                  {String(mainCat)}
                </span>
                {hasSub && (
                  <span className="text-[10px] bg-white/50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 font-bold">
                    {subCats.size} sub
                  </span>
                )}
              </div>
              
              {hasSub && (
                <button 
                  onClick={(e) => toggleExpand(mainCat, e)}
                  className="p-1 rounded-md bg-white hover:bg-gray-100 border border-gray-200 shadow-sm transition-colors text-gray-500"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
            </div>

            {isExpanded && hasSub && (
              <div className="px-4 pb-3 pt-1 border-t border-black/5 bg-white/50 rounded-b-lg flex flex-col gap-2">
                {Array.from(subCats).map(sub => {
                  const isSubSelected = selected.includes(sub);
                  return (
                    <label key={sub} className="flex items-center gap-3 cursor-pointer py-1 px-2 rounded-md hover:bg-white transition-colors">
                      <input 
                        type="checkbox" 
                        checked={isSubSelected}
                        onChange={() => toggle(sub)}
                        className={`w-3.5 h-3.5 cursor-pointer ${themeColor === 'blue' ? 'accent-blue-600' : 'accent-pink-600'}`}
                      />
                      <span className={`text-xs font-semibold ${isSubSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                        {String(sub)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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

  // Construct hierarchy of Main Category -> Set of Sub Categories
  const categoryTree = useMemo(() => {
    const tree = new Map<string, Set<string>>();
    DEFAULT_CATEGORIES.forEach(c => tree.set(c, new Set()));

    if (data.isLoaded.currentPeriod) {
      data.currentPeriod.forEach(s => {
        let gc = getGroupCategory(s.categoryName || '', s.subCategory || '', data.categoryMaster, s.productName || '');
        if ((s.productName || '').toUpperCase().includes('COVER+')) gc = 'Cover+';
        
        if (!tree.has(gc)) tree.set(gc, new Set());
        if (s.subCategory) {
          tree.get(gc)!.add(s.subCategory);
        }
      });
    }

    // Sort map keys
    const sortedTree = new Map<string, Set<string>>();
    Array.from(tree.keys()).sort((a, b) => {
      const aDef = DEFAULT_CATEGORIES.includes(a);
      const bDef = DEFAULT_CATEGORIES.includes(b);
      if (aDef && !bDef) return -1;
      if (!aDef && bDef) return 1;
      return a.localeCompare(b);
    }).forEach(k => {
      // Sort the sets too
      const sortedSet = new Set(Array.from(tree.get(k)!).sort());
      sortedTree.set(k, sortedSet);
    });

    return sortedTree;
  }, [data.currentPeriod, data.isLoaded.currentPeriod, data.categoryMaster]);

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
    const baseLabel = baseCategories.length === 0 ? 'Base Units' :
                      baseCategories.length <= 3 ? baseCategories.join(' + ') + ' (U)' :
                      `${baseCategories.length} Base Cats (U)`;

    const cols: Array<{ key: string; label: string; align?: 'left' | 'center' | 'right'; format?: (v: any, row: any) => React.ReactNode; bgColorClass?: string; borderLeft?: boolean }> = [
      { key: 'name', label: 'Officer', align: 'left', format: (v: string) => <span className="font-bold text-gray-800">{v}</span> },
      { key: 'baseUnits', label: baseLabel.toUpperCase(), align: 'right', format: (v: number) => <span className="text-gray-500 font-medium">{v} <span className="text-[10px] ml-0.5">U</span></span>, borderLeft: true },
    ];

    attachCategories.forEach((cat, index) => {
       const isEven = index % 2 === 0;
       const bg = isEven ? 'bg-slate-100/40' : '';
       
       cols.push({
         key: `attach_units_${cat}`,
         label: `${cat} (U)`,
         align: 'right' as const,
         bgColorClass: bg,
         borderLeft: true,
         format: (v: any, row: any) => (
           <span className="text-gray-700 font-bold">{row.attachMap[cat]?.units || 0}</span>
         )
       });
       cols.push({
         key: `attach_rate_${cat}`,
         label: `% Att`,
         align: 'right' as const,
         bgColorClass: bg,
         format: (v: any, row: any) => {
           const rate = row.attachMap[cat]?.rate || 0;
           const isHit = row.attachMap[cat]?.isHit || false;
           return (
             <div className="flex items-center justify-end gap-2">
               <span className={`font-bold tabular-nums ${isHit ? 'text-rose-600' : 'text-rose-500'}`}>
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
      <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col xl:flex-row items-start justify-between gap-6">
        
        {/* Left Side: Category builder */}
        <div className="flex-1 w-full space-y-4">
           <div>
             <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 mb-2">
               <Target className="w-5 h-5 text-rose-600" />
               Custom Attach Builder
             </h2>
             <div className="flex flex-col md:flex-row gap-4">
                {/* Base Categories */}
                <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-3">1. Base Target (ตัวหาร)</span>
                  <CategoryTreePicker 
                    treeMap={categoryTree} 
                    selected={baseCategories} 
                    toggle={(cat) => toggleCategory(cat, true)} 
                    themeColor="blue"
                  />
                </div>
                {/* Attack Categories */}
                <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                  <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest block mb-3">2. Attach Target (ตัวแนบ)</span>
                  <CategoryTreePicker 
                    treeMap={categoryTree} 
                    selected={attachCategories} 
                    toggle={(cat) => toggleCategory(cat, false)} 
                    themeColor="pink"
                  />
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
              className="w-full text-sm border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:border-rose-500 focus:ring-rose-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-200"
            >
              {branchesList.map(b => (
                <option key={b} value={b}>{b.replace(/^ID\d+ : /, '')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1"><Settings2 className="w-3 h-3" /> Target KPI</span>
              <span className="bg-rose-100 text-rose-700 px-1.5 rounded-sm">{kpiTarget}%</span>
            </label>
            <input 
              type="range" 
              min="0" max="100" step="1"
              value={kpiTarget}
              onChange={(e) => setKpiTarget(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
          </div>
        </div>
      </div>

      {/* Top Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-white dark:bg-gray-900 p-5 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
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

        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-white dark:bg-gray-900 p-5 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:border-pink-200 dark:hover:border-pink-800 transition-colors">
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

        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="bg-[#10b981] p-5 rounded-[32px] border border-transparent shadow-[0_4px_20px_rgba(16,185,129,0.3)] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500 ease-out" />
          <Users className="w-6 h-6 text-white relative z-10 mb-3" />
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold text-rose-100 uppercase tracking-widest mb-1">Active Staff Base</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tabular-nums tracking-tight text-white">
                {activeOfficers}
              </span>
            </div>
            <p className="text-xs text-rose-50 mt-2 font-medium">
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
