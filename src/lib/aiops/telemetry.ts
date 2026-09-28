import type { MetricId, ScenarioId, TelemetryPoint, TelemetrySeries } from "./types";
import { metricById } from "./catalog";

/**
 * Deterministic telemetry generation.
 *
 * Every value in the application is produced by a pure function of
 * (series seed, minute). Nothing here uses Math.random, so the same
 * operational story can be demonstrated repeatedly and identically.
 */

/* Deterministic pseudo-noise: stable for a given (seed, minute) pair. */
function hash(seed: number, minute: number) {
  let h = (seed * 374761393 + Math.round(minute) * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth, low-frequency wobble so flat series still look alive. */
function noiseAt(seed: number, minute: number) {
  const a = hash(seed, Math.floor(minute / 6));
  const b = hash(seed, Math.floor(minute / 6) + 1);
  const f = minute / 6 - Math.floor(minute / 6);
  return (a + (b - a) * f) * 2 - 1; // -1 .. 1
}

export interface SeriesSpec {
  id: string;
  deviceId: string;
  serviceId: string;
  siteId: string;
  metric: MetricId;
  scenarioId?: ScenarioId;
  /** Healthy steady-state value. */
  base: number;
  /** Value reached at t = now when the degradation is fully developed. */
  peak: number;
  /** Minutes before now at which the degradation begins. 0 = flat series. */
  rampStartMin: number;
  /** Amplitude of the deterministic wobble, in metric units. */
  noise: number;
  seed: number;
}

/** How far past "now" a degradation is allowed to keep climbing. */
const MAX_PROGRESS = 1.3;

/**
 * Value of a series at a point in time.
 * `minutesAgo` counts backwards from now; negative values are the near
 * future, which the live simulation walks into gradually.
 */
export function valueAt(spec: SeriesSpec, minutesAgo: number): number {
  const { base, peak, rampStartMin } = spec;
  let value = base;

  if (rampStartMin > 0 && peak !== base) {
    const raw = (rampStartMin - minutesAgo) / rampStartMin;
    const p = Math.max(0, Math.min(MAX_PROGRESS, raw));
    // Accelerating curve: degradation is subtle early and obvious late.
    const eased = Math.pow(p, 1.55);
    value = base + (peak - base) * eased;
  }

  value += noiseAt(spec.seed, minutesAgo) * spec.noise;

  const def = metricById[spec.metric];
  value = Math.max(0, value);
  const factor = Math.pow(10, def ? def.precision : 1);
  return Math.round(value * factor) / factor;
}

/** Window length rendered in charts, and its sampling interval. */
export const WINDOW_MINUTES = 180;
export const SAMPLE_MINUTES = 3;

/** Materialise a series over the visible window, offset into the future by `shift` minutes. */
export function pointsFor(spec: SeriesSpec, shift = 0): TelemetryPoint[] {
  const out: TelemetryPoint[] = [];
  for (let t = WINDOW_MINUTES; t >= 0; t -= SAMPLE_MINUTES) {
    out.push({ t, v: valueAt(spec, t - shift) });
  }
  return out;
}

export function latestValue(spec: SeriesSpec, shift = 0) {
  return valueAt(spec, -shift);
}

/** Percentage change across the visible window, used for trend arrows. */
export function trendPct(spec: SeriesSpec, shift = 0) {
  const first = valueAt(spec, WINDOW_MINUTES - shift);
  const last = valueAt(spec, -shift);
  if (first === 0) return last === 0 ? 0 : 100;
  return Math.round(((last - first) / Math.abs(first)) * 100);
}

/* Series definitions
 *
 * Scenario 1 (sdwan)    WAN-EDGE-MUM-07 degrades over the last ~75 minutes.
 * Scenario 2 (cloud)    CLD-NODE-PUN-04 saturates gradually; not yet an incident.
 * Scenario 3 (security) Delhi-04 perimeter and endpoint anomalies rise together.
 * Remaining series are healthy and provide contrast.
 */

const spec = (
  id: string,
  deviceId: string,
  serviceId: string,
  siteId: string,
  metric: MetricId,
  base: number,
  peak: number,
  rampStartMin: number,
  noise: number,
  seed: number,
  scenarioId?: ScenarioId,
): SeriesSpec => ({
  id,
  deviceId,
  serviceId,
  siteId,
  metric,
  base,
  peak,
  rampStartMin,
  noise,
  seed,
  scenarioId,
});

export const seriesSpecs: SeriesSpec[] = [
  /* Scenario 1: SD-WAN degradation at Mumbai-01 (primary WAN path) */
  spec(
    "TS-001",
    "WAN-EDGE-MUM-07",
    "SVC-SDWAN",
    "Mumbai-01",
    "packet_loss_pct",
    0.12,
    3.4,
    75,
    0.06,
    1101,
    "sdwan",
  ),
  spec(
    "TS-002",
    "WAN-EDGE-MUM-07",
    "SVC-SDWAN",
    "Mumbai-01",
    "latency_ms",
    34,
    124,
    75,
    2.4,
    1102,
    "sdwan",
  ),
  spec(
    "TS-003",
    "WAN-EDGE-MUM-07",
    "SVC-SDWAN",
    "Mumbai-01",
    "jitter_ms",
    3.6,
    31,
    72,
    0.9,
    1103,
    "sdwan",
  ),
  spec(
    "TS-004",
    "WAN-EDGE-MUM-07",
    "SVC-SDWAN",
    "Mumbai-01",
    "interface_errors",
    1,
    82,
    68,
    3,
    1104,
    "sdwan",
  ),
  spec(
    "TS-005",
    "WAN-EDGE-MUM-07",
    "SVC-SDWAN",
    "Mumbai-01",
    "wan_utilization_pct",
    54,
    93,
    75,
    2.5,
    1105,
    "sdwan",
  ),
  /* Secondary path stays healthy: this is what makes failover the right call. */
  spec(
    "TS-006",
    "WAN-EDGE-MUM-12",
    "SVC-SDWAN",
    "Mumbai-05",
    "packet_loss_pct",
    0.09,
    0.09,
    0,
    0.05,
    1106,
    "sdwan",
  ),
  spec(
    "TS-007",
    "WAN-EDGE-MUM-12",
    "SVC-SDWAN",
    "Mumbai-05",
    "latency_ms",
    41,
    41,
    0,
    2.2,
    1107,
    "sdwan",
  ),
  spec(
    "TS-008",
    "WAN-EDGE-MUM-12",
    "SVC-SDWAN",
    "Mumbai-05",
    "wan_utilization_pct",
    38,
    44,
    60,
    2.0,
    1108,
    "sdwan",
  ),
  /* Neighbouring sites show a mild shared upstream signature, not a fault. */
  spec(
    "TS-009",
    "WAN-EDGE-PUN-03",
    "SVC-SDWAN",
    "Pune-02",
    "packet_loss_pct",
    0.14,
    0.62,
    60,
    0.05,
    1109,
    "sdwan",
  ),
  spec(
    "TS-010",
    "WAN-EDGE-PUN-03",
    "SVC-SDWAN",
    "Pune-02",
    "latency_ms",
    37,
    52,
    60,
    2.1,
    1110,
    "sdwan",
  ),
  spec(
    "TS-011",
    "WAN-EDGE-BLR-05",
    "SVC-SDWAN",
    "Bengaluru-03",
    "packet_loss_pct",
    0.11,
    0.41,
    55,
    0.05,
    1111,
    "sdwan",
  ),
  spec(
    "TS-012",
    "MPLS-PE-MUM-02",
    "SVC-MPLS",
    "Mumbai-01",
    "latency_ms",
    29,
    58,
    70,
    1.8,
    1112,
    "sdwan",
  ),
  spec(
    "TS-013",
    "MPLS-PE-MUM-02",
    "SVC-MPLS",
    "Mumbai-01",
    "packet_loss_pct",
    0.08,
    0.74,
    70,
    0.04,
    1113,
    "sdwan",
  ),

  /* Scenario 2: Cloud capacity saturation at Pune-02 */
  spec(
    "TS-020",
    "CLD-NODE-PUN-04",
    "SVC-MCLOUD",
    "Pune-02",
    "cpu_pct",
    46,
    89,
    120,
    2.2,
    1201,
    "cloud",
  ),
  spec(
    "TS-021",
    "CLD-NODE-PUN-04",
    "SVC-MCLOUD",
    "Pune-02",
    "memory_pct",
    58,
    91,
    120,
    1.6,
    1202,
    "cloud",
  ),
  spec(
    "TS-022",
    "CLD-NODE-PUN-04",
    "SVC-MCLOUD",
    "Pune-02",
    "request_queue",
    24,
    268,
    110,
    8,
    1203,
    "cloud",
  ),
  spec(
    "TS-023",
    "CLD-NODE-PUN-04",
    "SVC-MCLOUD",
    "Pune-02",
    "response_time_ms",
    310,
    1240,
    110,
    26,
    1204,
    "cloud",
  ),
  spec(
    "TS-024",
    "CLD-NODE-PUN-05",
    "SVC-MCLOUD",
    "Pune-02",
    "cpu_pct",
    44,
    71,
    120,
    2.4,
    1205,
    "cloud",
  ),
  spec(
    "TS-025",
    "CLD-NODE-PUN-05",
    "SVC-MCLOUD",
    "Pune-02",
    "memory_pct",
    55,
    68,
    120,
    1.8,
    1206,
    "cloud",
  ),
  spec(
    "TS-026",
    "CLD-NODE-BLR-02",
    "SVC-MCLOUD",
    "Bengaluru-03",
    "cpu_pct",
    39,
    42,
    0,
    2.6,
    1207,
    "cloud",
  ),
  spec(
    "TS-027",
    "CLD-NODE-BLR-02",
    "SVC-MCLOUD",
    "Bengaluru-03",
    "response_time_ms",
    280,
    295,
    0,
    22,
    1208,
    "cloud",
  ),

  /* Scenario 3: Coordinated security anomaly at Delhi-04 */
  spec(
    "TS-040",
    "FW-DEL-01",
    "SVC-MFW",
    "Delhi-04",
    "auth_failures",
    2,
    68,
    55,
    1.5,
    1301,
    "security",
  ),
  spec(
    "TS-041",
    "FW-DEL-01",
    "SVC-MFW",
    "Delhi-04",
    "firewall_blocks",
    18,
    224,
    55,
    6,
    1302,
    "security",
  ),
  spec(
    "TS-042",
    "EP-DEL-2291",
    "SVC-EPS",
    "Delhi-04",
    "endpoint_anomalies",
    0.2,
    11,
    48,
    0.5,
    1303,
    "security",
  ),
  spec(
    "TS-043",
    "EP-DEL-2317",
    "SVC-EPS",
    "Delhi-04",
    "endpoint_anomalies",
    0.2,
    4,
    40,
    0.4,
    1304,
    "security",
  ),
  spec(
    "TS-044",
    "FW-MUM-03",
    "SVC-MFW",
    "Mumbai-01",
    "firewall_blocks",
    22,
    26,
    0,
    5,
    1305,
    "security",
  ),
  spec(
    "TS-045",
    "FW-MUM-03",
    "SVC-MFW",
    "Mumbai-01",
    "auth_failures",
    3,
    3,
    0,
    1.2,
    1306,
    "security",
  ),

  /* Communication and infrastructure: mild, non-critical movement */
  spec("TS-060", "SBC-BLR-02", "SVC-SIP", "Bengaluru-03", "jitter_ms", 5, 14, 90, 0.8, 1401),
  spec(
    "TS-061",
    "SBC-BLR-02",
    "SVC-SIP",
    "Bengaluru-03",
    "packet_loss_pct",
    0.1,
    0.55,
    90,
    0.05,
    1402,
  ),
  spec("TS-062", "SBC-MUM-01", "SVC-SFLO", "Mumbai-01", "jitter_ms", 4.2, 4.8, 0, 0.7, 1403),
  spec("TS-063", "WLC-PUN-01", "SVC-MWIFI", "Pune-02", "cpu_pct", 51, 73, 100, 2.8, 1404),
  spec("TS-064", "WLC-PUN-01", "SVC-MWIFI", "Pune-02", "memory_pct", 62, 69, 100, 1.5, 1405),
];

export const seriesById = Object.fromEntries(seriesSpecs.map((s) => [s.id, s])) as Record<
  string,
  SeriesSpec
>;

export function seriesFor(deviceId: string, metric?: MetricId) {
  return seriesSpecs.filter(
    (s) => s.deviceId === deviceId && (metric ? s.metric === metric : true),
  );
}

export function findSeries(deviceId: string, metric: MetricId) {
  return seriesSpecs.find((s) => s.deviceId === deviceId && s.metric === metric);
}

/** Convenience: fully materialised series for chart components. */
export function materialise(spec: SeriesSpec, shift = 0): TelemetrySeries {
  return {
    id: spec.id,
    deviceId: spec.deviceId,
    serviceId: spec.serviceId,
    siteId: spec.siteId,
    metric: spec.metric,
    scenarioId: spec.scenarioId,
    points: pointsFor(spec, shift),
  };
}

/** Breach state of a series at the current moment. */
export function breachState(spec: SeriesSpec, shift = 0): "ok" | "warn" | "critical" {
  const def = metricById[spec.metric];
  if (!def) return "ok";
  const v = latestValue(spec, shift);
  if (v >= def.critical) return "critical";
  if (v >= def.warn) return "warn";
  return "ok";
}
