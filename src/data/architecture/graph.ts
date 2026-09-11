export type Ecosystem = "microsoft" | "sap" | "open";
export type Tier = "low" | "medium" | "high";

export type DomainId =
  | "infrastructure"
  | "architecture-integration"
  | "data"
  | "knowledge"
  | "models-ai"
  | "security-governance"
  | "ai-engineering-ops";

export interface Domain { id: DomainId; label: string; order: number; }

export const domains: Domain[] = [
  { id: "infrastructure", label: "Infrastructure", order: 1 },
  { id: "architecture-integration", label: "Architecture & Integration", order: 2 },
  { id: "data", label: "Data", order: 3 },
  { id: "knowledge", label: "Knowledge", order: 4 },
  { id: "models-ai", label: "Models & AI", order: 5 },
  { id: "security-governance", label: "Security & Governance", order: 6 },
  { id: "ai-engineering-ops", label: "AI Engineering & Operations", order: 7 },
];

export interface Challenge {
  id: string;
  label: string;
  domainIds: DomainId[];
}

export const challenges: Challenge[] = [
  { id: "master-data-fragmentation", label: "Same material, vendor or customer exists under different codes across legacy plants", domainIds: ["data", "knowledge"] },
  { id: "undocumented-abap-logic", label: "Business rules are buried in custom Z-tables and ABAP nobody has documented", domainIds: ["data", "knowledge"] },
  { id: "broken-reporting", label: "Simplified ERP data models break existing BW/BI extractors overnight", domainIds: ["data", "architecture-integration"] },
  { id: "cutover-drift", label: "No single source of truth during a parallel-run cutover window", domainIds: ["data"] },
  { id: "physical-data-spread", label: "Data lives across the ERP, legacy archives, and third-party systems — duplicating it all is slow and expensive", domainIds: ["data"] },
  { id: "self-service-gap", label: "Business users need a business-friendly semantic view without waiting on IT to rebuild a model every time", domainIds: ["data", "knowledge"] },
  { id: "realtime-historical-blend", label: "Real-time operational data needs to blend with historical data without a full ETL rebuild", domainIds: ["data"] },
  { id: "tight-coupling", label: "AI services are wired directly to today's ERP endpoints, so any endpoint change breaks every consumer at once", domainIds: ["infrastructure", "architecture-integration"] },
  { id: "capacity-mismatch", label: "GPU/compute capacity planning was done for the old landscape and doesn't map to the new workload profile", domainIds: ["infrastructure"] },
  { id: "environment-drift", label: "Dev/test/prod environments drift because infra was hand-provisioned for the old system", domainIds: ["infrastructure"] },
  { id: "dr-resilience", label: "Disaster recovery and failover assumptions are built around the current architecture's single point of truth", domainIds: ["infrastructure"] },
  { id: "cost-mismatch", label: "High-volume narrow tasks run on a general-purpose LLM, costing far more per call than needed", domainIds: ["models-ai"] },
  { id: "data-residency", label: "Sensitive or regulated data can't leave a specific environment, ruling out some hosted model options", domainIds: ["models-ai", "security-governance"] },
  { id: "domain-adaptation", label: "Domain-specific terminology and internal shorthand aren't well understood by an off-the-shelf model", domainIds: ["models-ai", "knowledge"] },
  { id: "broken-rpa", label: "Existing RPA bots are keyed to screens and transaction codes that no longer exist after a UI change", domainIds: ["architecture-integration", "ai-engineering-ops"] },
  { id: "recon-logic-shift", label: "Core ledger/process logic changes underneath existing automations after a platform upgrade", domainIds: ["architecture-integration"] },
  { id: "hardcoded-per-process", label: "Agent behaviors and guardrails are hardcoded per process, so each new automation starts from zero", domainIds: ["architecture-integration", "ai-engineering-ops"] },
  { id: "coupled-authorization", label: "Model access and permissions inherit from the ERP's authorization model, so an ERP change forces a governance rebuild too", domainIds: ["security-governance"] },
  { id: "fragmented-audit", label: "No consistent audit trail across the different tools an agent touches in one workflow", domainIds: ["security-governance", "ai-engineering-ops"] },
  { id: "risk-monitoring-gap", label: "Model risk — bias, drift, hallucination — isn't monitored consistently once an agent is live", domainIds: ["security-governance", "ai-engineering-ops"] },
];

