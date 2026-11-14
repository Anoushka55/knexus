// ONE shared synthetic enterprise data model. Every page reads from here so
// Payment API, INC-8421 and Online Checkout are consistent across the app.

import type {
  ActivityItem,
  Agent,
  CostOpportunity,
  CustomerJourney,
  DataConnector,
  Deployment,
  Incident,
  PortfolioApp,
  Service,
  SloRow,
  TelemetrySignal,
  TimelineEvent,
} from "./types";

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const services: Service[] = [
  {
    id: "svc-checkout",
    name: "Checkout Service",
    domain: "Digital Sales",
    type: "Business Service",
    health: "degraded",
    healthScore: 78,
    slo: 96.2,
    latencyP95: 842,
    errorRate: 3.14,
    requestsPerMin: "12.8K",
    owner: "Digital Commerce CoE",
    onCall: "Checkout On-Call",
    techStack: ["Java", "Spring Boot", "Oracle"],
    dependencies: ["svc-payment", "svc-cart", "svc-pricing", "svc-order"],
    journeys: ["jrn-checkout"],
    trend: "down",
  },
  {
    id: "svc-payment",
    name: "Payment API",
    domain: "Payments",
    type: "Business Service",
    health: "critical",
    healthScore: 72,
    slo: 94.1,
    latencyP95: 1240,
    errorRate: 5.32,
    requestsPerMin: "8.2K",
    throughputTps: "1,286 TPS",
    owner: "Payments CoE",
    onCall: "Payments On-Call",
    techStack: ["Java", "Spring", "PostgreSQL"],
    dependencies: ["svc-payment-db", "svc-fraud", "svc-redis"],
    journeys: ["jrn-checkout"],
    trend: "down",
  },
  {
    id: "svc-payment-db",
    name: "Payments DB (PostgreSQL)",
    domain: "Payments",
    type: "Infrastructure",
    health: "critical",
    healthScore: 61,
    slo: 95.0,
    latencyP95: 210,
    errorRate: 1.9,
    requestsPerMin: "22.4K",
    owner: "Cloud CoE",
    onCall: "DBA On-Call",
    techStack: ["PostgreSQL 15", "RDS"],
    dependencies: ["svc-k8s"],
    journeys: ["jrn-checkout"],
    trend: "down",
  },
  {
    id: "svc-order",
    name: "Order Service",
    domain: "Fulfilment",
    type: "Business Service",
    health: "healthy",
    healthScore: 94,
    slo: 98.7,
    latencyP95: 276,
    errorRate: 0.42,
    requestsPerMin: "6.3K",
    owner: "Fulfilment CoE",
    onCall: "Order On-Call",
    techStack: ["Go", "gRPC", "PostgreSQL"],
    dependencies: ["svc-inventory", "svc-notification"],
    journeys: ["jrn-checkout", "jrn-delivery"],
    trend: "up",
  },
  {
    id: "svc-inventory",
    name: "Inventory Service",
    domain: "Fulfilment",
    type: "Business Service",
    health: "degraded",
    healthScore: 91,
    slo: 98.3,
    latencyP95: 312,
    errorRate: 0.84,
    requestsPerMin: "4.1K",
    owner: "Fulfilment CoE",
    onCall: "Inventory On-Call",
    techStack: ["Go", "gRPC", "PostgreSQL"],
    dependencies: ["svc-kafka"],
    journeys: ["jrn-checkout", "jrn-collect"],
    trend: "flat",
  },
  {
    id: "svc-cart",
    name: "Cart Service",
    domain: "Digital Sales",
    type: "Software Service",
    health: "healthy",
    healthScore: 96,
    slo: 99.2,
    latencyP95: 142,
    errorRate: 0.18,
    requestsPerMin: "9.7K",
    owner: "Digital Commerce CoE",
    onCall: "Checkout On-Call",
    techStack: ["Node.js", "Redis"],
    dependencies: ["svc-redis"],
    journeys: ["jrn-checkout"],
    trend: "up",
  },
  {
    id: "svc-pricing",
    name: "Pricing Service",
    domain: "Digital Sales",
    type: "Software Service",
    health: "healthy",
    healthScore: 95,
    slo: 99.2,
    latencyP95: 168,
    errorRate: 0.22,
    requestsPerMin: "7.4K",
    owner: "Digital Commerce CoE",
    onCall: "Pricing On-Call",
    techStack: ["Java", "Spring"],
    dependencies: [],
    journeys: ["jrn-checkout"],
    trend: "flat",
  },
  {
    id: "svc-customer",
    name: "Customer Profile",
    domain: "Customer",
    type: "Shared Service",
    health: "healthy",
    healthScore: 96,
    slo: 99.2,
    latencyP95: 189,
    errorRate: 0.21,
    requestsPerMin: "3.2K",
    owner: "Customer CoE",
    onCall: "Customer On-Call",
    techStack: [".NET", "SQL Server"],
    dependencies: [],
    journeys: ["jrn-checkout", "jrn-loyalty"],
    trend: "up",
  },
  {
    id: "svc-fraud",
    name: "Fraud Service",
    domain: "Payments",
    type: "Software Service",
    health: "healthy",
    healthScore: 93,
    slo: 98.9,
    latencyP95: 240,
    errorRate: 0.31,
    requestsPerMin: "8.1K",
    owner: "Payments CoE",
    onCall: "Fraud On-Call",
    techStack: ["Python", "TensorFlow"],
    dependencies: [],
    journeys: ["jrn-checkout"],
    trend: "flat",
  },
  {
    id: "svc-notification",
    name: "Notification Service",
    domain: "Customer",
    type: "Shared Service",
    health: "healthy",
    healthScore: 99,
    slo: 99.6,
    latencyP95: 96,
    errorRate: 0.08,
    requestsPerMin: "2.2K",
    owner: "Customer CoE",
    onCall: "Comms On-Call",
    techStack: ["Node.js", "Kafka"],
    dependencies: ["svc-kafka"],
    journeys: ["jrn-checkout", "jrn-delivery"],
    trend: "up",
  },
  {
    id: "svc-loyalty",
    name: "Loyalty Service",
    domain: "Customer",
    type: "Business Service",
    health: "degraded",
    healthScore: 88,
    slo: 97.8,
    latencyP95: 410,
    errorRate: 1.12,
    requestsPerMin: "1.8K",
    owner: "Customer CoE",
    onCall: "Loyalty On-Call",
    techStack: ["Java", "Spring", "MongoDB"],
    dependencies: ["svc-customer"],
    journeys: ["jrn-loyalty"],
    trend: "down",
  },
  {
    id: "svc-gateway",
    name: "API Gateway",
    domain: "Platform",
    type: "Infrastructure",
    health: "healthy",
    healthScore: 97,
    slo: 99.5,
    latencyP95: 38,
    errorRate: 0.05,
    requestsPerMin: "41.2K",
    owner: "Platform CoE",
    onCall: "Platform On-Call",
    techStack: ["Kong", "Kubernetes"],
    dependencies: ["svc-k8s"],
    journeys: ["jrn-checkout", "jrn-collect", "jrn-delivery", "jrn-loyalty"],
    trend: "flat",
  },
  {
    id: "svc-k8s",
    name: "Kubernetes Cluster",
    domain: "Platform",
    type: "Infrastructure",
    health: "healthy",
    healthScore: 95,
    slo: 99.9,
    latencyP95: 0,
    errorRate: 0.01,
    requestsPerMin: "—",
    owner: "Cloud CoE",
    onCall: "Platform On-Call",
    techStack: ["EKS", "1.29"],
    dependencies: [],
    journeys: [],
    trend: "flat",
  },
  {
    id: "svc-redis",
    name: "Cache (Redis)",
    domain: "Platform",
    type: "Infrastructure",
    health: "degraded",
    healthScore: 84,
    slo: 99.0,
    latencyP95: 12,
    errorRate: 0.4,
    requestsPerMin: "96K",
    owner: "Cloud CoE",
    onCall: "DBA On-Call",
    techStack: ["ElastiCache", "Redis 7"],
    dependencies: ["svc-k8s"],
    journeys: ["jrn-checkout"],
    trend: "down",
  },
  {
    id: "svc-kafka",
    name: "Kafka Cluster",
    domain: "Platform",
    type: "Infrastructure",
    health: "healthy",
    healthScore: 96,
    slo: 99.8,
    latencyP95: 8,
    errorRate: 0.02,
    requestsPerMin: "140K",
    owner: "Cloud CoE",
    onCall: "Platform On-Call",
    techStack: ["MSK", "Kafka 3.6"],
    dependencies: ["svc-k8s"],
    journeys: [],
    trend: "flat",
  },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);

