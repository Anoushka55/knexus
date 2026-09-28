import type { Playbook, Prediction } from "./types";

/**
 * Predictions are produced by deterministic trend logic over the telemetry
 * series in telemetry.ts: each one names the signals it was derived from and
 * the pattern those signals match. No model is trained or executed here.
 */

export const predictions: Prediction[] = [
  {
    id: "PRD-01",
    deviceId: "WAN-EDGE-MUM-07",
    serviceId: "SVC-SDWAN",
    siteId: "Mumbai-01",
    domainId: "connectivity",
    scenarioId: "sdwan",
    headline: "High probability of service degradation",
    probability: 87,
    minutesToImpact: 42,
    severityIfUnhandled: "P1",
    contributingSignals: [
      { metric: "packet_loss_pct", trend: "Rising, 0.12% to 3.4% over 75 minutes" },
      { metric: "latency_ms", trend: "Rising, 34ms to 124ms over 75 minutes" },
      { metric: "jitter_ms", trend: "Rising, 3.6ms to 31ms over 72 minutes" },
      { metric: "interface_errors", trend: "Rising, 1/min to 82/min over 68 minutes" },
    ],
    explanation:
      "Current telemetry shows a sustained degradation pattern consistent with previous WAN path failures. Loss, latency, jitter and interface errors are rising together on a single circuit while the secondary path stays flat, which in the recorded history of this estate has preceded a full path failure within the hour on four of five occasions.",
    recommendedAction: "Shift critical traffic to the secondary WAN path.",
    preventedImpact:
      "Avoids an SLA breach across 3 enterprise services and roughly 1,840 branch users.",
  },
  {
    id: "PRD-02",
    deviceId: "CLD-NODE-PUN-04",
    serviceId: "SVC-MCLOUD",
    siteId: "Pune-02",
    domainId: "cloud",
    scenarioId: "cloud",
    headline: "High probability of cloud service degradation",
    probability: 84,
    minutesToImpact: 71,
    severityIfUnhandled: "P2",
    contributingSignals: [
      { metric: "cpu_pct", trend: "Rising, 46% to 89% over 2 hours" },
      { metric: "memory_pct", trend: "Rising, 58% to 91% over 2 hours" },
      { metric: "request_queue", trend: "Rising, 24 to 268 requests over 110 minutes" },
      { metric: "response_time_ms", trend: "Rising, 310ms to 1,240ms over 110 minutes" },
    ],
    explanation:
      "Compute and memory headroom on CLD-NODE-PUN-04 are being consumed at a steady rate while queue depth and response time climb in proportion. Extrapolating the current slope, the node reaches its capacity ceiling before the peer node absorbs the overflow, which is the point at which customer-visible timeouts begin.",
    recommendedAction: "Scale the compute tier and rebalance the workload to CLD-NODE-PUN-05.",
    preventedImpact:
      "Avoids p95 response time breaching the 800ms Managed Cloud commitment for 730 users.",
  },
  {
    id: "PRD-03",
    deviceId: "EP-DEL-2291",
    serviceId: "SVC-EPS",
    siteId: "Delhi-04",
    domainId: "security",
    scenarioId: "security",
    headline: "High probability of security anomaly escalation",
    probability: 76,
    minutesToImpact: 25,
    severityIfUnhandled: "P1",
    contributingSignals: [
      { metric: "auth_failures", trend: "Rising, 2/min to 68/min over 55 minutes" },
      { metric: "firewall_blocks", trend: "Rising, 18/min to 224/min over 55 minutes" },
      { metric: "endpoint_anomalies", trend: "Rising, 0.2/min to 11/min over 48 minutes" },
    ],
    explanation:
      "The source range driving authentication failures is widening its attempt pattern while endpoint anomalies on EP-DEL-2291 increase in step. Historically this combination escalates from probing to lateral movement attempts once anomaly rate passes 8 per minute, which the current slope reaches shortly.",
    recommendedAction: "Isolate EP-DEL-2291 and escalate the correlated case to the SOC.",
    preventedImpact: "Contains the endpoint before lateral movement across the Delhi-04 segment.",
  },
  {
    id: "PRD-04",
    deviceId: "SBC-BLR-02",
    serviceId: "SVC-SIP",
    siteId: "Bengaluru-03",
    domainId: "communication",
    scenarioId: "sdwan",
    headline: "Moderate probability of voice quality breach",
    probability: 64,
    minutesToImpact: 96,
    severityIfUnhandled: "P2",
    contributingSignals: [
      { metric: "jitter_ms", trend: "Rising, 5ms to 14ms over 90 minutes" },
      { metric: "packet_loss_pct", trend: "Rising, 0.1% to 0.55% over 90 minutes" },
    ],
    explanation:
      "Jitter on the Bengaluru-03 trunk is drifting upward on a shallow slope. Voice quality remains acceptable but the trend intersects the MOS 4.0 commitment inside the next two hours if the upstream transport does not recover.",
    recommendedAction:
      "Schedule a trunk re-home to the secondary SBC in the next low-traffic window.",
    preventedImpact: "Protects call quality for 410 users at Bengaluru-03.",
  },
];

export const predictionById = Object.fromEntries(predictions.map((p) => [p.id, p])) as Record<
  string,
  Prediction
>;

/* Agentic playbooks */

