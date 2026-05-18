/*
 * Design: Crystal Report — Swiss Precision Meets Apple Elegance
 * Main dashboard page with tab navigation, file upload bar, and content area.
 * Forest green (#166534) primary, clean whitespace, rounded cards.
 * Supports dark mode via Tailwind dark: variants.
 */
import { useState, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import FileUploadBar from '@/components/FileUploadBar';
import EmptyState from '@/components/EmptyState';
import OverviewTab from '@/components/tabs/OverviewTab';
import StaffTab from '@/components/tabs/StaffTab';
import StaffDashboardTab from '@/components/tabs/StaffDashboardTab';
import BranchDashboardTab from '@/components/tabs/BranchDashboardTab';
import DeepDiveTab from '@/components/tabs/DeepDiveTab';
import AttachmentTab from '@/components/tabs/AttachmentTab';
import AttachRateTab from '@/components/tabs/AttachRateTab';
import ManualTab from '@/components/tabs/ManualTab';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  User,
  Search,
  Link2,
  Maximize2,
  Minimize2,
  Target,
  BookOpen,
  Download,
  ChevronRight,
  Sun,
  Moon,
  RefreshCw,
  Database,
  Camera,
  Trash2,
  Loader2,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import {
  calculateBranchSummary,
  calculateOfficerSummary,
  calculateCategorySummary,
} from '@/lib/dataProcessor';

const LOGO_IMAGE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663113035049/QEeU9YZXUQKMMUHwtjvw9N/logo-icon-3DWFqxuoQzAhirDrikx8iK.webp';

type TabId = 'overview' | 'staff' | 'staff_dashboard' | 'branch_dashboard' | 'deepdive' | 'attachment' | 'attach_rate' | 'manual';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Group Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'staff', label: 'Staff Zone', icon: <Users className="w-4 h-4" /> },
  { id: 'staff_dashboard', label: 'Staff Dashboard', icon: <User className="w-4 h-4" /> },
  { id: 'branch_dashboard', label: 'Branch Dashboard', icon: <Store className="w-4 h-4" /> },
  { id: 'deepdive', label: 'PC Zone', icon: <Search className="w-4 h-4" /> },
  { id: 'attach_rate', label: 'Attach Rate', icon: <Target className="w-4 h-4" /> },
  { id: 'attachment', label: 'Apple Talk', icon: <Link2 className="w-4 h-4" /> },
  { id: 'manual', label: 'Manual', icon: <BookOpen className="w-4 h-4" /> },
];

