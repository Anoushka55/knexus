// Engineering Knowledge Graph — 200+ synthetic entities with typed
// relationships. Deterministic generation so every render is stable.

import type { EntityType, KnowledgeEdge, KnowledgeNode, RelationType } from "./types";

export const entityColors: Record<EntityType, string> = {
  "Business Capability": "#001B4F",
  "Customer Journey": "#00338D",
  "Business Service": "#1D4ED8",
  "Software Service": "#3B82F6",
  Application: "#6366F1",
  API: "#0EA5E9",
  Database: "#0D9488",
  Infrastructure: "#0F766E",
  "Data / Resource": "#14B8A6",
  Telemetry: "#7DD3FC",
  Incident: "#DC2626",
  Change: "#EA580C",
  Deployment: "#F59E0B",
  "People / Team": "#8B5CF6",
  Cost: "#F97316",
  Risk: "#E11D48",
  Agent: "#7C3AED",
  Transaction: "#2563EB",
  "External System": "#94A3B8",
};

const domains = [
  "Online Checkout",
  "Payments",
  "Inventory Management",
  "Customer Profile",
  "Order Fulfilment",
  "Click & Collect",
  "Home Delivery",
  "Loyalty Program",
  "Search & Discovery",
  "Identity & Access",
  "Data & Analytics",
  "Store Operations",
];

// Seeded PRNG for deterministic layout/data
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

// Hand-authored core scenario nodes (the demo story) -------------------------

const coreNodes: KnowledgeNode[] = [
  { id: "cap-retail", label: "Retail Operations", type: "Business Capability" },
  { id: "cap-digital", label: "Digital Commerce", type: "Business Capability" },
  { id: "jrn-checkout", label: "Online Checkout", type: "Customer Journey", domain: "Online Checkout", status: "critical" },
  { id: "jrn-collect", label: "Click & Collect", type: "Customer Journey", domain: "Click & Collect", status: "degraded" },
  { id: "jrn-delivery", label: "Home Delivery", type: "Customer Journey", domain: "Home Delivery", status: "degraded" },
  { id: "jrn-loyalty", label: "Loyalty Program", type: "Customer Journey", domain: "Loyalty Program", status: "degraded" },
  { id: "bs-checkout", label: "Checkout Service", type: "Business Service", domain: "Online Checkout", status: "degraded" },
  { id: "bs-payment", label: "Payment API", type: "Business Service", domain: "Online Checkout", status: "critical" },
  { id: "bs-order", label: "Order Service", type: "Business Service", domain: "Order Fulfilment", status: "healthy" },
  { id: "bs-inventory", label: "Inventory Service", type: "Business Service", domain: "Inventory Management", status: "degraded" },
  { id: "ss-cart", label: "Cart Service", type: "Software Service", domain: "Online Checkout", status: "healthy" },
  { id: "ss-pricing", label: "Pricing Service", type: "Software Service", domain: "Online Checkout", status: "healthy" },
  { id: "ss-fraud", label: "Fraud Service", type: "Software Service", domain: "Payments", status: "healthy" },
  { id: "ss-notification", label: "Notification Service", type: "Software Service", domain: "Customer Profile", status: "healthy" },
  { id: "ss-customer", label: "Customer Profile", type: "Software Service", domain: "Customer Profile", status: "healthy" },
  { id: "ss-loyalty", label: "Loyalty Service", type: "Software Service", domain: "Loyalty Program", status: "degraded" },
  { id: "api-gateway", label: "API Gateway", type: "API", domain: "Online Checkout", status: "healthy" },
  { id: "db-payments", label: "Payments DB", type: "Database", domain: "Online Checkout", status: "critical" },
  { id: "db-orders", label: "Orders DB", type: "Database", domain: "Order Fulfilment", status: "healthy" },
  { id: "db-customer", label: "Customer DB", type: "Database", domain: "Customer Profile", status: "healthy" },
  { id: "infra-k8s", label: "Kubernetes Cluster", type: "Infrastructure", status: "healthy" },
  { id: "infra-redis", label: "Cache (Redis)", type: "Infrastructure", domain: "Online Checkout", status: "degraded" },
  { id: "infra-kafka", label: "Kafka Cluster", type: "Infrastructure", status: "healthy" },
  { id: "infra-s3", label: "S3 / Object Store", type: "Data / Resource", status: "healthy" },
  { id: "tel-latency", label: "Latency ↑ 42%", type: "Telemetry", domain: "Online Checkout" },
  { id: "tel-errors", label: "Errors ↑ 17%", type: "Telemetry", domain: "Online Checkout" },
  { id: "tel-conn", label: "Connection Pool 96%", type: "Telemetry", domain: "Online Checkout" },
  { id: "inc-8421", label: "INC-8421", type: "Incident", domain: "Online Checkout", status: "critical", meta: "Checkout Payment Degradation" },
  { id: "inc-8420", label: "INC-8420", type: "Incident", domain: "Online Checkout", status: "critical", meta: "DB Connection Saturation" },
  { id: "chg-482", label: "payment-service v4.8.2", type: "Deployment", domain: "Online Checkout", meta: "Deployed 10:14 AM" },
  { id: "chg-pool", label: "DB pool config update", type: "Change", domain: "Online Checkout" },
  { id: "team-payments", label: "Payments CoE", type: "People / Team" },
  { id: "team-commerce", label: "Digital Commerce CoE", type: "People / Team" },
  { id: "team-cloud", label: "Cloud CoE", type: "People / Team" },
  { id: "txn-payments", label: "Payment Transactions", type: "Transaction", domain: "Online Checkout", meta: "12,840 affected" },
  { id: "cost-exposure", label: "£184K Exposure", type: "Cost", domain: "Online Checkout" },
  { id: "risk-slo", label: "SLO Breach Risk", type: "Risk", domain: "Online Checkout" },
  { id: "agent-pii", label: "Payment Incident Investigator", type: "Agent", meta: "94% match" },
  { id: "agent-dbo", label: "Cloud DB Optimization Agent", type: "Agent", meta: "82% match" },
  { id: "ext-salesforce", label: "Salesforce CRM", type: "External System" },
  { id: "ext-servicenow", label: "ServiceNow", type: "External System" },
  { id: "ext-datadog", label: "Datadog", type: "External System" },
  { id: "ext-github", label: "GitHub / CI-CD", type: "External System" },
  { id: "ext-aws", label: "AWS", type: "External System" },
];

