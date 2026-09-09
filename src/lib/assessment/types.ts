// Domain model for the process automation assessment.
// Deliberately self-contained: nothing here reaches into the marketing data
// (tmtSolutions / tmtOntology), because that data is entity-shaped and this
// engine is activity-shaped.

export type ExecutionMode = "manual" | "digitized" | "automated" | "ai";

/** The ladder that turns a mode into a score. Time-weighted, not count-weighted. */
export const MODE_WEIGHT: Record<ExecutionMode, number> = {
  manual: 0,
  digitized: 0.25,
  automated: 0.75,
  ai: 1,
};

export const MODE_LABEL: Record<ExecutionMode, string> = {
  manual: "Manual",
  digitized: "Digitized",
  automated: "Automated",
  ai: "AI-enhanced",
};

export const MODE_HINT: Record<ExecutionMode, string> = {
  manual: "A person does this by hand",
  digitized: "Done inside the ERP, still person-driven",
  automated: "Rule-based, runs unattended",
  ai: "Judgment work carried by a model",
};

export const MODES: ExecutionMode[] = ["manual", "digitized", "automated", "ai"];

/** The irreducible human eyeball — exception-basis only. Caps what is achievable. */
export const HUMAN_EXCEPTION_FLOOR = 0.05;

export type LandscapeId =
  | "sap"
  | "sap-hyperion"
  | "oracle-hyperion"
  | "hyperion-dynamics"
  | "tally"
  | "other";

export interface Landscape {
  id: LandscapeId;
  label: string;
  note: string;
}

export interface Stage {
  id: string;
  label: string;
}

export interface Activity {
  id: string;
  stageId: string;
  label: string;
  /** Effort per unit (per invoice) before any complexity weighting. */
  baselineMinutes: number;
  /** The outside-in default: what is normally true for each ERP landscape. */
  benchmark: Record<LandscapeId, ExecutionMode>;
  /** Best reachable mode for this activity. */
  ceiling: ExecutionMode;
  drivers: string[];
  agentIds: string[];
  challengeIds: string[];
}

export interface Variant {
  id: string;
  label: string;
  note: string;
  /** Global effort multiplier for this sub-process type. */
  base: number;
  /** Extra weighting on specific stages (e.g. capex kills matching). */
  stageMultipliers?: Record<string, number>;
}

export interface Challenge {
  id: string;
  label: string;
}

export interface AssessAgent {
  id: string;
  title: string;
  description: string;
  status: "live" | "build";
}

export interface ProofPoint {
  id: string;
  descriptor: string;
  blurb: string;
  activityIds: string[];
}

export interface ProcessModel {
  id: string;
  label: string;
  unit: string;
  stages: Stage[];
  activities: Activity[];
  variants: Variant[];
  challenges: Challenge[];
  agents: AssessAgent[];
  proof: ProofPoint[];
}

export interface Adjusters {
  /** Share of invoices that fall out as exceptions. */
  exceptionRate: number;
  /** Share that match first time, no touch. */
  firstTimeMatchRate: number;
  /** Credit notes / cancellations as a share of volume. */
  creditNoteRate: number;
}

export interface AssessmentInput {
  processId: string;
  sector: string;
  landscape: LandscapeId;
  /** variantId -> percentage. Normalised at scoring time, so it need not sum to 100. */
  mix: Record<string, number>;
  volumePerMonth: number;
  fteCount: number;
  location: string;
  /** Fully loaded annual cost per FTE, in INR. */
  costPerFteAnnual: number;
  adjusters: Adjusters;
  /** The uncheck interaction. Absent key = accept the benchmark. */
  overrides: Record<string, ExecutionMode>;
  remarks: string;
}
