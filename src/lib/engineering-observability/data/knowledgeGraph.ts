export type EntityTypeKey =
  | 'business-capability'
  | 'customer-journey'
  | 'business-service'
  | 'software-service'
  | 'infrastructure'
  | 'data-resource'
  | 'people-team'
  | 'agent'
  | 'external-system';

export interface EntityType {
  key: EntityTypeKey;
  label: string;
  color: string;
}

export interface DataFabricConnector {
  name: string;
  entities: number;
  status: 'Connected' | 'Syncing' | 'Error';
  /** lucide-react icon name */
  icon: string;
}

export interface GraphDomain {
  name: string;
  entities: number;
  selected?: boolean;
}

export interface ConnectedEntity {
  name: string;
  connections: number;
}

export interface ReasoningStep {
  label: string;
  ms: number;
}

export type ChangeTone = 'red' | 'blue' | 'orange' | 'green';

export interface RelatedChange {
  time: string;
  text: string;
  tone: ChangeTone;
}

export const knowledgeGraph = {
  counters: {
    totalEntities: 41634,
    entitiesDeltaPct: 8.6,
    relationships: 128492,
    relationshipsDeltaPct: 12.3,
    domains: 26,
    lastUpdated: '2 min ago',
    lastUpdatedFull: 'May 8, 2025 10:24 AM',
    dataSources: '7 / 7',
  },
  dataFabricConnectors: [
    { name: 'CRM (Salesforce)', entities: 12482, status: 'Connected', icon: 'Cloud' },
    { name: 'ServiceNow (ITSM)', entities: 3821, status: 'Connected', icon: 'Ticket' },
    { name: 'Observability (Datadog)', entities: 18492, status: 'Connected', icon: 'Activity' },
    { name: 'CMDB / Service Catalog', entities: 1284, status: 'Connected', icon: 'Database' },
    { name: 'GitHub / CI-CD', entities: 643, status: 'Connected', icon: 'GitBranch' },
    { name: 'Cloud & FinOps (AWS)', entities: 4912, status: 'Connected', icon: 'Cloud' },
    { name: 'Agent Marketplace', entities: 37, status: 'Connected', icon: 'Bot' },
  ] satisfies DataFabricConnector[],
  entityTypes: [
    { key: 'business-capability', label: 'Business Capability', color: '#3B82F6' },
    { key: 'customer-journey', label: 'Customer Journey', color: '#8B5CF6' },
    { key: 'business-service', label: 'Business Service', color: '#A855F7' },
    { key: 'software-service', label: 'Software Service', color: '#EC4899' },
    { key: 'infrastructure', label: 'Infrastructure', color: '#14B8A6' },
    { key: 'data-resource', label: 'Data / Resource', color: '#F97316' },
    { key: 'people-team', label: 'People / Team', color: '#EAB308' },
    { key: 'agent', label: 'Agent', color: '#EF4444' },
    { key: 'external-system', label: 'External System', color: '#94A3B8' },
  ] satisfies EntityType[],
  /** 26 domains — matches counters.domains. */
  domains: [
    { name: 'Online Checkout', entities: 156, selected: true },
    { name: 'Payments', entities: 128 },
    { name: 'Inventory Management', entities: 142 },
    { name: 'Customer Profile', entities: 98 },
    { name: 'Order Fulfillment', entities: 178 },
    { name: 'Search', entities: 87 },
    { name: 'Loyalty', entities: 63 },
    { name: 'Delivery', entities: 94 },
    { name: 'Returns & Refunds', entities: 71 },
    { name: 'Pricing & Promotions', entities: 116 },
    { name: 'Fraud & Risk', entities: 82 },
    { name: 'Store Operations', entities: 104 },
    { name: 'Identity & Access', entities: 89 },
    { name: 'Product Catalogue', entities: 133 },
    { name: 'Warehouse Management', entities: 121 },
    { name: 'Customer Support', entities: 76 },
    { name: 'Marketing Automation', entities: 68 },
    { name: 'Data & Analytics', entities: 147 },
    { name: 'Subscriptions', entities: 54 },
    { name: 'Gift Cards', entities: 41 },
    { name: 'Tax & Compliance', entities: 59 },
    { name: 'Supplier Integration', entities: 97 },
    { name: 'Notifications', entities: 73 },
    { name: 'Recommendations', entities: 65 },
    { name: 'Finance & Billing', entities: 112 },
    { name: 'Observability Platform', entities: 128 },
  ] satisfies GraphDomain[],
  selectedDomainDetail: {
    name: 'Online Checkout',
    entities: 156,
    relationships: 423,
    description:
      'Enables customers to complete purchases online including cart, payment, order creation and confirmation.',
    keyMetrics: {
      successRatePct: 94.9,
      successDeltaPct: -3.8,
      errorRatePct: 17.2,
      errorDeltaPct: -8.6,
      latencyP95: '842 ms',
      latencyDeltaPct: -42,
      transactions: '12.8K',
      transactionsDeltaPct: -17,
    },
    topConnectedEntities: [
      { name: 'Payment API', connections: 98 },
      { name: 'Checkout Service', connections: 86 },
      { name: 'Transaction Processing', connections: 74 },
      { name: 'PostgreSQL Cluster', connections: 62 },
      { name: 'Customer Session Store', connections: 48 },
    ] satisfies ConnectedEntity[],
    graphReasoning: [
      { label: 'Identifying affected journey', ms: 14 },
      { label: 'Locating impacted services', ms: 26 },
      { label: 'Correlating telemetry', ms: 42 },
      { label: 'Checking recent changes', ms: 35 },
      { label: 'Evaluating dependencies', ms: 21 },
      { label: 'Calculating impact', ms: 18 },
      { label: 'Root cause hypothesis', ms: 24 },
    ] satisfies ReasoningStep[],
    reasoningTotalMs: 182,
    aiAnswerSummary: {
      rootCauseHypothesis:
        'Payment API degradation caused by database connection pool saturation following deployment payment-service v4.8.2.',
      confidencePct: 87,
      impact: { services: 3, journeys: 2, transactions: '~12.8K', revenue: '£184K' },
    },
    relatedChanges: [
      { time: '4m ago', text: 'payment-service v4.8.2 deployed', tone: 'red' },
      { time: '32m ago', text: 'DB connection pool config updated', tone: 'blue' },
      { time: '35m ago', text: 'Increased checkout traffic', tone: 'orange' },
      { time: '2h ago', text: 'Redis scale up', tone: 'green' },
    ] satisfies RelatedChange[],
  },
};

