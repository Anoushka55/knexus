// Finance shared services — Procure to Pay.
// Baseline effort is per invoice. Benchmark modes are the KPMG outside-in
// default per ERP landscape: what is *normally* true, before the client
// corrects it in the room.
//
// These figures are illustrative engagement experience, not a published
// benchmark study. Treat them as a starting position to be argued with.

import type {
  Activity,
  ExecutionMode,
  Landscape,
  LandscapeId,
  ProcessModel,
} from "@/lib/assessment/types";

const M: ExecutionMode = "manual";
const D: ExecutionMode = "digitized";
const A: ExecutionMode = "automated";
// No landscape ships an AI-native default, so there is deliberately no "ai" alias here.

/** Compact benchmark row: sap, sap+hyperion, oracle+hyperion, hyperion+dynamics, tally, other. */
function bm(
  sap: ExecutionMode,
  sapHyp: ExecutionMode,
  oraHyp: ExecutionMode,
  hypDyn: ExecutionMode,
  tally: ExecutionMode,
  other: ExecutionMode
): Record<LandscapeId, ExecutionMode> {
  return {
    sap,
    "sap-hyperion": sapHyp,
    "oracle-hyperion": oraHyp,
    "hyperion-dynamics": hypDyn,
    tally,
    other,
  };
}

export const landscapes: Landscape[] = [
  { id: "sap", label: "SAP (S/4 + VIM / Ariba)", note: "Most automated starting point" },
  { id: "sap-hyperion", label: "SAP + Hyperion", note: "ERP strong, reporting bolted on" },
  { id: "oracle-hyperion", label: "Oracle + Hyperion", note: "Common in telecom shared services" },
  { id: "hyperion-dynamics", label: "Hyperion + MS Dynamics", note: "Mid-market consolidation" },
  { id: "tally", label: "Tally", note: "Largely manual, entity-level" },
  { id: "other", label: "Other / mixed estate", note: "Assume little is automated" },
];

const stages = [
  { id: "capture", label: "Receipt & Capture" },
  { id: "matching", label: "Matching & Validation" },
  { id: "approval", label: "Approval & Coding" },
  { id: "payment", label: "Payment" },
  { id: "reporting", label: "Reconciliation & Reporting" },
];

