import * as XLSX from 'xlsx';

// Types
export interface CategoryMapping {
  catSubCat: string;
  groupCategory: string;
}

export interface TargetRow {
  id: number;
  branchName: string;
  rsm: string;
  asm: string;
  staffId: number;
  name: string;
  surname: string;
  day: number;
  position: string;
  total: number;
  mac: number;
  ipad: number;
  iphone: number;
  appleWatch: number;
  btbApple: number;
  btb: number;
  desktop: number;
  diy: number;
  notebook: number;
  smartphone: number;
  tablet: number;
  sim: number;
}

export interface SalesRow {
  productCode: string;
  productName: string;
  number: number;
  totalPrice: number;
  categoryId: number;
  categoryName: string;
  subCategory: string;
  brand: string;
  model: string;
  branchId: number;
  branchName: string;
  docNo: number;
  docDate: string;
  officerId: number;
  officerName: string;
}

export interface ProcessedData {
  categoryMaster: CategoryMapping[];
  targets: TargetRow[];
  currentPeriod: SalesRow[];
  lastMonth: SalesRow[];
  lastYear: SalesRow[];
  branchName: string;
  totalDaysInMonth: number;
  currentDay: number;
}

export interface BranchSummary {
  branch: string;
  target: number;
  actual: number;
  achPercent: number;
  forecast: number;
  forecastPercent: number;
  lastMonth: number;
  momPercent: number;
  lastYear: number;
  yoyPercent: number;
  targetDay: number;
  actualDay: number;
  diffDay: number;
}

export interface CategorySummary {
  groupCategory: string;
  target: number;
  actual: number;
  achPercent: number;
  forecast: number;
  forecastPercent: number;
  lastMonth: number;
  momPercent: number;
  lastYear: number;
  yoyPercent: number;
  targetDay: number;
  actualDay: number;
  diffDay: number;
}

export interface OfficerSummary {
  branch: string;
  officerName: string;
  position: string;
  target: number;
  actual: number;
  achPercent: number;
  forecast: number;
  forecastPercent: number;
  lastMonth: number;
  momPercent: number;
  lastYear: number;
  yoyPercent: number;
  targetDay: number;
  actualDay: number;
  diffDay: number;
}

// Group category mapping from CAT Daily
const GROUP_CATEGORIES = ['iPhone', 'Mac', 'iPad', 'Apple Watch', 'BTB(Apple)', 'BTB', 'Smartphone', 'Desktop', 'DIY', 'Notebook', 'Tablet', 'SIM'];

function getGroupCategory(categoryName: string, subCategory: string, categoryMaster: CategoryMapping[]): string {
  const key = categoryName + subCategory;
  const mapping = categoryMaster.find(m => m.catSubCat === key);
  if (mapping) return mapping.groupCategory;
  
  // Fallback: try matching category name directly
  const catLower = categoryName.toLowerCase();
  if (catLower.includes('iphone')) return 'iPhone';
  if (catLower.includes('mac')) return 'Mac';
  if (catLower.includes('ipad')) return 'iPad';
  if (catLower.includes('apple watch')) return 'Apple Watch';
  if (catLower.includes('sim')) return 'SIM';
  
  return 'BTB';
}