// ---------------------------------------------------------------------------
// Customer journeys
// ---------------------------------------------------------------------------

export const journeys: CustomerJourney[] = [
  {
    id: "jrn-checkout",
    name: "Online Checkout",
    status: "critical",
    transactionsPerHour: "12.8K",
    revenuePerHour: "£412K",
    impactedTransactions: "~12.8K",
    exposure: "£184K",
    services: ["svc-checkout", "svc-payment", "svc-cart", "svc-pricing", "svc-order", "svc-fraud"],
    description:
      "Enables customers to complete purchases online including cart, payment, order creation and confirmation.",
  },
  {
    id: "jrn-collect",
    name: "Click & Collect",
    status: "degraded",
    transactionsPerHour: "3.1K",
    revenuePerHour: "£86K",
    impactedTransactions: "~2.2K",
    exposure: "£32K",
    services: ["svc-inventory", "svc-order", "svc-notification"],
    description: "Reserve online, collect in store. Delayed pickup confirmations.",
  },
  {
    id: "jrn-delivery",
    name: "Home Delivery",
    status: "degraded",
    transactionsPerHour: "2.4K",
    revenuePerHour: "£64K",
    impactedTransactions: "~1.1K",
    exposure: "£18K",
    services: ["svc-order", "svc-notification"],
    description: "Home delivery scheduling and tracking. Delivery delays reported.",
  },
  {
    id: "jrn-loyalty",
    name: "Loyalty Program",
    status: "degraded",
    transactionsPerHour: "5.6K",
    revenuePerHour: "£22K",
    impactedTransactions: "~640",
    exposure: "£7K",
    services: ["svc-loyalty", "svc-customer"],
    description: "Points accrual and redemption. Points sync failures observed.",
  },
];

