/**
 * Scoring engine + duplication detector, ported 1:1 from the Python
 * reference (api/index.py `score_tool`, `composite`, `action_6r`,
 * `confidence`, `apply_scores`, `detect_dups`, `_ov_score`, `_dup_rec`).
 */
import type { Duplication, RationalizationAction, Tool, ToolScores } from "./types";

export const CAT_VALUE: Record<string, number> = {
  BSS: 9,
  OSS: 9,
  CRM: 8.5,
  ERP: 8.5,
  Security: 8.5,
  Network: 8,
  Database: 8,
  Cloud: 7.5,
  Analytics: 7.5,
  AI: 8.0,
  ITSM: 7,
  Monitoring: 6.5,
  Logging: 6.5,
  APM: 6.5,
  DevOps: 6,
  Collaboration: 5.5,
  Storage: 6,
  Other: 4.5,
};

const CRIT_MOD: Record<string, number> = { Critical: 2, High: 1, Medium: 0, Low: -1.5 };

const TIER1_VND = new Set([
  "microsoft",
  "aws",
  "amazon",
  "google",
  "oracle",
  "sap",
  "salesforce",
  "servicenow",
  "splunk",
  "dynatrace",
  "datadog",
  "ibm",
  "cisco",
  "crowdstrike",
  "elastic",
  "palo alto",
]);

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function scoreTool(t: Partial<Tool>): ToolScores {
  const eol = !!t.end_of_life;
  const vnd = (t.vendor || "").toLowerCase();
  const age = t.age_years || 0;
  const u = t.user_count || 0;
  const ints = t.integrations || 0;
  const cost = t.annual_cost || 0;

  const bv = clamp((CAT_VALUE[t.category || "Other"] ?? 4.5) + (CRIT_MOD[t.criticality || ""] ?? 0), 0, 10);

  const ar = !u
    ? 5
    : u >= 2000
      ? 9.5
      : u >= 1000
        ? 9
        : u >= 500
          ? 8
          : u >= 200
            ? 7
            : u >= 100
              ? 6
              : u >= 50
                ? 5
                : u >= 20
                  ? 4
                  : u >= 10
                    ? 3
                    : 2;

  const id_ = !ints
    ? 5
    : ints >= 25
      ? 9.5
      : ints >= 15
        ? 8.5
        : ints >= 10
          ? 7.5
          : ints >= 5
            ? 6.5
            : ints >= 3
              ? 5.5
              : 4;

  const vs = eol ? 1 : [...TIER1_VND].some((v) => vnd.includes(v)) ? 8.5 : vnd ? 6.5 : 5;

  const cpu = cost ? cost / Math.max(u, 1) : 0;
  const ce = !cost
    ? 5
    : cpu < 50
      ? 9.5
      : cpu < 200
        ? 8.5
        : cpu < 500
          ? 7.5
          : cpu < 1000
            ? 6
            : cpu < 3000
              ? 4.5
              : cpu < 8000
                ? 3
                : cpu < 20000
                  ? 1.5
                  : 0.5;

  const th = eol
    ? 1
    : !age
      ? 6
      : age <= 1
        ? 9.5
        : age <= 3
          ? 8.5
          : age <= 5
            ? 7
            : age <= 8
              ? 5.5
              : age <= 12
                ? 3.5
                : age <= 15
                  ? 2.5
                  : 1.5;

  let risk = 4.0;
  if (eol) risk += 3.5;
  if (t.compliance_required) risk += 1;
  if (age > 12) risk += 2;
  else if (age > 8) risk += 1;
  if (t.criticality === "Critical") risk += 0.5;
  if (ints >= 20) risk += 1;
  else if (ints >= 10) risk += 0.5;
  if (!vnd) risk += 0.5;

  return {
    business_value: round2(bv),
    adoption_rate: round2(ar),
    integration_depth: round2(id_),
    vendor_support: round2(vs),
    cost_efficiency: round2(ce),
    technical_health: round2(th),
    risk_score: round2(clamp(risk, 0, 10)),
  };
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export function composite(scores: Partial<ToolScores>): number {
  const w: Record<string, number> = {
    business_value: 0.25,
    adoption_rate: 0.15,
    integration_depth: 0.15,
    vendor_support: 0.15,
    cost_efficiency: 0.15,
    technical_health: 0.15,
  };
  let val = 0;
  for (const [k, wt] of Object.entries(w)) {
    val += (scores[k as keyof ToolScores] ?? 5) * wt;
  }
  const risk = scores.risk_score ?? 5;
  return round2(clamp(val - Math.max(0, (risk - 5) * 0.15), 0, 10));
}

export function action6R(scores: ToolScores, t: Partial<Tool>): RationalizationAction {
  const c = composite(scores);
  const risk = scores.risk_score ?? 5;
  const dep = (t.deployment || "").toLowerCase();

  if (!!t.end_of_life || c < 2.5) return "Retire";
  if (c < 3.5 && scores.adoption_rate < 3) return "Retire";
  if (c < 4.5 && scores.cost_efficiency < 3) return "Replace";
  if (risk >= 8.5 && c < 6) return "Replace";
  if (c >= 7.5 && risk <= 4) return "Retain";
  if (c >= 6.5 && risk <= 5) return "Retain";
  if (c >= 6 && dep.includes("on-prem") && scores.technical_health >= 5) return "Rehost";
  if (c >= 5.5 && scores.technical_health < 5.5) return "Replatform";
  if (c >= 4 && scores.technical_health < 4.5) return "Refactor";
  return c >= 6 ? "Retain" : "Replatform";
}

export function confidence(t: Partial<Tool>): "High" | "Medium" | "Low" {
  const fields: (keyof Tool)[] = [
    "annual_cost",
    "user_count",
    "criticality",
    "vendor",
    "integrations",
    "age_years",
    "deployment",
  ];
  const k = fields.filter((f) => !!t[f]).length;
  return k >= 5 ? "High" : k >= 3 ? "Medium" : "Low";
}

export function applyScores(tools: Tool[]): Tool[] {
  for (const t of tools) {
    const sc = scoreTool(t);
    t.scores = sc;
    t.composite_score = composite(sc);
    t.rationalization_action = action6R(sc, t);
    t.confidence_level = confidence(t);
  }
  return tools;
}

// ── Duplication detector ────────────────────────────────────────────────

function overlapScore(a: Tool, b: Tool): number {
  let s = 0.35;
  if ((a.subcategory || "") === (b.subcategory || "") && a.subcategory) s += 0.25;
  if (
    (a.business_unit || "").toLowerCase() === (b.business_unit || "").toLowerCase() &&
    a.business_unit
  )
    s += 0.15;
  const va = (a.vendor || "").toLowerCase();
  const vb = (b.vendor || "").toLowerCase();
  if (va && vb && va !== vb) s += 0.1;
  const ua = a.user_count || 0;
  const ub = b.user_count || 0;
  if (ua && ub && Math.min(ua, ub) / Math.max(ua, ub) > 0.5) s += 0.1;
  return Math.min(1.0, s);
}

function dupRecord(a: Tool, b: Tool, ov: number, cat: string): Duplication {
  const pct = Math.round(ov * 100);
  const sa = a.composite_score ?? 5;
  const sb = b.composite_score ?? 5;
  const [ret, con] = sa >= sb ? [a, b] : [b, a];
  const ca = a.annual_cost || 0;
  const cb = b.annual_cost || 0;
  const savings = Math.round(Math.min(ca, cb) * (ov / 2));
  return {
    id: `dup-${a.id.slice(0, 8)}-${b.id.slice(0, 8)}`,
    category: cat,
    tool_a: a.name || "?",
    tool_b: b.name || "?",
    overlap_percentage: pct,
    retain_candidate: ret.name,
    consolidate_candidate: con.name,
    potential_annual_savings: savings,
    priority: pct >= 70 ? "High" : pct >= 55 ? "Medium" : "Low",
    rationale:
      `${a.name} and ${b.name} show ${pct}% functional overlap in ${cat}. ` +
      `${ret.name} is the strategic retention candidate ` +
      `(score ${Math.max(sa, sb).toFixed(1)} vs ${Math.min(sa, sb).toFixed(1)}). ` +
      `Consolidation could yield ~$${savings.toLocaleString()}/yr savings.`,
  };
}

export function detectDups(tools: Tool[]): Duplication[] {
  const byCat = new Map<string, Tool[]>();
  for (const t of tools) {
    const cat = t.category || "Other";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(t);
  }
  const dups: Duplication[] = [];
  for (const [cat, grp] of byCat) {
    for (let i = 0; i < grp.length; i++) {
      for (let j = i + 1; j < grp.length; j++) {
        const ov = overlapScore(grp[i], grp[j]);
        if (ov >= 0.45) dups.push(dupRecord(grp[i], grp[j], ov, cat));
      }
    }
  }
  return dups.sort((a, b) => b.overlap_percentage - a.overlap_percentage);
}
