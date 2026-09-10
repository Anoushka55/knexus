// AI Architecture Accelerator — vendor-agnostic architecture, mapped by layer.
// No client name anywhere in this file: scenarios are generic transformation
// patterns (ERP modernization, cloud data platform migration, etc.), not any
// specific engagement.

export type StackId = "ms-native" | "sap-anchored" | "hybrid";

export type LayerId =
  | "infrastructure"
  | "data-knowledge"
  | "model"
  | "orchestration"
  | "governance";

export interface Layer {
  id: LayerId;
  label: string;
  order: number;
}

export const layers: Layer[] = [
  { id: "infrastructure", label: "Infrastructure", order: 1 },
  { id: "data-knowledge", label: "Data & Knowledge", order: 2 },
  { id: "model", label: "Model", order: 3 },
  { id: "orchestration", label: "Orchestration & Agentic", order: 4 },
  { id: "governance", label: "Governance & Trust", order: 5 },
];

export const stacks: { id: StackId; label: string }[] = [
  { id: "ms-native", label: "Microsoft-native" },
  { id: "sap-anchored", label: "SAP-anchored" },
  { id: "hybrid", label: "MS + open-source hybrid" },
];

export interface StackResponse {
  stackId: StackId;
  summary: string;
}

export interface ArchChallenge {
  id: string;
  label: string;
  responses: StackResponse[]; // always one entry per stack, same order
}

export interface ArchCapability {
  id: string;
  layerId: LayerId;
  title: string;
  rationale: string;
  challenges: ArchChallenge[];
  recommendation: {
    stackId: StackId;
    note: string; // qualitative only — never a fabricated cost figure
  };
}

export interface Scenario {
  id: string;
  label: string;
  status: "available" | "coming-soon";
  capabilities: ArchCapability[];
}

