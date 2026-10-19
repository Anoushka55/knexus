/**
 * Data ingestion / normalization helpers, ported 1:1 from the Python
 * reference (api/index.py: CAT_KW, COL_ALIAS, normalize, _s/_n/_ni/_b,
 * _norm_cat/_norm_dep/_norm_crit, header detection, `_df`, `_parse_structured_text`,
 * `_extract_json`, `_merge_tools`).
 */
import { randomUUID } from "crypto";
import type { Tool } from "./types";

export const CAT_KW: Record<string, string[]> = {
  Monitoring: ["monitor", "prometheus", "grafana", "nagios", "zabbix", "pagerduty"],
  Logging: ["log", "elk", "elasticsearch", "logstash", "kibana", "fluentd", "splunk", "sumo logic"],
  APM: ["apm", "trace", "dynatrace", "newrelic", "appdynamics", "datadog", "jaeger"],
  Security: ["security", "siem", "firewall", "iam", "pam", "crowdstrike", "qualys", "veracode", "snyk"],
  ITSM: ["itsm", "incident", "ticket", "servicenow", "jira service", "remedy"],
  Collaboration: ["collab", "slack", "teams", "confluence", "sharepoint", "zoom", "webex"],
  CRM: ["crm", "salesforce", "hubspot", "siebel", "dynamics crm"],
  ERP: ["erp", "sap", "workday", "peoplesoft"],
  BSS: ["bss", "billing", "rating", "charging"],
  OSS: ["oss", "provisioning", "network inventory"],
  Network: ["network", "sdwan", "cisco", "juniper", "dns", "load balanc"],
  Cloud: ["cloud", "aws", "azure", "gcp", "terraform", "kubernetes", "k8s", "openstack"],
  Analytics: ["analytic", "bi", "tableau", "powerbi", "qlik", "looker", "data warehouse"],
  DevOps: ["devops", "ci/cd", "jenkins", "gitlab", "github actions", "sonar", "pipeline"],
  Storage: ["storage", "backup", "netapp", "commvault", "s3"],
  Database: ["database", "postgres", "mysql", "mongodb", "redis", "oracle db", "sql server"],
  AI: [
    "openai",
    "copilot",
    "claude",
    "llm",
    "genai",
    "chatgpt",
    "gemini",
    "sagemaker",
    "vertex ai",
    "bedrock",
    "hugging face",
    "mlflow",
    "datarobot",
    "h2o",
    "weights and biases",
    "ai/ml",
    "machine learning",
    "ai platform",
    "midjourney",
    "stability ai",
    "cohere",
    "perplexity",
    "glean",
    "writer",
    "anthropic",
    "langchain",
    "langsmith",
    "azure openai",
  ],
};

