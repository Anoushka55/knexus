"use client";

import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Download,
  Layers,
  TrendingUp,
  Zap,
} from "lucide-react";

import { BarList, DonutStat, TrendLine } from "@/lib/legacy-modernization/charts";
import { RunAssessment } from "@/lib/legacy-modernization/RunAssessment";
import {
  Dot,
  InsightBar,
  KpiCard,
  PageHeader,
  Panel,
  PanelLink,
  ProgressBar,
  StatusPill,
  type Tone,
} from "@/lib/legacy-modernization/primitives";

const kpis = [
  { label: "Total Applications", value: "2,184", delta: "+24", deltaLabel: "vs last quarter", direction: "up" as const, tone: "brand" as Tone, icon: Boxes },
  { label: "Legacy Systems", value: "1,247", delta: "-86", deltaLabel: "retired this year", direction: "down" as const, tone: "warning" as Tone, icon: Layers },
  { label: "Modernization Progress", value: "68", suffix: "%", delta: "+6.4%", deltaLabel: "vs last quarter", direction: "up" as const, tone: "success" as Tone, icon: TrendingUp },
  { label: "Technical Debt", value: "$42.6M", delta: "-$3.8M", deltaLabel: "reduced YTD", direction: "down" as const, tone: "danger" as Tone, icon: CircleDollarSign },
  { label: "Annual Run-Rate Savings", value: "$18.4M", delta: "+$2.1M", deltaLabel: "captured", direction: "up" as const, tone: "intel" as Tone, icon: Zap },
  { label: "Critical Risk Systems", value: "42", delta: "-9", deltaLabel: "remediated", direction: "down" as const, tone: "danger" as Tone, icon: AlertTriangle },
];

const pipeline = [
  { stage: "Discovery", count: 184, tone: "brand" as Tone, pct: 100 },
  { stage: "Assessment", count: 12, tone: "brand" as Tone, pct: 74 },
  { stage: "Planning", count: 18, tone: "warning" as Tone, pct: 58 },
  { stage: "Transformation", count: 8, tone: "intel" as Tone, pct: 41 },
  { stage: "Validation", count: 4, tone: "success" as Tone, pct: 26 },
  { stage: "Deployed", count: 96, tone: "success" as Tone, pct: 100 },
];

const domains = [
  { name: "Finance & Billing", value: 486, color: "var(--chart-1)" },
  { name: "Customer & CRM", value: 412, color: "var(--chart-5)" },
  { name: "Supply Chain", value: 328, color: "var(--chart-2)" },
  { name: "Human Resources", value: 264, color: "var(--chart-3)" },
  { name: "Risk & Compliance", value: 218, color: "var(--chart-6)" },
  { name: "Digital Channels", value: 476, color: "var(--chart-4)" },
];

const trend = [
  { label: "Jan", progress: 46, debt: 52.4 },
  { label: "Feb", progress: 49, debt: 51.1 },
  { label: "Mar", progress: 52, debt: 49.6 },
  { label: "Apr", progress: 55, debt: 48.2 },
  { label: "May", progress: 58, debt: 46.8 },
  { label: "Jun", progress: 60, debt: 45.9 },
  { label: "Jul", progress: 63, debt: 44.7 },
  { label: "Aug", progress: 68, debt: 42.6 },
];

const candidates = [
  {
    name: "Billing Platform",
    stack: "Java 8 · Oracle 11g · WebLogic",
    score: 94,
    impact: "$6.2M savings",
    effort: "High",
    strategy: "Incremental Refactor",
    tone: "danger" as Tone,
    rationale: "Highest coupling in the graph with 42 downstream services and 3 critical CVEs.",
  },
  {
    name: "Claims Processing",
    stack: "COBOL · DB2 · Mainframe",
    score: 91,
    impact: "$4.8M savings",
    effort: "Very High",
    strategy: "Replatform",
    tone: "danger" as Tone,
    rationale: "Batch window exceeded 6 of last 8 cycles; skills availability at 12%.",
  },
  {
    name: "Customer Portal",
    stack: ".NET Framework 4.6 · SQL Server",
    score: 87,
    impact: "$3.1M savings",
    effort: "Medium",
    strategy: "Rearchitect",
    tone: "warning" as Tone,
    rationale: "Monolith blocking 9 capability roadmaps; container-ready after auth extraction.",
  },
  {
    name: "Inventory Service",
    stack: "PHP 7.2 · MySQL 5.7",
    score: 82,
    impact: "$2.4M savings",
    effort: "Medium",
    strategy: "Rehost + Refactor",
    tone: "warning" as Tone,
    rationale: "End-of-support runtime with 78% automated test coverage already in place.",
  },
];