export interface Capability {
  id: string;
  label: string;
  rationale: string;
  domainIds: DomainId[];
  challengeIds: string[];
}

export const capabilities: Capability[] = [
  {
    id: "knowledge-graph",
    label: "Unified data & knowledge layer (ontology + knowledge graph)",
    rationale: "Simplified ERP data models don't map 1:1 onto decades of customization — this layer sits above any underlying ERP so it doesn't need rebuilding at the next migration.",
    domainIds: ["knowledge", "data", "architecture-integration"],
    challengeIds: ["master-data-fragmentation", "undocumented-abap-logic", "broken-reporting", "cutover-drift"],
  },
  {
    id: "enterprise-data-fabric",
    label: "Enterprise data fabric (SAP Datasphere and equivalents)",
    rationale: "A different decision from the ontology/knowledge-graph capability above it: whether to virtualize across existing data or duplicate it into a new warehouse.",
    domainIds: ["data", "architecture-integration"],
    challengeIds: ["physical-data-spread", "self-service-gap", "realtime-historical-blend"],
  },
  {
    id: "portable-integration-backbone",
    label: "Portable AI infrastructure & integration backbone",
    rationale: "The layer that makes 'agnostic through migration' mechanically true — every AI service talks through one abstraction layer instead of hardcoded endpoints.",
    domainIds: ["infrastructure", "architecture-integration"],
    challengeIds: ["tight-coupling", "capacity-mismatch", "environment-drift", "dr-resilience"],
  },
  {
    id: "foundation-vs-slm",
    label: "Foundation model vs SLM strategy",
    rationale: "Not every AI use case needs a frontier LLM — narrow, high-volume tasks are often cheaper and faster on a small fine-tuned model.",
    domainIds: ["models-ai"],
    challengeIds: ["cost-mismatch", "data-residency", "domain-adaptation"],
  },
  {
    id: "agentic-orchestration",
    label: "Agentic process orchestration",
    rationale: "The pattern that automates business processes end to end — the first proven instance is finance close, but the capability generalizes to any process.",
    domainIds: ["architecture-integration", "ai-engineering-ops"],
    challengeIds: ["broken-rpa", "recon-logic-shift", "hardcoded-per-process"],
  },
  {
    id: "ai-governance-trust",
    label: "AI governance and trust layer",
    rationale: "The layer that has to survive not just a migration but every future audit — governance built into vendor-specific tooling gets re-litigated at every platform change.",
    domainIds: ["security-governance"],
    challengeIds: ["coupled-authorization", "fragmented-audit", "risk-monitoring-gap"],
  },
];

export interface TechnologyOption {
  id: string;
  label: string;
  ecosystem: Ecosystem;
  domainIds: DomainId[];
  capabilityIds: string[];
  note: string;
  // Vendor licensing/consumption cost specifically — not total engineering
  // effort. A "low" costTier option can still carry a "high" integration
  // effort (see the open options throughout this file); the two are
  // deliberately tracked separately and must not be conflated when reading
  // this data.
  costTier: Tier;
}