export const COL_ALIAS: Record<string, string> = {
  tool_name: "name",
  application: "name",
  app_name: "name",
  platform: "name",
  tool: "name",
  vendor_name: "vendor",
  supplier: "vendor",
  tool_category: "category",
  type: "category",
  annual_license_cost: "annual_cost",
  cost_usd: "annual_cost",
  annual_spend: "annual_cost",
  cost: "annual_cost",
  users: "user_count",
  num_users: "user_count",
  license_count: "user_count",
  active_users: "user_count",
  team: "business_unit",
  department: "business_unit",
  tool_owner: "owner",
  contact: "owner",
  environment: "deployment",
  hosting: "deployment",
  integration_count: "integrations",
  age: "age_years",
  eol: "end_of_life",
  deprecated: "end_of_life",
  application_name: "name",
  product_name: "name",
  product: "name",
  system_name: "name",
  system: "name",
  software: "name",
  solution: "name",
  service_name: "name",
  service: "name",
  asset_name: "name",
  asset: "name",
  technology: "name",
  tech_name: "name",
  component: "name",
  total_cost: "annual_cost",
  yearly_cost: "annual_cost",
  license_cost: "annual_cost",
  license_fee: "annual_cost",
  subscription_cost: "annual_cost",
  subscription: "annual_cost",
  spend: "annual_cost",
  budget: "annual_cost",
  annual_budget: "annual_cost",
  contract_value: "annual_cost",
  contract_cost: "annual_cost",
  software_cost: "annual_cost",
  tool_cost: "annual_cost",
  app_cost: "annual_cost",
  application_cost: "annual_cost",
  platform_cost: "annual_cost",
  cost_per_year: "annual_cost",
  yearly_spend: "annual_cost",
  annual_expenditure: "annual_cost",
  expenditure: "annual_cost",
  annual_fee: "annual_cost",
  annual_price: "annual_cost",
  price_per_year: "annual_cost",
  yearly_fee: "annual_cost",
  yearly_license: "annual_cost",
  annual_licence: "annual_cost",
  licence_cost: "annual_cost",
  licence_fee: "annual_cost",
  annual_licence_cost: "annual_cost",
  saas_cost: "annual_cost",
  saas_spend: "annual_cost",
  software_spend: "annual_cost",
  it_cost: "annual_cost",
  technology_cost: "annual_cost",
  tech_cost: "annual_cost",
  cost_usd_annual: "annual_cost",
  usd_annual: "annual_cost",
  annual_value: "annual_cost",
  total_annual_spend: "annual_cost",
  total_spend: "annual_cost",
  total_annual_fee: "annual_cost",
  annual_cost_usd: "annual_cost",
  total_cost_usd: "annual_cost",
  cost_in_usd: "annual_cost",
  annual_spend_usd: "annual_cost",
  spend_usd: "annual_cost",
  annual_license_cost_usd: "annual_cost",
  license_cost_usd: "annual_cost",
  seats: "user_count",
  licenses: "user_count",
  headcount: "user_count",
  tool_type: "category",
  app_type: "category",
  manufacturer: "vendor",
  provider: "vendor",
  publisher: "vendor",
  oem: "vendor",
  years_in_use: "age_years",
  tool_age: "age_years",
  implementation_year: "age_years",
  number_of_integrations: "integrations",
  num_integrations: "integrations",
  api_count: "integrations",
  pain_points: "pain_points",
  pain_point: "pain_points",
  challenges: "pain_points",
  issues: "pain_points",
  problems: "pain_points",
  concerns: "pain_points",
  notes: "pain_points",
  observations: "pain_points",
  remarks: "pain_points",
  it_budget: "it_budget",
  technology_budget: "it_budget",
  tech_budget: "it_budget",
  annual_it_budget: "it_budget",
  total_it_budget: "it_budget",
  it_spend: "it_budget",
  annual_technology_budget: "it_budget",
  total_technology_budget: "it_budget",
  tool_platform: "name",
  tool_application: "name",
  tool_app: "name",
  tool_name_platform: "name",
  app_platform: "name",
  application_platform: "name",
  tool_or_application: "name",
  tool_and_platform: "name",
  platform_tool: "name",
  application_tool: "name",
  purpose: "description",
  objective: "description",
  summary: "description",
  tool_purpose: "description",
  function: "description",
  functionality: "description",
  priority: "criticality",
  severity: "criticality",
  risk_level: "criticality",
  importance: "criticality",
  tier: "criticality",
  sub_category: "subcategory",
  subcategory: "subcategory",
  sub_type: "subcategory",
  action: "rationalization_action",
  action_time: "rationalization_action",
  time_action: "rationalization_action",
  recommendation: "rationalization_action",
  decision: "rationalization_action",
  disposition: "rationalization_action",
  open_source: "end_of_life",
  open_source_id: "end_of_life",
  alternatives: "pain_points",
  alternative_tools: "pain_points",
  suggested_replacement: "pain_points",
};

const _HDR_KW = new Set([
  "name",
  "tool",
  "application",
  "app",
  "vendor",
  "category",
  "type",
  "cost",
  "spend",
  "users",
  "user",
  "criticality",
  "deployment",
  "age",
  "integrations",
  "eol",
  "end_of_life",
  "description",
  "owner",
  "business_unit",
  "platform",
  "product",
  "system",
  "service",
  "asset",
  "software",
  "solution",
  "technology",
  "component",
  "annual",
  "license",
  "licence",
  "contract",
  "subscription",
  "environment",
  "hosting",
]);

