"use client";

import { GraduationCap, Users, UserPlus, Workflow } from "lucide-react";

import { BarList, TrendLine } from "@/lib/legacy-modernization/charts";
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

const teams = [
  { name: "Finance Engineering", lead: "M. Chen", members: 24, apps: 18, load: 92, health: 61, status: "Over Capacity", tone: "danger" as Tone },
  { name: "Customer Engineering", lead: "S. Patel", members: 19, apps: 14, load: 74, health: 78, status: "On Track", tone: "success" as Tone },
  { name: "Insurance Ops IT", lead: "P. Nair", members: 16, apps: 11, load: 88, health: 48, status: "At Risk", tone: "warning" as Tone },
  { name: "Payments Platform", lead: "L. Novak", members: 14, apps: 8, load: 62, health: 91, status: "On Track", tone: "success" as Tone },
  { name: "Digital Engineering", lead: "R. Okafor", members: 21, apps: 16, load: 79, health: 72, status: "On Track", tone: "success" as Tone },
  { name: "Data Platform", lead: "K. Iwata", members: 17, apps: 12, load: 85, health: 66, status: "At Risk", tone: "warning" as Tone },
  { name: "Mainframe Services", lead: "D. Fischer", members: 9, apps: 6, load: 96, health: 39, status: "Over Capacity", tone: "danger" as Tone },
];

const throughput = [
  { label: "Mar", delivered: 6, planned: 8 },
  { label: "Apr", delivered: 8, planned: 9 },
  { label: "May", delivered: 9, planned: 10 },
  { label: "Jun", delivered: 11, planned: 11 },
  { label: "Jul", delivered: 12, planned: 13 },
  { label: "Aug", delivered: 14, planned: 14 },
];

export default function TeamsPage() {
  return (
    <>
      <PageHeader
        title="Teams"
        subtitle="Ownership, capacity and skills coverage for the teams delivering the modernization roadmap."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <Workflow className="size-3.5" /> Rebalance Load
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <UserPlus className="size-3.5" /> Add Team
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/planning">Resequence waves</PanelLink>}>
        Mainframe Services is at 96% utilization with the lowest skills coverage in the program — shifting the Wave 4
        start by one quarter removes the single largest delivery risk.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Active Teams" value="24" delta="+2" deltaLabel="onboarded" direction="up" tone="brand" icon={Users} />
        <KpiCard label="Engineers Engaged" value="386" delta="+31" deltaLabel="this quarter" direction="up" tone="intel" icon={Users} />
        <KpiCard label="Avg Utilization" value="82" suffix="%" delta="+4%" deltaLabel="vs target 78%" direction="up" tone="warning" icon={Workflow} />
        <KpiCard label="Teams Over Capacity" value="4" delta="+1" deltaLabel="needs rebalance" direction="up" tone="danger" icon={Users} />
        <KpiCard label="Skills Coverage" value="71" suffix="%" delta="+6%" deltaLabel="after upskilling" direction="up" tone="success" icon={GraduationCap} />
        <KpiCard label="Apps Delivered / Mo" value="14" delta="+2" deltaLabel="throughput" direction="up" tone="success" icon={Workflow} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Delivery Throughput" subtitle="Applications modernized per month" className="xl:col-span-2">
          <TrendLine
            data={throughput}
            height={220}
            showLegend
            series={[
              { key: "planned", name: "Planned", color: "var(--chart-1)" },
              { key: "delivered", name: "Delivered", color: "var(--chart-2)" },
            ]}
          />
        </Panel>

        <Panel title="Skills Gap" subtitle="Coverage against roadmap demand">
          <BarList
            color="var(--chart-3)"
            items={[
              { label: "Java 17 / Spring", value: 84, display: "84%" },
              { label: "Kubernetes", value: 76, display: "76%" },
              { label: "Event Streaming", value: 58, display: "58%" },
              { label: "PostgreSQL", value: 71, display: "71%" },
              { label: "COBOL", value: 22, display: "22%" },
              { label: "Domain Modelling", value: 49, display: "49%" },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Team Ownership" subtitle="Capacity and health by team" bodyClassName="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Team</th>
                <th className="px-4 py-2.5 font-semibold">Lead</th>
                <th className="px-4 py-2.5 font-semibold">Members</th>
                <th className="px-4 py-2.5 font-semibold">Applications</th>
                <th className="px-4 py-2.5 font-semibold">Utilization</th>
                <th className="px-4 py-2.5 font-semibold">Health</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.name} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                  <td className="px-5 py-3 font-semibold text-foreground">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.lead}</td>
                  <td className="num px-4 py-3 text-muted-foreground">{t.members}</td>
                  <td className="num px-4 py-3 text-muted-foreground">{t.apps}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-20">
                        <ProgressBar value={t.load} tone={t.load >= 90 ? "danger" : t.load >= 80 ? "warning" : "success"} />
                      </span>
                      <span className="num text-muted-foreground">{t.load}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ScorePill score={t.health} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill tone={t.tone}>{t.status}</StatusPill>
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
