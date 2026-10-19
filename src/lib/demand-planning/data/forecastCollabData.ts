// ============================================================================
// Forecast Collaboration — stat forecast → adjusted forecast → consensus
// ============================================================================

// Reference "today" for this planning cycle (June 2026 cycle)
export const CYCLE_TODAY = "2026-06-16";
// Submission deadline: 5 days after cycle today
export const SUBMISSION_DEADLINE = "2026-06-18";

// Precompute reminder threshold and flag once at module load
const _deadlineMs   = new Date(SUBMISSION_DEADLINE).getTime();
const _todayMs      = new Date(CYCLE_TODAY).getTime();
const _thresholdMs  = _deadlineMs - 2 * 24 * 60 * 60 * 1000; // deadline − 2 days
const _reminderDate = new Date(_thresholdMs).toISOString().split("T")[0]; // "2026-06-16"
const _withinWindow = _todayMs >= _thresholdMs;

export interface CollabRecord {
  sku_id: string;
  sku_name: string;
  brand_name: string;
  owner_name: string;
  stat_forecast_qty: number;
  adjusted_forecast_qty: number;
  adjustment_pct: number; // (adjusted - stat) / stat * 100, rounded to 1dp
  submission_status: "Submitted" | "Pending" | "Reminder Sent";
  submitted_at: string | null; // "YYYY-MM-DD" or null
}

export interface OwnerSummary {
  owner_name: string;
  brands: string[];
  total_skus: number;
  submitted_count: number;
  avg_adjustment_pct: number; // average over all assigned SKUs
  status: "Complete" | "In Progress";
  deadline: string;           // ISO date — same as SUBMISSION_DEADLINE for all owners
  reminder_sent: boolean;     // true when owner is pending AND today is within 2 days of deadline
  reminder_sent_date: string | null; // ISO date the auto-reminder fired, or null
}

export interface ConsensusRow {
  sku_id: string;
  sku_name: string;
  brand_name: string;
  owner_name: string;
  stat_forecast_qty: number;
  adjusted_forecast_qty: number | null; // null = not yet submitted
  consensus_qty: number; // adjusted if submitted, else stat
}

// ─── Brand-Owner assignments ─────────────────────────────────────────────────
// Names from OWNERS in lib/mockData.ts; brands from SKU master.
//   A. Sharma  → HydraLife  (SKU001, SKU002, SKU014)
//   P. Iyer    → NutriBoost (SKU003, SKU004, SKU013)
//   R. Khanna  → CleanMax   (SKU005, SKU006, SKU015)
//   S. Mehta   → FreshMist  (SKU007, SKU008)
//   V. Reddy   → DailyGrain (SKU009, SKU010) + PureOil (SKU011, SKU012)

type RawRecord = Omit<CollabRecord, "adjustment_pct">;

