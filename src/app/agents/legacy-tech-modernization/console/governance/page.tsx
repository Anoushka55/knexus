"use client";

import { ClipboardCheck, FileText, Gavel, Landmark, ShieldCheck, Users } from "lucide-react";

import { RadarScore } from "@/lib/legacy-modernization/charts";
import {
  InsightBar,
  KpiCard,
  PageHeader,
  Panel,
  PanelLink,
  ProgressBar,
  StatusPill,
  type Tone,
} from "@/lib/legacy-modernization/primitives";

const radar = [
  { dimension: "Architecture", current: 82, target: 92 },
  { dimension: "Security", current: 72, target: 90 },
  { dimension: "Data", current: 76, target: 88 },
  { dimension: "Delivery", current: 84, target: 90 },
  { dimension: "Cost", current: 68, target: 85 },
  { dimension: "Compliance", current: 86, target: 95 },
];

const policies = [
  { policy: "Approved technology standards", compliance: 88, apps: "1,922 / 2,184", tone: "success" as Tone },
  { policy: "No end-of-support runtimes", compliance: 54, apps: "1,179 / 2,184", tone: "danger" as Tone },
  { policy: "Automated test gate enforced", compliance: 81, apps: "1,769 / 2,184", tone: "warning" as Tone },
  { policy: "Data classification recorded", compliance: 92, apps: "2,009 / 2,184", tone: "success" as Tone },
  { policy: "Capability ownership assigned", compliance: 94, apps: "2,053 / 2,184", tone: "success" as Tone },
  { policy: "Infrastructure as code", compliance: 73, apps: "1,594 / 2,184", tone: "warning" as Tone },
];

const activities = [
  { item: "Wave 2 target architecture approved", body: "Architecture Review Board", decision: "Approved", owner: "A. Morgan", date: "22 Aug 2026", tone: "success" as Tone },
  { item: "Oracle 11g extension requested", body: "Technology Standards Council", decision: "Conditional", owner: "D. Fischer", date: "21 Aug 2026", tone: "warning" as Tone },
  { item: "Claims mainframe exit business case", body: "Investment Committee", decision: "Approved", owner: "P. Nair", date: "19 Aug 2026", tone: "success" as Tone },
  { item: "Direct database access for reporting", body: "Data Governance Council", decision: "Rejected", owner: "S. Patel", date: "18 Aug 2026", tone: "danger" as Tone },
  { item: "Kafka adoption as enterprise standard", body: "Architecture Review Board", decision: "Approved", owner: "M. Chen", date: "15 Aug 2026", tone: "success" as Tone },
];

const exceptions = [
  { ref: "EX-2291", title: "WebLogic 12c retained through Wave 3", owner: "Platform Ops", expires: "31 Dec 2026", risk: "High", tone: "danger" as Tone },
  { ref: "EX-2287", title: "Manual approval for claims batch releases", owner: "Insurance Ops IT", expires: "30 Sep 2026", risk: "Medium", tone: "warning" as Tone },
  { ref: "EX-2280", title: "Coverage gate lowered to 65% for COBOL parity", owner: "Quality Engineering", expires: "31 Oct 2026", risk: "Medium", tone: "warning" as Tone },
  { ref: "EX-2274", title: "Shared Oracle schema for legacy reporting", owner: "Data Platform", expires: "28 Feb 2027", risk: "High", tone: "danger" as Tone },
];

export default function GovernancePage() {
  return (
    <>
      <PageHeader
        title="Governance"
        subtitle="Policy compliance, review decisions, exceptions and the audit trail that keeps modernization accountable."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <FileText className="size-3.5" /> Export Audit Trail
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <Gavel className="size-3.5" /> Raise for Review
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/planning">Adjust roadmap</PanelLink>}>
        End-of-support runtime compliance is the single largest governance gap at 54% — clearing Waves 2 and 3 lifts
        the overall governance score from 78 to an estimated 89.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Governance Score" value="78" suffix="/100" delta="+4" deltaLabel="vs last quarter" direction="up" tone="success" icon={Landmark} />
        <KpiCard label="Policies Tracked" value="46" delta="+3" deltaLabel="new standards" direction="up" tone="brand" icon={ClipboardCheck} />
        <KpiCard label="Open Exceptions" value="24" delta="-6" deltaLabel="closed" direction="down" tone="warning" icon={ShieldCheck} />
        <KpiCard label="Reviews This Quarter" value="118" delta="+22" deltaLabel="throughput" direction="up" tone="intel" icon={Gavel} />
        <KpiCard label="Avg Decision Time" value="4.2" suffix="d" delta="-1.1d" deltaLabel="faster" direction="down" tone="success" icon={Users} />
        <KpiCard label="Audit Findings Open" value="7" delta="-4" deltaLabel="remediated" direction="down" tone="danger" icon={FileText} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Governance Dimensions" subtitle="Current score vs target">
          <RadarScore data={radar} />
        </Panel>

        <Panel title="Policy Compliance" subtitle="Applications meeting each standard" className="xl:col-span-2">
          <ul className="grid gap-4 sm:grid-cols-2">
            {policies.map((p) => (
              <li key={p.policy} className="rounded-lg border p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">{p.policy}</span>
                  <span className="num text-xs font-semibold text-foreground">{p.compliance}%</span>
                </div>
                <div className="mt-2.5">
                  <ProgressBar value={p.compliance} tone={p.tone} />
                </div>
                <p className="num mt-1.5 text-[11px] text-muted-foreground">{p.apps} applications</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Recent Governance Activity" subtitle="Decisions from review bodies" className="xl:col-span-2" bodyClassName="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Item</th>
                  <th className="px-4 py-2.5 font-semibold">Review Body</th>
                  <th className="px-4 py-2.5 font-semibold">Decision</th>
                  <th className="px-4 py-2.5 font-semibold">Accountable</th>
                  <th className="px-5 py-2.5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.item} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                    <td className="px-5 py-3 font-medium text-foreground">{a.item}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.body}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={a.tone}>{a.decision}</StatusPill>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.owner}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Active Exceptions" subtitle="Time-boxed deviations from policy">
          <ul className="space-y-2.5">
            {exceptions.map((e) => (
              <li key={e.ref} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="num text-[11px] font-semibold text-muted-foreground">{e.ref}</span>
                  <StatusPill tone={e.tone}>{e.risk} risk</StatusPill>
                </div>
                <p className="mt-1 text-xs font-semibold text-foreground">{e.title}</p>
                <p className="num mt-0.5 text-[11px] text-muted-foreground">
                  {e.owner} · expires {e.expires}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
