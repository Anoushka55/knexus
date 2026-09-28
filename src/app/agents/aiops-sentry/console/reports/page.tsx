"use client";

import { Download } from "lucide-react";
import { Card, Gauge } from "@/components/aiops/primitives";
import { BarList, HealthDot, SlaPill } from "@/components/aiops/charts";
import {
  domainHealth,
  getProblems,
  kpis,
  playbooks,
  predictions,
  problemVolume24h,
  serviceHealth,
  serviceName,
  topRootCauses,
  alertCountOf,
  type Problem,
} from "@/lib/aiops";
import { useSession } from "@/lib/aiops/session";

export default function ReportsPage() {
  const { shift } = useSession();
  const k = kpis(shift);
  const domains = domainHealth(shift);
  const services = serviceHealth(shift);
  const causes = topRootCauses(shift);
  const problems = getProblems(shift);
  const active = problems.filter((p) => p.status !== "Resolved");
  const resolved = problems.filter((p) => p.status === "Resolved");

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-navy">Service assurance summary</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generated from the current operational dataset · reporting window: last 24 hours
          </p>
        </div>
        <button
          onClick={() => downloadProblemRegister(problems)}
          className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-border bg-surface rounded-aiops-sm hover:border-navy"
        >
          <Download className="w-4 h-4" /> Export problem register (CSV)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metric
          label="Signals ingested"
          value={k.rawSignals24h.toLocaleString()}
          note="last 24 hours"
        />
        <Metric
          label="Problems raised"
          value={String(problemVolume24h)}
          note={`${k.noiseReductionPct}% noise reduction`}
        />
        <Metric
          label="Active now"
          value={String(k.activeProblems)}
          note={`${k.bySeverity.P1} P1 · ${k.bySeverity.P2} P2`}
        />
        <Metric
          label="Automated actions"
          value={String(k.automatedActions)}
          note={`across ${playbooks.length} playbooks`}
        />
        <Metric
          label="Engineer hours saved"
          value={String(k.engineerHoursSaved)}
          note="versus manual handling"
        />
      </div>

      <Card title="Narrative summary" subtitle="AI-generated insight">
        <p className="text-sm leading-relaxed">
          The platform ingested{" "}
          <strong className="text-navy">
            {k.rawSignals24h.toLocaleString()} operational signals
          </strong>{" "}
          across connectivity, cloud, communication, infrastructure and security in the last 24
          hours, and correlated them into <strong>{problemVolume24h} problems</strong> — a{" "}
          <strong className="text-teal">{k.noiseReductionPct}% reduction</strong> in what reached an
          engineer. {k.activeProblems} remain active, of which {k.slaRisks} carry SLA risk.
        </p>
        <p className="text-sm leading-relaxed mt-3">
          The dominant contributor is{" "}
          <strong className="text-navy">{causes[0]?.name ?? "no single cause"}</strong>
          {causes[0] ? ` (${causes[0].events} correlated events)` : ""}, concentrated on{" "}
          {active[0] ? `${active[0].deviceId} at ${active[0].siteId}` : "no single component"}.{" "}
          {predictions.length} degradation patterns are currently projected ahead of impact, the
          nearest in {k.nearestImpactMinutes} minutes. Automation handled {k.automatedActions}{" "}
          actions in this period, saving roughly {k.engineerHoursSaved} engineer hours against
          manual handling. {resolved.length} problems closed in the window with no SLA breach
          recorded.
        </p>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <Card title="Health by domain" className="col-span-12 lg:col-span-5">
          <ul className="space-y-3">
            {domains.map((d) => (
              <li key={d.domainId} className="flex items-center gap-3">
                <Gauge value={d.score} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d.activeProblems} active · {d.servicesAtRisk} of {d.serviceCount} services at
                    risk
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Root cause contribution"
          subtitle="Active problems"
          className="col-span-12 lg:col-span-4"
        >
          <BarList
            items={causes.map((c) => ({ label: c.name, value: c.events, hint: `${c.count}×` }))}
            suffix=" events"
          />
        </Card>

        <Card title="Service SLA position" className="col-span-12 lg:col-span-3">
          <ul className="space-y-1.5">
            {services
              .slice()
              .sort((a, b) => a.score - b.score)
              .slice(0, 9)
              .map((s) => (
                <li key={s.serviceId} className="flex items-center gap-2 text-[11px]">
                  <HealthDot score={s.score} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="tabular-nums text-muted-foreground">{s.score}</span>
                  <SlaPill risk={s.slaRisk} />
                </li>
              ))}
          </ul>
        </Card>
      </div>

      <Card title="Problems in the reporting window">
        <div className="-m-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-background border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Problem", "Service", "Site", "Root cause", "Confidence", "SLA", "Status"].map(
                  (h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id} className="border-b border-border">
                  <td className="px-3 py-2 font-mono text-xs">{p.id}</td>
                  <td className="px-3 py-2 text-xs">{serviceName(p.serviceId)}</td>
                  <td className="px-3 py-2 text-xs">{p.siteId}</td>
                  <td className="px-3 py-2 text-xs">{p.rootCause}</td>
                  <td className="px-3 py-2 text-xs tabular-nums">{p.aiConfidence}%</td>
                  <td className="px-3 py-2">
                    <SlaPill risk={p.slaRisk} />
                  </td>
                  <td className="px-3 py-2 text-xs">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/**
 * Client-side CSV of the problem register. The full nine-sheet operational
 * extract is produced separately by `npm run export:dataset`.
 */
function downloadProblemRegister(problems: Problem[]) {
  const headers = [
    "incident_id",
    "title",
    "severity",
    "status",
    "service",
    "site",
    "component",
    "correlated_events",
    "correlated_alerts",
    "root_cause",
    "ai_confidence_pct",
    "sla_risk",
    "affected_customers",
    "users_affected",
  ];
  const cell = (v: unknown) => {
    const t = String(v ?? "");
    return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const rows = problems.map((p) =>
    [
      p.id,
      p.title,
      p.severity,
      p.status,
      serviceName(p.serviceId),
      p.siteId,
      p.deviceId,
      p.correlatedEventCount,
      alertCountOf(p),
      p.rootCause,
      p.aiConfidence,
      p.slaRisk,
      p.impact.affectedCustomerIds.join(" | "),
      p.impact.usersAffected,
    ]
      .map(cell)
      .join(","),
  );
  const blob = new Blob([[headers.join(","), ...rows].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "problem-register.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-surface border border-border rounded-aiops-md p-4">
      <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-navy mt-1 tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{note}</div>
    </div>
  );
}
