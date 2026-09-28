import type { DomainId, Problem, ScenarioId, Severity, SlaRisk } from "./types";
import { domains, journeys, services } from "./catalog";
import { buildAlerts, buildEvents, totalRawSignals24h } from "./events";
import { getProblems } from "./problems";
import { predictions, playbooks } from "./predictions";
import { breachState, seriesSpecs } from "./telemetry";

export * from "./types";
export * from "./catalog";
export * from "./telemetry";
export * from "./events";
export * from "./problems";
export * from "./predictions";

/* Reporting-window constants
 *
 * The visible dataset covers the last three hours. These figures describe the
 * surrounding 24-hour window so the rate-of-work KPIs are stable across pages.
 */
export const alertVolume24h = 312;
export const problemVolume24h = 34;

/* Service and domain health */

export interface ServiceHealth {
  serviceId: string;
  name: string;
  domainId: DomainId;
  score: number;
  status: "Healthy" | "Degraded" | "At Risk";
  activeProblems: number;
  worstSeverity?: Severity;
  slaRisk: SlaRisk;
}

const severityPenalty: Record<Severity, number> = { P1: 26, P2: 13, P3: 5 };

export function serviceHealth(shift = 0): ServiceHealth[] {
  const active = getProblems(shift).filter((p) => p.status !== "Resolved");

  return services.map((svc) => {
    let score = 100;

    // Telemetry pressure on this service's components.
    for (const spec of seriesSpecs) {
      if (spec.serviceId !== svc.id) continue;
      const state = breachState(spec, shift);
      if (state === "critical") score -= 11;
      else if (state === "warn") score -= 5;
    }

    // Open problems on this service, or on a service it depends on.
    const own = active.filter((p) => p.serviceId === svc.id);
    const impacted = active.filter(
      (p) => p.serviceId !== svc.id && p.impact.affectedServiceIds.includes(svc.id),
    );
    for (const p of own) score -= severityPenalty[p.severity];
    for (const p of impacted) score -= Math.round(severityPenalty[p.severity] / 2);

    score = Math.max(24, Math.min(100, Math.round(score)));

    const all = [...own, ...impacted];
    const worstSeverity = (["P1", "P2", "P3"] as Severity[]).find((s) =>
      all.some((p) => p.severity === s),
    );
    const slaRisk: SlaRisk = all.some((p) => p.slaRisk === "Breached")
      ? "Breached"
      : all.some((p) => p.slaRisk === "At Risk")
        ? "At Risk"
        : "Within SLA";

    return {
      serviceId: svc.id,
      name: svc.name,
      domainId: svc.domainId,
      score,
      status: score >= 85 ? "Healthy" : score >= 65 ? "Degraded" : "At Risk",
      activeProblems: own.length,
      worstSeverity,
      slaRisk,
    };
  });
}

export interface DomainHealth {
  domainId: DomainId;
  name: string;
  short: string;
  colorVar: string;
  score: number;
  serviceCount: number;
  activeProblems: number;
  servicesAtRisk: number;
  worstSeverity?: Severity;
}

export function domainHealth(shift = 0): DomainHealth[] {
  const health = serviceHealth(shift);
  const active = getProblems(shift).filter((p) => p.status !== "Resolved");

  return domains.map((d) => {
    const mine = health.filter((h) => h.domainId === d.id);
    const problems = active.filter((p) => p.domainId === d.id);
    const worstSeverity = (["P1", "P2", "P3"] as Severity[]).find((s) =>
      problems.some((p) => p.severity === s),
    );
    return {
      domainId: d.id,
      name: d.name,
      short: d.short,
      colorVar: d.colorVar,
      score: Math.round(mine.reduce((a, b) => a + b.score, 0) / (mine.length || 1)),
      serviceCount: mine.length,
      activeProblems: problems.length,
      servicesAtRisk: mine.filter((h) => h.status !== "Healthy").length,
      worstSeverity,
    };
  });
}

export interface JourneyHealth {
  journeyId: string;
  name: string;
  domainId: DomainId;
  description: string;
  score: number;
  activeProblems: Problem[];
  slaRisk: SlaRisk;
  services: ServiceHealth[];
  predictionIds: string[];
  trend: number[];
}

export function journeyHealth(shift = 0): JourneyHealth[] {
  const health = serviceHealth(shift);
  const active = getProblems(shift).filter((p) => p.status !== "Resolved");

  return journeys.map((j) => {
    const svc = health.filter((h) => j.serviceIds.includes(h.serviceId));
    const problems = active.filter((p) => p.journeyId === j.id);
    const score = Math.round(svc.reduce((a, b) => a + b.score, 0) / (svc.length || 1));
    const slaRisk: SlaRisk = problems.some((p) => p.slaRisk === "Breached")
      ? "Breached"
      : problems.some((p) => p.slaRisk === "At Risk")
        ? "At Risk"
        : "Within SLA";

    // Deterministic seven-point health trend ending at the current score.
    const trend = Array.from({ length: 7 }, (_, i) => {
      const drift = (6 - i) * ((100 - score) / 9);
      return Math.round(Math.min(100, score + drift));
    });

    return {
      journeyId: j.id,
      name: j.name,
      domainId: j.domainId,
      description: j.description,
      score,
      activeProblems: problems,
      slaRisk,
      services: svc,
      predictionIds: predictions.filter((p) => j.serviceIds.includes(p.serviceId)).map((p) => p.id),
      trend,
    };
  });
}

