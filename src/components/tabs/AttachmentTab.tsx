/*
 * Design: Crystal Report — Swiss Precision
 * iPhone Attachment Rate - comparison of iPhone sales against other product categories.
 */
import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import DataTable, { formatMoney } from '@/components/DataTable';
import { Link2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#059669', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#ec4899'];

export default function AttachmentTab() {
  const data = useData();

  const attachmentData = useMemo(() => {
    if (!data.isLoaded.currentPeriod) return [];

    // Get iPhone transactions (by doc no)
    const iphoneDocs = new Set(
      data.currentPeriod
        .filter(s => s.categoryName === 'iPhone')
        .map(s => s.docNo)
    );

    // Find all items sold in the same transactions as iPhones
    const attachedItems = data.currentPeriod.filter(
      s => iphoneDocs.has(s.docNo) && s.categoryName !== 'iPhone'
    );

    // Group by category
    const catMap = new Map<string, { category: string; units: number; revenue: number; transactions: number }>();
    
    attachedItems.forEach(s => {
      const key = s.categoryName;
      if (!catMap.has(key)) {
        catMap.set(key, { category: key, units: 0, revenue: 0, transactions: 0 });
      }
      const row = catMap.get(key)!;
      row.units += s.number;
      row.revenue += s.totalPrice;
      row.transactions++;
    });

    const totalIPhoneTransactions = iphoneDocs.size;
    
    return Array.from(catMap.values())
      .map(row => ({
        ...row,
        attachRate: totalIPhoneTransactions > 0 ? (row.transactions / totalIPhoneTransactions) * 100 : 0,
        avgPerTransaction: row.transactions > 0 ? row.revenue / row.transactions : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data.currentPeriod, data.isLoaded.currentPeriod]);

  const iphoneCount = useMemo(() => {
    return data.currentPeriod.filter(s => s.categoryName === 'iPhone').reduce((sum, s) => sum + s.number, 0);
  }, [data.currentPeriod]);

  const chartData = useMemo(() => {
    return attachmentData.slice(0, 8).map(d => ({
      name: d.category,
      value: d.revenue,
    }));
  }, [attachmentData]);

  const columns = [
    { key: 'category', label: 'Category', align: 'left' as const, format: (v: string) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'units', label: 'Units', align: 'right' as const, format: (v: number) => v.toLocaleString() },
    { key: 'revenue', label: 'Revenue', align: 'right' as const, format: (v: number) => <span className="font-semibold">{formatMoney(v)}</span> },
    { key: 'transactions', label: 'Transactions', align: 'right' as const, format: (v: number) => v.toLocaleString() },
    { key: 'attachRate', label: 'Attach Rate', align: 'right' as const, format: (v: number) => {
      return (
        <span className={`font-semibold ${v >= 50 ? 'text-emerald-600' : v >= 25 ? 'text-amber-600' : 'text-gray-600'}`}>
          {v.toFixed(1)}%
        </span>
      );
    }},
    { key: 'avgPerTransaction', label: 'Avg/Transaction', align: 'right' as const, format: (v: number) => formatMoney(v) },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">iPhone Attachment Rate</h2>
        <p className="text-sm text-gray-500">
          Comparison of iPhone sales against other product categories. 
          {iphoneCount > 0 && <span className="ml-1 font-medium text-emerald-600">{iphoneCount} iPhones sold this period.</span>}
        </p>
      </div>

      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5"
        >
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Attachment Revenue Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                formatter={(value: number) => ['฿' + value.toLocaleString(), 'Revenue']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <DataTable
        title="Attachment Details"
        icon={<Link2 className="w-4 h-4" />}
        columns={columns}
        data={attachmentData}
        emptyMessage="Please upload Current Period sales data to view attachment rates."
      />
    </div>
  );
}
