// Finance function capability map — personas across three time horizons.
//
// DILO / MILO / YILO ("Day / Month / Year in the life of") is a standard
// consulting lens for describing a role: what it does daily, the cycle it
// owns monthly, and the cadence it owns annually. Each persona's problem
// statements are tagged with the horizon they belong to, so the horizon
// control filters that one column — everything else in the map stays
// visible and correlates through the shared theme, the same way the TMT
// Capability Map correlates through a shared pillar.
//
// No client name anywhere: personas are generic finance-function roles,
// not any specific engagement.

import { p2p } from "./p2p";

export type Horizon = "dilo" | "milo" | "yilo";

export interface HorizonInfo {
  id: Horizon;
  label: string;
  shortLabel: string;
  definition: string;
}

export const horizons: HorizonInfo[] = [
  {
    id: "dilo",
    label: "Day in the life",
    shortLabel: "DILO",
    definition: "What this role does every day, hands on keyboard.",
  },
  {
    id: "milo",
    label: "Month in the life",
    shortLabel: "MILO",
    definition: "The recurring cycle this role owns every month.",
  },
  {
    id: "yilo",
    label: "Year in the life",
    shortLabel: "YILO",
    definition: "The strategic and compliance cadence this role owns every year.",
  },
];

// Same three-dot convention as the AI Architecture Accelerator's ecosystem
// legend, applied to a different three-way split — one consistent visual
// language for "pick one of three lenses" across the capability maps.
export const HORIZON_DOT: Record<Horizon, string> = {
  dilo: "bg-brand-blue",
  milo: "bg-brand-violet",
  yilo: "bg-brand-green",
};

export type ThemeId =
  | "procure-to-pay"
  | "record-to-report"
  | "planning-forecasting"
  | "tax-compliance"
  | "treasury-cash"
  | "controls-audit"
  | "board-strategic-reporting";

export interface Theme {
  id: ThemeId;
  label: string;
}

export const themes: Theme[] = [
  { id: "procure-to-pay", label: "Procure to Pay" },
  { id: "record-to-report", label: "Record to Report" },
  { id: "planning-forecasting", label: "Planning & Forecasting" },
  { id: "tax-compliance", label: "Tax & Compliance" },
  { id: "treasury-cash", label: "Treasury & Cash" },
  { id: "controls-audit", label: "Controls & Audit" },
  { id: "board-strategic-reporting", label: "Board & Strategic Reporting" },
];

const themeLabelById = new Map(themes.map((t) => [t.id, t.label]));

export function themeLabels(ids: ThemeId[]): string {
  return ids.map((id) => themeLabelById.get(id) ?? id).join(" · ");
}

// Seven distinct, consistent colors — one per theme, used for the dot row on
// every card (so the correlation is visible before you even hover) and for
// the connector line itself (colored by whichever theme the two nodes
// actually share, so a line answers "why are these linked" on sight).
export const THEME_DOT: Record<ThemeId, string> = {
  "procure-to-pay": "bg-brand-blue",
  "record-to-report": "bg-brand-violet",
  "planning-forecasting": "bg-brand-green",
  "tax-compliance": "bg-orange-500",
  "treasury-cash": "bg-cyan-600",
  "controls-audit": "bg-rose-600",
  "board-strategic-reporting": "bg-indigo-600",
};

// Same seven hues as THEME_DOT, as rgba strings for SVG stroke — a
// Tailwind class can't be used directly as a stroke value.
export const THEME_STROKE: Record<ThemeId, string> = {
  "procure-to-pay": "rgba(26,58,143,0.6)",
  "record-to-report": "rgba(139,92,246,0.6)",
  "planning-forecasting": "rgba(22,163,74,0.6)",
  "tax-compliance": "rgba(249,115,22,0.6)",
  "treasury-cash": "rgba(8,145,178,0.6)",
  "controls-audit": "rgba(225,29,72,0.6)",
  "board-strategic-reporting": "rgba(79,70,229,0.6)",
};

export interface Persona {
  id: string;
  title: string;
  themeIds: ThemeId[];
}

