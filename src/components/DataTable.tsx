/*
 * Design: Crystal Report — Swiss Precision
 * Clean table with sticky headers, alternating rows, and color-coded values.
 * Forest green header, subtle hover states.
 */
import { motion } from 'framer-motion';

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
  if (value >= 100) return <span className="text-emerald-600 font-semibold">{formatted}</span>;
  if (value >= 80) return <span className="text-amber-600 font-semibold">{formatted}</span>;
  return <span className="text-rose-600 font-semibold">{formatted}</span>;
}

export function formatDelta(value: number): React.ReactNode {
  const formatted = (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
  if (value > 0) return <span className="text-emerald-600">{formatted}</span>;
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
  if (value > 0) return <span className="text-emerald-600">+{formatted}</span>;
  if (value < 0) return <span className="text-rose-600">{formatted}</span>;
  return <span className="text-gray-400">{formatted}</span>;
}

export default function DataTable({ columns, data, title, icon, emptyMessage, onRowClick }: DataTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {title && (
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          {icon && <span className="text-emerald-600">{icon}</span>}
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-emerald-800 text-white">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`
                    px-3 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${col.borderLeft ? 'border-l-2 border-emerald-900/40' : ''}
                  `}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400 text-sm">
                  {emptyMessage || 'No data available. Please upload the required files.'}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    border-b border-gray-50 transition-colors duration-150
                    ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    hover:bg-emerald-50/30
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`
                        px-3 py-2.5 whitespace-nowrap tabular-nums
                        ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                        ${col.bgColorClass || ''}
                        ${col.borderLeft ? 'border-l-2 border-gray-200' : ''}
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
