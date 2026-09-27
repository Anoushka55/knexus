import type { Capability } from "@/lib/assessments/types";

/**
 * The 28 capabilities, five or fewer per group.
 *
 * `agentIds` is the crosswalk into src/data/agents.ts and is what turns a score
 * into a recommendation. It lives here rather than on AgentData for the same
 * reason Activity.agentIds does in the P2P engine: the catalogue describes what
 * an agent is, and the assessment decides what it is for.
 *
 * Three capabilities carry an empty crosswalk on purpose. They are the honest
 * "nothing in the catalogue covers this yet" signal, and they surface as Agent
 * Forge candidates instead of being quietly dropped from the recommendations.
 *
 * `challengeIds` reference src/data/tmtSolutions.ts, whose challenges carry real
 * cited sources — so a gap can be tied back to something published.
 */
export const TELECOM_CAPABILITIES: Capability[] = [
  // ── 1. Enterprise Strategy ────────────────────────────────────────────────
  {
    id: "market-sensing",
    groupId: "enterprise-strategy",
    label: "Market sensing",
    prompt:
      "How do you detect shifts in market conditions, tariffs and customer behaviour — and how quickly does that reach a decision-maker?",
    levelAnchor:
      "Market signals are gathered continuously into an owned view, reviewed on a set cadence, and movements are quantified rather than described.",
    evidence: [
      "The last market review pack, and its date",
      "Which signals are collected automatically vs compiled by hand",
      "Time from a material market move to a decision being taken",
    ],
    agentIds: ["strategy-navigator", "customer-intelligence-sentinal"],
    challengeIds: ["data-readiness"],
    priorityIds: ["market-dynamics-consumer-shifts"],
  },
  {
    id: "competitive-intelligence",
    groupId: "enterprise-strategy",
    label: "Competitive intelligence",
    prompt:
      "How systematically are competitor pricing, propositions and network investments tracked and acted on?",
    levelAnchor:
      "Competitor moves are tracked against a defined watchlist, and pricing or proposition responses are modelled before they are committed.",
    evidence: [
      "The competitor watchlist and who maintains it",
      "The last three competitive responses and their lead time",
    ],
    agentIds: ["strategy-navigator", "kpmg-dice"],
    challengeIds: ["data-readiness"],
    priorityIds: ["market-dynamics-consumer-shifts"],
  },
  {
    id: "strategic-foresight",
    groupId: "enterprise-strategy",
    label: "Strategic foresight",
    prompt:
      "How do you model future scenarios — spectrum, technology shifts, demand — and test strategy against them?",
    levelAnchor:
      "Scenarios are modelled quantitatively on a repeatable basis and strategy is stress-tested against more than one future.",
    evidence: [
      "The scenario set currently in use",
      "Whether scenarios are refreshed on a cycle or only for planning season",
    ],
    agentIds: ["strategy-navigator", "demand-planning-agent"],
    challengeIds: ["execution-value-gap"],
    priorityIds: ["market-dynamics-consumer-shifts", "transforming-operating-models"],
  },
  {
    id: "strategy-investment-portfolio",
    groupId: "enterprise-strategy",
    label: "Strategy & investment portfolio",
    prompt:
      "How is the change portfolio prioritised, sequenced and rationalised against strategic objectives?",
    levelAnchor:
      "A single portfolio view exists with consistent scoring, and investments are actively stopped as well as started.",
    evidence: [
      "The current portfolio view and its scoring method",
      "Initiatives stopped in the last 12 months",
    ],
    agentIds: ["portfolio-rationalization", "dcf-agent"],
    challengeIds: ["execution-value-gap", "value-proof"],
    priorityIds: ["transforming-operating-models", "from-investment-to-impact"],
  },
  {
    id: "value-realisation",
    groupId: "enterprise-strategy",
    label: "Value realisation & business case",
    prompt:
      "Once an investment is approved, how is the promised value tracked to the P&L — and what happens when it does not land?",
    levelAnchor:
      "Benefits are baselined before approval and tracked after go-live by a named owner, with variance explained.",
    evidence: [
      "A business case with its post-implementation review attached",
      "How benefit ownership transfers from programme to line",
    ],
    agentIds: ["dcf-agent", "cost-optimization-ledger", "ai-spend-optimization"],
    challengeIds: ["value-proof", "execution-value-gap"],
    priorityIds: ["from-investment-to-impact"],
  },

  // ── 2. Customer & Market ──────────────────────────────────────────────────
  {
    id: "customer-feedback-analysis",
    groupId: "customer-market",
    label: "Customer feedback analysis",
    prompt:
      "How is customer feedback across surveys, contacts and social collected, analysed and turned into action?",
    levelAnchor:
      "Feedback is consolidated across channels, analysed for theme and sentiment continuously, and routed to an owner who closes the loop.",
    evidence: [
      "Where feedback from each channel lands today",
      "The last three changes made because of customer feedback",
    ],
    agentIds: ["customer-intelligence-sentinal"],
    challengeIds: ["cx-consistency", "data-readiness"],
    priorityIds: ["market-dynamics-consumer-shifts"],
  },
  {
    id: "journey-orchestration",
    groupId: "customer-market",
    label: "Journey orchestration across channels",
    prompt:
      "How consistent is a customer's experience as they move between app, web, retail, care and field?",
    levelAnchor:
      "Journeys are designed end to end and instrumented across channels, so context carries rather than being re-collected at each hop.",
    evidence: [
      "A journey map with the measured drop-off at each step",
      "What a care agent can see of a customer's digital activity",
    ],
    agentIds: ["customer-journey-command-center", "kpmg-dice"],
    challengeIds: ["cx-consistency", "process-tech-debt"],
    priorityIds: ["market-dynamics-consumer-shifts"],
  },
  {
    id: "churn-value-intelligence",
    groupId: "customer-market",
    label: "Churn & customer-value intelligence",
    prompt:
      "How do you predict which customers are at risk, what they are worth, and what to offer them?",
    levelAnchor:
      "Churn and value models run on a schedule against the live base, and their output drives a specific retention action.",
    evidence: [
      "Current model accuracy and when it was last retrained",
      "The proportion of at-risk customers who receive an intervention",
    ],
    agentIds: ["customer-intelligence-sentinal", "next-best-action-agent"],
    challengeIds: ["data-readiness"],
    priorityIds: ["market-dynamics-consumer-shifts", "unlocking-new-growth-engines"],
  },
  {
    id: "digital-channels",
    groupId: "customer-market",
    label: "Digital channels & self-service",
    prompt:
      "What share of customer intent is resolved digitally without a human, and how is that share moving?",
    levelAnchor:
      "Digital containment is measured by intent, and the journeys that fail to contain are identified and reworked.",
    evidence: [
      "Digital containment rate by intent type",
      "Top five reasons customers abandon self-service for care",
    ],
    agentIds: ["customer-journey-command-center", "next-best-action-agent"],
    challengeIds: ["cx-consistency"],
    priorityIds: ["unlocking-new-growth-engines"],
  },
  {
    id: "product-offer-lifecycle",
    groupId: "customer-market",
    label: "Product, offer & catalogue lifecycle",
    prompt:
      "How long does it take to design, price and launch a new offer — and how many catalogues does it touch?",
    levelAnchor:
      "A governed catalogue drives all channels, and a standard offer reaches market in weeks rather than quarters.",
    evidence: [
      "Time to market for the last three offers",
      "Number of product catalogues currently in production",
    ],
    agentIds: ["bss-modernization", "demand-planning-agent"],
    challengeIds: ["process-tech-debt", "legacy-infra"],
    priorityIds: ["unlocking-new-growth-engines"],
  },

  // ── 3. Network & Service ──────────────────────────────────────────────────
  {
    id: "network-planning-capacity",
    groupId: "network-service",
    label: "Network planning & capacity",
    prompt:
      "How is network capacity forecast and matched to demand, and how far ahead is congestion visible?",
    levelAnchor:
      "Capacity is forecast from actual demand signals on a rolling basis, and build decisions follow the forecast rather than the calendar.",
    evidence: [
      "The current capacity forecast and its horizon",
      "How many congestion events in the last year were foreseen",
    ],
    agentIds: ["demand-planning-agent", "datacenter-lifecycle-intelligence"],
    challengeIds: ["legacy-infra", "reactive-ops"],
    priorityIds: ["modernizing-legacy-tech"],
  },
  {
    id: "service-assurance-sla",
    groupId: "network-service",
    label: "Service assurance & SLA management",
    prompt:
      "How is service health monitored against customer-facing commitments, rather than against element health?",
    levelAnchor:
      "Assurance is expressed in service terms with SLA breach risk visible before it is breached, not reported after.",
    evidence: [
      "A service-level view as an account team would see it",
      "SLA breaches in the last quarter and how many were predicted",
    ],
    agentIds: ["aiops-sentry", "engineering-observability-command-center"],
    challengeIds: ["reactive-ops"],
    priorityIds: ["resilient-trusted-operations"],
  },
  {
    id: "fault-incident-management",
    groupId: "network-service",
    label: "Fault, incident & event management",
    prompt:
      "What happens between an alarm being raised and the fault being cleared — and how much of it is manual?",
    levelAnchor:
      "Alarms are correlated to probable root cause automatically and routed to the right resolver group without human triage.",
    evidence: [
      "Alarm volume per day vs tickets actually raised",
      "Mean time to repair, split by whether the cause was known",
    ],
    agentIds: ["aiops-sentry", "ticket-dispatch"],
    challengeIds: ["reactive-ops", "legacy-infra"],
    priorityIds: ["resilient-trusted-operations"],
  },
  {
    id: "observability-telemetry",
    groupId: "network-service",
    label: "Observability & telemetry",
    prompt:
      "How complete is telemetry across network, platform and application — and can you answer a new question without a project?",
    levelAnchor:
      "Telemetry is collected to a common model across domains and is queryable ad hoc by the teams who need it.",
    evidence: [
      "Domains with no telemetry coverage today",
      "How long it takes to answer a question the tooling was not designed for",
    ],
    agentIds: ["engineering-observability-command-center", "aiops-sentry"],
    challengeIds: ["reactive-ops", "data-readiness"],
    priorityIds: ["resilient-trusted-operations"],
  },
  {
    id: "datacentre-cloud-edge",
    groupId: "network-service",
    label: "Data-centre, cloud & edge lifecycle",
    prompt:
      "How are data-centre, cloud and edge estates planned, refreshed and right-sized across their life?",
    levelAnchor:
      "The estate is inventoried with refresh and utilisation tracked, and placement decisions are made on cost and latency evidence.",
    evidence: [
      "Current estate inventory and its confidence level",
      "Average utilisation against provisioned capacity",
    ],
    agentIds: [
      "datacenter-lifecycle-intelligence",
      "cloud-infra-assessment",
      "dcf-agent",
    ],
    challengeIds: ["legacy-infra", "third-party-resilience"],
    priorityIds: ["modernizing-legacy-tech", "resilient-trusted-operations"],
  },

  // ── 4. Operations ─────────────────────────────────────────────────────────
  {
    id: "order-to-activate",
    groupId: "operations",
    label: "Order-to-activate fulfilment",
    prompt:
      "How much of an order reaches activation without a human touching it, and where does it most often fall out?",
    levelAnchor:
      "Straight-through processing is measured by order type, and fallout has named causes that are being worked down.",
    evidence: [
      "Straight-through rate by order type",
      "The top three fallout reasons and their trend",
    ],
    agentIds: ["bss-modernization", "process-forge"],
    challengeIds: ["process-tech-debt", "legacy-infra"],
    priorityIds: ["transforming-operating-models"],
  },
  {
    id: "care-contact-resolution",
    groupId: "operations",
    label: "Care & contact resolution",
    prompt:
      "How are contacts routed, resolved and prevented — and what proportion are repeat contacts?",
    levelAnchor:
      "Contacts are routed on intent with resolution tracked to first contact, and repeat drivers are fed back to their owner.",
    evidence: [
      "First-contact resolution and repeat-contact rate",
      "How intent is determined at the point of routing",
    ],
    agentIds: ["ticket-dispatch", "customer-journey-command-center"],
    challengeIds: ["cx-consistency", "reactive-ops"],
    priorityIds: ["market-dynamics-consumer-shifts"],
  },
  {
    id: "field-workforce-dispatch",
    groupId: "operations",
    label: "Field & workforce dispatch",
    prompt:
      "How is field work scheduled and dispatched against skills, geography and parts availability?",
    levelAnchor:
      "Dispatch is optimised against skill, travel and SLA rather than allocated by region, and appointments are met predictably.",
    evidence: [
      "Jobs per technician per day and the appointment-met rate",
      "How much scheduling is still done by a person",
    ],
    agentIds: ["ticket-dispatch", "process-forge"],
    challengeIds: ["reactive-ops", "talent-gap"],
    priorityIds: ["transforming-operating-models"],
  },
  {
    id: "process-automation",
    groupId: "operations",
    label: "Process & operating-model automation",
    prompt:
      "Across back-office operations, how much is automated end to end rather than automated in fragments?",
    levelAnchor:
      "Processes are automated across system boundaries with exceptions handled by design, not by a person picking up the pieces.",
    evidence: [
      "Automation coverage of the top ten processes by volume",
      "How many automations broke in the last quarter and why",
    ],
    agentIds: ["process-forge", "enterprise-assessment-prism"],
    challengeIds: ["process-tech-debt", "execution-value-gap"],
    priorityIds: ["transforming-operating-models"],
  },
  {
    id: "revenue-assurance-fraud",
    groupId: "operations",
    label: "Revenue assurance & fraud",
    prompt:
      "How is revenue leakage detected across the order-to-cash chain, and how quickly is fraud caught?",
    levelAnchor:
      "Controls reconcile across the chain continuously, and leakage and fraud are quantified rather than estimated.",
    evidence: [
      "Quantified leakage for the last period and how it was derived",
      "Time from fraud occurrence to detection",
    ],
    agentIds: ["compliance-compass", "cost-optimization-ledger"],
    challengeIds: ["process-tech-debt", "cyber-trust-at-scale"],
    priorityIds: ["resilient-trusted-operations"],
  },

  // ── 5. Technology & Data ──────────────────────────────────────────────────
  {
    id: "legacy-estate-modernisation",
    groupId: "technology-data",
    label: "Legacy estate modernisation",
    prompt:
      "How well do you understand the legacy estate, and is there a sequenced plan to replatform, refactor or retire it?",
    levelAnchor:
      "The estate is assessed with each system scored for risk and cost, and a sequenced roadmap is being executed against.",
    evidence: [
      "The application inventory with support status",
      "Systems retired in the last 12 months",
    ],
    agentIds: [
      "legacy-tech-modernization",
      "portfolio-rationalization",
      "cloud-infra-assessment",
    ],
    challengeIds: ["legacy-infra", "execution-value-gap"],
    priorityIds: ["modernizing-legacy-tech"],
  },
  {
    id: "oss-bss-modernisation",
    groupId: "technology-data",
    label: "OSS/BSS platform modernisation",
    prompt:
      "How fragmented are OSS and BSS, and what does that fragmentation cost in change lead time?",
    levelAnchor:
      "A target OSS/BSS architecture is agreed and being migrated to, with duplicate platforms actively consolidating.",
    evidence: [
      "Count of billing and order-management platforms in production",
      "Lead time for a standard product change",
    ],
    agentIds: ["bss-modernization", "platform-calibre"],
    challengeIds: ["legacy-infra", "process-tech-debt"],
    priorityIds: ["modernizing-legacy-tech"],
  },
  {
    id: "architecture-governance",
    groupId: "technology-data",
    label: "Architecture & standards governance",
    prompt:
      "How are architecture decisions made and enforced, and how closely do you track open standards such as TM Forum?",
    levelAnchor:
      "Architecture decisions are recorded against agreed standards and enforced at design time rather than discovered in production.",
    evidence: [
      "The current decision record and who owns it",
      "How exceptions are raised and how many are open",
    ],
    agentIds: ["enterprise-architecture-agent", "platform-calibre"],
    challengeIds: ["legacy-infra", "process-tech-debt"],
    priorityIds: ["modernizing-legacy-tech"],
  },
  {
    id: "data-foundation-quality",
    groupId: "technology-data",
    label: "Data foundation & quality",
    prompt:
      "Is data consistent, owned and trusted enough to make automated decisions on?",
    levelAnchor:
      "Critical data domains have named owners and measured quality, and lineage can be traced from report back to source.",
    evidence: [
      "Data quality measures for the top domains",
      "Whether two systems agree on the same customer count",
    ],
    // No catalogue coverage yet — surfaces as an Agent Forge candidate.
    agentIds: [],
    challengeIds: ["data-readiness", "legacy-infra"],
    priorityIds: ["scaling-ai-responsibly"],
  },
  {
    id: "analytics-ai-decisioning",
    groupId: "technology-data",
    label: "Analytics, AI & decisioning",
    prompt:
      "How do analytics and models actually change a decision — and how many are in production rather than in a deck?",
    levelAnchor:
      "Models run in production against live decisions, with performance monitored and retraining triggered on drift.",
    evidence: [
      "Models in production and the decision each one drives",
      "How model drift is detected today",
    ],
    agentIds: ["next-best-action-agent", "ai-spend-optimization"],
    challengeIds: ["data-readiness"],
    priorityIds: ["scaling-ai-responsibly", "unlocking-new-growth-engines"],
  },

  // ── 6. People & Organization ──────────────────────────────────────────────
  {
    id: "workforce-skills-change",
    groupId: "people-organization",
    label: "Workforce, skills & change",
    prompt:
      "Does the organisation have the skills to run what it is building, and how is change actually absorbed?",
    levelAnchor:
      "Skills are mapped against the target operating model with a funded plan to close the gap, and adoption is measured after go-live.",
    evidence: [
      "The skills gap analysis and its funding",
      "Adoption rates for the last major platform change",
    ],
    // No catalogue coverage yet — surfaces as an Agent Forge candidate.
    agentIds: [],
    challengeIds: ["talent-gap", "execution-value-gap"],
    priorityIds: ["transforming-operating-models"],
  },
  {
    id: "ai-governance-responsible",
    groupId: "people-organization",
    label: "AI governance & responsible AI",
    prompt:
      "How are AI use cases approved, monitored and held accountable once they are live?",
    levelAnchor:
      "A defined approval path exists with risk classification, and live models are monitored against it by a named owner.",
    evidence: [
      "The AI use-case register and its approval record",
      "What happens when a model behaves outside expectation",
    ],
    agentIds: ["compliance-compass", "enterprise-assessment-prism"],
    challengeIds: ["ai-governance", "cyber-trust-at-scale"],
    priorityIds: ["scaling-ai-responsibly"],
  },
  {
    id: "agent-operations-orchestration",
    groupId: "people-organization",
    label: "Agent operations & orchestration",
    prompt:
      "Once agents are deployed, how are they versioned, monitored, escalated from and improved?",
    levelAnchor:
      "Agents are managed as production assets with ownership, monitoring and a defined escalation path to a human.",
    evidence: [
      "How many agents are in production and who owns them",
      "What happens when an agent fails or is uncertain",
    ],
    agentIds: ["process-forge", "enterprise-assessment-prism"],
    challengeIds: ["ai-governance"],
    priorityIds: ["scaling-ai-responsibly"],
  },
];
