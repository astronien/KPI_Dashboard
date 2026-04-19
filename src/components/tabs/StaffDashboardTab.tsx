/*
 * Design: Crystal Report — Per-Staff KPI Dashboard
 * Individual staff dashboard showing KPI achievement, category breakdown,
 * progress tracking, and performance metrics in a card-based layout.
 * Inspired by the reference KPI dashboard design.
 */
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { getGroupCategory, formatCurrency, calculateOfficerSummary, cleanName } from '@/lib/dataProcessor';
import {
  User,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  ShoppingBag,
  Users,
  MapPin,
  Store,
  Truck,
  Info,
  ChevronDown,
  Zap,
  Star,
  GitCompareArrows,
  LineChart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

/* ── Helpers ───────────────────────────────────────── */
const fmtNum = (n: number, dec = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
};

const parseDay = (dateStr: string): number => {
  if (!dateStr) return 0;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.getDate();
  if (/^\d+$/.test(dateStr)) {
    const serial = parseInt(dateStr, 10);
    d = new Date((serial - 25569) * 86400 * 1000);
    return d.getDate();
  }
  const parts = dateStr.split(/[-/]/);
  if (parts.length >= 3) {
    const pd = parseInt(parts[0], 10);
    if (pd >= 1 && pd <= 31) return pd;
  }
  return 0;
};

/* ── Sub-Components ────────────────────────────────── */

/** Top hero card (Till date / Monthly / Remaining) */
const HeroCard = ({
  label,
  value,
  achievement,
  achievementLabel,
  color,
}: {
  label: string;
  value: string;
  achievement: string;
  achievementLabel: string;
  color: 'emerald' | 'indigo' | 'rose';
}) => {
  const palette = {
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/40',
      border: 'border-emerald-200/60',
      text: 'text-emerald-700',
      badge: 'bg-emerald-600 text-white',
      achText: 'text-emerald-800',
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/40',
      border: 'border-indigo-200/60',
      text: 'text-indigo-700',
      badge: 'bg-indigo-600 text-white',
      achText: 'text-indigo-800',
    },
    rose: {
      bg: 'bg-gradient-to-br from-rose-50 to-rose-100/40',
      border: 'border-rose-200/60',
      text: 'text-rose-700',
      badge: 'bg-rose-600 text-white',
      achText: 'text-rose-800',
    },
  };
  const p = palette[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`rounded-[32px] border ${p.border} ${p.bg} p-5 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${p.badge} shadow-sm`}>
          {value}
        </span>
      </div>
      <span className={`text-4xl font-black tabular-nums tracking-tight ${p.achText}`}>
        {achievement}
      </span>
      <div className="flex items-center gap-1.5">
        <Award className={`w-3.5 h-3.5 ${p.text}`} />
        <span className={`text-xs font-semibold ${p.text}`}>{achievementLabel}</span>
      </div>
    </motion.div>
  );
};

