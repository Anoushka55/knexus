// ============================================================================
// Agent Tracker — weekly task schedule with dynamic status from app state
// ============================================================================

import { mockDemandData } from "./mockData";
import { getCollabSummary } from "./forecastCollabData";

export type TaskStatus = "Done" | "In Progress" | "Pending" | "Blocked";

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  week: 1 | 2 | 3 | 4;
  status: TaskStatus;
  blockerReason?: string;
  relatedPage?: string;
}

export interface WeekSummary {
  total: number;
  done: number;
  inProgress: number;
  pending: number;
  blocked: number;
}

// ─── derive dynamic state from app data ──────────────────────────────────────

function computeDynamicState() {
  // Open / escalated exceptions (ignore records with no root cause)
  const openExceptionRecords = mockDemandData.filter(
    (r) =>
      (r.exception_status === "Open" || r.exception_status === "Escalated") &&
      r.root_cause_tag !== "None"
  );
  const openExceptionSkuCount = new Set(openExceptionRecords.map((r) => r.sku_id)).size;

  // Low-coverage SKUs in the latest period
  const periods = Array.from(new Set(mockDemandData.map((r) => r.period))).sort();
  const latestP = periods[periods.length - 1] ?? "";
  const latestRecords = mockDemandData.filter((r) => r.period === latestP);
  const lowCoverageSkuCount = new Set(
    latestRecords.filter((r) => r.coverage_weeks < 2).map((r) => r.sku_id)
  ).size;

  // Forecast collab submission state
  const collabSummary = getCollabSummary();
  const totalOwners = collabSummary.length;
  const completeOwners = collabSummary.filter((s) => s.status === "Complete").length;
  const pendingOwners = collabSummary.filter((s) => s.status === "In Progress");
  const totalSkus = 15; // total SKUs in scope
  const submittedSkus = collabSummary.reduce((s, o) => s + o.submitted_count, 0);

  return {
    openExceptionSkuCount,
    lowCoverageSkuCount,
    totalOwners,
    completeOwners,
    pendingOwners,
    totalSkus,
    submittedSkus,
  };
}

// ─── task catalogue ──────────────────────────────────────────────────────────

