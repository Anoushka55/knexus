"use client";

import { CalendarRange, GitCompare, Layers, Route as RouteIcon, Sparkles, Target } from "lucide-react";
import { useState } from "react";

import { TrendLine } from "@/lib/legacy-modernization/charts";
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
import { cn } from "@/lib/utils";

const strategies = [
  { name: "Incremental Refactor", desc: "Strangler-fig extraction of bounded contexts while the monolith keeps serving traffic.", cost: "$4.2M", duration: "14 months", risk: "Medium", value: 88, recommended: true },
  { name: "Replatform", desc: "Lift workloads onto containers and managed data services with minimal code change.", cost: "$2.6M", duration: "8 months", risk: "Low", value: 64, recommended: false },
  { name: "Rearchitect", desc: "Rebuild into event-driven microservices aligned to capability boundaries.", cost: "$7.8M", duration: "24 months", risk: "High", value: 94, recommended: false },
  { name: "Replace (SaaS)", desc: "Retire custom build and adopt a vendor platform with migration of core data.", cost: "$5.4M", duration: "18 months", risk: "High", value: 71, recommended: false },
];

const currentState = [
  { label: "WebLogic Monolith", note: "Java 8 · 1.84M LOC" },
  { label: "Oracle 11g (EOL)", note: "Shared schema · 27 consumers" },
  { label: "Nightly Batch ETL", note: "6-hour window" },
  { label: "On-prem RHEL 7", note: "Manual release" },
];

const targetState = [
  { label: "Domain Microservices", note: "Java 17 · 9 bounded contexts" },
  { label: "PostgreSQL 16 (Managed)", note: "Per-service schemas" },
  { label: "Event Streaming", note: "Kafka · near-real-time" },
  { label: "Kubernetes (AKS)", note: "GitOps delivery" },
];

const waves = [
  { wave: "Wave 1 — Foundation", window: "Q1 2026", apps: 8, status: "Complete", pct: 100, tone: "success" as Tone },
  { wave: "Wave 2 — Revenue Core", window: "Q2–Q3 2026", apps: 14, status: "In Progress", pct: 62, tone: "brand" as Tone },
  { wave: "Wave 3 — Customer Domain", window: "Q4 2026", apps: 12, status: "Planned", pct: 18, tone: "warning" as Tone },
  { wave: "Wave 4 — Mainframe Exit", window: "2027", apps: 9, status: "Planned", pct: 4, tone: "neutral" as Tone },
];

const risks = [
  { risk: "Oracle 11g data migration fidelity", likelihood: "High", impact: "Critical", mitigation: "Dual-write with reconciliation harness for 2 cycles", tone: "danger" as Tone },
  { risk: "COBOL business-rule extraction gaps", likelihood: "Medium", impact: "High", mitigation: "AI rule mining plus SME validation workshops", tone: "warning" as Tone },
  { risk: "Skills availability for mainframe exit", likelihood: "High", impact: "High", mitigation: "Vendor bench contract and internal upskilling track", tone: "danger" as Tone },
  { risk: "Peak-season change freeze overlap", likelihood: "Medium", impact: "Medium", mitigation: "Shift Wave 3 cutover to post-freeze window", tone: "warning" as Tone },
  { risk: "API contract drift for 32 consumers", likelihood: "Low", impact: "High", mitigation: "Contract tests gated in the validation pipeline", tone: "success" as Tone },
];

const forecast = [
  { label: "Q1", planned: 8, actual: 8 },
  { label: "Q2", planned: 16, actual: 14 },
  { label: "Q3", planned: 26, actual: 22 },
  { label: "Q4", planned: 38, actual: 30 },
  { label: "Q1 '27", planned: 48, actual: 0 },
  { label: "Q2 '27", planned: 57, actual: 0 },
];