export const personas: Persona[] = [
  {
    id: "gcfo",
    title: "Group CFO",
    themeIds: ["treasury-cash", "planning-forecasting", "board-strategic-reporting"],
  },
  {
    id: "controller",
    title: "Controller / Record-to-Report Lead",
    themeIds: ["record-to-report", "procure-to-pay", "controls-audit"],
  },
  {
    id: "fpna",
    title: "FP&A / Planning Lead",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "tax",
    title: "Tax Head",
    themeIds: ["tax-compliance"],
  },
  {
    id: "treasury",
    title: "Treasury Head",
    themeIds: ["treasury-cash"],
  },
  {
    id: "functional-lead",
    title: "Functional Lead (Shared Services / AP)",
    themeIds: ["procure-to-pay", "record-to-report", "controls-audit"],
  },
  {
    id: "audit",
    title: "Internal Audit / Controls Lead",
    themeIds: ["controls-audit"],
  },
];

export interface ProblemStatement {
  id: string;
  personaId: string;
  horizon: Horizon;
  label: string;
  themeIds: ThemeId[];
}

export const problemStatements: ProblemStatement[] = [
  // ---- Group CFO ----
  {
    id: "gcfo-dilo-1",
    personaId: "gcfo",
    horizon: "dilo",
    label: "Fields ad hoc escalations on cash position and one-off variances with no consolidated daily view",
    themeIds: ["treasury-cash"],
  },
  {
    id: "gcfo-milo-1",
    personaId: "gcfo",
    horizon: "milo",
    label: "Reviews flash results and forecast updates assembled from five business-unit templates that don't tie out",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "gcfo-yilo-1",
    personaId: "gcfo",
    horizon: "yilo",
    label: "Assembles the board deck and investor narrative from disconnected slides built independently by five teams",
    themeIds: ["board-strategic-reporting"],
  },

  // ---- Controller ----
  {
    id: "controller-dilo-1",
    personaId: "controller",
    horizon: "dilo",
    label: "Chases open items and GL exceptions flagged by different entities with no single exception queue",
    themeIds: ["record-to-report"],
  },
  {
    id: "controller-milo-1",
    personaId: "controller",
    horizon: "milo",
    label: "Runs a 14-entity consolidation and trial-balance close that still needs manual elimination entries",
    themeIds: ["record-to-report"],
  },
  {
    id: "controller-yilo-1",
    personaId: "controller",
    horizon: "yilo",
    label: "Prepares statutory financial statements and coordinates external audit fieldwork across entities",
    themeIds: ["record-to-report", "controls-audit"],
  },

  // ---- FP&A ----
  {
    id: "fpna-dilo-1",
    personaId: "fpna",
    horizon: "dilo",
    label: "Answers ad hoc business-partner questions on yesterday's numbers because today's actuals aren't loaded",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "fpna-milo-1",
    personaId: "fpna",
    horizon: "milo",
    label: "Builds the budget-vs-actual variance pack by manually reconciling five different source systems",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "fpna-yilo-1",
    personaId: "fpna",
    horizon: "yilo",
    label: "Runs the annual budgeting cycle across 40+ cost centres by email and spreadsheet template",
    themeIds: ["planning-forecasting"],
  },

  // ---- Tax ----
  {
    id: "tax-dilo-1",
    personaId: "tax",
    horizon: "dilo",
    label: "Fields transaction-level tax queries from the business with no searchable rulings library",
    themeIds: ["tax-compliance"],
  },
  {
    id: "tax-milo-1",
    personaId: "tax",
    horizon: "milo",
    label: "Reconciles indirect tax filings against the general ledger entity by entity",
    themeIds: ["tax-compliance"],
  },
  {
    id: "tax-yilo-1",
    personaId: "tax",
    horizon: "yilo",
    label: "Prepares transfer-pricing documentation and statutory tax filings across every jurisdiction",
    themeIds: ["tax-compliance"],
  },

  // ---- Treasury ----
  {
    id: "treasury-dilo-1",
    personaId: "treasury",
    horizon: "dilo",
    label: "Consolidates cash positions across a dozen-plus bank accounts from separate bank portals every morning",
    themeIds: ["treasury-cash"],
  },
  {
    id: "treasury-milo-1",
    personaId: "treasury",
    horizon: "milo",
    label: "Builds the 13-week liquidity forecast from inputs that arrive in inconsistent formats",
    themeIds: ["treasury-cash"],
  },
  {
    id: "treasury-yilo-1",
    personaId: "treasury",
    horizon: "yilo",
    label: "Prepares covenant compliance certificates and refinancing analysis for lenders and rating agencies",
    themeIds: ["treasury-cash"],
  },

  // ---- Functional Lead (AP / Shared Services) ----
  {
    id: "func-dilo-1",
    personaId: "functional-lead",
    horizon: "dilo",
    label: "Processes and matches invoices by hand wherever PO coverage or line-item complexity breaks automation",
    themeIds: ["procure-to-pay"],
  },
  {
    id: "func-milo-1",
    personaId: "functional-lead",
    horizon: "milo",
    label: "Clears the month-end AP ageing and GR/IR backlog before books close",
    themeIds: ["procure-to-pay", "record-to-report"],
  },
  {
    id: "func-yilo-1",
    personaId: "functional-lead",
    horizon: "yilo",
    label: "Renegotiates vendor payment terms and audits the P2P control environment annually",
    themeIds: ["procure-to-pay", "controls-audit"],
  },

  // ---- Internal Audit ----
  {
    id: "audit-dilo-1",
    personaId: "audit",
    horizon: "dilo",
    label: "Tracks open audit issues and control exceptions across a spreadsheet-based issue log",
    themeIds: ["controls-audit"],
  },
  {
    id: "audit-milo-1",
    personaId: "audit",
    horizon: "milo",
    label: "Executes quarterly control-testing cycles across entities with inconsistent evidence formats",
    themeIds: ["controls-audit"],
  },
  {
    id: "audit-yilo-1",
    personaId: "audit",
    horizon: "yilo",
    label: "Runs the annual SOX certification and enterprise risk assessment across the group",
    themeIds: ["controls-audit"],
  },
];