export function getWeeklyTasks(): AgentTask[] {
  const {
    openExceptionSkuCount,
    lowCoverageSkuCount,
    totalOwners,
    completeOwners,
    pendingOwners,
    totalSkus,
    submittedSkus,
  } = computeDynamicState();

  // ── WEEK 1 — forecast import & distribution ────────────────────────────
  const week1: AgentTask[] = [
    {
      id: "w1-t1",
      title: "Import statistical forecast",
      description: `Statistical model generated on 3 Jun 2026. ${totalSkus} SKUs across all brands imported and validated.`,
      week: 1,
      status: "Done",
      relatedPage: "/forecast-collaboration",
    },
    {
      id: "w1-t2",
      title: "Distribute forecasts to brand owners",
      description: `Forecast packs shared with all ${totalOwners} brand owners. Submission window opened.`,
      week: 1,
      status: "Done",
      relatedPage: "/forecast-collaboration",
    },
    {
      id: "w1-t3",
      title: "Sync inventory data",
      description:
        "WMS sync complete. Depot-level stock positions updated for Mumbai, Delhi and Bangalore.",
      week: 1,
      status: "Done",
      relatedPage: "/coverage",
    },
  ];

  // ── WEEK 2 — adjustments & exception triage ───────────────────────────
  const collabStatus: TaskStatus =
    completeOwners === totalOwners ? "Done" : "In Progress";

  const pendingOwnerNames = pendingOwners.map((o) => o.owner_name);

  const week2: AgentTask[] = [
    {
      id: "w2-t1",
      title: "Send adjustment reminders",
      description: `Reminders dispatched to all ${totalOwners} brand owners. ${completeOwners} of ${totalOwners} have submitted.`,
      week: 2,
      status: "Done",
    },
    {
      id: "w2-t2",
      title: "Collect adjusted forecasts",
      description:
        collabStatus === "Done"
          ? `All ${totalOwners} owners submitted. ${submittedSkus}/${totalSkus} SKUs have owner adjustments.`
          : `${completeOwners} of ${totalOwners} owners complete (${submittedSkus}/${totalSkus} SKUs). ${pendingOwnerNames.join(" and ")} ${pendingOwnerNames.length === 1 ? "has" : "have"} pending items.`,
      week: 2,
      status: collabStatus,
      blockerReason:
        collabStatus !== "Done" && pendingOwnerNames.length > 0
          ? `Waiting on ${pendingOwnerNames.join(", ")} to submit forecast adjustments`
          : undefined,
      relatedPage: "/forecast-collaboration",
    },
    {
      id: "w2-t3",
      title: "Resolve open exceptions",
      description:
        openExceptionSkuCount === 0
          ? "All exceptions resolved or auto-closed. No open items remaining."
          : `${openExceptionSkuCount} SKU${openExceptionSkuCount !== 1 ? "s" : ""} with open or escalated exceptions. Agent has triaged and routed to approval tiers.`,
      week: 2,
      status: openExceptionSkuCount === 0 ? "Done" : "In Progress",
      relatedPage: "/exceptions",
    },
  ];

  // ── WEEK 3 — demand review & pre-read ────────────────────────────────
  const lowCoverageStatus: TaskStatus = lowCoverageSkuCount === 0 ? "Done" : "In Progress";

  const week3: AgentTask[] = [
    {
      id: "w3-t1",
      title: "Run demand review analysis",
      description:
        "FA% and Bias% trends computed for all depots and brands. Root-cause signals identified and confidence scores updated.",
      week: 3,
      status: "In Progress",
      relatedPage: "/kpi-demand-sensing",
    },
    {
      id: "w3-t2",
      title: "Review low-coverage SKUs",
      description:
        lowCoverageSkuCount === 0
          ? "All SKUs in the latest period have sufficient stock coverage (≥ 2 weeks)."
          : `${lowCoverageSkuCount} SKU${lowCoverageSkuCount !== 1 ? "s" : ""} with coverage below 2 weeks in the latest period. Reallocation recommendations generated.`,
      week: 3,
      status: lowCoverageStatus,
      relatedPage: "/coverage",
    },
    {
      id: "w3-t3",
      title: "Sync CRM & promo calendar",
      description:
        "Promo calendar updates from key accounts required before final demand review can be locked.",
      week: 3,
      status: "Blocked",
      blockerReason:
        "Promo calendar upload from Reliance Retail delayed — expected by EOD 15 Jun",
      relatedPage: "/data-health",
    },
    {
      id: "w3-t4",
      title: "Generate governance pre-read",
      description:
        "S&OP pre-read pack will be auto-compiled once demand review analysis and all adjustments are finalised.",
      week: 3,
      status: "Pending",
      relatedPage: "/governance",
    },
  ];

  // ── WEEK 4 — consensus & distribution ────────────────────────────────
  const week4: AgentTask[] = [
    {
      id: "w4-t1",
      title: "Compile consensus forecast",
      description:
        "Merge statistical baseline with owner adjustments. Produce SKU-level consensus for the governance pack.",
      week: 4,
      status: "Pending",
      relatedPage: "/forecast-collaboration",
    },
    {
      id: "w4-t2",
      title: "Update learning dashboard",
      description:
        "Re-compute agent confidence scores from approved / rejected / escalated decisions in the review cycle.",
      week: 4,
      status: "Pending",
      relatedPage: "/learning",
    },
    {
      id: "w4-t3",
      title: "Distribute governance pack",
      description:
        "Once approved by a planner, the S&OP pre-read is distributed to all stakeholders automatically.",
      week: 4,
      status: "Pending",
      relatedPage: "/governance",
    },
  ];

  return [...week1, ...week2, ...week3, ...week4];
}

// ─── per-week summary ─────────────────────────────────────────────────────────

export function getWeekSummary(week: 1 | 2 | 3 | 4): WeekSummary {
  const tasks = getWeeklyTasks().filter((t) => t.week === week);
  return {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "Done").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    pending: tasks.filter((t) => t.status === "Pending").length,
    blocked: tasks.filter((t) => t.status === "Blocked").length,
  };
}

// ─── overall cycle summary (for AgentInsightCard) ────────────────────────────

export function getCycleSummary() {
  const tasks = getWeeklyTasks();
  const done = tasks.filter((t) => t.status === "Done").length;
  const blocked = tasks.filter((t) => t.status === "Blocked").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  return { total: tasks.length, done, blocked, inProgress };
}

// ─── current week from day of month ──────────────────────────────────────────

export function currentWeekNumber(): 1 | 2 | 3 | 4 {
  const day = new Date().getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}
