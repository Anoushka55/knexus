import type { Alert, MetricId, OperationalEvent, ScenarioId, Severity } from "./types";
import { deviceById, metricById } from "./catalog";
import { seriesById, valueAt } from "./telemetry";

/**
 * Events and alerts are derived from the telemetry series, so an event's
 * value always matches the chart it came from. Nothing is randomised.
 */

const message: Record<MetricId, (v: string, device: string) => string> = {
  packet_loss_pct: (v, d) => `Packet loss ${v} sustained on ${d} primary path`,
  latency_ms: (v, d) => `Round-trip latency ${v} above baseline on ${d}`,
  jitter_ms: (v, d) => `Jitter ${v} exceeds transport threshold on ${d}`,
  interface_errors: (v, d) => `Interface error rate ${v} on ${d} WAN uplink`,
  wan_utilization_pct: (v, d) => `WAN utilisation ${v} on ${d} primary circuit`,
  cpu_pct: (v, d) => `CPU utilisation ${v} sustained on ${d}`,
  memory_pct: (v, d) => `Memory utilisation ${v} on ${d}`,
  request_queue: (v, d) => `Request queue depth ${v} on ${d}`,
  response_time_ms: (v, d) => `Application response time ${v} on ${d}`,
  auth_failures: (v, d) => `Authentication failures ${v} observed at ${d}`,
  firewall_blocks: (v, d) => `Firewall block rate ${v} from unusual source range on ${d}`,
  endpoint_anomalies: (v, d) => `Endpoint behaviour anomalies ${v} detected on ${d}`,
};

function severityFor(metric: MetricId, value: number): Severity {
  const def = metricById[metric];
  if (!def) return "P3";
  if (value >= def.critical) return "P1";
  if (value >= def.warn) return "P2";
  return "P3";
}

interface EventPlan {
  alertId: string;
  seriesId: string;
  /** Minutes before now. Negative entries arrive during the live simulation. */
  offsets: number[];
}

/**
 * Correlation groups. Each plan becomes one alert; each offset becomes one
 * event folded into that alert. Counts are fixed so the demo narrative
 * ("23 events became 1 problem") stays true.
 */
const plans: EventPlan[] = [
  /* Scenario 1: SD-WAN degradation, 23 events across 5 alerts */
  { alertId: "ALT-9012", seriesId: "TS-001", offsets: [64, 52, 41, 30, 18, 7, -6, -14] },
  { alertId: "ALT-9013", seriesId: "TS-002", offsets: [58, 44, 31, 16, 5, -9] },
  { alertId: "ALT-9014", seriesId: "TS-003", offsets: [49, 35, 21, 9, -17] },
  { alertId: "ALT-9015", seriesId: "TS-004", offsets: [46, 33, 24, 12, 3, -11] },
  { alertId: "ALT-9016", seriesId: "TS-005", offsets: [38, 22, 8, -20] },

  /* Scenario 2: Cloud capacity saturation, 14 events across 4 alerts */
  { alertId: "ALT-9020", seriesId: "TS-020", offsets: [72, 51, 29, 11, -8] },
  { alertId: "ALT-9021", seriesId: "TS-021", offsets: [66, 40, 15, -19] },
  { alertId: "ALT-9022", seriesId: "TS-022", offsets: [58, 36, 19, 6, -12] },
  { alertId: "ALT-9023", seriesId: "TS-023", offsets: [47, 26, 9, -16] },

  /* Scenario 3: Coordinated security anomaly, 18 events across 4 alerts */
  { alertId: "ALT-9030", seriesId: "TS-040", offsets: [44, 37, 28, 20, 13, 6, -7] },
  { alertId: "ALT-9031", seriesId: "TS-041", offsets: [41, 31, 22, 12, 4, -13] },
  { alertId: "ALT-9032", seriesId: "TS-042", offsets: [34, 25, 17, 8, 2, -10] },
  { alertId: "ALT-9033", seriesId: "TS-043", offsets: [27, 14, -18] },

  /* Ambient operational signal from the wider estate */
  { alertId: "ALT-9040", seriesId: "TS-060", offsets: [63, 39, 17, -15] },
  { alertId: "ALT-9041", seriesId: "TS-063", offsets: [55, 28, 10] },
  { alertId: "ALT-9042", seriesId: "TS-009", offsets: [42, 19] },
  { alertId: "ALT-9043", seriesId: "TS-012", offsets: [50, 23, 4] },
];

