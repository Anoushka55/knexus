// ============================================================================
// DemandIQ — Core Data Layer
// All types, mock data generation, segmentation, and computed metrics live here
// ============================================================================

export type RootCauseTag =
  | "Data Quality"
  | "Promo"
  | "Seasonality"
  | "Supply"
  | "Market Event"
  | "None";

export type DataQualityFlag = "none" | "missing_value" | "mismatch" | "outlier";
export type ExceptionStatus = "Open" | "Closed" | "Escalated";
export type ApprovalTier = "Auto-Close" | "L1" | "L2" | "Director";

/** Demand-pattern segmentation derived from historical data */
export type DemandSegment = "Stable" | "Seasonal" | "Erratic" | "New";

export interface DemandRecord {
  // Identifiers
  sku_id: string;
  sku_name: string;
  category: string;
  brand_name: string;
  depot_id: string;
  depot_name: string;
  account_id: string;
  account_name: string;
  period: string; // YYYY-MM

  // Quantities
  forecast_qty: number;
  sell_in_qty: number;
  offtake_qty: number;
  stock_on_hand: number;
  lead_time_days: number;

  // Derived KPIs
  fa_pct: number;
  bias_pct: number;
  coverage_weeks: number;

  // Promo
  promo_flag: boolean;
  promo_lift_pct: number;
  promo_has_history: boolean;

  // Quality & RCA
  data_quality_flag: DataQualityFlag;
  root_cause_tag: RootCauseTag;
  rca_confidence_pct: number;
  rca_signals: string[]; // Which rules fired

  // Business
  financial_impact_inr: number;
  exception_status: ExceptionStatus;
  approval_tier: ApprovalTier;
  recommended_action: string;
  owner: string;
  sla_date: string;
}

export interface OverrideLogEntry {
  override_id: string;
  date: string;
  sku_id: string;
  sku_name: string;
  depot_name: string;
  account_name: string;
  root_cause_tag: RootCauseTag;
  field_overridden: string;
  old_value: string;
  new_value: string;
  reason: string;
  outcome_validated: boolean | null; // null = pending
}

export interface SkuSegmentInfo {
  sku_id: string;
  sku_name: string;
  segment: DemandSegment;
  cv: number; // Coefficient of variation
  mean_volume: number;
  rationale: string;
}

// ============================================================================
// MASTERS
// ============================================================================

const SKUS = [
  { id: "SKU001", name: "Ultra-Hydrate 500ml", category: "Beverages", brand: "HydraLife" },
  { id: "SKU002", name: "Ultra-Hydrate 1L", category: "Beverages", brand: "HydraLife" },
  { id: "SKU003", name: "PowerGrain Bar 50g", category: "Snacks", brand: "NutriBoost" },
  { id: "SKU004", name: "PowerGrain Bar 100g", category: "Snacks", brand: "NutriBoost" },
  { id: "SKU005", name: "CleanMax Detergent 2kg", category: "Home Care", brand: "CleanMax" },
  { id: "SKU006", name: "CleanMax Detergent 5kg", category: "Home Care", brand: "CleanMax" },
  { id: "SKU007", name: "FreshMist Soap Pack of 3", category: "Personal Care", brand: "FreshMist" },
  { id: "SKU008", name: "FreshMist Shampoo 200ml", category: "Personal Care", brand: "FreshMist" },
  { id: "SKU009", name: "DailyGrain Rice 10kg", category: "Staples", brand: "DailyGrain" },
  { id: "SKU010", name: "DailyGrain Atta 5kg", category: "Staples", brand: "DailyGrain" },
  { id: "SKU011", name: "PureOil Cooking 1L", category: "Staples", brand: "PureOil" },
  { id: "SKU012", name: "PureOil Cooking 5L", category: "Staples", brand: "PureOil" },
  { id: "SKU013", name: "ChocoBliss Wafers 75g", category: "Snacks", brand: "NutriBoost" },
  { id: "SKU014", name: "MorningGlow Coffee 100g", category: "Beverages", brand: "HydraLife" },
  { id: "SKU015", name: "SparkleClean Dishwash 500ml", category: "Home Care", brand: "CleanMax" },
];

