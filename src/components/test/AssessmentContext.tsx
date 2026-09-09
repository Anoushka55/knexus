"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { p2p } from "@/data/finance/p2p";
import { assess, type AssessmentResult } from "@/lib/assessment/scoring";
import type { AssessmentInput, ExecutionMode } from "@/lib/assessment/types";

const STORAGE_KEY = "assess.input.v1";

const DEFAULT_INPUT: AssessmentInput = {
  processId: "procure-to-pay",
  sector: "Telecom",
  landscape: "oracle-hyperion",
  mix: {
    "po-backed": 40,
    "non-po": 20,
    "capex-project": 20,
    utilities: 10,
    "employee-claims": 7,
    intercompany: 3,
  },
  volumePerMonth: 42000,
  fteCount: 250,
  location: "Offshore GCC",
  costPerFteAnnual: 900000,
  adjusters: {
    exceptionRate: 0.22,
    firstTimeMatchRate: 0.68,
    creditNoteRate: 0.06,
  },
  overrides: {},
  remarks: "",
};

interface Ctx {
  input: AssessmentInput;
  setInput: (patch: Partial<AssessmentInput>) => void;
  setMode: (activityId: string, mode: ExecutionMode) => void;
  resetOverrides: () => void;
  reset: () => void;
  result: AssessmentResult;
  activityLog: LogEntry[];
}

export interface LogEntry {
  id: string;
  ts: number;
  label: string;
  detail?: string;
}

const AssessCtx = createContext<Ctx | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [input, setInputState] = useState<AssessmentInput>(DEFAULT_INPUT);
  const [activityLog, setActivityLog] = useState<LogEntry[]>([
    { id: "init", ts: Date.now(), label: "Assessment session started" },
  ]);

  // Hydrate after mount so server and client markup match on first paint.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInputState({ ...DEFAULT_INPUT, ...JSON.parse(raw) });
    } catch {
      /* first run, or storage blocked — defaults are fine */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch {
      /* storage blocked — the session still works, it just will not persist */
    }
  }, [input]);

  function log(label: string, detail?: string) {
    setActivityLog((entries) =>
      [{ id: `${Date.now()}-${Math.random()}`, ts: Date.now(), label, detail }, ...entries].slice(0, 60)
    );
  }

  function setInput(patch: Partial<AssessmentInput>) {
    setInputState((prev) => ({ ...prev, ...patch }));
  }

  function setMode(activityId: string, mode: ExecutionMode) {
    const activity = p2p.activities.find((a) => a.id === activityId);
    setInputState((prev) => ({
      ...prev,
      overrides: { ...prev.overrides, [activityId]: mode },
    }));
    if (activity) log(`${activity.label} → ${mode}`, "Client correction");
  }

  function resetOverrides() {
    setInputState((prev) => ({ ...prev, overrides: {} }));
    log("Reset to KPMG benchmark");
  }

  function reset() {
    setInputState(DEFAULT_INPUT);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
    log("Assessment reset");
  }

  const result = useMemo(() => assess(p2p, input), [input]);

  return (
    <AssessCtx.Provider value={{ input, setInput, setMode, resetOverrides, reset, result, activityLog }}>
      {children}
    </AssessCtx.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessCtx);
  if (!ctx) throw new Error("useAssessment must be used inside AssessmentProvider");
  return ctx;
}