export default function PlanningPage() {
  const [selected, setSelected] = useState(strategies[0]!.name);

  return (
    <>
      <PageHeader
        title="Planning & Architecture Mapping"
        subtitle="Evaluate modernization strategies, map current to target architecture and sequence delivery waves."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <GitCompare className="size-3.5" /> Compare Scenarios
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <Sparkles className="size-3.5" /> Generate Roadmap
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/refactoring">Start transformation</PanelLink>}>
        Incremental Refactor delivers 88% of the target-state value at 54% of the Rearchitect cost, with the first
        revenue-bearing service live in 11 weeks.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Applications in Plan" value="43" delta="+6" deltaLabel="added this quarter" direction="up" tone="brand" icon={Layers} />
        <KpiCard label="Planned Investment" value="$28.4M" delta="+$1.9M" deltaLabel="reforecast" direction="up" tone="intel" icon={Target} />
        <KpiCard label="Projected Savings" value="$46.2M" delta="+12%" deltaLabel="3-year NPV" direction="up" tone="success" icon={Target} />
        <KpiCard label="Roadmap Duration" value="26" suffix="mo" deltaLabel="through Q2 2027" direction="flat" tone="warning" icon={CalendarRange} />
        <KpiCard label="Plan Confidence" value="82" suffix="%" delta="+4%" deltaLabel="after graph refresh" direction="up" tone="success" icon={RouteIcon} />
        <KpiCard label="Open Risks" value="17" delta="-3" deltaLabel="mitigated" direction="down" tone="danger" icon={Target} />
      </div>

      <Panel title="Modernization Strategy Options" subtitle="AI-scored against cost, duration, risk and target-state value">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {strategies.map((s) => (
            <button
              key={s.name}
              onClick={() => setSelected(s.name)}
              className={cn(
                "flex flex-col rounded-lg border p-4 text-left transition-colors",
                selected === s.name ? "border-[color:color-mix(in_oklch,var(--brand)_50%,transparent)] bg-brand-soft" : "hover:bg-[color:color-mix(in_oklch,var(--secondary)_50%,transparent)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                {s.recommended ? <StatusPill tone="success">Recommended</StatusPill> : null}
              </div>
              <p className="mt-1.5 flex-1 text-xs text-muted-foreground">{s.desc}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                {[
                  ["Cost", s.cost],
                  ["Duration", s.duration],
                  ["Risk", s.risk],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="num font-semibold text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Target-state value</span>
                  <span className="num font-semibold text-foreground">{s.value}%</span>
                </div>
                <ProgressBar value={s.value} tone={s.value >= 85 ? "success" : "warning"} />
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Current → Target Architecture"
          subtitle={`Mapping for ${selected}`}
          className="xl:col-span-2"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Current State</p>
              {currentState.map((c) => (
                <div key={c.label} className="rounded-lg border border-[color:color-mix(in_oklch,var(--danger)_25%,transparent)] bg-[color:color-mix(in_oklch,var(--danger-soft)_60%,transparent)] p-3">
                  <p className="text-xs font-semibold text-foreground">{c.label}</p>
                  <p className="num text-[11px] text-muted-foreground">{c.note}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                <RouteIcon className="size-4" />
              </span>
            </div>
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Target State</p>
              {targetState.map((t) => (
                <div key={t.label} className="rounded-lg border border-[color:color-mix(in_oklch,var(--success)_25%,transparent)] bg-[color:color-mix(in_oklch,var(--success-soft)_60%,transparent)] p-3">
                  <p className="text-xs font-semibold text-foreground">{t.label}</p>
                  <p className="num text-[11px] text-muted-foreground">{t.note}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Delivery Waves" subtitle="Sequenced by dependency weight">
          <ul className="space-y-3.5">
            {waves.map((w) => (
              <li key={w.wave} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Dot tone={w.tone} />
                    {w.wave}
                  </span>
                  <StatusPill tone={w.tone}>{w.status}</StatusPill>
                </div>
                <p className="num mt-1 text-[11px] text-muted-foreground">
                  {w.window} · {w.apps} applications
                </p>
                <div className="mt-2.5">
                  <ProgressBar value={w.pct} tone={w.tone} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Risk Analysis" subtitle="Top risks with active mitigations" className="xl:col-span-2" bodyClassName="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Risk</th>
                  <th className="px-4 py-2.5 font-semibold">Likelihood</th>
                  <th className="px-4 py-2.5 font-semibold">Impact</th>
                  <th className="px-5 py-2.5 font-semibold">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <tr key={r.risk} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                    <td className="px-5 py-3 font-medium text-foreground">{r.risk}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={r.likelihood === "High" ? "danger" : r.likelihood === "Medium" ? "warning" : "success"}>
                        {r.likelihood}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={r.impact === "Critical" ? "danger" : r.impact === "High" ? "warning" : "neutral"}>
                        {r.impact}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{r.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Cumulative Delivery Forecast" subtitle="Applications modernized">
          <TrendLine
            data={forecast}
            height={230}
            showLegend
            series={[
              { key: "planned", name: "Planned", color: "var(--chart-1)" },
              { key: "actual", name: "Actual", color: "var(--chart-2)" },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