const DEPOTS = [
  { id: "DEP_MUM", name: "Mumbai Logistics Park" },
  { id: "DEP_DEL", name: "Delhi Central Hub" },
  { id: "DEP_BLR", name: "Bangalore Distribution" },
];

const ACCOUNTS = [
  { id: "ACC_RR", name: "Reliance Retail" },
  { id: "ACC_WM", name: "Walmart India" },
];

export const OWNERS = ["A. Sharma", "P. Iyer", "R. Khanna", "S. Mehta", "V. Reddy"];

// ============================================================================
// HELPERS — pseudo-random with seed for stability
// ============================================================================

let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function resetSeed(s = 42) { seed = s; }
function randBetween(min: number, max: number) { return min + rand() * (max - min); }
function randInt(min: number, max: number) { return Math.floor(randBetween(min, max + 1)); }

function periodsLast12Months(): string[] {
  const out: string[] = [];
  const now = new Date(2026, 5, 1); // June 2026 fixed for reproducibility
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

// ============================================================================
// SEGMENTATION — Stable / Seasonal / Erratic / New
// Derived from coefficient of variation (CV) and tenure
// ============================================================================

export const SKU_SEGMENTS: Record<string, SkuSegmentInfo> = {
  SKU001: { sku_id: "SKU001", sku_name: "Ultra-Hydrate 500ml", segment: "Stable", cv: 0.08, mean_volume: 12500, rationale: "Low coefficient of variation (8%) over 12 months. Year-round consumption with minimal volatility." },
  SKU002: { sku_id: "SKU002", sku_name: "Ultra-Hydrate 1L", segment: "Stable", cv: 0.11, mean_volume: 9800, rationale: "Steady demand profile with CV ~11%. Predictable channel patterns." },
  SKU003: { sku_id: "SKU003", sku_name: "PowerGrain Bar 50g", segment: "Erratic", cv: 0.42, mean_volume: 6200, rationale: "High month-to-month volatility (CV 42%) driven by sporadic promo spikes and event-led demand." },
  SKU004: { sku_id: "SKU004", sku_name: "PowerGrain Bar 100g", segment: "Stable", cv: 0.13, mean_volume: 4800, rationale: "Established pack size with consistent demand." },
  SKU005: { sku_id: "SKU005", sku_name: "CleanMax Detergent 2kg", segment: "Seasonal", cv: 0.27, mean_volume: 8400, rationale: "Repeating monsoon-quarter peaks visible in last 12 months. Seasonal index detected." },
  SKU006: { sku_id: "SKU006", sku_name: "CleanMax Detergent 5kg", segment: "Stable", cv: 0.10, mean_volume: 3100, rationale: "Bulk pack with stable institutional buyer base." },
  SKU007: { sku_id: "SKU007", sku_name: "FreshMist Soap Pack of 3", segment: "Erratic", cv: 0.38, mean_volume: 5500, rationale: "Demand swings >35% MoM. Recent data quality issues compounding signal noise." },
  SKU008: { sku_id: "SKU008", sku_name: "FreshMist Shampoo 200ml", segment: "Stable", cv: 0.09, mean_volume: 7200, rationale: "Daily-use SKU with very low CV." },
  SKU009: { sku_id: "SKU009", sku_name: "DailyGrain Rice 10kg", segment: "Seasonal", cv: 0.24, mean_volume: 11000, rationale: "Festive-quarter uplift pattern. Q3 spike consistent across years." },
  SKU010: { sku_id: "SKU010", sku_name: "DailyGrain Atta 5kg", segment: "Stable", cv: 0.07, mean_volume: 14500, rationale: "Staple with the lowest CV in the portfolio." },
  SKU011: { sku_id: "SKU011", sku_name: "PureOil Cooking 1L", segment: "Seasonal", cv: 0.29, mean_volume: 9300, rationale: "Festive cooking-oil seasonality + commodity price-led demand shifts." },
  SKU012: { sku_id: "SKU012", sku_name: "PureOil Cooking 5L", segment: "Stable", cv: 0.12, mean_volume: 4200, rationale: "Institutional pack, steady offtake." },
  SKU013: { sku_id: "SKU013", sku_name: "ChocoBliss Wafers 75g", segment: "New", cv: 0.31, mean_volume: 2100, rationale: "Launched 4 months ago. Insufficient history for stable forecasting; pattern still emerging." },
  SKU014: { sku_id: "SKU014", sku_name: "MorningGlow Coffee 100g", segment: "Stable", cv: 0.14, mean_volume: 5800, rationale: "Daily consumption, low CV." },
  SKU015: { sku_id: "SKU015", sku_name: "SparkleClean Dishwash 500ml", segment: "Erratic", cv: 0.44, mean_volume: 3400, rationale: "Heavy promo-dependence — every promo cycle causes sharp swings, depressing post-promo periods." },
};

export function getSegmentColor(segment: DemandSegment): { bg: string; text: string; label: string } {
  switch (segment) {
    case "Stable":   return { bg: "bg-success/10",  text: "text-success",  label: "Stable" };
    case "Seasonal": return { bg: "bg-info/10",     text: "text-info",     label: "Seasonal" };
    case "Erratic":  return { bg: "bg-warning/10",  text: "text-warning",  label: "Erratic" };
    case "New":      return { bg: "bg-teal/10",     text: "text-teal",     label: "New" };
  }
}

// ============================================================================
// CONFIDENCE SCORE — true self-learning
// Confidence = historical validation rate per (root_cause × segment),
// adjusted by recency and rule-strength.
// ============================================================================

/**
 * Compute confidence for a given root cause given an override log.
 * Returns a percentage 0-100.
 *
 * Logic:
 *  - Look at past overrides with the same root_cause_tag
 *  - For each, was the agent's recommendation validated by the outcome?
 *  - Base rate = validated / total
 *  - Recency-weight: most recent 5 outcomes count double
 *  - Floor at 35% (cold start) and cap at 96% (never claim certainty)
 *  - Rule-match bonus: +5pp if all expected signals fired (signalsHit / signalsExpected = 1)
 */
export function computeConfidence(
  rootCause: RootCauseTag,
  segment: DemandSegment,
  signalsHit: number,
  signalsExpected: number,
  overrideLog: OverrideLogEntry[]
): { confidence: number; breakdown: ConfidenceBreakdown } {
  const relevant = overrideLog.filter(
    (o) => o.root_cause_tag === rootCause && o.outcome_validated !== null
  );

  if (relevant.length === 0) {
    // Cold start by root cause type
    const coldStart: Record<RootCauseTag, number> = {
      "Data Quality": 70, "Promo": 60, "Seasonality": 65,
      "Supply": 55, "Market Event": 50, "None": 50,
    };
    const base = coldStart[rootCause];
    return {
      confidence: Math.min(96, base + (signalsHit / Math.max(1, signalsExpected)) * 5),
      breakdown: {
        baseRate: base,
        sampleSize: 0,
        recentValidations: 0,
        recentTotal: 0,
        ruleStrength: signalsHit / Math.max(1, signalsExpected),
        finalScore: 0,
        explanation: `Cold-start estimate for "${rootCause}" — no historical overrides yet. Defaulting to category prior.`,
      },
    };
  }

  // Recent vs older
  const sorted = [...relevant].sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = sorted.slice(0, 5);
  const older = sorted.slice(5);

  const recentValidated = recent.filter((o) => o.outcome_validated).length;
  const olderValidated = older.filter((o) => o.outcome_validated).length;

  // Weighted: recent counts double
  const weightedNumerator = recentValidated * 2 + olderValidated;
  const weightedDenominator = recent.length * 2 + older.length;
  const baseRate = (weightedNumerator / weightedDenominator) * 100;

  const ruleStrength = signalsHit / Math.max(1, signalsExpected);
  const ruleBonus = ruleStrength * 5; // up to +5pp

  // Segment penalty for high-uncertainty segments
  const segmentAdjust: Record<DemandSegment, number> = {
    Stable: 2, Seasonal: 0, Erratic: -4, New: -6,
  };

  const raw = baseRate + ruleBonus + segmentAdjust[segment];
  const final = Math.max(35, Math.min(96, raw));

  return {
    confidence: final,
    breakdown: {
      baseRate: Math.round(baseRate),
      sampleSize: relevant.length,
      recentValidations: recentValidated,
      recentTotal: recent.length,
      ruleStrength,
      finalScore: final,
      explanation: `Based on ${relevant.length} historical "${rootCause}" overrides: ${recentValidated}/${recent.length} of the most recent were validated. Rule strength ${Math.round(ruleStrength * 100)}%. Segment adjustment for ${segment}: ${segmentAdjust[segment] >= 0 ? "+" : ""}${segmentAdjust[segment]}pp.`,
    },
  };
}

export interface ConfidenceBreakdown {
  baseRate: number;
  sampleSize: number;
  recentValidations: number;
  recentTotal: number;
  ruleStrength: number;
  finalScore: number;
  explanation: string;
}

// ============================================================================
// RCA RULE ENGINE — explainable root-cause detection
// ============================================================================

export interface RcaSignals {
  hasDataQualityFlag: boolean;
  hasActivePromo: boolean;
  promoLacksHistory: boolean;
  isSeasonalSegment: boolean;
  isMonsoonOrFestive: boolean;
  hasSupplyConstraint: boolean;
  highBiasMagnitude: boolean;
}

export function detectRcaSignals(rec: Partial<DemandRecord> & { period: string; bias_pct: number; fa_pct: number; }, segment: DemandSegment): RcaSignals {
  const month = parseInt(rec.period.split("-")[1], 10);
  return {
    hasDataQualityFlag: !!rec.data_quality_flag && rec.data_quality_flag !== "none",
    hasActivePromo: !!rec.promo_flag,
    promoLacksHistory: !!rec.promo_flag && !rec.promo_has_history,
    isSeasonalSegment: segment === "Seasonal",
    isMonsoonOrFestive: month >= 6 && month <= 11,
    hasSupplyConstraint: (rec.stock_on_hand ?? 0) < (rec.offtake_qty ?? 0) * 0.5,
    highBiasMagnitude: Math.abs(rec.bias_pct) > 25,
  };
}

export interface RcaResult {
  tag: RootCauseTag;
  signals: string[];
  signalsHit: number;
  signalsExpected: number;
}

export function classifyRootCause(signals: RcaSignals): RcaResult {
  // Priority order — first rule that fires wins
  if (signals.hasDataQualityFlag) {
    const hit: string[] = ["Data quality flag detected on record"];
    if (signals.highBiasMagnitude) hit.push("Bias magnitude exceeds ±25% threshold");
    return { tag: "Data Quality", signals: hit, signalsHit: hit.length, signalsExpected: 2 };
  }
  if (signals.promoLacksHistory) {
    return {
      tag: "Promo",
      signals: ["Active promo with no historical realization factor", "Promo lift not yet calibrated for this SKU-account combination"],
      signalsHit: 2, signalsExpected: 2,
    };
  }
  if (signals.hasActivePromo && signals.highBiasMagnitude) {
    return {
      tag: "Promo",
      signals: ["Active promo present in period", "Bias magnitude exceeds ±25% threshold", "Realization factor likely under/over-applied"],
      signalsHit: 3, signalsExpected: 3,
    };
  }
  if (signals.hasSupplyConstraint) {
    return {
      tag: "Supply",
      signals: ["Stock-on-hand below 50% of offtake — supply constraint", "Forecast may have been clipped by supply ceiling"],
      signalsHit: 2, signalsExpected: 2,
    };
  }
  if (signals.isSeasonalSegment && signals.isMonsoonOrFestive) {
    return {
      tag: "Seasonality",
      signals: ["SKU classified as Seasonal", "Period falls in monsoon/festive window", "Historical pattern shows uplift in this window"],
      signalsHit: 3, signalsExpected: 3,
    };
  }
  if (signals.highBiasMagnitude) {
    return {
      tag: "Market Event",
      signals: ["Bias magnitude exceeds ±25% threshold", "No data quality, promo, supply, or seasonality signal detected", "External market driver inferred"],
      signalsHit: 2, signalsExpected: 3,
    };
  }
  return { tag: "None", signals: [], signalsHit: 0, signalsExpected: 0 };
}

// ============================================================================
// APPROVAL TIER ROUTING
// ============================================================================

export function routeApprovalTier(financialImpact: number, confidence: number): ApprovalTier {
  if (financialImpact >= 400000) return "Director";
  if (financialImpact >= 250000) return "L2";
  if (financialImpact >= 100000) return "L1";
  // Low impact + high confidence → auto-close
  if (confidence >= 80) return "Auto-Close";
  return "L1";
}

// ============================================================================
// RECOMMENDED ACTIONS BY ROOT CAUSE
// ============================================================================

export function buildRecommendedAction(rootCause: RootCauseTag, segment: DemandSegment, biasPct: number, skuName: string): string {
  switch (rootCause) {
    case "Data Quality":
      return `Reconcile master data for ${skuName} and rerun forecast cycle. Investigate the flagged record and confirm with depot.`;
    case "Promo":
      return biasPct > 0
        ? `Calibrate promo lift downward — current promo factor is over-applied. Suggest revising realization to ~70% of plan.`
        : `Calibrate promo lift upward — actual offtake exceeded planned lift. Suggest revising realization to ~115% of plan.`;
    case "Seasonality":
      return `Apply seasonal index for the upcoming quarter and rerun the baseline. Add ${segment === "New" ? "early-launch buffer" : "monsoon/festive multiplier"} to forecast.`;
    case "Supply":
      return `Reallocate stock from depots with surplus coverage. Authorize expedite order if lead time exceeds ${biasPct < 0 ? "10" : "7"} days.`;
    case "Market Event":
      return `Investigate external driver (competitor activity, news event, pricing change). Hold forecast adjustment for one more cycle to confirm pattern.`;
    default:
      return `Monitor — no action required this cycle.`;
  }
}

// ============================================================================
// DATA GENERATOR
// ============================================================================

function generatePromoData(skuId: string, period: string): { promo: boolean; lift: number; hasHistory: boolean } {
  const month = parseInt(period.split("-")[1], 10);
  // Festive months trigger more promos
  const isFestive = month === 10 || month === 11;
  const skuHash = parseInt(skuId.replace(/\D/g, ""), 10);
  const promo = isFestive ? rand() < 0.5 : rand() < 0.15;
  return {
    promo,
    lift: promo ? Math.round(randBetween(10, 35)) : 0,
    hasHistory: promo ? (skuHash % 3 !== 0) : true, // ~67% have history
  };
}

/** Build the override log first so confidence scores can reference it */
function generateOverrideLogInternal(): OverrideLogEntry[] {
  resetSeed(7);
  const entries: OverrideLogEntry[] = [];
  const rootCauses: RootCauseTag[] = ["Data Quality", "Promo", "Seasonality", "Supply", "Market Event"];
  const periods = periodsLast12Months();

  // Per root cause, generate 4-6 overrides with varying validation
  rootCauses.forEach((rc, rcIdx) => {
    const count = 4 + (rcIdx % 3);
    for (let i = 0; i < count; i++) {
      const skuIdx = randInt(0, SKUS.length - 1);
      const sku = SKUS[skuIdx];
      const depot = DEPOTS[randInt(0, DEPOTS.length - 1)];
      const account = ACCOUNTS[randInt(0, ACCOUNTS.length - 1)];
      const periodIdx = randInt(0, periods.length - 1);
      // Validation rates differ by root cause to make learning visible
      const validationRate: Record<RootCauseTag, number> = {
        "Data Quality": 0.85, "Promo": 0.70, "Seasonality": 0.75,
        "Supply": 0.60, "Market Event": 0.45, "None": 0.5,
      };
      // Most recent ones are slightly more likely to be validated → "learning"
      const recencyBoost = i < 2 ? 0.10 : 0;
      const validated = rand() < (validationRate[rc] + recencyBoost);

      entries.push({
        override_id: `OV${String(entries.length + 1).padStart(4, "0")}`,
        date: periods[periodIdx] + "-15",
        sku_id: sku.id,
        sku_name: sku.name,
        depot_name: depot.name,
        account_name: account.name,
        root_cause_tag: rc,
        field_overridden: rc === "Promo" ? "promo_lift_pct" : rc === "Seasonality" ? "forecast_qty" : "exception_status",
        old_value: rc === "Promo" ? "20%" : "Open",
        new_value: rc === "Promo" ? "30%" : "Closed",
        reason: {
          "Data Quality": "Confirmed missing source data; corrected at depot level",
          "Promo": "Adjusted realization factor based on prior promo performance",
          "Seasonality": "Applied seasonal uplift from historical pattern",
          "Supply": "Authorized reallocation from surplus depot",
          "Market Event": "Held adjustment — waiting for one more cycle of data",
          "None": "Reviewed — no action needed",
        }[rc],
        outcome_validated: validated,
      });
    }
  });

  // A handful of pending (null outcome) — most recent ones
  for (let i = 0; i < 3; i++) {
    const skuIdx = randInt(0, SKUS.length - 1);
    const sku = SKUS[skuIdx];
    entries.push({
      override_id: `OV${String(entries.length + 1).padStart(4, "0")}`,
      date: periods[periods.length - 1] + "-20",
      sku_id: sku.id,
      sku_name: sku.name,
      depot_name: DEPOTS[randInt(0, DEPOTS.length - 1)].name,
      account_name: ACCOUNTS[randInt(0, ACCOUNTS.length - 1)].name,
      root_cause_tag: rootCauses[i % rootCauses.length],
      field_overridden: "exception_status",
      old_value: "Open",
      new_value: "Closed",
      reason: "Recent decision — outcome pending validation",
      outcome_validated: null,
    });
  }

  return entries;
}

function generateDemandDataInternal(overrideLog: OverrideLogEntry[]): DemandRecord[] {
  resetSeed(42);
  const periods = periodsLast12Months();
  const records: DemandRecord[] = [];

  // Define "problem" combinations to ensure we have meaningful exceptions
  const problemCombos: Array<{ skuIdx: number; depotIdx: number; accountIdx: number; rootCausePeriod: number }> = [
    { skuIdx: 8, depotIdx: 0, accountIdx: 1, rootCausePeriod: 11 }, // DailyGrain Rice — Mumbai — Walmart (Supply)
    { skuIdx: 0, depotIdx: 1, accountIdx: 0, rootCausePeriod: 11 }, // Ultra-Hydrate 500ml — Delhi — Reliance (Data Quality)
    { skuIdx: 4, depotIdx: 0, accountIdx: 1, rootCausePeriod: 11 }, // CleanMax 2kg — Mumbai — Walmart (Promo)
    { skuIdx: 6, depotIdx: 2, accountIdx: 1, rootCausePeriod: 11 }, // FreshMist Soap — Bangalore — Walmart (Data Quality)
    { skuIdx: 10, depotIdx: 2, accountIdx: 0, rootCausePeriod: 11 }, // PureOil 1L — Bangalore — Reliance (Seasonality)
    { skuIdx: 2, depotIdx: 0, accountIdx: 0, rootCausePeriod: 11 }, // PowerGrain Bar 50g — Mumbai — Reliance (Market Event)
    { skuIdx: 14, depotIdx: 1, accountIdx: 1, rootCausePeriod: 11 }, // SparkleClean — Delhi — Walmart (Promo)
    { skuIdx: 12, depotIdx: 0, accountIdx: 0, rootCausePeriod: 11 }, // ChocoBliss — Mumbai — Reliance (Market Event)
    { skuIdx: 7, depotIdx: 0, accountIdx: 1, rootCausePeriod: 10 }, // FreshMist Shampoo — Mumbai — Walmart (Data Quality)
    { skuIdx: 5, depotIdx: 2, accountIdx: 0, rootCausePeriod: 11 }, // CleanMax 5kg — Bangalore — Reliance (Promo)
    { skuIdx: 9, depotIdx: 1, accountIdx: 1, rootCausePeriod: 11 }, // DailyGrain Atta — Delhi — Walmart (Seasonality)
    { skuIdx: 13, depotIdx: 2, accountIdx: 0, rootCausePeriod: 11 }, // MorningGlow Coffee — Bangalore — Reliance (Supply)
  ];

  SKUS.forEach((sku, skuIdx) => {
    const segment = SKU_SEGMENTS[sku.id].segment;
    const meanVolume = SKU_SEGMENTS[sku.id].mean_volume;

    DEPOTS.forEach((depot, depotIdx) => {
      ACCOUNTS.forEach((account, accountIdx) => {
        periods.forEach((period, periodIdx) => {
          const isProblem = problemCombos.find(
            (p) => p.skuIdx === skuIdx && p.depotIdx === depotIdx && p.accountIdx === accountIdx && p.rootCausePeriod === periodIdx
          );

          // Base demand with segment-driven variability
          const segmentCV: Record<DemandSegment, number> = { Stable: 0.10, Seasonal: 0.25, Erratic: 0.40, New: 0.30 };
          const cv = segmentCV[segment];

          // Seasonal multiplier
          const month = parseInt(period.split("-")[1], 10);
          let seasonalMult = 1;
          if (segment === "Seasonal" && month >= 9 && month <= 11) seasonalMult = 1.3;
          if (segment === "Seasonal" && (month <= 2)) seasonalMult = 0.85;

          // Volume — distributed across depots/accounts
          const accountShare = accountIdx === 0 ? 0.55 : 0.45; // Reliance bigger
          const depotShare = depotIdx === 0 ? 0.45 : depotIdx === 1 ? 0.35 : 0.20;
          const baseVolume = meanVolume * seasonalMult * depotShare * accountShare;
          const offtake = Math.round(baseVolume * (1 + (rand() - 0.5) * 2 * cv));

          // Forecast — usually close, but problem combos deviate
          let faPct: number;
          let biasPct: number;
          let forecast: number;

          if (isProblem) {
            // Engineer a poor forecast
            faPct = randBetween(40, 60);
            biasPct = rand() < 0.5 ? randBetween(-35, -20) : randBetween(20, 35);
            forecast = Math.round(offtake * (1 + biasPct / 100));
          } else {
            faPct = randBetween(78, 95);
            biasPct = randBetween(-10, 10);
            forecast = Math.round(offtake * (1 + biasPct / 100));
          }

          const sellIn = Math.round(offtake * randBetween(0.95, 1.08));

          const promo = generatePromoData(sku.id, period);
          const stockOnHand = isProblem && rand() < 0.4 ? Math.round(offtake * 0.4) : Math.round(offtake * randBetween(1.2, 2.5));
          const leadTime = randInt(3, 14);
          const coverageWeeks = (stockOnHand / Math.max(1, offtake)) * 4;

          // Data quality flag — sprinkle on problem records and a few others
          let dqFlag: DataQualityFlag = "none";
          if (isProblem && skuIdx % 4 === 0) dqFlag = "missing_value";
          else if (isProblem && skuIdx % 4 === 1) dqFlag = "outlier";
          else if (!isProblem && rand() < 0.02) dqFlag = "mismatch";

          // Run RCA only on records with significant deviation
          let rootCause: RootCauseTag = "None";
          let rcaSignals: string[] = [];
          let rcaConfidence = 0;
          let financialImpact = 0;
          let approvalTier: ApprovalTier = "Auto-Close";
          let recommendedAction = "Monitor — no action required this cycle.";
          let exceptionStatus: ExceptionStatus = "Closed";

          const isException = faPct < 70 || Math.abs(biasPct) > 20;
          if (isException) {
            const signals = detectRcaSignals(
              { period, bias_pct: biasPct, fa_pct: faPct, data_quality_flag: dqFlag, promo_flag: promo.promo, promo_has_history: promo.hasHistory, stock_on_hand: stockOnHand, offtake_qty: offtake },
              segment
            );
            const rca = classifyRootCause(signals);
            rootCause = rca.tag;
            rcaSignals = rca.signals;

            // Financial impact: function of volume × bias × price proxy
            const pricePerUnit = sku.category === "Staples" ? 280 : sku.category === "Beverages" ? 65 : sku.category === "Home Care" ? 220 : sku.category === "Personal Care" ? 150 : 45;
            financialImpact = Math.round(Math.abs(biasPct) / 100 * offtake * pricePerUnit);

            // Compute confidence using override log (self-learning loop!)
            const conf = computeConfidence(rootCause, segment, rca.signalsHit, rca.signalsExpected || 1, overrideLog);
            rcaConfidence = Math.round(conf.confidence);

            approvalTier = routeApprovalTier(financialImpact, rcaConfidence);
            recommendedAction = buildRecommendedAction(rootCause, segment, biasPct, sku.name);

            // Only the most recent problem periods are still Open
            if (periodIdx >= periods.length - 1) {
              exceptionStatus = approvalTier === "Director" ? "Escalated" : "Open";
            } else {
              exceptionStatus = "Closed";
            }
          }

          const ownerIdx = (skuIdx + depotIdx) % OWNERS.length;
          const sla = new Date(2026, parseInt(period.split("-")[1], 10) - 1, 28);
          const slaDate = `${sla.getFullYear()}-${String(sla.getMonth() + 1).padStart(2, "0")}-${String(sla.getDate()).padStart(2, "0")}`;

          records.push({
            sku_id: sku.id,
            sku_name: sku.name,
            category: sku.category,
            brand_name: sku.brand,
            depot_id: depot.id,
            depot_name: depot.name,
            account_id: account.id,
            account_name: account.name,
            period,
            forecast_qty: forecast,
            sell_in_qty: sellIn,
            offtake_qty: offtake,
            stock_on_hand: stockOnHand,
            lead_time_days: leadTime,
            fa_pct: Math.round(faPct * 10) / 10,
            bias_pct: Math.round(biasPct * 10) / 10,
            coverage_weeks: Math.round(coverageWeeks * 10) / 10,
            promo_flag: promo.promo,
            promo_lift_pct: promo.lift,
            promo_has_history: promo.hasHistory,
            data_quality_flag: dqFlag,
            root_cause_tag: rootCause,
            rca_confidence_pct: rcaConfidence,
            rca_signals: rcaSignals,
            financial_impact_inr: financialImpact,
            exception_status: exceptionStatus,
            approval_tier: approvalTier,
            recommended_action: recommendedAction,
            owner: OWNERS[ownerIdx],
            sla_date: slaDate,
          });
        });
      });
    });
  });

  return records;
}

// ============================================================================
// PUBLIC EXPORTS
// ============================================================================

export const mockOverrideLog: OverrideLogEntry[] = generateOverrideLogInternal();
export const mockDemandData: DemandRecord[] = generateDemandDataInternal(mockOverrideLog);

// Daily FA% interpolation for "drill into one month" trend view
export function generateDailyFA(monthlyRecord: DemandRecord): Array<{ date: string; fa_pct: number }> {
  const [yearStr, monthStr] = monthlyRecord.period.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  resetSeed(parseInt(monthlyRecord.sku_id.replace(/\D/g, ""), 10) * 100 + month);
  const out: Array<{ date: string; fa_pct: number }> = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const variance = (rand() - 0.5) * 4; // ±2pp daily variance
    out.push({
      date: `${String(d).padStart(2, "0")}`,
      fa_pct: Math.max(50, Math.min(100, monthlyRecord.fa_pct + variance)),
    });
  }
  return out;
}
