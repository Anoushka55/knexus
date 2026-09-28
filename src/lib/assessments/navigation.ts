import type { AssessmentDefinition } from "./types";

/**
 * The sidebar's single source of truth.
 *
 * Steps are nested one level deep — Results expands into its sub-views — which
 * is what the horizontal Stepper in the two older assessments could not express
 * and why this replaces it rather than extending it.
 */

export interface AssessmentStep {
  href: string;
  label: string;
}

/**
 * Three flat steps.
 *
 * Results used to fan out into six sub-views, which meant the one screen
 * people actually want — scores, gaps and the agents that close them — was
 * spread across five pages and a second layer of navigation. It is now a
 * single dashboard, and the long-form detail lives in the report.
 */
export function stepsFor(definition: AssessmentDefinition): AssessmentStep[] {
  const base = `/assessments/${definition.slug}`;
  return [
    { href: base, label: "Industry & Scope" },
    { href: `${base}/assessment`, label: "Assessment" },
    { href: `${base}/results`, label: "Results" },
  ];
}

/** Which top-level step a path sits in. -1 when the path is outside the flow. */
export function activeStepIndex(steps: AssessmentStep[], pathname: string): number {
  // Longest match first, so /results/gaps resolves to Results rather than to
  // whichever step happens to be a prefix of it.
  let best = -1;
  let bestLength = -1;
  steps.forEach((step, index) => {
    const matches = pathname === step.href || pathname.startsWith(`${step.href}/`);
    if (matches && step.href.length > bestLength) {
      best = index;
      bestLength = step.href.length;
    }
  });
  return best;
}
