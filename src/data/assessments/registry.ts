import type { AssessmentDefinition } from "@/lib/assessments/types";
import { assertDefinition } from "@/lib/assessments/validate";
import { telecomAssessment } from "./telecom/definition";
import { agenticReadinessAssessment } from "./agentic-readiness/definition";
import { COMING_SOON } from "./coming-soon";
import { LEGACY_ASSESSMENTS } from "./legacy";

/**
 * The single module app routes import.
 *
 * Engine-backed assessments are the ones [slug] can serve. `coming-soon` and
 * `legacy` entries exist so the hub can list the full picture — legacy ones
 * carry their own `href` because they have their own capture models and their
 * own routes, and are deliberately not retrofitted onto this engine.
 */
export const ENGINE_ASSESSMENTS: AssessmentDefinition[] = [
  telecomAssessment,
  agenticReadinessAssessment,
];

export const ALL_ASSESSMENTS: AssessmentDefinition[] = [
  ...ENGINE_ASSESSMENTS,
  ...LEGACY_ASSESSMENTS,
  ...COMING_SOON,
];

/** Only ever returns an assessment this engine can actually run. */
export function getAssessment(slug: string): AssessmentDefinition | undefined {
  return ENGINE_ASSESSMENTS.find((a) => a.slug === slug);
}

export function assessmentSlugs(): string[] {
  return ENGINE_ASSESSMENTS.map((a) => a.slug);
}

// Fail loudly and immediately on inconsistent content, but never in production —
// a stray id should not be able to take the site down for a visitor.
if (process.env.NODE_ENV !== "production") {
  ENGINE_ASSESSMENTS.forEach(assertDefinition);
}
