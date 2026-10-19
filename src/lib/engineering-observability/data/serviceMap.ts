export type NodeHealth = 'healthy' | 'degraded' | 'critical' | 'down';
export type EdgeKind = 'sync' | 'async' | 'data';

export interface TopologyNode {
  id: string;
  label: string;
  /** lucide-react icon name, experience-layer nodes only */
  icon?: string;
  health: NodeHealth;
  selected?: boolean;
}

export interface TopologyColumn {
  title: string;
  nodes: TopologyNode[];
}

export interface TopologyEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  /** part of the incident critical path — render red */
  critical?: boolean;
}

export interface TopTalker {
  service: string;
  trafficRpm: number;
  deltaPct: number;
}

export const topologyColumns: TopologyColumn[] = [
  {
    title: 'Experience Layer',
    nodes: [
      { id: 'web', label: 'Web', icon: 'Monitor', health: 'healthy' },
      { id: 'mobile', label: 'Mobile App', icon: 'Smartphone', health: 'healthy' },
      { id: 'pos', label: 'Store POS', icon: 'ShoppingCart', health: 'healthy' },
      { id: 'third', label: 'Third Party', icon: 'Users', health: 'healthy' },
    ],
  },
  {
    title: 'Business Services',
    nodes: [
      { id: 'gateway', label: 'API Gateway', health: 'healthy' },
      { id: 'web-ui', label: 'Web UI', health: 'healthy' },
      { id: 'mobile-bff', label: 'Mobile BFF', health: 'healthy' },
      { id: 'store-api', label: 'Store API', health: 'healthy' },
      { id: 'auth', label: 'Auth Service', health: 'healthy' },
      { id: 'cart', label: 'Cart Service', health: 'healthy' },
      { id: 'checkout-orc', label: 'Checkout Orchestrator', health: 'degraded' },
      { id: 'payment', label: 'Payment Service', health: 'critical', selected: true },
      { id: 'order', label: 'Order Service', health: 'healthy' },
      { id: 'notification', label: 'Notification Service', health: 'healthy' },
    ],
  },
  {
    title: 'Platform Services',
    nodes: [
      { id: 'pricing', label: 'Pricing Service', health: 'healthy' },
      { id: 'inventory', label: 'Inventory Service', health: 'healthy' },
      { id: 'customer', label: 'Customer Service', health: 'healthy' },
      { id: 'cache', label: 'Cache (Redis)', health: 'degraded' },
      { id: 'promotion', label: 'Promotion Service', health: 'degraded' },
      { id: 'fraud', label: 'Fraud Service', health: 'healthy' },
    ],
  },
  {
    title: 'Data & Infra',
    nodes: [
      { id: 'payments-db', label: 'Payments DB', health: 'critical' },
      { id: 'orders-db', label: 'Orders DB', health: 'healthy' },
      { id: 'customer-db', label: 'Customer DB', health: 'healthy' },
      { id: 'kafka', label: 'Kafka Cluster', health: 'healthy' },
      { id: 's3', label: 'S3 / Object Store', health: 'healthy' },
    ],
  },
];

export const serviceMap = {
  kpis: {
    totalServices: 127,
    totalServicesDelta: 8,
    criticalServices: 12,
    criticalServicesDelta: 2,
    healthyServices: 102,
    healthyServicesDelta: 6,
    degradedServices: 13,
    degradedServicesDelta: -1,
    downServices: 0,
    downServicesDelta: 0,
    dependencies: 357,
    dependenciesDelta: 24,
  },
  topologyColumns,
  criticalPath: ['web', 'gateway', 'checkout-orc', 'payment', 'payments-db'],
  topTalkers: [
    { service: 'Checkout Orchestrator', trafficRpm: 14892, deltaPct: 18 },
    { service: 'Payment Service', trafficRpm: 12840, deltaPct: 22 },
    { service: 'Inventory Service', trafficRpm: 9256, deltaPct: 11 },
    { service: 'Order Service', trafficRpm: 8971, deltaPct: 9 },
    { service: 'Customer Service', trafficRpm: 6432, deltaPct: -3 },
  ] satisfies TopTalker[],
  serviceHealthSummary: { healthy: 102, degraded: 13, critical: 12, down: 0, total: 127 },
  dependencyOverview: { total: 357, sync: 210, async: 92, data: 55, external: 28 },
};

/** Dependency edges for the react-flow topology render. */
export const edges: TopologyEdge[] = [
  // Experience layer into the gateway / BFFs
  { from: 'web', to: 'gateway', kind: 'sync', critical: true },
  { from: 'web', to: 'web-ui', kind: 'sync' },
  { from: 'mobile', to: 'mobile-bff', kind: 'sync' },
  { from: 'pos', to: 'store-api', kind: 'sync' },
  { from: 'third', to: 'gateway', kind: 'sync' },
  { from: 'mobile-bff', to: 'gateway', kind: 'sync' },
  { from: 'store-api', to: 'gateway', kind: 'sync' },

  // Gateway fan-out
  { from: 'gateway', to: 'auth', kind: 'sync' },
  { from: 'gateway', to: 'web-ui', kind: 'sync' },
  { from: 'gateway', to: 'checkout-orc', kind: 'sync', critical: true },

  // Checkout flow
  { from: 'web-ui', to: 'cart', kind: 'sync' },
  { from: 'checkout-orc', to: 'cart', kind: 'sync' },
  { from: 'checkout-orc', to: 'payment', kind: 'sync', critical: true },
  { from: 'checkout-orc', to: 'inventory', kind: 'sync' },
  { from: 'checkout-orc', to: 'order', kind: 'async' },

  // Cart / pricing
  { from: 'cart', to: 'pricing', kind: 'sync' },
  { from: 'cart', to: 'promotion', kind: 'sync' },

  // Payment subtree — the incident blast radius
  { from: 'payment', to: 'payments-db', kind: 'data', critical: true },
  { from: 'payment', to: 'fraud', kind: 'sync' },
  { from: 'payment', to: 'auth', kind: 'sync' },
  { from: 'payment', to: 'cache', kind: 'data' },

  // Order / fulfillment
  { from: 'order', to: 'orders-db', kind: 'data' },
  { from: 'order', to: 'notification', kind: 'async' },
  { from: 'order', to: 'inventory', kind: 'sync' },
  { from: 'order', to: 'kafka', kind: 'async' },

  // Customer platform
  { from: 'notification', to: 'customer', kind: 'sync' },
  { from: 'customer', to: 'customer-db', kind: 'data' },
  { from: 'customer', to: 'cache', kind: 'data' },
  { from: 'fraud', to: 'customer-db', kind: 'data' },

  // Platform into data & infra
  { from: 'pricing', to: 'cache', kind: 'data' },
  { from: 'promotion', to: 'cache', kind: 'data' },
  { from: 'auth', to: 'cache', kind: 'data' },
  { from: 'inventory', to: 'kafka', kind: 'async' },
  { from: 'store-api', to: 'inventory', kind: 'sync' },
  { from: 'kafka', to: 's3', kind: 'async' },
];

export const topologyNodes: TopologyNode[] = topologyColumns.flatMap((column) => column.nodes);

/** Critical-path node ids as a set, for fast lookup while rendering. */
export const criticalPathSet = new Set(serviceMap.criticalPath);

export function isCriticalPathEdge(edge: TopologyEdge): boolean {
  return edge.critical === true;
}
