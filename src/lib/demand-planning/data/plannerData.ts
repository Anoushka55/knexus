export interface PlannerRecord {
  planner: string;
  sku_name: string;
  period: string;
  og_forecast_qty: number;
  final_forecast_qty: number;
  actual_sale_qty: number;
  og_accuracy_pct: number;
  final_accuracy_pct: number;
}

export interface PlannerSummary {
  planner: string;
  avgOgAccuracy: number;
  avgFinalAccuracy: number;
  delta: number;
  recordCount: number;
}

function acc(forecast: number, actual: number): number {
  return Math.min(100, Math.max(0, 100 - (Math.abs(forecast - actual) / actual) * 100));
}

function r(planner: string, sku: string, period: string, og: number, final: number, actual: number): PlannerRecord {
  return { planner, sku_name: sku, period, og_forecast_qty: og, final_forecast_qty: final, actual_sale_qty: actual, og_accuracy_pct: acc(og, actual), final_accuracy_pct: acc(final, actual) };
}

// A. Sharma — consistently improves, avg delta ~+8pp
const sharmaRecords: PlannerRecord[] = [
  r("A. Sharma", "Sunrise Atta 5kg",       "2025-07", 1200, 1150, 1120),
  r("A. Sharma", "Tata Salt 1kg",           "2025-07", 850,  820,  810),
  r("A. Sharma", "Surf Excel 1kg",          "2025-08", 640,  590,  580),
  r("A. Sharma", "Maggi Noodles 70g",       "2025-08", 3200, 3050, 3000),
  r("A. Sharma", "Dettol Soap 75g",         "2025-09", 1800, 1720, 1700),
  r("A. Sharma", "Sunrise Atta 5kg",        "2025-09", 1350, 1290, 1280),
  r("A. Sharma", "Amul Butter 500g",        "2025-10", 760,  730,  720),
  r("A. Sharma", "Tata Salt 1kg",           "2025-10", 920,  890,  880),
  r("A. Sharma", "Maggi Noodles 70g",       "2025-11", 4200, 4050, 4000),
  r("A. Sharma", "Dettol Soap 75g",         "2025-11", 2100, 2010, 2000),
  r("A. Sharma", "Surf Excel 1kg",          "2025-12", 780,  750,  740),
  r("A. Sharma", "Amul Butter 500g",        "2025-12", 850,  810,  800),
  r("A. Sharma", "Sunrise Atta 5kg",        "2026-01", 1100, 1060, 1050),
  r("A. Sharma", "Maggi Noodles 70g",       "2026-01", 2800, 2720, 2700),
  r("A. Sharma", "Tata Salt 1kg",           "2026-02", 870,  840,  830),
  r("A. Sharma", "Dettol Soap 75g",         "2026-02", 1650, 1580, 1560),
  r("A. Sharma", "Surf Excel 1kg",          "2026-03", 700,  670,  660),
];

// P. Iyer — strong improver, avg delta ~+5pp
const iyerRecords: PlannerRecord[] = [
  r("P. Iyer", "Horlicks 500g",            "2025-07", 540,  510,  500),
  r("P. Iyer", "Britannia Biscuits 100g",  "2025-07", 4800, 4600, 4550),
  r("P. Iyer", "Clinic Plus Shampoo",      "2025-08", 1100, 1050, 1030),
  r("P. Iyer", "Horlicks 500g",            "2025-08", 620,  590,  580),
  r("P. Iyer", "Britannia Biscuits 100g",  "2025-09", 5200, 4980, 4900),
  r("P. Iyer", "Clinic Plus Shampoo",      "2025-09", 1250, 1190, 1170),
  r("P. Iyer", "Vim Dishwash Bar",         "2025-10", 2200, 2100, 2080),
  r("P. Iyer", "Horlicks 500g",            "2025-10", 700,  670,  660),
  r("P. Iyer", "Britannia Biscuits 100g",  "2025-11", 6100, 5850, 5800),
  r("P. Iyer", "Vim Dishwash Bar",         "2025-11", 2500, 2380, 2350),
  r("P. Iyer", "Clinic Plus Shampoo",      "2025-12", 1400, 1340, 1310),
  r("P. Iyer", "Horlicks 500g",            "2025-12", 780,  750,  740),
  r("P. Iyer", "Britannia Biscuits 100g",  "2026-01", 4500, 4310, 4280),
  r("P. Iyer", "Vim Dishwash Bar",         "2026-02", 2100, 2020, 1990),
  r("P. Iyer", "Clinic Plus Shampoo",      "2026-03", 1150, 1090, 1070),
  r("P. Iyer", "Horlicks 500g",            "2026-03", 660,  630,  610),
];

