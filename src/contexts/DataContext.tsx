import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CategoryMapping,
  TargetRow,
  SalesRow,
  parseExcelFile,
  parseCategoryMaster,
  parseTargets,
  parseSalesData,
  processBatchFiles,
} from '@/lib/dataProcessor';

/* ─── IndexedDB Persistence ───────────────────────── */
const DB_NAME = 'studio7_dashboard';
const DB_VERSION = 1;
const STORE_NAME = 'data_store';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIDB(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Failed to save to IndexedDB:', e);
  }
}

async function loadFromIDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Failed to load from IndexedDB:', e);
    return null;
  }
}

async function clearIDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Failed to clear IndexedDB:', e);
  }
}

/* ─── Types ────────────────────────────────────────── */
interface DataState {
  categoryMaster: CategoryMapping[];
  targets: TargetRow[];
  currentPeriod: SalesRow[];
  lastMonth: SalesRow[];
  lastYear: SalesRow[];
  isLoaded: {
    categoryMaster: boolean;
    targets: boolean;
    currentPeriod: boolean;
    lastMonth: boolean;
    lastYear: boolean;
  };
  fileNames: {
    categoryMaster: string;
    targets: string;
    currentPeriod: string;
    lastMonth: string;
    lastYear: string;
  };
}

interface DataContextType extends DataState {
  loadCategoryMaster: (file: File) => Promise<void>;
  loadTargets: (file: File) => Promise<void>;
  loadCurrentPeriod: (file: File) => Promise<void>;
  loadLastMonth: (file: File) => Promise<void>;
  loadLastYear: (file: File) => Promise<void>;
  loadMultipleFiles: (files: File[]) => Promise<string[]>;
  addManualSale: (sale: Partial<SalesRow>) => void;
  clearAllData: () => void;
  isAllLoaded: boolean;
  isMinimumLoaded: boolean;
  isRestoringData: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

/* ─── Persistence helpers ──────────────────────────── */
const PERSIST_KEYS = ['categoryMaster', 'targets', 'currentPeriod', 'lastMonth', 'lastYear'] as const;

async function persistState(state: DataState) {
  // Persist each dataset and the metadata separately
  for (const key of PERSIST_KEYS) {
    if (state.isLoaded[key]) {
      await saveToIDB(`data_${key}`, state[key]);
      await saveToIDB(`fileName_${key}`, state.fileNames[key]);
    }
  }
  await saveToIDB('isLoaded', state.isLoaded);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isRestoringData, setIsRestoringData] = useState(true);
  const [state, setState] = useState<DataState>({
    categoryMaster: [],
    targets: [],
    currentPeriod: [],
    lastMonth: [],
    lastYear: [],
    isLoaded: {
      categoryMaster: false,
      targets: false,
      currentPeriod: false,
      lastMonth: false,
      lastYear: false,
    },
    fileNames: {
      categoryMaster: '',
      targets: '',
      currentPeriod: '',
      lastMonth: '',
      lastYear: '',
    },
  });

  // Restore data from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const savedLoaded = await loadFromIDB<DataState['isLoaded']>('isLoaded');
        if (!savedLoaded) {
          setIsRestoringData(false);
          return;
        }

        const newState: Partial<DataState> = {
          isLoaded: { ...savedLoaded },
          fileNames: { categoryMaster: '', targets: '', currentPeriod: '', lastMonth: '', lastYear: '' },
        };

        for (const key of PERSIST_KEYS) {
          if (savedLoaded[key]) {
            const data = await loadFromIDB<any>(`data_${key}`);
            const fileName = await loadFromIDB<string>(`fileName_${key}`);
            if (data) {
              (newState as any)[key] = data;
              newState.fileNames![key] = fileName || '(restored)';
            } else {
              newState.isLoaded![key] = false;
            }
          }
        }