export function parseExcelFile(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData as any[][]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function parseCategoryMaster(data: any[]): CategoryMapping[] {
  return data.map(row => ({
    catSubCat: String(row['Cat & Sub Cat'] || ''),
    groupCategory: String(row['CAT Daily'] || ''),
  }));
}

export function parseTargets(data: any[]): TargetRow[] {
  return data.map(row => ({
    id: Number(row['ID'] || 0),
    branchName: String(row['BRANCH NAME'] || ''),
    rsm: String(row['RSM'] || ''),
    asm: String(row['ASM'] || ''),
    staffId: Number(row['STAFF ID'] || 0),
    name: String(row['NAME'] || ''),
    surname: String(row['SURNAME'] || ''),
    day: Number(row['DAY'] || 30),
    position: String(row['POSISION'] || ''),
    total: Number(row['Total'] || 0),
    mac: Number(row['Mac'] || 0),
    ipad: Number(row['iPad'] || 0),
    iphone: Number(row['iPhone'] || 0),
    appleWatch: Number(row['Apple Watch'] || 0),
    btbApple: Number(row['BTB(Apple)'] || 0),
    btb: Number(row['BTB'] || 0),
    desktop: Number(row['Desktop'] || 0),
    diy: Number(row['DIY'] || 0),
    notebook: Number(row['Notebook'] || 0),
    smartphone: Number(row['Smartphone'] || 0),
    tablet: Number(row['Tablet'] || 0),
    sim: Number(row['SIM'] || 0),
  }));
}

export function parseSalesData(data: any[]): SalesRow[] {
  return data.map(row => ({
    productCode: String(row['Product (Code)'] || ''),
    productName: String(row['Product (Name)'] || ''),
    number: Number(row['Number'] || 0),
    totalPrice: Number(row['Total Price'] || 0),
    categoryId: Number(row['Category (ID)'] || 0),
    categoryName: String(row['Category (Name)'] || ''),
    subCategory: String(row['Sub Category'] || ''),
    brand: String(row['Brand'] || ''),
    model: String(row['Model'] || ''),
    branchId: Number(row['Branch (ID)'] || 0),
    branchName: String(row['Branch (Name)'] || ''),
    docNo: Number(row['Doc No'] || 0),
    docDate: String(row['Doc Date'] || ''),
    officerId: Number(row['Officer (ID)'] || 0),
    officerName: String(row['Officer (Name)'] || ''),
  }));
}

export function calculateBranchSummary(
  targets: TargetRow[],
  currentSales: SalesRow[],
  lastMonthSales: SalesRow[],
  lastYearSales: SalesRow[],
  categoryMaster: CategoryMapping[],
  filterCategory: string = 'All Category'
): BranchSummary[] {
  const branchNames = Array.from(new Set(targets.map(t => t.branchName)));
  const totalDays = targets[0]?.day || 30;
  const now = new Date();
  const currentDay = now.getDate();

  return branchNames.map(branch => {
    const branchTargets = targets.filter(t => t.branchName === branch);
    
    let target = 0;
    if (filterCategory === 'All Category') {
      target = branchTargets.reduce((sum, t) => sum + t.total, 0);
    } else {
      const catKey = filterCategory.toLowerCase().replace(' ', '');
      branchTargets.forEach(t => {
        if (filterCategory === 'iPhone') target += t.iphone;
        else if (filterCategory === 'Mac') target += t.mac;
        else if (filterCategory === 'iPad') target += t.ipad;
        else if (filterCategory === 'Apple Watch') target += t.appleWatch;
      });
    }

    let currentFiltered = currentSales.filter(s => s.branchName === branch);
    let lastMonthFiltered = lastMonthSales.filter(s => s.branchName === branch);
    let lastYearFiltered = lastYearSales.filter(s => s.branchName === branch);

    if (filterCategory !== 'All Category') {
      const filterFn = (s: SalesRow) => {
        const gc = getGroupCategory(s.categoryName, s.subCategory, categoryMaster);
        return gc === filterCategory;
      };
      currentFiltered = currentFiltered.filter(filterFn);
      lastMonthFiltered = lastMonthFiltered.filter(filterFn);
      lastYearFiltered = lastYearFiltered.filter(filterFn);
    }

    const actual = currentFiltered.reduce((sum, s) => sum + s.totalPrice, 0);
    const lastMonthTotal = lastMonthFiltered.reduce((sum, s) => sum + s.totalPrice, 0);
    const lastYearTotal = lastYearFiltered.reduce((sum, s) => sum + s.totalPrice, 0);

    const achPercent = target > 0 ? (actual / target) * 100 : 0;
    const forecast = currentDay > 0 ? (actual / currentDay) * totalDays : 0;
    const forecastPercent = target > 0 ? (forecast / target) * 100 : 0;
    const momPercent = lastMonthTotal > 0 ? ((actual - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const yoyPercent = lastYearTotal > 0 ? ((actual - lastYearTotal) / lastYearTotal) * 100 : 0;
    const targetDay = totalDays > 0 ? (target / totalDays) * currentDay : 0;
    const actualDay = actual;
    const diffDay = actualDay - targetDay;

    return {
      branch: branch.replace(/^ID\d+ : /, ''),
      target,
      actual,
      achPercent,
      forecast,
      forecastPercent,
      lastMonth: lastMonthTotal,
      momPercent,
      lastYear: lastYearTotal,
      yoyPercent,
      targetDay,
      actualDay,
      diffDay,
    };
  });
}

export function calculateCategorySummary(
  targets: TargetRow[],
  currentSales: SalesRow[],
  lastMonthSales: SalesRow[],
  lastYearSales: SalesRow[],
  categoryMaster: CategoryMapping[],
  filterPosition: string = 'All Positions'
): CategorySummary[] {
  const totalDays = targets[0]?.day || 30;
  const now = new Date();
  const currentDay = now.getDate();

  // Filter targets by position
  let filteredTargets = targets;
  if (filterPosition !== 'All Positions') {
    filteredTargets = targets.filter(t => t.position === filterPosition);
  }

  // Filter sales by officer if position filter is applied
  let filteredCurrent = currentSales;
  let filteredLastMonth = lastMonthSales;
  let filteredLastYear = lastYearSales;

  if (filterPosition !== 'All Positions') {
    const officerNames = filteredTargets.map(t => t.name);
    filteredCurrent = currentSales.filter(s => officerNames.includes(s.officerName));
    filteredLastMonth = lastMonthSales.filter(s => officerNames.includes(s.officerName));
    filteredLastYear = lastYearSales.filter(s => officerNames.includes(s.officerName));
  }

  const categories = [
    { name: 'iPhone', targetKey: 'iphone' as const },
    { name: 'Mac', targetKey: 'mac' as const },
    { name: 'iPad', targetKey: 'ipad' as const },
    { name: 'Apple Watch', targetKey: 'appleWatch' as const },
    { name: 'BTB(Apple)', targetKey: 'btbApple' as const },
    { name: 'BTB', targetKey: 'btb' as const },
    { name: 'Smartphone', targetKey: 'smartphone' as const },
    { name: 'Desktop', targetKey: 'desktop' as const },
    { name: 'DIY', targetKey: 'diy' as const },
    { name: 'Notebook', targetKey: 'notebook' as const },
    { name: 'Tablet', targetKey: 'tablet' as const },
    { name: 'SIM', targetKey: 'sim' as const },
  ];

  return categories.map(cat => {
    const target = filteredTargets.reduce((sum, t) => sum + (t[cat.targetKey] as number), 0);
    
    const filterFn = (s: SalesRow) => {
      const gc = getGroupCategory(s.categoryName, s.subCategory, categoryMaster);
      return gc === cat.name;
    };

    const actual = filteredCurrent.filter(filterFn).reduce((sum, s) => sum + s.totalPrice, 0);
    const lastMonthTotal = filteredLastMonth.filter(filterFn).reduce((sum, s) => sum + s.totalPrice, 0);
    const lastYearTotal = filteredLastYear.filter(filterFn).reduce((sum, s) => sum + s.totalPrice, 0);

    const achPercent = target > 0 ? (actual / target) * 100 : 0;
    const forecast = currentDay > 0 ? (actual / currentDay) * totalDays : 0;
    const forecastPercent = target > 0 ? (forecast / target) * 100 : 0;
    const momPercent = lastMonthTotal > 0 ? ((actual - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const yoyPercent = lastYearTotal > 0 ? ((actual - lastYearTotal) / lastYearTotal) * 100 : 0;
    const targetDay = totalDays > 0 ? (target / totalDays) * currentDay : 0;
    const diffDay = actual - targetDay;

    return {
      groupCategory: cat.name,
      target,
      actual,
      achPercent,
      forecast,
      forecastPercent,
      lastMonth: lastMonthTotal,
      momPercent,
      lastYear: lastYearTotal,
      yoyPercent,
      targetDay,
      actualDay: actual,
      diffDay,
    };
  }).filter(c => c.target > 0 || c.actual > 0);
}

export function calculateOfficerSummary(
  targets: TargetRow[],
  currentSales: SalesRow[],
  lastMonthSales: SalesRow[],
  lastYearSales: SalesRow[],
  categoryMaster: CategoryMapping[],
  filterCategory: string = 'All Category',
  filterPosition: string = 'All Positions'
): OfficerSummary[] {
  const totalDays = targets[0]?.day || 30;
  const now = new Date();
  const currentDay = now.getDate();

  let filteredTargets = targets;
  if (filterPosition !== 'All Positions') {
    filteredTargets = targets.filter(t => t.position === filterPosition);
  }

  return filteredTargets.map(t => {
    let target = 0;
    if (filterCategory === 'All Category') {
      target = t.total;
    } else if (filterCategory === 'iPhone') target = t.iphone;
    else if (filterCategory === 'Mac') target = t.mac;
    else if (filterCategory === 'iPad') target = t.ipad;
    else if (filterCategory === 'Apple Watch') target = t.appleWatch;

    let officerCurrent = currentSales.filter(s => s.officerName === t.name);
    let officerLastMonth = lastMonthSales.filter(s => s.officerName === t.name);
    let officerLastYear = lastYearSales.filter(s => s.officerName === t.name);

    if (filterCategory !== 'All Category') {
      const filterFn = (s: SalesRow) => {
        const gc = getGroupCategory(s.categoryName, s.subCategory, categoryMaster);
        return gc === filterCategory;
      };
      officerCurrent = officerCurrent.filter(filterFn);
      officerLastMonth = officerLastMonth.filter(filterFn);
      officerLastYear = officerLastYear.filter(filterFn);
    }

    const actual = officerCurrent.reduce((sum, s) => sum + s.totalPrice, 0);
    const lastMonthTotal = officerLastMonth.reduce((sum, s) => sum + s.totalPrice, 0);
    const lastYearTotal = officerLastYear.reduce((sum, s) => sum + s.totalPrice, 0);

    const achPercent = target > 0 ? (actual / target) * 100 : 0;
    const forecast = currentDay > 0 ? (actual / currentDay) * totalDays : 0;
    const forecastPercent = target > 0 ? (forecast / target) * 100 : 0;
    const momPercent = lastMonthTotal > 0 ? ((actual - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const yoyPercent = lastYearTotal > 0 ? ((actual - lastYearTotal) / lastYearTotal) * 100 : 0;
    const targetDay = totalDays > 0 ? (target / totalDays) * currentDay : 0;
    const diffDay = actual - targetDay;

    return {
      branch: t.branchName.replace(/^ID\d+ : /, ''),
      officerName: t.name,
      position: t.position,
      target,
      actual,
      achPercent,
      forecast,
      forecastPercent,
      lastMonth: lastMonthTotal,
      momPercent,
      lastYear: lastYearTotal,
      yoyPercent,
      targetDay,
      actualDay: actual,
      diffDay,
    };
  }).filter(o => o.target > 0 || o.actual > 0);
}

export function formatNumber(num: number, decimals: number = 0): string {
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

export function formatPercent(num: number): string {
  return num.toFixed(1) + '%';
}

export function formatCurrency(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return '฿' + (num / 1000000).toFixed(2) + 'M';
  }
  return '฿' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
