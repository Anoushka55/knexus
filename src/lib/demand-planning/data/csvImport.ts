import Papa from "papaparse";
import {
  DemandRecord,
  DemandSegment,
  SkuSegmentInfo,
  SKU_SEGMENTS,
  OWNERS,
  detectRcaSignals,
  classifyRootCause,
  computeConfidence,
  routeApprovalTier,
  buildRecommendedAction,
} from "./mockData";

export const EXPECTED_COLUMNS = [
  "sku_id",
  "sku_name",
  "category",
  "brand_name",
  "depot_id",
  "depot_name",
  "account_id",
  "account_name",
  "period",
  "forecast_qty",
  "sell_in_qty",
  "offtake_qty",
  "stock_on_hand",
  "lead_time_days",
  "promo_flag",
  "promo_lift_pct",
  "promo_has_history",
] as const;

export type ExpectedColumn = (typeof EXPECTED_COLUMNS)[number];

export interface CsvImportResult {
  records: DemandRecord[];
  errors: string[];
}

// Normalize a header string for flexible matching
function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

// Build a column → CSV-header index map
function buildColumnMap(
  csvHeaders: string[],
  expected: readonly string[]
): { map: Record<string, number>; missing: string[] } {
  const normalized = csvHeaders.map(normalizeHeader);
  const map: Record<string, number> = {};
  const missing: string[] = [];

  for (const col of expected) {
    const idx = normalized.indexOf(normalizeHeader(col));
    if (idx === -1) {
      missing.push(col);
    } else {
      map[col] = idx;
    }
  }
  return { map, missing };
}

function getStr(row: string[], map: Record<string, number>, col: string): string {
  return (row[map[col]] ?? "").trim();
}

function getNum(row: string[], map: Record<string, number>, col: string): number {
  return parseFloat(getStr(row, map, col)) || 0;
}