export const scenarios: Scenario[] = [
  {
    id: "ecc-hana",
    label: "ERP modernization (ECC → S/4HANA)",
    status: "available",
    capabilities: [
      {
        id: "unified-knowledge-layer",
        layerId: "data-knowledge",
        title: "Unified data & knowledge layer (ontology + knowledge graph)",
        rationale:
          "S/4HANA's simplified data model doesn't map 1:1 onto decades of ECC customization — this layer sits above both so it doesn't need rebuilding at the next migration.",
        challenges: [
          {
            id: "master-data-fragmentation",
            label:
              "Same material, vendor or customer exists under different codes across legacy plants",
            responses: [
              {
                stackId: "ms-native",
                summary: "Azure Data Factory / Fabric harmonizes records into one common model.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP Master Data Governance, native to the S/4 data model.",
              },
              {
                stackId: "hybrid",
                summary:
                  "Open MDM tooling on Azure compute, mapping stays portable if the ERP changes again.",
              },
            ],
          },
          {
            id: "undocumented-abap-logic",
            label: "Business rules are buried in custom Z-tables and ABAP nobody has documented",
            responses: [
              {
                stackId: "ms-native",
                summary: "Agentic code-mining on Azure OpenAI extracts the rules before cutover.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP's custom-code migration and remediation tooling.",
              },
              {
                stackId: "hybrid",
                summary:
                  "Same agentic extraction, landed in a vendor-neutral store instead of SAP-only tooling.",
              },
            ],
          },
          {
            id: "broken-reporting",
            label: "S/4's simplified data model breaks existing BW/BI extractors overnight",
            responses: [
              {
                stackId: "ms-native",
                summary:
                  "Rebuilt on Azure Synapse / Fabric, decoupled from SAP's own reporting layer.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP Datasphere / Business Data Cloud, natively aware of the new model.",
              },
              {
                stackId: "hybrid",
                summary: "An open semantic layer sitting above whichever ERP is underneath.",
              },
            ],
          },
          {
            id: "cutover-drift",
            label: "No single source of truth during the parallel-run cutover window",
            responses: [
              {
                stackId: "ms-native",
                summary: "Microsoft Purview tracks lineage across old and new systems in parallel.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP's landscape transformation and data migration cockpit tooling.",
              },
              {
                stackId: "hybrid",
                summary:
                  "Open lineage/catalog tooling that survives the next migration too, not just this one.",
              },
            ],
          },
        ],
        recommendation: {
          stackId: "hybrid",
          note:
            "SAP-native is fastest to stand up but the most tightly coupled to SAP's own roadmap. Open is the most future-proof but slowest to land before cutover. The workable middle: SAP-native for anything genuinely S/4-specific, open/Azure-based semantic layer for everything cross-functional — that's the part that has to survive the next change too.",
        },
      },
      {
        id: "agentic-finance-close",
        layerId: "orchestration",
        title: "Agentic process orchestration for finance close",
        rationale:
          "RPA bots built against ECC's GUI and transaction codes break the moment S/4HANA moves the UI to Fiori, and the universal journal changes reconciliation logic underneath them. This is the first instance of a general pattern, not a one-off automation.",
        challenges: [
          {
            id: "broken-rpa",
            label:
              "Existing RPA bots are keyed to ECC screens and transaction codes that no longer exist in Fiori",
            responses: [
              {
                stackId: "ms-native",
                summary:
                  "Power Automate + Azure OpenAI agents calling S/4 APIs directly instead of screen-scraping.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP Build Process Automation with Joule-driven agents, native to the new UI.",
              },
              {
                stackId: "hybrid",
                summary:
                  "An open orchestration layer calling both SAP and Azure services, UI-independent by design.",
              },
            ],
          },
          {
            id: "recon-logic-shift",
            label: "Universal journal changes reconciliation logic underneath existing close processes",
            responses: [
              {
                stackId: "ms-native",
                summary:
                  "Reconciliation rules re-authored in an Azure-hosted rules engine, decoupled from the ERP version.",
              },
              {
                stackId: "sap-anchored",
                summary: "Native universal journal reconciliation inside S/4, no re-mapping needed.",
              },
              {
                stackId: "hybrid",
                summary: "Rules layer sits above the ERP, so the next version bump doesn't force a rewrite.",
              },
            ],
          },
          {
            id: "hardcoded-per-process",
            label:
              "Agent behaviors and guardrails are hardcoded per process, so each new automation starts from zero",
            responses: [
              {
                stackId: "ms-native",
                summary: "Reusable agent templates in Azure AI Foundry, shared across process types.",
              },
              {
                stackId: "sap-anchored",
                summary: "Joule's agent framework, reusable across SAP-native processes only.",
              },
              {
                stackId: "hybrid",
                summary:
                  "A shared, ERP-agnostic agent framework — the same guardrails apply whether the next process is finance, procurement, or service.",
              },
            ],
          },
        ],
        recommendation: {
          stackId: "hybrid",
          note:
            "Native SAP tooling is the fast path for this migration specifically, but the orchestration layer is exactly the part you don't want rebuilt at the next one.",
        },
      },
      {
        id: "enterprise-data-fabric",
        layerId: "data-knowledge",
        title: "Enterprise data fabric (SAP Datasphere and equivalents)",
        rationale:
          "Data physically lives across S/4HANA, legacy ECC archives, and third-party systems. This layer decides whether you virtualize across it or duplicate it into a new warehouse — a different decision from the ontology/knowledge-graph capability above it, even though they're often discussed as one thing.",
        challenges: [
          {
            id: "physical-data-spread",
            label:
              "Data lives across S/4HANA, ECC archives, and third-party systems — duplicating it all into one warehouse is slow and expensive",
            responses: [
              {
                stackId: "ms-native",
                summary:
                  "Azure Synapse / Fabric OneLake as the virtualization and semantic layer, connected to SAP via standard connectors.",
              },
              {
                stackId: "sap-anchored",
                summary:
                  "SAP Datasphere natively virtualizes across S/4HANA and BW without physically moving data.",
              },
              {
                stackId: "hybrid",
                summary:
                  "An open data-federation layer across SAP and non-SAP sources, trading some native convenience for portability.",
              },
            ],
          },
          {
            id: "self-service-gap",
            label:
              "Business users need a business-friendly semantic view without waiting on IT to rebuild a model every time a question changes",
            responses: [
              {
                stackId: "ms-native",
                summary: "Semantic models in Fabric, editable by business teams without a full IT cycle.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP Datasphere's business layer, built for exactly this self-service pattern on SAP data.",
              },
              {
                stackId: "hybrid",
                summary: "An open semantic layer, more setup effort but not tied to one vendor's modeling tool.",
              },
            ],
          },
          {
            id: "realtime-historical-blend",
            label: "Real-time operational data needs to blend with historical data without a full ETL rebuild",
            responses: [
              {
                stackId: "ms-native",
                summary: "Fabric's real-time analytics blended with historical lake data in one platform.",
              },
              {
                stackId: "sap-anchored",
                summary:
                  "SAP Datasphere's native handling of live S/4HANA data alongside historical BW data.",
              },
              {
                stackId: "hybrid",
                summary:
                  "An open streaming + batch federation layer, more moving parts but no single-vendor dependency.",
              },
            ],
          },
        ],
        recommendation: {
          stackId: "sap-anchored",
          note:
            "This is the one layer where native genuinely wins on its own merits, not just on speed: SAP Datasphere's virtualization of S/4HANA and BW data without physically moving it is a real technical advantage a hybrid open stack would have to work hard to replicate, and the data fabric's whole job is to sit close to the source system. Worth saying this recommendation differs from the others — it's what makes the hybrid recommendation elsewhere credible rather than templated.",
        },
      },
      {
        id: "portable-integration-backbone",
        layerId: "infrastructure",
        title: "Portable AI infrastructure & integration backbone",
        rationale:
          "This is the layer that makes 'agnostic through migration' mechanically true rather than aspirational: if every AI service talks to the ERP through one abstraction layer instead of hardcoded endpoints, swapping the ERP or the cloud underneath doesn't force a rewire of everything built on top.",
        challenges: [
          {
            id: "tight-coupling",
            label:
              "AI services are wired directly to today's ERP endpoints, so any endpoint change breaks every consumer at once",
            responses: [
              {
                stackId: "ms-native",
                summary: "Azure API Management as the abstraction layer in front of SAP endpoints.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP Integration Suite / BTP, natively aware of S/4 endpoints.",
              },
              {
                stackId: "hybrid",
                summary:
                  "An open API gateway in front of both SAP and Azure services — neither is a hard dependency for anything built above it.",
              },
            ],
          },
          {
            id: "capacity-mismatch",
            label:
              "GPU/compute capacity planning was done for the old landscape and doesn't map to the new workload profile",
            responses: [
              {
                stackId: "ms-native",
                summary: "Azure infra-as-code (Bicep/Terraform) re-provisioned for the new workload profile.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP's own sizing and capacity tooling, scoped to SAP workloads.",
              },
              {
                stackId: "hybrid",
                summary: "Cloud-agnostic infra-as-code, sized independent of which ERP or cloud is underneath.",
              },
            ],
          },
          {
            id: "environment-drift",
            label: "Dev/test/prod environments drift because infra was hand-provisioned for the old system",
            responses: [
              {
                stackId: "ms-native",
                summary: "Consistent environments via Azure DevOps + infra-as-code templates.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP's landscape management tooling for environment consistency.",
              },
              {
                stackId: "hybrid",
                summary: "Cloud-agnostic templates, reusable regardless of future infra decisions.",
              },
            ],
          },
          {
            id: "dr-resilience",
            label:
              "Disaster recovery and failover assumptions are built around the current architecture's single point of truth",
            responses: [
              { stackId: "ms-native", summary: "Azure Site Recovery for cross-region failover." },
              {
                stackId: "sap-anchored",
                summary: "SAP's own DR tooling, scoped to the SAP landscape.",
              },
              {
                stackId: "hybrid",
                summary: "A DR strategy spanning both SAP and non-SAP systems through the shared integration layer.",
              },
            ],
          },
        ],
        recommendation: {
          stackId: "hybrid",
          note:
            "The integration/abstraction layer is precisely the piece that has to outlive both this migration and the next one — an open gateway pattern here is lower long-term risk than building it SAP-native, even though SAP-native would integrate a little faster today.",
        },
      },
      {
        id: "foundation-vs-slm-strategy",
        layerId: "model",
        title: "Foundation model vs SLM strategy",
        rationale:
          "Not every AI use case needs a frontier LLM. High-volume, narrow tasks are often cheaper and faster on a small fine-tuned model, while judgment-heavy work still needs a larger model — getting the mix wrong either overspends or underperforms.",
        challenges: [
          {
            id: "cost-mismatch",
            label:
              "High-volume narrow tasks run on a general-purpose LLM, costing far more per call than needed",
            responses: [
              {
                stackId: "ms-native",
                summary:
                  "Azure AI Foundry for frontier tasks, Azure ML for fine-tuning small open models for narrow tasks, one control plane.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP's generative AI hub, limited to SAP-blessed model choices for both tiers.",
              },
              {
                stackId: "hybrid",
                summary:
                  "Open SLMs fine-tuned and hosted independently, frontier calls routed through an abstraction layer so the vendor behind them can change freely.",
              },
            ],
          },
          {
            id: "data-residency",
            label: "Sensitive or regulated data can't leave a specific environment, ruling out some hosted model options",
            responses: [
              { stackId: "ms-native", summary: "Azure sovereign/regional deployments where available." },
              {
                stackId: "sap-anchored",
                summary: "SAP's hosting options, scoped to what SAP's regions support.",
              },
              {
                stackId: "hybrid",
                summary:
                  "Open models self-hosted wherever residency requires — on-prem or sovereign cloud, independent of either vendor's regional footprint.",
              },
            ],
          },
          {
            id: "domain-adaptation",
            label: "Domain-specific terminology and internal shorthand aren't well understood by an off-the-shelf model",
            responses: [
              { stackId: "ms-native", summary: "Fine-tuning on Azure ML with domain data." },
              {
                stackId: "sap-anchored",
                summary: "SAP's model customization tooling, scoped to SAP's ecosystem.",
              },
              {
                stackId: "hybrid",
                summary: "Open fine-tuning pipelines, portable to whichever hosting environment is required next.",
              },
            ],
          },
        ],
        recommendation: {
          stackId: "hybrid",
          note:
            "Same portability logic as elsewhere, with one caveat worth stating plainly in the room: regulated data-residency requirements may force parts of this onto on-prem or sovereign infrastructure regardless of vendor preference — this is a compliance decision as much as an architecture one.",
        },
      },
      {
        id: "ai-governance-trust-layer",
        layerId: "governance",
        title: "AI governance and trust layer",
        rationale:
          "This is the layer that has to survive not just a migration but every future audit — governance built into vendor-specific tooling gets re-litigated at every platform change, right when regulatory scrutiny is highest.",
        challenges: [
          {
            id: "coupled-authorization",
            label:
              "Model access and permissions inherit from the ERP's authorization model, so an ERP change forces a governance rebuild too",
            responses: [
              {
                stackId: "ms-native",
                summary: "Microsoft Entra ID as a unified identity layer across Azure and connected systems.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP's own identity and authorization model, tightly coupled to SAP systems.",
              },
              {
                stackId: "hybrid",
                summary:
                  "A federated identity layer spanning both SAP and Azure identity providers, so rules are defined once.",
              },
            ],
          },
          {
            id: "fragmented-audit",
            label: "No consistent audit trail across the different tools an agent touches in one workflow",
            responses: [
              {
                stackId: "ms-native",
                summary: "Microsoft Purview for unified audit and lineage across Azure-connected systems.",
              },
              {
                stackId: "sap-anchored",
                summary: "SAP's own audit tooling, scoped to SAP-native workflows.",
              },
              {
                stackId: "hybrid",
                summary:
                  "An open audit/lineage layer spanning whatever systems an agent actually touches, SAP or not.",
              },
            ],
          },
          {
            id: "risk-monitoring-gap",
            label: "Model risk — bias, drift, hallucination — isn't monitored consistently once an agent is live",
            responses: [
              { stackId: "ms-native", summary: "Azure AI Content Safety and monitoring tooling." },
              {
                stackId: "sap-anchored",
                summary: "SAP's governance suite, scoped to models deployed through SAP's AI hub.",
              },
              {
                stackId: "hybrid",
                summary: "An open model-monitoring layer, applied consistently regardless of where a given model is hosted.",
              },
            ],
          },
        ],
        recommendation: {
          stackId: "hybrid",
          note:
            "The strongest version of the portability argument in the whole architecture: governance is the layer most likely to face a regulator or an auditor, and rebuilding it at every migration is a compliance risk, not just an engineering inconvenience.",
        },
      },
    ],
  },
  {
    id: "cloud-data-platform",
    label: "Cloud data platform migration",
    status: "coming-soon",
    capabilities: [],
  },
  {
    id: "crm-modernization",
    label: "Legacy CRM modernization",
    status: "coming-soon",
    capabilities: [],
  },
];
