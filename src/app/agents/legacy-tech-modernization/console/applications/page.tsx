"use client";

import { Boxes, Filter, HeartPulse, Plus, ShieldAlert, TrendingUp } from "lucide-react";
import { useState } from "react";

import { BarList, DonutStat } from "@/lib/legacy-modernization/charts";
import {
  InsightBar,
  KpiCard,
  PageHeader,
  Panel,
  PanelLink,
  ProgressBar,
  ScorePill,
  StatusPill,
  type Tone,
} from "@/lib/legacy-modernization/primitives";
import { cn } from "@/lib/utils";

const health = [
  { name: "Healthy", value: 122, color: "var(--chart-2)" },
  { name: "At Risk", value: 22, color: "var(--chart-3)" },
  { name: "Critical", value: 12, color: "var(--chart-4)" },
];

type App = {
  name: string;
  domain: string;
  owner: string;
  stack: string;
  criticality: "Tier 1" | "Tier 2" | "Tier 3";
  health: number;
  status: "Modernized" | "In Progress" | "Planned" | "Not Started";
  debt: string;
  progress: number;
};

const apps: App[] = [
  { name: "Billing Platform", domain: "Finance & Billing", owner: "Finance Engineering", stack: "Java 8 · Oracle 11g", criticality: "Tier 1", health: 42, status: "In Progress", debt: "$6.2M", progress: 62 },
  { name: "CRM Platform", domain: "Customer & CRM", owner: "Customer Engineering", stack: ".NET 4.6 · SQL Server", criticality: "Tier 1", health: 64, status: "In Progress", debt: "$3.1M", progress: 38 },
  { name: "Claims Processing", domain: "Insurance Ops", owner: "Insurance Ops IT", stack: "COBOL · DB2", criticality: "Tier 1", health: 31, status: "Planned", debt: "$4.8M", progress: 12 },
  { name: "Payments Gateway", domain: "Finance & Billing", owner: "Payments Platform", stack: "Java 17 · Kubernetes", criticality: "Tier 1", health: 88, status: "Modernized", debt: "$0.4M", progress: 100 },
  { name: "Customer Portal", domain: "Digital Channels", owner: "Digital Engineering", stack: "AngularJS · .NET", criticality: "Tier 2", health: 49, status: "In Progress", debt: "$2.8M", progress: 44 },
  { name: "Inventory Service", domain: "Supply Chain", owner: "Supply Chain IT", stack: "PHP 7.2 · MySQL", criticality: "Tier 2", health: 58, status: "Planned", debt: "$2.4M", progress: 8 },
  { name: "HR Workday Bridge", domain: "Human Resources", owner: "People Systems", stack: "Python · Airflow", criticality: "Tier 3", health: 76, status: "Modernized", debt: "$0.9M", progress: 100 },
  { name: "Regulatory Reporting", domain: "Risk & Compliance", owner: "Risk Technology", stack: "Java 11 · Postgres", criticality: "Tier 1", health: 71, status: "In Progress", debt: "$1.6M", progress: 55 },
  { name: "Partner Data Hub", domain: "Supply Chain", owner: "Integration Services", stack: "Mulesoft · Oracle", criticality: "Tier 2", health: 53, status: "Not Started", debt: "$1.9M", progress: 0 },
];

const statusFilters = ["All", "Modernized", "In Progress", "Planned", "Not Started"] as const;

function statusTone(s: App["status"]): Tone {
  return s === "Modernized" ? "success" : s === "In Progress" ? "brand" : s === "Planned" ? "warning" : "neutral";
}

export default function ApplicationsPage() {
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("All");
  const [query, setQuery] = useState("");

  const visible = apps.filter(
    (a) =>
      (status === "All" || a.status === status) &&
      (a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.domain.toLowerCase().includes(query.toLowerCase()) ||
        a.owner.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="The complete portfolio inventory with health, ownership, criticality and modernization status."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <Filter className="size-3.5" /> Saved Views
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <Plus className="size-3.5" /> Register Application
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/architecture-intelligence">Inspect graph</PanelLink>}>
        22 Tier 1 applications are at risk and 12 are critical — all 12 share a dependency on the Oracle 11g estate
        scheduled for retirement in Wave 3.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Total Applications" value="156" delta="+8" deltaLabel="registered" direction="up" tone="brand" icon={Boxes} />
        <KpiCard label="Healthy" value="122" delta="+11" deltaLabel="improved" direction="up" tone="success" icon={HeartPulse} />
        <KpiCard label="At Risk" value="22" delta="-4" deltaLabel="stabilized" direction="down" tone="warning" icon={ShieldAlert} />
        <KpiCard label="Critical" value="12" delta="-3" deltaLabel="remediated" direction="down" tone="danger" icon={ShieldAlert} />
        <KpiCard label="Tier 1 Systems" value="68" deltaLabel="mission critical" direction="flat" tone="intel" icon={Boxes} />
        <KpiCard label="Avg Modernization" value="46" suffix="%" delta="+7%" deltaLabel="this quarter" direction="up" tone="success" icon={TrendingUp} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Health Distribution" subtitle="Applications by health band">
          <DonutStat data={health} total="156" totalLabel="Applications" />
        </Panel>

        <Panel title="Applications by Domain" subtitle="Portfolio spread" className="xl:col-span-2">
          <BarList
            color="var(--chart-1)"
            items={[
              { label: "Finance & Billing", value: 38, display: "38" },
              { label: "Customer & CRM", value: 31, display: "31" },
              { label: "Digital Channels", value: 27, display: "27" },
              { label: "Supply Chain", value: 22, display: "22" },
              { label: "Risk & Compliance", value: 20, display: "20" },
              { label: "Human Resources", value: 18, display: "18" },
            ]}
          />
        </Panel>
      </div>

      <Panel
        title="Application Inventory"
        subtitle={`${visible.length} of ${apps.length} applications`}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter inventory..."
              className="h-7 w-40 rounded-md border bg-background px-2.5 text-[11px] outline-none focus:ring-2 focus:ring-[color:color-mix(in_oklch,var(--ring)_30%,transparent)]"
            />
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  status === s ? "border-[color:color-mix(in_oklch,var(--brand)_30%,transparent)] bg-brand-soft text-brand" : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        }
        bodyClassName="px-0 pb-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Application</th>
                <th className="px-4 py-2.5 font-semibold">Domain</th>
                <th className="px-4 py-2.5 font-semibold">Owner</th>
                <th className="px-4 py-2.5 font-semibold">Technology</th>
                <th className="px-4 py-2.5 font-semibold">Criticality</th>
                <th className="px-4 py-2.5 font-semibold">Health</th>
                <th className="px-4 py-2.5 font-semibold">Progress</th>
                <th className="px-4 py-2.5 font-semibold">Debt</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.name} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                  <td className="px-5 py-3 font-semibold text-foreground">{a.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.domain}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.owner}</td>
                  <td className="num px-4 py-3 text-muted-foreground">{a.stack}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={a.criticality === "Tier 1" ? "danger" : a.criticality === "Tier 2" ? "warning" : "neutral"}>
                      {a.criticality}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <ScorePill score={a.health} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-16">
                        <ProgressBar value={a.progress} tone={statusTone(a.status)} />
                      </span>
                      <span className="num text-muted-foreground">{a.progress}%</span>
                    </div>
                  </td>
                  <td className="num px-4 py-3 font-semibold text-foreground">{a.debt}</td>
                  <td className="px-5 py-3">
                    <StatusPill tone={statusTone(a.status)}>{a.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
