"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Zap, X } from "lucide-react";
import { Card, Pill, SeverityBadge } from "@/components/aiops/primitives";
import { ConfidenceBar, SlaPill, StatusPill } from "@/components/aiops/charts";
import { ProblemDrawer } from "@/components/aiops/problem-drawer";
import {
  actionById,
  alertCountOf,
  domains,
  getProblems,
  services,
  serviceName,
  siteById,
  slaRiskOptions,
  statusOptions,
  severityOrder,
  type Problem,
} from "@/lib/aiops";
import { relative, useSession } from "@/lib/aiops/session";


type Filters = {
  severity: string;
  domain: string;
  service: string;
  status: string;
  sla: string;
};

const emptyFilters: Filters = {
  severity: "all",
  domain: "all",
  service: "all",
  status: "all",
  sla: "all",
};

export default function ProblemsPage() {
  const { shift, inFocus, scenario } = useSession();
  const [selected, setSelected] = useState<Problem | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const all = getProblems(shift);

  const rows = useMemo(
    () =>
      all
        .filter((p) => inFocus(p.scenarioId))
        .filter((p) => filters.severity === "all" || p.severity === filters.severity)
        .filter((p) => filters.domain === "all" || p.domainId === filters.domain)
        .filter((p) => filters.service === "all" || p.serviceId === filters.service)
        .filter((p) => filters.status === "all" || p.status === filters.status)
        .filter((p) => filters.sla === "all" || p.slaRisk === filters.sla)
        .sort(
          (a, b) =>
            severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity) ||
            b.correlatedEventCount - a.correlatedEventCount,
        ),
    [all, filters, inFocus],
  );

  const active = Object.entries(filters).filter(([, v]) => v !== "all");

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-navy">Problems &amp; Incidents</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Correlated problems across every operational domain, each with a probable root cause and
            a recommended next action.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums font-medium text-foreground">{rows.length}</span> of{" "}
          <span className="tabular-nums">{all.length}</span> problems
          {scenario !== "all" && <Pill tone="navy">Scenario focus</Pill>}
        </div>
      </div>

      <Card
        title="Filters"
        action={
          active.length > 0 ? (
            <button
              onClick={() => setFilters(emptyFilters)}
              className="inline-flex items-center gap-1 h-7 px-2 text-xs border border-border rounded-aiops-sm hover:border-navy"
            >
              <X className="w-3 h-3" /> Clear {active.length}
            </button>
          ) : null
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <Select
            label="Severity"
            value={filters.severity}
            onChange={(v) => setFilters({ ...filters, severity: v })}
            options={severityOrder.map((s) => ({ value: s, label: s }))}
          />
          <Select
            label="Domain"
            value={filters.domain}
            onChange={(v) => setFilters({ ...filters, domain: v })}
            options={domains.map((d) => ({ value: d.id, label: d.name }))}
          />
          <Select
            label="Service"
            value={filters.service}
            onChange={(v) => setFilters({ ...filters, service: v })}
            options={services.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
            options={statusOptions.map((s) => ({ value: s, label: s }))}
          />
          <Select
            label="SLA risk"
            value={filters.sla}
            onChange={(v) => setFilters({ ...filters, sla: v })}
            options={slaRiskOptions.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </Card>

      <Card title="Problem register" subtitle="Select a row to open the full operational story">
        <div className="-m-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-background border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                {[
                  "Problem",
                  "Severity",
                  "Service / domain",
                  "Site",
                  "Customer impact",
                  "Correlated",
                  "Probable root cause",
                  "Confidence",
                  "SLA risk",
                  "Status",
                  "Recommended action",
                  "Opened",
                  "",
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const action = actionById[p.recommendedActionId];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`border-b border-border hover:bg-background cursor-pointer border-l-[3px] ${
                      p.severity === "P1"
                        ? "border-l-crimson"
                        : p.severity === "P2"
                          ? "border-l-amber"
                          : "border-l-blue"
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-mono text-xs">{p.id}</div>
                      <div className="text-[11px] text-muted-foreground max-w-[220px] truncate">
                        {p.title}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <SeverityBadge s={p.severity} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium whitespace-nowrap">
                        {serviceName(p.serviceId)}
                      </div>
                      <div className="text-[11px] text-muted-foreground capitalize">
                        {p.domainId}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                      <div>{p.siteId}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {siteById[p.siteId]?.region}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      <div className="whitespace-nowrap">
                        {p.impact.affectedCustomerIds.join(", ")}
                      </div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        {p.impact.usersAffected.toLocaleString()} users
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap tabular-nums">
                      <span className="font-semibold">{p.correlatedEventCount}</span> events
                      <div className="text-[11px] text-muted-foreground">
                        {alertCountOf(p)} alerts
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs max-w-[180px]">{p.rootCause}</td>
                    <td className="px-3 py-2.5 w-[130px]">
                      <ConfidenceBar value={p.aiConfidence} label="" />
                    </td>
                    <td className="px-3 py-2.5">
                      <SlaPill risk={p.slaRisk} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-3 py-2.5 text-xs max-w-[200px]">
                      <div className="flex items-start gap-1.5">
                        {action?.automatable && (
                          <Zap className="w-3 h-3 fill-teal text-teal shrink-0 mt-0.5" />
                        )}
                        <span className="line-clamp-2">{action?.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {relative(p.openedMinutesAgo)}
                    </td>
                    <td className="px-3 py-2.5">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-3 py-10 text-center">
                    <div className="text-sm font-medium">No problems match these filters</div>
                    <button
                      onClick={() => setFilters(emptyFilters)}
                      className="mt-2 text-xs text-blue hover:underline"
                    >
                      Clear filters to see all {all.length} problems
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && <ProblemDrawer problem={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-8 px-2 text-xs bg-surface border rounded-aiops-sm focus:outline-none focus:border-blue ${
          value === "all" ? "border-border" : "border-navy"
        }`}
      >
        <option value="all">All {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
