"use client";

import { Activity, AlertTriangle, Globe2, Rocket, ServerCog } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/lib/engineering-observability/page-header";
import { Badge, Card, KpiCard, ProgressBar, StatusPill } from "@/lib/engineering-observability/ui-atoms";
import {
  deployments,
  errorRateSeries,
  latencySeries,
  liveSignals,
  services,
  throughputSeries,
} from "@/lib/engineering-observability/enterprise-data";
import { cn } from "@/lib/engineering-observability/utils";


const regions = [
  { name: "UK & Ireland", code: "uk", status: "degraded" as const, latency: "412ms", errors: "2.1%", load: 78 },
  { name: "Europe", code: "eu", status: "degraded" as const, latency: "388ms", errors: "1.4%", load: 64 },
  { name: "North America", code: "us", status: "critical" as const, latency: "512ms", errors: "3.8%", load: 86 },
  { name: "APAC", code: "apac", status: "healthy" as const, latency: "226ms", errors: "0.4%", load: 41 },
];

const regionBorder: Record<string, string> = {
  healthy: "border-[color:color-mix(in_oklab,var(--healthy)_40%,transparent)]",
  degraded: "border-[color:color-mix(in_oklab,var(--warning)_40%,transparent)]",
  critical: "border-[color:color-mix(in_oklab,var(--critical)_50%,transparent)]",
};

function LiveOpsPage() {
  const degraded = services.filter((s) => s.health === "degraded" || s.health === "critical");

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Live Operations"
        subtitle="Real-time signal stream, deployments and regional health · Streaming"
        actions={
          <span className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground">
            <span className="h-2 w-2 rounded-full bg-healthy animate-pulse-dot" /> Live feed
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Active Signals" value="1,248" delta={12} invertDelta icon={<Activity className="h-4 w-4 text-primary" />} />
        <KpiCard label="P1 Incidents" value="2" delta={1} invertDelta icon={<AlertTriangle className="h-4 w-4 text-critical" />} tone="critical" />
        <KpiCard label="Services Degraded" value={String(degraded.length)} delta={2} invertDelta icon={<ServerCog className="h-4 w-4 text-warning" />} tone="warning" />
        <KpiCard label="Deployments in Progress" value="2" icon={<Rocket className="h-4 w-4 text-primary" />} />
        <KpiCard label="Global Availability" value="99.2%" delta={-0.4} icon={<Globe2 className="h-4 w-4 text-healthy" />} />
      </div>

      {/* Region health */}
      <Card title="Regional Health" subtitle="Availability and latency by operating region">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {regions.map((r) => (
            <div key={r.code} className={cn("rounded-lg border bg-background p-3.5", regionBorder[r.status])}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{r.name}</span>
                <StatusPill status={r.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold tabular-nums text-foreground">{r.latency}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">p95</div>
                </div>
                <div>
                  <div className="text-sm font-bold tabular-nums text-foreground">{r.errors}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Errors</div>
                </div>
                <div>
                  <div className="text-sm font-bold tabular-nums text-foreground">{r.load}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Load</div>
                </div>
              </div>
              <ProgressBar
                value={r.load}
                tone={r.status === "critical" ? "critical" : r.status === "degraded" ? "warning" : "healthy"}
                className="mt-3"
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Signal stream */}
        <Card
          title="Live Signal Stream"
          subtitle="Correlated telemetry · newest first"
          className="xl:col-span-2"
          bodyClassName="p-0"
        >
          <ul className="max-h-[420px] divide-y divide-border overflow-y-auto scrollbar-thin">
            {liveSignals.map((s) => (
              <li key={s.id} className="flex items-start gap-3 px-4 py-2.5">
                <span className="mt-0.5 w-20 shrink-0 text-[11px] tabular-nums text-muted-foreground">{s.time}</span>
                <Badge kind={s.severity} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-foreground">{s.message}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.service} · {s.region}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Deployments */}
        <Card title="Active Deployments" subtitle="Change events in flight" className="xl:col-span-3">
          <ul className="space-y-4">
            {deployments.map((d) => (
              <li key={d.id} className="rounded-lg border border-border bg-background p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {d.name} <span className="text-muted-foreground">{d.version}</span>
                  </span>
                  <Badge kind="Deploy" label={d.environment} />
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      d.blastRadius === "High"
                        ? "border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)] bg-critical-soft text-critical"
                        : d.blastRadius === "Medium"
                          ? "border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)] bg-warning-soft text-warning"
                          : "border-[color:color-mix(in_oklab,var(--healthy)_30%,transparent)] bg-healthy-soft text-healthy",
                    )}
                  >
                    Blast radius: {d.blastRadius}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{d.time}</span>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <ProgressBar
                    value={d.progress}
                    tone={d.status === "complete" ? "healthy" : "primary"}
                    className="flex-1"
                  />
                  <span className="text-xs font-semibold tabular-nums text-foreground">{d.progress}%</span>
                  <span className="text-[11px] text-muted-foreground">
                    {d.status === "complete" ? "Complete" : "Rolling out"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-md border border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)] bg-warning-soft px-3 py-2 text-xs text-warning">
            <strong>Correlation:</strong> payment-service v4.8.2 (10:14 AM) preceded INC-8421 by 4
            minutes — flagged by AI change-risk analysis.
          </p>
        </Card>
      </div>

      {/* Telemetry charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TelemetryChart title="Latency p95 (ms)" data={latencySeries} unit="ms" />
        <TelemetryChart title="Error Rate (%)" data={errorRateSeries} unit="%" />
        <TelemetryChart title="Throughput (K req/min)" data={throughputSeries} unit="K" />
      </div>
    </div>
  );
}

function TelemetryChart({
  title,
  data,
  unit,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  unit: string;
}) {
  return (
    <Card title={title} subtitle="Checkout · Payment · Order">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
              formatter={(v, name) => [`${v}${unit}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="checkout" name="Checkout" stroke="#00338D" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="payment" name="Payment" stroke="#DC2626" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="order" name="Order" stroke="#16A34A" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default LiveOpsPage;
