import type {
  Problem,
  ProblemStatus,
  RecommendedAction,
  RemediationRecord,
  Severity,
  SlaRisk,
} from "./types";
import { buildAlerts, buildEvents } from "./events";

/* Recommended actions the platform proposes */

export const recommendedActions: RecommendedAction[] = [
  {
    id: "ACT-101",
    title: "Fail over critical traffic to secondary WAN path",
    detail:
      "Shift business-critical application classes from the degraded primary path on WAN-EDGE-MUM-07 to the secondary path via WAN-EDGE-MUM-12, which is currently healthy at 0.09% loss and 41ms latency.",
    confidence: 93,
    automatable: true,
    approval: "Required",
    playbookId: "PB-01",
    expectedOutcome:
      "Packet loss returns below 1% and the three affected services move back inside SLA.",
  },
  {
    id: "ACT-102",
    title: "Scale compute tier and rebalance workload",
    detail:
      "Add two compute units to the Managed Cloud tier at Pune-02 and rebalance the order-processing workload from CLD-NODE-PUN-04 to CLD-NODE-PUN-05, which is running at 71% CPU.",
    confidence: 91,
    automatable: true,
    approval: "Required",
    playbookId: "PB-02",
    expectedOutcome:
      "Queue depth drains below 120 requests and p95 response time returns under 800ms.",
  },
  {
    id: "ACT-103",
    title: "Isolate affected endpoint and escalate to SOC",
    detail:
      "Quarantine EP-DEL-2291 from the corporate segment, preserve volatile state for forensics, and raise a priority SOC case correlating the firewall block pattern with the authentication failure burst.",
    confidence: 88,
    automatable: true,
    approval: "Required",
    playbookId: "PB-03",
    expectedOutcome:
      "Anomalous source activity stops and the SOC receives a fully correlated case file.",
  },
  {
    id: "ACT-104",
    title: "Re-home SIP trunk to secondary SBC",
    detail:
      "Move active call legs from SBC-BLR-02 to the secondary session border controller during the next low-traffic window to clear accumulated media path jitter.",
    confidence: 79,
    automatable: true,
    approval: "Required",
    playbookId: "PB-04",
    expectedOutcome: "Jitter returns below 12ms and call quality scores recover.",
  },
  {
    id: "ACT-105",
    title: "Stagger access point re-association",
    detail:
      "Spread AP re-association across three windows to clear the association backlog on WLC-PUN-01 without disrupting connected clients.",
    confidence: 74,
    automatable: true,
    approval: "Required",
    playbookId: "PB-05",
    expectedOutcome: "Controller CPU returns below 60% and association latency normalises.",
  },
  {
    id: "ACT-106",
    title: "Monitor provider edge latency",
    detail:
      "Latency drift on MPLS-PE-MUM-02 tracks the same upstream transport segment as the Mumbai-01 WAN degradation. No separate action is recommended until the primary WAN issue is resolved.",
    confidence: 68,
    automatable: false,
    approval: "Not required",
    expectedOutcome: "Expected to resolve alongside the primary WAN path remediation.",
  },
];

export const actionById = Object.fromEntries(recommendedActions.map((a) => [a.id, a])) as Record<
  string,
  RecommendedAction
>;

/* Problems
 *
 * Static definition. Correlated alert and event counts are attached at read
 * time from the live event log so the numbers stay true as the simulation runs.
 */

type ProblemDef = Omit<Problem, "alertIds" | "correlatedEventCount">;

