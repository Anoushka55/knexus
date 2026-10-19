"use client";

/**
 * Cross-page pipeline state for the Enterprise Architecture console.
 * Mirrors src/lib/aiops/session.tsx's role for AI Operations: a single
 * React context, mounted once in the console layout, that every page
 * reads and writes so the 6-step pipeline (EA Analysis → ARB → Mapping →
 * Compliance → Maturity → Insights/Reports) can be run one page at a time
 * while still sharing state, exactly like the source app's single-page
 * frontend/index.html did via in-memory JS globals.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  ArbProposal,
  ArbResult,
  ArbSignoff,
  AssessmentResultsPayload,
  AssessmentSession,
  ComplianceResult,
  EaContext,
  InsightsResult,
  MappingContext,
  MappingResult,
  MaturityResult,
  PipelineResult,
  SavedReport,
  TimeResult,
} from "./types";
import { createAssessmentSession } from "./questionnaire";

const STORAGE_KEY = "ea_console_v1";

interface PersistedState {
  assessmentSession: AssessmentSession | null;
  assessmentResults: AssessmentResultsPayload | null;
  savedReports: SavedReport[];
}

function loadPersisted(): PersistedState {
  if (typeof window === "undefined") return { assessmentSession: null, assessmentResults: null, savedReports: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { assessmentSession: null, assessmentResults: null, savedReports: [] };
    const parsed = JSON.parse(raw);
    return {
      assessmentSession: parsed.assessmentSession ?? null,
      assessmentResults: parsed.assessmentResults ?? null,
      savedReports: parsed.savedReports ?? [],
    };
  } catch {
    return { assessmentSession: null, assessmentResults: null, savedReports: [] };
  }
}

interface SessionValue {
  // Step 1 — EA Analysis / Portfolio Rationalization
  eaContext: EaContext;
  setEaContext: (v: Partial<EaContext>) => void;
  timeResult: TimeResult | null;
  setTimeResult: (v: TimeResult | null) => void;

  // Step 2 — ARB Governance
  arbResult: ArbResult | null;
  setArbResult: (v: ArbResult | null) => void;
  arbProposal: ArbProposal | null;
  setArbProposal: (v: ArbProposal | null) => void;
  arbSignoff: ArbSignoff | null;
  setArbSignoff: (v: ArbSignoff | null) => void;

  // Step 3 — Dependency Mapping + Compliance
  mappingContext: MappingContext;
  setMappingContext: (v: Partial<MappingContext>) => void;
  mappingResult: MappingResult | null;
  setMappingResult: (v: MappingResult | null) => void;
  complianceResult: ComplianceResult | null;
  setComplianceResult: (v: ComplianceResult | null) => void;
  selectedRegulations: string[];
  setSelectedRegulations: (v: string[]) => void;

  // Step 4 — Maturity Assessment
  assessmentSession: AssessmentSession | null;
  setAssessmentSession: (v: AssessmentSession | null) => void;
  assessmentResults: AssessmentResultsPayload | null;
  setAssessmentResults: (v: AssessmentResultsPayload | null) => void;
  maturityResult: MaturityResult | null;
  setMaturityResult: (v: MaturityResult | null) => void;

  // Step 5 — Insights
  insightsResult: InsightsResult | null;
  setInsightsResult: (v: InsightsResult | null) => void;

  // Reports
  savedReports: SavedReport[];
  saveReport: (title: string) => void;
  deleteReport: (id: string) => void;

  // Chat history (Advisory + Agents console)
  resetPipeline: () => void;
  buildPipeline: () => PipelineResult;
}

const defaultEaContext: EaContext = {
  industry: "",
  sub_sector: "",
  governance: "",
  ea_framework: "",
  ea_tools: "",
  cloud_strategy: "",
  additional_context: "",
};

const defaultMappingContext: MappingContext = {
  known_integrations: "",
  planned_changes: "",
  cloud_target: "",
  data_sensitivity: "",
  integration_complexity: "",
  cmdb_tool: "",
  additional_notes: "",
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [eaContext, setEaContextState] = useState<EaContext>(defaultEaContext);
  const [timeResult, setTimeResult] = useState<TimeResult | null>(null);

  const [arbResult, setArbResult] = useState<ArbResult | null>(null);
  const [arbProposal, setArbProposal] = useState<ArbProposal | null>(null);
  const [arbSignoff, setArbSignoff] = useState<ArbSignoff | null>(null);

  const [mappingContext, setMappingContextState] = useState<MappingContext>(defaultMappingContext);
  const [mappingResult, setMappingResult] = useState<MappingResult | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [selectedRegulations, setSelectedRegulations] = useState<string[]>([]);

  const [assessmentSession, setAssessmentSession] = useState<AssessmentSession | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResultsPayload | null>(null);
  const [maturityResult, setMaturityResult] = useState<MaturityResult | null>(null);

  const [insightsResult, setInsightsResult] = useState<InsightsResult | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persisted = loadPersisted();
    setAssessmentSession(persisted.assessmentSession ?? createAssessmentSession());
    setAssessmentResults(persisted.assessmentResults);
    setSavedReports(persisted.savedReports);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ assessmentSession, assessmentResults, savedReports }),
      );
    } catch {
      // storage unavailable (private mode, etc.) — state still lives in memory
    }
  }, [hydrated, assessmentSession, assessmentResults, savedReports]);

  const setEaContext = useCallback((v: Partial<EaContext>) => {
    setEaContextState((prev) => ({ ...prev, ...v }));
  }, []);

  const setMappingContext = useCallback((v: Partial<MappingContext>) => {
    setMappingContextState((prev) => ({ ...prev, ...v }));
  }, []);

  const saveReport = useCallback(
    (title: string) => {
      const pipeline: PipelineResult = {
        TIME: timeResult ?? undefined,
        ARB: arbResult ?? undefined,
        MAPPING: mappingResult ?? undefined,
        COMPLIANCE: complianceResult ?? undefined,
        MATURITY: maturityResult ?? undefined,
        INSIGHTS: insightsResult ?? undefined,
        pipeline_summary: {
          industry: eaContext.industry || "General",
          sub_sector: eaContext.sub_sector,
          governance: eaContext.governance,
          ea_framework: eaContext.ea_framework,
          cloud_strategy: eaContext.cloud_strategy,
          stages_completed: [
            timeResult && "TIME",
            arbResult && "ARB",
            mappingResult && "MAPPING",
            complianceResult && "COMPLIANCE",
            maturityResult && "MATURITY",
            insightsResult && "INSIGHTS",
          ].filter(Boolean) as string[],
          stages_failed: [],
          errors: {},
          total_apps_assessed: timeResult?.applications.length ?? 0,
          flagged_for_action:
            timeResult?.applications.filter((a) =>
              ["Retire", "Replace", "Refactor", "Rehost", "Replatform"].includes(a.rationalization_action ?? ""),
            ).length ?? 0,
          compliance_score: complianceResult?.overall_compliance_score ?? null,
          maturity_score: maturityResult?.overall_maturity_score ?? null,
          overall_risk: insightsResult?.risk_profile?.overall_risk ?? null,
          potential_savings: timeResult?.portfolio_summary?.potential_savings ?? 0,
          total_annual_cost: timeResult?.portfolio_summary?.total_annual_cost ?? 0,
        },
      };
      const report: SavedReport = {
        id: `rpt_${Date.now()}`,
        createdAt: new Date().toISOString(),
        title,
        pipeline,
      };
      setSavedReports((prev) => [report, ...prev]);
    },
    [timeResult, arbResult, mappingResult, complianceResult, maturityResult, insightsResult, eaContext],
  );

  const deleteReport = useCallback((id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const resetPipeline = useCallback(() => {
    setEaContextState(defaultEaContext);
    setTimeResult(null);
    setArbResult(null);
    setArbProposal(null);
    setArbSignoff(null);
    setMappingContextState(defaultMappingContext);
    setMappingResult(null);
    setComplianceResult(null);
    setSelectedRegulations([]);
    setMaturityResult(null);
    setInsightsResult(null);
  }, []);

  const buildPipeline = useCallback((): PipelineResult => {
    return {
      TIME: timeResult ?? undefined,
      ARB: arbResult ?? undefined,
      MAPPING: mappingResult ?? undefined,
      COMPLIANCE: complianceResult ?? undefined,
      MATURITY: maturityResult ?? undefined,
      INSIGHTS: insightsResult ?? undefined,
      pipeline_summary: {
        industry: eaContext.industry || "General",
        sub_sector: eaContext.sub_sector,
        governance: eaContext.governance,
        ea_framework: eaContext.ea_framework,
        cloud_strategy: eaContext.cloud_strategy,
        stages_completed: [
          timeResult && "TIME",
          arbResult && "ARB",
          mappingResult && "MAPPING",
          complianceResult && "COMPLIANCE",
          maturityResult && "MATURITY",
          insightsResult && "INSIGHTS",
        ].filter(Boolean) as string[],
        stages_failed: [],
        errors: {},
        total_apps_assessed: timeResult?.applications.length ?? 0,
        flagged_for_action:
          timeResult?.applications.filter((a) =>
            ["Retire", "Replace", "Refactor", "Rehost", "Replatform"].includes(a.rationalization_action ?? ""),
          ).length ?? 0,
        compliance_score: complianceResult?.overall_compliance_score ?? null,
        maturity_score: maturityResult?.overall_maturity_score ?? null,
        overall_risk: insightsResult?.risk_profile?.overall_risk ?? null,
        potential_savings: timeResult?.portfolio_summary?.potential_savings ?? 0,
        total_annual_cost: timeResult?.portfolio_summary?.total_annual_cost ?? 0,
      },
    };
  }, [timeResult, arbResult, mappingResult, complianceResult, maturityResult, insightsResult, eaContext]);

  const value = useMemo<SessionValue>(
    () => ({
      eaContext,
      setEaContext,
      timeResult,
      setTimeResult,
      arbResult,
      setArbResult,
      arbProposal,
      setArbProposal,
      arbSignoff,
      setArbSignoff,
      mappingContext,
      setMappingContext,
      mappingResult,
      setMappingResult,
      complianceResult,
      setComplianceResult,
      selectedRegulations,
      setSelectedRegulations,
      assessmentSession,
      setAssessmentSession,
      assessmentResults,
      setAssessmentResults,
      maturityResult,
      setMaturityResult,
      insightsResult,
      setInsightsResult,
      savedReports,
      saveReport,
      deleteReport,
      resetPipeline,
      buildPipeline,
    }),
    [
      eaContext,
      setEaContext,
      timeResult,
      arbResult,
      arbProposal,
      arbSignoff,
      mappingContext,
      setMappingContext,
      mappingResult,
      complianceResult,
      selectedRegulations,
      assessmentSession,
      assessmentResults,
      maturityResult,
      insightsResult,
      savedReports,
      saveReport,
      deleteReport,
      resetPipeline,
      buildPipeline,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