export const journeyById = (id: string) => journeys.find((j) => j.id === id);

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

export const incidents: Incident[] = [
  {
    id: "INC-8421",
    title: "Checkout Payment Degradation",
    severity: "P1",
    status: "Investigating",
    service: "svc-payment",
    serviceName: "Payment API",
    journey: "jrn-checkout",
    journeyName: "Online Checkout",
    started: "10:18 AM",
    startedAgo: "6m ago",
    duration: "45m",
    detectedBy: "AI Anomaly Detection",
    description:
      "Customers experiencing high payment failure rate and increased latency during checkout process.",
    impact: { services: 3, journeys: 2, transactions: "~12.8K", revenueExposure: "£184K / hr" },
  },
  {
    id: "INC-8420",
    title: "Database Connection Saturation",
    severity: "P1",
    status: "Investigating",
    service: "svc-payment-db",
    serviceName: "Payments DB",
    journey: "jrn-checkout",
    journeyName: "Online Checkout",
    started: "10:15 AM",
    startedAgo: "9m ago",
    duration: "48m",
    detectedBy: "APM Threshold",
    description: "Primary DB connection pool near capacity (96% utilisation) following deployment.",
    impact: { services: 3, journeys: 1, transactions: "~8.2K", revenueExposure: "£96K / hr" },
  },
  {
    id: "INC-8418",
    title: "Inventory Sync Delays",
    severity: "P2",
    status: "Identified",
    service: "svc-inventory",
    serviceName: "Inventory Service",
    journey: "jrn-collect",
    journeyName: "Click & Collect",
    started: "09:58 AM",
    startedAgo: "26m ago",
    duration: "1h 5m",
    detectedBy: "SLO Burn Rate",
    description: "Inventory sync lag causing delayed pickup confirmations.",
    impact: { services: 2, journeys: 1, transactions: "~2.2K", revenueExposure: "£32K / hr" },
  },
  {
    id: "INC-8415",
    title: "Order Service Error Spike",
    severity: "P2",
    status: "Monitoring",
    service: "svc-order",
    serviceName: "Order Service",
    journey: "jrn-checkout",
    journeyName: "Online Checkout",
    started: "09:42 AM",
    startedAgo: "42m ago",
    duration: "1h 21m",
    detectedBy: "Error Budget Alert",
    description: "Elevated 5xx responses during peak traffic window.",
    impact: { services: 1, journeys: 1, transactions: "~900", revenueExposure: "£12K / hr" },
  },
  {
    id: "INC-8412",
    title: "Email Service Latency",
    severity: "P3",
    status: "Monitoring",
    service: "svc-notification",
    serviceName: "Notification Service",
    journey: "jrn-delivery",
    journeyName: "Home Delivery",
    started: "09:15 AM",
    startedAgo: "1h 9m ago",
    duration: "1h 48m",
    detectedBy: "Synthetic Monitor",
    description: "Confirmation emails delayed by up to 4 minutes.",
    impact: { services: 1, journeys: 1, transactions: "~400", revenueExposure: "£3K / hr" },
  },
  {
    id: "INC-8409",
    title: "Search Service Slowdown",
    severity: "P3",
    status: "Monitoring",
    service: "svc-pricing",
    serviceName: "Search Service",
    journey: "jrn-checkout",
    journeyName: "Online Checkout",
    started: "08:55 AM",
    startedAgo: "1h 29m ago",
    duration: "2h 8m",
    detectedBy: "APM Threshold",
    description: "Search p95 latency above baseline during catalogue reindex.",
    impact: { services: 1, journeys: 1, transactions: "~1.4K", revenueExposure: "£6K / hr" },
  },
  {
    id: "INC-8408",
    title: "Search Indexing Failure",
    severity: "P3",
    status: "Resolved",
    service: "svc-pricing",
    serviceName: "Search Service",
    journey: "jrn-checkout",
    journeyName: "Online Checkout",
    started: "07:32 AM",
    startedAgo: "Resolved 10:05 AM",
    duration: "2h 33m",
    detectedBy: "Alert Manager",
    description: "Nightly indexing job failed; retried successfully.",
    impact: { services: 1, journeys: 1, transactions: "~300", revenueExposure: "£2K" },
  },
  {
    id: "INC-8405",
    title: "Analytics Pipeline Delay",
    severity: "P4",
    status: "Resolved",
    service: "svc-kafka",
    serviceName: "Data Pipeline",
    journey: "jrn-loyalty",
    journeyName: "Loyalty Program",
    started: "07:32 AM",
    startedAgo: "Resolved 09:58 AM",
    duration: "3h 12m",
    detectedBy: "Data Quality Check",
    description: "Batch analytics pipeline lagged behind by 40 minutes.",
    impact: { services: 1, journeys: 0, transactions: "0", revenueExposure: "£0" },
  },
];