function getBool(row: string[], map: Record<string, number>, col: string): boolean {
  const v = getStr(row, map, col).toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

// Compute segment info for a SKU not in the built-in map
function computeSegment(skuId: string, skuName: string, offtakeValues: number[]): SkuSegmentInfo {
  if (offtakeValues.length < 3) {
    return { sku_id: skuId, sku_name: skuName, segment: "New", cv: 0, mean_volume: 0, rationale: "Fewer than 3 periods of data — treated as New SKU." };
  }
  const mean = offtakeValues.reduce((s, v) => s + v, 0) / offtakeValues.length;
  const variance = offtakeValues.reduce((s, v) => s + (v - mean) ** 2, 0) / offtakeValues.length;
  const std = Math.sqrt(variance);
  const cv = mean > 0 ? std / mean : 0;

  let segment: DemandSegment;
  let rationale: string;

  if (cv < 0.15) {
    segment = "Stable";
    rationale = `Low coefficient of variation (${cv.toFixed(2)}) — stable demand pattern.`;
  } else if (cv <= 0.3) {
    segment = "Seasonal";
    rationale = `Moderate coefficient of variation (${cv.toFixed(2)}) — possible seasonal pattern.`;
  } else {
    segment = "Erratic";
    rationale = `High coefficient of variation (${cv.toFixed(2)}) — erratic demand pattern.`;
  }

  return { sku_id: skuId, sku_name: skuName, segment, cv, mean_volume: mean, rationale };
}

const PRICE_BY_CATEGORY: Record<string, number> = {
  Staples: 280,
  Beverages: 65,
  "Home Care": 220,
  "Personal Care": 150,
  Snacks: 45,
};

export async function parseCsvFile(file: File): Promise<CsvImportResult> {
  return new Promise((resolve) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete(result) {
        const rows = result.data as string[][];
        if (rows.length < 2) {
          resolve({ records: [], errors: ["CSV file is empty or contains only a header row."] });
          return;
        }

        const headerRow = rows[0];
        const { map, missing } = buildColumnMap(headerRow, EXPECTED_COLUMNS);

        if (missing.length > 0) {
          resolve({
            records: [],
            errors: [
              `Missing required columns: ${missing.join(", ")}.`,
              `Expected columns are: ${EXPECTED_COLUMNS.join(", ")}.`,
              `Column names are matched case-insensitively. Spaces and hyphens are treated as underscores.`,
            ],
          });
          return;
        }

        // First pass: collect offtake values per sku_id for segmentation
        const skuOfftake: Record<string, number[]> = {};
        const skuNames: Record<string, string> = {};
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const skuId = getStr(row, map, "sku_id");
          const offtake = getNum(row, map, "offtake_qty");
          if (!skuOfftake[skuId]) skuOfftake[skuId] = [];
          skuOfftake[skuId].push(offtake);
          skuNames[skuId] = getStr(row, map, "sku_name");
        }

        // Build runtime segments map (starts as a copy of built-in, extends with computed entries)
        const runtimeSegments: Record<string, SkuSegmentInfo> = { ...SKU_SEGMENTS };
        for (const [skuId, offtakeValues] of Object.entries(skuOfftake)) {
          if (!runtimeSegments[skuId]) {
            runtimeSegments[skuId] = computeSegment(skuId, skuNames[skuId], offtakeValues);
          }
        }

        const records: DemandRecord[] = [];
        const errors: string[] = [];
        const today = new Date();

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          try {
            const skuId = getStr(row, map, "sku_id");
            const skuName = getStr(row, map, "sku_name");
            const category = getStr(row, map, "category");
            const brandName = getStr(row, map, "brand_name");
            const depotId = getStr(row, map, "depot_id");
            const depotName = getStr(row, map, "depot_name");
            const accountId = getStr(row, map, "account_id");
            const accountName = getStr(row, map, "account_name");
            const period = getStr(row, map, "period");
            const forecastQty = getNum(row, map, "forecast_qty");
            const sellInQty = getNum(row, map, "sell_in_qty");
            const offtakeQty = getNum(row, map, "offtake_qty");
            const stockOnHand = getNum(row, map, "stock_on_hand");
            const leadTimeDays = getNum(row, map, "lead_time_days");
            const promoFlag = getBool(row, map, "promo_flag");
            const promoLiftPct = getNum(row, map, "promo_lift_pct");
            const promoHasHistory = getBool(row, map, "promo_has_history");

            // Derived KPIs
            const biasPct = offtakeQty !== 0 ? ((forecastQty - offtakeQty) / offtakeQty) * 100 : 0;
            const faPct = Math.min(100, Math.max(0, 100 - Math.abs(biasPct)));
            const coverageWeeks = offtakeQty !== 0 ? (stockOnHand / offtakeQty) * 4 : 0;

            const segmentInfo = runtimeSegments[skuId] ?? computeSegment(skuId, skuName, skuOfftake[skuId] ?? [offtakeQty]);
            const segment = segmentInfo.segment;

            // RCA pipeline
            const partialRec = { period, bias_pct: biasPct, fa_pct: faPct, promo_flag: promoFlag, promo_has_history: promoHasHistory, stock_on_hand: stockOnHand, offtake_qty: offtakeQty, data_quality_flag: "none" as const };
            const signals = detectRcaSignals(partialRec, segment);
            const rcaResult = classifyRootCause(signals);

            const confBreakdown = computeConfidence(rcaResult.tag, segment, rcaResult.signalsHit, rcaResult.signalsExpected, []);
            const confidence = confBreakdown.confidence;

            const price = PRICE_BY_CATEGORY[category] ?? 100;
            const financialImpact = Math.abs(biasPct) / 100 * offtakeQty * price;

            const approvalTier = routeApprovalTier(financialImpact, confidence);
            const recommendedAction = buildRecommendedAction(rcaResult.tag, segment, biasPct, skuName);

            const exceptionStatus = rcaResult.tag !== "None" ? "Open" : "Closed";
            const ownerIdx = (records.length) % OWNERS.length;
            const slaDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

            records.push({
              sku_id: skuId,
              sku_name: skuName,
              category,
              brand_name: brandName,
              depot_id: depotId,
              depot_name: depotName,
              account_id: accountId,
              account_name: accountName,
              period,
              forecast_qty: forecastQty,
              sell_in_qty: sellInQty,
              offtake_qty: offtakeQty,
              stock_on_hand: stockOnHand,
              lead_time_days: leadTimeDays,
              fa_pct: faPct,
              bias_pct: biasPct,
              coverage_weeks: coverageWeeks,
              promo_flag: promoFlag,
              promo_lift_pct: promoLiftPct,
              promo_has_history: promoHasHistory,
              data_quality_flag: "none",
              root_cause_tag: rcaResult.tag,
              rca_confidence_pct: Math.round(confidence),
              rca_signals: rcaResult.signals,
              financial_impact_inr: financialImpact,
              exception_status: exceptionStatus as "Open" | "Closed" | "Escalated",
              approval_tier: approvalTier,
              recommended_action: recommendedAction,
              owner: OWNERS[ownerIdx],
              sla_date: slaDate,
            });
          } catch {
            errors.push(`Row ${i + 1}: Failed to parse — check that all numeric fields contain valid numbers.`);
          }
        }

        resolve({ records, errors });
      },
      error(err) {
        resolve({ records: [], errors: [`Failed to read file: ${err.message}`] });
      },
    });
  });
}
