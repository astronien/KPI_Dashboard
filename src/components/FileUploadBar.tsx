/*
 * Design: Crystal Report — Swiss Precision
 * Unified Smart Upload Bar for multiple files via Drag & Drop.
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
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              <div 
                className={`
                  relative border-2 border-dashed rounded-[32px] p-8 text-center transition-all duration-200
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

                <div className="flex flex-col items-center justify-center gap-3">
                  {loading ? (
                    <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                      <UploadCloud className="w-6 h-6 text-rose-600" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                      {loading ? "Analyzing and Sorting Files..." : "Drag & Drop Multiple Data Files Here"}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                      {loading 
                        ? "The system is reading data to map Target, Sales, and Category Master exactly where they belong." 
                        : "You can upload all 5 files at once! The system automatically detects Targets, Category Master, and sorts Sales files by month."}
                    </p>
                  </div>

                  {!loading && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 px-5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg hover:border-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all shadow-sm"
                    >
                      Browse Files
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
