import type { AssessmentDefinition } from "@/lib/assessments/types";

/**
 * Registered but not yet authored.
 *
 * Both reuse the same engine and the same rubric spine — what they need is a
 * capability set, a crosswalk and a benchmark grid of their own. Listing them
 * is honest about the roadmap; the hub renders them as disabled cards.
 */
function comingSoon(
  entry: Pick<
    AssessmentDefinition,
    "slug" | "title" | "kicker" | "summary" | "estimateMinutes" | "iconName"
  >,
): AssessmentDefinition {
  return {
    ...entry,
    status: "coming-soon",
    depth: "deep",
    scopes: [],
    rubric: [],
    groups: [],
    capabilities: [],
    benchmarks: [],
    defaultBenchmarkId: "",
    contentVersion: 0,
  };
}

export const COMING_SOON: AssessmentDefinition[] = [
  comingSoon({
    slug: "media-ai-agentic-maturity",
    title: "Media AI & Agentic Maturity Assessment",
    kicker: "Media & Entertainment",
    summary:
      "Content supply chain, rights, audience and advertising capabilities on the same two scales.",
    estimateMinutes: 25,
    iconName: "Clapperboard",
  }),
  comingSoon({
    slug: "technology-ai-agentic-maturity",
    title: "Technology AI & Agentic Maturity Assessment",
    kicker: "Technology",
    summary:
      "Product engineering, platform operations and go-to-market capabilities on the same two scales.",
    estimateMinutes: 25,
    iconName: "Cpu",
  }),
];