        setState(prev => ({
          ...prev,
          ...newState,
          categoryMaster: newState.categoryMaster ?? prev.categoryMaster,
          targets: newState.targets ?? prev.targets,
          currentPeriod: newState.currentPeriod ?? prev.currentPeriod,
          lastMonth: newState.lastMonth ?? prev.lastMonth,
          lastYear: newState.lastYear ?? prev.lastYear,
          isLoaded: newState.isLoaded!,
          fileNames: newState.fileNames!,
        }));
      } catch (e) {
        console.warn('Failed to restore data from IndexedDB:', e);
      } finally {
        setIsRestoringData(false);
      }
    })();
  }, []);

  // Persist data whenever state changes (debounced)
  useEffect(() => {
    if (isRestoringData) return;
    const timeout = setTimeout(() => persistState(state), 500);
    return () => clearTimeout(timeout);
  }, [state, isRestoringData]);

  const loadCategoryMaster = useCallback(async (file: File) => {
    const data = await parseExcelFile(file);
    const parsed = parseCategoryMaster(data);
    setState(prev => ({
      ...prev,
      categoryMaster: parsed,
      isLoaded: { ...prev.isLoaded, categoryMaster: true },
      fileNames: { ...prev.fileNames, categoryMaster: file.name },
    }));
  }, []);

  const loadTargets = useCallback(async (file: File) => {
    const data = await parseExcelFile(file);
    const parsed = parseTargets(data);
    setState(prev => ({
      ...prev,
      targets: parsed,
      isLoaded: { ...prev.isLoaded, targets: true },
      fileNames: { ...prev.fileNames, targets: file.name },
    }));
  }, []);

  const loadCurrentPeriod = useCallback(async (file: File) => {
    const data = await parseExcelFile(file);
    const parsed = parseSalesData(data);
    setState(prev => ({
      ...prev,
      currentPeriod: parsed,
      isLoaded: { ...prev.isLoaded, currentPeriod: true },
      fileNames: { ...prev.fileNames, currentPeriod: file.name },
    }));
  }, []);

  const loadLastMonth = useCallback(async (file: File) => {
    const data = await parseExcelFile(file);
    const parsed = parseSalesData(data);
    setState(prev => ({
      ...prev,
      lastMonth: parsed,
      isLoaded: { ...prev.isLoaded, lastMonth: true },
      fileNames: { ...prev.fileNames, lastMonth: file.name },
    }));
  }, []);

  const loadLastYear = useCallback(async (file: File) => {
    const data = await parseExcelFile(file);
    const parsed = parseSalesData(data);
    setState(prev => ({
      ...prev,
      lastYear: parsed,
      isLoaded: { ...prev.isLoaded, lastYear: true },
      fileNames: { ...prev.fileNames, lastYear: file.name },
    }));
  }, []);

  const loadMultipleFiles = useCallback(async (files: File[]) => {
    const res = await processBatchFiles(files);
    setState(prev => {
      const newState = { ...prev, isLoaded: { ...prev.isLoaded }, fileNames: { ...prev.fileNames } };
      
      if (res.categoryMaster) {
        newState.categoryMaster = res.categoryMaster.data;
        newState.isLoaded.categoryMaster = true;
        newState.fileNames.categoryMaster = res.categoryMaster.name;
      }
      if (res.targets) {
        newState.targets = res.targets.data;
        newState.isLoaded.targets = true;
        newState.fileNames.targets = res.targets.name;
      }
      if (res.currentPeriod) {
        newState.currentPeriod = res.currentPeriod.data;
        newState.isLoaded.currentPeriod = true;
        newState.fileNames.currentPeriod = res.currentPeriod.name;
      }
      if (res.lastMonth) {
        newState.lastMonth = res.lastMonth.data;
        newState.isLoaded.lastMonth = true;
        newState.fileNames.lastMonth = res.lastMonth.name;
      }
      if (res.lastYear) {
        newState.lastYear = res.lastYear.data;
        newState.isLoaded.lastYear = true;
        newState.fileNames.lastYear = res.lastYear.name;
      }
      
      return newState;
    });

    return res.errors;
  }, []);

  const addManualSale = useCallback((sale: Partial<SalesRow>) => {
    setState(prev => {
      const now = new Date();
      // create a mock row
      const newRow: SalesRow = {
        productCode: sale.productCode || 'MANUAL-001',
        productName: sale.productName || 'Manual Entry',
        number: sale.number || 1,
        totalPrice: sale.totalPrice || 0,
        categoryId: sale.categoryId || 0,
        categoryName: sale.categoryName || 'Unknown',
        subCategory: sale.subCategory || 'Unknown',
        brand: sale.brand || 'Apple',
        model: sale.model || '-',
        branchId: sale.branchId || 0,
        branchName: sale.branchName || 'MANUAL BRANCH',
        docNo: sale.docNo || now.getTime(),
        docDate: sale.docDate || now.toISOString().split('T')[0],
        officerId: sale.officerId || 0,
        officerName: sale.officerName || 'Staff',
      };
      
      return {
        ...prev,
        currentPeriod: [...prev.currentPeriod, newRow]
      };
    });
  }, []);

  const clearAllData = useCallback(async () => {
    await clearIDB();
    setState({
      categoryMaster: [],
      targets: [],
      currentPeriod: [],
      lastMonth: [],
      lastYear: [],
      isLoaded: {
        categoryMaster: false,
        targets: false,
        currentPeriod: false,
        lastMonth: false,
        lastYear: false,
      },
      fileNames: {
        categoryMaster: '',
        targets: '',
        currentPeriod: '',
        lastMonth: '',
        lastYear: '',
      },
    });
  }, []);

  const isAllLoaded = Object.values(state.isLoaded).every(Boolean);
  const isMinimumLoaded = state.isLoaded.targets && state.isLoaded.currentPeriod;

  return (
    <DataContext.Provider
      value={{
        ...state,
        loadCategoryMaster,
        loadTargets,
        loadCurrentPeriod,
        loadLastMonth,
        loadLastYear,
        loadMultipleFiles,
        addManualSale,
        clearAllData,
        isAllLoaded,
        isMinimumLoaded,
        isRestoringData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