const coreEdges: Array<[string, string, RelationType]> = [
  ["jrn-checkout", "cap-digital", "PART_OF"],
  ["jrn-collect", "cap-retail", "PART_OF"],
  ["jrn-delivery", "cap-retail", "PART_OF"],
  ["jrn-loyalty", "cap-digital", "PART_OF"],
  ["bs-checkout", "jrn-checkout", "SUPPORTS"],
  ["bs-payment", "jrn-checkout", "SUPPORTS"],
  ["bs-order", "jrn-checkout", "SUPPORTS"],
  ["bs-inventory", "jrn-collect", "SUPPORTS"],
  ["ss-loyalty", "jrn-loyalty", "SUPPORTS"],
  ["api-gateway", "bs-checkout", "USES"],
  ["bs-checkout", "ss-cart", "DEPENDS_ON"],
  ["bs-checkout", "ss-pricing", "DEPENDS_ON"],
  ["bs-checkout", "bs-payment", "DEPENDS_ON"],
  ["bs-checkout", "bs-order", "DEPENDS_ON"],
  ["bs-payment", "ss-fraud", "DEPENDS_ON"],
  ["bs-payment", "db-payments", "DEPENDS_ON"],
  ["bs-payment", "infra-redis", "USES"],
  ["bs-order", "db-orders", "DEPENDS_ON"],
  ["bs-order", "ss-notification", "DEPENDS_ON"],
  ["bs-inventory", "infra-kafka", "USES"],
  ["ss-customer", "db-customer", "DEPENDS_ON"],
  ["ss-loyalty", "ss-customer", "DEPENDS_ON"],
  ["bs-checkout", "infra-k8s", "RUNS_ON"],
  ["bs-payment", "infra-k8s", "RUNS_ON"],
  ["bs-order", "infra-k8s", "RUNS_ON"],
  ["db-payments", "infra-k8s", "RUNS_ON"],
  ["infra-kafka", "infra-k8s", "RUNS_ON"],
  ["inc-8421", "bs-payment", "IMPACTS"],
  ["inc-8421", "jrn-checkout", "IMPACTS"],
  ["inc-8420", "db-payments", "IMPACTS"],
  ["inc-8421", "inc-8420", "CORRELATED_WITH"],
  ["inc-8421", "chg-482", "HAS_SUSPECTED_CAUSE"],
  ["inc-8420", "chg-pool", "CAUSED_BY"],
  ["chg-482", "chg-pool", "PRECEDED_BY"],
  ["tel-latency", "bs-payment", "GENERATES"],
  ["tel-errors", "bs-payment", "GENERATES"],
  ["tel-conn", "db-payments", "GENERATES"],
  ["txn-payments", "bs-payment", "USES"],
  ["txn-payments", "cost-exposure", "CONTRIBUTES_TO"],
  ["inc-8421", "cost-exposure", "CONTRIBUTES_TO"],
  ["risk-slo", "bs-payment", "IMPACTS"],
  ["team-payments", "bs-payment", "OWNS"],
  ["team-commerce", "bs-checkout", "OWNS"],
  ["team-cloud", "db-payments", "MANAGED_BY"],
  ["agent-pii", "inc-8421", "REQUIRES_CAPABILITY"],
  ["agent-dbo", "db-payments", "REQUIRES_CAPABILITY"],
  ["ext-datadog", "tel-latency", "GENERATES"],
  ["ext-servicenow", "inc-8421", "GENERATES"],
  ["ext-github", "chg-482", "GENERATES"],
  ["ext-aws", "infra-k8s", "MANAGED_BY"],
  ["ext-salesforce", "ss-customer", "USES"],
];