const activities: Activity[] = [
  // ---- Receipt & Capture ----
  {
    id: "receive-invoice",
    stageId: "capture",
    label: "Receive invoice (email, portal, paper)",
    baselineMinutes: 8,
    benchmark: bm(A, A, D, D, M, M),
    ceiling: "automated",
    drivers: ["Channel fragmentation", "Paper volume"],
    agentIds: ["invoice-capture-agent"],
    challengeIds: ["ch-manual-keying"],
  },
  {
    id: "extract-data",
    stageId: "capture",
    label: "Extract header and line data",
    baselineMinutes: 15,
    benchmark: bm(A, D, D, D, M, M),
    ceiling: "ai",
    drivers: ["Line-item count", "Vendor format variance"],
    agentIds: ["invoice-capture-agent"],
    challengeIds: ["ch-manual-keying", "ch-capex-lines"],
  },
  {
    id: "validate-vendor",
    stageId: "capture",
    label: "Validate against vendor master",
    baselineMinutes: 6,
    benchmark: bm(A, A, D, D, D, M),
    ceiling: "automated",
    drivers: ["Vendor master hygiene"],
    agentIds: ["invoice-capture-agent"],
    challengeIds: ["ch-manual-keying"],
  },

  // ---- Matching & Validation ----
  {
    id: "po-match",
    stageId: "matching",
    label: "2-way / 3-way PO match",
    baselineMinutes: 18,
    benchmark: bm(A, A, A, D, M, M),
    ceiling: "automated",
    drivers: ["PO coverage", "Partial receipting", "Tolerance rules"],
    agentIds: ["exception-triage-agent"],
    challengeIds: ["ch-po-coverage", "ch-capex-lines"],
  },
  {
    id: "exception-id",
    stageId: "matching",
    label: "Exception identification (price, qty, tax variance)",
    baselineMinutes: 14,
    benchmark: bm(D, D, M, M, M, M),
    ceiling: "ai",
    drivers: ["Exception rate", "Tolerance design"],
    agentIds: ["exception-triage-agent"],
    challengeIds: ["ch-po-coverage", "ch-credit-notes"],
  },
  {
    id: "tax-check",
    stageId: "matching",
    label: "Tax and statutory compliance check",
    baselineMinutes: 10,
    benchmark: bm(A, D, D, D, M, M),
    ceiling: "ai",
    drivers: ["Multi-jurisdiction", "GST/TDS/VAT rules"],
    agentIds: ["quality-review-agent"],
    challengeIds: ["ch-month-end"],
  },

  // ---- Approval & Coding ----
  {
    id: "gl-coding",
    stageId: "approval",
    label: "GL / cost-centre coding",
    baselineMinutes: 8,
    benchmark: bm(D, D, D, D, M, M),
    ceiling: "ai",
    drivers: ["Non-PO share", "Chart of accounts depth"],
    agentIds: ["exception-triage-agent"],
    challengeIds: ["ch-po-coverage"],
  },
  {
    id: "route-approval",
    stageId: "approval",
    label: "Route for approval",
    baselineMinutes: 7,
    benchmark: bm(A, A, D, D, M, M),
    ceiling: "automated",
    drivers: ["DOA complexity"],
    agentIds: [],
    challengeIds: ["ch-approver-chase"],
  },
  {
    id: "chase-approvers",
    stageId: "approval",
    label: "Chase approvers / follow-up",
    baselineMinutes: 12,
    benchmark: bm(M, M, M, M, M, M),
    ceiling: "automated",
    drivers: ["Approver responsiveness", "Escalation design"],
    agentIds: [],
    challengeIds: ["ch-approver-chase"],
  },

  // ---- Payment ----
  {
    id: "payment-run",
    stageId: "payment",
    label: "Payment run preparation",
    baselineMinutes: 6,
    benchmark: bm(A, A, A, D, D, M),
    ceiling: "automated",
    drivers: ["Payment term spread"],
    agentIds: [],
    challengeIds: [],
  },
  {
    id: "bank-file",
    stageId: "payment",
    label: "Bank file generation and release",
    baselineMinutes: 5,
    benchmark: bm(A, A, A, A, D, M),
    ceiling: "automated",
    drivers: ["Bank connectivity"],
    agentIds: [],
    challengeIds: [],
  },

  // ---- Reconciliation & Reporting ----
  {
    id: "vendor-recon",
    stageId: "reporting",
    label: "Vendor statement reconciliation",
    baselineMinutes: 14,
    benchmark: bm(D, D, M, M, M, M),
    ceiling: "ai",
    drivers: ["Credit-note volume", "Statement format variance"],
    agentIds: ["quality-review-agent"],
    challengeIds: ["ch-credit-notes", "ch-month-end"],
  },
  {
    id: "grir-accrual",
    stageId: "reporting",
    label: "GR/IR and accrual analysis",
    baselineMinutes: 11,
    benchmark: bm(D, D, D, M, M, M),
    ceiling: "ai",
    drivers: ["Open GR/IR ageing"],
    agentIds: ["quality-review-agent"],
    challengeIds: ["ch-month-end"],
  },
  {
    id: "mis-generation",
    stageId: "reporting",
    label: "MIS / dashboard generation",
    baselineMinutes: 12,
    benchmark: bm(D, D, D, D, M, M),
    ceiling: "ai",
    drivers: ["Report count", "Manual consolidation in Hyperion"],
    agentIds: ["mis-generator-agent"],
    challengeIds: ["ch-month-end"],
  },
  {
    id: "quality-review",
    stageId: "reporting",
    label: "Quality review before submission",
    baselineMinutes: 9,
    benchmark: bm(M, M, M, M, M, M),
    ceiling: "ai",
    drivers: ["Reviewer availability", "Senior stakeholder scrutiny"],
    agentIds: ["pre-submission-review-agent"],
    challengeIds: ["ch-month-end"],
  },
];