// R. Khanna — roughly neutral, avg delta ~+1pp, mixed calls
const khannaRecords: PlannerRecord[] = [
  r("R. Khanna", "Ariel 1kg",              "2025-07", 480,  510,  490),  // overshot slightly
  r("R. Khanna", "Lays Chips 26g",         "2025-07", 7200, 6900, 6800),
  r("R. Khanna", "Ariel 1kg",              "2025-08", 550,  520,  530),  // went too low
  r("R. Khanna", "Colgate 200g",           "2025-08", 1600, 1540, 1520),
  r("R. Khanna", "Lays Chips 26g",         "2025-09", 8100, 7800, 7750),
  r("R. Khanna", "Colgate 200g",           "2025-09", 1750, 1700, 1680),
  r("R. Khanna", "Ariel 1kg",              "2025-10", 600,  640,  610),  // overshot
  r("R. Khanna", "Lays Chips 26g",         "2025-10", 7500, 7200, 7180),
  r("R. Khanna", "Colgate 200g",           "2025-11", 1900, 1840, 1820),
  r("R. Khanna", "Ariel 1kg",              "2025-11", 640,  610,  600),
  r("R. Khanna", "Lays Chips 26g",         "2025-12", 9200, 8850, 8900),  // overshot
  r("R. Khanna", "Colgate 200g",           "2025-12", 2000, 1940, 1920),
  r("R. Khanna", "Ariel 1kg",              "2026-01", 580,  555,  550),
  r("R. Khanna", "Lays Chips 26g",         "2026-02", 7000, 6750, 6700),
  r("R. Khanna", "Colgate 200g",           "2026-02", 1700, 1650, 1640),
  r("R. Khanna", "Ariel 1kg",              "2026-03", 520,  560,  540),  // overshot
  r("R. Khanna", "Lays Chips 26g",         "2026-03", 6800, 6550, 6520),
  r("R. Khanna", "Colgate 200g",           "2026-03", 1650, 1620, 1600),
];

// S. Mehta — slight net negative, avg delta ~-2pp, overrides occasionally hurt
const mehtaRecords: PlannerRecord[] = [
  r("S. Mehta", "Glucon-D 200g",           "2025-07", 920,  980,  930),  // overcorrected up
  r("S. Mehta", "Parle-G 200g",            "2025-07", 5500, 5200, 5150),
  r("S. Mehta", "Glucon-D 200g",           "2025-08", 1050, 1120, 1060),  // overcorrected
  r("S. Mehta", "Parle-G 200g",            "2025-08", 6000, 5700, 5650),
  r("S. Mehta", "Pepsodent 150g",          "2025-09", 1300, 1400, 1320),  // overcorrected up
  r("S. Mehta", "Glucon-D 200g",           "2025-09", 980,  1060, 1000),  // overcorrected
  r("S. Mehta", "Parle-G 200g",            "2025-10", 7200, 6850, 6900),
  r("S. Mehta", "Pepsodent 150g",          "2025-10", 1450, 1550, 1470),  // overcorrected
  r("S. Mehta", "Glucon-D 200g",           "2025-11", 1100, 1200, 1140),  // overcorrected
  r("S. Mehta", "Parle-G 200g",            "2025-11", 8000, 7600, 7700),
  r("S. Mehta", "Pepsodent 150g",          "2025-12", 1600, 1700, 1640),  // overcorrected
  r("S. Mehta", "Glucon-D 200g",           "2025-12", 1050, 1130, 1070),  // overcorrected
  r("S. Mehta", "Parle-G 200g",            "2026-01", 6500, 6200, 6300),
  r("S. Mehta", "Pepsodent 150g",          "2026-02", 1400, 1310, 1290),
  r("S. Mehta", "Glucon-D 200g",           "2026-02", 1000, 1080, 1020),  // overcorrected
  r("S. Mehta", "Parle-G 200g",            "2026-03", 5800, 5500, 5620),
  r("S. Mehta", "Pepsodent 150g",          "2026-03", 1350, 1450, 1380),  // overcorrected
];

