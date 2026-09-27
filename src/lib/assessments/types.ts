/**
 * The capability-maturity engine's domain model.
 *
 * Deliberately self-contained: nothing here imports the agent catalogue or the
 * marketing data. The crosswalk to agents is nothing but a list of ids on
 * Capability, resolved only by ./opportunities.ts — which keeps the scorer pure
 * and arguable on its own terms, the same way src/lib/assessment/types.ts keeps
 * the P2P engine separable from tmtSolutions.
 */

/** The two measures captured per capability. They are independent, not a ladder. */
export type Scale = "business" | "agentic";

export const SCALES: Scale[] = ["business", "agentic"];

export type Level = 1 | 2 | 3 | 4 | 5;

export const LEVELS: Level[] = [1, 2, 3, 4, 5];

/**
 * The canonical agent ladders.
 *
 * These names follow src/components/ui/ScopeCard.tsx, which is the ladder
 * actually shown to users in a modal. Note that src/data/agents.ts labels the
 * same numbers differently on its `type` fields ("Task"/"Process"/"Enterprise",
 * "Supervised"/"Guided"/"Automated"). Two labellings over one numeric grid, so
 * the engine keys on `level` only and never on `type`.
 */
export const SCOPE_NAMES = ["Task", "Workflow", "Process", "Journey"] as const;
export const AUTONOMY_NAMES = [
  "Assistive",
  "Guided",
  "Guardrailed Autonomy",
  "Full Autonomy",
] as const;

export type LadderLevel = 1 | 2 | 3 | 4;

/** Where an agent sits on the two ladders — and what a rubric rung demands. */
export interface AgenticCoordinate {
  scope: LadderLevel;
  autonomy: LadderLevel;
}

/**
 * One rung of the generic maturity spine, authored once per assessment.
 *
 * Real maturity models (CMMI, TM Forum) define levels generically and anchor
 * them per item. Writing a bespoke descriptor for every capability at every
 * level would mean 280 strings that drift and contradict each other — and that
 * inconsistency is the first thing a reviewer finds. A generic spine plus a
 * specific `Capability.levelAnchor` is both cheaper and harder to attack.
 */
export interface RubricRung {
  level: Level;
  name: string;
  /** What this rung looks like as a business capability. */
  business: string;
  /** What this rung looks like in terms of agent involvement. */
  agentic: string;
  /** What an agent must reach to be a lever at this rung. Null at level 1: a person does this. */
  coordinate: AgenticCoordinate | null;
}

export interface CapabilityGroup {
  id: string;
  label: string;
  /** Short form for radar axes, where the full label will not fit. */
  shortLabel: string;
  blurb: string;
  /** tmtOntology CATEGORIES ids ("05", "10", …) — display-only grounding. */
  ontologyCategoryIds: string[];
  /** tmtSolutions pillar ids — joins through to solutions, plays and credentials. */
  pillarIds: string[];
}

export interface Capability {
  id: string;
  groupId: string;
  label: string;
  /** The question an assessor reads out loud. */
  prompt: string;
  /** What level 3 looks like for this specific capability. Anchors the generic spine. */
  levelAnchor: string;
  /** What to ask to see. Keeps the conversation honest rather than aspirational. */
  evidence: string[];
  /**
   * THE CROSSWALK. Agent ids from src/data/agents.ts.
   *
   * May be empty, and that is a feature: a gapped capability with no agent
   * renders as a Forge candidate rather than being quietly dropped. Pretending
   * every gap has an agent is less credible than admitting the ones that do not.
   */
  agentIds: string[];
  /** tmtSolutions challenge ids implicated when this sits below target. */
  challengeIds: string[];
  /** tmtSolutions priority ids — the board-level reason this gap matters. */
  priorityIds: string[];
  /** Defaults to 1. Set only where a capability genuinely dominates, and surface it in the UI. */
  weight?: number;
}

/** One capability's starting position, before the client corrects anything. */
export interface BenchmarkRow {
  business: Level;
  agentic: Level;
  target: Level;
}

export interface IndustryBenchmark {
  id: string;
  label: string;
  /**
   * Required, and rendered wherever a benchmark number or delta appears.
   *
   * Every delta on the scorecard will be read as research. This field is what
   * stops an illustrative starting position from being mistaken for a published
   * survey — the same discipline as `statSource` in the marketing data.
   */
  disclosure: string;
  /** The headline comparator behind the "vs benchmark" deltas. */
  peer: Record<Scale, number>;
  /** Every capability id must have a row. assertDefinition() enforces it. */
  rows: Record<string, BenchmarkRow>;
}

/**
 * A sparse override. An absent key — or an absent field within a key — means
 * "accept the benchmark", which is what lets step 2 be a conversation over a
 * pre-filled grid rather than 84 mandatory inputs.
 */
export interface AnswerPatch {
  business?: Level;
  agentic?: Level;
  target?: Level;
}

export interface AssessmentScope {
  id: string;
  label: string;
  note: string;
}

export interface AssessmentRunInput {
  definitionId: string;
  benchmarkId: string;
  scopeId: string;
  /** Free text, because the industry shown on the report is a label, not a key. */
  industryLabel: string;
  /** ISO date, set when step 2 is marked complete. Null while in progress. */
  completedOn: string | null;
  answers: Record<string, AnswerPatch>;
  notes: string;
}

export type AssessmentStatus = "live" | "coming-soon" | "legacy";

export interface AssessmentDefinition {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  status: AssessmentStatus;
  /** "deep" is a full capability model; "index" is a short cross-sector read. */
  depth: "deep" | "index";
  estimateMinutes: number;
  iconName: string;
  /**
   * Only set on `legacy` entries — the two pre-existing assessments, which have
   * their own capture models and their own routes. The hub links them by href;
   * getAssessment() never serves them to [slug].
   */
  href?: string;
  scopes: AssessmentScope[];
  rubric: RubricRung[];
  groups: CapabilityGroup[];
  capabilities: Capability[];
  benchmarks: IndustryBenchmark[];
  defaultBenchmarkId: string;
  /** Bump when capability ids or their order change — gates stored runs and share links. */
  contentVersion: number;
}
