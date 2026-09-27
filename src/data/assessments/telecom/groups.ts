import type { CapabilityGroup } from "@/lib/assessments/types";

/**
 * The six capability groups.
 *
 * `ontologyCategoryIds` reference src/data/tmtOntology.ts CATEGORIES, which is
 * auto-generated from the KPMG Master Telecom Ontology and must not be edited —
 * we only point at it, so a group can show which TM Forum domains it covers.
 * `pillarIds` reference src/data/tmtSolutions.ts, which is how a result joins
 * through to solutions, plays and anonymised credentials.
 */
export const TELECOM_GROUPS: CapabilityGroup[] = [
  {
    id: "enterprise-strategy",
    label: "Enterprise Strategy",
    shortLabel: "Enterprise Strategy",
    blurb:
      "How the organisation reads its market, sets direction, and holds investment to account for the value it promised.",
    ontologyCategoryIds: ["01", "15"],
    pillarIds: ["business-model-reinvention", "value-delivery-office"],
  },
  {
    id: "customer-market",
    label: "Customer & Market",
    shortLabel: "Customer & Market",
    blurb:
      "How customers are understood, engaged and retained across channels, and how offers reach them.",
    ontologyCategoryIds: ["02", "03", "11"],
    pillarIds: ["cx-transformation", "business-model-reinvention"],
  },
  {
    id: "network-service",
    label: "Network & Service",
    shortLabel: "Network & Service",
    blurb:
      "How the network and the services riding on it are planned, watched and kept within their commitments.",
    ontologyCategoryIds: ["04", "05", "06", "07", "18"],
    pillarIds: ["infra-modernization"],
  },
  {
    id: "operations",
    label: "Operations",
    shortLabel: "Operations",
    blurb:
      "How work actually gets done day to day — orders fulfilled, faults cleared, people dispatched, revenue protected.",
    ontologyCategoryIds: ["10", "12", "16"],
    pillarIds: ["infra-modernization", "cx-transformation"],
  },
  {
    id: "technology-data",
    label: "Technology & Data",
    shortLabel: "Technology & Data",
    blurb:
      "The estate underneath everything else — platforms, architecture, and whether the data is fit to decide on.",
    ontologyCategoryIds: ["06", "14", "19", "21"],
    pillarIds: ["infra-modernization", "ai-data-monetization"],
  },
  {
    id: "people-organization",
    label: "People & Organization",
    shortLabel: "People & Org",
    blurb:
      "Whether the organisation can absorb the change — skills, governance, and the discipline to run agents safely.",
    ontologyCategoryIds: ["13", "16", "17"],
    pillarIds: ["value-delivery-office", "ai-data-monetization"],
  },
];