/* ─── CSV Export helper ────────────────────────────── */
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const bom = '\uFEFF'; // UTF-8 BOM for Excel
  const csv = bom + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const data = useData();
  const { theme, setTheme } = useTheme();
  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label ?? 'Dashboard';
  const loadedBranches = new Set(data.currentPeriod.map(row => row.branchName)).size;
  const loadedOfficers = new Set(data.currentPeriod.map(row => row.officerName)).size;

  const handleCapture = useCallback(async () => {
    try {
      toast.info('Capturing screenshot...', { id: 'capture_toast' });
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('main-content') || document.documentElement;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      const tabName = tabs.find(t => t.id === activeTab)?.label.replace(/\s+/g, '-').toLowerCase() || 'dashboard';
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `dashboard-${tabName}-${dateStr}.png`;
      link.href = image;
      link.click();
      toast.success('Screenshot captured successfully!', { id: 'capture_toast' });
    } catch (e) {
      toast.error('Failed to capture screenshot.', { id: 'capture_toast' });
    }
  }, [activeTab]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleClearData = useCallback(async () => {
    if (confirm('ล้างข้อมูลทั้งหมด? (Clear all data?)')) {
      await data.clearAllData();
      toast.success('All data cleared');
    }
  }, [data]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExport = useCallback(() => {
    if (!data.isMinimumLoaded) {
      toast.error('No data to export');
      return;
    }

    try {
      const dateStr = new Date().toISOString().split('T')[0];

      // Export Branch Summary
      const branchSummary = calculateBranchSummary(
        data.targets, data.currentPeriod, data.lastMonth, data.lastYear, data.categoryMaster, 'All Category'
      );
      downloadCSV(
        `branch_summary_${dateStr}.csv`,
        ['Branch', 'Target', 'Actual', 'Ach%', 'Forecast', 'Forecast%', 'LastMonth', 'MoM%', 'LastYear', 'YoY%', 'TargetDay', 'ActualDay', 'DiffDay'],
        branchSummary.map(b => [
          b.branch, b.target, b.actual, b.achPercent.toFixed(1),
          b.forecast, b.forecastPercent.toFixed(1),
          b.lastMonth, b.momPercent.toFixed(1),
          b.lastYear, b.yoyPercent.toFixed(1),
          b.targetDay, b.actualDay, b.diffDay,
        ])
      );

      // Export Officer Summary
      const officerSummary = calculateOfficerSummary(
        data.targets, data.currentPeriod, data.lastMonth, data.lastYear, data.categoryMaster, 'All Category', 'All Positions'
      );
      downloadCSV(
        `officer_summary_${dateStr}.csv`,
        ['Branch', 'Officer', 'Position', 'Target', 'Actual', 'Ach%', 'Forecast', 'Forecast%', 'LastMonth', 'MoM%', 'LastYear', 'YoY%', 'TargetDay', 'DiffDay'],
        officerSummary.map(o => [
          o.branch, o.officerName, o.position, o.target, o.actual,
          o.achPercent.toFixed(1), o.forecast, o.forecastPercent.toFixed(1),
          o.lastMonth, o.momPercent.toFixed(1),
          o.lastYear, o.yoyPercent.toFixed(1),
          o.targetDay, o.diffDay,
        ])
      );

      // Export Category Summary
      const catSummary = calculateCategorySummary(
        data.targets, data.currentPeriod, data.lastMonth, data.lastYear, data.categoryMaster, 'All Positions'
      );
      downloadCSV(
        `category_summary_${dateStr}.csv`,
        ['Category', 'Target', 'Actual', 'Ach%', 'Forecast', 'Forecast%', 'LastMonth', 'MoM%', 'LastYear', 'YoY%'],
        catSummary.map(c => [
          c.groupCategory, c.target, c.actual, c.achPercent.toFixed(1),
          c.forecast, c.forecastPercent.toFixed(1),
          c.lastMonth, c.momPercent.toFixed(1),
          c.lastYear, c.yoyPercent.toFixed(1),
        ])
      );

      toast.success('Exported 3 CSV files: Branch, Officer, Category');
    } catch (e) {
      toast.error('Export failed');
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-100/80 px-3 py-3 text-slate-900 sm:px-4 sm:py-4 lg:px-6 lg:py-6 dark:bg-slate-950">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_25px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(22,101,52,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_22%)]" />
        <div className="relative grid min-h-[calc(100vh-1.5rem)] grid-cols-1 overflow-hidden lg:grid-cols-[292px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200/70 bg-white/70 p-5 backdrop-blur-xl lg:border-b-0 lg:border-r dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex items-center gap-3 rounded-[24px] border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="relative">
                <img src={LOGO_IMAGE} alt="Studio7" className="h-11 w-11 rounded-2xl object-cover shadow-md" />
                <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400">KPI Studio</p>
                <h1 className="truncate text-xl font-black tracking-tight">Sales Tracking</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Studio7 Dashboard</p>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
              <h2 className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Reports</h2>
              <nav className="grid gap-2">
                {tabs.map(tab => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'}`}
                    >
                      <span className={active ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}>{tab.icon}</span>
                      <span className="flex-1">{tab.label}</span>
                      {active && <span className="h-2 w-2 rounded-full bg-white/90" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-5 grid gap-3 rounded-[24px] border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Loaded branches</span>
                <span className="font-bold tabular-nums">{loadedBranches}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Loaded officers</span>
                <span className="font-bold tabular-nums">{loadedOfficers}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Active tab</span>
                <span className="max-w-[140px] truncate font-bold text-emerald-600 dark:text-emerald-400">{activeTabLabel}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
              <span>Powered by</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] tracking-[0.2em] dark:border-white/10 dark:bg-white/5">Crystal Report</span>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col bg-transparent">
            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1 xl:max-w-2xl">
                  <FileUploadBar />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {data.isMinimumLoaded && (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Database className="h-3.5 w-3.5" />
                      Local Sync
                    </div>
                  )}

                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white" title="Toggle Theme">
                      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    <button onClick={handleReload} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-emerald-600 dark:hover:bg-white/10 dark:hover:text-emerald-400" title="Reload Data">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={handleCapture} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-sky-600 dark:hover:bg-white/10 dark:hover:text-sky-400" title="Capture Screen">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  {data.isMinimumLoaded && (
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
                      <button onClick={handleExport} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-emerald-600 dark:hover:bg-white/10 dark:hover:text-emerald-400" title="Export CSV">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={handleClearData} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-rose-600 dark:hover:bg-white/10 dark:hover:text-rose-400" title="Clear Data">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {data.isMinimumLoaded && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-semibold text-slate-900 dark:text-white">{activeTabLabel}</span>
                </div>
              )}
            </header>

            <main id="main-content" className="flex-1 overflow-y-auto px-4 pb-10 pt-6 sm:px-6 lg:px-8">
              {data.isRestoringData ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-500" />
                  <p className="text-sm font-semibold">Restoring your dashboard...</p>
                </div>
              ) : !data.isMinimumLoaded ? (
                <div className="py-20"><EmptyState /></div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'staff' && <StaffTab />}
                    {activeTab === 'staff_dashboard' && <StaffDashboardTab />}
                    {activeTab === 'branch_dashboard' && <BranchDashboardTab />}
                    {activeTab === 'deepdive' && <DeepDiveTab />}
                    {activeTab === 'attach_rate' && <AttachRateTab />}
                    {activeTab === 'attachment' && <AttachmentTab />}
                    {activeTab === 'manual' && <ManualTab />}
                  </motion.div>
                </AnimatePresence>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