// Generated long-tail nodes to make the graph genuinely dense ----------------

const typePool: Array<{ type: EntityType; count: number; labels: string[] }> = [
  { type: "Application", count: 18, labels: ["Web Storefront", "Mobile App", "Store POS", "Price Engine", "Promo Engine", "CMS", "Search UI", "Returns Portal", "Supplier Portal", "HR Portal", "Finance Hub", "Warehouse App", "Delivery Tracker", "Chat Widget", "Analytics Hub", "CRM Console", "Loyalty App", "Gift Card App"] },
  { type: "Software Service", count: 22, labels: ["Auth Service", "Session Service", "Basket Sync", "Promo Service", "Refund Service", "Gift Card Service", "Address Service", "Shipping Service", "Tax Service", "Email Service", "SMS Service", "Push Service", "Search Service", "Recommendations", "Reviews Service", "Wishlist Service", "Subscription Svc", "Invoice Service", "Audit Service", "Feature Flags", "Config Service", "Scheduler"] },
  { type: "API", count: 12, labels: ["Payments REST API", "Orders GraphQL", "Inventory API", "Pricing API", "Fraud API", "Loyalty API", "Customer API", "Shipping API", "Webhook Router", "BFF Mobile", "BFF Web", "Partner API"] },
  { type: "Database", count: 10, labels: ["Inventory DB", "Pricing DB", "Loyalty DB", "Sessions DB", "Analytics DWH", "Search Index", "Audit Log Store", "Promo DB", "Config Store", "Document Store"] },
  { type: "Infrastructure", count: 14, labels: ["EKS Prod EU", "EKS Prod US", "EC2 Fleet", "NAT Gateway", "Load Balancer", "CDN (CloudFront)", "WAF", "VPN Gateway", "DNS Zone", "Service Mesh", "Ingress Controller", "AutoScaler", "Backup Vault", "Secrets Manager"] },
  { type: "Data / Resource", count: 10, labels: ["Orders Topic", "Payments Topic", "Inventory Topic", "Clickstream Stream", "Data Lake", "Feature Store", "ML Model Registry", "Redis Sessions", "Elastic Cluster", "Spark Cluster"] },
  { type: "Telemetry", count: 16, labels: ["APM Traces", "Error Budget", "SLO Dashboard", "Log Pipeline", "Metrics Store", "Synthetic Checks", "RUM Events", "CPU Metrics", "Memory Metrics", "Disk Metrics", "Network Metrics", "Trace Sampling", "Alert Rules", "Anomaly Detector", "Heartbeat Checks", "Deploy Markers"] },
  { type: "Incident", count: 8, labels: ["INC-8418", "INC-8415", "INC-8412", "INC-8409", "INC-8408", "INC-8407", "INC-8406", "INC-8404"] },
  { type: "Change", count: 8, labels: ["CHG-3301", "CHG-3298", "CHG-3294", "CHG-3290", "CHG-3286", "CHG-3281", "CHG-3277", "CHG-3270"] },
  { type: "Deployment", count: 8, labels: ["checkout v2.1.7", "order v1.3.4", "inventory v3.9.1", "pricing v2.4.0", "fraud v1.8.3", "notify v4.2.1", "loyalty v2.0.8", "search v5.1.2"] },
  { type: "People / Team", count: 12, labels: ["Fulfilment CoE", "Customer CoE", "Platform CoE", "SRE Team", "Data CoE", "Security CoE", "Checkout On-Call", "Payments On-Call", "DBA On-Call", "Incident Command", "Engineering Leads", "Product Owners"] },
  { type: "Cost", count: 8, labels: ["Compute £1.1M", "Storage £390K", "Database £480K", "Network £180K", "Observability £96K", "Licenses £140K", "Support £60K", "Data Transfer £54K"] },
  { type: "Risk", count: 8, labels: ["IAM Over-privilege", "Public Exposure", "Unencrypted Data", "Missing Cost Tags", "Outdated Deps", "Single AZ Risk", "Capacity Risk", "Vendor Lock-in"] },
  { type: "Agent", count: 8, labels: ["SRE Remediation Agent", "Capacity Planning Agent", "Cost Optimizer Agent", "Log Triage Agent", "Deploy Risk Agent", "Test Generation Agent", "Doc Summarizer Agent", "Security Scan Agent"] },
  { type: "Transaction", count: 6, labels: ["Order Transactions", "Refund Transactions", "Loyalty Points Txn", "Click & Collect Txn", "Delivery Slots Txn", "Gift Card Txn"] },
];

