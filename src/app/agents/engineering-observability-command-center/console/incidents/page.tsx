"use client";

import Link from "next/link";
import { obsHref } from "@/lib/engineering-observability/paths";
import { AlertTriangle, ArrowRight, BrainCircuit, Clock3, Filter } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/lib/engineering-observability/page-header";
import { Badge, Card, KpiCard } from "@/lib/engineering-observability/ui-atoms";
import { inc8421Timeline, incidents, mttrTrend } from "@/lib/engineering-observability/enterprise-data";
import type { IncidentStatus, Severity } from "@/lib/engineering-observability/types";
import { cn } from "@/lib/engineering-observability/utils";


const timelineKindStyles: Record<string, string> = {
  deploy: "bg-kpmg-light text-kpmg-blue border-[color:color-mix(in_oklab,var(--kpmg-blue)_30%,transparent)]",
  alert: "bg-critical-soft text-critical border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)]",
  degradation: "bg-warning-soft text-warning border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)]",
  correlation: "bg-ai-soft text-ai border-[color:color-mix(in_oklab,var(--ai)_30%,transparent)]",
  info: "bg-muted text-muted-foreground border-border",
};

function IncidentsPage() {
  const [sevFilter, setSevFilter] = useState<Severity | "All">("All");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "All">("All");
  const [selectedId, setSelectedId] = useState("INC-8421");

  const filtered = incidents.filter(
    (i) => (sevFilter === "All" || i.severity === sevFilter) && (statusFilter === "All" || i.status === statusFilter),
  );
  const selected = incidents.find((i) => i.id === selectedId) ?? incidents[0]!;
  const active = incidents.filter((i) => i.status !== "Resolved");

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Incidents"
        subtitle="AI-correlated incident queue with business impact context"
        actions={
          <span className="flex items-center gap-1.5 rounded-md border border-[color:color-mix(in_oklab,var(--ai)_30%,transparent)] bg-ai-soft px-3 py-2 text-xs font-semibold text-ai">
            <BrainCircuit className="h-3.5 w-3.5" /> 17 signals → 2 incidents
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Active Incidents" value={String(active.length)} delta={2} invertDelta tone="warning" icon={<AlertTriangle className="h-4 w-4 text-warning" />} />
        <KpiCard label="P1 Critical" value="2" delta={1} invertDelta tone="critical" icon={<AlertTriangle className="h-4 w-4 text-critical" />} />
        <KpiCard label="MTTR (7d)" value="42m" delta={-18} icon={<Clock3 className="h-4 w-4 text-primary" />} />
        <KpiCard label="Signals Correlated" value="94%" sub="noise reduction" tone="ai" icon={<BrainCircuit className="h-4 w-4 text-ai" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Queue */}
        <Card
          title="Incident Queue"
          subtitle={`${filtered.length} of ${incidents.length} incidents`}
          className="xl:col-span-2"
          bodyClassName="p-0"
          action={
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sevFilter}
                onChange={(e) => setSevFilter(e.target.value as Severity | "All")}
                className="rounded border border-input bg-background px-1.5 py-1 text-xs text-foreground"
                aria-label="Filter by severity"
              >
                {["All", "P1", "P2", "P3", "P4"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | "All")}
                className="rounded border border-input bg-background px-1.5 py-1 text-xs text-foreground"
                aria-label="Filter by status"
              >
                {["All", "Investigating", "Identified", "Monitoring", "Resolved"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          }
        >
          <ul className="max-h-[560px] divide-y divide-border overflow-y-auto scrollbar-thin">
            {filtered.map((inc) => (
              <li key={inc.id}>
                <button
                  onClick={() => setSelectedId(inc.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:color-mix(in_oklab,var(--muted)_50%,transparent)]",
                    selectedId === inc.id && "border-l-2 border-primary bg-[color:color-mix(in_oklab,var(--kpmg-light)_50%,transparent)]",
                  )}
                >
                  <Badge kind={inc.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{inc.id}</span>
                      <span className="text-[11px] text-muted-foreground">{inc.startedAgo}</span>
                    </div>
                    <div className="truncate text-sm font-medium text-foreground">{inc.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {inc.serviceName} · {inc.journeyName}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-semibold",
                      inc.status === "Resolved" ? "text-healthy" : inc.status === "Investigating" ? "text-critical" : "text-warning",
                    )}
                  >
                    {inc.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Detail */}
        <div className="space-y-6 xl:col-span-3">
          <Card
            title={`${selected.id} — ${selected.title}`}
            subtitle={`${selected.serviceName} · ${selected.journeyName} · detected by ${selected.detectedBy}`}
            action={
              <div className="flex items-center gap-2">
                <Badge kind={selected.severity} />
                <span className="rounded border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                  {selected.status}
                </span>
              </div>
            }
          >
            <p className="text-sm leading-relaxed text-foreground">{selected.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <ImpactStat label="Duration" value={selected.duration} />
              <ImpactStat label="Services impacted" value={String(selected.impact.services)} />
              <ImpactStat label="Transactions" value={selected.impact.transactions} />
              <ImpactStat label="Revenue exposure" value={selected.impact.revenueExposure} highlight />
            </div>

            {selected.id === "INC-8421" && (
              <>
                <div className="mt-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Incident Timeline
                  </div>
                  <ol className="relative space-y-3 border-l border-border pl-5">
                    {inc8421Timeline.map((ev, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{ev.time}</span>
                          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", timelineKindStyles[ev.kind])}>
                            {ev.kind}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[13px] text-foreground">{ev.label}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                <Link
                  href={obsHref("/ai-insights")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-ai px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <BrainCircuit className="h-4 w-4" /> Open AI Investigation <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </Card>

          <Card title="MTTR Trend" subtitle="Mean time to resolve, minutes — last 7 days">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mttrTrend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mttrFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0091DA" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0091DA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <YAxis domain={[30, 70]} tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                    formatter={(v) => [`${v}m`, "MTTR"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#0091DA" strokeWidth={2} fill="url(#mttrFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ImpactStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-md border p-3", highlight ? "border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)] bg-critical-soft" : "border-border bg-background")}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-lg font-bold", highlight ? "text-critical" : "text-foreground")}>{value}</div>
    </div>
  );
}

export default IncidentsPage;
