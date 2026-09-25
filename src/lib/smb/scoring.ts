// SMB Assessment scoring — a pure function, same discipline as the P2P
// automation-assessment engine: same input, same output, every time.
//
// Simpler than P2P's mode-ladder because the underlying content is simpler:
// each pain either is or isn't a live problem for this client — there's no
// automation-maturity gradient to weigh. The score is coverage, not a
// waterfall, and deliberately carries no currency figure.

import { bundles, overarchingPainIds, type Bundle } from "@/data/smb/assessment";

export interface BundleCoverage {
  bundle: Bundle;
  coveredPainIds: string[];
  uncoveredPainIds: string[];
  /** Share of scoreable selected pains this bundle covers, 0..1. */
  coverage: number;
}

export interface SmbAssessmentResult {
  /** Selected pains excluding the two overarching ones (see assessment.ts). */
  scoreablePainIds: string[];
  /** Selected pains satisfied by whichever bundle is recommended, not scored per-bundle. */
  overarchingSelected: string[];
  coverageByBundle: BundleCoverage[];
  recommended: BundleCoverage | null;
}

export function assessSmb(selectedPainIds: string[]): SmbAssessmentResult {
  const scoreablePainIds = selectedPainIds.filter((id) => !overarchingPainIds.includes(id));
  const overarchingSelected = selectedPainIds.filter((id) => overarchingPainIds.includes(id));

  const coverageByBundle: BundleCoverage[] = bundles.map((bundle) => {
    const coveredPainIds = scoreablePainIds.filter((id) => bundle.painIds.includes(id));
    const uncoveredPainIds = scoreablePainIds.filter((id) => !bundle.painIds.includes(id));
    const coverage = scoreablePainIds.length > 0 ? coveredPainIds.length / scoreablePainIds.length : 0;
    return { bundle, coveredPainIds, uncoveredPainIds, coverage };
  });

  const recommended = coverageByBundle.reduce<BundleCoverage | null>((best, cur) => {
    if (!best) return cur;
    // Tie-break toward fewer components — the simpler bundle that covers
    // the same ground is the more defensible recommendation.
    if (cur.coverage > best.coverage) return cur;
    if (cur.coverage === best.coverage && cur.bundle.components.length < best.bundle.components.length) {
      return cur;
    }
    return best;
  }, null);

  return { scoreablePainIds, overarchingSelected, coverageByBundle, recommended };
}
