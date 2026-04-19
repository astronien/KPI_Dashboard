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
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import {
  calculateBranchSummary,
  calculateOfficerSummary,
  calculateCategorySummary,
} from '@/lib/dataProcessor';

const LOGO_IMAGE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663113035049/QEeU9YZXUQKMMUHwtjvw9N/logo-icon-3DWFqxuoQzAhirDrikx8iK.webp';

type TabId = 'overview' | 'staff' | 'staff_dashboard' | 'deepdive' | 'attachment' | 'attach_rate' | 'manual';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Group Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'staff', label: 'Staff Zone', icon: <Users className="w-4 h-4" /> },
  { id: 'staff_dashboard', label: 'Staff Dashboard', icon: <User className="w-4 h-4" /> },
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
      const element = document.documentElement;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `dashboard-capture-${new Date().getTime()}.png`;
      link.href = image;
      link.click();
      toast.success('Screenshot captured successfully!', { id: 'capture_toast' });
    } catch (e) {
      toast.error('Failed to capture screenshot.', { id: 'capture_toast' });
    }
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100/80 dark:border-gray-800 sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={LOGO_IMAGE} alt="Studio7" className="w-10 h-10 rounded-xl shadow-sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">Sales Tracking</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-[0.2em]">Studio7 Performance Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data.isMinimumLoaded && (
              <div className="hidden sm:flex items-center px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-200 dark:border-emerald-800 mr-1 uppercase tracking-wide">
                <Database className="w-3 h-3 mr-1" />
                Local Data
              </div>
            )}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleReload}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-emerald-600 transition-colors"
              title="Reload Data Hub"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCapture}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600 transition-colors"
              title="Capture Dashboard"
            >
              <Camera className="w-4 h-4" />
            </button>
            {data.isMinimumLoaded && (
              <>
                <button
                  onClick={handleExport}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  onClick={handleClearData}
                  className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-gray-400 hover:text-rose-600 transition-colors"
                  title="Clear all data"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container">
          <nav className="flex items-center gap-0.5 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-semibold
                  transition-all duration-200 whitespace-nowrap rounded-t-lg
                  ${activeTab === tab.id
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/50'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-emerald-600 dark:bg-emerald-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* File Upload Bar */}
      <FileUploadBar />

      {/* Breadcrumb */}
      {data.isMinimumLoaded && (
        <div className="container pt-4 pb-0">
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">{tabs.find(t => t.id === activeTab)?.label}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container py-5">
        {data.isRestoringData ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
            <p className="text-sm font-medium">Restoring saved data...</p>
          </div>
        ) : !data.isMinimumLoaded ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'staff' && <StaffTab />}
              {activeTab === 'staff_dashboard' && <StaffDashboardTab />}
              {activeTab === 'deepdive' && <DeepDiveTab />}
              {activeTab === 'attach_rate' && <AttachRateTab />}
              {activeTab === 'attachment' && <AttachmentTab />}
              {activeTab === 'manual' && <ManualTab />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100/80 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm py-5 mt-8">
        <div className="container flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">Studio7 Sales Tracking Dashboard</p>
          <p className="text-[10px] text-gray-300 dark:text-gray-600">Powered by Crystal Report</p>
        </div>
      </footer>
    </div>
  );
}
