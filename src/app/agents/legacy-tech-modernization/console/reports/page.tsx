"use client";

import { CalendarClock, Download, FileBarChart, FileText, Plus, Share2 } from "lucide-react";

import { TrendLine } from "@/lib/legacy-modernization/charts";
import {
  InsightBar,
  KpiCard,
  PageHeader,
  Panel,
  PanelLink,
  StatusPill,
  type Tone,
} from "@/lib/legacy-modernization/primitives";

const catalog = [
  { name: "Executive Modernization Summary", audience: "Board & ExCo", cadence: "Monthly", last: "01 Aug 2026", format: "PDF", tone: "brand" as Tone },
  { name: "Technical Debt & Financials", audience: "CFO Office", cadence: "Quarterly", last: "01 Jul 2026", format: "XLSX", tone: "intel" as Tone },
  { name: "Security & Compliance Posture", audience: "CISO / Audit", cadence: "Weekly", last: "19 Aug 2026", format: "PDF", tone: "danger" as Tone },
  { name: "Wave Delivery Status", audience: "Program Office", cadence: "Bi-weekly", last: "16 Aug 2026", format: "PDF", tone: "success" as Tone },
  { name: "Architecture Conformance", audience: "Review Board", cadence: "Monthly", last: "05 Aug 2026", format: "PDF", tone: "warning" as Tone },
  { name: "Application Portfolio Extract", audience: "Enterprise Architecture", cadence: "On demand", last: "22 Aug 2026", format: "CSV", tone: "neutral" as Tone },
];

const runs = [
  { report: "Security & Compliance Posture", started: "19 Aug 2026 · 06:00", duration: "1m 12s", status: "Succeeded", tone: "success" as Tone },
  { report: "Wave Delivery Status", started: "16 Aug 2026 · 06:00", duration: "48s", status: "Succeeded", tone: "success" as Tone },
  { report: "Application Portfolio Extract", started: "22 Aug 2026 · 14:22", duration: "2m 06s", status: "Succeeded", tone: "success" as Tone },
  { report: "Technical Debt & Financials", started: "01 Jul 2026 · 05:00", duration: "4m 51s", status: "Partial", tone: "warning" as Tone },
  { report: "Architecture Conformance", started: "05 Aug 2026 · 05:00", duration: "—", status: "Failed", tone: "danger" as Tone },
];

const volume = [
  { label: "Mar", runs: 612, scheduled: 402 },
  { label: "Apr", runs: 648, scheduled: 418 },
  { label: "May", runs: 702, scheduled: 436 },
  { label: "Jun", runs: 741, scheduled: 452 },
  { label: "Jul", runs: 786, scheduled: 468 },
  { label: "Aug", runs: 797, scheduled: 481 },
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Scheduled and on-demand reporting across modernization progress, financials, risk and delivery."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <Share2 className="size-3.5" /> Manage Subscriptions
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <Plus className="size-3.5" /> New Report
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/governance">Review conformance</PanelLink>}>
        The Architecture Conformance report has failed twice on the same graph query — the underlying capability
        mapping job needs to complete before the next scheduled run.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Report Definitions" value="184" delta="+12" deltaLabel="added" direction="up" tone="brand" icon={FileBarChart} />
        <KpiCard label="Scheduled Reports" value="62" delta="+5" deltaLabel="new schedules" direction="up" tone="intel" icon={CalendarClock} />
        <KpiCard label="Runs This Year" value="4,286" delta="+9.4%" deltaLabel="volume" direction="up" tone="success" icon={FileText} />
        <KpiCard label="Success Rate" value="98.4" suffix="%" delta="+0.6%" deltaLabel="reliability" direction="up" tone="success" icon={FileText} />
        <KpiCard label="Subscribers" value="912" delta="+64" deltaLabel="stakeholders" direction="up" tone="warning" icon={Share2} />
        <KpiCard label="Avg Generation Time" value="1m 42s" delta="-18s" deltaLabel="faster" direction="down" tone="neutral" icon={CalendarClock} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Report Catalog" subtitle="Standard enterprise reporting pack" className="xl:col-span-2" bodyClassName="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Report</th>
                  <th className="px-4 py-2.5 font-semibold">Audience</th>
                  <th className="px-4 py-2.5 font-semibold">Cadence</th>
                  <th className="px-4 py-2.5 font-semibold">Last Generated</th>
                  <th className="px-4 py-2.5 font-semibold">Format</th>
                  <th className="px-5 py-2.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((c) => (
                  <tr key={c.name} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                    <td className="px-5 py-3 font-semibold text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.audience}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={c.tone}>{c.cadence}</StatusPill>
                    </td>
                    <td className="num px-4 py-3 text-muted-foreground">{c.last}</td>
                    <td className="num px-4 py-3 text-muted-foreground">{c.format}</td>
                    <td className="px-5 py-3">
                      <button className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary">
                        <Download className="size-3" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Report Volume" subtitle="Runs per month">
          <TrendLine
            data={volume}
            height={230}
            showLegend
            series={[
              { key: "runs", name: "Total runs", color: "var(--chart-1)" },
              { key: "scheduled", name: "Scheduled", color: "var(--chart-5)" },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Recent Runs" subtitle="Execution history" bodyClassName="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Report</th>
                <th className="px-4 py-2.5 font-semibold">Started</th>
                <th className="px-4 py-2.5 font-semibold">Duration</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.report + r.started} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                  <td className="px-5 py-3 font-medium text-foreground">{r.report}</td>
                  <td className="num px-4 py-3 text-muted-foreground">{r.started}</td>
                  <td className="num px-4 py-3 text-muted-foreground">{r.duration}</td>
                  <td className="px-5 py-3">
                    <StatusPill tone={r.tone}>{r.status}</StatusPill>
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
