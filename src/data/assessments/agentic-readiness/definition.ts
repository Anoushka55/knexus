import type {
  AssessmentDefinition,
  Capability,
  CapabilityGroup,
  IndustryBenchmark,
} from "@/lib/assessments/types";
import { MATURITY_RUBRIC } from "@/data/assessments/rubric";

/**
 * The short cross-TMT read: twelve capabilities, four groups, about ten minutes.
 *
 * Built entirely from the same engine, the same rubric spine and the same
 * types as the telecom assessment — no new scoring, no new components. That is
 * the test of whether the abstraction was worth having.
 *
 * Deliberately sector-neutral where the telecom one is specific, so it suits
 * Media and Technology conversations as well as Telecom.
 */

const GROUPS: CapabilityGroup[] = [
  {
    id: "direction",
    label: "Direction & Value",
    shortLabel: "Direction",
    blurb: "Whether AI investment is aimed at something, and whether anyone checks it landed.",
    ontologyCategoryIds: ["01"],
    pillarIds: ["business-model-reinvention", "value-delivery-office"],
  },
  {
    id: "foundations",
    label: "Data & Platform Foundations",
    shortLabel: "Foundations",
    blurb: "Whether the data and the platform underneath can carry an agent safely.",
    ontologyCategoryIds: ["14", "06"],
    pillarIds: ["ai-data-monetization", "infra-modernization"],
  },
  {
    id: "delivery",
    label: "Delivery & Operations",
    shortLabel: "Delivery",
    blurb: "Whether agents reach production, and what happens to them once they are there.",
    ontologyCategoryIds: ["10", "21"],
    pillarIds: ["infra-modernization", "ai-data-monetization"],
  },
  {
    id: "trust",
    label: "Trust & Adoption",
    shortLabel: "Trust",
    blurb: "Whether the organisation governs what it deploys and actually uses what it builds.",
    ontologyCategoryIds: ["13", "17", "16"],
    pillarIds: ["value-delivery-office", "cx-transformation"],
  },
];

const CAPABILITIES: Capability[] = [
  {
    id: "ai-strategy",
    groupId: "direction",
    label: "AI strategy & prioritisation",
    prompt: "Is there an agreed view of where AI should be applied first, and why those places?",
    levelAnchor:
      "A prioritised set of use cases exists with named owners, scored consistently against business value.",
    evidence: ["The current use-case portfolio", "How candidates are scored and rejected"],
    agentIds: ["strategy-navigator"],
    challengeIds: ["execution-value-gap"],
    priorityIds: ["scaling-ai-responsibly"],
  },
  {
    id: "value-tracking",
    groupId: "direction",
    label: "Value tracking",
    prompt: "Once an AI initiative ships, how is the value it promised measured?",
    levelAnchor:
      "Benefits are baselined before build and tracked after release by someone other than the builder.",
    evidence: ["A business case with its post-implementation review", "Who signs off benefits"],
    agentIds: ["dcf-agent", "ai-spend-optimization"],
    challengeIds: ["value-proof"],
    priorityIds: ["from-investment-to-impact"],
  },
  {
    id: "spend-control",
    groupId: "direction",
    label: "AI spend & unit economics",
    prompt: "Do you know what AI costs you per outcome, and is that trending the right way?",
    levelAnchor: "Spend is attributed to use cases and tracked against the value they return.",
    evidence: ["Current AI spend by use case", "Cost per transaction or per resolution"],
    agentIds: ["ai-spend-optimization", "cost-optimization-ledger"],
    challengeIds: ["value-proof"],
    priorityIds: ["from-investment-to-impact"],
  },
  {
    id: "data-quality",
    groupId: "foundations",
    label: "Data quality & ownership",
    prompt: "Is the data an agent would act on owned, measured and trusted?",
    levelAnchor: "Critical domains have owners and measured quality, and lineage is traceable.",
    evidence: ["Quality measures for the top domains", "Whether two systems agree on a total"],
    agentIds: [],
    challengeIds: ["data-readiness"],
    priorityIds: ["scaling-ai-responsibly"],
  },
  {
    id: "knowledge-access",
    groupId: "foundations",
    label: "Knowledge & context access",
    prompt: "Can a model reach the organisation's own knowledge, or is it working from general training?",
    levelAnchor:
      "Retrieval over governed internal sources is in place, with access controls respected at query time.",
    evidence: ["What sources are indexed today", "How permissions are enforced on retrieval"],
    agentIds: ["enterprise-architecture-agent"],
    challengeIds: ["data-readiness", "legacy-infra"],
    priorityIds: ["scaling-ai-responsibly"],
  },
  {
    id: "platform-integration",
    groupId: "foundations",
    label: "Platform & integration readiness",
    prompt: "Can an agent actually act in your systems, or only advise a person who then acts?",
    levelAnchor: "Stable APIs exist for the systems that matter, with service accounts and audit.",
    evidence: ["Which core systems expose a usable API", "How an agent authenticates today"],
    agentIds: ["platform-calibre", "cloud-infra-assessment"],
    challengeIds: ["legacy-infra", "process-tech-debt"],
    priorityIds: ["modernizing-legacy-tech"],
  },
  {
    id: "path-to-production",
    groupId: "delivery",
    label: "Path to production",
    prompt: "How long does an AI use case take to get from idea to something people rely on?",
    levelAnchor: "A repeatable route to production exists, and most pilots either ship or are stopped.",
    evidence: ["Pilots started vs shipped in the last year", "Time from idea to production"],
    agentIds: ["process-forge"],
    challengeIds: ["execution-value-gap"],
    priorityIds: ["transforming-operating-models"],
  },
  {
    id: "agent-operations",
    groupId: "delivery",
    label: "Agent operations",
    prompt: "Once live, how are agents monitored, versioned and escalated from?",
    levelAnchor: "Agents are run as production assets with ownership, monitoring and escalation.",
    evidence: ["How many agents are live and who owns them", "What happens when one is uncertain"],
    agentIds: ["enterprise-assessment-prism", "process-forge"],
    challengeIds: ["reactive-ops"],
    priorityIds: ["scaling-ai-responsibly"],
  },
  {
    id: "process-readiness",
    groupId: "delivery",
    label: "Process readiness",
    prompt: "Are the processes an agent would run documented well enough to hand over?",
    levelAnchor: "Target processes are documented with exceptions named, not just the happy path.",
    evidence: ["Process documentation for the top candidates", "Where exceptions currently go"],
    agentIds: ["process-forge", "legacy-tech-modernization"],
    challengeIds: ["process-tech-debt"],
    priorityIds: ["transforming-operating-models"],
  },
  {
    id: "ai-governance",
    groupId: "trust",
    label: "AI governance",
    prompt: "How is an AI use case approved, and who is accountable once it is live?",
    levelAnchor: "A defined approval path with risk classification exists and is actually used.",
    evidence: ["The use-case register and its approvals", "The last case that was refused"],
    agentIds: ["compliance-compass"],
    challengeIds: ["ai-governance", "cyber-trust-at-scale"],
    priorityIds: ["scaling-ai-responsibly"],
  },
  {
    id: "skills",
    groupId: "trust",
    label: "Skills & capacity",
    prompt: "Do you have the people to build and run this, or is it resting on a few individuals?",
    levelAnchor: "Skills are mapped against the plan with a funded route to close the gap.",
    evidence: ["The skills gap analysis", "How many people could run an agent unaided"],
    agentIds: [],
    challengeIds: ["talent-gap"],
    priorityIds: ["transforming-operating-models"],
  },
  {
    id: "adoption",
    groupId: "trust",
    label: "Adoption & trust",
    prompt: "Do the people meant to use what you build actually use it?",
    levelAnchor: "Adoption is measured after release and acted on when it stalls.",
    evidence: ["Adoption rates for the last two releases", "What was changed when adoption lagged"],
    agentIds: ["customer-journey-command-center"],
    challengeIds: ["talent-gap", "execution-value-gap"],
    priorityIds: ["transforming-operating-models"],
  },
];