// ---------------------------------------------------------------------------
// Rendered graph
//
// The counters claim 41,634 entities; we render ~420 visible nodes and ~800
// edges — enough to read as dense without melting the layout engine. Rings
// radiate out from the 'Online Checkout' journey at the centre.
// ---------------------------------------------------------------------------

export type GraphEdgeKind = 'depends' | 'calls' | 'uses' | 'contains';

export interface GraphNode {
  id: string;
  label?: string;
  type: EntityTypeKey;
  /** 0 = centre, 1 = major hub, 4 = leaf */
  ring: 0 | 1 | 2 | 3 | 4;
  /** node radius in px */
  size: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: GraphEdgeKind;
}

export interface RenderedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const RING_1_HUBS: { label: string; type: EntityTypeKey }[] = [
  { label: 'Checkout Service', type: 'business-service' },
  { label: 'Payment API', type: 'software-service' },
  { label: 'Payments DB', type: 'infrastructure' },
  { label: 'Retail Sales', type: 'business-service' },
  { label: 'Payment Processing', type: 'business-service' },
  { label: 'Customer Store', type: 'data-resource' },
  { label: 'Order Service', type: 'software-service' },
  { label: 'Kubernetes Cluster', type: 'infrastructure' },
  { label: 'PostgreSQL Cluster', type: 'infrastructure' },
  { label: 'Onboard Service', type: 'business-service' },
  { label: 'Typ1 Checkout', type: 'business-service' },
  { label: 'Checkout', type: 'business-capability' },
];

const RING_2_COUNT = 60;
const RING_3_COUNT = 200;
const RING_4_COUNT = 148;

const RING_2_TYPES: EntityTypeKey[] = [
  'software-service',
  'business-service',
  'infrastructure',
  'data-resource',
];

