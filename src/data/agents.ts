export type AgentCategory =
  | "All"
  | "IT"
  | "Operations"
  | "Marketing"
  | "HR"
  | "Customer Experience"
  | "Sales"
  | "Finance"
  | "Legal";

export interface IntegrationBadge {
  name: string;
  bgColor: string;
  textColor: string;
  letter: string;
}

export interface AgentScope {
  level: number;
  type: "Task" | "Process" | "Enterprise";
  summary: string;
  detail: string;
}

export interface AgentAutonomy {
  level: number;
  type: "Supervised" | "Guided" | "Automated";
  summary: string;
  detail: string;
}

export interface SubAgent {
  name: string;
  description: string;
}

export interface AgentData {
  id: string;
  title: string;
  description: string;
  categories: AgentCategory[];
  accuracy?: number;
  accessLink: string | null;
  videoUrl: string | null;
  integrations: IntegrationBadge[];
  // Detail page fields
  scope?: AgentScope;
  autonomy?: AgentAutonomy;
  capabilities?: string[];
  worksWithModels?: string[];
  subAgents?: SubAgent[];
}

// Order: datacenter-lifecycle-intelligence (1st), aiops-sentry/AI Operations (2nd), portfolio-rationalization (3rd), then rest
export const agents: AgentData[] = [
  {
    id: "datacenter-lifecycle-intelligence",
    title: "Datacenter Lifecycle Intelligence",
    description:
      "Manage the complete lifecycle of datacentre assets — from provisioning to decommission — with AI-driven capacity planning, cost forecasting, and refresh scheduling.",
    categories: ["IT", "Finance", "Operations"],
    accuracy: 96,
    accessLink: "https://datcenter.vercel.app/",
    videoUrl: "https://youtu.be/seLyPGeIxYQ",
    integrations: [
      { name: "ServiceNow", bgColor: "bg-green-100", textColor: "text-green-700", letter: "SN" },
      { name: "AWS", bgColor: "bg-yellow-100", textColor: "text-yellow-700", letter: "AW" },
    ],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Coordinates asset data across CMDB, procurement, and cloud systems to automate lifecycle decisions end-to-end.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Surfaces recommendations and decommission plans; all actions are reviewed and approved by the infrastructure team.",
    },
    capabilities: [
      "Automated asset discovery and CMDB enrichment",
      "Predictive hardware refresh scheduling",
      "Cost modelling: on-prem vs. cloud migration",
      "Capacity utilisation heatmaps",
      "End-of-life risk alerting",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Asset Discovery Agent", description: "Scans infrastructure to catalogue hardware, software, and configurations." },
      { name: "Lifecycle Forecaster", description: "Models refresh timelines and cost scenarios using historical usage data." },
      { name: "Decommission Orchestrator", description: "Coordinates safe asset retirement with compliance and security checks." },
    ],
  },
  {
    id: "aiops-sentry",
    title: "AI Operations",
    description:
      "Monitor network and IT operations in real time, predicting incidents before they impact service.",
    categories: ["IT", "Operations"],
    accuracy: 96,
    accessLink: "/agents/aiops-sentry/console",
    videoUrl: null,
    integrations: [
      { name: "ServiceNow", bgColor: "bg-green-100", textColor: "text-green-700", letter: "SN" },
      { name: "Slack", bgColor: "bg-purple-100", textColor: "text-purple-600", letter: "SL" },
      { name: "PagerDuty", bgColor: "bg-green-100", textColor: "text-green-600", letter: "PD" },
    ],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Continuously analyses event streams, correlates anomalies, and orchestrates incident response workflows.",
    },
    autonomy: {
      level: 3,
      type: "Automated",
      summary: "Fully autonomous execution",
      detail: "Handles L1 incident triage and remediation automatically; escalates only when predefined severity thresholds are crossed.",
    },
    capabilities: [
      "Anomaly detection across infrastructure metrics and logs",
      "Root cause analysis with dependency graph mapping",
      "Predictive incident forecasting (30-min horizon)",
      "Automated L1 runbook execution",
      "SLA breach early-warning notifications",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Event Correlator", description: "Groups related alerts into incidents and suppresses noise." },
      { name: "Root Cause Analyser", description: "Traces incidents back to contributing factors using topology data." },
      { name: "Remediation Bot", description: "Executes approved runbooks to restore service autonomously." },
    ],
  },
  {
    id: "portfolio-rationalization",
    title: "Portfolio Rationalization",
    description:
      "Score applications against business value and technical health to rationalise your technology portfolio.",
    categories: ["Finance", "IT"],
    accuracy: 95,
    accessLink: "https://portfoliorationalization.vercel.app/",
    videoUrl: null,
    integrations: [
      { name: "Jira", bgColor: "bg-blue-100", textColor: "text-blue-700", letter: "JR" },
      { name: "ServiceNow", bgColor: "bg-green-100", textColor: "text-green-700", letter: "SN" },
    ],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Conducts a systematic assessment of the application estate, scoring each app on value, cost, risk, and technical health.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Produces rationalisation recommendations (retire, replatform, retain); portfolio governance boards review before action.",
    },
    capabilities: [
      "Application inventory and dependency mapping",
      "Business value and technical health scoring (7 dimensions)",
      "Rationalisation scenario modelling (retire/replatform/retain)",
      "Cost avoidance quantification",
      "Portfolio roadmap with sequenced retirement plan",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Inventory Auditor", description: "Discovers and catalogues all applications, owners, and dependencies." },
      { name: "Health Scorer", description: "Rates each application across value, cost, risk, and technical debt dimensions." },
      { name: "Rationalization Planner", description: "Generates an optimised rationalisation roadmap with cost projections." },
    ],
  },
  {
    id: "enterprise-architecture-agent",
    title: "Enterprise Architecture Agent",
    description:
      "Analyse and optimise your enterprise architecture by mapping capabilities, identifying redundancies, and generating actionable modernisation roadmaps.",
    categories: ["IT", "Operations"],
    accuracy: 94,
    accessLink: "https://ea-ai-agent.vercel.app/",
    videoUrl: null,
    integrations: [],
    scope: {
      level: 3,
      type: "Process",
      summary: "Enterprise-wide architecture orchestration",
      detail: "Maps and analyses technology capabilities across the enterprise to surface redundancies and modernisation opportunities.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved recommendations",
      detail: "Surfaces architecture insights and roadmap options for stakeholder review before action.",
    },
    capabilities: [
      "Capability mapping across business and IT domains",
      "Technology redundancy detection",
      "Modernisation roadmap generation",
      "Architecture gap analysis",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [],
  },
  {
    id: "legacy-tech-modernization",
    title: "Legacy Tech Modernization",
    description:
      "Assess legacy systems across the estate and generate a prioritised modernisation roadmap — replatform, refactor, or retire — with effort and risk scored for each path.",
    categories: ["IT", "Operations"],
    accessLink: "https://connect-insight-modernize.vercel.app/",
    videoUrl: "/videos/legacy-tech-modernization.mp4",
    integrations: [],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Scans infrastructure, application, and platform inventories to score modernisation urgency and sequence a phased roadmap.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Produces modernisation roadmaps and effort estimates; architecture and platform teams review before work is scheduled.",
    },
    capabilities: [
      "Automated legacy system discovery and inventory scoring",
      "Modernisation roadmap sequencing (replatform, refactor, retire)",
      "Technical debt and risk quantification",
      "Effort and cost estimation per modernisation path",
      "Dependency mapping across legacy and target-state systems",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Inventory Scanner", description: "Discovers and catalogues legacy systems, versions, and dependencies across the estate." },
      { name: "Modernisation Sequencer", description: "Scores and sequences systems into a phased replatform/refactor/retire roadmap." },
      { name: "Risk & Cost Estimator", description: "Quantifies technical debt, risk, and estimated effort for each modernisation path." },
    ],
  },
  {
    id: "customer-journey-command-center",
    title: "Customer Journey Command Center",
    description:
      "A unified command center for the end-to-end customer journey — mapping every touchpoint, flagging drop-off points, and orchestrating next-best actions across channels.",
    categories: ["Customer Experience", "Sales"],
    accessLink: "https://customer-journey-command-center-dice.vercel.app/",
    videoUrl: null,
    integrations: [],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Aggregates journey data across digital, voice, and in-person touchpoints into a single orchestrated view of the customer lifecycle.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Surfaces journey drop-off points and recommended interventions; customer experience teams approve outreach before it's triggered.",
    },
    capabilities: [
      "End-to-end journey mapping across digital, voice, and in-person touchpoints",
      "Drop-off and friction-point detection at each journey stage",
      "Next-best-action recommendations tied to journey stage",
      "Cross-channel handoff tracking with no lost context between teams",
      "Journey-level reporting for CX and sales leadership",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Journey Mapper", description: "Builds a live map of every touchpoint a customer moves through, across channels." },
      { name: "Friction Detector", description: "Flags stages where customers stall, disengage, or drop off." },
      { name: "Next-Best-Action Engine", description: "Recommends the next intervention based on journey stage and signals." },
    ],
  },
  {
    id: "engineering-observability-command-center",
    title: "Engineering Observability Command Center",
    description:
      "A unified observability command center for engineering teams — correlating logs, metrics, traces, and deployments into one operating picture, with anomalies triaged before they page anyone.",
    categories: ["IT", "Operations"],
    accessLink: "https://ontos-insight.vercel.app/",
    videoUrl: "/videos/engineering-observability-command-center.mp4",
    integrations: [],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Correlates telemetry across services, deployments, and infrastructure to give engineering teams one operating view instead of siloed dashboards.",
    },
    autonomy: {
      level: 3,
      type: "Automated",
      summary: "Fully autonomous execution",
      detail: "Automatically triages and correlates anomalies across services; escalates to on-call only when confidence thresholds are met.",
    },
    capabilities: [
      "Unified correlation of logs, metrics, traces, and deployment events",
      "Automated anomaly triage before pages are sent",
      "Service dependency mapping for faster root-cause analysis",
      "Deployment-to-incident correlation to catch bad releases fast",
      "Noise reduction across alerting channels",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Telemetry Correlator", description: "Unifies logs, metrics, and traces into a single incident timeline." },
      { name: "Anomaly Triage Agent", description: "Automatically classifies and prioritises anomalies before they reach on-call." },
      { name: "Deployment Watcher", description: "Flags deployments that correlate with new incidents or regressions." },
    ],
  },
  {
    id: "ai-spend-optimization",
    title: "AI Spend Optimization",
    description:
      "Track and optimise AI and cloud spend across models, teams, and workloads — surfacing cost drivers, idle capacity, and rightsizing opportunities before the invoice lands.",
    categories: ["Finance", "IT"],
    accessLink: null,
    videoUrl: "/videos/ai-spend-optimization.mp4",
    integrations: [],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Aggregates model, infrastructure, and licence spend across providers to attribute cost by team, workload, and use case.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Recommends rightsizing and consolidation actions; finance and platform owners approve before any change is applied.",
    },
    capabilities: [
      "Unified AI and cloud spend visibility across providers",
      "Cost attribution by team, workload, and use case",
      "Token and inference spend tracking per model",
      "Idle and over-provisioned capacity detection",
      "Rightsizing and model-tier recommendations with projected savings",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Spend Aggregator", description: "Consolidates billing and usage data across AI, cloud, and licence providers." },
      { name: "Attribution Engine", description: "Maps spend to teams, workloads, and use cases for chargeback and showback." },
      { name: "Savings Recommender", description: "Identifies rightsizing, model-tier, and consolidation opportunities with projected savings." },
    ],
  },
  {
    id: "dcf-agent",
    title: "DCF Agent",
    description:
      "A DCF model estimates a company's intrinsic value by forecasting its future cash flows and discounting them to present value.",
    categories: ["Finance"],
    accuracy: 94,
    accessLink: "https://data-center-43fpzipav-des4.vercel.app/dashboard",
    videoUrl: null,
    integrations: [
      { name: "SAP", bgColor: "bg-blue-100", textColor: "text-blue-700", letter: "SAP" },
      { name: "Workday", bgColor: "bg-orange-100", textColor: "text-orange-600", letter: "WD" },
    ],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Builds forecast models from historical financials and market assumptions to produce a fully reasoned intrinsic valuation.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Generates valuation outputs and sensitivity scenarios; finance teams review assumptions before the model is finalised.",
    },
    capabilities: [
      "Automated free cash flow forecasting from historical financials",
      "WACC and discount rate calculation",
      "Terminal value modelling (perpetuity growth and exit multiple)",
      "Sensitivity and scenario analysis",
      "Valuation summary report generation",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Forecast Builder", description: "Projects future revenue, margins, and cash flows from historical trends." },
      { name: "Discount Rate Calculator", description: "Derives WACC and risk-adjusted discount rates from market data." },
      { name: "Valuation Synthesiser", description: "Combines forecasts and discount rates into a final intrinsic value estimate." },
    ],
  },
  {
    id: "customer-intelligence-sentinal",
    title: "Customer Intelligence Sentinel",
    description:
      "Surface churn risk and growth opportunities by analysing customer signals across every touchpoint in real time.",
    categories: ["Customer Experience", "Sales"],
    accuracy: 98,
    accessLink: "https://www.knexus.space/agents/leadership",
    videoUrl: "https://youtu.be/dmdhrNwZYFo",
    integrations: [
      { name: "Salesforce", bgColor: "bg-blue-100", textColor: "text-blue-600", letter: "SF" },
      { name: "HubSpot", bgColor: "bg-orange-100", textColor: "text-orange-600", letter: "H" },
    ],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Aggregates signals from CRM, support, and product usage systems to orchestrate a continuous intelligence loop.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Delivers prioritised churn alerts and growth nudges; account teams review before any outreach is triggered.",
    },
    capabilities: [
      "Real-time churn risk scoring across all accounts",
      "Next-best-action recommendations for account managers",
      "Sentiment analysis from support tickets and NPS data",
      "Expansion opportunity identification in existing accounts",
      "Automated executive briefing packs",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Signal Aggregator", description: "Collects and normalises data from CRM, support, and usage platforms." },
      { name: "Churn Predictor", description: "Scores accounts on churn probability using behavioural patterns." },
      { name: "Growth Scout", description: "Identifies upsell and cross-sell signals within the customer base." },
    ],
  },
  {
    id: "ticket-dispatch",
    title: "Ticket Dispatch",
    description:
      "Intelligently classify and route support tickets to the right team with zero manual triage.",
    categories: ["Operations", "IT"],
    accuracy: 96,
    accessLink: "https://www.knexus.space/agents/operations",
    videoUrl: "https://youtu.be/Q3c36D6SGeE",
    integrations: [
      { name: "ServiceNow", bgColor: "bg-green-100", textColor: "text-green-700", letter: "SN" },
      { name: "Zendesk", bgColor: "bg-teal-100", textColor: "text-teal-700", letter: "ZD" },
      { name: "Freshdesk", bgColor: "bg-cyan-100", textColor: "text-cyan-700", letter: "FD" },
    ],
    scope: {
      level: 2,
      type: "Task",
      summary: "Targeted task automation",
      detail: "Handles the full triage loop — classify, enrich, assign — within your existing ITSM platform.",
    },
    autonomy: {
      level: 3,
      type: "Automated",
      summary: "Fully autonomous execution",
      detail: "Routes tickets without human intervention; escalation thresholds are pre-configured by operations leads.",
    },
    capabilities: [
      "Multi-label ticket classification using NLP",
      "Automatic priority and severity assignment",
      "SLA-aware routing to the right team queue",
      "Duplicate detection and ticket merging",
      "Real-time triage dashboard for ops leads",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Classifier", description: "Applies NLP models to tag tickets with category, product, and severity." },
      { name: "Router", description: "Matches tagged tickets to the optimal queue based on SLA and skill rules." },
    ],
  },
  {
    id: "next-best-action-agent",
    title: "Next Best Action Agent",
    description:
      "Recommend the single best next action for each customer in real time by blending intent signals, journey stage, and business rules.",
    categories: ["Customer Experience", "Sales"],
    accuracy: 95,
    accessLink: "https://nba-agent-five.vercel.app/",
    videoUrl: null,
    integrations: [],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail:
        "Blends intent signals, journey stage and business rules across channels to decide the single next action for a customer.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail:
        "Produces the recommended action and the reason for it; the channel or the agent handling the customer decides whether to take it.",
    },
    capabilities: [
      "Real-time next-best-action scoring per customer",
      "Intent detection from in-session behaviour",
      "Journey-stage aware offer selection",
      "Business-rule and eligibility enforcement",
      "Outcome feedback to retrain ranking",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Intent Reader", description: "Infers what the customer is trying to do from live session signals." },
      { name: "Action Ranker", description: "Scores candidate actions against value, eligibility and journey stage." },
      { name: "Rule Guard", description: "Filters out actions the customer is not eligible for before they are offered." },
    ],
  },
  {
    id: "demand-planning-agent",
    title: "Demand Planning Agent",
    description:
      "Forecast demand and align supply plans across products and regions using AI-driven trend and seasonality analysis.",
    categories: ["Operations", "Finance"],
    accuracy: 95,
    accessLink: "https://demandai-snowy.vercel.app/",
    videoUrl: "/videos/demand-planning-agent.mp4",
    integrations: [],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail:
        "Runs the forecast-to-supply-plan loop across products and regions, reconciling demand signals with what can actually be supplied.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail:
        "Produces the forecast and the proposed plan with its assumptions; planners commit it before anything downstream moves.",
    },
    capabilities: [
      "Demand forecasting with trend and seasonality decomposition",
      "Supply plan alignment across products and regions",
      "Forecast accuracy tracking and bias detection",
      "Scenario modelling for demand shocks",
      "Exception flagging where plan and capacity diverge",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Trend Decomposer", description: "Separates trend, seasonality and noise from historical demand." },
      { name: "Plan Reconciler", description: "Aligns the demand forecast against supply capacity by region." },
      { name: "Accuracy Monitor", description: "Tracks forecast error over time and surfaces systematic bias." },
    ],
  },
  {
    id: "kpmg-dice",
    title: "DICE Agent",
    description:
      "An AI intelligence layer on Salesforce/Agentforce that listens to every customer touchpoint — calls, chats, site visits, payments — and writes the real pipeline status back into the CRM in real time.",
    categories: ["Sales", "Customer Experience", "Marketing"],
    accuracy: 97,
    accessLink: "https://l-t-sigma.vercel.app/",
    videoUrl: null,
    integrations: [
      { name: "Salesforce", bgColor: "bg-blue-100", textColor: "text-blue-600", letter: "SF" },
      { name: "WhatsApp", bgColor: "bg-green-100", textColor: "text-green-600", letter: "WA" },
    ],
    scope: {
      level: 4,
      type: "Enterprise",
      summary: "Enterprise-wide intelligence",
      detail:
        "Runs AI agents across every customer touchpoint — leads, engagements, site visits, bookings, payments, and service tickets — orchestrating the full sales lifecycle on top of Salesforce/Agentforce.",
    },
    autonomy: {
      level: 3,
      type: "Automated",
      summary: "Fully autonomous execution",
      detail:
        "Writes corrected lead status, intent, and Do Not Contact flags back into the CRM in real time — often before a call ends; managers review prioritised risk and exceptions in the Manager View.",
    },
    capabilities: [
      "Real-time call, chat, and site-visit intelligence with live CRM write-back",
      "Full customer-journey tracking across leads, engagements, site visits, bookings, payments, and service tickets",
      "AI copilots for sales, payments, and service, plus persona mapping and campaign ROI analytics",
      "Manager rollups — pipeline velocity, project portfolio, prioritised risk, and team performance",
      "11 AI agents that validate leads, detect churn and intent, and flag revenue at risk",
      "Evidence-backed scoring — every flag shows the exact signals behind it, not a black-box number",
    ],
    worksWithModels: ["claude-opus-4-7"],
    subAgents: [
      { name: "Lead Validation Agent", description: "Cross-checks CRM-entered leads against real touchpoint activity to catch dead or stale pipeline early." },
      { name: "Live Call Intelligence Agent", description: "Transcribes and analyses calls in real time, updating status and Do Not Contact flags before the call ends." },
      { name: "Churn & Intent Detector", description: "Scores customer intent and churn risk from calls, chats, and site-visit signals across the journey." },
      { name: "Persona Mapping Agent", description: "Builds evidence-backed buyer-persona scores from cross-channel behaviour to guide sales and campaigns." },
    ],
  },
  {
    id: "cloud-infra-assessment",
    title: "Cloud Infra Assessment",
    description:
      "Evaluate cloud infrastructure maturity and produce a prioritised modernisation roadmap.",
    categories: ["IT"],
    accuracy: 95,
    accessLink: "https://maturity.leankloud.com/CMMA",
    videoUrl: "https://youtu.be/bqxq8Nalnng",
    integrations: [
      { name: "AWS", bgColor: "bg-yellow-100", textColor: "text-yellow-700", letter: "AW" },
      { name: "Azure", bgColor: "bg-blue-100", textColor: "text-blue-600", letter: "AZ" },
    ],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Runs a structured maturity assessment across cloud domains and produces a scored, ranked modernisation backlog.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Generates the roadmap and recommendations; architecture teams validate priorities before work is scheduled.",
    },
    capabilities: [
      "Cloud Maturity Model (CMM) scoring across 6 domains",
      "Automated evidence collection from cloud APIs",
      "Capability gap heatmap generation",
      "Prioritised modernisation backlog with effort estimates",
      "Executive-ready assessment report export",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Evidence Collector", description: "Pulls configuration and usage data from AWS, Azure, and GCP APIs." },
      { name: "Maturity Scorer", description: "Applies CMM rubrics to score each cloud domain." },
      { name: "Roadmap Builder", description: "Ranks gaps by business impact and produces a sequenced modernisation plan." },
    ],
  },
  {
    id: "strategy-navigator",
    title: "Strategy Navigator",
    description:
      "Generate structured strategic analyses from market data to position your organisation for competitive advantage.",
    categories: ["Operations"],
    accuracy: 95,
    accessLink: "https://aii-strategy-agent.vercel.app/",
    videoUrl: "https://youtu.be/RxqNBxLx8H4",
    integrations: [
      { name: "Google Drive", bgColor: "bg-blue-100", textColor: "text-blue-600", letter: "GD" },
      { name: "Outlook", bgColor: "bg-blue-100", textColor: "text-blue-700", letter: "OL" },
    ],
    scope: {
      level: 4,
      type: "Enterprise",
      summary: "Enterprise-wide intelligence",
      detail: "Synthesises internal strategy documents, market intelligence, and competitor data into structured strategic frameworks.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Produces SWOT, Porter's Five Forces, and scenario analyses for review; strategic decisions remain with leadership.",
    },
    capabilities: [
      "Automated SWOT and competitive landscape analysis",
      "Market sizing and growth trajectory modelling",
      "Scenario planning with Monte Carlo simulations",
      "Strategy brief generation aligned to company OKRs",
      "Stakeholder-ready presentation pack export",
    ],
    worksWithModels: ["claude-opus-4-7"],
    subAgents: [
      { name: "Market Intelligence Agent", description: "Collects and synthesises competitor, market, and regulatory signals." },
      { name: "Framework Analyst", description: "Applies strategic frameworks (SWOT, Porter's, Blue Ocean) to structured inputs." },
      { name: "Narrative Writer", description: "Converts analysis outputs into board-ready strategic narratives." },
    ],
  },
  {
    id: "platform-calibre",
    title: "Platform Calibre",
    description:
      "Benchmark your platform architecture against industry standards and surface capability gaps.",
    categories: ["IT"],
    accuracy: 93,
    accessLink: null,
    videoUrl: null,
    integrations: [
      { name: "AWS", bgColor: "bg-yellow-100", textColor: "text-yellow-700", letter: "AW" },
      { name: "Azure", bgColor: "bg-blue-100", textColor: "text-blue-600", letter: "AZ" },
    ],
    scope: {
      level: 2,
      type: "Task",
      summary: "Targeted task automation",
      detail: "Benchmarks platform capabilities against TM Forum Open APIs and TMN standards to produce a gap scorecard.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Produces a benchmarked capability report; platform architects review findings and prioritise remediation.",
    },
    capabilities: [
      "TM Forum Open API compliance scoring",
      "Microservices maturity assessment",
      "API catalogue completeness audit",
      "Platform scalability and resilience benchmarking",
      "Gap-to-roadmap recommendation generation",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "API Auditor", description: "Scans API catalogues and scores compliance with TM Forum standards." },
      { name: "Architecture Reviewer", description: "Assesses microservices maturity and resilience patterns." },
    ],
  },
  {
    id: "bss-modernization",
    title: "BSS Modernization",
    description:
      "Automate BSS transformation assessments and generate vendor-neutral modernisation blueprints.",
    categories: ["Operations"],
    accuracy: 92,
    accessLink: null,
    videoUrl: null,
    integrations: [
      { name: "SAP", bgColor: "bg-blue-100", textColor: "text-blue-700", letter: "SAP" },
      { name: "Salesforce", bgColor: "bg-blue-100", textColor: "text-blue-600", letter: "SF" },
    ],
    scope: {
      level: 4,
      type: "Enterprise",
      summary: "Enterprise-wide intelligence",
      detail: "Assesses the full BSS stack — billing, ordering, product catalogue, and CRM — against best-in-class benchmarks.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Generates transformation blueprints and vendor shortlists; programme leadership validate scope and approach.",
    },
    capabilities: [
      "BSS functional capability maturity assessment",
      "Vendor-neutral modernisation blueprint generation",
      "Order-to-cash process gap analysis",
      "Product catalogue complexity scoring",
      "RFP generation for BSS platform selection",
    ],
    worksWithModels: ["claude-opus-4-7"],
    subAgents: [
      { name: "BSS Assessor", description: "Evaluates current BSS capabilities across billing, ordering, and CRM domains." },
      { name: "Blueprint Architect", description: "Designs a target-state BSS architecture aligned to business goals." },
    ],
  },
  {
    id: "cost-optimization-ledger",
    title: "Cost Optimization Ledger",
    description:
      "Identify cost-reduction levers across your technology estate with AI-driven spend analysis.",
    categories: ["Finance", "Operations"],
    accuracy: 95,
    accessLink: null,
    videoUrl: null,
    integrations: [
      { name: "SAP", bgColor: "bg-blue-100", textColor: "text-blue-700", letter: "SAP" },
      { name: "Workday", bgColor: "bg-orange-100", textColor: "text-orange-600", letter: "WD" },
    ],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Analyses spend data across cloud, software, and infrastructure to surface actionable saving opportunities.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Surfaces optimisation recommendations with financial impact; finance and procurement teams approve initiatives.",
    },
    capabilities: [
      "Cloud spend anomaly detection and rightsizing",
      "Software licence waste identification",
      "Vendor contract benchmarking",
      "Technology spend heatmap by business unit",
      "Savings opportunity tracking and realisation reporting",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Spend Analyst", description: "Aggregates and categorises technology spend across all cost centres." },
      { name: "Optimisation Adviser", description: "Identifies and ranks cost-reduction opportunities by impact and effort." },
    ],
  },
  {
    id: "enterprise-assessment-prism",
    title: "Enterprise Assessment Prism",
    description:
      "Conduct comprehensive enterprise capability assessments with structured scoring and gap analysis.",
    categories: ["Customer Experience"],
    accuracy: 94,
    accessLink: null,
    videoUrl: null,
    integrations: [
      { name: "Google Drive", bgColor: "bg-blue-100", textColor: "text-blue-600", letter: "GD" },
      { name: "Outlook", bgColor: "bg-blue-100", textColor: "text-blue-700", letter: "OL" },
    ],
    scope: {
      level: 4,
      type: "Enterprise",
      summary: "Enterprise-wide intelligence",
      detail: "Runs a structured assessment across the full enterprise — strategy, operations, technology, and people — to produce a transformation roadmap.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Generates capability scorecards and improvement roadmaps; leadership teams review and prioritise initiatives.",
    },
    capabilities: [
      "Multi-domain capability maturity scoring",
      "Stakeholder survey design and automated analysis",
      "Benchmark comparison against industry peers",
      "Gap-to-initiative mapping with ROI estimates",
      "Board-ready transformation roadmap generation",
    ],
    worksWithModels: ["claude-opus-4-7"],
    subAgents: [
      { name: "Survey Orchestrator", description: "Designs, distributes, and analyses capability assessment surveys." },
      { name: "Benchmark Engine", description: "Compares scores against industry benchmarks and best practices." },
      { name: "Roadmap Architect", description: "Converts gap analysis into a prioritised transformation roadmap." },
    ],
  },
  {
    id: "compliance-compass",
    title: "Compliance Compass",
    description:
      "Navigate regulatory requirements and generate compliance gap reports with automated evidence mapping.",
    categories: ["Finance", "Operations"],
    accuracy: 93,
    accessLink: null,
    videoUrl: null,
    integrations: [
      { name: "ServiceNow", bgColor: "bg-green-100", textColor: "text-green-700", letter: "SN" },
      { name: "Outlook", bgColor: "bg-blue-100", textColor: "text-blue-700", letter: "OL" },
    ],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Maps controls to regulatory requirements and continuously monitors compliance posture across frameworks.",
    },
    autonomy: {
      level: 2,
      type: "Guided",
      summary: "User-approved execution",
      detail: "Generates gap reports and remediation plans; compliance officers review and approve before audit submission.",
    },
    capabilities: [
      "Multi-framework compliance mapping (GDPR, ISO 27001, SOC 2)",
      "Automated evidence collection from control owners",
      "Gap analysis with remediation priority scoring",
      "Audit-ready compliance posture reports",
      "Real-time compliance dashboard with trend tracking",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Requirement Mapper", description: "Maps regulatory controls to internal policies and procedures." },
      { name: "Evidence Collector", description: "Gathers and organises evidence from control owners automatically." },
      { name: "Gap Analyser", description: "Identifies control deficiencies and generates remediation recommendations." },
    ],
  },
  {
    id: "process-forge",
    title: "Process Forge",
    description:
      "Redesign and automate business processes using AI-driven workflow analysis and optimisation.",
    categories: ["Operations"],
    accuracy: 92,
    accessLink: null,
    videoUrl: null,
    integrations: [
      { name: "ServiceNow", bgColor: "bg-green-100", textColor: "text-green-700", letter: "SN" },
      { name: "Slack", bgColor: "bg-purple-100", textColor: "text-purple-600", letter: "SL" },
    ],
    scope: {
      level: 3,
      type: "Process",
      summary: "Business process orchestration",
      detail: "Mines process logs, interviews stakeholders, and generates redesigned process blueprints with automation recommendations.",
    },
    autonomy: {
      level: 3,
      type: "Automated",
      summary: "Fully autonomous execution",
      detail: "Analyses process data and generates redesign blueprints autonomously; process owners review and approve changes.",
    },
    capabilities: [
      "Process mining from event logs and system data",
      "Bottleneck and waste identification",
      "AI-generated process redesign blueprints",
      "Automation opportunity scoring with ROI estimates",
      "Change impact simulation before deployment",
    ],
    worksWithModels: ["claude-sonnet-4-6"],
    subAgents: [
      { name: "Process Miner", description: "Extracts and visualises as-is process flows from system event logs." },
      { name: "Optimisation Engine", description: "Identifies waste and generates to-be process designs." },
      { name: "Automation Scorer", description: "Ranks automation opportunities by ROI, effort, and feasibility." },
    ],
  },
];

export const agentCategories: AgentCategory[] = [
  "All",
  "IT",
  "Operations",
  "Marketing",
  "HR",
  "Customer Experience",
  "Sales",
  "Finance",
  "Legal",
];