const BENCHMARKS: IndustryBenchmark[] = [
  {
    id: "tmt-general",
    label: "TMT — cross-sector",
    disclosure:
      "Illustrative starting position derived from KPMG portfolio experience across TMT, not a published benchmark study. It is meant to be corrected in the room.",
    peer: { business: 2.6, agentic: 1.9 },
    rows: {
      "ai-strategy": { business: 3, agentic: 2, target: 4 },
      "value-tracking": { business: 2, agentic: 2, target: 4 },
      "spend-control": { business: 2, agentic: 2, target: 4 },
      "data-quality": { business: 2, agentic: 1, target: 4 },
      "knowledge-access": { business: 2, agentic: 2, target: 4 },
      "platform-integration": { business: 3, agentic: 2, target: 4 },
      "path-to-production": { business: 3, agentic: 2, target: 4 },
      "agent-operations": { business: 2, agentic: 2, target: 4 },
      "process-readiness": { business: 3, agentic: 2, target: 4 },
      "ai-governance": { business: 3, agentic: 2, target: 4 },
      skills: { business: 2, agentic: 1, target: 3 },
      adoption: { business: 3, agentic: 2, target: 4 },
    },
  },
];

export const agenticReadinessAssessment: AssessmentDefinition = {
  slug: "agentic-readiness-index",
  title: "TMT Agentic Readiness Index",
  kicker: "Cross-sector TMT",
  summary:
    "A short read on whether the organisation can actually deploy and run agents — direction, foundations, delivery and trust — in about ten minutes.",
  status: "live",
  depth: "index",
  estimateMinutes: 10,
  iconName: "Compass",
  scopes: [
    { id: "enterprise", label: "Enterprise Level", note: "The organisation as a whole." },
    { id: "function", label: "Function", note: "One function or operating unit." },
  ],
  rubric: MATURITY_RUBRIC,
  groups: GROUPS,
  capabilities: CAPABILITIES,
  benchmarks: BENCHMARKS,
  defaultBenchmarkId: "tmt-general",
  contentVersion: 1,
};
