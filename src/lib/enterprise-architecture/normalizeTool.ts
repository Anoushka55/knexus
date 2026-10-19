/**
 * Port of agents/time_agent.py's `_normalize_tool`. Accepts a loosely
 * structured row (e.g. from a parsed CSV/XLSX upload or a free-text/vision
 * extraction) and maps the many real-world column-name variants onto the
 * canonical Application fields the scoring engine expects.
 */
import type { Application, Criticality } from "./types";

type Raw = Record<string, unknown>;

function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "number" && (Number.isNaN(v) || !Number.isFinite(v))) return true;
  const s = String(v).trim().toLowerCase();
  return ["", "nan", "none", "null", "n/a", "na", "-", "unknown"].includes(s);
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const TRUE_VALS = new Set([
  "yes",
  "y",
  "true",
  "1",
  "eol",
  "sunset",
  "legacy",
  "retired",
  "decommissioned",
  "end of life",
  "end of support",
  "eos",
  "past eol",
]);

const COMPLIANCE_TRUE_VALS = new Set([
  "yes",
  "y",
  "true",
  "1",
  "required",
  "regulated",
  "applicable",
  "hipaa",
  "gdpr",
  "sox",
  "pci",
]);

function parseNumeric(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  let cleaned = String(raw)
    .replace(/,/g, "")
    .replace(/\$/g, "")
    .replace(/£/g, "")
    .replace(/€/g, "")
    .replace(/USD/gi, "")
    .replace(/GBP/gi, "")
    .replace(/EUR/gi, "")
    .trim();
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase();
  let multiplier = 1;
  if (lower.endsWith("m")) {
    multiplier = 1_000_000;
    cleaned = cleaned.slice(0, -1);
  } else if (lower.endsWith("k")) {
    multiplier = 1_000;
    cleaned = cleaned.slice(0, -1);
  }
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n * multiplier : null;
}

