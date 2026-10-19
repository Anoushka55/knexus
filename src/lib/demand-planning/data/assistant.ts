import { DemandRecord, mockOverrideLog, SKU_SEGMENTS } from "./mockData";
import { formatINR } from "../utils";

export interface AssistantResponse {
  text: string;
  details?: Array<{ label: string; value: string }>;
  navigateTo?: { label: string; href: string };
}

export const SUGGESTED_QUESTIONS = [
  "What is my top performing SKU?",
  "Which SKUs have the lowest coverage?",
  "What is driving the open exceptions right now?",
  "Show me the overall forecast accuracy trend",
  "Which root cause is most common this month?",
  "What is the agent's confidence in current recommendations?",
  "Which segment is performing best?",
];

export function answerQuestion(question: string, data: DemandRecord[]): AssistantResponse {
  const q = question.toLowerCase().trim();

  // Top performing
  if (/(top|best).*(performing|sku|product)/.test(q) || /which.*(perform|best)/.test(q)) {
    const latest = latestPeriod(data);
    const latestRecs = data.filter((r) => r.period === latest);
    const best = [...latestRecs].sort((a, b) => b.fa_pct - a.fa_pct)[0];
    if (!best) return { text: "No data available for the latest period." };
    return {
      text: `Your top-performing SKU this period is **${best.sku_name}** at **${best.depot_name}** for **${best.account_name}** with a forecast accuracy of **${best.fa_pct.toFixed(1)}%** and bias of **${best.bias_pct.toFixed(1)}%**.`,
      details: [
        { label: "Segment", value: (SKU_SEGMENTS[best.sku_id] ?? { segment: "Unknown" }).segment },
        { label: "Forecast", value: best.forecast_qty.toLocaleString("en-IN") },
        { label: "Offtake", value: best.offtake_qty.toLocaleString("en-IN") },
      ],
      navigateTo: { label: "View KPI & Demand Sensing", href: "/kpi-demand-sensing" },
    };
  }

  // Lowest coverage
  if (/(low|lowest|worst).*coverage/.test(q) || /coverage.*risk/.test(q)) {
    const latest = latestPeriod(data);
    const latestRecs = data.filter((r) => r.period === latest);
    const sorted = [...latestRecs].sort((a, b) => a.coverage_weeks - b.coverage_weeks).slice(0, 3);
    const list = sorted.map((r, i) => `${i + 1}. ${r.sku_name} at ${r.depot_name} — ${r.coverage_weeks.toFixed(1)} weeks`).join("\n");
    return {
      text: `The 3 SKU-depot combinations with the lowest stock coverage right now are:\n\n${list}\n\nThe Supply Agent recommends reviewing these for potential reallocation.`,
      navigateTo: { label: "View Coverage & Reallocation", href: "/coverage" },
    };
  }

  // Drivers of open exceptions
  if (/(driving|causing|why).*(exception|issues|problem)/.test(q) || /open exception/.test(q)) {
    const open = data.filter((r) => r.exception_status === "Open" || r.exception_status === "Escalated");
    const counts: Record<string, number> = {};
    open.forEach((r) => { counts[r.root_cause_tag] = (counts[r.root_cause_tag] ?? 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = open.length;
    const totalImpact = open.reduce((s, r) => s + r.financial_impact_inr, 0);
    if (sorted.length === 0) return { text: "No open exceptions in the current dataset." };
    return {
      text: `There are **${total} open exceptions** with total financial exposure of **${formatINR(totalImpact)}**. Root cause breakdown:\n\n${sorted.map(([rc, c]) => `• ${rc}: ${c} exceptions`).join("\n")}\n\nThe dominant driver is **${sorted[0][0]}** — likely worth investigating systemically.`,
      navigateTo: { label: "View Exception Report", href: "/exceptions" },
    };
  }

  // FA trend
  if (/forecast accuracy.*trend|fa.*trend|trend.*fa/.test(q) || /accuracy.*overall|overall.*accuracy/.test(q)) {
    const periods = Array.from(new Set(data.map((r) => r.period))).sort();
    const monthly = periods.map((p) => {
      const recs = data.filter((r) => r.period === p);
      return { p, fa: recs.reduce((s, r) => s + r.fa_pct, 0) / recs.length };
    });
    if (monthly.length < 2) return { text: "Not enough period data to compute a trend." };
    const first = monthly[0].fa;
    const last = monthly[monthly.length - 1].fa;
    const delta = last - first;
    return {
      text: `Overall forecast accuracy has moved from **${first.toFixed(1)}%** at the start of the trailing 12 months to **${last.toFixed(1)}%** in the latest period — ${delta >= 0 ? "an improvement" : "a decline"} of **${Math.abs(delta).toFixed(1)} percentage points**. ${delta < 0 ? "Worth reviewing the recent root-cause breakdown." : "The agent's recommendations appear to be working."}`,
      navigateTo: { label: "View KPI & Demand Sensing", href: "/kpi-demand-sensing" },
    };
  }

  // Most common root cause this month
  if (/(common|frequent).*root cause/.test(q) || /root cause.*month/.test(q)) {
    const latest = latestPeriod(data);
    const latestRecs = data.filter((r) => r.period === latest && r.root_cause_tag !== "None");
    const counts: Record<string, number> = {};
    latestRecs.forEach((r) => { counts[r.root_cause_tag] = (counts[r.root_cause_tag] ?? 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return { text: "No exceptions have been flagged in the latest period yet." };
    return {
      text: `The most common root cause in ${latest} is **${sorted[0][0]}** (${sorted[0][1]} exceptions). Full breakdown:\n\n${sorted.map(([rc, c]) => `• ${rc}: ${c}`).join("\n")}`,
      navigateTo: { label: "View Exception Report", href: "/exceptions" },
    };
  }

  // Confidence
  if (/confidence|how confident|sure|certain/.test(q)) {
    const open = data.filter((r) => (r.exception_status === "Open" || r.exception_status === "Escalated") && r.rca_confidence_pct > 0);
    if (open.length === 0) return { text: "No open exceptions to evaluate confidence on." };
    const avg = open.reduce((s, r) => s + r.rca_confidence_pct, 0) / open.length;
    const validated = mockOverrideLog.filter((o) => o.outcome_validated === true).length;
    const total = mockOverrideLog.filter((o) => o.outcome_validated !== null).length;
    return {
      text: `Average confidence across the **${open.length} open exceptions** is **${avg.toFixed(0)}%**. This is computed from the agent's historical validation rate — to date, **${validated}/${total}** of the agent's past recommendations have been validated by actual outcomes (${Math.round((validated / total) * 100)}% validation rate). Confidence updates after every approve/reject decision.`,
      navigateTo: { label: "View Learning Dashboard", href: "/learning" },
    };
  }

  // Segment performance
  if (/segment|stable|seasonal|erratic|new sku/.test(q)) {
    const latest = latestPeriod(data);
    const latestRecs = data.filter((r) => r.period === latest);
    const segPerf: Record<string, { fa: number; count: number }> = {};
    latestRecs.forEach((r) => {
      const seg = (SKU_SEGMENTS[r.sku_id] ?? { segment: "Unknown" }).segment;
      if (!segPerf[seg]) segPerf[seg] = { fa: 0, count: 0 };
      segPerf[seg].fa += r.fa_pct;
      segPerf[seg].count += 1;
    });
    const ranked = Object.entries(segPerf)
      .map(([s, v]) => ({ s, avg: v.fa / v.count, count: v.count }))
      .sort((a, b) => b.avg - a.avg);
    if (ranked.length === 0) return { text: "No segment data available." };
    return {
      text: `Segment performance (forecast accuracy by demand pattern) in ${latest}:\n\n${ranked.map((r) => `• **${r.s}**: ${r.avg.toFixed(1)}% (${r.count} records)`).join("\n")}\n\nThe best-performing segment is **${ranked[0].s}**, as expected — these are the most predictable SKUs.`,
      navigateTo: { label: "View KPI & Demand Sensing", href: "/kpi-demand-sensing" },
    };
  }

  // Specific SKU lookup
  for (const r of data) {
    if (q.includes(r.sku_name.toLowerCase()) || q.includes(r.sku_id.toLowerCase())) {
      const latest = latestPeriod(data);
      const rec = data.find((rr) => rr.sku_id === r.sku_id && rr.period === latest);
      if (!rec) continue;
      const seg = SKU_SEGMENTS[r.sku_id];
      return {
        text: `**${r.sku_name}** — ${seg?.segment ?? "Unknown"} segment.\n\nLatest period (${rec.period}): FA ${rec.fa_pct.toFixed(1)}%, Bias ${rec.bias_pct.toFixed(1)}%, Coverage ${rec.coverage_weeks.toFixed(1)} weeks.\n\n${seg?.rationale ?? ""}`,
        navigateTo: { label: "View Exception Report", href: "/exceptions" },
      };
    }
  }

  return {
    text: `I can help with questions about forecast accuracy, bias, exceptions, coverage, root causes, segments, and individual SKUs. Try one of the suggested questions on the left, or rephrase your question — e.g. "what is the bias for Ultra-Hydrate 500ml" or "which segment has the most exceptions".`,
  };
}

function latestPeriod(data: DemandRecord[]): string {
  return [...data].map((r) => r.period).sort().pop() ?? "";
}