const relationPool: RelationType[] = [
  "USES",
  "DEPENDS_ON",
  "RUNS_ON",
  "OWNS",
  "SUPPORTS",
  "IMPACTS",
  "CONTRIBUTES_TO",
  "IMPLEMENTS",
  "PART_OF",
  "GENERATES",
  "CORRELATED_WITH",
  "MANAGED_BY",
];

export interface GraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

let cached: GraphData | null = null;

export function getGraphData(): GraphData {
  if (cached) return cached;

  const nodes: KnowledgeNode[] = [...coreNodes];
  const edges: KnowledgeEdge[] = coreEdges.map(([s, t, r], i) => ({
    id: `e-core-${i}`,
    source: s,
    target: t,
    relation: r,
  }));

  // Domain hub nodes for the remaining domains
  const domainHubs: string[] = [];
  for (const d of domains) {
    if (d === "Online Checkout") continue;
    const id = `dom-${d.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    nodes.push({ id, label: d, type: "Customer Journey", domain: d, status: "healthy" });
    domainHubs.push(id);
    edges.push({
      id: `e-dom-${id}`,
      source: id,
      target: rand() > 0.5 ? "cap-retail" : "cap-digital",
      relation: "PART_OF",
    });
  }

  // Generate long-tail entities
  const generatedIds: string[] = [];
  for (const group of typePool) {
    for (let i = 0; i < group.count; i++) {
      const label = group.labels[i]!;
      const id = `${group.type.slice(0, 3).toLowerCase()}-${i}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const domain = rand() > 0.35 ? pick(domains) : undefined;
      nodes.push({
        id,
        label,
        type: group.type,
        ...(domain ? { domain } : {}),
        status: rand() > 0.85 ? "degraded" : "healthy",
      });
      generatedIds.push(id);
    }
  }

  // Connect each generated node to something meaningful
  const attachTargets = [
    "bs-checkout",
    "bs-payment",
    "bs-order",
    "bs-inventory",
    "infra-k8s",
    "infra-kafka",
    "api-gateway",
    ...domainHubs,
  ];
  generatedIds.forEach((id, i) => {
    const target = attachTargets[i % attachTargets.length]!;
    edges.push({ id: `e-gen-${i}-a`, source: id, target, relation: pick(relationPool) });
    // ~40% get a second edge to another generated node for density
    if (rand() > 0.6 && i > 0) {
      edges.push({
        id: `e-gen-${i}-b`,
        source: id,
        target: generatedIds[Math.floor(rand() * i)]!,
        relation: pick(relationPool),
      });
    }
  });

  cached = { nodes, edges };
  return cached;
}

// Radial-ish deterministic layout: core nodes in a tight cluster, generated
// nodes in concentric rings around them.
export function getNodePosition(index: number, total: number, isCore: boolean) {
  if (isCore) {
    const angle = (index / 43) * Math.PI * 2;
    const radius = 180 + (index % 5) * 90;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }
  const ring = Math.floor(index / 40);
  const angle = (index / total) * Math.PI * 2 * 7 + ring * 0.6;
  const radius = 620 + ring * 160 + (index % 7) * 24;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

export const graphDomains = domains;