function slug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normCat(raw: string): string {
  const low = raw.toLowerCase();
  for (const [c, kws] of Object.entries(CAT_KW)) {
    if (kws.some((k) => low.includes(k))) return c;
  }
  return raw.trim() || "Other";
}

export function normDep(raw: string): string | null {
  const low = raw.toLowerCase();
  if (["cloud", "saas", "paas", "iaas"].some((x) => low.includes(x))) return "Cloud";
  if (["on-prem", "onprem", "premise"].some((x) => low.includes(x))) return "On-Prem";
  if (low.includes("hybrid")) return "Hybrid";
  return raw || null;
}

export function normCrit(v: unknown): string | null {
  if (!v) return null;
  const x = String(v).toLowerCase();
  if (x.includes("critical")) return "Critical";
  if (x.includes("high")) return "High";
  if (x.includes("med")) return "Medium";
  if (x.includes("low")) return "Low";
  return String(v);
}

export function s(v: unknown): string {
  if (v === null || v === undefined) return "";
  const str = String(v).trim();
  return ["nan", "none", "null", "n/a"].includes(str.toLowerCase()) ? "" : str;
}

export function n(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  let str = String(v).trim().replace(/[,$£€\s]/g, "");
  if (!str || ["nan", "none", "null", "n/a", "-", ""].includes(str.toLowerCase())) return null;
  const m = str.match(/^(-?[\d.]+)\s*([KkMmBb]?)$/);
  if (m) {
    const num = parseFloat(m[1]);
    const suffix = m[2].toUpperCase();
    const mult = suffix === "K" ? 1_000 : suffix === "M" ? 1_000_000 : suffix === "B" ? 1_000_000_000 : 1;
    return num * mult;
  }
  const f = parseFloat(str);
  return Number.isNaN(f) ? null : f;
}

export function ni(v: unknown): number | null {
  const x = n(v);
  return x === null ? null : Math.trunc(x);
}

export function b(v: unknown): boolean {
  return ["true", "yes", "1", "y", "eol", "deprecated", "end of life"].includes(
    String(v).toLowerCase().trim(),
  );
}

export function normalize(d: Record<string, unknown>): Tool {
  const painRaw = s(d.pain_points);
  const t: Tool = {
    id: randomUUID(),
    name: s(d.name || d.tool_name) || "Unknown Tool",
    vendor: s(d.vendor) || null,
    category: normCat(s(d.category || "")),
    description: s(d.description) || null,
    owner: s(d.owner) || null,
    business_unit: s(d.business_unit) || null,
    annual_cost: n(d.annual_cost),
    user_count: ni(d.user_count),
    license_type: s(d.license_type) || null,
    deployment: normDep(s(d.deployment || "")),
    criticality: normCrit(d.criticality),
    integrations: ni(d.integrations),
    age_years: n(d.age_years),
    end_of_life: b(d.end_of_life ?? false),
    compliance_required: b(d.compliance_required ?? false),
    pain_points: painRaw || null,
  };
  return t;
}

/** Keywords used to detect which row is actually the header in a headerless sheet dump. */
export function detectHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(8, rows.length); i++) {
    const cells = rows[i]
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
      .map((v) => slug(String(v)));
    const hits = cells.filter((c) => [..._HDR_KW].some((kw) => c.includes(kw))).length;
    if (hits >= 2) return i;
  }
  return 0;
}

const _HDR_NAMES = new Set([
  "tool name",
  "tool_name",
  "application name",
  "application",
  "name",
  "tool",
  "platform",
  "product name",
  "product",
  "system name",
  "system",
  "service name",
  "service",
  "asset name",
  "asset",
  "software",
  "solution",
  "component",
  "technology",
  "tech name",
  "app name",
  "app",
  "vendor",
  "category",
  "type",
  "column",
  "field",
  "header",
  "item",
  "entry",
  "record",
  "description",
  "cost",
  "annual cost",
  "users",
  "user count",
  "criticality",
  "deployment",
  "tool / application",
  "application / tool",
  "tools",
  "applications",
  "tool or application",
  "s.no",
  "s.no.",
  "sr.no",
  "sr.no.",
  "no.",
  "#",
  "sl no",
  "serial no",
  "serial number",
  "index",
]);