export const incidentById = (id: string) => incidents.find((i) => i.id === id);

// ---------------------------------------------------------------------------
// INC-8421 investigation
// ---------------------------------------------------------------------------

export const inc8421Timeline: TimelineEvent[] = [
  { time: "10:14", label: "Deployment payment-service v4.8.2 to production", kind: "deploy" },
  { time: "10:15", label: "Database connection saturation alert triggered", kind: "alert" },
  { time: "10:18", label: "Payment API degradation detected", kind: "degradation" },
  { time: "10:22", label: "Checkout failure rate increases", kind: "degradation" },
  { time: "10:24", label: "AI correlated 17 signals into 2 incidents", kind: "correlation" },
];

export const rootCauseHypothesis = {
  title: "Payment API degradation caused by database connection-pool saturation",
  detail:
    "Payment API degradation caused by database connection pool saturation following deployment payment-service v4.8.2.",
  confidence: 87,
  evidence: [
    { label: "Payment API latency", value: "+42%" },
    { label: "Checkout failure rate", value: "+17%" },
    { label: "DB connection utilisation", value: "96%" },
    { label: "Deployment detected", value: "4 min before degradation" },
    { label: "Dependency confirmed", value: "Payment API → Payments DB" },
    { label: "Similar incidents", value: "3 in last 30 days" },
  ],
  businessImpact: {
    transactions: "12,840",
    customers: "~8,400",
    exposure: "£184K",
    services: 3,
    journeys: 2,
  },
  recommendedAction: "Increase DB connection pool capacity",
};

export const matchingAgents: Agent[] = [
  {
    id: "agent-payment-investigator",
    name: "Payment Incident Investigator",
    match: 94,
    description: "Specialised in payment systems issue investigation and root cause analysis.",
    capabilities: [
      "Payment API Diagnostics",
      "Log & Trace Analysis",
      "Dependency Analysis",
      "Incident Investigation",
    ],
    reason: "Resolved 14 similar incidents in the last 90 days",
    owner: "Payments CoE",
  },
  {
    id: "agent-db-optimizer",
    name: "Cloud Database Optimization Agent",
    match: 82,
    description: "Experts in database performance analysis and optimization.",
    capabilities: [
      "DB Performance Analysis",
      "Connection Pool Analysis",
      "Capacity Optimization",
      "Query Performance",
    ],
    reason: "Detected DB saturation in 7 similar incidents",
    owner: "Cloud CoE",
  },
];

// ---------------------------------------------------------------------------
// Data fabric connectors
// ---------------------------------------------------------------------------

export const connectors: DataConnector[] = [
  { id: "crm", name: "CRM (Salesforce)", category: "CRM", status: "Connected", entities: "12,482", lastSync: "2 min ago" },
  { id: "itsm", name: "ServiceNow (ITSM)", category: "Service Management", status: "Connected", entities: "3,821", lastSync: "2 min ago" },
  { id: "apm", name: "Observability (Datadog)", category: "Observability / APM", status: "Connected", entities: "18,492", lastSync: "1 min ago" },
  { id: "cmdb", name: "CMDB / Service Catalog", category: "CMDB", status: "Connected", entities: "1,284", lastSync: "4 min ago" },
  { id: "cicd", name: "GitHub / CI-CD", category: "Engineering", status: "Connected", entities: "643", lastSync: "3 min ago" },
  { id: "finops", name: "Cloud & FinOps (AWS)", category: "Cloud & Cost", status: "Connected", entities: "4,912", lastSync: "5 min ago" },
  { id: "agents", name: "Agent Marketplace", category: "AI Agents", status: "Connected", entities: "37", lastSync: "6 min ago" },
];

export const graphStats = {
  totalEntities: "41,634",
  relationships: "128,492",
  domains: 26,
  lastUpdated: "2 min ago",
  dataSources: "7 / 7",
  newEntities: "2,841",
  updatedEntities: "6,204",
  conflictsResolved: "184",
};

// ---------------------------------------------------------------------------
// Overview page data
// ---------------------------------------------------------------------------

export const healthTrend = [
  { day: "May 2", value: 84 },
  { day: "May 3", value: 86 },
  { day: "May 4", value: 83 },
  { day: "May 5", value: 88 },
  { day: "May 6", value: 85 },
  { day: "May 7", value: 87 },
  { day: "May 8", value: 92 },
];

export const mttrTrend = [
  { day: "May 2", value: 52 },
  { day: "May 3", value: 48 },
  { day: "May 4", value: 54 },
  { day: "May 5", value: 46 },
  { day: "May 6", value: 58 },
  { day: "May 7", value: 50 },
  { day: "May 8", value: 42 },
];

