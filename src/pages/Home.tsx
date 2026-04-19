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
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-gray-950 p-2 sm:p-4 md:p-6 lg:p-8 font-sans text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-900 rounded-[32px] md:rounded-[40px] shadow-sm border border-gray-200/60 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)]">
        
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 bg-gray-50/50 dark:bg-gray-900/80 border-r border-gray-100 dark:border-gray-800 flex flex-col flex-shrink-0">
          <div className="p-6 md:p-8 flex items-center gap-3">
            <div className="relative">
              <img src={LOGO_IMAGE} alt="Studio7" className="w-10 h-10 rounded-2xl shadow-sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight leading-tight">Sales Tracking</h1>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Studio7 Dashboard</p>
            </div>
          </div>

          <div className="px-4 pb-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mb-2">Reports</h2>
            <nav className="flex md:flex-col items-center md:items-stretch gap-1 overflow-x-auto md:overflow-y-auto scrollbar-none">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 whitespace-nowrap md:whitespace-normal
                    ${activeTab === tab.id
                      ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <span className={`${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="sidebarActive"
                      className="absolute right-2 w-1.5 h-1.5 bg-rose-500 rounded-full hidden md:block"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6 md:p-8 text-[10px] text-gray-400 dark:text-gray-600 font-semibold flex items-center justify-between">
            <span>Powered By</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">Crystal Report</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 relative min-w-0">
          
          {/* Top Header */}
          <header className="px-6 md:px-8 py-4 md:py-6 flex flex-col xl:flex-row xl:items-center gap-4 justify-between border-b border-gray-50 dark:border-gray-800/60 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-40">
            <div className="flex-1 w-full xl:max-w-xl">
              {/* File upload acting like a search bar in the new layout */}
              <FileUploadBar />
            </div>

            <div className="flex items-center gap-2">
              {data.isMinimumLoaded && (
                <div className="hidden sm:flex items-center px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900 shadow-sm mr-2">
                  <Database className="w-3.5 h-3.5 mr-1.5" />
                  Local Sync
                </div>
              )}
              
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-1 border border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleReload}
                  className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-rose-600 transition-all shadow-sm"
                  title="Reload Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCapture}
                  className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-all shadow-sm"
                  title="Capture Screen"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {data.isMinimumLoaded && (
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-1 border border-gray-100 dark:border-gray-700 ml-1">
                  <button
                    onClick={handleExport}
                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-emerald-600 transition-all shadow-sm flex items-center gap-1.5"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClearData}
                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-rose-600 transition-all shadow-sm"
                    title="Clear Data"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Breadcrumb Info */}
          {data.isMinimumLoaded && (
            <div className="px-6 md:px-10 pt-6 pb-2">
              <h2 className="text-2xl font-black tracking-tight dark:text-white">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
          )}

          {/* Dashboard Canvas */}
          <main id="main-content" className="flex-1 overflow-y-auto px-4 md:px-10 pb-10 pt-2 scrollbar-none">
            {data.isRestoringData ? (
              <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-rose-500" />
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
  );
}
