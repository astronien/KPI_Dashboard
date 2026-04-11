import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatPercent } from '@/components/DataTable';
import { Target, Users, ShieldCheck, Smartphone, Settings2 } from 'lucide-react';
import { getGroupCategory } from '@/lib/dataProcessor';
import { motion, AnimatePresence } from 'framer-motion';

export default function AttachRateTab() {
  const data = useData();
  const [kpiTarget, setKpiTarget] = useState<number>(20); // Default 20%
  const [filterBranch, setFilterBranch] = useState('All Branches');
  const [coreCategories, setCoreCategories] = useState<string[]>(['Mac', 'iPad', 'iPhone', 'Apple Watch']);
  
  const availableCoreOptions = ['Mac', 'iPad', 'iPhone', 'Apple Watch', 'Smartphone', 'Notebook', 'Desktop', 'Tablet'];

  const branchesList = useMemo(() => {
    if (!data.targets.length) return [];
    const branches = new Set(data.targets.map(t => t.branchName).filter(Boolean));
    return ['All Branches', ...Array.from(branches)].sort();
  }, [data.targets]);

  const attachData = useMemo(() => {
    if (!data.isLoaded.currentPeriod || !data.isLoaded.targets) return [];

    // Filter targets by branch if selected
    const filteredTargets = filterBranch !== 'All Branches' 
      ? data.targets.filter(t => t.branchName === filterBranch)
      : data.targets;

    // Unique officers from targets
    const officersMap = new Map();
    filteredTargets.forEach(t => {
      if (!t.name) return;
      const key = `${t.name.trim()} ${t.surname.trim()}`.toLowerCase();
      if (!officersMap.has(key)) {
        officersMap.set(key, {
          name: `${t.name.trim()} ${t.surname.trim()}`,
          staffId: t.staffId,
          coreUnits: 0, // Mac, iPad, iPhone, Apple Watch
          appleCareUnits: 0,
          coverPlusUnits: 0,
          otherAttachUnits: 0,
        });
      }
    });

    const officerRows = Array.from(officersMap.values());

    // Attribute sales to officers
    data.currentPeriod.forEach(s => {
      // Find matching officer
      let mappedOfficer = null;
      if (s.officerId > 0) {
        mappedOfficer = officerRows.find(o => o.staffId === s.officerId);
      }
      if (!mappedOfficer && s.officerName) {
        const sName = s.officerName.trim().toLowerCase();
        mappedOfficer = officerRows.find(o => o.name.toLowerCase() === sName || sName.startsWith(o.name.toLowerCase().split(' ')[0] + ' '));
      }

      if (mappedOfficer) {
        const gc = getGroupCategory(s.categoryName || '', s.subCategory || '', data.categoryMaster, s.productName || '');
        const units = s.number || 0;
        
        const isCore = coreCategories.includes(gc);
        let isCoverPlus = false;
        if ((s.productName || '').toUpperCase().includes('COVER+')) isCoverPlus = true;

        if (isCore) {
          mappedOfficer.coreUnits += units;
        } else if (gc === 'Apple Care') {
          mappedOfficer.appleCareUnits += units;
        } else if (isCoverPlus) {
          mappedOfficer.coverPlusUnits += units;
        } else if (gc !== 'SIM') {
          // Exclude SIM from other attachments to keep it accessory focused? Usually SIM is separate. 
          // We'll count other accessories here.
          mappedOfficer.otherAttachUnits += units;
        }
      }
    });

    return officerRows.map(o => {
      const appleCareRate = o.coreUnits > 0 ? (o.appleCareUnits / o.coreUnits) * 100 : 0;
      const coverPlusRate = o.coreUnits > 0 ? (o.coverPlusUnits / o.coreUnits) * 100 : 0;
      const totalAttachRate = o.coreUnits > 0 ? ((o.appleCareUnits + o.coverPlusUnits + o.otherAttachUnits) / o.coreUnits) * 100 : 0;

      return {
        ...o,
        appleCareRate,
        coverPlusRate,
        totalAttachRate,
        isAcHit: appleCareRate >= kpiTarget,
      };
    }).sort((a, b) => b.appleCareRate - a.appleCareRate);

  }, [data.currentPeriod, data.targets, data.categoryMaster, filterBranch, kpiTarget, coreCategories]);

  // Overall calculations
  const totalCore = attachData.reduce((sum, r) => sum + r.coreUnits, 0);
  const totalAC = attachData.reduce((sum, r) => sum + r.appleCareUnits, 0);
  const totalCP = attachData.reduce((sum, r) => sum + r.coverPlusUnits, 0);
  const totalOther = attachData.reduce((sum, r) => sum + r.otherAttachUnits, 0);
  
  const overallACRate = totalCore > 0 ? (totalAC / totalCore) * 100 : 0;
  const hitCount = attachData.filter(r => r.isAcHit && r.coreUnits > 0).length;
  const activeOfficers = attachData.filter(r => r.coreUnits > 0).length;

  const columns = [
    { key: 'name', label: 'Officer', align: 'left' as const, format: (v: string) => <span className="font-bold text-gray-800">{v}</span> },
    { key: 'coreUnits', label: 'Hero Units', align: 'right' as const, format: (v: number) => <span className="text-gray-500 font-medium">{v} <span className="text-[10px] ml-0.5">U</span></span> },
    { key: 'appleCareUnits', label: 'Apple Care', align: 'right' as const, format: (v: number) => <span className="text-blue-600 font-bold">{v} <span className="text-[10px] ml-0.5 font-normal">U</span></span> },
    { key: 'coverPlusUnits', label: 'Cover+', align: 'right' as const, format: (v: number) => <span className="text-pink-600 font-medium">{v}</span> },
    { key: 'appleCareRate', label: 'AC Attach Rate', align: 'right' as const, format: (v: number, row: any) => (
      <div className="flex items-center justify-end gap-2">
        <span className={`font-bold ${v >= kpiTarget ? 'text-emerald-600' : 'text-rose-500'}`}>
          {formatPercent(v)}
        </span>
        {v >= kpiTarget ? (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-rose-200" />
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* KPI Controls Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Attach Rate Performance
          </h2>
          <p className="text-xs text-gray-400 mt-1">Track Apple Care and Cover+ vs Hero Devices</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto p-4 md:p-0 bg-gray-50 md:bg-transparent rounded-xl border border-gray-100 md:border-none">
          {/* Branch Filter */}
          <div className="w-full sm:w-auto">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white"
            >
              {branchesList.map(b => (
                <option key={b} value={b}>{b.replace(/^ID\d+ : /, '')}</option>
              ))}
            </select>
          </div>

          <div className="hidden sm:block w-px h-10 bg-gray-200 mx-2" />

          {/* KPI Target Setter */}
          <div className="w-full sm:w-auto flex flex-col min-w-[200px]">
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Settings2 className="w-3 h-3" />
              AC Target KPI: {kpiTarget}%
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="1"
                value={kpiTarget}
                onChange={(e) => setKpiTarget(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 relative z-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Devices Configuration */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Hero Devices Filter:</span>
        {availableCoreOptions.map(cat => (
          <label 
            key={cat} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${coreCategories.includes(cat) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
          >
            <input 
              type="checkbox" 
              className="hidden"
              checked={coreCategories.includes(cat)}
              onChange={() => {
                if (coreCategories.includes(cat)) {
                  setCoreCategories(prev => prev.filter(c => c !== cat));
                } else {
                  setCoreCategories(prev => [...prev, cat]);
                }
              }}
            />
            {cat}
          </label>
        ))}
      </div>

      {/* Top Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <ShieldCheck className="w-6 h-6 text-blue-500 relative z-10 mb-3" />
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Overall AC Attach</h3>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-black tabular-nums tracking-tight ${overallACRate >= kpiTarget ? 'text-emerald-600' : 'text-gray-900'}`}>
                {overallACRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              <span className="text-blue-600 font-bold">{totalAC}</span> Care / <span className="text-gray-800 font-bold">{totalCore}</span> Hero Units
            </p>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-pink-200 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-pink-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
          <Smartphone className="w-6 h-6 text-pink-500 relative z-10 mb-3" />
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Cover+ Sold</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tabular-nums tracking-tight text-gray-900">
                {totalCP.toLocaleString()} <span className="text-lg text-gray-400 font-medium">U</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Secondary protection plan</p>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="bg-[#10b981] p-5 rounded-2xl border border-transparent shadow-[0_4px_20px_rgba(16,185,129,0.3)] relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500 ease-out" />
          <Users className="w-6 h-6 text-white relative z-10 mb-3" />
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Staff KPI Hit Rate</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black tabular-nums tracking-tight text-white">
                {activeOfficers > 0 ? ((hitCount / activeOfficers) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <p className="text-xs text-emerald-50 mt-2 font-medium">
              <span className="font-bold text-white">{hitCount}</span> out of {activeOfficers} officers hit {kpiTarget}% tag
            </p>
          </div>
        </motion.div>
      </div>

      {/* Leaderboard */}
      <DataTable
        title="Officer Attach Leaderboard"
        icon={<Users className="w-4 h-4" />}
        columns={columns}
        data={attachData.filter(d => d.coreUnits > 0 || d.appleCareUnits > 0)}
        emptyMessage="Upload Sales and Targets to view Attach Rate leaderboard."
      />
    </div>
  );
}