export interface Challenge {
  id: string;
  label: string;
  themeIds: ThemeId[];
}

export const challenges: Challenge[] = [
  {
    id: "ch-invoice-manual",
    label: "Invoice matching and coding still fall back to manual work wherever PO coverage is thin or line-item complexity is high",
    themeIds: ["procure-to-pay"],
  },
  {
    id: "ch-grir-scramble",
    label: "Month-end AP ageing and GR/IR clearing turns into a manual scramble before books close",
    themeIds: ["procure-to-pay", "record-to-report"],
  },
  {
    id: "ch-consolidation-manual",
    label: "Multi-entity consolidation still needs manual elimination entries and trial-balance tie-outs",
    themeIds: ["record-to-report"],
  },
  {
    id: "ch-exception-queue",
    label: "No single exception queue across entities, so GL issues get chased down one at a time",
    themeIds: ["record-to-report"],
  },
  {
    id: "ch-variance-manual",
    label: "Budget-vs-actual variance packs are assembled by hand from disconnected source systems",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "ch-stale-actuals",
    label: "Actuals load a day late, so business-partnering questions get answered on stale numbers",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "ch-tax-recon",
    label: "Indirect tax filings are reconciled against the GL entity by entity with no searchable rulings history",
    themeIds: ["tax-compliance"],
  },
  {
    id: "ch-cash-manual",
    label: "Cash positions are consolidated by hand from a dozen-plus separate bank portals every morning",
    themeIds: ["treasury-cash"],
  },
  {
    id: "ch-liquidity-format",
    label: "13-week liquidity forecasts are built from inputs that arrive in inconsistent formats",
    themeIds: ["treasury-cash"],
  },
  {
    id: "ch-evidence-format",
    label: "Control-testing evidence arrives in inconsistent formats across entities every quarter",
    themeIds: ["controls-audit"],
  },
  {
    id: "ch-board-deck-manual",
    label: "The board deck and investor narrative are assembled from disconnected slides built independently by five teams",
    themeIds: ["board-strategic-reporting"],
  },
];

export interface AutomationOpportunity {
  id: string;
  label: string;
  themeIds: ThemeId[];
}

