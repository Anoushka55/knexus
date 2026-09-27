import type { IndustryBenchmark } from "@/lib/assessments/types";

/**
 * The starting position the capture grid is pre-filled with.
 *
 * This is the mechanic that makes the assessment a conversation rather than a
 * form: the room opens on a plausible position and spends its time arguing with
 * it — the same reason the P2P engine ships ERP-landscape benchmarks instead of
 * an empty table.
 *
 * It is NOT survey data, which is why `disclosure` is required on the type and
 * renders wherever a delta appears. Every number below is an editorial starting
 * point derived from KPMG portfolio experience in TMT.
 *
 * The shape encoded here, which is the part worth defending:
 *   - business maturity runs ahead of agentic maturity almost everywhere;
 *   - the two are closest where volume justified AI early (care, digital
 *     channels, network analytics) and furthest apart in the legacy estate,
 *     data foundations and the newer governance disciplines;
 *   - targets sit one to two rungs above current, not at 5 — a target of 5
 *     everywhere is what an unserious assessment produces.
 */
const DISCLOSURE =
  "Illustrative starting position derived from KPMG portfolio experience in TMT, not a published benchmark study. It is meant to be corrected in the room.";

export const TELECOM_BENCHMARKS: IndustryBenchmark[] = [
  {
    id: "telecom-enterprise",
    label: "Telecommunications — enterprise-wide",
    disclosure: DISCLOSURE,
    // Set close to the mean of the rows below: an untouched run should sit at
    // the benchmark, not flatter the client before they have answered anything.
    peer: { business: 2.8, agentic: 2.0 },
    rows: {
      // Enterprise Strategy — well-run as a discipline, barely agented at all.
      "market-sensing": { business: 3, agentic: 2, target: 4 },
      "competitive-intelligence": { business: 3, agentic: 2, target: 4 },
      "strategic-foresight": { business: 3, agentic: 2, target: 4 },
      "strategy-investment-portfolio": { business: 4, agentic: 2, target: 4 },
      "value-realisation": { business: 2, agentic: 2, target: 4 },

      // Customer & Market — sustained investment, and the earliest real AI.
      "customer-feedback-analysis": { business: 3, agentic: 2, target: 4 },
      "journey-orchestration": { business: 3, agentic: 2, target: 4 },
      "churn-value-intelligence": { business: 4, agentic: 3, target: 5 },
      "digital-channels": { business: 4, agentic: 4, target: 5 },
      "product-offer-lifecycle": { business: 3, agentic: 2, target: 4 },

      // Network & Service — the most instrumented estate, and the most to gain.
      "network-planning-capacity": { business: 4, agentic: 3, target: 5 },
      "service-assurance-sla": { business: 3, agentic: 3, target: 5 },
      "fault-incident-management": { business: 3, agentic: 2, target: 5 },
      "observability-telemetry": { business: 3, agentic: 3, target: 4 },
      "datacentre-cloud-edge": { business: 3, agentic: 2, target: 4 },

      // Operations — high volume, high manual residue outside care.
      "order-to-activate": { business: 3, agentic: 3, target: 4 },
      "care-contact-resolution": { business: 3, agentic: 4, target: 5 },
      "field-workforce-dispatch": { business: 3, agentic: 2, target: 4 },
      "process-automation": { business: 3, agentic: 2, target: 4 },
      "revenue-assurance-fraud": { business: 3, agentic: 2, target: 4 },

      // Technology & Data — where the legacy drag concentrates.
      "legacy-estate-modernisation": { business: 3, agentic: 1, target: 4 },
      "oss-bss-modernisation": { business: 3, agentic: 1, target: 4 },
      "architecture-governance": { business: 3, agentic: 2, target: 4 },
      "data-foundation-quality": { business: 2, agentic: 1, target: 4 },
      "analytics-ai-decisioning": { business: 3, agentic: 3, target: 4 },

      // People & Organization — the newest disciplines, the least formalised.
      "workforce-skills-change": { business: 2, agentic: 1, target: 3 },
      "ai-governance-responsible": { business: 3, agentic: 2, target: 4 },
      "agent-operations-orchestration": { business: 2, agentic: 2, target: 4 },
    },
  },
];