const COST_KW = ["cost", "spend", "price", "expenditure", "licence", "license", "fee", "value", "contract", "subscription", "budget"];
const COST_SKIP = ["it_budget", "technology_budget", "tech_budget", "score", "rating", "fit", "rank", "grade", "level", "index"];
const NAME_PREF = ["tool", "app", "platform", "product", "system", "service", "software", "solution", "asset", "component", "technology"];

/**
 * Turns an array of row objects (keyed by raw header strings) into normalized
 * Tool records, applying the same column-alias / fuzzy-detection heuristics
 * as the Python `_df()` helper.
 */
export function rowsToTools(rows: Record<string, unknown>[]): { tools: Tool[]; detectedBudget: number | null } {
  if (!rows.length) return { tools: [], detectedBudget: null };

  const rawCols = Object.keys(rows[0]);
  const colMap = new Map<string, string>(); // slugged -> original
  for (const c of rawCols) colMap.set(slug(c), c);

  // Detect org-level IT budget before renaming
  let detectedBudget: number | null = null;
  for (const [slugged, orig] of colMap) {
    if (COL_ALIAS[slugged] === "it_budget") {
      for (const r of rows) {
        const v = r[orig];
        if (v !== null && v !== undefined && s(v)) {
          detectedBudget = n(v);
          break;
        }
      }
      break;
    }
  }

  // Build renamed rows (slugged + aliased column name -> value)
  const renamed: Record<string, unknown>[] = rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [slugged, orig] of colMap) {
      const target = COL_ALIAS[slugged] ?? slugged;
      if (out[target] === undefined || out[target] === null || out[target] === "") {
        out[target] = r[orig];
      }
    }
    return out;
  });

  const slugCols = [...colMap.keys()];

  // Fuzzy fallback: detect annual_cost column if not mapped
  if (!slugCols.map((c) => COL_ALIAS[c] ?? c).includes("annual_cost")) {
    const candidates = slugCols.filter(
      (c) => COST_KW.some((kw) => c.includes(kw)) && !COST_SKIP.some((sk) => c.includes(sk)),
    );
    const evalCostCol = (cand: string, minMax?: number) => {
      const orig = colMap.get(cand)!;
      const vals = rows.map((r) => n(r[orig])).filter((v): v is number => v !== null);
      if (!vals.length) return false;
      if (minMax !== undefined && Math.max(...vals) <= minMax) return false;
      return true;
    };
    const picked = candidates.find((c) => evalCostCol(c, 100)) ?? candidates.find((c) => evalCostCol(c));
    if (picked) {
      const orig = colMap.get(picked)!;
      for (let i = 0; i < rows.length; i++) renamed[i].annual_cost = rows[i][orig];
    }
  }

  // Fallback: detect name column if not found
  if (!slugCols.map((c) => COL_ALIAS[c] ?? c).includes("name")) {
    const SKIP = new Set([
      "vendor", "category", "description", "subcategory", "owner", "business_unit",
      "deployment", "criticality", "license_type", "end_of_life", "compliance_required",
      "pain_points", "rationalization_action", "purpose", "priority",
    ]);
    const strCols = slugCols.filter((c) => {
      const target = COL_ALIAS[c] ?? c;
      if (SKIP.has(target)) return false;
      const orig = colMap.get(c)!;
      return rows.some((r) => typeof r[orig] === "string");
    });
    if (strCols.length) {
      const nunique = (c: string) => {
        const orig = colMap.get(c)!;
        return new Set(rows.map((r) => r[orig])).size;
      };
      const preferred = strCols.filter((c) => NAME_PREF.some((kw) => c.includes(kw)));
      const pool = preferred.length ? preferred : strCols;
      const best = pool.reduce((a, b2) => (nunique(b2) > nunique(a) ? b2 : a), pool[0]);
      const orig = colMap.get(best)!;
      for (let i = 0; i < rows.length; i++) renamed[i].name = rows[i][orig];
    }
  }

  const keyFields = ["name", "vendor", "annual_cost", "user_count", "category", "description", "owner", "business_unit"];
  const tools: Tool[] = [];
  for (const r of renamed) {
    if (!keyFields.some((f) => s(r[f]))) continue;
    const t = normalize(r);
    const nameLower = (t.name || "").toLowerCase().trim();
    if (_HDR_NAMES.has(nameLower)) continue;
    if (t.name === "Unknown Tool" && !["vendor", "annual_cost", "user_count", "description"].some((f) => (t as unknown as Record<string, unknown>)[f])) continue;
    tools.push(t);
  }
  return { tools, detectedBudget };
}

