import type { AssessmentDefinition } from "@/lib/assessments/types";

/**
 * The two assessments that predate this engine.
 *
 * They are listed on the hub but not served by [slug]: the P2P model is
 * activity-and-minutes shaped and the SMB model is a pain-coverage set, and
 * neither is a capability-maturity grid. Forcing all three through one
 * abstraction would cost more than it saves, so they keep their own routes and
 * their own providers and are linked here by `href`.
 *
 * The empty rubric/groups/capabilities arrays are inert — nothing reads them
 * for a `legacy` entry.
 */
function legacyEntry(
  entry: Pick<
    AssessmentDefinition,
    "slug" | "title" | "kicker" | "summary" | "estimateMinutes" | "iconName" | "href"
  >,
): AssessmentDefinition {
  return {
    ...entry,
    status: "legacy",
    depth: "deep",
    scopes: [],
    rubric: [],
    groups: [],
    capabilities: [],
    benchmarks: [],
    defaultBenchmarkId: "",
    contentVersion: 1,
  };
}

export const LEGACY_ASSESSMENTS: AssessmentDefinition[] = [
  legacyEntry({
    slug: "procure-to-pay-automation",
    title: "Procure-to-Pay Automation Assessment",
    kicker: "Finance operations",
    summary:
      "Scores how much of the invoice lifecycle runs by hand against an ERP-landscape benchmark, and converts the recoverable effort into hours and cost.",
    estimateMinutes: 15,
    iconName: "Receipt",
    href: "/assessments/procure-to-pay-automation",
  }),
  legacyEntry({
    slug: "smb-managed-services",
    title: "SMB Managed Services Assessment",
    kicker: "Mid-market IT",
    summary:
      "Maps the operational pains a mid-market business is carrying onto the managed-service bundle that covers most of them.",
    estimateMinutes: 10,
    iconName: "ShieldCheck",
    href: "/assessments/smb-managed-services",
  }),
];