export const recentActivity: ActivityItem[] = [
  { time: "10:24 AM", label: "AI correlated 17 signals into 2 incidents", badge: "AI" },
  { time: "10:22 AM", label: "Checkout Payment Degradation incident detected", badge: "P1" },
  { time: "10:18 AM", label: "Deployment: payment-service v4.8.2 to production", badge: "Deploy" },
  { time: "10:15 AM", label: "Database connection saturation alert triggered", badge: "Alert" },
  { time: "10:12 AM", label: "Cost anomaly detected in us-east-1", badge: "Cost" },
];

export const sloCompliance: SloRow[] = [
  { service: "Checkout Service", compliance: 98.5, delta: 2.1, status: "Good" },
  { service: "Payment API", compliance: 96.2, delta: -1.3, status: "At Risk" },
  { service: "Order Service", compliance: 99.1, delta: 1.8, status: "Good" },
  { service: "Inventory Service", compliance: 97.3, delta: 0.4, status: "At Risk" },
  { service: "Customer Profile", compliance: 99.4, delta: 2.5, status: "Good" },
];

export const aiPriorities = [
  { rank: 1, title: "Resolve Checkout Payment Degradation", detail: "High business impact • £184K exposure", level: "High" as const, to: "/ai-insights" },
  { rank: 2, title: "Investigate DB Connection Saturation", detail: "Affecting 3 services • 2.1K errors/min", level: "High" as const, to: "/incidents" },
  { rank: 3, title: "Optimize Cloud Costs", detail: "£412K annual savings opportunity", level: "Medium" as const, to: "/cost-risk" },
  { rank: 4, title: "Review Change Risk: payment-service v4.8.2", detail: "Deployed 10:14 AM • High blast radius", level: "Medium" as const, to: "/incidents" },
  { rank: 5, title: "Reduce MTTR for P1 Incidents", detail: "Current MTTR: 42m • Target: 20m", level: "Low" as const, to: "/incidents" },
];

export const valueChain = [
  { label: "Signals", value: "1,248", sub: "Active signals", delta: "▲ 12%" },
  { label: "Infrastructure", value: "89", sub: "Resources affected", delta: "▲ 8%" },
  { label: "Services", value: "7", sub: "Services impacted", delta: "▲ 3" },
  { label: "Customer Journeys", value: "3", sub: "Journeys impacted", delta: "▲ 1" },
  { label: "Transactions", value: "12,840", sub: "Transactions affected", delta: "▲ 18%" },
  { label: "Business Impact", value: "£184K", sub: "Revenue exposure", delta: "▲ 12%" },
];

// ---------------------------------------------------------------------------
// Live Ops data
// ---------------------------------------------------------------------------

export const liveSignals: TelemetrySignal[] = [
  { id: "sig-1", time: "10:24:30 AM", severity: "P1", service: "Payment API", message: "High error rate detected", region: "APAC" },
  { id: "sig-2", time: "10:24:28 AM", severity: "P1", service: "Payment API", message: "DB connection pool saturation", region: "Global" },
  { id: "sig-3", time: "10:24:26 AM", severity: "P2", service: "Inventory Service", message: "High response time", region: "EU" },
  { id: "sig-4", time: "10:24:25 AM", severity: "P2", service: "Checkout Service", message: "Latency above threshold (842ms)", region: "Global" },
  { id: "sig-5", time: "10:24:23 AM", severity: "P3", service: "Pricing Service", message: "Cache miss rate elevated", region: "us-east-1" },
  { id: "sig-6", time: "10:24:20 AM", severity: "P3", service: "Checkout Service", message: "Increased slow requests", region: "Global" },
  { id: "sig-7", time: "10:24:18 AM", severity: "Info", service: "Deployment", message: "payment-service v4.8.2 deployed", region: "Production" },
  { id: "sig-8", time: "10:24:15 AM", severity: "Info", service: "Kubernetes", message: "Pod restarted: payment-api-5f7c9", region: "us-east-1" },
  { id: "sig-9", time: "10:23:58 AM", severity: "Change", service: "Payments DB", message: "DB connection pool config updated", region: "us-east-1" },
  { id: "sig-10", time: "10:23:44 AM", severity: "P2", service: "Order Service", message: "Increased response time", region: "EU" },
  { id: "sig-11", time: "10:23:37 AM", severity: "Info", service: "Kubernetes", message: "Node scaling triggered", region: "us-east-1" },
  { id: "sig-12", time: "10:23:28 AM", severity: "AI", service: "Anomaly", message: "DB saturation pattern detected", region: "Global" },
];

export const deployments: Deployment[] = [
  { id: "dep-1", name: "payment-service", version: "v4.8.2", time: "10:20 AM", environment: "Production", progress: 80, status: "in-progress", blastRadius: "High" },
  { id: "dep-2", name: "checkout-service", version: "v2.1.7", time: "09:58 AM", environment: "Production", progress: 100, status: "complete", blastRadius: "Medium" },
  { id: "dep-3", name: "order-service", version: "v1.3.4", time: "10:15 AM", environment: "Production", progress: 45, status: "in-progress", blastRadius: "Low" },
];