export const automationOpportunities: AutomationOpportunity[] = [
  {
    id: "auto-exception-only",
    label: "Exception-only invoice processing: match automatically, route only genuine exceptions to a person",
    themeIds: ["procure-to-pay"],
  },
  {
    id: "auto-continuous-grir",
    label: "Continuous GR/IR monitoring instead of a month-end sweep",
    themeIds: ["procure-to-pay", "record-to-report"],
  },
  {
    id: "auto-consolidation",
    label: "Automated consolidation and elimination with one exception queue across every entity",
    themeIds: ["record-to-report"],
  },
  {
    id: "auto-variance-pack",
    label: "Automated variance-pack assembly with a same-day actuals refresh",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "auto-tax-recon",
    label: "Automated indirect-tax reconciliation with a searchable rulings and query library",
    themeIds: ["tax-compliance"],
  },
  {
    id: "auto-cash-agg",
    label: "Automated multi-bank cash aggregation feeding a continuously updated liquidity forecast",
    themeIds: ["treasury-cash"],
  },
  {
    id: "auto-evidence",
    label: "Standardised evidence collection and automated control-testing workpapers",
    themeIds: ["controls-audit"],
  },
  {
    id: "auto-board-pack",
    label: "Automated board-pack assembly pulling directly from consolidation, FP&A and treasury outputs",
    themeIds: ["board-strategic-reporting"],
  },
];

export interface FinanceAgent {
  id: string;
  title: string;
  description: string;
  status: "live" | "build";
  themeIds: ThemeId[];
}

// Five of these already exist for Procure-to-Pay (src/data/finance/p2p.ts) and
// extend naturally into Record-to-Report, Planning and Board reporting —
// reused here rather than redefined, so the same agent surfaces from two
// navigation paths in the product. Five more are net-new, covering the
// personas P2P alone doesn't reach: Tax, Treasury and Internal Audit.
function fromP2P(id: string, themeIds: ThemeId[]): FinanceAgent {
  const agent = p2p.agents.find((a) => a.id === id);
  if (!agent) throw new Error(`Unknown p2p agent id: ${id}`);
  return {
    id: agent.id,
    title: agent.title,
    description: agent.description,
    status: agent.status,
    themeIds,
  };
}

export const agents: FinanceAgent[] = [
  fromP2P("invoice-capture-agent", ["procure-to-pay"]),
  fromP2P("exception-triage-agent", ["procure-to-pay"]),
  fromP2P("quality-review-agent", ["procure-to-pay", "record-to-report"]),
  fromP2P("mis-generator-agent", ["record-to-report", "planning-forecasting"]),
  fromP2P("pre-submission-review-agent", ["record-to-report", "board-strategic-reporting"]),
  {
    id: "consolidation-agent",
    title: "Consolidation & Elimination Agent",
    description:
      "Runs multi-entity consolidation and elimination entries, and surfaces trial-balance breaks in one exception queue instead of an inbox per entity.",
    status: "build",
    themeIds: ["record-to-report"],
  },
  {
    id: "variance-analysis-agent",
    title: "Variance Analysis Agent",
    description:
      "Assembles the budget-vs-actual variance pack from source systems automatically and drafts the commentary a business partner would otherwise write by hand.",
    status: "build",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "tax-compliance-agent",
    title: "Tax Compliance & Filing Agent",
    description:
      "Reconciles indirect tax filings against the ledger entity by entity and answers transaction-level tax queries against a searchable rulings library.",
    status: "build",
    themeIds: ["tax-compliance"],
  },
  {
    id: "cash-positioning-agent",
    title: "Cash Positioning & Liquidity Agent",
    description:
      "Aggregates cash positions across every bank portal each morning and rolls them into a continuously updated 13-week liquidity forecast.",
    status: "build",
    themeIds: ["treasury-cash"],
  },
  {
    id: "controls-testing-agent",
    title: "Controls Testing & Audit Evidence Agent",
    description:
      "Standardises control-testing evidence across entities and assembles the workpapers a controls tester would otherwise chase down by email.",
    status: "build",
    themeIds: ["controls-audit"],
  },
];