const activity = [
  { title: "Transformation completed", detail: "Payments Gateway migrated to Java 17", time: "12 min ago", tone: "success" as Tone },
  { title: "Critical CVE detected", detail: "CVE-2024-38271 in Billing Platform dependency", time: "48 min ago", tone: "danger" as Tone },
  { title: "Architecture graph refreshed", detail: "8,742 services re-indexed across 4 domains", time: "2 hrs ago", tone: "intel" as Tone },
  { title: "Governance exception raised", detail: "Claims Processing missed remediation SLA", time: "5 hrs ago", tone: "warning" as Tone },
  { title: "Discovery scan finished", detail: "248 repositories · 84.6M lines analyzed", time: "9 hrs ago", tone: "brand" as Tone },
];

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Modernization Overview"
        subtitle="Enterprise-wide portfolio posture, pipeline velocity and AI-ranked modernization candidates."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <Download className="size-3.5" /> Export Report
            </button>
            <RunAssessment />
          </>
        }
      />

      <InsightBar
        action={<PanelLink to="/planning">Review plan</PanelLink>}
      >
        Sequencing Billing Platform before Claims Processing reduces cross-domain rework by an estimated 22% and
        accelerates $6.2M of run-rate savings by two quarters.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Modernization Pipeline"
          subtitle="Applications by current stage"
          className="xl:col-span-2"
          actions={<PanelLink to="/planning">View pipeline</PanelLink>}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pipeline.map((p) => (
              <div key={p.stage} className="rounded-lg border p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Dot tone={p.tone} />
                    {p.stage}
                  </span>
                  <span className="num text-sm font-semibold text-foreground">{p.count}</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={p.pct} tone={p.tone} />
                </div>
                <p className="num mt-1.5 text-[11px] text-muted-foreground">{p.pct}% stage completion</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Domain Distribution" subtitle="Applications by business domain">
          <DonutStat data={domains} total="2,184" totalLabel="Applications" />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Modernization Progress vs Technical Debt"
          subtitle="Trailing 8 months"
          className="xl:col-span-2"
        >
          <TrendLine
            data={trend}
            height={230}
            showLegend
            series={[
              { key: "progress", name: "Progress (%)", color: "var(--chart-1)" },
              { key: "debt", name: "Technical Debt ($M)", color: "var(--chart-4)" },
            ]}
          />
        </Panel>

        <Panel title="Recent Activity" subtitle="Across all modules">
          <ul className="space-y-3.5">
            {activity.map((a) => (
              <li key={a.title + a.time} className="flex gap-3">
                <span className="mt-1.5">
                  <Dot tone={a.tone} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{a.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{a.detail}</p>
                  <p className="mt-0.5 text-[10px] text-[color:color-mix(in_oklch,var(--muted-foreground)_80%,transparent)]">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="AI Modernization Candidates"
          subtitle="Ranked by business impact, risk exposure and dependency weight"
          className="xl:col-span-2"
          actions={<PanelLink to="/applications">All applications</PanelLink>}
          bodyClassName="space-y-3"
        >
          {candidates.map((c) => (
            <article key={c.name} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                    <StatusPill tone={c.tone}>Priority {c.score}</StatusPill>
                    <StatusPill tone="neutral">{c.strategy}</StatusPill>
                  </div>
                  <p className="num mt-1 text-[11px] text-muted-foreground">{c.stack}</p>
                </div>
                <div className="text-right">
                  <p className="num text-sm font-semibold text-success">{c.impact}</p>
                  <p className="text-[11px] text-muted-foreground">Effort: {c.effort}</p>
                </div>
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">{c.rationale}</p>
              <div className="mt-3">
                <ProgressBar value={c.score} tone={c.tone} />
              </div>
            </article>
          ))}
        </Panel>

        <Panel title="Technology Stack Exposure" subtitle="Applications on end-of-support runtimes">
          <BarList
            color="var(--chart-4)"
            items={[
              { label: "Java 8", value: 342, display: "342", share: "27%" },
              { label: "COBOL", value: 186, display: "186", share: "15%" },
              { label: ".NET Framework", value: 271, display: "271", share: "22%" },
              { label: "Oracle 11g", value: 158, display: "158", share: "13%" },
              { label: "PHP 7.x", value: 132, display: "132", share: "11%" },
              { label: "AngularJS", value: 158, display: "158", share: "12%" },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
