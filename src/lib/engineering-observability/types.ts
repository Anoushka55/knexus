// Shared enterprise domain types for the Engineering OCC PoC.

export type HealthStatus = "healthy" | "degraded" | "critical" | "down";
export type Severity = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus = "Investigating" | "Identified" | "Monitoring" | "Resolved";
export type TrendDirection = "up" | "down" | "flat";

export interface Service {
  id: string;
  name: string;
  domain: string;
  type: "Business Service" | "Software Service" | "Shared Service" | "Infrastructure";
  health: HealthStatus;
  healthScore: number;
  slo: number;
  latencyP95: number; // ms
  errorRate: number; // %
  requestsPerMin: string;
  throughputTps?: string;
  owner: string;
  onCall: string;
  techStack: string[];
  dependencies: string[]; // service ids
  journeys: string[]; // journey ids
  trend: TrendDirection;
}

export interface CustomerJourney {
  id: string;
  name: string;
  status: HealthStatus;
  transactionsPerHour: string;
  revenuePerHour: string;
  impactedTransactions: string;
  exposure: string;
  services: string[]; // service ids
  description: string;
}

export interface Incident {
  id: string; // e.g. INC-8421
  title: string;
  severity: Severity;
  status: IncidentStatus;
  service: string; // service id
  serviceName: string;
  journey: string; // journey id
  journeyName: string;
  started: string;
  startedAgo: string;
  duration: string;
  detectedBy: string;
  description: string;
  impact: {
    services: number;
    journeys: number;
    transactions: string;
    revenueExposure: string;
  };
}

export interface TimelineEvent {
  time: string;
  label: string;
  kind: "deploy" | "alert" | "degradation" | "correlation" | "info";
}

export interface TelemetrySignal {
  id: string;
  time: string;
  severity: Severity | "Info" | "AI" | "Deploy" | "Change" | "Anomaly";
  service: string;
  message: string;
  region?: string;
}

export interface Deployment {
  id: string;
  name: string;
  version: string;
  time: string;
  environment: string;
  progress: number;
  status: "in-progress" | "complete" | "failed";
  blastRadius: "Low" | "Medium" | "High";
}

export interface Agent {
  id: string;
  name: string;
  match: number; // %
  description: string;
  capabilities: string[];
  reason: string;
  owner: string;
}

export interface CostOpportunity {
  id: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  effort: "Low" | "Medium" | "High";
  annualSavings: string;
  resource: string;
  workload: string;
  service: string;
  capability: string;
  criticality: string;
}

export interface PortfolioApp {
  id: string;
  name: string;
  domain: string;
  criticality: "Business Critical" | "Important" | "Standard" | "At Risk";
  health: "Healthy" | "At Risk" | "Needs Attention" | "Redundant";
  techStack: string;
  age: string;
  owners: string[];
}

export interface DataConnector {
  id: string;
  name: string;
  category: string;
  status: "Connected" | "Degraded" | "Disconnected";
  entities: string;
  lastSync: string;
}

export interface ActivityItem {
  time: string;
  label: string;
  badge: "AI" | "P1" | "Deploy" | "Alert" | "Cost";
}

export interface SloRow {
  service: string;
  compliance: number;
  delta: number; // signed %
  status: "Good" | "At Risk" | "Breaching";
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: EntityType;
  domain?: string;
  status?: HealthStatus;
  meta?: string;
}

export type EntityType =
  | "Business Capability"
  | "Customer Journey"
  | "Business Service"
  | "Software Service"
  | "Application"
  | "API"
  | "Database"
  | "Infrastructure"
  | "Data / Resource"
  | "Telemetry"
  | "Incident"
  | "Change"
  | "Deployment"
  | "People / Team"
  | "Cost"
  | "Risk"
  | "Agent"
  | "Transaction"
  | "External System";

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  relation: RelationType;
}

export type RelationType =
  | "USES"
  | "DEPENDS_ON"
  | "RUNS_ON"
  | "OWNS"
  | "SUPPORTS"
  | "IMPACTS"
  | "CONTRIBUTES_TO"
  | "IMPLEMENTS"
  | "PART_OF"
  | "GENERATES"
  | "CORRELATED_WITH"
  | "CAUSED_BY"
  | "HAS_SUSPECTED_CAUSE"
  | "PRECEDED_BY"
  | "MANAGED_BY"
  | "REQUIRES_CAPABILITY";