// ── Structured "Key: Value" block parser (no AI needed) ───────────────────

const KEY_MAP: Record<string, string> = {
  tool: "name",
  "tool name": "name",
  application: "name",
  app: "name",
  vendor: "vendor",
  provider: "vendor",
  manufacturer: "vendor",
  category: "category",
  type: "category",
  "annual cost": "annual_cost",
  cost: "annual_cost",
  "annual spend": "annual_cost",
  spend: "annual_cost",
  price: "annual_cost",
  "licence cost": "annual_cost",
  "license cost": "annual_cost",
  users: "user_count",
  "user count": "user_count",
  seats: "user_count",
  criticality: "criticality",
  priority: "criticality",
  deployment: "deployment",
  hosting: "deployment",
  integrations: "integrations",
  "integration count": "integrations",
  "age years": "age_years",
  age: "age_years",
  years: "age_years",
  "end of life": "end_of_life",
  eol: "end_of_life",
  description: "description",
  notes: "description",
  "business unit": "business_unit",
  department: "business_unit",
  compliance: "compliance_required",
  "compliance required": "compliance_required",
};

export function parseStructuredText(text: string): Record<string, unknown>[] {
  const tools: Record<string, unknown>[] = [];
  let current: Record<string, unknown> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      if (current.name) {
        tools.push(current);
        current = {};
      }
      continue;
    }
    if (!line.includes(":")) continue;
    const idx = line.indexOf(":");
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    if (!val) continue;
    const mapped = KEY_MAP[key];
    if (!mapped) continue;
    if (["annual_cost", "integrations", "age_years", "user_count"].includes(mapped)) {
      const cleaned = val.replace(/[^\d.]/g, "");
      const num = parseFloat(cleaned);
      if (!Number.isNaN(num)) current[mapped] = Math.trunc(num);
    } else if (mapped === "end_of_life" || mapped === "compliance_required") {
      current[mapped] = ["true", "yes", "1", "y"].includes(val.toLowerCase());
    } else {
      current[mapped] = val;
    }
  }
  if (current.name) tools.push(current);
  return tools;
}

/** Deduplicate tools by name (case-insensitive), merging non-null fields. */
export function mergeTools<T extends { name?: string | null }>(allTools: T[]): T[] {
  const seen = new Map<string, T>();
  for (const t of allTools) {
    const key = String(t.name || "").trim().toLowerCase();
    if (!key) continue;
    if (!seen.has(key)) {
      seen.set(key, t);
    } else {
      const existing = seen.get(key)! as Record<string, unknown>;
      for (const [k, v] of Object.entries(t as Record<string, unknown>)) {
        if (v !== null && v !== undefined && (existing[k] === null || existing[k] === undefined)) {
          existing[k] = v;
        }
      }
    }
  }
  return [...seen.values()];
}

/** Extract a JSON value from a Claude response that may be wrapped in markdown fences or prose. */
export function extractJson(text: string): unknown {
  let t = text.trim();
  t = t.replace(/^```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  const idx = t.search(/[{[]/);
  if (idx > 0) t = t.slice(idx);
  try {
    return JSON.parse(t);
  } catch {
    // fix literal newlines inside string values
    const fixed = t.replace(/"(?:[^"\\]|\\.)*"/g, (m) => m.replace(/\n/g, "\\n").replace(/\r/g, ""));
    return JSON.parse(fixed);
  }
}
