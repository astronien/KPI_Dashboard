/*
 * Design: Crystal Report — Swiss Precision
 * Live Monitor tab to track current day performance pacing.
 */
import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatPercent, formatMoney } from '@/components/DataTable';
import KpiCard from '@/components/KpiCard';
import { calculateBranchSummary, formatCurrency } from '@/lib/dataProcessor';
import { Activity, Target, TrendingUp, Zap, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LiveMonitorTab() {
  const data = useData();
  const [manualPrice, setManualPrice] = useState('');
  const [manualCategory, setManualCategory] = useState('iPhone');
  const [manualSubCategory, setManualSubCategory] = useState('iPhone 15');
  const [manualBranch, setManualBranch] = useState('');

  const branchSummary = useMemo(() => {
    if (!data.isLoaded.targets || !data.isLoaded.currentPeriod) return [];
    return calculateBranchSummary(
      data.targets,
      data.currentPeriod,
      data.lastMonth,
      data.lastYear,
      data.categoryMaster,
      'All Category'
    );
  }, [data]);

  const kpis = useMemo(() => {
    if (!branchSummary.length) return null;
    const totalTarget = branchSummary.reduce((s, b) => s + b.target, 0);
    const totalActual = branchSummary.reduce((s, b) => s + b.actual, 0);
    const targetDay = branchSummary.reduce((s, b) => s + b.targetDay, 0);
    const diffDay = totalActual - targetDay;
    
    return { totalTarget, totalActual, targetDay, diffDay };
  }, [branchSummary]);

  const chaseData = useMemo(() => {
    if (!data.isLoaded.currentPeriod) return [];
    
    // branches from targets
    const branchNames = Array.from(new Set(data.targets.map(t => t.branchName.replace(/^ID\d+ : /, ''))));
    const chaseMap = new Map<string, any>();
    branchNames.forEach(b => {
      chaseMap.set(b, { branch: b, iphone: 0, cover: 0, sim: 0, ufund: 0, case: 0, pencil: 0, score: 0, grade: '-' });
    });

    data.currentPeriod.forEach(s => {
      const bName = s.branchName.replace(/^ID\d+ : /, '');
      if (!chaseMap.has(bName)) chaseMap.set(bName, { branch: bName, iphone: 0, cover: 0, sim: 0, ufund: 0, case: 0, pencil: 0, score: 0, grade: '-' });
      
      const row = chaseMap.get(bName)!;
      const units = s.number;
      
      if (s.categoryName === 'iPhone') { row.iphone += units; row.score += (units * 10); }
      if (s.subCategory.includes('Cover+')) { row.cover += units; row.score += (units * 5); }
      if (s.subCategory.includes('Sim') || s.productName.toLowerCase().includes('sim')) { row.sim += units; row.score += (units * 2); }
      if (s.subCategory.includes('Ufund') || s.productName.toLowerCase().includes('ufund')) { row.ufund += units; row.score += (units * 10); }
      if (s.subCategory.includes('Case iPhone') || (s.categoryName === 'Accessories' && s.productName.includes('Case'))) { row.case += units; row.score += (units * 3); }
      if (s.subCategory.includes('Pencil') || s.productName.includes('Pencil')) { row.pencil += units; row.score += (units * 4); }
    });

    return Array.from(chaseMap.values()).map(row => {
      let grade = 'D';
      if (row.score >= 50) grade = 'S';
      else if (row.score >= 30) grade = 'A';
      else if (row.score >= 15) grade = 'B';
      else if (row.score > 0) grade = 'C';
      return { ...row, grade };
    }).sort((a, b) => b.score - a.score);
  }, [data.currentPeriod, data.targets]);

  const handleManualAdd = () => {
    if (!manualPrice || !manualBranch) return;
    data.addManualSale({
      categoryName: manualCategory,
      subCategory: manualSubCategory,
      branchName: manualBranch,
      totalPrice: Number(manualPrice),
      number: 1,
    });
    toast.success('Sale successfully added to current calculation!');
  };

  const columns = [
    { key: 'branch', label: 'Branch', align: 'left' as const, format: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'target', label: 'Target', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'actual', label: 'Actual', align: 'right' as const, format: (v: number) => <span className="font-semibold">{formatMoney(v)}</span> },
    { key: 'achPercent', label: 'Ach. %', align: 'right' as const, format: (v: number) => formatPercent(v) },
    { key: 'targetDay', label: 'Target / Day', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'actualDay', label: 'Actual / Day', align: 'right' as const, format: (v: number) => formatMoney(v) },
    { key: 'diffDay', label: 'Diff / Day', align: 'right' as const, format: (v: number) => {
      const cls = v > 0 ? 'text-emerald-600' : 'text-rose-600';
      return <span className={`font-semibold ${cls}`}>{v > 0 ? '+' : ''}{formatMoney(v)}</span>;
    }},
  ];

  const chaseColumns = [
    { key: 'branch', label: 'Branch', align: 'left' as const, format: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'grade', label: 'Grade', align: 'center' as const, format: (v: string) => {
      const colors: any = { 'S': 'bg-fuchsia-100 text-fuchsia-700', 'A': 'bg-emerald-100 text-emerald-700', 'B': 'bg-blue-100 text-blue-700', 'C': 'bg-amber-100 text-amber-700', 'D': 'bg-gray-100 text-gray-700' };
      return <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${colors[v] || colors['D']}`}>{v}</span>;
    }},
    { key: 'score', label: 'Score', align: 'right' as const, format: (v: number) => <span className="font-bold text-gray-800">{v}</span> },
    { key: 'iphone', label: 'iPhone', align: 'right' as const, format: (v: number) => v || '-' },
    { key: 'cover', label: 'Cover+', align: 'right' as const, format: (v: number) => v || '-' },
    { key: 'sim', label: 'Sim', align: 'right' as const, format: (v: number) => v || '-' },
    { key: 'ufund', label: 'Ufund', align: 'right' as const, format: (v: number) => v || '-' },
    { key: 'case', label: 'Case iPhone', align: 'right' as const, format: (v: number) => v || '-' },
    { key: 'pencil', label: 'Apple Pencil', align: 'right' as const, format: (v: number) => v || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500" />
          Live Tracking (Pacing)
        </h2>
        <p className="text-sm text-gray-500">Monitor current daily pacing vs target trajectory and add live sales.</p>
      </div>

      {/* Manual Input Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          Add a Single Sale (Live Update)
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 max-w-[200px]">
            <label className="text-xs font-medium text-gray-500">Branch Name</label>
            <input 
              type="text" value={manualBranch} onChange={e => setManualBranch(e.target.value)}
              placeholder="e.g. MEGA BANGNA"
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-xs font-medium text-gray-500">Category</label>
            <select value={manualCategory} onChange={e => setManualCategory(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
              <option>iPhone</option>
              <option>Accessories</option>
              <option>Service</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-xs font-medium text-gray-500">Sub Category</label>
            <input 
              type="text" value={manualSubCategory} onChange={e => setManualSubCategory(e.target.value)}
              placeholder="e.g. Cover+, Case"
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none max-w-[150px]"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-xs font-medium text-gray-500">Value (THB)</label>
            <input 
              type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)}
              placeholder="Value"
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none w-[120px]"
            />
          </div>
          <button 
            onClick={handleManualAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-1.5 rounded-lg transition-colors h-[34px]"
          >
            Submit Sale
          </button>
        </div>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Actual Sales"
            value={formatCurrency(kpis.totalActual)}
            icon={<Zap className="w-4 h-4 text-amber-500" />}
            progress={100}
            color="amber"
          />
          <KpiCard
            title="Target (Pacing)"
            value={formatCurrency(kpis.targetDay)}
            icon={<Target className="w-4 h-4" />}
            color="blue"
          />
          <KpiCard
            title="Difference"
            value={(kpis.diffDay > 0 ? '+' : '') + formatCurrency(kpis.diffDay)}
            subtitle={kpis.diffDay > 0 ? 'Ahead of pace' : 'Behind pace'}
            icon={<TrendingUp className="w-4 h-4" />}
            color={kpis.diffDay > 0 ? 'green' : 'rose'}
          />
        </div>
      )}

      <DataTable
        title="Branch Pacing Detail"
        icon={<TrendingUp className="w-4 h-4" />}
        columns={columns}
        data={branchSummary.sort((a, b) => b.diffDay - a.diffDay)}
        emptyMessage="Data not loaded. Please upload the required files."
      />

      <DataTable
        title="Daily Performance Chase (Subcategories)"
        icon={<Zap className="w-4 h-4" />}
        columns={chaseColumns}
        data={chaseData}
        emptyMessage="Data not loaded. Please upload the required files."
      />
    </div>
  );
}
