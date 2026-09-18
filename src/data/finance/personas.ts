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
  horizon: Horizon;
  themeIds: ThemeId[];
}

// Every challenge now carries the horizon it actually belongs to, so the
// DILO/MILO/YILO control filters this column the same way it filters
// Problem Statements — previously it didn't, which meant switching horizons
// only ever changed the first column and left Challenges and Automation
// Opportunity looking identical regardless of which lens was selected.
export const challenges: Challenge[] = [
  // ---- DILO ----
  {
    id: "ch-cash-manual",
    label: "Cash positions are consolidated by hand from a dozen-plus separate bank portals every morning, and CFO-level escalations run on the same stale view",
    horizon: "dilo",
    themeIds: ["treasury-cash"],
  },
  {
    id: "ch-exception-queue",
    label: "GL exceptions get chased down one at a time across entities, with no single queue to work from",
    horizon: "dilo",
    themeIds: ["record-to-report"],
  },
  {
    id: "ch-stale-actuals",
    label: "Actuals load a day late, so business-partnering questions get answered on yesterday's numbers",
    horizon: "dilo",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "ch-tax-query",
    label: "Transaction-level tax queries from the business get answered ad hoc, with no searchable rulings history to draw on",
    horizon: "dilo",
    themeIds: ["tax-compliance"],
  },
  {
    id: "ch-invoice-manual",
    label: "Invoice matching and coding still fall back to manual work wherever PO coverage is thin or line-item complexity is high",
    horizon: "dilo",
    themeIds: ["procure-to-pay"],
  },
  {
    id: "ch-issue-log",
    label: "Open audit issues and control exceptions live in a spreadsheet, with no shared, current view across the team",
    horizon: "dilo",
    themeIds: ["controls-audit"],
  },

  // ---- MILO ----
  {
    id: "ch-variance-manual",
    label: "Flash results and the budget-vs-actual variance pack are assembled by hand from five disconnected source systems that don't tie out",
    horizon: "milo",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "ch-consolidation-manual",
    label: "Multi-entity consolidation still needs manual elimination entries and trial-balance tie-outs",
    horizon: "milo",
    themeIds: ["record-to-report"],
  },
  {
    id: "ch-tax-recon",
    label: "Indirect tax filings are reconciled against the general ledger entity by entity",
    horizon: "milo",
    themeIds: ["tax-compliance"],
  },
  {
    id: "ch-liquidity-format",
    label: "The 13-week liquidity forecast is built from inputs that arrive in inconsistent formats",
    horizon: "milo",
    themeIds: ["treasury-cash"],
  },
  {
    id: "ch-grir-scramble",
    label: "Month-end AP ageing and GR/IR clearing turns into a manual scramble before books close",
    horizon: "milo",
    themeIds: ["procure-to-pay", "record-to-report"],
  },
  {
    id: "ch-evidence-format",
    label: "Control-testing evidence arrives in inconsistent formats across entities every quarter",
    horizon: "milo",
    themeIds: ["controls-audit"],
  },

  // ---- YILO ----
  {
    id: "ch-board-deck-manual",
    label: "The board deck and investor narrative are assembled from disconnected slides built independently by five teams",
    horizon: "yilo",
    themeIds: ["board-strategic-reporting"],
  },
  {
    id: "ch-statutory-manual",
    label: "Statutory financial statements and external audit fieldwork are prepared largely by hand, entity by entity",
    horizon: "yilo",
    themeIds: ["record-to-report", "controls-audit"],
  },
  {
    id: "ch-budget-cycle",
    label: "The annual budgeting cycle runs across 40+ cost centres by email and spreadsheet template",
    horizon: "yilo",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "ch-transfer-pricing",
    label: "Transfer-pricing documentation and statutory filings are assembled market by market with no shared template or prior-year baseline",
    horizon: "yilo",
    themeIds: ["tax-compliance"],
  },
  {
    id: "ch-covenant-manual",
    label: "Covenant compliance certificates and refinancing analysis are rebuilt from scratch for every lender and rating agency",
    horizon: "yilo",
    themeIds: ["treasury-cash"],
  },
  {
    id: "ch-vendor-audit",
    label: "Vendor payment-term renegotiation and the annual P2P control audit both start from a blank sheet every year",
    horizon: "yilo",
    themeIds: ["procure-to-pay", "controls-audit"],
  },
  {
    id: "ch-sox-manual",
    label: "Annual SOX certification and enterprise risk assessment are assembled from scratch instead of building on the year's quarterly control testing",
    horizon: "yilo",
    themeIds: ["controls-audit"],
  },
];

export interface AutomationOpportunity {
  id: string;
  label: string;
  horizon: Horizon;
  themeIds: ThemeId[];
}