export const latencySeries = [
  { t: "09:30", checkout: 210, payment: 480, order: 180 },
  { t: "09:40", checkout: 240, payment: 510, order: 175 },
  { t: "09:50", checkout: 260, payment: 560, order: 190 },
  { t: "10:00", checkout: 310, payment: 620, order: 185 },
  { t: "10:10", checkout: 420, payment: 760, order: 200 },
  { t: "10:20", checkout: 700, payment: 1180, order: 210 },
  { t: "10:30", checkout: 842, payment: 1240, order: 205 },
];

export const errorRateSeries = [
  { t: "09:30", checkout: 0.6, payment: 0.9, order: 0.3 },
  { t: "09:40", checkout: 0.7, payment: 1.1, order: 0.3 },
  { t: "09:50", checkout: 0.9, payment: 1.4, order: 0.4 },
  { t: "10:00", checkout: 1.1, payment: 1.8, order: 0.4 },
  { t: "10:10", checkout: 1.6, payment: 2.9, order: 0.5 },
  { t: "10:20", checkout: 2.6, payment: 4.6, order: 0.5 },
  { t: "10:30", checkout: 3.14, payment: 5.32, order: 0.42 },
];

export const throughputSeries = [
  { t: "09:30", checkout: 11.2, payment: 7.4, order: 5.8 },
  { t: "09:40", checkout: 11.8, payment: 7.8, order: 6.0 },
  { t: "09:50", checkout: 12.4, payment: 8.1, order: 6.2 },
  { t: "10:00", checkout: 12.9, payment: 8.4, order: 6.3 },
  { t: "10:10", checkout: 12.6, payment: 8.2, order: 6.3 },
  { t: "10:20", checkout: 12.4, payment: 8.0, order: 6.2 },
  { t: "10:30", checkout: 12.8, payment: 8.2, order: 6.3 },
];

// ---------------------------------------------------------------------------
// Cost & Risk data
// ---------------------------------------------------------------------------

export const costOpportunities: CostOpportunity[] = [
  {
    id: "cost-1",
    title: "Underutilized Kubernetes workloads",
    impact: "High",
    effort: "Low",
    annualSavings: "£146K",
    resource: "eks-prod-cluster-01",
    workload: "32 workloads < 15% CPU",
    service: "Platform Services",
    capability: "Digital Commerce",
    criticality: "Business Critical",
  },
  {
    id: "cost-2",
    title: "Overprovisioned databases",
    impact: "High",
    effort: "Low",
    annualSavings: "£92K",
    resource: "rds-payments-prod",
    workload: "db.r6g.4xlarge @ 22% util",
    service: "Payment API",
    capability: "Payments",
    criticality: "Business Critical",
  },
  {
    id: "cost-3",
    title: "Idle non-prod environments",
    impact: "Medium",
    effort: "Low",
    annualSavings: "£74K",
    resource: "staging-east / staging-west",
    workload: "18 idle environments (nights/weekends)",
    service: "Shared Platform",
    capability: "Engineering Enablement",
    criticality: "Standard",
  },
  {
    id: "cost-4",
    title: "Low-utilization services",
    impact: "Medium",
    effort: "Medium",
    annualSavings: "£61K",
    resource: "legacy-reports-fleet",
    workload: "9 services < 5% baseline traffic",
    service: "Reports & Analytics",
    capability: "Data & Analytics",
    criticality: "Important",
  },
  {
    id: "cost-5",
    title: "Excess telemetry ingestion",
    impact: "Low",
    effort: "Medium",
    annualSavings: "£39K",
    resource: "datadog-ingest",
    workload: "DEBUG logs in production namespaces",
    service: "Observability Pipeline",
    capability: "Engineering Enablement",
    criticality: "Standard",
  },
];

export const spendTrend = [
  { d: "Apr 9", compute: 62, storage: 28, database: 34, network: 12, other: 9 },
  { d: "Apr 13", compute: 66, storage: 29, database: 35, network: 12, other: 10 },
  { d: "Apr 17", compute: 64, storage: 30, database: 36, network: 13, other: 10 },
  { d: "Apr 21", compute: 70, storage: 31, database: 38, network: 13, other: 11 },
  { d: "Apr 25", compute: 68, storage: 31, database: 37, network: 14, other: 11 },
  { d: "Apr 29", compute: 72, storage: 32, database: 39, network: 14, other: 12 },
  { d: "May 3", compute: 74, storage: 33, database: 40, network: 15, other: 12 },
  { d: "May 7", compute: 76, storage: 34, database: 41, network: 15, other: 13 },
];

export const costByDomain = [
  { name: "Customer Experience", value: 842, share: "33.9%" },
  { name: "Payments Platform", value: 612, share: "24.7%" },
  { name: "Order Management", value: 419, share: "16.9%" },
  { name: "Data & Analytics", value: 286, share: "11.5%" },
  { name: "Identity & Access", value: 168, share: "6.8%" },
  { name: "Other", value: 152, share: "6.1%" },
];

