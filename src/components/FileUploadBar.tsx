/*
 * Design: Crystal Report — Swiss Precision
 * Unified Smart Upload Bar for multiple files via Drag & Drop.
 * Now includes individual file slot buttons for manual assignment.
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
  UploadCloud,
  FolderUp,
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
  { key: 'currentPeriod', label: 'Current Period (ยอดขายเดือนนี้)', shortLabel: 'Current', required: true },
  { key: 'lastMonth', label: 'Last Month (เดือนก่อน)', shortLabel: 'Last Mo.', required: false },
  { key: 'lastYear', label: 'Last Year (ปีก่อน)', shortLabel: 'Last Yr.', required: false },
];

export default function FileUploadBar() {
  const data = useData();
  const [expanded, setExpanded] = useState(!data.isMinimumLoaded);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slotInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleMultipleFiles = useCallback(async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setLoading(true);
    try {
      const files = Array.from(filesList);
      const errors = await data.loadMultipleFiles(files);
      if (errors.length > 0) {
        toast.warning(`Loaded with some issues:\n${errors.join('\n')}`, { duration: 5000 });
      } else {
        toast.success(`Successfully processed ${files.length} file(s)`);
      }
      setTimeout(() => {
        if (data.isMinimumLoaded) setExpanded(false);
      }, 1000);
    } catch (e: any) {
       toast.error(`Error processing files: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [data]);

  const handleSingleFile = useCallback(async (slotKey: string, filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const file = filesList[0];
    setLoading(true);
    try {
      switch (slotKey) {
        case 'categoryMaster':
          await data.loadCategoryMaster(file);
          break;
        case 'targets':
          await data.loadTargets(file);
          break;
        case 'currentPeriod':
          await data.loadCurrentPeriod(file);
          break;
        case 'lastMonth':
          await data.loadLastMonth(file);
          break;
        case 'lastYear':
          await data.loadLastYear(file);
          break;
      }
      toast.success(`✅ "${file.name}" → ${FILE_SLOTS.find(s => s.key === slotKey)?.label}`);
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [data]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const loadedCount = Object.values(data.isLoaded).filter(Boolean).length;
  const totalCount = FILE_SLOTS.length;

  return (
    <div className="border-b border-gray-100/80 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
      <div className="container">
        {/* Compact bar */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Data Files</span>
            </div>
            
            {/* Status pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {FILE_SLOTS.map(slot => (
                <div
                  key={slot.key}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-300
                    ${data.isLoaded[slot.key]
                      ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
                      : slot.required
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700'
                    }
                  `}
                  title={data.fileNames[slot.key] ? `Loaded: ${data.fileNames[slot.key]}` : `Missing: ${slot.label}`}
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-rose-700 dark:hover:text-rose-400 bg-gray-50 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-200"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Base
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expanded Smart Upload Area */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden pb-4"
            >
              {/* Smart Drag & Drop Zone */}
              <div 
                className={`
                  relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 mb-4
                  ${dragActive ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/50' : 'border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 hover:bg-gray-50/80 dark:hover:bg-gray-800/80'}
                  ${loading ? 'opacity-50 pointer-events-none' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  multiple
                  className="hidden"
                  onChange={e => handleMultipleFiles(e.target.files)}
                />

                <div className="flex flex-col items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center border border-gray-100 dark:border-gray-700">
                      <UploadCloud className="w-5 h-5 text-rose-600" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                      {loading ? "Analyzing..." : "Smart Upload — Drag & Drop All Files"}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      ระบบจะตรวจจับอัตโนมัติ (Target, Category Master, Sales)
                    </p>
                  </div>

                  {!loading && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg hover:border-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all shadow-sm"
                    >
                      Browse Files
                    </button>
                  )}
                </div>
              </div>

              {/* Individual File Slots */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <FolderUp className="w-3.5 h-3.5" />
                    อัปโหลดรายไฟล์ — เลือกเองว่าไฟล์ไหนลงช่องไหน
                  </h4>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {FILE_SLOTS.map(slot => (
                    <div key={slot.key} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${data.isLoaded[slot.key] ? 'bg-emerald-500' : slot.required ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{slot.label}</p>
                          {data.isLoaded[slot.key] && data.fileNames[slot.key] && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                              ✓ {data.fileNames[slot.key]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <input
                          ref={el => { slotInputRefs.current[slot.key] = el; }}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={e => {
                            handleSingleFile(slot.key, e.target.files);
                            e.target.value = '';
                          }}
                        />
                        <button
                          onClick={() => slotInputRefs.current[slot.key]?.click()}
                          disabled={loading}
                          className={`
                            px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all
                            ${data.isLoaded[slot.key]
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {data.isLoaded[slot.key] ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
