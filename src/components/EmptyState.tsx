/*
 * Design: Crystal Report — Swiss Precision
 * Empty state with generated illustration and upload prompt.
 */
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

const EMPTY_IMAGE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663113035049/QEeU9YZXUQKMMUHwtjvw9N/empty-state-ZhFAzaeiQrQQcPsYZvzqXT.webp';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-8"
    >
      <img src={EMPTY_IMAGE} alt="Upload data" className="w-40 h-40 mb-6 opacity-60" />
      <h3 className="text-xl font-bold text-gray-700 mb-2">Upload Your Data Files</h3>
      <p className="text-sm text-gray-400 text-center max-w-md mb-6">
        Start by uploading your Excel files using the buttons above. Upload at least the <strong>Target File</strong> and <strong>Current Period</strong> to see the dashboard.
      </p>
      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
        <Upload className="w-4 h-4" />
        Click the upload buttons in the top bar
      </div>
    </motion.div>
  );
}
