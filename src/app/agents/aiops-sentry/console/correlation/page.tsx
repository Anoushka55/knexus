"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, Pill, SeverityBadge } from "@/components/aiops/primitives";
import { CorrelationChain, CorrelationFunnel } from "@/components/aiops/correlation-chain";
import { ConfidenceBar, MetricChart, SlaPill } from "@/components/aiops/charts";
import {
  actionById,
  alertsForProblem,
  correlationCounts,
  correlationLevels,
  customerById,
  deviceById,
  domainById,
  eventsForProblem,
  getProblems,
  journeyById,
  metricById,
  metricLabel,
  serviceName,
  siteById,
  type MetricId,
} from "@/lib/aiops";
import { findSeries, latestValue } from "@/lib/aiops/telemetry";
import { useClock, useSession } from "@/lib/aiops/session";

export default function CorrelationPage() {
  const { shift, scenario } = useSession();
  const clock = useClock();

  const correlated = getProblems(shift).filter((p) => p.alertIds.length > 0);
  const preferred =
    correlated.find((p) => p.scenarioId === scenario) ??
    correlated.find((p) => p.id === "INC-4417") ??
    correlated[0];

  // Explicit selection by the user; cleared when the focused scenario changes
  // so Demo Mode brings the matching problem forward.
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [level, setLevel] = useState(3);

  useEffect(() => setPinnedId(null), [scenario]);

  const problem = (pinnedId ? correlated.find((p) => p.id === pinnedId) : undefined) ?? preferred;
  if (!problem) {
    return (
      <div className="p-5">
        <Card title="Correlation Explorer">
          <p className="text-sm text-muted-foreground">
            No correlated problems in the current window.
          </p>
        </Card>
      </div>
    );
  }

  const alerts = alertsForProblem(problem.id, shift);
  const events = eventsForProblem(problem.id, shift);
  const action = actionById[problem.recommendedActionId];
  const domain = domainById[problem.domainId];
  const journey = journeyById[problem.journeyId];
  const device = deviceById[problem.deviceId];

  const levelLabels = [
    serviceName(problem.serviceId),
    journey?.name,
    domain?.short,
    problem.id,
    `${alerts.length} groups`,
    `${problem.correlatedEventCount} events`,
    problem.rootCause,
  ];

  const levelDetail = [
    `${serviceName(problem.serviceId)} is a ${domain?.name} service carrying traffic for ${problem.impact.affectedCustomerIds.join(" and ")}.`,
    `${journey?.name}: ${journey?.description}.`,
    `${domain?.name} — ${domain?.description}.`,
    `${problem.id}: ${problem.title}. Status ${problem.status}, opened by correlation rather than by a human.`,
    `${alerts.length} threshold alerts were raised, one per signal family: ${alerts.map((a) => metricLabel(a.metric)).join(", ")}.`,
    `${problem.correlatedEventCount} individual telemetry observations underlie those alerts, all from ${problem.deviceId} at ${problem.siteId}.`,
    `Probable root cause: ${problem.rootCause} at ${problem.aiConfidence}% confidence. Recommended action: ${action?.title}.`,
  ];

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-navy">Event Correlation Explorer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            How many low-level signals become one understandable problem with a business impact and
            a next action.
          </p>
        </div>
        <div className="inline-flex items-center bg-background border border-border rounded-aiops-sm p-0.5">
          {correlated.map((p) => (
            <button
              key={p.id}
              onClick={() => setPinnedId(p.id)}
              className={`px-2.5 h-7 text-xs rounded-aiops-sm whitespace-nowrap transition-colors ${
                p.id === problem.id
                  ? "bg-navy text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Headline funnel */}
      <Card
        title="Correlation result"
        subtitle={`${problem.id} · ${problem.title}`}
        action={
          <div className="flex items-center gap-2">
            <SeverityBadge s={problem.severity} />
            <SlaPill risk={problem.slaRisk} />
          </div>
        }
      >
        <CorrelationFunnel events={problem.correlatedEventCount} alerts={alerts.length} />
      </Card>

      {/* L1 to L7 */}
      <Card
        title="Correlation hierarchy"
        subtitle="L1 → L7"
        tooltip="Select a level to see what the platform holds at that layer for this problem."
      >
        <CorrelationChain
          active={level}
          counts={correlationCounts(problem.id, shift)}
          labels={levelLabels}
          onSelect={setLevel}
        />
        <div className="mt-3 border border-border rounded-aiops-sm bg-background p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {correlationLevels[level].id} · {correlationLevels[level].name}
          </div>
          <p className="text-xs mt-1 leading-relaxed">{levelDetail[level]}</p>
        </div>
      </Card>

      {/* The convergence picture */}
      <Card
        title="Signal convergence"
        subtitle={`${problem.correlatedEventCount} events across ${alerts.length} signal families resolve to one cause`}
      >
        <ConvergenceDiagram
          problem={problem}
          alerts={alerts.map((a) => ({
            id: a.id,
            title: a.title,
            metric: a.metric,
            count: a.eventCount,
          }))}
          shift={shift}
          rootCause={problem.rootCause}
          actionTitle={action?.title ?? ""}
        />
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* AI reasoning */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <Card
            title="AI summary"
            subtitle="AI-generated insight"
            action={<Pill tone="teal">{problem.aiConfidence}% confidence</Pill>}
          >
            <div className="space-y-3 text-xs leading-relaxed">
              <Section label="What the platform saw">
                {problem.correlatedEventCount} telemetry events on {problem.deviceId} at{" "}
                {problem.siteId}, grouped into {alerts.length} threshold alerts covering{" "}
                {problem.signals.map((s) => metricLabel(s).toLowerCase()).join(", ")}.
              </Section>
              <Section label="Why they are one problem">{problem.rootCauseNarrative}</Section>
              <Section label="Business impact">
                {problem.impact.summary} {problem.slaDetail}
              </Section>
              <Section label="Recommended action">
                {action?.detail} Expected outcome: {action?.expectedOutcome.toLowerCase()}
              </Section>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <ConfidenceBar value={problem.aiConfidence} />
              <p className="mt-2 text-[10px] text-muted-foreground">
                Correlation and reasoning in this environment are produced by deterministic logic
                over the operational dataset, presented the way the platform surfaces them in
                service.
              </p>
            </div>
          </Card>

          <Card title="Impact at a glance">
            <dl className="space-y-2 text-xs">
              <Row label="Business service">{serviceName(problem.serviceId)}</Row>
              <Row label="Service journey">{journey?.name}</Row>
              <Row label="Technology domain">{domain?.name}</Row>
              <Row label="Site">
                {siteById[problem.siteId]?.name} · {siteById[problem.siteId]?.region}
              </Row>
              <Row label="Component">
                <span className="font-mono">{problem.deviceId}</span>
              </Row>
              <Row label="Component type">{device?.type}</Row>
              <Row label="Services impacted">
                {problem.impact.affectedServiceIds.map(serviceName).join(", ")}
              </Row>
              <Row label="Customers">
                {problem.impact.affectedCustomerIds
                  .map((id) => customerById[id]?.name ?? id)
                  .join(", ")}
              </Row>
              <Row label="Users affected">
                <span className="tabular-nums">
                  {problem.impact.usersAffected.toLocaleString()}
                </span>
              </Row>
            </dl>
          </Card>
        </div>

        {/* Signals and raw events */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <Card title="Correlated signals" subtitle="Telemetry behind each alert group">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {problem.signals.map((metric) => {
                const spec = findSeries(problem.deviceId, metric);
                if (!spec) return null;
                return (
                  <MetricChart
                    key={metric}
                    spec={spec}
                    shift={shift}
                    height={76}
                    label={metricLabel(metric)}
                  />
                );
              })}
            </div>
          </Card>

          <Card title="Underlying events" subtitle={`${events.length} observations, newest first`}>
            <ul className="-m-4 divide-y divide-border max-h-[360px] overflow-auto">
              {events
                .slice()
                .sort((a, b) => a.minutesAgo - b.minutesAgo)
                .map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-3 py-1.5 text-[11px]">
                    <span className="font-mono text-muted-foreground w-11 shrink-0">
                      {clock(e.minutesAgo)}
                    </span>
                    <SeverityBadge s={e.severity} />
                    <span className="font-mono text-blue w-28 shrink-0 truncate">{e.alertId}</span>
                    <span className="truncate flex-1">{e.message}</span>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-right font-medium min-w-0">{children}</dd>
    </div>
  );
}

/**
 * Many signals converging into one problem, one cause and one action.
 * Coordinates are computed from the alert list so the picture always matches
 * the data on the page.
 */
function ConvergenceDiagram({
  problem,
  alerts,
  shift,
  rootCause,
  actionTitle,
}: {
  problem: { deviceId: string; id: string; title: string; aiConfidence: number };
  alerts: { id: string; title: string; metric: MetricId; count: number }[];
  shift: number;
  rootCause: string;
  actionTitle: string;
}) {
  const rowH = 46;
  const height = Math.max(alerts.length * rowH + 24, 200);
  const midY = height / 2;

  const colSignal = { x: 4, w: 148 };
  const colAlert = { x: 186, w: 150 };
  const colProblem = { x: 380, w: 148 };
  const colCause = { x: 572, w: 164 };

  const rowY = (i: number) => 12 + i * rowH + rowH / 2;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 740 ${height}`}
        className="w-full min-w-[680px]"
        style={{ height }}
        role="img"
        aria-label={`Signal convergence for ${problem.id}`}
      >
        {/* column headings */}
        {[
          { x: colSignal.x, label: "Telemetry signal" },
          { x: colAlert.x, label: "Alert group" },
          { x: colProblem.x, label: "Correlated problem" },
          { x: colCause.x, label: "Cause and action" },
        ].map((c) => (
          <text
            key={c.label}
            x={c.x}
            y={8}
            className="fill-muted-foreground"
            style={{ fontSize: 8, textTransform: "uppercase" }}
          >
            {c.label}
          </text>
        ))}

        {/* connectors: signal to alert */}
        {alerts.map((a, i) => (
          <path
            key={`s-${a.id}`}
            d={`M${colSignal.x + colSignal.w},${rowY(i)} L${colAlert.x},${rowY(i)}`}
            stroke="var(--border)"
            strokeWidth="1"
            fill="none"
          />
        ))}

        {/* connectors: alert to problem, converging */}
        {alerts.map((a, i) => {
          const y = rowY(i);
          const x1 = colAlert.x + colAlert.w;
          const x2 = colProblem.x;
          const mid = (x1 + x2) / 2;
          return (
            <path
              key={`a-${a.id}`}
              d={`M${x1},${y} C${mid},${y} ${mid},${midY} ${x2},${midY}`}
              stroke="var(--teal)"
              strokeWidth="1.2"
              fill="none"
              opacity="0.7"
            />
          );
        })}

        {/* connector: problem to cause */}
        <path
          d={`M${colProblem.x + colProblem.w},${midY} L${colCause.x},${midY}`}
          stroke="var(--navy)"
          strokeWidth="1.4"
          fill="none"
        />

        {/* signal nodes */}
        {alerts.map((a, i) => {
          const spec = findSeries(problem.deviceId, a.metric);
          const def = metricById[a.metric];
          const value = spec ? latestValue(spec, shift) : 0;
          const state = def
            ? value >= def.critical
              ? "critical"
              : value >= def.warn
                ? "warn"
                : "ok"
            : "ok";
          const color =
            state === "critical"
              ? "var(--crimson)"
              : state === "warn"
                ? "var(--amber)"
                : "var(--teal)";
          return (
            <g key={`sig-${a.id}`}>
              <rect
                x={colSignal.x}
                y={rowY(i) - 15}
                width={colSignal.w}
                height={30}
                rx={2}
                fill="var(--surface)"
                stroke={color}
                strokeWidth="1"
              />
              <rect x={colSignal.x} y={rowY(i) - 15} width={3} height={30} fill={color} />
              <text
                x={colSignal.x + 9}
                y={rowY(i) - 3}
                style={{ fontSize: 9 }}
                className="fill-foreground"
              >
                {def ? def.label : a.metric}
              </text>
              <text
                x={colSignal.x + 9}
                y={rowY(i) + 8}
                style={{ fontSize: 9, fontWeight: 600 }}
                fill={color}
              >
                {def
                  ? `${value.toFixed(def.precision)}${def.unit === "%" ? "%" : ` ${def.unit}`}`
                  : value}
              </text>
            </g>
          );
        })}

        {/* alert nodes */}
        {alerts.map((a, i) => (
          <g key={`alt-${a.id}`}>
            <rect
              x={colAlert.x}
              y={rowY(i) - 15}
              width={colAlert.w}
              height={30}
              rx={2}
              fill="var(--surface)"
              stroke="var(--border)"
            />
            <text
              x={colAlert.x + 8}
              y={rowY(i) - 3}
              style={{ fontSize: 8.5 }}
              className="fill-muted-foreground"
            >
              {a.id}
            </text>
            <text
              x={colAlert.x + 8}
              y={rowY(i) + 8}
              style={{ fontSize: 9 }}
              className="fill-foreground"
            >
              {a.count} events
            </text>
          </g>
        ))}

        {/* problem node */}
        <g>
          <rect
            x={colProblem.x}
            y={midY - 34}
            width={colProblem.w}
            height={68}
            rx={3}
            fill="var(--navy)"
          />
          <text
            x={colProblem.x + 12}
            y={midY - 15}
            style={{ fontSize: 9 }}
            fill="rgba(255,255,255,0.7)"
          >
            {problem.id}
          </text>
          <text
            x={colProblem.x + 12}
            y={midY + 1}
            style={{ fontSize: 10, fontWeight: 600 }}
            fill="#fff"
          >
            1 problem
          </text>
          <text
            x={colProblem.x + 12}
            y={midY + 16}
            style={{ fontSize: 8.5 }}
            fill="rgba(255,255,255,0.75)"
          >
            {problem.aiConfidence}% confidence
          </text>
        </g>

        {/* cause and action */}
        <g>
          <rect
            x={colCause.x}
            y={midY - 40}
            width={colCause.w}
            height={38}
            rx={2}
            fill="var(--surface)"
            stroke="var(--navy)"
          />
          <text
            x={colCause.x + 9}
            y={midY - 26}
            style={{ fontSize: 8 }}
            className="fill-muted-foreground"
          >
            PROBABLE ROOT CAUSE
          </text>
          <text
            x={colCause.x + 9}
            y={midY - 12}
            style={{ fontSize: 9.5, fontWeight: 600 }}
            className="fill-foreground"
          >
            {truncate(rootCause, 26)}
          </text>

          <rect
            x={colCause.x}
            y={midY + 4}
            width={colCause.w}
            height={38}
            rx={2}
            fill="color-mix(in oklab, var(--teal) 10%, transparent)"
            stroke="var(--teal)"
          />
          <text
            x={colCause.x + 9}
            y={midY + 18}
            style={{ fontSize: 8 }}
            className="fill-muted-foreground"
          >
            RECOMMENDED ACTION
          </text>
          <text
            x={colCause.x + 9}
            y={midY + 32}
            style={{ fontSize: 9.5, fontWeight: 600 }}
            className="fill-foreground"
          >
            {truncate(actionTitle, 26)}
          </text>
        </g>
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-teal" /> Correlation collapses{" "}
          <b className="text-foreground">
            {problem.title.length > 0 ? alerts.reduce((a, b) => a + b.count, 0) : 0} events
          </b>{" "}
          into <b className="text-foreground">1 problem</b>
        </span>
        <span className="inline-flex items-center gap-1">
          <ArrowRight className="w-3 h-3" /> {rootCause}
        </span>
        <span className="inline-flex items-center gap-1">
          <ArrowRight className="w-3 h-3" /> {actionTitle}
        </span>
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