export const automationOpportunities: AutomationOpportunity[] = [
  // ---- DILO ----
  {
    id: "auto-cash-agg",
    label: "Automated multi-bank cash aggregation feeding one daily position, visible to Treasury and the CFO alike",
    horizon: "dilo",
    themeIds: ["treasury-cash"],
  },
  {
    id: "auto-exception-queue",
    label: "One live exception queue across every entity instead of an inbox per entity",
    horizon: "dilo",
    themeIds: ["record-to-report"],
  },
  {
    id: "auto-same-day-actuals",
    label: "Same-day actuals refresh so business partnering runs on today's numbers, not yesterday's",
    horizon: "dilo",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "auto-tax-query",
    label: "AI-assisted query answering against a searchable rulings and precedent library",
    horizon: "dilo",
    themeIds: ["tax-compliance"],
  },
  {
    id: "auto-exception-only",
    label: "Exception-only invoice processing: match automatically, route only genuine exceptions to a person",
    horizon: "dilo",
    themeIds: ["procure-to-pay"],
  },
  {
    id: "auto-issue-tracker",
    label: "A live, shared issue-and-exception tracker replacing the spreadsheet log",
    horizon: "dilo",
    themeIds: ["controls-audit"],
  },

  // ---- MILO ----
  {
    id: "auto-variance-pack",
    label: "Automated variance-pack and flash-results assembly with a same-day actuals refresh",
    horizon: "milo",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "auto-consolidation",
    label: "Automated consolidation and elimination across every entity",
    horizon: "milo",
    themeIds: ["record-to-report"],
  },
  {
    id: "auto-tax-recon",
    label: "Automated indirect-tax reconciliation against the ledger, entity by entity",
    horizon: "milo",
    themeIds: ["tax-compliance"],
  },
  {
    id: "auto-liquidity",
    label: "Automated liquidity-forecast assembly regardless of source format",
    horizon: "milo",
    themeIds: ["treasury-cash"],
  },
  {
    id: "auto-continuous-grir",
    label: "Continuous GR/IR monitoring instead of a month-end sweep",
    horizon: "milo",
    themeIds: ["procure-to-pay", "record-to-report"],
  },
  {
    id: "auto-evidence",
    label: "Standardised evidence collection feeding automated control-testing workpapers",
    horizon: "milo",
    themeIds: ["controls-audit"],
  },

  // ---- YILO ----
  {
    id: "auto-board-pack",
    label: "Automated board-pack assembly pulling directly from consolidation, FP&A and treasury outputs",
    horizon: "yilo",
    themeIds: ["board-strategic-reporting"],
  },
  {
    id: "auto-statutory",
    label: "Automated statutory-pack assembly with a direct handoff to audit evidence",
    horizon: "yilo",
    themeIds: ["record-to-report", "controls-audit"],
  },
  {
    id: "auto-budget-cycle",
    label: "A single online budgeting workflow replacing the email-and-spreadsheet cycle across every cost centre",
    horizon: "yilo",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "auto-transfer-pricing",
    label: "Automated transfer-pricing documentation from a reusable cross-market template and prior-year baseline",
    horizon: "yilo",
    themeIds: ["tax-compliance"],
  },
  {
    id: "auto-covenant",
    label: "Automated covenant-compliance certificate generation straight from the live liquidity model",
    horizon: "yilo",
    themeIds: ["treasury-cash"],
  },
  {
    id: "auto-vendor-audit",
    label: "Standing vendor-term benchmarks and a reusable P2P control-audit evidence pack instead of starting from zero",
    horizon: "yilo",
    themeIds: ["procure-to-pay", "controls-audit"],
  },
  {
    id: "auto-sox",
    label: "Automated SOX certification pack assembled directly from the year's quarterly testing evidence",
    horizon: "yilo",
    themeIds: ["controls-audit"],
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
    // Deliberately spans all three horizons for record-to-report: the
    // month-end consolidation and the annual statutory pack are the same
    // underlying data, not two separate jobs.
    description:
      "Runs multi-entity consolidation and elimination entries, surfaces trial-balance breaks in one exception queue instead of an inbox per entity, and hands the statutory pack straight to audit evidence at year end.",
    status: "build",
    themeIds: ["record-to-report"],
  },
  {
    id: "variance-analysis-agent",
    title: "Variance Analysis Agent",
    description:
      "Assembles the budget-vs-actual variance pack from source systems automatically, drafts the commentary a business partner would otherwise write by hand, and runs the annual budgeting workflow across every cost centre.",
    status: "build",
    themeIds: ["planning-forecasting"],
  },
  {
    id: "tax-compliance-agent",
    title: "Tax Compliance & Filing Agent",
    description:
      "Answers transaction-level tax queries against a searchable rulings library, reconciles indirect tax filings against the ledger entity by entity, and assembles transfer-pricing documentation from a reusable cross-market template.",
    status: "build",
    themeIds: ["tax-compliance"],
  },
  {
    id: "cash-positioning-agent",
    title: "Cash Positioning & Liquidity Agent",
    description:
      "Aggregates cash positions across every bank portal each morning, rolls them into a continuously updated 13-week liquidity forecast, and generates covenant-compliance certificates straight from that same live model.",
    status: "build",
    themeIds: ["treasury-cash"],
  },
  {
    id: "controls-testing-agent",
    title: "Controls Testing & Audit Evidence Agent",
    description:
      "Tracks open audit issues in one live queue, standardises control-testing evidence across entities, and assembles the annual SOX certification pack directly from that quarter-by-quarter evidence.",
    status: "build",
    themeIds: ["controls-audit"],
  },
];