const RAW: RawRecord[] = [
  // ── A. Sharma · HydraLife · all submitted ──────────────────────────────
  // SKU001 +12%: 12500 × 1.12 = 14000
  { sku_id: "SKU001", sku_name: "Ultra-Hydrate 500ml",        brand_name: "HydraLife",  owner_name: "A. Sharma", stat_forecast_qty: 12500, adjusted_forecast_qty: 14000, submission_status: "Submitted",     submitted_at: "2026-06-03" },
  // SKU002 −8%:  9800 × 0.92 = 9016
  { sku_id: "SKU002", sku_name: "Ultra-Hydrate 1L",            brand_name: "HydraLife",  owner_name: "A. Sharma", stat_forecast_qty: 9800,  adjusted_forecast_qty: 9016,  submission_status: "Submitted",     submitted_at: "2026-06-03" },
  // SKU014 unchanged
  { sku_id: "SKU014", sku_name: "MorningGlow Coffee 100g",     brand_name: "HydraLife",  owner_name: "A. Sharma", stat_forecast_qty: 5800,  adjusted_forecast_qty: 5800,  submission_status: "Submitted",     submitted_at: "2026-06-04" },

  // ── P. Iyer · NutriBoost · 2 submitted, 1 reminder sent ──────────────
  // SKU003 +22%: 6200 × 1.22 = 7564
  { sku_id: "SKU003", sku_name: "PowerGrain Bar 50g",          brand_name: "NutriBoost", owner_name: "P. Iyer",   stat_forecast_qty: 6200,  adjusted_forecast_qty: 7564,  submission_status: "Submitted",     submitted_at: "2026-06-05" },
  // SKU004 unchanged
  { sku_id: "SKU004", sku_name: "PowerGrain Bar 100g",         brand_name: "NutriBoost", owner_name: "P. Iyer",   stat_forecast_qty: 4800,  adjusted_forecast_qty: 4800,  submission_status: "Submitted",     submitted_at: "2026-06-05" },
  // SKU013 pending (new SKU, owner hasn't confirmed yet)
  { sku_id: "SKU013", sku_name: "ChocoBliss Wafers 75g",       brand_name: "NutriBoost", owner_name: "P. Iyer",   stat_forecast_qty: 2100,  adjusted_forecast_qty: 2625,  submission_status: "Reminder Sent", submitted_at: null },

  // ── R. Khanna · CleanMax · 2 submitted, 1 pending ────────────────────
  // SKU005 +15%: 8400 × 1.15 = 9660
  { sku_id: "SKU005", sku_name: "CleanMax Detergent 2kg",      brand_name: "CleanMax",   owner_name: "R. Khanna", stat_forecast_qty: 8400,  adjusted_forecast_qty: 9660,  submission_status: "Submitted",     submitted_at: "2026-06-06" },
  // SKU006 −5%:  3100 × 0.95 = 2945
  { sku_id: "SKU006", sku_name: "CleanMax Detergent 5kg",      brand_name: "CleanMax",   owner_name: "R. Khanna", stat_forecast_qty: 3100,  adjusted_forecast_qty: 2945,  submission_status: "Submitted",     submitted_at: "2026-06-06" },
  // SKU015 pending
  { sku_id: "SKU015", sku_name: "SparkleClean Dishwash 500ml", brand_name: "CleanMax",   owner_name: "R. Khanna", stat_forecast_qty: 3400,  adjusted_forecast_qty: 2992,  submission_status: "Pending",       submitted_at: null },

  // ── S. Mehta · FreshMist · both submitted ────────────────────────────
  // SKU007 −18%: 5500 × 0.82 = 4510
  { sku_id: "SKU007", sku_name: "FreshMist Soap Pack of 3",    brand_name: "FreshMist",  owner_name: "S. Mehta",  stat_forecast_qty: 5500,  adjusted_forecast_qty: 4510,  submission_status: "Submitted",     submitted_at: "2026-06-04" },
  // SKU008 unchanged
  { sku_id: "SKU008", sku_name: "FreshMist Shampoo 200ml",     brand_name: "FreshMist",  owner_name: "S. Mehta",  stat_forecast_qty: 7200,  adjusted_forecast_qty: 7200,  submission_status: "Submitted",     submitted_at: "2026-06-04" },

  // ── V. Reddy · DailyGrain + PureOil · 3 submitted, 1 pending ─────────
  // SKU009 +10%: 11000 × 1.10 = 12100
  { sku_id: "SKU009", sku_name: "DailyGrain Rice 10kg",        brand_name: "DailyGrain", owner_name: "V. Reddy",  stat_forecast_qty: 11000, adjusted_forecast_qty: 12100, submission_status: "Submitted",     submitted_at: "2026-06-07" },
  // SKU010 unchanged
  { sku_id: "SKU010", sku_name: "DailyGrain Atta 5kg",         brand_name: "DailyGrain", owner_name: "V. Reddy",  stat_forecast_qty: 14500, adjusted_forecast_qty: 14500, submission_status: "Submitted",     submitted_at: "2026-06-07" },
  // SKU011 +20%: 9300 × 1.20 = 11160
  { sku_id: "SKU011", sku_name: "PureOil Cooking 1L",          brand_name: "PureOil",    owner_name: "V. Reddy",  stat_forecast_qty: 9300,  adjusted_forecast_qty: 11160, submission_status: "Submitted",     submitted_at: "2026-06-08" },
  // SKU012 pending
  { sku_id: "SKU012", sku_name: "PureOil Cooking 5L",          brand_name: "PureOil",    owner_name: "V. Reddy",  stat_forecast_qty: 4200,  adjusted_forecast_qty: 4200,  submission_status: "Pending",       submitted_at: null },
];

/** Full collab dataset — one record per SKU (brand-level, not depot/account) */
export const collabRecords: CollabRecord[] = RAW.map((r) => ({
  ...r,
  adjustment_pct:
    Math.round(
      ((r.adjusted_forecast_qty - r.stat_forecast_qty) / r.stat_forecast_qty) * 1000
    ) / 10,
}));

// ─── Aggregated owner summary ─────────────────────────────────────────────────

export function getCollabSummary(): OwnerSummary[] {
  const ownerNames = Array.from(new Set(collabRecords.map((r) => r.owner_name)));
  return ownerNames.map((owner) => {
    const rows = collabRecords.filter((r) => r.owner_name === owner);
    const submitted = rows.filter((r) => r.submission_status === "Submitted");
    const brands = Array.from(new Set(rows.map((r) => r.brand_name)));
    const avgAdj =
      Math.round((rows.reduce((s, r) => s + r.adjustment_pct, 0) / rows.length) * 10) / 10;
    const status: "Complete" | "In Progress" =
      submitted.length === rows.length ? "Complete" : "In Progress";
    const reminder_sent = status === "In Progress" && _withinWindow;
    return {
      owner_name: owner,
      brands,
      total_skus: rows.length,
      submitted_count: submitted.length,
      avg_adjustment_pct: avgAdj,
      status,
      deadline: SUBMISSION_DEADLINE,
      reminder_sent,
      reminder_sent_date: reminder_sent ? _reminderDate : null,
    };
  });
}

// ─── Consensus forecast ───────────────────────────────────────────────────────

/**
 * For each SKU: if the owner has submitted, use their adjusted figure;
 * otherwise fall back to the statistical forecast.
 * Non-submitted records get adjusted_forecast_qty = null in the output.
 */
export function computeConsensusForecast(): ConsensusRow[] {
  return collabRecords.map((r) => {
    const submitted = r.submission_status === "Submitted";
    return {
      sku_id: r.sku_id,
      sku_name: r.sku_name,
      brand_name: r.brand_name,
      owner_name: r.owner_name,
      stat_forecast_qty: r.stat_forecast_qty,
      adjusted_forecast_qty: submitted ? r.adjusted_forecast_qty : null,
      consensus_qty: submitted ? r.adjusted_forecast_qty : r.stat_forecast_qty,
    };
  });
}

/**
 * Count of submitted SKUs where the owner's adjustment differs from stat.
 * Used by the Governance page summary line.
 */
export const consensusAdjustedCount = collabRecords.filter(
  (r) =>
    r.submission_status === "Submitted" &&
    r.adjusted_forecast_qty !== r.stat_forecast_qty
).length;
