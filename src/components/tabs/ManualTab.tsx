/*
 * Design: Crystal Report — Swiss Precision
 * Manual tab describing how to use the dashboard and calculations.
 */
import { BookOpen, FileSpreadsheet, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ManualTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-rose-600" />
          คู่มือการใช้งาน (User Manual)
        </h2>
        <p className="text-sm text-gray-500">วิธีการอัปโหลดไฟล์ข้อมูลและคำอธิบายการคำนวณในระบบ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">ไฟล์ที่ต้องอัปโหลด</h3>
              <p className="text-xs text-gray-400">อัปโหลดไฟล์ Excel เพื่ออัปเดตข้อมูลแดชบอร์ด</p>
            </div>
          </div>
          
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 text-gray-500 font-medium text-xs shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-gray-800 block">Category Master</strong>
                ไฟล์ระบุหมวดหมู่สินค้าหลัก (เช่น iPhone, Mac, iPad)
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 text-gray-500 font-medium text-xs shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-gray-800 block">Target</strong>
                ไฟล์เป้าหมายยอดขายรายสาขา และรายบุคคล
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 text-gray-500 font-medium text-xs shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-gray-800 block">Current Period</strong>
                ยอดขายในเดือนปัจจุบัน (ยอดขายล่าสุด)
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 text-gray-500 font-medium text-xs shrink-0 mt-0.5">4</span>
              <div>
                <strong className="text-gray-800 block">Last Month</strong>
                ยอดขายเดือนที่แล้ว (เพื่อเทียบเดือนต่อเดือน MoM)
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 text-gray-500 font-medium text-xs shrink-0 mt-0.5">5</span>
              <div>
                <strong className="text-gray-800 block">Last Year</strong>
                ยอดขายปีที่แล้ว (เพื่อเทียบปีต่อปี YoY)
              </div>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">คำศัพท์ และ การประมวลผล</h3>
              <p className="text-xs text-gray-400">คำอธิบาย KPI บนแดชบอร์ด</p>
            </div>
          </div>
          
          <ul className="space-y-4 text-sm text-gray-600">
            <li>
              <strong className="text-gray-800 block mb-1">Ach. % (Achievement Percent)</strong>
              ยอดขายจริง หารด้วย เป้าหมายทั้งหมด (Actual / Target * 100)
            </li>
            <li className="pt-2 border-t border-gray-50">
              <strong className="text-gray-800 block mb-1">Forecast</strong>
              การพยากรณ์ยอดขายทั้งเดือน โดยนำ ยอดขายปัจจุบัน / วันที่ผ่านมา * จำนวนวันในเดือนนั้น
            </li>
            <li className="pt-2 border-t border-gray-50">
              <strong className="text-gray-800 block mb-1">%MoM / %YoY</strong>
              การเติบโตเทียบกับเดือนที่แล้ว หรือปีที่แล้ว ((ยอดปัจจุบัน - ยอดอดีต) / ยอดอดีต * 100)
            </li>
            <li className="pt-2 border-t border-gray-50">
              <strong className="text-gray-800 block mb-1">Pacing (Target Day / Actual Day)</strong>
              การติดตามยอดขายระหว่างเดือนรายวัน (Live Monitor) จะมีการคำนวณเป้าหมายที่ควรได้ ณ วันปัจจุบัน (Target / ว้นทั้งเดือน * วันที่ผ่านมา) และเทียบกับยอดขายจริง (Actual Day) ว่าทำได้เกิน (Ahead) หรือน้อยกว่าเป้า (Behind)
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
