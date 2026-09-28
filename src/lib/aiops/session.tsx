"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ScenarioId } from "./types";
import { scenarios } from "./index";

/**
 * Live Operations Simulation.
 *
 * A single monotonic clock drives the whole application. `shift` counts
 * minutes advanced since the page loaded; every derived value in the data
 * layer is a pure function of it, so the same operational story plays out
 * identically on every run. There is no backend, socket or timer-driven
 * randomness involved.
 */

/** Real seconds per simulated minute. */
const TICK_MS = 4000;
/** Simulation stops here so the demo cannot walk past the scripted story. */
const MAX_SHIFT = 24;

export type ScenarioFocus = ScenarioId | "all";

interface SessionValue {
  shift: number;
  live: boolean;
  setLive: (v: boolean) => void;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  scenario: ScenarioFocus;
  setScenario: (v: ScenarioFocus) => void;
  reset: () => void;
  /** True when a scenario filter should narrow a list. */
  inFocus: (scenarioId?: ScenarioId) => boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [shift, setShift] = useState(0);
  const [live, setLive] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [scenario, setScenario] = useState<ScenarioFocus>("all");

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      setShift((s) => (s >= MAX_SHIFT ? s : s + 1));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [live]);

  const reset = useCallback(() => setShift(0), []);

  const inFocus = useCallback(
    (scenarioId?: ScenarioId) => scenario === "all" || scenarioId === scenario,
    [scenario],
  );

  const value = useMemo<SessionValue>(
    () => ({ shift, live, setLive, demoMode, setDemoMode, scenario, setScenario, reset, inFocus }),
    [shift, live, demoMode, scenario, reset, inFocus],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return ctx;
}

/** The scenario currently in focus, or null when the full estate is shown. */
export function useFocusedScenario() {
  const { scenario } = useSession();
  return scenario === "all" ? null : (scenarios.find((s) => s.id === scenario) ?? null);
}

/**
 * Wall-clock label for a point in the simulated timeline.
 * `minutesAgo` is measured from the current simulated moment.
 */
export function useClock() {
  const { shift } = useSession();
  // Anchored once per mount so labels advance with the simulation only.
  const [base] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.getTime();
  });

  return useCallback(
    (minutesAgo: number) => {
      const t = new Date(base + shift * 60000 - minutesAgo * 60000);
      return t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    },
    [base, shift],
  );
}

/** "12m ago" style relative labels. */
export function relative(minutesAgo: number) {
  if (minutesAgo < 1) return "just now";
  if (minutesAgo < 60) return `${Math.round(minutesAgo)}m ago`;
  const h = Math.floor(minutesAgo / 60);
  const m = Math.round(minutesAgo % 60);
  return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`;
}

/** "in 42m" style forward labels. */
export function forward(minutes: number) {
  if (minutes < 60) return `in ${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `in ${h}h` : `in ${h}h ${m}m`;
}