export const costByProvider = [
  { name: "AWS", value: 1480, share: "59.7%" },
  { name: "Azure", value: 712, share: "28.7%" },
  { name: "GCP", value: 228, share: "9.2%" },
  { name: "Other", value: 56, share: "2.4%" },
];

export const riskFindings = [
  { label: "IAM Over-privileged Roles", severity: "High" as const, count: 12 },
  { label: "Publicly Exposed Resources", severity: "High" as const, count: 8 },
  { label: "Unencrypted Resources", severity: "Medium" as const, count: 19 },
  { label: "Missing Cost Tags", severity: "Medium" as const, count: 37 },
  { label: "Outdated Dependencies", severity: "Low" as const, count: 24 },
];

export const recentAnomalies = [
  { label: "Payment API - High Data Transfer", cost: "£12.4K", delta: "+215%", time: "10:15 AM" },
  { label: "Inventory Service - CPU Spike", cost: "£8.7K", delta: "+156%", time: "09:48 AM" },
  { label: "Reports DB - Storage Growth", cost: "£6.2K", delta: "+132%", time: "09:20 AM" },
  { label: "Search Service - Unusual Traffic", cost: "£5.1K", delta: "+96%", time: "08:55 AM" },
  { label: "Auth Service - Error Surge", cost: "£3.8K", delta: "+87%", time: "08:32 AM" },
];

// ---------------------------------------------------------------------------
// Engineering Portfolio data
// ---------------------------------------------------------------------------

export const portfolioApps: PortfolioApp[] = [
  { id: "app-1", name: "Online Checkout", domain: "Digital Sales", criticality: "Business Critical", health: "Healthy", techStack: "Java, Spring Boot, Oracle", age: "7 yrs", owners: ["RK", "SP"] },
  { id: "app-2", name: "Payment Service", domain: "Payments", criticality: "Business Critical", health: "At Risk", techStack: "Java, Spring, PostgreSQL", age: "8 yrs", owners: ["AC", "VM"] },
  { id: "app-3", name: "Inventory Service", domain: "Fulfilment", criticality: "Business Critical", health: "Healthy", techStack: "Go, gRPC, PostgreSQL", age: "4 yrs", owners: ["SG", "AK"] },
  { id: "app-4", name: "Customer Profile", domain: "Customer", criticality: "Important", health: "Healthy", techStack: ".NET, SQL Server", age: "9 yrs", owners: ["RM", "DS"] },
  { id: "app-5", name: "Search Service", domain: "Digital Experience", criticality: "Important", health: "At Risk", techStack: "Java, Elasticsearch", age: "6 yrs", owners: ["NP", "RT"] },
  { id: "app-6", name: "Legacy Order Management", domain: "Fulfilment", criticality: "At Risk", health: "Needs Attention", techStack: "WebLogic, Oracle, PL/SQL", age: "15 yrs", owners: ["PB", "SS"] },
  { id: "app-7", name: "Reports & Analytics", domain: "Data & Analytics", criticality: "Important", health: "Healthy", techStack: "Python, Airflow, Snowflake", age: "5 yrs", owners: ["VS", "AP"] },
  { id: "app-8", name: "Customer Support Portal", domain: "Customer Service", criticality: "Important", health: "Healthy", techStack: "React, Node.js, MongoDB", age: "3 yrs", owners: ["JM", "PK"] },
];

export const portfolioStats = {
  total: 212,
  businessCritical: 48,
  healthy: 128,
  atRisk: 24,
  redundant: 12,
  retirement: 28,
  annualRunCost: "£2.48M",
  potentialSavings: "£412K",
  techDebtScore: "7.2 / 10",
  modernization: "35%",
  cloudAdoption: "62%",
  automation: "48%",
};

export const appAgeProfile = [
  { range: "0 - 2", count: 32 },
  { range: "3 - 5", count: 48 },
  { range: "6 - 10", count: 67 },
  { range: "11 - 15", count: 38 },
  { range: "16+", count: 27 },
];

export const techStackDist = [
  { name: "Java", share: 35.4 },
  { name: ".NET", share: 18.9 },
  { name: "Python", share: 15.6 },
  { name: "JavaScript/Node", share: 12.3 },
  { name: "Go", share: 7.5 },
  { name: "Other", share: 10.3 },
];

export const modernizationRoadmap = [
  { initiative: "Cloud Migration", app: "Legacy Order Mgmt", target: "AWS (Microservices)", value: "High", timeline: "Q2 2025" },
  { initiative: "Re-platform", app: "Payment Service", target: "Kubernetes + RDS", value: "High", timeline: "Q3 2025" },
  { initiative: "Refactor", app: "Search Service", target: "Go + OpenSearch", value: "Medium", timeline: "Q3 2025" },
  { initiative: "Re-architect", app: "Customer Profile", target: "Microservices", value: "High", timeline: "Q4 2025" },
];