export const technologyOptions: TechnologyOption[] = [
  { id: "kg-ms", label: "Azure Cosmos DB (Gremlin API) + Azure AI Search", ecosystem: "microsoft", domainIds: ["knowledge", "data"], capabilityIds: ["knowledge-graph"], note: "Managed graph store plus semantic search, fastest to stand up inside an existing Azure estate.", costTier: "medium" },
  { id: "kg-sap", label: "SAP Knowledge Graph engine (BTP)", ecosystem: "sap", domainIds: ["knowledge", "data"], capabilityIds: ["knowledge-graph"], note: "Natively understands the S/4HANA data model, no re-mapping needed.", costTier: "high" },
  { id: "kg-open", label: "Open graph store (Neo4j / RDF triple store)", ecosystem: "open", domainIds: ["knowledge", "data"], capabilityIds: ["knowledge-graph"], note: "Portable if the ERP or cloud changes again later; more build effort up front.", costTier: "low" },

  { id: "ds-ms", label: "Azure Synapse / Fabric OneLake", ecosystem: "microsoft", domainIds: ["data"], capabilityIds: ["enterprise-data-fabric"], note: "General-purpose virtualization layer, not ERP-aware by default.", costTier: "medium" },
  { id: "ds-sap", label: "SAP Datasphere", ecosystem: "sap", domainIds: ["data"], capabilityIds: ["enterprise-data-fabric"], note: "Virtualizes S/4HANA and BW data without physically moving it — a genuine native advantage.", costTier: "high" },
  { id: "ds-open", label: "Open data virtualization (Trino/Presto-style federation)", ecosystem: "open", domainIds: ["data"], capabilityIds: ["enterprise-data-fabric"], note: "Trades native convenience for portability across sources.", costTier: "medium" },

  { id: "infra-ms", label: "Azure API Management + Azure infra-as-code", ecosystem: "microsoft", domainIds: ["infrastructure", "architecture-integration"], capabilityIds: ["portable-integration-backbone"], note: "Mature tooling, tightly integrated with the rest of an Azure estate.", costTier: "medium" },
  { id: "infra-sap", label: "SAP Integration Suite / BTP", ecosystem: "sap", domainIds: ["infrastructure", "architecture-integration"], capabilityIds: ["portable-integration-backbone"], note: "Natively aware of SAP endpoints, less useful for non-SAP integration.", costTier: "high" },
  { id: "infra-open", label: "Open API gateway + cloud-agnostic infra-as-code", ecosystem: "open", domainIds: ["infrastructure", "architecture-integration"], capabilityIds: ["portable-integration-backbone"], note: "Neither the ERP nor the cloud becomes a hard dependency for anything built above it.", costTier: "low" },

  { id: "model-ms", label: "Azure AI Foundry / Azure OpenAI + Azure ML fine-tuning", ecosystem: "microsoft", domainIds: ["models-ai"], capabilityIds: ["foundation-vs-slm"], note: "One control plane for both frontier and fine-tuned small models.", costTier: "medium" },
  { id: "model-sap", label: "SAP generative AI hub (Joule / AI Core)", ecosystem: "sap", domainIds: ["models-ai"], capabilityIds: ["foundation-vs-slm"], note: "Tightly integrated with SAP data, limited to SAP-blessed model choices.", costTier: "high" },
  { id: "model-open", label: "Open-source SLMs, self-hosted", ecosystem: "open", domainIds: ["models-ai"], capabilityIds: ["foundation-vs-slm"], note: "Required wherever data residency rules out hosted options entirely.", costTier: "low" },

  { id: "orch-ms", label: "Azure AI Foundry agent templates + Power Automate", ecosystem: "microsoft", domainIds: ["architecture-integration", "ai-engineering-ops"], capabilityIds: ["agentic-orchestration"], note: "Reusable templates across process types inside one platform.", costTier: "medium" },
  { id: "orch-sap", label: "SAP Build Process Automation + Joule agents", ecosystem: "sap", domainIds: ["architecture-integration", "ai-engineering-ops"], capabilityIds: ["agentic-orchestration"], note: "Fastest path for processes already fully inside SAP.", costTier: "high" },
  { id: "orch-open", label: "Open, ERP-agnostic agent orchestration framework", ecosystem: "open", domainIds: ["architecture-integration", "ai-engineering-ops"], capabilityIds: ["agentic-orchestration"], note: "Same guardrails apply whether the next process is finance, procurement, or service.", costTier: "medium" },

  { id: "gov-ms", label: "Microsoft Entra ID + Purview", ecosystem: "microsoft", domainIds: ["security-governance"], capabilityIds: ["ai-governance-trust"], note: "Unified identity and lineage across Azure-connected systems.", costTier: "medium" },
  { id: "gov-sap", label: "SAP identity & governance suite", ecosystem: "sap", domainIds: ["security-governance"], capabilityIds: ["ai-governance-trust"], note: "Scoped to SAP-native workflows.", costTier: "high" },
  { id: "gov-open", label: "Federated identity + open audit/lineage tooling", ecosystem: "open", domainIds: ["security-governance"], capabilityIds: ["ai-governance-trust"], note: "Rules defined once, enforced regardless of which system an agent touches.", costTier: "medium" },
];

export interface ArchitecturePattern {
  id: string;
  label: string;
  domainIds: DomainId[];
  techOptionIds: string[];
  description: string;
  recommendedFor: string[];
  tco: Tier;
  tradeoffs: {
    capabilityFit: Tier;
    complexity: Tier;
    portability: Tier;
    vendorDependency: Tier;
    scalability: Tier;
    integrationEffort: Tier;
  };
  rationale: string;
}

