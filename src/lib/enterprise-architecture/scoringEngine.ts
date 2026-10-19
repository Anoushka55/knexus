/**
 * Faithful TypeScript port of utils/scoring_engine.py from the source
 * ea-ai-agent FastAPI app. Pure, deterministic — no AI calls — so it is
 * safe to run both server-side (in the /time/ingest and /time/full API
 * routes) and, if ever needed, client-side for instant preview.
 */
import type { Application, RationalizationAction, TimeClassification, ToolScores } from "./types";

export const CATEGORY_BASE_VALUE: Record<string, number> = {
  BSS: 9.0,
  OSS: 9.0,
  CRM: 8.5,
  ERP: 8.5,
  Security: 8.5,
  Network: 8.0,
  Database: 8.0,
  Cloud: 7.5,
  Analytics: 7.5,
  ITSM: 7.0,
  Monitoring: 6.5,
  Logging: 6.5,
  APM: 6.5,
  DevOps: 6.0,
  Collaboration: 5.5,
  Storage: 6.0,
  Other: 4.5,
};

export const CRITICALITY_MODIFIER: Record<string, number> = {
  Critical: 2.0,
  High: 1.0,
  Medium: 0.0,
  Low: -1.5,
};

export const TIER1_VENDORS = new Set([
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
  "vmware",
  "palo alto",
  "crowdstrike",
  "zscaler",
  "elastic",
]);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

function businessValue(tool: Application): number {
  const base = CATEGORY_BASE_VALUE[tool.category ?? "Other"] ?? 4.5;
  const mod = tool.criticality ? CRITICALITY_MODIFIER[tool.criticality] ?? 0.0 : 0.0;
  return round2(clamp(base + mod, 0, 10));
}

function adoptionRate(tool: Application): number {
  const users = tool.user_count ?? 0;
  if (users === 0) return 5.0;
  if (users >= 2000) return 9.5;
  if (users >= 1000) return 9.0;
  if (users >= 500) return 8.0;
  if (users >= 200) return 7.0;
  if (users >= 100) return 6.0;
  if (users >= 50) return 5.0;
  if (users >= 20) return 4.0;
  if (users >= 10) return 3.0;
  return 2.0;
}

function integrationDepth(tool: Application): number {
  const integrations = tool.integrations ?? 0;
  if (integrations === 0) return 5.0;
  if (integrations >= 25) return 9.5;
  if (integrations >= 15) return 8.5;
  if (integrations >= 10) return 7.5;
  if (integrations >= 5) return 6.5;
  if (integrations >= 3) return 5.5;
  return 4.0;
}

function vendorSupport(tool: Application): number {
  if (tool.end_of_life) return 1.0;
  const vendor = (tool.vendor ?? "").toLowerCase();
  for (const v of TIER1_VENDORS) {
    if (vendor.includes(v)) return 8.5;
  }
  if (vendor) return 6.5;
  return 5.0;
}

function costEfficiency(tool: Application): number {
  const cost = tool.annual_cost ?? 0;
  const users = Math.max(tool.user_count ?? 1, 1);
  if (cost === 0) return 5.0;
  const cpu = cost / users;
  if (cpu < 50) return 9.5;
  if (cpu < 200) return 8.5;
  if (cpu < 500) return 7.5;
  if (cpu < 1000) return 6.0;
  if (cpu < 3000) return 4.5;
  if (cpu < 8000) return 3.0;
  if (cpu < 20000) return 1.5;
  return 0.5;
}

function technicalHealth(tool: Application): number {
  if (tool.end_of_life) return 1.0;
  const age = tool.age_years ?? 0;
  if (age === 0) return 6.0;
  if (age <= 1) return 9.5;
  if (age <= 3) return 8.5;
  if (age <= 5) return 7.0;
  if (age <= 8) return 5.5;
  if (age <= 12) return 3.5;
  if (age <= 15) return 2.5;
  return 1.5;
}

