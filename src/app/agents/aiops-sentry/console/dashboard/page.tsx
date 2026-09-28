"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, ChevronRight, Sparkles } from "lucide-react";
import { Card, Pill, SeverityBadge, Gauge, Tooltip } from "@/components/aiops/primitives";
import { BarList, ConfidenceBar, HealthDot, SlaPill, StatusPill } from "@/components/aiops/charts";
import { MaturityLadder, NarrativeStrip } from "@/components/aiops/maturity";
import { ProblemDrawer } from "@/components/aiops/problem-drawer";
import {
  actionById,
  alertVolume24h,
  buildEvents,
  domainHealth,
  getProblems,
  kpis,
  metricLabel,
  playbooks,
  predictions,
  problemVolume24h,
  serviceHealth,
  serviceName,
  topRootCauses,
  type Problem,
} from "@/lib/aiops";
import { relative, useClock, useSession } from "@/lib/aiops/session";

export default function Dashboard() {
  const { shift, scenario, inFocus } = useSession();
  const clock = useClock();
  const [selected, setSelected] = useState<Problem | null>(null);

  const k = kpis(shift);
  const domains = domainHealth(shift);
  const services = serviceHealth(shift);
  const allProblems = getProblems(shift).filter((p) => p.status !== "Resolved");
  const problems = allProblems.filter((p) => inFocus(p.scenarioId));
  const causes = topRootCauses(shift);
  const events = buildEvents(shift).filter((e) => inFocus(e.scenarioId));
  const preds = predictions.filter((p) => inFocus(p.scenarioId));

  return (
    <div className="p-5 space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-navy">AI Operations Control Tower</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-powered service assurance and autonomous operations across connectivity, cloud,
            communication, infrastructure and security.
          </p>
        </div>
        {scenario !== "all" && (
          <Pill tone="navy">
            Scenario in focus:{" "}
            {scenario === "sdwan"
              ? "SD-WAN Degradation"
              : scenario === "cloud"
                ? "Cloud Capacity Prediction"
                : "Security Anomaly"}
          </Pill>
        )}
      </div>

      {/* Observe → Act narrative, against live numbers */}
      <div className="bg-surface border border-border rounded-aiops-md overflow-hidden">
        <NarrativeStrip
          stats={{
            observe: `${k.rawSignals24h.toLocaleString()} signals`,
            correlate: `${k.eventsCorrelated} events → ${k.activeProblems} problems`,
            understand: `${causes.length} root causes`,
            predict: `${k.predictedIncidents} predicted`,
            recommend: `${k.activeProblems} actions ready`,
            act: `${k.automatedActions} actions run`,
          }}
        />
      </div>

      {/* KPI layer */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <Kpi
          title="Active problems"
          tooltip="Correlated problems currently open across all domains."
        >
          <div className="text-2xl font-semibold text-navy tabular-nums">{k.activeProblems}</div>
          <div className="flex gap-1 mt-2">
            <Pill tone="crimson">P1 · {k.bySeverity.P1}</Pill>
            <Pill tone="amber">P2 · {k.bySeverity.P2}</Pill>
            <Pill tone="blue">P3 · {k.bySeverity.P3}</Pill>
          </div>
        </Kpi>

        <Kpi
          title="Events correlated"
          tooltip="Telemetry events grouped into alerts and problems in the current window."
        >
          <div className="text-2xl font-semibold text-navy tabular-nums">{k.eventsCorrelated}</div>
          <div className="text-xs text-muted-foreground mt-2">in the last 3 hours</div>
        </Kpi>

        <Kpi
          title="Alert noise reduction"
          tooltip={`${k.rawSignals24h.toLocaleString()} raw signals grouped into ${alertVolume24h} alerts and correlated into ${problemVolume24h} problems over 24 hours.`}
        >
          <div className="text-2xl font-semibold text-navy tabular-nums">
            {k.noiseReductionPct}
            <span className="text-base font-normal text-muted-foreground">%</span>
          </div>
          <div className="mt-2 h-1.5 bg-background rounded-aiops-sm overflow-hidden border border-border">
            <div className="h-full bg-teal" style={{ width: `${k.noiseReductionPct}%` }} />
          </div>
        </Kpi>

        <Kpi
          title="Services at risk"
          tooltip="Services whose health has dropped out of the healthy band."
        >
          <div className="flex items-baseline gap-1">
            <div className="text-2xl font-semibold text-amber tabular-nums">{k.servicesAtRisk}</div>
            <span className="text-sm text-muted-foreground">/ {k.totalServices}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">across 5 domains</div>
        </Kpi>

        <Kpi title="SLA risks" tooltip="Active problems carrying SLA risk or already in breach.">
          <div className="text-2xl font-semibold text-crimson tabular-nums">{k.slaRisks}</div>
          <div className="text-xs text-muted-foreground mt-2">approaching threshold</div>
        </Kpi>

        <Kpi
          title="Predicted incidents"
          tooltip="Degradation patterns projected forward to an expected time of impact."
        >
          <div className="text-2xl font-semibold text-navy tabular-nums">
            {k.predictedIncidents}
          </div>
          <div className="mt-2">
            <Pill tone="amber">Nearest in {k.nearestImpactMinutes} min</Pill>
          </div>
        </Kpi>

        <Kpi
          title="Automated actions"
          tooltip="Playbook executions completed in this environment. All execution is simulated."
        >
          <div className="text-2xl font-semibold text-navy tabular-nums">{k.automatedActions}</div>
          <div className="text-xs text-muted-foreground mt-2">
            across {playbooks.length} playbooks
          </div>
        </Kpi>

        <Kpi
          title="Engineer hours saved"
          tooltip="Time saved by automated diagnosis and remediation versus manual handling."
        >
          <div className="text-2xl font-semibold text-teal tabular-nums">
            {k.engineerHoursSaved}
          </div>
          <div className="text-xs text-muted-foreground mt-2">this period</div>
        </Kpi>
      </div>

      {/* AI above the operational domains */}
      <Card
        title="AI operations layer"
        subtitle="One reasoning layer above five operational domains"
        tooltip="Signals from every domain are observed, correlated and reasoned over in one place rather than in five separate tools."
      >
        <div className="rounded-aiops-sm bg-navy text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal" />
            <span className="text-[13px] font-semibold">
              AI correlation, reasoning and recommendation
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/70">
            {["Observe", "Correlate", "Understand", "Predict", "Recommend", "Act"].map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded-aiops-sm bg-white/10">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-around px-6">
          {domains.map((d) => (
            <span key={d.domainId} className="w-px h-4 bg-border" />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {domains.map((d) => (
            <div key={d.domainId} className="border border-border rounded-aiops-sm p-3 bg-surface">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold truncate">{d.short}</span>
                <span
                  className="w-2.5 h-2.5 rounded-aiops-sm shrink-0"
                  style={{ background: d.colorVar }}
                />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Gauge value={d.score} size={48} />
                <div className="text-[11px] text-muted-foreground leading-tight">
                  <div>
                    <span className="text-foreground font-medium tabular-nums">
                      {d.activeProblems}
                    </span>{" "}
                    active
                  </div>
                  <div>
                    <span className="text-foreground font-medium tabular-nums">
                      {d.servicesAtRisk}
                    </span>{" "}
                    of {d.serviceCount} at risk
                  </div>
                </div>
              </div>
              {d.worstSeverity && (
                <div className="mt-2">
                  <SeverityBadge s={d.worstSeverity} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Main working area */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-7 space-y-4">
          <Card
            title="Active problems"
            subtitle={`${problems.length} correlated`}
            action={
              <Link
                href="/agents/aiops-sentry/console/problems"
                className="inline-flex items-center gap-1 h-7 px-2 text-xs border border-border rounded-aiops-sm hover:border-navy"
              >
                Open workspace <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <ul className="-m-4 divide-y divide-border">
              {problems.map((p, i) => (
                <li
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`p-3 hover:bg-background cursor-pointer aiops-slide-in-top border-l-[3px] ${
                    p.severity === "P1"
                      ? "border-crimson"
                      : p.severity === "P2"
                        ? "border-amber"
                        : "border-blue"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <SeverityBadge s={p.severity} />
                        <span className="text-xs text-muted-foreground font-mono">{p.id}</span>
                        <StatusPill status={p.status} />
                        <SlaPill risk={p.slaRisk} />
                        {actionById[p.recommendedActionId]?.automatable && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-teal font-medium">
                            <Zap className="w-3 h-3 fill-teal" /> Automatable
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] font-medium text-foreground">{p.title}</div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                        <span>
                          Root cause: <span className="text-foreground">{p.rootCause}</span>
                        </span>
                        <span>· {serviceName(p.serviceId)}</span>
                        <span>· {p.siteId}</span>
                        <span>· {p.correlatedEventCount} events correlated</span>
                        <span>· {p.aiConfidence}% confidence</span>
                        <span>· opened {relative(p.openedMinutesAgo)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Recent operational events"
            subtitle="Live stream"
            action={
              <span className="text-[11px] text-muted-foreground">{events.length} in window</span>
            }
          >
            <ul className="-m-4 divide-y divide-border max-h-[300px] overflow-auto">
              {events.slice(0, 24).map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-3 py-1.5 text-[11px]">
                  <span className="font-mono text-muted-foreground w-11 shrink-0">
                    {clock(e.minutesAgo)}
                  </span>
                  <SeverityBadge s={e.severity} />
                  <span className="font-mono text-blue w-32 shrink-0 truncate">{e.deviceId}</span>
                  <span className="truncate flex-1">{e.message}</span>
                  <span className="hidden lg:inline text-muted-foreground shrink-0">
                    {e.siteId}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-5 space-y-4">
          <Card title="Top AI-identified root causes" subtitle="Active problems">
            <BarList
              items={causes.map((c) => ({
                label: c.name,
                value: c.events,
                hint: `${c.count} problem${c.count > 1 ? "s" : ""}`,
              }))}
              suffix=" events"
            />
          </Card>

          <Card title="SLA risk by service" subtitle="Services outside the healthy band">
            <ul className="space-y-2">
              {services
                .filter((s) => s.status !== "Healthy")
                .sort((a, b) => a.score - b.score)
                .map((s) => (
                  <li key={s.serviceId} className="flex items-center gap-2 text-xs">
                    <HealthDot score={s.score} />
                    <span className="font-medium flex-1 truncate">{s.name}</span>
                    <span className="tabular-nums text-muted-foreground w-8 text-right">
                      {s.score}
                    </span>
                    <SlaPill risk={s.slaRisk} />
                  </li>
                ))}
              {services.every((s) => s.status === "Healthy") && (
                <li className="text-xs text-muted-foreground">
                  All services inside the healthy band.
                </li>
              )}
            </ul>
          </Card>

          <Card
            title="Predicted incidents"
            subtitle="Before impact"
            action={
              <Link
                href="/agents/aiops-sentry/console/predictive"
                className="inline-flex items-center gap-1 h-7 px-2 text-xs border border-border rounded-aiops-sm hover:border-navy"
              >
                Open <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <ul className="space-y-2">
              {preds.map((p) => (
                <li key={p.id} className="border border-border rounded-aiops-sm p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium font-mono truncate">{p.deviceId}</span>
                    <Pill tone="amber">in {p.minutesToImpact} min</Pill>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {serviceName(p.serviceId)} · {p.headline}
                  </div>
                  <div className="mt-2">
                    <ConfidenceBar value={p.probability} label="Probability" />
                  </div>
                  <div className="text-[11px] mt-1.5">
                    <span className="text-muted-foreground">Signals: </span>
                    {p.contributingSignals.map((s) => metricLabel(s.metric)).join(", ")}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Recommendation and automation status"
            action={
              <Link
                href="/agents/aiops-sentry/console/playbooks"
                className="inline-flex items-center gap-1 h-7 px-2 text-xs border border-border rounded-aiops-sm hover:border-navy"
              >
                Playbooks <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <ul className="space-y-2">
              {playbooks
                .filter((p) => inFocus(p.scenarioId))
                .map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-xs">
                    <span className="font-medium flex-1 truncate">{p.name}</span>
                    <span className="text-muted-foreground tabular-nums hidden sm:inline">
                      {p.successRate}%
                    </span>
                    <StatusPill status={p.status} />
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* AI maturity */}
      <Card
        title="AI operations maturity"
        subtitle="Where this environment sits"
        tooltip="The capability ladder from monitoring through AIOps and predictive AI to agentic operations."
      >
        <MaturityLadder />
      </Card>

      {selected && <ProblemDrawer problem={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Kpi({
  title,
  children,
  tooltip,
}: {
  title: string;
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-aiops-md p-3">
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">
          {title}
        </h4>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      {children}
    </div>
  );
}
