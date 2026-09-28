// Centralized operational data model for the AI Operations Control Tower.
// Frontend-only. All values are deterministic and reproducible.

export type DomainId = "connectivity" | "cloud" | "communication" | "infrastructure" | "security";

export type Severity = "P1" | "P2" | "P3";
export type SlaRisk = "Breached" | "At Risk" | "Within SLA";
export type ProblemStatus =
  | "Open"
  | "Investigating"
  | "Mitigating"
  | "Awaiting Approval"
  | "Resolved";

export type MetricId =
  | "packet_loss_pct"
  | "latency_ms"
  | "jitter_ms"
  | "interface_errors"
  | "wan_utilization_pct"
  | "cpu_pct"
  | "memory_pct"
  | "request_queue"
  | "response_time_ms"
  | "auth_failures"
  | "firewall_blocks"
  | "endpoint_anomalies";

export type ScenarioId = "sdwan" | "cloud" | "security";

export interface Domain {
  id: DomainId;
  name: string;
  short: string;
  description: string;
  colorVar: string;
}

export interface Service {
  id: string;
  name: string;
  domainId: DomainId;
  journeyId: string;
  slaTarget: string;
  criticality: "Critical" | "High" | "Standard";
}

export interface ServiceJourney {
  id: string;
  name: string;
  domainId: DomainId;
  description: string;
  serviceIds: string[];
  /** Drill-down path shown in the journey explorer. */
  drilldown: string[];
}

export interface Customer {
  id: string;
  name: string;
  segment: string;
  siteIds: string[];
  serviceIds: string[];
  contractedSla: string;
}

export interface Site {
  id: string;
  name: string;
  region: string;
  city: string;
  customerIds: string[];
}

export interface DeviceComponent {
  id: string;
  name: string;
  type: "WAN Edge" | "Compute Node" | "Firewall" | "SBC" | "Wireless Controller" | "Endpoint";
  siteId: string;
  serviceId: string;
  vendorClass: string;
}

export interface MetricDefinition {
  id: MetricId;
  label: string;
  unit: string;
  /** Value at or above which the metric is considered breaching. */
  warn: number;
  critical: number;
  /** Higher values are worse for every metric in this model. */
  precision: number;
}

export interface TelemetryPoint {
  t: number; // minutes before "now" (0 = now, 180 = three hours ago)
  v: number;
}

export interface TelemetrySeries {
  id: string;
  deviceId: string;
  serviceId: string;
  siteId: string;
  metric: MetricId;
  scenarioId?: ScenarioId;
  points: TelemetryPoint[];
}

export interface OperationalEvent {
  id: string;
  minutesAgo: number;
  severity: Severity;
  deviceId: string;
  serviceId: string;
  siteId: string;
  metric: MetricId;
  message: string;
  value: number;
  scenarioId?: ScenarioId;
  /** Alert group this event was folded into by correlation. */
  alertId?: string;
}

export interface Alert {
  id: string;
  title: string;
  metric: MetricId;
  severity: Severity;
  eventCount: number;
  firstSeenMinutesAgo: number;
  problemId?: string;
  scenarioId?: ScenarioId;
  sampleEventIds: string[];
}

export interface RecommendedAction {
  id: string;
  title: string;
  detail: string;
  confidence: number;
  automatable: boolean;
  approval: "Required" | "Not required";
  playbookId?: string;
  expectedOutcome: string;
}

export interface BusinessImpact {
  affectedServiceIds: string[];
  affectedCustomerIds: string[];
  affectedSiteIds: string[];
  usersAffected: number;
  summary: string;
}

export interface Problem {
  id: string;
  title: string;
  severity: Severity;
  status: ProblemStatus;
  domainId: DomainId;
  serviceId: string;
  siteId: string;
  deviceId: string;
  journeyId: string;
  scenarioId?: ScenarioId;
  openedMinutesAgo: number;
  alertIds: string[];
  correlatedEventCount: number;
  /** Counts retained for problems whose live signal window has passed. */
  archivedEventCount?: number;
  archivedAlertCount?: number;
  rootCause: string;
  rootCauseNarrative: string;
  aiConfidence: number;
  slaRisk: SlaRisk;
  slaDetail: string;
  impact: BusinessImpact;
  recommendedActionId: string;
  signals: MetricId[];
  owner?: string;
}

export interface Prediction {
  id: string;
  deviceId: string;
  serviceId: string;
  siteId: string;
  domainId: DomainId;
  scenarioId: ScenarioId;
  headline: string;
  probability: number;
  minutesToImpact: number;
  severityIfUnhandled: Severity;
  contributingSignals: { metric: MetricId; trend: string }[];
  explanation: string;
  recommendedAction: string;
  preventedImpact: string;
}

export type PlaybookStage =
  | "Trigger"
  | "AI Diagnosis"
  | "Recommended Action"
  | "Approval"
  | "Execution"
  | "Verification";

export type PlaybookStatus =
  | "AI Recommended"
  | "Awaiting Approval"
  | "Approved"
  | "Simulated Execution"
  | "Verified";

export interface Playbook {
  id: string;
  name: string;
  domainId: DomainId;
  serviceId: string;
  scenarioId: ScenarioId;
  status: PlaybookStatus;
  trigger: string;
  diagnosis: string;
  recommendation: string;
  approval: string;
  execution: string;
  verification: string;
  linkedProblemId?: string;
  autonomyLevel: "Assisted" | "Supervised" | "Agentic";
  engineerMinutesSaved: number;
  timesRun: number;
  successRate: number;
}

export interface RemediationRecord {
  id: string;
  problemId: string;
  recommendation: string;
  approvedBy: string;
  action: string;
  result: string;
  verification: string;
  minutesToVerify: number;
  completedMinutesAgo: number;
  simulated: boolean;
}
