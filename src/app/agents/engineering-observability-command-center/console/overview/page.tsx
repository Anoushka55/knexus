"use client";

import Link from "next/link";
import { obsHref } from "@/lib/engineering-observability/paths";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Gauge,
  HeartPulse,
  Route as RouteIcon,
  Timer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/lib/engineering-observability/page-header";
import { Badge, Card, Delta, KpiCard, StatusPill } from "@/lib/engineering-observability/ui-atoms";
import {
  aiPriorities,
  healthTrend,
  incidents,
  journeys,
  mttrTrend,
  recentActivity,
  sloCompliance,
  valueChain,
} from "@/lib/engineering-observability/enterprise-data";


const chartBlue = "#00338D";
const chartSky = "#0091DA";

function OverviewPage() {
  const criticalIncidents = incidents.filter((i) => i.severity === "P1" && i.status !== "Resolved");

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Engineering Overview"
        subtitle="Enterprise-wide engineering health, incidents and AI-prioritised actions · Last updated 2 min ago"
        actions={
          <Link
            href={obsHref("/knowledge-graph")}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Open Knowledge Graph <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Engineering Health"
          value="87%"
          delta={3}
          sub="vs last week"
          icon={<HeartPulse className="h-4 w-4 text-healthy" />}
          tone="healthy"
        />
        <KpiCard
          label="Critical Incidents"
          value={String(criticalIncidents.length)}
          delta={1}
          invertDelta
          sub="P1 active"
          icon={<AlertTriangle className="h-4 w-4 text-critical" />}
          tone="critical"
        />
        <KpiCard
          label="SLO Compliance"
          value="96.8%"
          delta={1.2}
          sub="32 services"
          icon={<Gauge className="h-4 w-4 text-primary" />}
        />
        <KpiCard
          label="MTTR"
          value="42m"
          delta={-18}
          sub="target 20m"
          icon={<Timer className="h-4 w-4 text-warning" />}
          tone="warning"
        />
        <KpiCard
          label="Active Customer Journeys"
          value="4"
          sub="3 impacted"
          icon={<RouteIcon className="h-4 w-4 text-ai" />}
          tone="ai"
        />
      </div>

      {/* Value chain */}
      <Card
        title="Signal to Business Value Chain"
        subtitle="How raw telemetry propagates into measurable business impact — the core OCC narrative"
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {valueChain.map((step, i) => (
            <div key={step.label} className="relative">
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {step.label}
                </div>
                <div className="mt-1 text-lg font-bold text-foreground">{step.value}</div>
                <div className="text-[11px] text-muted-foreground">{step.sub}</div>
                <div className="mt-1 text-[11px] font-semibold text-critical">{step.delta}</div>
              </div>
              {i < valueChain.length - 1 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-primary xl:block" />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Health trend */}
        <Card title="Engineering Health Trend" subtitle="Composite score, last 7 days" className="xl:col-span-1">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthTrend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartBlue} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={chartBlue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                  formatter={(v) => [`${v}%`, "Health"]}
                />
                <Area type="monotone" dataKey="value" stroke={chartBlue} strokeWidth={2} fill="url(#healthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* MTTR trend */}
        <Card title="MTTR Trend" subtitle="Mean time to resolve (minutes)" className="xl:col-span-1">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mttrTrend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <YAxis domain={[30, 70]} tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                  formatter={(v) => [`${v}m`, "MTTR"]}
                />
                <Line type="monotone" dataKey="value" stroke={chartSky} strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* SLO compliance */}
        <Card title="SLO Compliance" subtitle="Top services by traffic" className="xl:col-span-1">
          <ul className="space-y-2.5">
            {sloCompliance.map((row) => (
              <li key={row.service} className="flex items-center gap-3 text-sm">
                <span className="w-32 truncate font-medium text-foreground">{row.service}</span>
                <span className="w-14 text-right font-semibold tabular-nums text-foreground">
                  {row.compliance}%
                </span>
                <Delta value={row.delta} />
                <span
                  className={
                    row.status === "Good"
                      ? "ml-auto text-[11px] font-semibold text-healthy"
                      : "ml-auto text-[11px] font-semibold text-warning"
                  }
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Critical incidents */}
        <Card
          title="Critical & Active Incidents"
          subtitle={`${incidents.filter((i) => i.status !== "Resolved").length} active`}
          action={
            <Link href={obsHref("/incidents")} className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          }
          className="xl:col-span-1"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {incidents.slice(0, 5).map((inc) => (
              <li key={inc.id}>
                <Link
                  href={obsHref("/incidents")}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[color:color-mix(in_oklab,var(--muted)_50%,transparent)]"
                >
                  <Badge kind={inc.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{inc.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {inc.id} · {inc.serviceName} · {inc.startedAgo}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">{inc.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Journey impact */}
        <Card
          title="Customer Journey Impact"
          subtitle="Revenue-exposed journeys right now"
          action={
            <Link href={obsHref("/service-map")} className="text-xs font-semibold text-primary hover:underline">
              Service map
            </Link>
          }
          className="xl:col-span-1"
        >
          <ul className="space-y-3">
            {journeys.map((j) => (
              <li key={j.id} className="flex items-center gap-3">
                <StatusPill status={j.status} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{j.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {j.transactionsPerHour} txn/hr · {j.revenuePerHour}/hr
                  </div>
                </div>
                <span className="text-sm font-bold text-critical">{j.exposure}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* AI priorities + recent activity */}
        <div className="space-y-6 xl:col-span-1">
          <Card
            title="AI-Prioritised Actions"
            subtitle="Ranked by business impact"
            action={<BrainCircuit className="h-4 w-4 text-ai" />}
          >
            <ol className="space-y-2.5">
              {aiPriorities.map((p) => (
                <li key={p.rank}>
                  <Link href={obsHref(p.to)} className="group flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-kpmg-light text-[11px] font-bold text-kpmg-blue">
                      {p.rank}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-foreground group-hover:text-primary">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{p.detail}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Recent Activity" subtitle="Correlated engineering events" action={<Activity className="h-4 w-4 text-muted-foreground" />}>
            <ul className="space-y-2.5">
              {recentActivity.map((a, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[13px]">
                  <span className="w-16 shrink-0 text-[11px] tabular-nums text-muted-foreground">{a.time}</span>
                  <Badge kind={a.badge} />
                  <span className="min-w-0 flex-1 truncate text-foreground">{a.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
