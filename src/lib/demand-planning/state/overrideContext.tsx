"use client";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { mockOverrideLog, OverrideLogEntry, DemandRecord, ExceptionStatus } from "../data/mockData";

interface OverrideContextValue {
  overrides: OverrideLogEntry[];
  exceptionStatusOverrides: Record<string, ExceptionStatus>;
  addOverride: (entry: Omit<OverrideLogEntry, "override_id" | "date">) => void;
  setExceptionStatus: (record: DemandRecord, newStatus: ExceptionStatus, reason: string) => void;
  resetSession: () => void;
}

const OverrideContext = createContext<OverrideContextValue | undefined>(undefined);

function makeKey(r: DemandRecord) {
  return `${r.sku_id}|${r.depot_id}|${r.account_id}|${r.period}`;
}

export function OverrideProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<OverrideLogEntry[]>(mockOverrideLog);
  const [exceptionStatusOverrides, setExceptionStatusOverrides] = useState<Record<string, ExceptionStatus>>({});

  const addOverride = useCallback((entry: Omit<OverrideLogEntry, "override_id" | "date">) => {
    setOverrides((prev) => [
      ...prev,
      {
        ...entry,
        override_id: `OV${String(prev.length + 1).padStart(4, "0")}`,
        date: new Date().toISOString().slice(0, 10),
      },
    ]);
  }, []);

  const setExceptionStatus = useCallback((record: DemandRecord, newStatus: ExceptionStatus, reason: string) => {
    const key = makeKey(record);
    setExceptionStatusOverrides((prev) => ({ ...prev, [key]: newStatus }));
    setOverrides((prev) => [
      ...prev,
      {
        override_id: `OV${String(prev.length + 1).padStart(4, "0")}`,
        date: new Date().toISOString().slice(0, 10),
        sku_id: record.sku_id,
        sku_name: record.sku_name,
        depot_name: record.depot_name,
        account_name: record.account_name,
        root_cause_tag: record.root_cause_tag,
        field_overridden: "exception_status",
        old_value: record.exception_status,
        new_value: newStatus,
        reason,
        outcome_validated: null,
      },
    ]);
  }, []);

  const resetSession = useCallback(() => {
    setOverrides(mockOverrideLog);
    setExceptionStatusOverrides({});
  }, []);

  return (
    <OverrideContext.Provider value={{ overrides, exceptionStatusOverrides, addOverride, setExceptionStatus, resetSession }}>
      {children}
    </OverrideContext.Provider>
  );
}

export function useOverrides() {
  const ctx = useContext(OverrideContext);
  if (!ctx) throw new Error("useOverrides must be used inside OverrideProvider");
  return ctx;
}

export function getEffectiveStatus(record: DemandRecord, overrides: Record<string, ExceptionStatus>): ExceptionStatus {
  return overrides[makeKey(record)] ?? record.exception_status;
}
