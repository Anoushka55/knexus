"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  Assessment,
  BusinessPhaseData,
  ChatMessage,
  Duplication,
  FinancialPhaseData,
  OrgPhaseData,
  TechnicalPhaseData,
  Tool,
  WizardData,
} from "./types";

/**
 * Client-held session state for the Portfolio Rationalization console.
 * The ported backend is stateless (same as the original FastAPI app: "All
 * state is managed by the client/browser"), so every screen reads and writes
 * this single context, persisted to localStorage for convenience across
 * reloads within the same browser.
 */

const STORAGE_KEY = "portfolio-rationalization:session:v1";

const defaultOrg: OrgPhaseData = { organisation: "", industry: "telecom", size: "", businessUnits: "", geography: "" };
const defaultBusiness: BusinessPhaseData = { compliance: [], priorities: [], focus: "", challenges: "" };
const defaultTechnical: TechnicalPhaseData = { cloudStrategy: "", provider: "", timeline: "", slaRequirement: "", painPoints: "" };
const defaultFinancial: FinancialPhaseData = { budget: "", savingsTarget: "", priority: "", disruptionTolerance: "" };

interface PersistedState {
  tools: Tool[];
  duplications: Duplication[];
  painPoints: string[];
  detectedBudget: number | null;
  assessment: Assessment | null;
  wizard: WizardData;
  phase: number;
  chatHistory: ChatMessage[];
}

const defaultState: PersistedState = {
  tools: [],
  duplications: [],
  painPoints: [],
  detectedBudget: null,
  assessment: null,
  wizard: { org: defaultOrg, business: defaultBusiness, technical: defaultTechnical, financial: defaultFinancial },
  phase: 1,
  chatHistory: [],
};

interface SessionValue extends PersistedState {
  setTools: (tools: Tool[]) => void;
  setDuplications: (d: Duplication[]) => void;
  setPainPoints: (p: string[]) => void;
  setDetectedBudget: (b: number | null) => void;
  setAssessment: (a: Assessment | null) => void;
  setPhase: (p: number) => void;
  updateOrg: (patch: Partial<OrgPhaseData>) => void;
  updateBusiness: (patch: Partial<BusinessPhaseData>) => void;
  updateTechnical: (patch: Partial<TechnicalPhaseData>) => void;
  updateFinancial: (patch: Partial<FinancialPhaseData>) => void;
  addChatMessage: (m: ChatMessage) => void;
  clearChat: () => void;
  ingestTools: (tools: Tool[], duplications: Duplication[], painPoints: string[], detectedBudget: number | null) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch {
      // ignore — private browsing / blocked storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, hydrated]);

  const setTools = useCallback((tools: Tool[]) => setState((s) => ({ ...s, tools })), []);
  const setDuplications = useCallback((duplications: Duplication[]) => setState((s) => ({ ...s, duplications })), []);
  const setPainPoints = useCallback((painPoints: string[]) => setState((s) => ({ ...s, painPoints })), []);
  const setDetectedBudget = useCallback((detectedBudget: number | null) => setState((s) => ({ ...s, detectedBudget })), []);
  const setAssessment = useCallback((assessment: Assessment | null) => setState((s) => ({ ...s, assessment })), []);
  const setPhase = useCallback((phase: number) => setState((s) => ({ ...s, phase })), []);

  const updateOrg = useCallback(
    (patch: Partial<OrgPhaseData>) => setState((s) => ({ ...s, wizard: { ...s.wizard, org: { ...s.wizard.org, ...patch } } })),
    [],
  );
  const updateBusiness = useCallback(
    (patch: Partial<BusinessPhaseData>) =>
      setState((s) => ({ ...s, wizard: { ...s.wizard, business: { ...s.wizard.business, ...patch } } })),
    [],
  );
  const updateTechnical = useCallback(
    (patch: Partial<TechnicalPhaseData>) =>
      setState((s) => ({ ...s, wizard: { ...s.wizard, technical: { ...s.wizard.technical, ...patch } } })),
    [],
  );
  const updateFinancial = useCallback(
    (patch: Partial<FinancialPhaseData>) =>
      setState((s) => ({ ...s, wizard: { ...s.wizard, financial: { ...s.wizard.financial, ...patch } } })),
    [],
  );

  const addChatMessage = useCallback((m: ChatMessage) => setState((s) => ({ ...s, chatHistory: [...s.chatHistory, m] })), []);
  const clearChat = useCallback(() => setState((s) => ({ ...s, chatHistory: [] })), []);

  const ingestTools = useCallback(
    (tools: Tool[], duplications: Duplication[], painPoints: string[], detectedBudget: number | null) =>
      setState((s) => ({ ...s, tools, duplications, painPoints, detectedBudget })),
    [],
  );

  const reset = useCallback(() => setState(defaultState), []);

  const value = useMemo<SessionValue>(
    () => ({
      ...state,
      setTools,
      setDuplications,
      setPainPoints,
      setDetectedBudget,
      setAssessment,
      setPhase,
      updateOrg,
      updateBusiness,
      updateTechnical,
      updateFinancial,
      addChatMessage,
      clearChat,
      ingestTools,
      reset,
    }),
    [
      state,
      setTools,
      setDuplications,
      setPainPoints,
      setDetectedBudget,
      setAssessment,
      setPhase,
      updateOrg,
      updateBusiness,
      updateTechnical,
      updateFinancial,
      addChatMessage,
      clearChat,
      ingestTools,
      reset,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