/** Progress bar row */
const ProgressRow = ({
  icon,
  label,
  current,
  total,
  percent,
  color,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  current: string;
  total: string;
  percent: number;
  color: string;
  suffix?: string;
}) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex items-center gap-2 w-40 shrink-0">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs font-bold text-gray-600">{label}</span>
    </div>
    <div className="flex-1 relative h-5 rounded-full bg-gray-100 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`absolute left-0 top-0 h-full rounded-full ${color}`}
      />
    </div>
    <div className="flex items-center gap-2 w-44 shrink-0 justify-end">
      <span className="text-xs font-bold text-gray-700 tabular-nums">
        {current} / {total}
      </span>
      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md tabular-nums">
        {percent.toFixed(1)}%
      </span>
      {suffix && (
        <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

/** Category achievement row with bar */
const CategoryRow = ({
  name,
  actual,
  target,
  achPercent,
  momPercent,
  forecastPercent,
  yoyPercent,
  color,
}: {
  name: string;
  actual: number;
  target: number;
  achPercent: number;
  momPercent: number;
  forecastPercent: number;
  yoyPercent: number;
  color: string;
}) => {
  const barWidth = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  
  const DeltaBadge = ({ value, label }: { value: number; label: string }) => {
    const isUp = value >= 0;
    return (
      <div className="text-center min-w-[48px]">
        <div className={`text-xs font-bold tabular-nums flex items-center justify-center gap-0.5 ${isUp ? 'text-rose-600' : 'text-rose-500'}`}>
          {value.toFixed(0)}%
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </div>
        <div className="text-[9px] text-gray-400 font-medium">{label}</div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
      <div className="w-14 shrink-0">
        <span className="text-xs font-bold text-gray-700">{name}</span>
      </div>
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 relative h-4 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`absolute left-0 top-0 h-full rounded-full ${color}`}
          />
        </div>
        <div className="flex items-center gap-2 w-36 shrink-0">
          <span className="text-xs text-gray-500 tabular-nums">
            {fmtCompact(actual)} / {fmtCompact(target)}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${
            achPercent >= 100 ? 'bg-rose-50 text-rose-700' :
            achPercent >= 80 ? 'bg-amber-50 text-amber-700' :
            'bg-rose-50 text-rose-700'
          }`}>
            {achPercent.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <DeltaBadge value={momPercent} label="M2M" />
        <DeltaBadge value={forecastPercent} label="MTD" />
        <DeltaBadge value={yoyPercent} label="YTD" />
      </div>
    </div>
  );
};

/** Bottom metric card */
const MetricCard = ({
  icon,
  title,
  trend,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  trend: 'up' | 'down' | 'neutral';
  rows: { label: string; value: string; highlight?: boolean }[];
}) => {
  const trendIcon = trend === 'up'
    ? <TrendingUp className="w-4 h-4 text-rose-500" />
    : trend === 'down'
      ? <TrendingDown className="w-4 h-4 text-rose-500" />
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{title}</h4>
        </div>
        {trendIcon}
      </div>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{row.label}</span>
            <span className={`text-xs font-bold tabular-nums ${row.highlight ? 'text-rose-600' : 'text-gray-800'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/** Resource counter bubble */
const ResourceBubble = ({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: string;
  color: string;
}) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-12 h-12 rounded-[32px] ${color} flex items-center justify-center shadow-sm`}>
      {icon}
    </div>
    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-black text-gray-800 tabular-nums">{count}</span>
  </div>
);

/* ─────────────────────────────────────────────────── */
/* ██  MAIN COMPONENT                                ██ */
/* ─────────────────────────────────────────────────── */
export default function StaffDashboardTab() {
  const data = useData();
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [targetPercent, setTargetPercent] = useState(100);
  const [compareMode, setCompareMode] = useState(false);
  const [compareStaff, setCompareStaff] = useState<string>('');

  // Bookmarks (persisted in localStorage)
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('staff_bookmarks') || '[]');
    } catch { return []; }
  });
  const toggleBookmark = useCallback((name: string) => {
    setBookmarks(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
      localStorage.setItem('staff_bookmarks', JSON.stringify(next));
      return next;
    });
  }, []);

  // Staff list from targets
  const staffList = useMemo(() => {
    if (!data.targets.length) return [];
    return data.targets.map(t => ({
      id: t.staffId,
      name: t.name,
      surname: t.surname,
      fullName: `${t.name} ${t.surname}`.trim(),
      branch: t.branchName.replace(/^ID\d+ : /, ''),
      position: t.position,
    }));
  }, [data.targets]);

  // Auto-select first staff if none selected
  useMemo(() => {
    if (!selectedStaff && staffList.length > 0) {
      setSelectedStaff(staffList[0].name);
    }
  }, [staffList, selectedStaff]);

  // Find the selected target row
  const targetRow = useMemo(() => {
    if (!selectedStaff) return null;
    return data.targets.find(t => t.name === selectedStaff) || null;
  }, [data.targets, selectedStaff]);

  // Calculate staff-specific data
  const staffData = useMemo(() => {
    if (!targetRow || !data.isLoaded.currentPeriod) return null;

    const totalDays = targetRow.day || 30;
    const currentDay = new Date().getDate();
    const tName = targetRow.name.trim().toLowerCase();
    const tFullName = `${targetRow.name.trim()} ${targetRow.surname.trim()}`.toLowerCase();

    const isMatch = (s: { officerName: string; officerId: number }) => {
      if (targetRow.staffId > 0 && s.officerId > 0 && targetRow.staffId === s.officerId) return true;
      const sName = s.officerName.trim().toLowerCase();
      return sName === tName || sName === tFullName || sName.startsWith(tName + ' ');
    };

    const currentSales = data.currentPeriod.filter(isMatch);
    const lastMonthSales = data.lastMonth.filter(isMatch);
    const lastYearSales = data.lastYear.filter(isMatch);

    const totalActual = currentSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalTarget = targetRow.total;
    const achPercent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

    // Monthly target (same as total for this month)
    const monthlyTarget = totalTarget;
    const remaining = Math.max(0, totalTarget - totalActual);
    const monthlyAchPercent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

    // Daily avg target
    const dailyAvgTarget = totalDays > 0 ? totalTarget / totalDays : 0;
    const tillDateTarget = dailyAvgTarget * currentDay;
    const tillDateAch = tillDateTarget > 0 ? (totalActual / tillDateTarget) * 100 : 0;

    // Time pass
    const timePassPercent = totalDays > 0 ? (currentDay / totalDays) * 100 : 0;
    const remainingDays = Math.max(0, totalDays - currentDay);

    // Category breakdown
    const categories = [
      { name: 'iPhone', targetKey: 'iphone' as const, color: 'bg-blue-500' },
      { name: 'Mac', targetKey: 'mac' as const, color: 'bg-rose-500' },
      { name: 'iPad', targetKey: 'ipad' as const, color: 'bg-amber-500' },
      { name: 'Watch', targetKey: 'appleWatch' as const, color: 'bg-purple-500' },
    ];

    const categoryBreakdown = categories.map(cat => {
      const catTarget = targetRow[cat.targetKey] as number;
      const catActual = currentSales
        .filter(s => {
          const gc = getGroupCategory(s.categoryName, s.subCategory, data.categoryMaster, s.productName);
          return gc === (cat.name === 'Watch' ? 'Apple Watch' : cat.name);
        })
        .reduce((sum, s) => sum + s.totalPrice, 0);

      const catLM = lastMonthSales
        .filter(s => {
          const gc = getGroupCategory(s.categoryName, s.subCategory, data.categoryMaster, s.productName);
          return gc === (cat.name === 'Watch' ? 'Apple Watch' : cat.name);
        })
        .reduce((sum, s) => sum + s.totalPrice, 0);

      const catLY = lastYearSales
        .filter(s => {
          const gc = getGroupCategory(s.categoryName, s.subCategory, data.categoryMaster, s.productName);
          return gc === (cat.name === 'Watch' ? 'Apple Watch' : cat.name);
        })
        .reduce((sum, s) => sum + s.totalPrice, 0);

      const catAch = catTarget > 0 ? (catActual / catTarget) * 100 : 0;
      const momPct = catLM > 0 ? ((catActual - catLM) / catLM) * 100 : 0;
      const forecast = currentDay > 0 ? (catActual / currentDay) * totalDays : 0;
      const forecastPct = catTarget > 0 ? (forecast / catTarget) * 100 : 0;
      const yoyPct = catLY > 0 ? ((catActual - catLY) / catLY) * 100 : 0;

      return {
        name: cat.name,
        target: catTarget,
        actual: catActual,
        achPercent: catAch,
        momPercent: momPct,
        forecastPercent: forecastPct,
        yoyPercent: yoyPct,
        color: cat.color,
      };
    });

    // Total invoices (unique doc numbers)
    const uniqueDocs = new Set(currentSales.map(s => s.docNo));
    const invoiceCount = uniqueDocs.size;
    const totalUnits = currentSales.reduce((sum, s) => sum + s.number, 0);
    const skuPerInvoice = invoiceCount > 0 ? totalUnits / invoiceCount : 0;

    // Last Month totals for MoM
    const lmTotal = lastMonthSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const lyTotal = lastYearSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const momPercent = lmTotal > 0 ? ((totalActual - lmTotal) / lmTotal) * 100 : 0;
    const yoyPercent = lyTotal > 0 ? ((totalActual - lyTotal) / lyTotal) * 100 : 0;

    return {
      totalActual,
      totalTarget,
      achPercent,
      monthlyTarget,
      monthlyAchPercent,
      remaining,
      tillDateTarget,
      tillDateAch,
      dailyAvgTarget,
      currentDay,
      totalDays,
      timePassPercent,
      remainingDays,
      categoryBreakdown,
      invoiceCount,
      totalUnits,
      skuPerInvoice,
      momPercent,
      yoyPercent,
      forecast: currentDay > 0 ? (totalActual / currentDay) * totalDays : 0,
    };
  }, [targetRow, data]);

  // Get greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const staffInfo = useMemo(() => {
    if (!selectedStaff) return null;
    return staffList.find(s => s.name === selectedStaff) || null;
  }, [staffList, selectedStaff]);

  // Trend chart data — daily sales accumulation
  const trendChartData = useMemo(() => {
    if (!targetRow || !data.isLoaded.currentPeriod) return [];
    const totalDays = targetRow.day || 30;
    const dailyTarget = targetRow.total / totalDays;
    
    const tNameClean = cleanName(targetRow.name);
    const tFullNameClean = cleanName(`${targetRow.name} ${targetRow.surname}`);
    
    const isMatch = (s: { officerName: string; officerId: number }) => {
      if (targetRow.staffId > 0 && s.officerId > 0 && targetRow.staffId === s.officerId) return true;
      const sNameClean = cleanName(s.officerName);
      if (sNameClean === tNameClean) return true;
      if (sNameClean === tFullNameClean) return true;
      if (sNameClean.startsWith(tNameClean + ' ')) return true;
      if (tNameClean.length > 3 && sNameClean.includes(tNameClean)) return true;
      return false;
    };

    const staffSales = data.currentPeriod.filter(isMatch);

    // Group by day of month
    const dayMap = new Map<number, number>();
    staffSales.forEach(s => {
      const day = parseDay(s.docDate);
      if (day > 0) {
        dayMap.set(day, (dayMap.get(day) || 0) + s.totalPrice);
      }
    });

    let cumActual = 0;
    const result = [];
    for (let d = 1; d <= totalDays; d++) {
      const dayActual = dayMap.get(d) || 0;
      cumActual += dayActual;
      const cumTarget = dailyTarget * d;
      const isFuture = d > new Date().getDate();
      result.push({
        day: d,
        actual: isFuture ? null : cumActual,
        target: cumTarget,
        daily: dayActual,
      });
    }
    return result;
  }, [targetRow, data.currentPeriod, data.isLoaded.currentPeriod]);

  // Compare mode data
  const compareData = useMemo(() => {
    if (!compareMode || !compareStaff || !data.isLoaded.targets) return null;
    const row = data.targets.find(t => t.name === compareStaff);
    if (!row) return null;
    
    const cNameClean = cleanName(row.name);
    const cFullNameClean = cleanName(`${row.name} ${row.surname}`);
    
    const isMatch = (s: { officerName: string; officerId: number }) => {
      if (row.staffId > 0 && s.officerId > 0 && row.staffId === s.officerId) return true;
      const sNameClean = cleanName(s.officerName);
      if (sNameClean === cNameClean) return true;
      if (sNameClean === cFullNameClean) return true;
      if (sNameClean.startsWith(cNameClean + ' ')) return true;
      if (cNameClean.length > 3 && sNameClean.includes(cNameClean)) return true;
      return false;
    };

    const sales = data.currentPeriod.filter(isMatch);
    const totalActual = sales.reduce((s, r) => s + r.totalPrice, 0);
    const achPercent = row.total > 0 ? (totalActual / row.total) * 100 : 0;
    const totalDays = row.day || 30;
    const currentDay = new Date().getDate();
    const forecast = currentDay > 0 ? (totalActual / currentDay) * totalDays : 0;
    return {
      name: row.name,
      branch: row.branchName.replace(/^ID\d+ : /, ''),
      position: row.position,
      target: row.total,
      actual: totalActual,
      achPercent,
      forecast,
      forecastPercent: row.total > 0 ? (forecast / row.total) * 100 : 0,
    };
  }, [compareMode, compareStaff, data]);

  if (!data.isMinimumLoaded) {
    return (
      <div className="text-center py-20 text-gray-400">
        <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-sm">Upload Target and Current Period files to view staff dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header with Staff Selector ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm relative"
      >
        {/* Gradient accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-rose-500 to-cyan-500 rounded-t-2xl" />

        <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[32px] bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {greeting}, {selectedStaff || 'Staff'}!
              </h2>
              <p className="text-sm text-gray-500">
                Welcome to your KPI Dashboard.
                {staffInfo && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium">
                    {staffInfo.position} · {staffInfo.branch}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Staff name display */}
            <div className="text-right hidden md:block">
              <span className="text-xs text-gray-400 font-medium">Staff name</span>
            </div>
            {/* Staff Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm shadow-rose-600/20 hover:bg-rose-700 transition-colors"
              >
                {selectedStaff || 'Select Staff'}
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 max-h-80 overflow-y-auto"
                  >
                    {/* Bookmarked staff first */}
                    {[...staffList]
                      .sort((a, b) => {
                        const aB = bookmarks.includes(a.name) ? 0 : 1;
                        const bB = bookmarks.includes(b.name) ? 0 : 1;
                        return aB - bB;
                      })
                      .map((staff, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedStaff(staff.name);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${
                          staff.name === selectedStaff ? 'bg-rose-50 dark:bg-rose-950/30' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-300">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{staff.name}</p>
                          <p className="text-[10px] text-gray-400">{staff.position} · {staff.branch}</p>
                        </div>
                        {staff.name === selectedStaff && (
                          <div className="w-2 h-2 rounded-full bg-rose-500 ml-auto shrink-0" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {staffData && (
        <>
          {/* ─── Top Hero KPI Cards ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HeroCard
              label="Till date Target"
              value={fmtCompact(staffData.tillDateTarget)}
              achievement={staffData.tillDateAch.toFixed(1) + '%'}
              achievementLabel="Achievement"
              color="rose"
            />
            <HeroCard
              label="Monthly Target"
              value={fmtCompact(staffData.monthlyTarget)}
              achievement={staffData.monthlyAchPercent.toFixed(1) + '%'}
              achievementLabel="Achievement"
              color="indigo"
            />
            <HeroCard
              label="Remaining"
              value={fmtCompact(staffData.remaining)}
              achievement={formatCurrency(staffData.totalActual)}
              achievementLabel="Total Sales"
              color="rose"
            />
          </div>

          {/* ─── Progress Bars (Daily Avg Target + Time Pass) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-5"
          >
            <ProgressRow
              icon={<Target className="w-4 h-4" />}
              label="Daily Avg Target"
              current={fmtCompact(staffData.totalActual)}
              total={fmtCompact(staffData.tillDateTarget)}
              percent={staffData.tillDateAch}
              color="bg-gradient-to-r from-rose-500 to-teal-500"
            />
            <ProgressRow
              icon={<Calendar className="w-4 h-4" />}
              label="Time Pass"
              current={String(staffData.currentDay)}
              total={String(staffData.totalDays)}
              percent={staffData.timePassPercent}
              color="bg-gradient-to-r from-blue-500 to-indigo-500"
              suffix={`Remaining ${staffData.remainingDays} days`}
            />
          </motion.div>

          {/* ─── Daily Pace Calculator ─── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Daily Pace Calculator</h3>
                  <p className="text-[10px] text-gray-400">ค่าเฉลี่ยที่ต้องทำต่อวันเพื่อให้ถึงเป้า</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[70, 80, 90, 100, 105].map(pct => {
                  const isActive = targetPercent === pct;
                  return (
                    <button
                      key={pct}
                      onClick={() => setTargetPercent(pct)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 scale-105'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            {(() => {
              const goalAmount = staffData.totalTarget * (targetPercent / 100);
              const remainingSales = Math.max(0, goalAmount - staffData.totalActual);
              const dailyNeeded = staffData.remainingDays > 0 ? remainingSales / staffData.remainingDays : 0;
              const alreadyAchieved = staffData.totalActual >= goalAmount;
              const currentDailyAvg = staffData.currentDay > 0 ? staffData.totalActual / staffData.currentDay : 0;
              const paceRatio = currentDailyAvg > 0 ? dailyNeeded / currentDailyAvg : 0;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Goal Amount */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100/60">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">เป้าหมาย ({targetPercent}%)</p>
                    <p className="text-2xl font-black text-amber-800 tabular-nums">{fmtCompact(goalAmount)}</p>
                    <p className="text-[10px] text-amber-500 mt-1">จาก Target {fmtCompact(staffData.totalTarget)}</p>
                  </div>

                  {/* Remaining Sales */}
                  <div className={`rounded-2xl p-4 border ${alreadyAchieved ? 'bg-rose-50 border-rose-100/60' : 'bg-rose-50 border-rose-100/60'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${alreadyAchieved ? 'text-rose-600' : 'text-rose-600'}`}>ยอดที่ยังขาด</p>
                    <p className={`text-2xl font-black tabular-nums ${alreadyAchieved ? 'text-rose-700' : 'text-rose-700'}`}>
                      {alreadyAchieved ? '✓ ถึงเป้าแล้ว!' : fmtCompact(remainingSales)}
                    </p>
                    <p className={`text-[10px] mt-1 ${alreadyAchieved ? 'text-rose-500' : 'text-rose-400'}`}>
                      {alreadyAchieved ? `เกินเป้า ${fmtCompact(staffData.totalActual - goalAmount)}` : `เหลืออีก ${staffData.remainingDays} วัน`}
                    </p>
                  </div>

                  {/* Daily Average Needed */}
                  <div className={`rounded-2xl p-4 border ${
                    alreadyAchieved ? 'bg-rose-50 border-rose-100/60' 
                    : paceRatio > 1.5 ? 'bg-rose-50 border-rose-100/60' 
                    : 'bg-indigo-50 border-indigo-100/60'
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      alreadyAchieved ? 'text-rose-600' : paceRatio > 1.5 ? 'text-rose-600' : 'text-indigo-600'
                    }`}>ต้องทำเฉลี่ย/วัน</p>
                    <p className={`text-2xl font-black tabular-nums ${
                      alreadyAchieved ? 'text-rose-700' : paceRatio > 1.5 ? 'text-rose-700' : 'text-indigo-700'
                    }`}>
                      {alreadyAchieved ? '-' : fmtCompact(dailyNeeded)}
                    </p>
                    <p className={`text-[10px] mt-1 ${
                      alreadyAchieved ? 'text-rose-500' : paceRatio > 1.5 ? 'text-rose-400' : 'text-indigo-400'
                    }`}>
                      ทำอยู่เฉลี่ย {fmtCompact(currentDailyAvg)}/วัน
                    </p>
                  </div>

                  {/* Pace Comparison */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/60 rounded-2xl p-4 border border-gray-200/60">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">เทียบกับ Pace ปัจจุบัน</p>
                    {alreadyAchieved ? (
                      <>
                        <p className="text-2xl font-black text-rose-600 tabular-nums">🎉</p>
                        <p className="text-[10px] text-rose-500 mt-1">ทำได้ถึงเป้าแล้ว!</p>
                      </>
                    ) : (
                      <>
                        <p className={`text-2xl font-black tabular-nums ${paceRatio <= 1 ? 'text-rose-600' : paceRatio <= 1.5 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {paceRatio.toFixed(1)}x
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${paceRatio <= 1 ? 'bg-rose-500' : paceRatio <= 1.5 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          <p className={`text-[10px] ${paceRatio <= 1 ? 'text-rose-500' : paceRatio <= 1.5 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {paceRatio <= 1 ? 'ตาม Pace อยู่ 👍' : paceRatio <= 1.5 ? 'ต้องเร่งอีกนิด' : 'ต้องเร่งมาก ⚡'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* ─── Trend Chart: Daily Sales Accumulation ─── */}
          {trendChartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <LineChart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Daily Sales Accumulation</h3>
                  <p className="text-[10px] text-gray-400">กราฟแนวโน้มยอดสะสม vs เป้าหมาย</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v: number) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : String(v)} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: any, name: string) => [value != null ? formatCurrency(value) : '-', name === 'actual' ? 'Actual' : 'Target']}
                    labelFormatter={(v: any) => `Day ${v}`}
                  />
                  <Area type="monotone" dataKey="target" stroke="#6366f1" strokeWidth={2} strokeDasharray="6 3" fill="none" name="target" dot={false} />
                  <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} fill="url(#actualGrad)" name="actual" dot={false} connectNulls={false} />
                  <ReferenceLine x={new Date().getDate()} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Today', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                </AreaChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-6 mt-2 text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-rose-500 rounded" /> Actual</div>
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-indigo-500 rounded" style={{ borderBottom: '2px dashed #6366f1' }} /> Target</div>
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-amber-500 rounded" style={{ borderBottom: '2px dashed #f59e0b' }} /> Today</div>
              </div>
            </motion.div>
          )}

          {/* ─── Comparison Mode ─── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <GitCompareArrows className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Staff Comparison</h3>
                  <p className="text-[10px] text-gray-400">เปรียบเทียบผลงานกับพนักงานคนอื่น</p>
                </div>
              </div>
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  compareMode
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-950'
                }`}
              >
                {compareMode ? 'Close' : 'Compare'}
              </button>
            </div>

            <AnimatePresence>
              {compareMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-4">
                    <select
                      value={compareStaff}
                      onChange={e => setCompareStaff(e.target.value)}
                      className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none w-full sm:w-64"
                    >
                      <option value="">Select staff to compare...</option>
                      {staffList.filter(s => s.name !== selectedStaff).map((s, i) => (
                        <option key={i} value={s.name}>{s.name} ({s.position} · {s.branch})</option>
                      ))}
                    </select>
                  </div>

                  {compareData && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Current Staff */}
                      <div className="bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl p-4 border border-rose-100 dark:border-rose-900/50">
                        <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-3 truncate">{selectedStaff}</p>
                        <div className="space-y-2">
                          {[
                            { label: 'Target', value: fmtCompact(staffData.totalTarget) },
                            { label: 'Actual', value: fmtCompact(staffData.totalActual) },
                            { label: 'Ach.', value: staffData.achPercent.toFixed(1) + '%' },
                            { label: 'Forecast', value: fmtCompact(staffData.forecast) },
                          ].map((r, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-gray-500">{r.label}</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Compare Staff */}
                      <div className="bg-violet-50/50 dark:bg-violet-950/30 rounded-2xl p-4 border border-violet-100 dark:border-violet-900/50">
                        <p className="text-xs font-bold text-violet-700 dark:text-violet-400 mb-3 truncate">{compareData.name}</p>
                        <div className="space-y-2">
                          {[
                            { label: 'Target', value: fmtCompact(compareData.target) },
                            { label: 'Actual', value: fmtCompact(compareData.actual) },
                            { label: 'Ach.', value: compareData.achPercent.toFixed(1) + '%' },
                            { label: 'Forecast', value: fmtCompact(compareData.forecast) },
                          ].map((r, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-gray-500">{r.label}</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ─── Middle Row: Resources + Category Breakdown ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* National Resources */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-6"
            >
              <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                Sales Resources
              </h3>
              <p className="text-[10px] text-gray-400 mb-6">Performance resource overview</p>

              <div className="grid grid-cols-4 gap-4">
                <ResourceBubble
                  icon={<Users className="w-5 h-5 text-rose-700" />}
                  label="Staff"
                  count={String(staffList.filter(s => staffInfo && s.branch === staffInfo.branch).length)}
                  color="bg-rose-100"
                />
                <ResourceBubble
                  icon={<Store className="w-5 h-5 text-blue-700" />}
                  label="Branch"
                  count={String(new Set(staffList.map(s => s.branch)).size)}
                  color="bg-blue-100"
                />
                <ResourceBubble
                  icon={<ShoppingBag className="w-5 h-5 text-amber-700" />}
                  label="Invoices"
                  count={fmtNum(staffData.invoiceCount)}
                  color="bg-amber-100"
                />
                <ResourceBubble
                  icon={<Truck className="w-5 h-5 text-rose-700" />}
                  label="Units"
                  count={fmtNum(staffData.totalUnits)}
                  color="bg-rose-100"
                />
              </div>

              {/* Vertical connectors (decorative) */}
              <div className="flex justify-around mt-2 mb-2 px-6">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-px h-4 bg-gray-200" />
                ))}
              </div>
            </motion.div>

            {/* Value Target Achievement */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-8 bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-gray-800">Value Target Achievement</h3>
                  <Info className="w-3.5 h-3.5 text-gray-300 cursor-help" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md">M2M</span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md">MTD</span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md">YTD</span>
                </div>
              </div>

              <div>
                {staffData.categoryBreakdown.map((cat, i) => (
                  <CategoryRow
                    key={i}
                    name={cat.name}
                    actual={cat.actual}
                    target={cat.target}
                    achPercent={cat.achPercent}
                    momPercent={cat.momPercent}
                    forecastPercent={cat.forecastPercent}
                    yoyPercent={cat.yoyPercent}
                    color={cat.color}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* ─── Bottom Metric Cards ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<ShoppingBag className="w-4 h-4" />}
              title="SKU Per Invoice"
              trend={staffData.skuPerInvoice >= 2 ? 'up' : 'down'}
              rows={[
                { label: 'Target', value: '100%' },
                { label: 'Actual Invoices', value: fmtNum(staffData.invoiceCount) },
                { label: 'Units / Invoice', value: staffData.skuPerInvoice.toFixed(2), highlight: true },
              ]}
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" />}
              title="MoM Growth"
              trend={staffData.momPercent >= 0 ? 'up' : 'down'}
              rows={[
                { label: 'Current Month', value: formatCurrency(staffData.totalActual) },
                { label: 'Growth %', value: (staffData.momPercent >= 0 ? '+' : '') + staffData.momPercent.toFixed(1) + '%', highlight: staffData.momPercent >= 0 },
              ]}
            />
            <MetricCard
              icon={<Target className="w-4 h-4" />}
              title="Achievement"
              trend={staffData.achPercent >= 80 ? 'up' : 'down'}
              rows={[
                { label: 'Total Target', value: formatCurrency(staffData.totalTarget) },
                { label: 'Total Actual', value: formatCurrency(staffData.totalActual) },
                { label: 'Ach. %', value: staffData.achPercent.toFixed(1) + '%', highlight: staffData.achPercent >= 100 },
              ]}
            />
            <MetricCard
              icon={<Award className="w-4 h-4" />}
              title="Forecast"
              trend={staffData.forecast >= staffData.totalTarget ? 'up' : 'down'}
              rows={[
                { label: 'Forecast Sales', value: formatCurrency(staffData.forecast) },
                { label: 'vs Target', value: ((staffData.forecast / (staffData.totalTarget || 1)) * 100).toFixed(1) + '%', highlight: staffData.forecast >= staffData.totalTarget },
                { label: 'YoY Growth', value: (staffData.yoyPercent >= 0 ? '+' : '') + staffData.yoyPercent.toFixed(1) + '%' },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