const problemDefs: ProblemDef[] = [
  {
    id: "INC-4417",
    title: "Primary WAN path degradation at Mumbai-01",
    severity: "P1",
    status: "Investigating",
    domainId: "connectivity",
    serviceId: "SVC-SDWAN",
    siteId: "Mumbai-01",
    deviceId: "WAN-EDGE-MUM-07",
    journeyId: "JRN-CONN",
    scenarioId: "sdwan",
    openedMinutesAgo: 46,
    rootCause: "Primary WAN path degradation",
    rootCauseNarrative:
      "Packet loss, latency and jitter began rising together on the primary path of WAN-EDGE-MUM-07 roughly 75 minutes ago, accompanied by a climbing interface error rate on the same uplink. The signals move as one group and are confined to the primary circuit; the secondary path at Mumbai-05 remains healthy. That combination points to physical degradation of the primary WAN circuit rather than congestion, device failure or an application fault.",
    aiConfidence: 93,
    slaRisk: "At Risk",
    slaDetail:
      "3 enterprise services approaching SLA threshold. 41 minutes of error budget remaining on the Enterprise-A SD-WAN commitment.",
    impact: {
      affectedServiceIds: ["SVC-SDWAN", "SVC-MPLS", "SVC-SFLO"],
      affectedCustomerIds: ["Enterprise-A", "Enterprise-C"],
      affectedSiteIds: ["Mumbai-01"],
      usersAffected: 1840,
      summary:
        "SD-WAN, MPLS/VPN and Smartflo traffic at Mumbai-01 all traverse the degraded path. Enterprise-A and Enterprise-C branch users are seeing slow application response and degraded call quality.",
    },
    recommendedActionId: "ACT-101",
    signals: [
      "packet_loss_pct",
      "latency_ms",
      "jitter_ms",
      "interface_errors",
      "wan_utilization_pct",
    ],
    owner: "A. Mehta",
  },
  {
    id: "INC-4418",
    title: "Coordinated authentication anomaly at Delhi-04",
    severity: "P1",
    status: "Awaiting Approval",
    domainId: "security",
    serviceId: "SVC-MFW",
    siteId: "Delhi-04",
    deviceId: "EP-DEL-2291",
    journeyId: "JRN-SEC",
    scenarioId: "security",
    openedMinutesAgo: 34,
    rootCause: "Coordinated security anomaly",
    rootCauseNarrative:
      "Authentication failures at the Delhi-04 perimeter rose in step with firewall blocks from an unusual source range, and endpoint behaviour anomalies appeared on EP-DEL-2291 within the same window. The three signal families rise together rather than independently, which is characteristic of a coordinated credential attempt against a single compromised endpoint rather than a user-error or policy-sync problem.",
    aiConfidence: 88,
    slaRisk: "Within SLA",
    slaDetail:
      "SOC triage commitment is 10 minutes. Case correlated and ready for escalation with 6 minutes remaining.",
    impact: {
      affectedServiceIds: ["SVC-MFW", "SVC-EPS", "SVC-SOC"],
      affectedCustomerIds: ["Enterprise-C", "Enterprise-F"],
      affectedSiteIds: ["Delhi-04"],
      usersAffected: 62,
      summary:
        "Two managed endpoints at Delhi-04 show anomalous behaviour. No confirmed data movement. Perimeter controls are holding but the source is persistent.",
    },
    recommendedActionId: "ACT-103",
    signals: ["auth_failures", "firewall_blocks", "endpoint_anomalies"],
    owner: "R. Iyer",
  },
  {
    id: "INC-4420",
    title: "Capacity saturation building on Managed Cloud tier at Pune-02",
    severity: "P2",
    status: "Open",
    domainId: "cloud",
    serviceId: "SVC-MCLOUD",
    siteId: "Pune-02",
    deviceId: "CLD-NODE-PUN-04",
    journeyId: "JRN-CLOUD",
    scenarioId: "cloud",
    openedMinutesAgo: 28,
    rootCause: "Compute capacity saturation",
    rootCauseNarrative:
      "CPU and memory on CLD-NODE-PUN-04 have climbed steadily for two hours while request queue depth and application response time rose with them. The peer node CLD-NODE-PUN-05 is carrying materially less load, so the pattern is uneven workload placement reaching the capacity ceiling of a single node, not a platform-wide fault.",
    aiConfidence: 91,
    slaRisk: "At Risk",
    slaDetail:
      "Managed Cloud p95 response time commitment is 800ms. Current p95 is inside SLA but trending to breach.",
    impact: {
      affectedServiceIds: ["SVC-MCLOUD", "SVC-CCONN"],
      affectedCustomerIds: ["Enterprise-A", "Enterprise-D"],
      affectedSiteIds: ["Pune-02"],
      usersAffected: 730,
      summary:
        "Order-processing workloads for Enterprise-A and Enterprise-D are queueing. No customer-visible failure yet; response times are degrading.",
    },
    recommendedActionId: "ACT-102",
    signals: ["cpu_pct", "memory_pct", "request_queue", "response_time_ms"],
    owner: "N. Sharma",
  },
  {
    id: "INC-4419",
    title: "Media path jitter on SIP trunk at Bengaluru-03",
    severity: "P2",
    status: "Mitigating",
    domainId: "communication",
    serviceId: "SVC-SIP",
    siteId: "Bengaluru-03",
    deviceId: "SBC-BLR-02",
    journeyId: "JRN-UC",
    openedMinutesAgo: 63,
    rootCause: "Upstream transport jitter",
    rootCauseNarrative:
      "Jitter on SBC-BLR-02 has drifted upward over 90 minutes alongside minor packet loss on the branch uplink. Call completion is unaffected so far, but voice quality scores are trending down.",
    aiConfidence: 79,
    slaRisk: "At Risk",
    slaDetail:
      "SIP Trunk MOS commitment is 4.0. Current trend reaches 3.9 within the hour if untreated.",
    impact: {
      affectedServiceIds: ["SVC-SIP", "SVC-EVOICE"],
      affectedCustomerIds: ["Enterprise-B", "Enterprise-E"],
      affectedSiteIds: ["Bengaluru-03"],
      usersAffected: 410,
      summary: "Voice users at Bengaluru-03 report intermittent choppy audio on longer calls.",
    },
    recommendedActionId: "ACT-104",
    signals: ["jitter_ms", "packet_loss_pct"],
    owner: "S. Kapoor",
  },
  {
    id: "INC-4421",
    title: "Access point association backlog on WLC-PUN-01",
    severity: "P3",
    status: "Open",
    domainId: "infrastructure",
    serviceId: "SVC-MWIFI",
    siteId: "Pune-02",
    deviceId: "WLC-PUN-01",
    journeyId: "JRN-INFRA",
    openedMinutesAgo: 88,
    rootCause: "Controller association backlog",
    rootCauseNarrative:
      "Wireless controller CPU has risen with shift-change client density at Pune-02. The pattern repeats daily and clears on its own, but this cycle is running hotter than the previous seven.",
    aiConfidence: 74,
    slaRisk: "Within SLA",
    slaDetail: "AP availability remains at 99.7% against a 99.5% commitment.",
    impact: {
      affectedServiceIds: ["SVC-MWIFI"],
      affectedCustomerIds: ["Enterprise-D"],
      affectedSiteIds: ["Pune-02"],
      usersAffected: 260,
      summary:
        "Slower Wi-Fi association for retail floor staff at shift change. No loss of service.",
    },
    recommendedActionId: "ACT-105",
    signals: ["cpu_pct", "memory_pct"],
  },
  {
    id: "INC-4416",
    title: "Provider edge latency drift at Mumbai-01",
    severity: "P3",
    status: "Investigating",
    domainId: "connectivity",
    serviceId: "SVC-MPLS",
    siteId: "Mumbai-01",
    deviceId: "MPLS-PE-MUM-02",
    journeyId: "JRN-CONN",
    openedMinutesAgo: 52,
    rootCause: "Shared upstream transport segment",
    rootCauseNarrative:
      "Latency on MPLS-PE-MUM-02 tracks the same upstream segment as INC-4417. Correlation grouped it as a related symptom rather than an independent problem.",
    aiConfidence: 68,
    slaRisk: "Within SLA",
    slaDetail: "MPLS latency commitment is 60ms. Currently within threshold.",
    impact: {
      affectedServiceIds: ["SVC-MPLS"],
      affectedCustomerIds: ["Enterprise-C"],
      affectedSiteIds: ["Mumbai-01"],
      usersAffected: 180,
      summary:
        "Marginal latency increase on MPLS traffic at Mumbai-01. Expected to clear with INC-4417.",
    },
    recommendedActionId: "ACT-106",
    signals: ["latency_ms", "packet_loss_pct"],
  },
  {
    id: "INC-4415",
    title: "Cloud Connect BGP session flap at Bengaluru-03",
    severity: "P3",
    status: "Resolved",
    domainId: "cloud",
    serviceId: "SVC-CCONN",
    siteId: "Bengaluru-03",
    deviceId: "CLD-NODE-BLR-02",
    journeyId: "JRN-CLOUD",
    openedMinutesAgo: 214,
    rootCause: "Transient peering session reset",
    rootCauseNarrative:
      "A single BGP session reset on the Bengaluru-03 cloud interconnect. Traffic re-converged on the redundant path within 40 seconds.",
    aiConfidence: 82,
    slaRisk: "Within SLA",
    slaDetail: "No SLA impact. Redundant path absorbed the failover.",
    impact: {
      affectedServiceIds: ["SVC-CCONN"],
      affectedCustomerIds: ["Enterprise-F"],
      affectedSiteIds: ["Bengaluru-03"],
      usersAffected: 0,
      summary: "No customer-visible impact.",
    },
    recommendedActionId: "ACT-106",
    signals: ["latency_ms"],
    archivedEventCount: 9,
    archivedAlertCount: 2,
  },
  {
    id: "INC-4414",
    title: "Backup window overrun at Chennai-07",
    severity: "P3",
    status: "Resolved",
    domainId: "cloud",
    serviceId: "SVC-BDR",
    siteId: "Chennai-07",
    deviceId: "CLD-NODE-BLR-02",
    journeyId: "JRN-CLOUD",
    openedMinutesAgo: 286,
    rootCause: "Backup job contention",
    rootCauseNarrative:
      "Two protection policies overlapped, extending the backup window past its target. Schedules were separated automatically.",
    aiConfidence: 85,
    slaRisk: "Within SLA",
    slaDetail: "RPO of 15 minutes maintained throughout.",
    impact: {
      affectedServiceIds: ["SVC-BDR"],
      affectedCustomerIds: ["Enterprise-E"],
      affectedSiteIds: ["Chennai-07"],
      usersAffected: 0,
      summary: "No customer-visible impact. Backup completed inside RPO.",
    },
    recommendedActionId: "ACT-106",
    signals: ["cpu_pct"],
    archivedEventCount: 6,
    archivedAlertCount: 2,
  },
];

