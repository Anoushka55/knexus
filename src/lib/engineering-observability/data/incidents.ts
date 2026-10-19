export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
export type IncidentImpact = 'High' | 'Medium' | 'Low';

export interface Incident {
  id: string;
  severity: IncidentSeverity;
  title: string;
  /** one-line technical summary, shown under the title on Overview */
  summary: string;
  service: string;
  /** impacted customer journey, where the incident maps to one */
  journey?: string;
  status: IncidentStatus;
  started: string;
  /**
   * Elapsed time since `started`, measured against the 10:24 AM demo clock
   * (see lastUpdatedTime in ./user). Keep these in step with `started` —
   * a stale duration reads as a bug on camera.
   */
  duration: string;
  impact: IncidentImpact;
}

export interface ResolvedIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  resolved: string;
}

/**
 * The gold incident — referenced on Overview, Live Ops, Service Map,
 * Incidents, AI Insights and Knowledge Graph. Every field is load-bearing.
 */
export const goldIncident = {
  id: 'INC-8421',
  title: 'Checkout Payment Degradation',
  summary: 'Payment API latency and failure rate high',
  severity: 'P1' as const,
  status: 'Investigating' as const,
  service: 'Payment Service',
  journey: 'Online Checkout',
  team: 'Payments Squad',
  teamSeverity: 'SEV-1',
  priority: 'SEV-1',
  started: '10:18 AM',
  startedMinutesAgo: 6,
  duration: '6m',
  detectedBy: 'AI Anomaly Detection',
  description:
    'Customers experiencing high payment failure rate and increased latency during checkout process.',
  impact: {
    customerJourneys: 3,
    /** display "~12.8K" */
    transactionsImpacted: 12800,
    /** display "£184K / hr" */
    revenueExposurePerHour: 184000,
    /** display "98.0%" */
    slaImpact: 98.0,
  },
};

export const incidents: Incident[] = [
  {
    id: 'INC-8421',
    severity: 'P1',
    title: 'Checkout Payment Degradation',
    summary: 'Payment API latency and failure rate high',
    service: 'Payment Service',
    journey: 'Online Checkout',
    status: 'Investigating',
    started: '10:18 AM',
    duration: '6m',
    impact: 'High',
  },
  {
    id: 'INC-8420',
    severity: 'P1',
    title: 'Database Connection Saturation',
    summary: 'Primary DB connection pool near capacity',
    service: 'Payment API',
    status: 'Investigating',
    started: '10:15 AM',
    duration: '9m',
    impact: 'High',
  },
  {
    id: 'INC-8418',
    severity: 'P2',
    title: 'Inventory Sync Delays',
    summary: 'Stock levels lagging behind order events',
    service: 'Inventory Service',
    status: 'Identified',
    started: '09:58 AM',
    duration: '26m',
    impact: 'Medium',
  },
  {
    id: 'INC-8415',
    severity: 'P2',
    title: 'Order Service Error Spike',
    summary: 'Elevated 5xx responses on order creation',
    service: 'Order Service',
    status: 'Monitoring',
    started: '09:42 AM',
    duration: '42m',
    impact: 'Medium',
  },
  {
    id: 'INC-8412',
    severity: 'P3',
    title: 'Email Service Latency',
    summary: 'Transactional email delivery delayed',
    service: 'Notification Service',
    status: 'Monitoring',
    started: '09:15 AM',
    duration: '1h 9m',
    impact: 'Low',
  },
  {
    id: 'INC-8409',
    severity: 'P3',
    title: 'Search Service Slowdown',
    summary: 'Search queries above latency budget',
    service: 'Search Service',
    status: 'Monitoring',
    started: '08:55 AM',
    duration: '1h 29m',
    impact: 'Low',
  },
  {
    id: 'INC-8405',
    severity: 'P4',
    title: 'Analytics Pipeline Delay',
    summary: 'Nightly analytics batch finished late',
    service: 'Data Pipeline',
    status: 'Resolved',
    started: '07:32 AM',
    duration: '2h 52m',
    impact: 'Low',
  },
  {
    id: 'INC-8401',
    severity: 'P4',
    title: 'Logging Ingestion Lag',
    summary: 'Log ingestion backlog on the collector',
    service: 'Logging Service',
    status: 'Resolved',
    started: '06:45 AM',
    duration: '3h 39m',
    impact: 'Low',
  },
];

/** Resolved in the last 24 hours. */
export const recentResolvedIncidents: ResolvedIncident[] = [
  { id: 'INC-8408', title: 'Search Indexing Failure', severity: 'P3', resolved: '10:05 AM' },
  { id: 'INC-8407', title: 'Cache Cluster Failover', severity: 'P3', resolved: '09:47 AM' },
  { id: 'INC-8406', title: 'API Gateway Timeouts', severity: 'P2', resolved: '09:21 AM' },
  { id: 'INC-8404', title: 'File Upload Errors', severity: 'P3', resolved: '08:52 AM' },
];

export const incidentAggregate = {
  active: 8,
  p1: 2,
  p2: 3,
  p3: 2,
  p4: 1,
  resolved24h: 15,
  mttrMinutes: 42,
  /** improved 8m vs yesterday */
  mttrDeltaMinutes: -8,
};

export const incidentsById: Record<string, Incident> = incidents.reduce<Record<string, Incident>>(
  (acc, incident) => {
    acc[incident.id] = incident;
    return acc;
  },
  {},
);
