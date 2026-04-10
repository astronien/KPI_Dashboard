/*
 * Design: Crystal Report — Swiss Precision
 * Live Monitor tab to track current day performance pacing.
 */
import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatPercent, formatMoney } from '@/components/DataTable';
import KpiCard from '@/components/KpiCard';
import { calculateBranchSummary, formatCurrency } from '@/lib/dataProcessor';
import { Activity, Target, TrendingUp, Zap } from 'lucide-react';

export default function LiveMonitorTab() {
  const data = useData();

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500" />
          Live Tracking (Pacing)
        </h2>
        <p className="text-sm text-gray-500">Monitor current daily pacing vs target trajectory.</p>
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
    </div>
  );
}