/** Problems with live correlation counts attached. */
export function getProblems(shift = 0): Problem[] {
  const alerts = buildAlerts(shift);
  const events = buildEvents(shift);
  return problemDefs.map((def) => {
    const mine = alerts.filter((a) => a.problemId === def.id);
    const alertIds = mine.map((a) => a.id);
    const ids = new Set(alertIds);
    const correlated = events.filter((e) => e.alertId && ids.has(e.alertId)).length;
    return {
      ...def,
      alertIds,
      // Problems whose live signal window has passed keep their recorded counts.
      correlatedEventCount: correlated || def.archivedEventCount || 0,
      openedMinutesAgo: def.openedMinutesAgo + shift,
    };
  });
}

/** Alert-group count, falling back to the recorded count for archived problems. */
export const alertCountOf = (p: Problem) => p.alertIds.length || p.archivedAlertCount || 0;

export function getProblem(id: string, shift = 0) {
  return getProblems(shift).find((p) => p.id === id);
}

export const problemIds = problemDefs.map((p) => p.id);

/* Remediation history */

export const remediationHistory: RemediationRecord[] = [
  {
    id: "REM-2201",
    problemId: "INC-4392",
    recommendation: "Fail over critical traffic to secondary WAN path",
    approvedBy: "A. Mehta (L2 Ops)",
    action: "Traffic failover executed on WAN-EDGE-MUM-07",
    result: "Packet loss fell from 2.8% to 0.11% within 4 minutes",
    verification:
      "Verified: loss below 1% threshold for 15 consecutive minutes, services returned inside SLA",
    minutesToVerify: 19,
    completedMinutesAgo: 8640,
    simulated: false,
  },
  {
    id: "REM-2202",
    problemId: "INC-4401",
    recommendation: "Scale compute tier and rebalance workload",
    approvedBy: "N. Sharma (Cloud Ops)",
    action: "Two compute units added at Pune-02, workload rebalanced",
    result: "Queue depth drained from 310 to 44 requests",
    verification: "Verified: p95 response time returned to 340ms",
    minutesToVerify: 26,
    completedMinutesAgo: 5760,
    simulated: false,
  },
  {
    id: "REM-2203",
    problemId: "INC-4388",
    recommendation: "Isolate affected endpoint and escalate to SOC",
    approvedBy: "R. Iyer (SOC Lead)",
    action: "Endpoint quarantined, forensic snapshot captured, SOC case raised",
    result: "Anomalous source activity ceased on isolation",
    verification: "Verified: no further authentication failures from source range over 60 minutes",
    minutesToVerify: 63,
    completedMinutesAgo: 20160,
    simulated: false,
  },
  {
    id: "REM-2204",
    problemId: "INC-4405",
    recommendation: "Re-home SIP trunk to secondary SBC",
    approvedBy: "S. Kapoor (Voice Ops)",
    action: "Active call legs migrated to secondary SBC",
    result: "Jitter fell from 21ms to 5.4ms",
    verification: "Verified: MOS recovered to 4.3",
    minutesToVerify: 22,
    completedMinutesAgo: 12960,
    simulated: false,
  },
  {
    id: "REM-2205",
    problemId: "INC-4396",
    recommendation: "Stagger access point re-association",
    approvedBy: "Auto-approved (low risk policy)",
    action: "AP re-association staggered across three windows",
    result: "Controller CPU returned from 81% to 54%",
    verification: "Verified: association latency normalised, no client drops",
    minutesToVerify: 14,
    completedMinutesAgo: 4320,
    simulated: false,
  },
];

/* Derived views */

export const severityOrder: Severity[] = ["P1", "P2", "P3"];
export const statusOptions: ProblemStatus[] = [
  "Open",
  "Investigating",
  "Mitigating",
  "Awaiting Approval",
  "Resolved",
];
export const slaRiskOptions: SlaRisk[] = ["Breached", "At Risk", "Within SLA"];

/** Root causes ranked by how many active problems share them. */
export function topRootCauses(shift = 0) {
  const active = getProblems(shift).filter((p) => p.status !== "Resolved");
  const counts = new Map<string, { count: number; events: number; confidence: number }>();
  for (const p of active) {
    const entry = counts.get(p.rootCause) ?? { count: 0, events: 0, confidence: 0 };
    entry.count += 1;
    entry.events += p.correlatedEventCount;
    entry.confidence = Math.max(entry.confidence, p.aiConfidence);
    counts.set(p.rootCause, entry);
  }
  return Array.from(counts.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.events - a.events);
}
