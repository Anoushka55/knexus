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
  /** Results sub-views. Rendered only while that step is the active one. */
  children?: { href: string; label: string }[];
}

export function stepsFor(definition: AssessmentDefinition): AssessmentStep[] {
  const base = `/assessments/${definition.slug}`;
  return [
    { href: base, label: "Industry & Scope" },
    { href: `${base}/assessment`, label: "Assessment" },
    {
      href: `${base}/results`,
      label: "Results",
      children: [
        { href: `${base}/results`, label: "Executive Summary" },
        { href: `${base}/results/capabilities`, label: "Capability View" },
        { href: `${base}/results/gaps`, label: "Gap Analysis" },
        { href: `${base}/results/recommendations`, label: "Recommendations" },
        { href: `${base}/results/roadmap`, label: "Roadmap" },
        { href: `${base}/results/report`, label: "Download Report" },
      ],
    },
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