const RING_3_TYPES: EntityTypeKey[] = [
  'software-service',
  'data-resource',
  'people-team',
  'agent',
  'infrastructure',
];

const RING_4_TYPES: EntityTypeKey[] = [
  'infrastructure',
  'people-team',
  'external-system',
  'data-resource',
];

const RING_3_LABEL_PREFIXES = ['API', 'Store', 'Team', 'Agent', 'Node'];

const EDGE_KINDS: GraphEdgeKind[] = ['depends', 'calls', 'uses', 'contains'];

/** Deterministic PRNG — keeps server and client renders identical. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateRenderedGraph(): RenderedGraph {
  const random = mulberry32(0x0cc0421);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  const pick = <T,>(pool: T[]): T => pool[Math.floor(random() * pool.length) % pool.length];

  function addEdge(source: string, target: string, kind: GraphEdgeKind): boolean {
    if (source === target) return false;
    const key = source < target ? `${source}|${target}` : `${target}|${source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    edges.push({ id: `e${edges.length}`, source, target, kind });
    return true;
  }

  // Ring 0 — the journey under investigation.
  const centre: GraphNode = {
    id: 'kg-centre',
    label: 'Online Checkout',
    type: 'customer-journey',
    ring: 0,
    size: 48,
  };
  nodes.push(centre);

  // Ring 1 — 12 named major hubs.
  const ring1 = RING_1_HUBS.map((hub, index) => {
    const node: GraphNode = {
      id: `kg-r1-${index}`,
      label: hub.label,
      type: hub.type,
      ring: 1,
      size: 28,
    };
    nodes.push(node);
    addEdge(centre.id, node.id, 'contains');
    return node;
  });

  // Ring 2 — 60 sub-services, each hung off a hub.
  const ring2 = Array.from({ length: RING_2_COUNT }, (_, index) => {
    const node: GraphNode = {
      id: `kg-r2-${index}`,
      label: `Service ${index + 1}`,
      type: RING_2_TYPES[index % RING_2_TYPES.length],
      ring: 2,
      size: 18,
    };
    nodes.push(node);
    addEdge(ring1[index % ring1.length].id, node.id, 'depends');
    return node;
  });

  // Ring 3 — 200 fine nodes; every third one carries a label.
  const ring3 = Array.from({ length: RING_3_COUNT }, (_, index) => {
    const labelled = index % 3 === 0;
    const prefix = RING_3_LABEL_PREFIXES[index % RING_3_LABEL_PREFIXES.length];
    const node: GraphNode = {
      id: `kg-r3-${index}`,
      label: labelled ? `${prefix} ${Math.floor(index / 5) + 1}` : undefined,
      type: RING_3_TYPES[index % RING_3_TYPES.length],
      ring: 3,
      size: 12,
    };
    nodes.push(node);
    addEdge(ring2[index % ring2.length].id, node.id, 'calls');
    return node;
  });

  // Ring 4 — 148 unlabelled leaves (pods, users, config items, externals).
  const ring4 = Array.from({ length: RING_4_COUNT }, (_, index) => {
    const node: GraphNode = {
      id: `kg-r4-${index}`,
      type: RING_4_TYPES[index % RING_4_TYPES.length],
      ring: 4,
      size: 8,
    };
    nodes.push(node);
    addEdge(ring3[index % ring3.length].id, node.id, 'contains');
    return node;
  });

  // Cross-links — push the edge count to ~800 so the graph reads as a mesh
  // rather than a tree.
  const crossLinks: { from: GraphNode[]; to: GraphNode[]; count: number }[] = [
    { from: ring1, to: ring1, count: 18 },
    { from: ring2, to: ring1, count: 40 },
    { from: ring2, to: ring2, count: 30 },
    { from: ring3, to: ring2, count: 120 },
    { from: ring3, to: ring3, count: 90 },
    { from: ring4, to: ring3, count: 82 },
  ];

  for (const link of crossLinks) {
    let added = 0;
    let attempts = 0;
    while (added < link.count && attempts < link.count * 12) {
      attempts += 1;
      if (addEdge(pick(link.from).id, pick(link.to).id, pick(EDGE_KINDS))) added += 1;
    }
  }

  return { nodes, edges };
}

export const renderedGraph: RenderedGraph = generateRenderedGraph();
