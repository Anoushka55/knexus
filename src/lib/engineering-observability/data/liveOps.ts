export type SignalSeverity = 'P1' | 'P2' | 'P3' | 'Info';

export interface SignalEvent {
  time: string;
  severity: SignalSeverity;
  service: string;
  message: string;
}

export interface SloRow {
  service: string;
  pct: number;
  status: 'Good' | 'At Risk' | 'Breached';
}

export interface ErrorBudgetRow {
  service: string;
  burnRate1h: number;
  budgetLeftPct: number;
}

/** One point of a 3-series (Checkout Service / Payment API / Order Service) time series. */
export interface ServiceSeriesPoint {
  time: string;
  checkoutService: number;
  paymentApi: number;
  orderService: number;
}

export type HealthTileTone = 'red' | 'orange' | 'green' | 'blue';

export interface ServiceHealthTile {
  label: string;
  count: number;
  sub: string;
  tone: HealthTileTone;
  /** lucide-react icon name */
  icon: string;
}

export interface HeatmapRegion {
  region: string;
  health: number;
  latencyMs: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface DegradingService {
  service: string;
  health: number;
  latency: string;
  errorRatePct: number;
}

export interface DeploymentRow {
  name: string;
  time: string;
  env: string;
  pct: number;
}

export interface ActiveAlert {
  id: number;
  severity: SignalSeverity;
  title: string;
  subtitle: string;
  timeAgo: string;
}

/**
 * Service health rollup — defined once and shared by both the Signals and
 * SLOs views so the two tabs can never drift apart.
 */
const serviceHealthTiles: ServiceHealthTile[] = [
  { label: 'Customer Journeys', count: 3, sub: '2 Degraded', tone: 'orange', icon: 'Users' },
  { label: 'Business Services', count: 12, sub: '1 Critical', tone: 'red', icon: 'Briefcase' },
  { label: 'Applications', count: 28, sub: '3 Critical', tone: 'red', icon: 'AppWindow' },
  { label: 'Infrastructure', count: 56, sub: '2 Critical', tone: 'red', icon: 'Server' },
  { label: 'Databases', count: 14, sub: '1 Critical', tone: 'red', icon: 'Database' },
  { label: 'Middleware', count: 9, sub: '0 Critical', tone: 'green', icon: 'Layers' },
  { label: 'External Services', count: 8, sub: '1 Degraded', tone: 'orange', icon: 'Globe' },
  { label: 'Third Party', count: 15, sub: '2 Degraded', tone: 'orange', icon: 'ExternalLink' },
];

export const liveOpsSignalsView = {
  kpis: {
    activeSignals: 1248,
    activeSignalsDelta: 12,
    criticalAlerts: 23,
    criticalAlertsDelta: 5,
    warningAlerts: 67,
    warningAlertsDelta: 8,
    sloCompliance: 96.2,
    sloComplianceDelta: -1.3,
    errorRateAvgPct: 2.45,
    errorRateAvgDelta: 0.42,
    throughputTps: '12.8K',
    throughputTpsDelta: -18,
  },
  signalStream: [
    {
      time: '10:24:30 AM',
      severity: 'P1',
      service: 'Online Checkout',
      message: 'Payment API latency',
    },
    {
      time: '10:24:28 AM',
      severity: 'P1',
      service: 'Payment API',
      message: 'DB connection pool saturation',
    },
    {
      time: '10:24:26 AM',
      severity: 'P2',
      service: 'Inventory Service',
      message: 'High response time',
    },
    {
      time: '10:24:25 AM',
      severity: 'P2',
      service: 'Order Service',
      message: 'Error rate above threshold',
    },
    {
      time: '10:24:23 AM',
      severity: 'P3',
      service: 'Pricing Service',
      message: 'Cache miss rate elevated',
    },
    {
      time: '10:24:20 AM',
      severity: 'P3',
      service: 'Checkout Service',
      message: 'Increased slow requests',
    },
    {
      time: '10:24:18 AM',
      severity: 'Info',
      service: 'Deployment',
      message: 'payment-service v4.8.2 deployed',
    },
    {
      time: '10:24:15 AM',
      severity: 'Info',
      service: 'Kubernetes',
      message: 'Pod restarted: payment-api-5f7c9',
    },
  ] satisfies SignalEvent[],
  sloCompliance: [
    { service: 'Checkout Service', pct: 98.5, status: 'Good' },
    { service: 'Payment API', pct: 96.2, status: 'At Risk' },
    { service: 'Order Service', pct: 99.1, status: 'Good' },
    { service: 'Inventory Service', pct: 97.3, status: 'At Risk' },
    { service: 'Pricing Service', pct: 99.2, status: 'Good' },
    { service: 'Notification Service', pct: 99.6, status: 'Good' },
  ] satisfies SloRow[],
  errorBudget: [
    { service: 'Checkout Service', burnRate1h: 1.8, budgetLeftPct: 32 },
    { service: 'Payment API', burnRate1h: 2.3, budgetLeftPct: 18 },
  ] satisfies ErrorBudgetRow[],
  /** p95 latency in ms — lands on the live service numbers (842 / 1240 / 276). */
  latencyP95Series: [
    { time: '10:17', checkoutService: 410, paymentApi: 520, orderService: 240 },
    { time: '10:18', checkoutService: 468, paymentApi: 705, orderService: 248 },
    { time: '10:19', checkoutService: 540, paymentApi: 860, orderService: 255 },
    { time: '10:20', checkoutService: 612, paymentApi: 980, orderService: 262 },
    { time: '10:21', checkoutService: 690, paymentApi: 1075, orderService: 258 },
    { time: '10:22', checkoutService: 742, paymentApi: 1140, orderService: 266 },
    { time: '10:23', checkoutService: 798, paymentApi: 1198, orderService: 271 },
    { time: '10:24', checkoutService: 842, paymentApi: 1240, orderService: 276 },
  ] satisfies ServiceSeriesPoint[],
  /** error rate % — lands on 3.14 / 5.32 / 0.42. */
  errorRateSeries: [
    { time: '10:17', checkoutService: 0.8, paymentApi: 1.1, orderService: 0.3 },
    { time: '10:18', checkoutService: 1.2, paymentApi: 2.2, orderService: 0.32 },
    { time: '10:19', checkoutService: 1.7, paymentApi: 3.1, orderService: 0.35 },
    { time: '10:20', checkoutService: 2.1, paymentApi: 3.8, orderService: 0.38 },
    { time: '10:21', checkoutService: 2.5, paymentApi: 4.4, orderService: 0.36 },
    { time: '10:22', checkoutService: 2.8, paymentApi: 4.8, orderService: 0.4 },
    { time: '10:23', checkoutService: 3.0, paymentApi: 5.1, orderService: 0.41 },
    { time: '10:24', checkoutService: 3.14, paymentApi: 5.32, orderService: 0.42 },
  ] satisfies ServiceSeriesPoint[],
  /** throughput rps — lands on 12800 / 8200 / 6300. */
  throughputSeries: [
    { time: '10:17', checkoutService: 14200, paymentApi: 9400, orderService: 6800 },
    { time: '10:18', checkoutService: 14050, paymentApi: 9200, orderService: 6720 },
    { time: '10:19', checkoutService: 13800, paymentApi: 8950, orderService: 6640 },
    { time: '10:20', checkoutService: 13500, paymentApi: 8700, orderService: 6560 },
    { time: '10:21', checkoutService: 13200, paymentApi: 8500, orderService: 6480 },
    { time: '10:22', checkoutService: 13000, paymentApi: 8380, orderService: 6400 },
    { time: '10:23', checkoutService: 12900, paymentApi: 8280, orderService: 6350 },
    { time: '10:24', checkoutService: 12800, paymentApi: 8200, orderService: 6300 },
  ] satisfies ServiceSeriesPoint[],
  serviceHealthTiles,
};

export const liveOpsSlosView = {
  kpis: {
    activeAlerts: 17,
    activeAlertsDelta: 5,
    criticalServices: 3,
    criticalServicesDelta: 1,
    sloCompliancePct: 97.3,
    sloComplianceDelta: 1.8,
    errorRateGlobalPct: 2.14,
    errorRateGlobalDelta: 0.42,
    latencyP95Ms: 842,
    latencyP95Delta: -8,
    throughputRps: '12.8K',
    throughputRpsDelta: 12,
  },
  heatmapRegions: [
    { region: 'North America', health: 98.2, latencyMs: 23, status: 'healthy' },
    { region: 'Europe', health: 97.1, latencyMs: 41, status: 'healthy' },
    { region: 'Asia Pacific', health: 92.4, latencyMs: 84, status: 'warning' },
    { region: 'India', health: 88.7, latencyMs: 112, status: 'critical' },
  ] satisfies HeatmapRegion[],
  /** Coarser sampling than the Signals stream — 15s buckets. */
  liveSignalStream: [
    {
      time: '10:24:30 AM',
      severity: 'P1',
      service: 'Payment Service',
      message: 'SLO burn rate 2.3x — error budget at 18%',
    },
    {
      time: '10:24:15 AM',
      severity: 'P1',
      service: 'Payments DB',
      message: 'Connection pool above 90% for 6m',
    },
    {
      time: '10:24:00 AM',
      severity: 'P2',
      service: 'Checkout Service',
      message: 'SLO compliance dropped to 98.5%',
    },
    {
      time: '10:23:45 AM',
      severity: 'P2',
      service: 'India (edge)',
      message: 'Regional latency 112ms — above 80ms target',
    },
    {
      time: '10:23:30 AM',
      severity: 'P3',
      service: 'Promotion Service',
      message: 'p95 latency 640ms — trending up',
    },
    {
      time: '10:23:15 AM',
      severity: 'P3',
      service: 'Search Service',
      message: 'Slow query ratio elevated',
    },
    {
      time: '10:23:00 AM',
      severity: 'Info',
      service: 'Deployment',
      message: 'order-service v1.3.4 rollout at 45%',
    },
    {
      time: '10:22:45 AM',
      severity: 'Info',
      service: 'Autoscaler',
      message: 'checkout-service scaled 12 → 16 pods',
    },
  ] satisfies SignalEvent[],
  topDegradingServices: [
    { service: 'Payment API', health: 72, latency: '1.24s', errorRatePct: 5.32 },
    { service: 'Checkout Service', health: 78, latency: '842ms', errorRatePct: 3.14 },
    { service: 'Inventory Service', health: 91, latency: '312ms', errorRatePct: 0.84 },
    { service: 'Order Service', health: 94, latency: '276ms', errorRatePct: 0.42 },
    { service: 'User Profile Service', health: 96, latency: '189ms', errorRatePct: 0.21 },
  ] satisfies DegradingService[],
  activeDeployments: [
    { name: 'payment-service v4.8.2', time: '10:20 AM', env: 'Production', pct: 80 },
    { name: 'checkout-service v2.1.7', time: '09:58 AM', env: 'Production', pct: 100 },
    { name: 'order-service v1.3.4', time: '10:15 AM', env: 'Production', pct: 45 },
  ] satisfies DeploymentRow[],
  /** 17 active in total — these are the first 5 by severity. */
  activeAlerts: [
    {
      id: 1,
      severity: 'P1',
      title: 'Checkout Payment Degradation',
      subtitle: 'High error rate and latency on Payment API',
      timeAgo: '3m ago',
    },
    {
      id: 2,
      severity: 'P1',
      title: 'Database Connection Saturation',
      subtitle: 'Primary DB near connection capacity',
      timeAgo: '9m ago',
    },
    {
      id: 3,
      severity: 'P2',
      title: 'Increased Checkout Failures',
      subtitle: 'Failure rate above baseline',
      timeAgo: '12m ago',
    },
    {
      id: 4,
      severity: 'P2',
      title: 'S3 Bucket Latency',
      subtitle: 'High latency in media-storage bucket',
      timeAgo: '18m ago',
    },
    {
      id: 5,
      severity: 'P3',
      title: 'Cache Evictions High',
      subtitle: 'Redis eviction rate above normal',
      timeAgo: '24m ago',
    },
  ] satisfies ActiveAlert[],
  serviceHealthOverview: serviceHealthTiles,
};