function riskScore(tool: Application): number {
  let risk = 4.0;
  if (tool.end_of_life) risk += 3.5;
  if (tool.compliance_required) risk += 1.0;
  const age = tool.age_years ?? 0;
  if (age > 12) risk += 2.0;
  else if (age > 8) risk += 1.0;
  if (tool.criticality === "Critical") risk += 0.5;
  const integrations = tool.integrations ?? 0;
  if (integrations >= 20) risk += 1.0;
  else if (integrations >= 10) risk += 0.5;
  if (!(tool.vendor ?? "").trim()) risk += 0.5;
  return round2(clamp(risk, 0, 10));
}

export function scoreTool(tool: Application): ToolScores {
  return {
    business_value: businessValue(tool),
    adoption_rate: adoptionRate(tool),
    integration_depth: integrationDepth(tool),
    vendor_support: vendorSupport(tool),
    cost_efficiency: costEfficiency(tool),
    technical_health: technicalHealth(tool),
    risk_score: riskScore(tool),
  };
}

export function compositeScore(scores: ToolScores): number {
  const weights: Record<string, number> = {
    business_value: 0.25,
    adoption_rate: 0.15,
    integration_depth: 0.15,
    vendor_support: 0.15,
    cost_efficiency: 0.15,
    technical_health: 0.15,
  };
  let weighted = 0;
  for (const [k, w] of Object.entries(weights)) {
    weighted += (scores[k as keyof ToolScores] ?? 5.0) * w;
  }
  const risk = scores.risk_score ?? 5.0;
  const penalty = Math.max(0.0, (risk - 5.0) * 0.15);
  return round2(clamp(weighted - penalty, 0, 10));
}

export function determine6rAction(scores: ToolScores, tool: Application): RationalizationAction {
  const composite = compositeScore(scores);
  const risk = scores.risk_score ?? 5.0;
  const adoption = scores.adoption_rate ?? 5.0;
  const costEff = scores.cost_efficiency ?? 5.0;
  const tech = scores.technical_health ?? 5.0;
  const eol = !!tool.end_of_life;
  const deployment = (tool.deployment ?? "").toLowerCase();

  if (eol || composite < 2.5) return "Retire";
  if (composite < 3.5 && adoption < 3.0) return "Retire";
  if (composite < 4.5 && costEff < 3.0) return "Replace";
  if (risk >= 8.5 && composite < 6.0) return "Replace";
  if (composite >= 7.5 && risk <= 4.0) return "Retain";
  if (composite >= 6.5 && risk <= 5.0) return "Retain";
  if (composite >= 6.0 && deployment.includes("on-prem") && tech >= 5.0) return "Rehost";
  if (composite >= 5.5 && tech < 5.5) return "Replatform";
  if (composite >= 4.0 && tech < 4.5) return "Refactor";
  if (composite >= 6.0) return "Retain";
  return "Replatform";
}

export function determineTimeClassification(scores: ToolScores): TimeClassification {
  const bv = scores.business_value ?? 5.0;
  const th = scores.technical_health ?? 5.0;
  if (bv >= 5.0 && th >= 5.0) return "Invest";
  if (bv >= 5.0) return "Tolerate";
  if (th >= 5.0) return "Migrate";
  return "Eliminate";
}

export function confidenceLevel(tool: Application): "High" | "Medium" | "Low" {
  const fields: Array<keyof Application> = [
    "annual_cost",
    "user_count",
    "criticality",
    "vendor",
    "integrations",
    "age_years",
    "deployment",
  ];
  const known = fields.filter((f) => tool[f] !== null && tool[f] !== undefined).length;
  if (known >= 5) return "High";
  if (known >= 3) return "Medium";
  return "Low";
}

/** Runs the full scoring pipeline over a single already-normalized tool. */
export function scoreApplication(tool: Application): Application {
  const scores = scoreTool(tool);
  const composite = compositeScore(scores);
  return {
    ...tool,
    scores,
    composite_score: composite,
    rationalization_action: determine6rAction(scores, tool),
    time_classification: determineTimeClassification(scores),
    confidence_level: confidenceLevel(tool),
  };
}