export const playbooks: Playbook[] = [
  {
    id: "PB-01",
    name: "WAN Degradation Response",
    domainId: "connectivity",
    serviceId: "SVC-SDWAN",
    scenarioId: "sdwan",
    status: "Awaiting Approval",
    trigger: "Packet loss and latency anomaly correlated on a single WAN path",
    diagnosis: "Primary WAN path degradation on WAN-EDGE-MUM-07, confidence 93%",
    recommendation: "Fail over critical traffic to the secondary WAN path",
    approval: "Required, L2 Operations",
    execution: "Simulated: traffic classes re-pointed to WAN-EDGE-MUM-12",
    verification: "Packet loss returns below the 1% threshold and holds for 15 minutes",
    linkedProblemId: "INC-4417",
    autonomyLevel: "Supervised",
    engineerMinutesSaved: 34,
    timesRun: 18,
    successRate: 94,
  },
  {
    id: "PB-02",
    name: "Cloud Capacity Response",
    domainId: "cloud",
    serviceId: "SVC-MCLOUD",
    scenarioId: "cloud",
    status: "AI Recommended",
    trigger: "Sustained CPU and memory saturation with growing request queue",
    diagnosis: "Compute capacity saturation on CLD-NODE-PUN-04, confidence 91%",
    recommendation: "Scale the compute tier and rebalance workload to the peer node",
    approval: "Required, Cloud Operations",
    execution: "Simulated: two compute units added, workload rebalanced",
    verification: "Queue depth drains below 120 and p95 response time returns under 800ms",
    linkedProblemId: "INC-4420",
    autonomyLevel: "Supervised",
    engineerMinutesSaved: 41,
    timesRun: 11,
    successRate: 91,
  },
  {
    id: "PB-03",
    name: "Security Anomaly Response",
    domainId: "security",
    serviceId: "SVC-EPS",
    scenarioId: "security",
    status: "Awaiting Approval",
    trigger: "Authentication failures, firewall blocks and endpoint anomalies rising together",
    diagnosis: "Coordinated security anomaly at Delhi-04, confidence 88%",
    recommendation: "Isolate the affected endpoint and escalate the correlated case to the SOC",
    approval: "Required, SOC Lead",
    execution: "Simulated: endpoint quarantined, forensic state preserved, SOC case raised",
    verification: "No further authentication failures from the source range for 60 minutes",
    linkedProblemId: "INC-4418",
    autonomyLevel: "Supervised",
    engineerMinutesSaved: 52,
    timesRun: 7,
    successRate: 100,
  },
  {
    id: "PB-04",
    name: "Communication Service Degradation",
    domainId: "communication",
    serviceId: "SVC-SIP",
    scenarioId: "sdwan",
    status: "Approved",
    trigger: "Media path jitter above threshold with degrading call quality score",
    diagnosis: "Upstream transport jitter affecting SBC-BLR-02, confidence 79%",
    recommendation: "Re-home the SIP trunk to the secondary session border controller",
    approval: "Approved, Voice Operations",
    execution: "Simulated: active call legs migrated to the secondary SBC",
    verification: "Jitter returns below 12ms and MOS recovers above 4.0",
    linkedProblemId: "INC-4419",
    autonomyLevel: "Supervised",
    engineerMinutesSaved: 27,
    timesRun: 14,
    successRate: 89,
  },
  {
    id: "PB-05",
    name: "Wireless Controller Load Balancing",
    domainId: "infrastructure",
    serviceId: "SVC-MWIFI",
    scenarioId: "cloud",
    status: "Verified",
    trigger: "Controller CPU above 75% with access point association backlog",
    diagnosis: "Association backlog on WLC-PUN-01, confidence 74%",
    recommendation: "Stagger access point re-association across three windows",
    approval: "Auto-approved under low-risk policy",
    execution: "Simulated: re-association staggered",
    verification: "Controller CPU returned below 60% with no client drops",
    linkedProblemId: "INC-4421",
    autonomyLevel: "Agentic",
    engineerMinutesSaved: 14,
    timesRun: 46,
    successRate: 97,
  },
];

export const playbookById = Object.fromEntries(playbooks.map((p) => [p.id, p])) as Record<
  string,
  Playbook
>;

/** The seven-stage capability ladder used across the product. */
export const maturityStages = [
  {
    id: "observe",
    name: "Observe",
    caption: "AI sees operational signals",
    detail:
      "Telemetry, events and alerts from connectivity, cloud, communication, infrastructure and security land in one place.",
    demonstrated: true,
  },
  {
    id: "correlate",
    name: "Correlate",
    caption: "AI connects events across systems",
    detail:
      "Related signals across domains are grouped so many events become a small number of meaningful problems.",
    demonstrated: true,
  },
  {
    id: "understand",
    name: "Understand",
    caption: "AI identifies probable root cause and impact",
    detail:
      "Each problem carries a probable root cause, a confidence score, and the services, customers and SLAs it affects.",
    demonstrated: true,
  },
  {
    id: "predict",
    name: "Predict",
    caption: "AI identifies likely future failures",
    detail:
      "Degradation patterns are projected forward with a probability and an estimated time to impact.",
    demonstrated: true,
  },
  {
    id: "recommend",
    name: "Recommend",
    caption: "AI proposes the best next action",
    detail:
      "Every problem and prediction resolves to a specific recommended action with an expected outcome.",
    demonstrated: true,
  },
  {
    id: "act",
    name: "Act",
    caption: "AI executes approved operational actions",
    detail:
      "Approved actions run as playbooks and are verified against telemetry. Execution is simulated in this environment.",
    demonstrated: true,
  },
  {
    id: "learn",
    name: "Learn",
    caption: "Outcomes improve future recommendations",
    detail:
      "Remediation outcomes feed back into recommendation ranking. Shown as the next step on the roadmap, not demonstrated here.",
    demonstrated: false,
  },
] as const;