export const redundancyAnalysis = [
  { app: "Reports & Analytics", type: "Functional Overlap", impact: "Medium", cost: "£86K" },
  { app: "Legacy Reports", type: "Functional Overlap", impact: "High", cost: "£64K" },
  { app: "Old Search Service", type: "Technical Duplication", impact: "Medium", cost: "£42K" },
  { app: "Batch Data Export", type: "Process Duplication", impact: "Low", cost: "£28K" },
];

export const retirementCandidates = [
  { app: "Legacy CRM", reason: "Outdated / Replaced", risk: "Low", savings: "£120K" },
  { app: "Old Admin Portal", reason: "Low Usage", risk: "Low", savings: "£48K" },
  { app: "File Transfer Service", reason: "Replaced by SFTP", risk: "Low", savings: "£36K" },
  { app: "Legacy Batch Jobs", reason: "Business Sunset", risk: "Medium", savings: "£28K" },
];

export const notificationConsolidation = {
  app: "Customer Notification Service",
  implementations: 3,
  stacks: 2,
  annualCost: "£420K",
  duplicatedCapability: "34%",
  utilization: "Low",
  recommendation: "Consolidate into shared notification platform.",
  estimatedSavings: "£126K/year",
};

// ---------------------------------------------------------------------------
// Ask OCC demo query routing
// ---------------------------------------------------------------------------

export interface AskResult {
  answer: string;
  route?: string;
  routeLabel?: string;
}

export function askOcc(query: string): AskResult {
  const q = query.toLowerCase();
  if (q.includes("checkout") && (q.includes("fail") || q.includes("increas") || q.includes("why"))) {
    return {
      answer:
        "Checkout failures are driven by Payment API degradation. Root cause hypothesis (87% confidence): database connection-pool saturation following deployment payment-service v4.8.2 at 10:14 AM. 12,840 transactions affected, £184K exposure.",
      route: "/ai-insights",
      routeLabel: "Open AI Investigation",
    };
  }
  if (q.includes("changed") || q.includes("change")) {
    return {
      answer:
        "In the last 30 minutes: payment-service v4.8.2 deployed to production (10:14 AM), DB connection pool config updated (10:15 AM), checkout-service v2.1.7 rollout completed. payment-service v4.8.2 has a high blast radius and preceded the current P1 incident by 4 minutes.",
      route: "/live-ops",
      routeLabel: "View Live Ops",
    };
  }
  if (q.includes("blast radius")) {
    return {
      answer:
        "Blast radius of INC-8421: 3 services (Payment API, Checkout Service, Order Service), 2 customer journeys (Online Checkout, Click & Collect), ~12.8K transactions, £184K/hr revenue exposure.",
      route: "/incidents",
      routeLabel: "Open Incident",
    };
  }
  if (q.includes("journeys")) {
    return {
      answer:
        "3 customer journeys currently impacted: Online Checkout (Critical, £184K exposure), Click & Collect (£32K), Home Delivery (£18K). Loyalty Program shows minor points-sync failures (£7K).",
      route: "/",
      routeLabel: "View Overview",
    };
  }
  if (q.includes("business impact") || q.includes("impact")) {
    return {
      answer:
        "Estimated business exposure is £184K/hr, driven by ~12,840 affected transactions on Online Checkout. Payment API error rate is 5.32% (baseline 0.9%) with p95 latency at 1.24s.",
      route: "/",
      routeLabel: "View Overview",
    };
  }
  if (q.includes("services")) {
    return {
      answer:
        "Services involved in the current incident chain: Checkout Service → Payment API → Payments DB (PostgreSQL). Downstream: Order Service, Fraud Service. Infrastructure: Kubernetes prod cluster, Redis cache.",
      route: "/service-map",
      routeLabel: "Open Service Map",
    };
  }
  if (q.includes("agent")) {
    return {
      answer:
        "2 matching agents found in the enterprise pool: Payment Incident Investigator (94% match — resolved 14 similar incidents) and Cloud Database Optimization Agent (82% match — connection-pool analysis).",
      route: "/ai-insights",
      routeLabel: "View Agent Matches",
    };
  }
  if (q.includes("cost") || q.includes("cloud")) {
    return {
      answer:
        "Top cost drivers: over-provisioned compute (£184K), unused/idle resources (£96K), data transfer out (£54K). Total optimization opportunity: £412K annually. Payment API data transfer anomaly +215% detected at 10:15 AM.",
      route: "/cost-risk",
      routeLabel: "Open Cost & Risk",
    };
  }
  return {
    answer:
      "I can reason across the engineering knowledge graph — 41,634 entities and 128,492 relationships connecting signals, services, journeys, transactions, cost and agents. Try asking about checkout failures, blast radius, business impact, or available agents.",
  };
}

export const suggestedQueries = [
  "Why are checkout failures increasing?",
  "What changed in the last 30 minutes?",
  "What is the blast radius?",
  "What customer journeys are impacted?",
  "What is the estimated business impact?",
  "Which services are involved?",
  "Is there an agent that can help?",
  "Which cloud resources are driving cost?",
];
