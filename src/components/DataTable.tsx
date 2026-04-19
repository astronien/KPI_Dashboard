/*
 * Design: Crystal Report — Swiss Precision
 * Clean table with sticky headers, alternating rows, and color-coded values.
 * Forest green header, subtle hover states. Dark mode supported.
 * Optional search bar for filtering rows.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: any) => React.ReactNode;
  width?: string;
  bgColorClass?: string;
  borderLeft?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  icon?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  searchable?: boolean;
  searchKeys?: string[];
}

function defaultFormat(value: any): React.ReactNode {
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  return String(value ?? '-');
}

export function formatPercent(value: number): React.ReactNode {
  const formatted = value.toFixed(1) + '%';
  if (value >= 100) return <span className="text-rose-600 font-semibold">{formatted}</span>;
  if (value >= 80) return <span className="text-amber-600 font-semibold">{formatted}</span>;
  return <span className="text-rose-600 font-semibold">{formatted}</span>;
}

export function formatDelta(value: number): React.ReactNode {
  const formatted = (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
  if (value > 0) return <span className="text-rose-600">{formatted}</span>;
  if (value < 0) return <span className="text-rose-600">{formatted}</span>;
  return <span className="text-gray-400">{formatted}</span>;
}

export function formatMoney(value: number): React.ReactNode {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatDiff(value: number): React.ReactNode {
  const formatted = formatMoney(value);
  if (value > 0) return <span className="text-rose-600">+{formatted}</span>;
  if (value < 0) return <span className="text-rose-600">{formatted}</span>;
  return <span className="text-gray-400">{formatted}</span>;
}

export default function DataTable({ columns, data, title, icon, emptyMessage, onRowClick, searchable, searchKeys }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = searchable && searchTerm.trim()
    ? data.filter(row => {
        const keys = searchKeys || [columns[0]?.key];
        const term = searchTerm.toLowerCase();
        return keys.some(k => String(row[k] ?? '').toLowerCase().includes(term));
      })
    : data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
    >
      {(title || searchable) && (
        <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {icon && <span className="text-rose-600 dark:text-rose-400">{icon}</span>}
            {title && <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h3>}
          </div>
          {searchable && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none w-40 sm:w-56 transition-all"
              />
              {searchTerm && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                  {filteredData.length}/{data.length}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-rose-800 dark:bg-rose-900 text-white">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`
                    px-3 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${col.borderLeft ? 'border-l-2 border-rose-900/40' : ''}
                  `}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                  {searchTerm ? `No results for "${searchTerm}"` : (emptyMessage || 'No data available. Please upload the required files.')}
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    border-b border-gray-50 dark:border-gray-800/50 transition-colors duration-150
                    ${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'}
                    hover:bg-rose-50/30 dark:hover:bg-rose-950/30
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`
                        px-3 py-2.5 whitespace-nowrap tabular-nums dark:text-gray-200
                        ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                        ${col.bgColorClass || ''}
                        ${col.borderLeft ? 'border-l-2 border-gray-200 dark:border-gray-700' : ''}
                      `}
                    >
                      {col.format ? col.format(row[col.key], row) : defaultFormat(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