// V. Reddy — worst performer, avg delta ~-4pp, frequent overcorrections
const reddyRecords: PlannerRecord[] = [
  r("V. Reddy", "Bournvita 500g",          "2025-07", 680,  780,  700),  // big overcorrection
  r("V. Reddy", "Kurkure 80g",             "2025-07", 3800, 4200, 3900),  // overcorrected
  r("V. Reddy", "Bournvita 500g",          "2025-08", 750,  860,  780),  // overcorrected
  r("V. Reddy", "Kurkure 80g",             "2025-08", 4200, 4700, 4300),  // overcorrected
  r("V. Reddy", "Dove Soap 100g",          "2025-09", 1400, 1600, 1450),  // overcorrected
  r("V. Reddy", "Bournvita 500g",          "2025-09", 820,  940,  850),  // overcorrected
  r("V. Reddy", "Kurkure 80g",             "2025-10", 5000, 5600, 5100),  // overcorrected
  r("V. Reddy", "Dove Soap 100g",          "2025-10", 1550, 1750, 1600),  // overcorrected
  r("V. Reddy", "Bournvita 500g",          "2025-11", 900,  800,  880),  // undershot
  r("V. Reddy", "Kurkure 80g",             "2025-11", 6000, 6700, 6100),  // overcorrected
  r("V. Reddy", "Dove Soap 100g",          "2025-12", 1700, 1920, 1750),  // overcorrected
  r("V. Reddy", "Bournvita 500g",          "2025-12", 980,  1110, 1010),  // overcorrected
  r("V. Reddy", "Kurkure 80g",             "2026-01", 5200, 4600, 5100),  // undershot badly
  r("V. Reddy", "Dove Soap 100g",          "2026-02", 1600, 1820, 1650),  // overcorrected
  r("V. Reddy", "Bournvita 500g",          "2026-02", 860,  980,  890),  // overcorrected
  r("V. Reddy", "Kurkure 80g",             "2026-03", 4800, 5400, 4900),  // overcorrected
];

const allRecords: PlannerRecord[] = [
  ...sharmaRecords,
  ...iyerRecords,
  ...khannaRecords,
  ...mehtaRecords,
  ...reddyRecords,
];

export function getPlannerLeaderboard(): PlannerSummary[] {
  const byPlanner: Record<string, PlannerRecord[]> = {};
  for (const rec of allRecords) {
    if (!byPlanner[rec.planner]) byPlanner[rec.planner] = [];
    byPlanner[rec.planner].push(rec);
  }

  return Object.entries(byPlanner)
    .map(([planner, records]) => {
      const avgOg = records.reduce((s, r) => s + r.og_accuracy_pct, 0) / records.length;
      const avgFinal = records.reduce((s, r) => s + r.final_accuracy_pct, 0) / records.length;
      return {
        planner,
        avgOgAccuracy: avgOg,
        avgFinalAccuracy: avgFinal,
        delta: avgFinal - avgOg,
        recordCount: records.length,
      };
    })
    .sort((a, b) => b.delta - a.delta);
}
