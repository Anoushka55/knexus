"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { mockDemandData, DemandRecord } from "../data/mockData";

interface DataContextValue {
  activeDataset: DemandRecord[];
  dataSource: "mock" | "uploaded";
  uploadedFileName: string | null;
  setUploadedData: (records: DemandRecord[], fileName: string) => void;
  resetToMockData: () => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [activeDataset, setActiveDataset] = useState<DemandRecord[]>(mockDemandData);
  const [dataSource, setDataSource] = useState<"mock" | "uploaded">("mock");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const setUploadedData = (records: DemandRecord[], fileName: string) => {
    setActiveDataset(records);
    setDataSource("uploaded");
    setUploadedFileName(fileName);
  };

  const resetToMockData = () => {
    setActiveDataset(mockDemandData);
    setDataSource("mock");
    setUploadedFileName(null);
  };

  return (
    <DataContext.Provider value={{ activeDataset, dataSource, uploadedFileName, setUploadedData, resetToMockData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDataContext must be used inside DataProvider");
  return ctx;
}