export const p2p: ProcessModel = {
  id: "procure-to-pay",
  label: "Procure to Pay",
  unit: "invoice",
  stages,
  activities,

  // The finance analogue of "network vs service vs stores" procurement.
  variants: [
    {
      id: "po-backed",
      label: "PO-backed",
      note: "Clean three-way match candidates",
      base: 0.9,
      stageMultipliers: { matching: 0.8 },
    },
    {
      id: "non-po",
      label: "Non-PO",
      note: "Needs coding and manual approval routing",
      base: 1.2,
      stageMultipliers: { matching: 1.5, approval: 1.4 },
    },
    {
      id: "capex-project",
      label: "Capex / project",
      note: "Long line schedules, milestone billing — the hard ones",
      base: 1.6,
      stageMultipliers: { matching: 2.0, approval: 1.5, reporting: 1.4 },
    },
    {
      id: "utilities",
      label: "Utilities / recurring",
      note: "Predictable, low variance",
      base: 0.7,
      stageMultipliers: { matching: 0.6 },
    },
    {
      id: "employee-claims",
      label: "Employee claims",
      note: "High volume, low value, policy-checked",
      base: 1.0,
      stageMultipliers: { approval: 1.2 },
    },
    {
      id: "intercompany",
      label: "Intercompany",
      note: "Reconciliation-heavy across entities",
      base: 1.3,
      stageMultipliers: { reporting: 1.6 },
    },
  ],

  challenges: [
    { id: "ch-manual-keying", label: "Invoice data is keyed by hand, twice in some entities" },
    { id: "ch-capex-lines", label: "Capex invoices carry 60+ line schedules that defeat auto-matching" },
    { id: "ch-po-coverage", label: "Low PO coverage on services spend forces manual coding" },
    { id: "ch-approver-chase", label: "Approval chasing consumes most of a shift every week" },
    { id: "ch-credit-notes", label: "Credit-note and cancellation volume breaks statement reconciliation" },
    { id: "ch-month-end", label: "Reconciliation and MIS compress into a four-day month-end crunch" },
  ],

  // Named on the call: uploading, quality review, MIS generation, and the
  // review before submission to a senior stakeholder.
  agents: [
    {
      id: "invoice-capture-agent",
      title: "Invoice Capture & Upload Agent",
      description:
        "Ingests invoices from every channel, extracts header and line data, and validates against vendor master before upload.",
      status: "live",
    },
    {
      id: "exception-triage-agent",
      title: "Exception Triage Agent",
      description:
        "Classifies match failures, proposes a resolution path, and codes non-PO spend against historical precedent.",
      status: "live",
    },
    {
      id: "quality-review-agent",
      title: "Quality Review Agent",
      description:
        "Runs statutory, tax and reconciliation checks across the ledger and flags only what needs a human decision.",
      status: "live",
    },
    {
      id: "mis-generator-agent",
      title: "MIS Generation Agent",
      description:
        "Assembles month-end management reporting from the ledger and consolidation layer, with variance commentary.",
      status: "build",
    },
    {
      id: "pre-submission-review-agent",
      title: "Pre-Submission Review Agent",
      description:
        "Reviews the pack a controller is about to send upward — completeness, consistency, and the questions a CFO will ask.",
      status: "build",
    },
  ],

  // Anonymized. No client names anywhere in this app.
  proof: [
    {
      id: "proof-panafrican-ssc",
      descriptor: "Pan-African telecom group — shared services",
      blurb: "P2P cycle-time reduction across six operating companies on a single Oracle instance.",
      activityIds: ["extract-data", "po-match", "exception-id"],
    },
    {
      id: "proof-gcc-chennai",
      descriptor: "Indian telecom operator — offshore GCC",
      blurb: "Exception triage redesign on a 40k-invoice monthly run with heavy capex spend.",
      activityIds: ["exception-id", "gl-coding", "vendor-recon"],
    },
    {
      id: "proof-retail-gbs",
      descriptor: "Global consumer retailer — European GBS",
      blurb: "Invoice capture automation across eleven markets and four ERP instances.",
      activityIds: ["receive-invoice", "extract-data", "validate-vendor"],
    },
    {
      id: "proof-monthend-close",
      descriptor: "Regional infrastructure group",
      blurb: "Month-end close compression through automated reconciliation and MIS assembly.",
      activityIds: ["vendor-recon", "grir-accrual", "mis-generation", "quality-review"],
    },
  ],
};

export const processes: ProcessModel[] = [p2p];
