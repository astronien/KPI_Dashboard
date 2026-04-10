import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CategoryMapping,
  TargetRow,
  SalesRow,
  parseExcelFile,
  parseCategoryMaster,
  parseTargets,
  parseSalesData,
} from '@/lib/dataProcessor';

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
  isAllLoaded: boolean;
  isMinimumLoaded: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
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
        isAllLoaded,
        isMinimumLoaded,
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