export function normalizeTool(raw: Raw): Application {
  const rawLower = new Map<string, unknown>();
  for (const [k, v] of Object.entries(raw)) {
    if (!isBlank(v)) rawLower.set(String(k).trim().toLowerCase(), v);
  }

  const get = (...keys: string[]): unknown => {
    for (const k of keys) {
      const v = rawLower.get(k.toLowerCase().trim());
      if (v !== undefined) return v;
    }
    for (const k of keys) {
      const kl = k.toLowerCase().trim();
      for (const [col, v] of rawLower) {
        if (col.includes(kl) || kl.includes(col)) return v;
      }
    }
    return undefined;
  };

  const tool: Application = { ...(raw as Partial<Application>) } as Application;
  if (!tool.id) tool.id = uuid();

  if (isBlank(tool.name)) {
    tool.name =
      (get(
        "name",
        "application name",
        "application",
        "app name",
        "app",
        "tool name",
        "tool",
        "system name",
        "system",
        "software name",
        "software",
        "product name",
        "product",
        "service name",
        "service",
        "solution name",
        "solution",
        "platform name",
        "platform",
        "application / tool",
        "app / system",
        "system / application",
      ) as string) || "Unknown";
  }

  if (isBlank(tool.category)) {
    tool.category =
      (get(
        "category",
        "app category",
        "application category",
        "tool category",
        "type",
        "app type",
        "application type",
        "tool type",
        "system type",
        "function",
        "functionality",
        "domain",
        "module type",
        "technology category",
        "tech category",
        "software category",
        "application domain",
        "solution type",
        "platform type",
      ) as string) || "Other";
  }

  if (isBlank(tool.criticality)) {
    const v = get(
      "criticality",
      "business criticality",
      "priority",
      "importance",
      "impact",
      "risk level",
      "risk",
      "tier",
      "business tier",
      "strategic importance",
      "business importance",
      "mission criticality",
      "criticality level",
      "app criticality",
      "system criticality",
      "business impact",
      "operational importance",
    );
    tool.criticality = (v as Criticality) ?? null;
  }

  if (isBlank(tool.vendor)) {
    const v = get(
      "vendor",
      "vendor name",
      "supplier",
      "manufacturer",
      "provider",
      "software vendor",
      "tech vendor",
      "publisher",
      "software provider",
      "technology vendor",
      "technology provider",
      "vendor / supplier",
      "supplier name",
      "oem",
      "make",
      "brand",
      "company",
      "software company",
      "tech company",
      "licensor",
    );
    tool.vendor = (v as string) ?? null;
  }

  if (!tool.annual_cost) {
    const rawCost = get(
      "annual_cost",
      "annual cost",
      "yearly cost",
      "annual license",
      "annual licence",
      "annual fee",
      "cost",
      "total cost",
      "license cost",
      "licence cost",
      "contract value",
      "annual contract value",
      "acv",
      "annual spend",
      "yearly spend",
      "cost per year",
      "cost (usd)",
      "cost ($)",
      "annual cost ($)",
      "annual cost (usd)",
      "budget",
      "annual budget",
      "annual licensing cost",
      "annual licence cost",
      "software cost",
      "licensing cost",
      "licence fee",
      "license fee",
      "annual subscription",
      "subscription cost",
      "saas cost",
      "total annual cost",
      "cost per annum",
      "per annum cost",
      "annual cost (£)",
      "annual cost (eur)",
      "annual value",
      "contract amount",
      "spend",
      "it spend",
      "technology spend",
      "annual it cost",
      "annual support cost",
    );
    if (rawCost !== undefined) tool.annual_cost = parseNumeric(rawCost);
  }

  if (!tool.user_count) {
    const rawUc = get(
      "user_count",
      "user count",
      "users",
      "no of users",
      "number of users",
      "# users",
      "num users",
      "active users",
      "licensed users",
      "seats",
      "headcount",
      "user base",
      "user volume",
      "no. of users",
      "num. of users",
      "total users",
      "end users",
      "named users",
      "concurrent users",
      "user licenses",
      "user licences",
      "users count",
      "users (no.)",
      "number of end users",
      "no of end users",
      "registered users",
      "monthly active users",
      "mau",
      "fte users",
      "staff using",
    );
    if (rawUc !== undefined) {
      const n = parseNumeric(rawUc);
      tool.user_count = n !== null ? Math.round(n) : null;
    }
  }

  if (!tool.age_years) {
    const rawAge = get(
      "age_years",
      "age",
      "age (years)",
      "app age",
      "system age",
      "years in use",
      "years old",
      "years",
      "age in years",
      "application age",
      "age (yrs)",
      "age in yrs",
      "system age (years)",
      "no. of years",
      "years deployed",
      "years live",
      "age of system",
      "age of application",
      "implementation age",
      "years since implementation",
      "years since go-live",
      "go-live year",
      "system age (yrs)",
      "app age (years)",
    );
    if (rawAge !== undefined) {
      let val = parseNumeric(rawAge);
      if (val !== null && val > 1990) {
        val = Math.round((new Date().getFullYear() - val) * 10) / 10;
      }
      tool.age_years = val;
    }
  }

  if (isBlank(tool.deployment)) {
    const v = get(
      "deployment",
      "deployment model",
      "hosting",
      "hosting model",
      "infrastructure",
      "environment",
      "cloud or on-prem",
      "cloud/on-prem",
      "deployment type",
      "hosted",
      "hosting type",
      "infrastructure type",
      "deployment environment",
      "where hosted",
      "cloud or on premises",
      "on-prem or cloud",
      "saas or on-prem",
      "deployment location",
      "hosting environment",
      "platform type",
      "cloud / on-prem",
      "on premise or cloud",
      "infrastructure model",
    );
    tool.deployment = (v as string) ?? null;
  }

  if (!tool.integrations) {
    const rawInt = get(
      "integrations",
      "integration count",
      "no of integrations",
      "number of integrations",
      "# integrations",
      "interfaces",
      "no of interfaces",
      "connected systems",
      "api connections",
      "no. of integrations",
      "integration no.",
      "number of interfaces",
      "interface count",
      "no. of interfaces",
      "api count",
      "no. of apis",
      "connected apps",
      "dependencies count",
      "system dependencies",
      "integration points",
      "no of connected systems",
      "integrations (#)",
    );
    if (rawInt !== undefined) {
      const n = parseNumeric(rawInt);
      tool.integrations = n !== null ? Math.round(n) : null;
    }
  }

  const rawEol = get(
    "end_of_life",
    "end of life",
    "eol",
    "end-of-life",
    "retired",
    "sunset",
    "decommissioned",
    "legacy",
    "is eol",
    "eol flag",
    "end of support",
    "eos",
    "past end of life",
    "end of maintenance",
    "eol?",
    "is legacy",
    "legacy system",
    "is retired",
    "retiring",
    "end of life (y/n)",
    "eol (y/n)",
    "eol status",
    "support status",
  );
  if (rawEol === undefined) {
    tool.end_of_life = false;
  } else if (typeof rawEol === "boolean") {
    tool.end_of_life = rawEol;
  } else {
    tool.end_of_life = TRUE_VALS.has(String(rawEol).trim().toLowerCase());
  }

  const rawComp = get(
    "compliance_required",
    "compliance required",
    "compliance",
    "regulated",
    "regulatory",
    "hipaa",
    "gdpr",
    "sox",
    "pci",
    "compliance flag",
    "needs compliance",
    "compliance needed",
    "regulatory requirement",
    "compliance (y/n)",
    "requires compliance",
    "data regulation",
    "data privacy",
    "regulated data",
    "compliance requirement",
    "regulatory compliance",
    "compliance applicable",
    "subject to compliance",
  );
  if (rawComp === undefined) {
    tool.compliance_required = false;
  } else if (typeof rawComp === "boolean") {
    tool.compliance_required = rawComp;
  } else {
    tool.compliance_required = COMPLIANCE_TRUE_VALS.has(String(rawComp).trim().toLowerCase());
  }

  if (isBlank(tool.business_unit)) {
    const v = get(
      "business_unit",
      "business unit",
      "department",
      "dept",
      "division",
      "team",
      "org",
      "organisation",
      "organization",
      "owner",
      "business owner",
      "cost centre",
      "cost center",
      "bu",
      "org unit",
      "organisational unit",
      "organizational unit",
      "owning department",
      "sponsoring department",
      "accountable team",
      "it owner",
      "business sponsor",
      "product owner",
      "application owner",
      "dept.",
      "department name",
      "line of business",
      "lob",
    );
    tool.business_unit = (v as string) ?? null;
  }

  return tool;
}
