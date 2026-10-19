/**
 * Port of utils/duplication_detector.py. Pure, deterministic overlap
 * detection across the scored portfolio — identifies likely-redundant
 * applications within the same category and proposes a consolidation
 * candidate + estimated savings.
 */
import type { Application, Duplication } from "./types";

function overlapScore(a: Application, b: Application): number {
  let score = 0.35; // same category baseline
  const subA = (a.subcategory ?? "").toLowerCase();
  const subB = (b.subcategory ?? "").toLowerCase();
  if (subA && subB && subA === subB) score += 0.25;

  const buA = (a.business_unit ?? "").toLowerCase();
  const buB = (b.business_unit ?? "").toLowerCase();
  if (buA && buB && buA === buB) score += 0.15;

  const vA = (a.vendor ?? "").toLowerCase();
  const vB = (b.vendor ?? "").toLowerCase();
  if (vA && vB && vA !== vB) score += 0.1;

  const uA = a.user_count ?? 0;
  const uB = b.user_count ?? 0;
  if (uA > 0 && uB > 0 && Math.min(uA, uB) / Math.max(uA, uB) > 0.5) score += 0.1;

  return Math.min(1.0, score);
}

function buildRecord(a: Application, b: Application, overlap: number, category: string): Duplication {
  const overlapPct = Math.round(overlap * 100);
  const scoreA = a.composite_score ?? 5.0;
  const scoreB = b.composite_score ?? 5.0;
  const [retain, consolidate] = scoreA >= scoreB ? [a, b] : [b, a];
  const retainScore = Math.max(scoreA, scoreB);
  const consolScore = Math.min(scoreA, scoreB);

  const costA = a.annual_cost ?? 0;
  const costB = b.annual_cost ?? 0;
  const potentialSavings = Math.round(Math.min(costA, costB) * (overlap / 2));
  const priority: Duplication["priority"] = overlapPct >= 70 ? "High" : overlapPct >= 55 ? "Medium" : "Low";

  const uidA = (a.id || "xxxx").slice(0, 8);
  const uidB = (b.id || "yyyy").slice(0, 8);

  return {
    id: `dup-${uidA}-${uidB}`,
    category,
    tool_a: a.name || "Unknown",
    tool_b: b.name || "Unknown",
    overlap_percentage: overlapPct,
    retain_candidate: retain.name,
    consolidate_candidate: consolidate.name,
    rationale:
      `${a.name} and ${b.name} show ${overlapPct}% functional overlap in the ${category} domain. ` +
      `${retain.name} is the strategic retention candidate (score: ${retainScore.toFixed(1)} vs ${consolScore.toFixed(1)}). ` +
      `Consolidating onto ${retain.name} could yield ~$${potentialSavings.toLocaleString()}/year.`,
    potential_annual_savings: potentialSavings,
    priority,
  };
}

export function detectDuplications(tools: Application[]): Duplication[] {
  const byCategory = new Map<string, Application[]>();
  for (const t of tools) {
    const cat = t.category || "Other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(t);
  }

  const duplications: Duplication[] = [];
  const seenPairIds = new Set<string>();
  const consolidateFlagged = new Set<string>();

  for (const [category, group] of byCategory) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((x, y) => (y.composite_score ?? 0) - (x.composite_score ?? 0));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        const bName = b.name ?? "";
        if (consolidateFlagged.has(bName)) continue;
        const pairKey = [a.name ?? "", bName].sort().join("|");
        if (seenPairIds.has(pairKey)) continue;
        const overlap = overlapScore(a, b);
        if (overlap >= 0.45) {
          const record = buildRecord(a, b, overlap, category);
          duplications.push(record);
          seenPairIds.add(pairKey);
          if (record.consolidate_candidate) consolidateFlagged.add(record.consolidate_candidate);
        }
      }
    }
  }

  return duplications.sort((a, b) => b.overlap_percentage - a.overlap_percentage);
}