const alertTitles: Record<string, string> = {
  "ALT-9012": "Packet loss threshold exceeded",
  "ALT-9013": "Latency above learned baseline",
  "ALT-9014": "Jitter above transport threshold",
  "ALT-9015": "Interface error rate climbing",
  "ALT-9016": "WAN utilisation approaching capacity",
  "ALT-9020": "Sustained CPU saturation",
  "ALT-9021": "Memory pressure on compute node",
  "ALT-9022": "Request queue backlog growing",
  "ALT-9023": "Application response time degrading",
  "ALT-9030": "Authentication failure burst",
  "ALT-9031": "Firewall block rate spike",
  "ALT-9032": "Endpoint behaviour anomaly",
  "ALT-9033": "Secondary endpoint anomaly",
  "ALT-9040": "Voice jitter drift on SIP trunk",
  "ALT-9041": "Wireless controller load rising",
  "ALT-9042": "Minor loss on branch uplink",
  "ALT-9043": "Provider edge latency drift",
};

/** Alerts that were rolled up into a correlated problem. */
const alertToProblem: Record<string, string> = {
  "ALT-9012": "INC-4417",
  "ALT-9013": "INC-4417",
  "ALT-9014": "INC-4417",
  "ALT-9015": "INC-4417",
  "ALT-9016": "INC-4417",
  "ALT-9020": "INC-4420",
  "ALT-9021": "INC-4420",
  "ALT-9022": "INC-4420",
  "ALT-9023": "INC-4420",
  "ALT-9030": "INC-4418",
  "ALT-9031": "INC-4418",
  "ALT-9032": "INC-4418",
  "ALT-9033": "INC-4418",
  "ALT-9040": "INC-4419",
  "ALT-9041": "INC-4421",
  "ALT-9043": "INC-4416",
};

function eventId(alertId: string, index: number) {
  return `EVT-${alertId.slice(4)}-${String(index + 1).padStart(2, "0")}`;
}

/**
 * Build the event log as it stands `shift` minutes into the live simulation.
 * Events scheduled in the near future surface as the simulation advances.
 */
export function buildEvents(shift = 0): OperationalEvent[] {
  const out: OperationalEvent[] = [];
  for (const plan of plans) {
    const spec = seriesById[plan.seriesId];
    if (!spec) continue;
    const device = deviceById[spec.deviceId];
    plan.offsets.forEach((offset, i) => {
      const minutesAgo = offset + shift;
      if (minutesAgo < 0) return; // has not happened yet
      const value = valueAt(spec, minutesAgo - shift);
      const def = metricById[spec.metric];
      const formatted = def
        ? `${value.toFixed(def.precision)}${def.unit === "%" ? "%" : ` ${def.unit}`}`
        : String(value);
      out.push({
        id: eventId(plan.alertId, i),
        minutesAgo,
        severity: severityFor(spec.metric, value),
        deviceId: spec.deviceId,
        serviceId: spec.serviceId,
        siteId: spec.siteId,
        metric: spec.metric,
        message: message[spec.metric](formatted, device ? device.name : spec.deviceId),
        value,
        scenarioId: spec.scenarioId,
        alertId: plan.alertId,
      });
    });
  }
  return out.sort((a, b) => a.minutesAgo - b.minutesAgo);
}

export function buildAlerts(shift = 0): Alert[] {
  const events = buildEvents(shift);
  return plans
    .map((plan): Alert | null => {
      const spec = seriesById[plan.seriesId];
      const mine = events.filter((e) => e.alertId === plan.alertId);
      if (!spec || mine.length === 0) return null;
      const worst = mine.reduce<Severity>(
        (acc, e) =>
          e.severity === "P1" || acc === "P1"
            ? "P1"
            : e.severity === "P2" || acc === "P2"
              ? "P2"
              : "P3",
        "P3",
      );
      return {
        id: plan.alertId,
        title: alertTitles[plan.alertId] ?? plan.alertId,
        metric: spec.metric,
        severity: worst,
        eventCount: mine.length,
        firstSeenMinutesAgo: Math.max(...mine.map((e) => e.minutesAgo)),
        problemId: alertToProblem[plan.alertId],
        scenarioId: spec.scenarioId,
        sampleEventIds: mine.slice(0, 3).map((e) => e.id),
      };
    })
    .filter((a): a is Alert => a !== null);
}

export function alertsForProblem(problemId: string, shift = 0) {
  return buildAlerts(shift).filter((a) => a.problemId === problemId);
}

export function eventsForProblem(problemId: string, shift = 0) {
  const ids = new Set(alertsForProblem(problemId, shift).map((a) => a.id));
  return buildEvents(shift).filter((e) => e.alertId && ids.has(e.alertId));
}

export function eventsForScenario(scenarioId: ScenarioId, shift = 0) {
  return buildEvents(shift).filter((e) => e.scenarioId === scenarioId);
}

/**
 * Raw signal volume the platform ingested over the reporting window.
 * Fixed per domain so noise-reduction figures stay stable across pages.
 */
export const rawSignalVolume24h: Record<string, number> = {
  connectivity: 5840,
  cloud: 3120,
  communication: 1460,
  infrastructure: 2210,
  security: 1970,
};

export const totalRawSignals24h = Object.values(rawSignalVolume24h).reduce((a, b) => a + b, 0);