export const architecturePatterns: ArchitecturePattern[] = [
  {
    id: "ms-centric",
    label: "Microsoft-centric",
    domainIds: ["infrastructure", "architecture-integration", "data", "knowledge", "models-ai", "security-governance"],
    techOptionIds: ["kg-ms", "ds-ms", "infra-ms", "model-ms", "orch-ms", "gov-ms"],
    description: "Every capability delivered end to end through the Microsoft ecosystem.",
    recommendedFor: [],
    tco: "medium",
    tradeoffs: { capabilityFit: "medium", complexity: "low", portability: "low", vendorDependency: "high", scalability: "high", integrationEffort: "low" },
    rationale: "Fastest to stand up if already a Microsoft shop, and every piece integrates cleanly with the others — the cost is a single point of vendor dependency across the whole architecture.",
  },
  {
    id: "sap-plus-ms",
    label: "SAP-anchored with Microsoft AI",
    // infra-sap is an infrastructure-domain option in this pattern's
    // techOptionIds — domainIds must include it or the Infrastructure
    // filter incorrectly hides a pattern that belongs there.
    domainIds: ["infrastructure", "data", "architecture-integration", "models-ai", "security-governance"],
    techOptionIds: ["kg-sap", "ds-sap", "infra-sap", "model-ms", "orch-sap", "gov-sap"],
    description: "SAP native for anything already ERP-aware, Microsoft layered on top specifically for the AI/model capability.",
    recommendedFor: ["enterprise-data-fabric"],
    // SAP licensing spans infra, data, orchestration and governance here —
    // not just the one capability where it's the clear technical winner —
    // so this pattern carries the highest TCO of the four, not "medium".
    tco: "high",
    tradeoffs: { capabilityFit: "high", complexity: "medium", portability: "low", vendorDependency: "high", scalability: "medium", integrationEffort: "medium" },
    rationale: "Wins specifically where SAP's native data and process awareness is a genuine technical advantage, not just convenience — the data-fabric capability is the clearest example.",
  },
  {
    id: "ms-plus-open",
    label: "Microsoft + open ecosystem",
    domainIds: ["infrastructure", "data", "knowledge", "models-ai", "architecture-integration", "security-governance"],
    techOptionIds: ["infra-ms", "model-ms", "ds-ms", "kg-open", "orch-open", "gov-open"],
    description: "Microsoft as the infrastructure and model foundation, open technologies wherever portability or specialization matters more than turnkey convenience.",
    recommendedFor: [],
    tco: "medium",
    tradeoffs: { capabilityFit: "high", complexity: "medium", portability: "high", vendorDependency: "medium", scalability: "high", integrationEffort: "medium" },
    rationale: "A credible middle path when there's no SAP-specific advantage to capture for a given capability — skips SAP entirely and still gets most of the portability benefit.",
  },
  {
    id: "composable",
    label: "Composable enterprise architecture (SAP + Microsoft + Open)",
    domainIds: ["infrastructure", "architecture-integration", "data", "knowledge", "models-ai", "security-governance", "ai-engineering-ops"],
    techOptionIds: ["ds-sap", "infra-ms", "model-ms", "kg-open", "orch-open", "gov-open"],
    description: "Each capability delivered by whichever ecosystem has the genuine technical advantage for it.",
    recommendedFor: ["knowledge-graph", "enterprise-data-fabric", "portable-integration-backbone", "foundation-vs-slm", "agentic-orchestration", "ai-governance-trust"],
    tco: "medium",
    tradeoffs: { capabilityFit: "high", complexity: "high", portability: "high", vendorDependency: "low", scalability: "high", integrationEffort: "high" },
    rationale: "SAP Datasphere for the data fabric because that's a genuine native advantage, Microsoft for infrastructure and model hosting because that's the mature foundation, open technologies for knowledge graph, orchestration and governance because those are exactly the layers that have to survive whatever migration comes after this one. Higher integration effort than a single-vendor pattern, in exchange for materially lower vendor dependency and higher portability — and a lower total cost than sap-plus-ms despite similar capability fit, because it only pays SAP-tier pricing where SAP actually wins (the data fabric) rather than across infrastructure, orchestration and governance too.",
  },
];