/* Control-tower KPIs */

export interface Kpis {
  activeProblems: number;
  bySeverity: Record<Severity, number>;
  eventsCorrelated: number;
  rawSignals24h: number;
  noiseReductionPct: number;
  servicesAtRisk: number;
  totalServices: number;
  slaRisks: number;
  predictedIncidents: number;
  nearestImpactMinutes: number;
  automatedActions: number;
  engineerHoursSaved: number;
}

export function kpis(shift = 0): Kpis {
  const problems = getProblems(shift);
  const active = problems.filter((p) => p.status !== "Resolved");
  const health = serviceHealth(shift);
  const events = buildEvents(shift);

  const bySeverity: Record<Severity, number> = { P1: 0, P2: 0, P3: 0 };
  for (const p of active) bySeverity[p.severity] += 1;

  const automatedActions = playbooks.reduce((a, p) => a + p.timesRun, 0);
  const engineerMinutes = playbooks.reduce((a, p) => a + p.timesRun * p.engineerMinutesSaved, 0);

  return {
    activeProblems: active.length,
    bySeverity,
    eventsCorrelated: events.filter((e) => e.alertId).length,
    rawSignals24h: totalRawSignals24h,
    noiseReductionPct: Math.round((1 - problemVolume24h / totalRawSignals24h) * 1000) / 10,
    servicesAtRisk: health.filter((h) => h.status !== "Healthy").length,
    totalServices: health.length,
    slaRisks: active.filter((p) => p.slaRisk !== "Within SLA").length,
    predictedIncidents: predictions.length,
    nearestImpactMinutes: Math.min(...predictions.map((p) => p.minutesToImpact)),
    automatedActions,
    engineerHoursSaved: Math.round(engineerMinutes / 60),
  };
}

/* Scenario focus
 *
 * Demo Mode uses these to bring one operational story to the front across
 * every page without hiding the rest of the environment.
 */

export interface ScenarioMeta {
  id: ScenarioId;
  name: string;
  headline: string;
  problemId: string;
  predictionId: string;
  playbookId: string;
  deviceId: string;
  serviceId: string;
  siteId: string;
  domainId: DomainId;
}

export const scenarios: ScenarioMeta[] = [
  {
    id: "sdwan",
    name: "SD-WAN Degradation",
    headline: "23 events correlated into one WAN path problem with 3 services at SLA risk",
    problemId: "INC-4417",
    predictionId: "PRD-01",
    playbookId: "PB-01",
    deviceId: "WAN-EDGE-MUM-07",
    serviceId: "SVC-SDWAN",
    siteId: "Mumbai-01",
    domainId: "connectivity",
  },
  {
    id: "cloud",
    name: "Cloud Capacity Prediction",
    headline: "Capacity saturation identified before customer-visible impact",
    problemId: "INC-4420",
    predictionId: "PRD-02",
    playbookId: "PB-02",
    deviceId: "CLD-NODE-PUN-04",
    serviceId: "SVC-MCLOUD",
    siteId: "Pune-02",
    domainId: "cloud",
  },
  {
    id: "security",
    name: "Security Anomaly",
    headline: "Authentication, perimeter and endpoint signals correlated into one case",
    problemId: "INC-4418",
    predictionId: "PRD-03",
    playbookId: "PB-03",
    deviceId: "EP-DEL-2291",
    serviceId: "SVC-EPS",
    siteId: "Delhi-04",
    domainId: "security",
  },
];

export const scenarioById = Object.fromEntries(scenarios.map((s) => [s.id, s])) as Record<
  ScenarioId,
  ScenarioMeta
>;

/* Correlation hierarchy used by the explorer */

export const correlationLevels = [
  { id: "L1", name: "Business / Service", hint: "The enterprise service the customer buys" },
  { id: "L2", name: "Service Journey", hint: "The end-to-end journey that service belongs to" },
  {
    id: "L3",
    name: "Technology Domain",
    hint: "Connectivity, cloud, communication, infrastructure or security",
  },
  { id: "L4", name: "Problem / Incident", hint: "The single correlated problem" },
  { id: "L5", name: "Alerts", hint: "Threshold alerts grouped by signal family" },
  { id: "L6", name: "Events / Telemetry", hint: "Individual metric observations" },
  {
    id: "L7",
    name: "AI Root Cause + Action",
    hint: "Probable cause and the recommended next step",
  },
] as const;

/** Counts for each level of the hierarchy for a given problem. */
export function correlationCounts(problemId: string, shift = 0) {
  const problem = getProblems(shift).find((p) => p.id === problemId);
  if (!problem) return [0, 0, 0, 0, 0, 0, 0];
  const alerts = buildAlerts(shift).filter((a) => a.problemId === problemId);
  return [
    problem.impact.affectedServiceIds.length,
    1,
    1,
    1,
    alerts.length || problem.archivedAlertCount || 0,
    problem.correlatedEventCount,
    1,
  ];
}
