/*
 * Design: Crystal Report — Swiss Precision
 * Collapsible file upload bar with status indicators.
 * Shows green check when loaded, amber when pending.
 */
import { useRef, useCallback, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';

interface FileSlot {
  key: 'categoryMaster' | 'targets' | 'currentPeriod' | 'lastMonth' | 'lastYear';
  label: string;
  shortLabel: string;
  required: boolean;
}

const FILE_SLOTS: FileSlot[] = [
  { key: 'categoryMaster', label: 'Category Master', shortLabel: 'Cat. Master', required: false },
  { key: 'targets', label: 'Target File', shortLabel: 'Target', required: true },
  { key: 'currentPeriod', label: 'Current Period', shortLabel: 'Current', required: true },
  { key: 'lastMonth', label: 'Last Month', shortLabel: 'Last Mo.', required: false },
  { key: 'lastYear', label: 'Last Year (YoY)', shortLabel: 'Last Yr.', required: false },
];

export default function FileUploadBar() {
  const data = useData();
  const [expanded, setExpanded] = useState(!data.isMinimumLoaded);
  const [loading, setLoading] = useState<string | null>(null);
  const refs = {
    categoryMaster: useRef<HTMLInputElement>(null),
    targets: useRef<HTMLInputElement>(null),
    currentPeriod: useRef<HTMLInputElement>(null),
    lastMonth: useRef<HTMLInputElement>(null),
    lastYear: useRef<HTMLInputElement>(null),
  };

  const loadFunctions: Record<string, (file: File) => Promise<void>> = {
    categoryMaster: data.loadCategoryMaster,
    targets: data.loadTargets,
    currentPeriod: data.loadCurrentPeriod,
    lastMonth: data.loadLastMonth,
    lastYear: data.loadLastYear,
  };

  const handleFile = useCallback(async (key: string, file: File) => {
    setLoading(key);
    try {
      await loadFunctions[key](file);
      toast.success(`${file.name} loaded successfully`);
    } catch (err) {
      toast.error(`Failed to load file`);
      console.error(err);
    } finally {
      setLoading(null);
    }
  }, [loadFunctions]);

  const loadedCount = Object.values(data.isLoaded).filter(Boolean).length;
  const totalCount = FILE_SLOTS.length;

  return (
    <div className="border-b border-gray-100/80 bg-white/60 backdrop-blur-sm">
      <div className="container">
        {/* Compact bar */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-600">Data Files</span>
            </div>
            
            {/* Status pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {FILE_SLOTS.map(slot => (
                <div
                  key={slot.key}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-300
                    ${data.isLoaded[slot.key]
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : slot.required
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-gray-50 text-gray-400 border border-gray-100'
                    }
                  `}
                >
                  {data.isLoaded[slot.key] ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : slot.required ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : null}
                  {slot.shortLabel}
                </div>
              ))}
            </div>

            <span className="text-[10px] text-gray-400 tabular-nums sm:hidden">
              {loadedCount}/{totalCount} loaded
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 rounded-lg border border-gray-200 hover:border-emerald-200 transition-all duration-200"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expanded upload area */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pb-4">
                {FILE_SLOTS.map(slot => (
                  <div key={slot.key}>
                    <input
                      ref={refs[slot.key]}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(slot.key, file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => refs[slot.key].current?.click()}
                      disabled={loading === slot.key}
                      className={`
                        w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed
                        transition-all duration-200 group
                        ${data.isLoaded[slot.key]
                          ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                          : loading === slot.key
                            ? 'border-blue-200 bg-blue-50/50'
                            : 'border-gray-200 bg-gray-50/30 hover:border-emerald-300 hover:bg-emerald-50/30'
                        }
                      `}
                    >
                      {loading === slot.key ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : data.isLoaded[slot.key] ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      )}
                      <div className="text-center">
                        <p className="text-xs font-semibold text-gray-700">{slot.label}</p>
                        {slot.required && !data.isLoaded[slot.key] && (
                          <p className="text-[9px] text-amber-500 font-medium mt-0.5">Required</p>
                        )}
                        {data.isLoaded[slot.key] && data.fileNames[slot.key] && (
                          <p className="text-[9px] text-emerald-600 mt-0.5 truncate max-w-[120px]">
                            {data.fileNames[slot.key]}
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
