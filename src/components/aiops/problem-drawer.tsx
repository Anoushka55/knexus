"use client";

import { useEffect, useState } from "react";
import { X, Bot, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, Pill, SeverityBadge } from "./primitives";
import { CorrelationChain, CorrelationFunnel } from "./correlation-chain";
import { ConfidenceBar, MetricChart, SlaPill, StatusPill } from "./charts";
import {
  actionById,
  alertsForProblem,
  correlationCounts,
  customerById,
  deviceById,
  domainById,
  eventsForProblem,
  journeyById,
  metricLabel,
  playbookById,
  serviceName,
  siteById,
  type Problem,
} from "@/lib/aiops";
import { findSeries } from "@/lib/aiops/telemetry";
import { relative, useClock, useSession } from "@/lib/aiops/session";

/**
 * The problem drawer answers the operational story end to end:
 * what happened, what was correlated, why, who it affects, and what to do.
 */
export function ProblemDrawer({ problem, onClose }: { problem: Problem; onClose: () => void }) {
  const { shift } = useSession();
  const clock = useClock();
  const [stage, setStage] = useState<"idle" | "executing" | "verified">("idle");

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  useEffect(() => setStage("idle"), [problem.id]);

  const action = actionById[problem.recommendedActionId];
  const alerts = alertsForProblem(problem.id, shift);
  const events = eventsForProblem(problem.id, shift);
  const device = deviceById[problem.deviceId];
  const journey = journeyById[problem.journeyId];
  const domain = domainById[problem.domainId];
  const playbook = action?.playbookId ? playbookById[action.playbookId] : undefined;
  const alertCount = alerts.length || problem.archivedAlertCount || 0;

  const runSimulation = () => {
    setStage("executing");
    window.setTimeout(() => setStage("verified"), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 aiops-fade-in">
      <div className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <aside className="absolute top-0 right-0 h-full w-full lg:w-[76%] bg-background border-l border-border overflow-y-auto aiops-slide-in-right">
        <header className="sticky top-0 z-10 bg-surface border-b border-border px-5 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SeverityBadge s={problem.severity} />
            <span className="font-mono text-xs text-muted-foreground">{problem.id}</span>
            <h2 className="text-sm font-semibold truncate">{problem.title}</h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusPill status={problem.status} />
            <span className="hidden md:inline text-xs text-muted-foreground">
              Opened {relative(problem.openedMinutesAgo)} · {problem.owner ?? "Unassigned"}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-aiops-sm hover:bg-background flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-5 space-y-4">
          {/* 1. What happened */}
          <Card
            title="What happened"
            subtitle={`${domain?.name} · ${serviceName(problem.serviceId)}`}
          >
            <CorrelationFunnel events={problem.correlatedEventCount} alerts={alertCount} />
            <div className="mt-4">
              <CorrelationChain
                active={3}
                counts={correlationCounts(problem.id, shift)}
                labels={[
                  serviceName(problem.serviceId),
                  journey?.name,
                  domain?.short,
                  problem.id,
                  "grouped signals",
                  "telemetry",
                  problem.rootCause,
                ]}
              />
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 space-y-4">
              {/* 2. What signals were correlated */}
              <Card
                title="Signals AI correlated"
                subtitle={`${problem.correlatedEventCount} events in ${alertCount} groups`}
              >
                <ul className="space-y-2">
                  {alerts.map((a) => {
                    const mine = events.filter((e) => e.alertId === a.id);
                    const spec =
                      findSeries(problem.deviceId, a.metric) ??
                      findSeries(mine[0]?.deviceId ?? "", a.metric);
                    return (
                      <li key={a.id} className="border border-border rounded-aiops-sm">
                        <details>
                          <summary className="flex items-center justify-between gap-3 px-3 h-10 cursor-pointer">
                            <span className="flex items-center gap-2 min-w-0">
                              <SeverityBadge s={a.severity} />
                              <span className="text-xs font-medium truncate">{a.title}</span>
                            </span>
                            <span className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-muted-foreground">
                                {metricLabel(a.metric)}
                              </span>
                              <Pill tone="muted">{a.eventCount} events</Pill>
                            </span>
                          </summary>
                          <div className="border-t border-border p-3 bg-background space-y-3">
                            {spec && (
                              <MetricChart
                                spec={spec}
                                shift={shift}
                                height={72}
                                label={metricLabel(a.metric)}
                              />
                            )}
                            <ul className="space-y-1">
                              {mine.slice(0, 5).map((e) => (
                                <li
                                  key={e.id}
                                  className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground"
                                >
                                  <span className="w-11 shrink-0">{clock(e.minutesAgo)}</span>
                                  <span className="w-24 shrink-0 text-blue truncate">
                                    {e.deviceId}
                                  </span>
                                  <span className="truncate flex-1">{e.message}</span>
                                </li>
                              ))}
                              {mine.length > 5 && (
                                <li className="text-[11px] text-muted-foreground pl-[52px]">
                                  + {mine.length - 5} more in this group
                                </li>
                              )}
                            </ul>
                          </div>
                        </details>
                      </li>
                    );
                  })}
                  {alerts.length === 0 && (
                    <li className="border border-border rounded-aiops-sm p-4 text-xs text-muted-foreground">
                      This problem was correlated from {problem.correlatedEventCount} events across{" "}
                      {alertCount} signal groups. Those signals have aged out of the live telemetry
                      window; the recorded correlation is retained here.
                    </li>
                  )}
                </ul>
              </Card>

              {/* 3. Probable root cause */}
              <Card title="Probable root cause" subtitle="AI-generated insight">
                <div className="text-sm font-semibold text-navy">{problem.rootCause}</div>
                <div className="mt-2">
                  <ConfidenceBar value={problem.aiConfidence} />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-foreground">
                  {problem.rootCauseNarrative}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {problem.signals.map((s) => (
                    <Pill key={s} tone="blue">
                      {metricLabel(s)}
                    </Pill>
                  ))}
                </div>
              </Card>

              {/* Current telemetry */}
              <Card title="Current telemetry" subtitle={device ? device.name : problem.deviceId}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {problem.signals.map((metric) => {
                    const spec = findSeries(problem.deviceId, metric);
                    if (!spec) return null;
                    return (
                      <MetricChart
                        key={metric}
                        spec={spec}
                        shift={shift}
                        height={70}
                        label={metricLabel(metric)}
                      />
                    );
                  })}
                </div>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-5 space-y-4">
              {/* 4 & 5. Affected service, customers and sites */}
              <Card title="Service and customer impact">
                <dl className="space-y-2.5 text-xs">
                  <Row label="Affected service">
                    <span className="font-medium">{serviceName(problem.serviceId)}</span>
                  </Row>
                  <Row label="Component">
                    <span className="font-mono">{problem.deviceId}</span>
                  </Row>
                  <Row label="Site / region">
                    {siteById[problem.siteId]?.name} · {siteById[problem.siteId]?.region}
                  </Row>
                  <Row label="Services impacted">
                    <span className="flex flex-wrap gap-1 justify-end">
                      {problem.impact.affectedServiceIds.map((id) => (
                        <Pill key={id} tone="navy">
                          {serviceName(id)}
                        </Pill>
                      ))}
                    </span>
                  </Row>
                  <Row label="Customers">
                    <span className="flex flex-wrap gap-1 justify-end">
                      {problem.impact.affectedCustomerIds.map((id) => (
                        <Pill key={id} tone="muted">
                          {customerById[id]?.name ?? id}
                        </Pill>
                      ))}
                    </span>
                  </Row>
                  <Row label="Users affected">
                    <span className="font-semibold tabular-nums">
                      {problem.impact.usersAffected.toLocaleString()}
                    </span>
                  </Row>
                </dl>
                <p className="mt-3 pt-3 border-t border-border text-xs leading-relaxed text-muted-foreground">
                  {problem.impact.summary}
                </p>
              </Card>

              {/* 6. SLA impact */}
              <Card title="SLA and business impact" action={<SlaPill risk={problem.slaRisk} />}>
                <p className="text-xs leading-relaxed">{problem.slaDetail}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {problem.impact.affectedCustomerIds.map((id) => {
                    const c = customerById[id];
                    if (!c) return null;
                    return (
                      <div key={id} className="border border-border rounded-aiops-sm p-2">
                        <div className="text-[11px] font-medium">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">{c.contractedSla}</div>
                        <div className="text-[10px] text-muted-foreground">{c.segment}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* 7 & 8. Recommendation and automation */}
              {action && (
                <Card
                  title="Recommended action"
                  action={
                    action.automatable ? (
                      <Pill tone="teal">Automatable</Pill>
                    ) : (
                      <Pill tone="muted">Manual</Pill>
                    )
                  }
                >
                  <div className="text-[13px] font-semibold text-navy">{action.title}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {action.detail}
                  </p>
                  <div className="mt-3">
                    <ConfidenceBar value={action.confidence} label="Action confidence" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <Field label="Approval">{action.approval}</Field>
                    <Field label="Playbook">{playbook ? playbook.name : "None"}</Field>
                  </div>
                  <div className="mt-3 border border-border rounded-aiops-sm p-2.5 bg-background">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Expected outcome
                    </div>
                    <div className="text-xs mt-0.5">{action.expectedOutcome}</div>
                  </div>

                  {action.automatable && (
                    <div className="mt-3">
                      {stage === "idle" && (
                        <button
                          onClick={runSimulation}
                          className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 text-sm bg-teal text-white rounded-aiops-sm hover:opacity-90"
                        >
                          <Zap className="w-4 h-4" /> Simulate recommended action
                        </button>
                      )}
                      {stage === "executing" && (
                        <div className="border border-teal/40 bg-teal/5 rounded-aiops-sm p-3 text-xs">
                          <div className="flex items-center gap-2 font-medium text-teal">
                            <span className="w-2 h-2 rounded-full bg-teal aiops-pulse-dot" />
                            Simulation in progress
                          </div>
                          <div className="mt-1 text-muted-foreground">{playbook?.execution}</div>
                        </div>
                      )}
                      {stage === "verified" && (
                        <div className="border border-success/40 bg-success/5 rounded-aiops-sm p-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-success">
                            <ShieldCheck className="w-3.5 h-3.5" /> Simulation verified
                          </div>
                          <div className="mt-1.5 text-xs">{playbook?.verification}</div>
                          <div className="mt-2 text-[10px] text-muted-foreground">
                            Simulated outcome. No infrastructure was changed.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Timeline */}
          <Card title="Timeline">
            <Timeline
              problem={problem}
              firstEventMinutesAgo={
                events.length
                  ? Math.max(...events.map((e) => e.minutesAgo))
                  : problem.openedMinutesAgo
              }
              clock={clock}
              alertCount={alertCount}
            />
          </Card>

          <div className="sticky bottom-0 -mx-5 -mb-5 px-5 py-3 bg-surface border-t border-border flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/agents/aiops-sentry/console/agent"
              className="inline-flex items-center gap-2 h-9 px-3 text-sm bg-navy text-white border border-navy rounded-aiops-sm hover:bg-blue"
            >
              <Bot className="w-4 h-4" /> Ask the operations copilot
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/agents/aiops-sentry/console/correlation"
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-surface border border-border rounded-aiops-sm hover:border-navy"
              >
                Open in Correlation Explorer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/agents/aiops-sentry/console/playbooks"
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-surface border border-border rounded-aiops-sm hover:border-navy"
              >
                View playbook
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-right min-w-0">{children}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-aiops-sm p-2">
      <div className="text-muted-foreground text-[10px] uppercase tracking-wide">{label}</div>
      <div className="font-medium mt-0.5">{children}</div>
    </div>
  );
}

function Timeline({
  problem,
  firstEventMinutesAgo,
  clock,
  alertCount,
}: {
  problem: Problem;
  firstEventMinutesAgo: number;
  clock: (m: number) => string;
  alertCount: number;
}) {
  const entries = [
    {
      m: firstEventMinutesAgo,
      label: `First signal observed on ${problem.deviceId}`,
      color: "var(--blue)",
    },
    {
      m: Math.round(firstEventMinutesAgo * 0.75),
      label: `Threshold alerts raised across ${alertCount} signal groups`,
      color: "var(--amber)",
    },
    {
      m: problem.openedMinutesAgo,
      label: `Correlation grouped ${problem.correlatedEventCount} events into ${problem.id}`,
      color: "var(--crimson)",
    },
    {
      m: Math.round(problem.openedMinutesAgo * 0.6),
      label: `Probable root cause identified: ${problem.rootCause} (${problem.aiConfidence}% confidence)`,
      color: "var(--navy)",
    },
    {
      m: Math.round(problem.openedMinutesAgo * 0.35),
      label: `Service impact assessed: ${problem.impact.affectedServiceIds.length} services, ${problem.slaRisk}`,
      color: "var(--navy)",
    },
    {
      m: Math.round(problem.openedMinutesAgo * 0.15),
      label: `Action recommended: ${actionById[problem.recommendedActionId]?.title ?? "under review"}`,
      color: "var(--teal)",
    },
    { m: 0, label: `Current status: ${problem.status}`, color: "var(--teal)" },
  ];

  return (
    <div className="relative pl-3">
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
      <ul className="space-y-3">
        {entries.map((e, i) => (
          <li key={i} className="relative">
            <span
              className="absolute -left-[9px] top-1 w-2.5 h-2.5 rounded-full border-2 border-surface"
              style={{ background: e.color }}
            />
            <div className="text-[11px] text-muted-foreground font-mono">
              {e.m === 0 ? "now" : clock(e.m)}
            </div>
            <div className="text-xs">{e.label}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
