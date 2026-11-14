"use client";

import { CheckCircle2, FlaskConical, Gauge, Play, ShieldCheck, Timer, XCircle } from "lucide-react";

import { DonutStat, TrendLine } from "@/lib/legacy-modernization/charts";
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

const suiteResults = [
  { name: "Passed", value: 11172, color: "var(--chart-2)" },
  { name: "Failed", value: 862, color: "var(--chart-4)" },
  { name: "Skipped", value: 486, color: "var(--chart-3)" },
  { name: "Flaky", value: 322, color: "var(--chart-5)" },
];

const coverageTrend = [
  { label: "Wk 1", unit: 62, integration: 41, e2e: 22 },
  { label: "Wk 2", unit: 65, integration: 44, e2e: 25 },
  { label: "Wk 3", unit: 69, integration: 48, e2e: 28 },
  { label: "Wk 4", unit: 72, integration: 52, e2e: 31 },
  { label: "Wk 5", unit: 76, integration: 56, e2e: 34 },
  { label: "Wk 6", unit: 79, integration: 61, e2e: 38 },
];

const suites = [
  { suite: "Regression — Billing Core", tests: 3842, pass: 92, duration: "18m 04s", status: "Passed", tone: "success" as Tone },
  { suite: "Contract — Public APIs", tests: 1264, pass: 98, duration: "6m 12s", status: "Passed", tone: "success" as Tone },
  { suite: "Integration — Payments", tests: 2148, pass: 88, duration: "22m 41s", status: "Passed", tone: "success" as Tone },
  { suite: "Migration Parity — Claims", tests: 1946, pass: 71, duration: "41m 18s", status: "Failed", tone: "danger" as Tone },
  { suite: "Performance — Invoice Batch", tests: 486, pass: 84, duration: "12m 55s", status: "Warning", tone: "warning" as Tone },
  { suite: "E2E — Customer Portal", tests: 3156, pass: 86, duration: "34m 09s", status: "Passed", tone: "success" as Tone },
];

const gates = [
  { gate: "Code Coverage ≥ 75%", value: "79%", passed: true },
  { gate: "Critical Defects = 0", value: "0", passed: true },
  { gate: "Performance p95 ≤ 400ms", value: "362ms", passed: true },
  { gate: "Security Findings (High) = 0", value: "2", passed: false },
  { gate: "Migration Parity ≥ 99%", value: "99.4%", passed: true },
];

const failures = [
  { test: "ClaimsParityTest.batchTotalsMatch", suite: "Migration Parity — Claims", reason: "Rounding delta of $0.02 on 14 records", owner: "Insurance Ops IT", tone: "danger" as Tone },
  { test: "InvoiceBatchPerfTest.p99UnderSla", suite: "Performance — Invoice Batch", reason: "p99 at 812ms vs 750ms threshold", owner: "Finance Engineering", tone: "warning" as Tone },
  { test: "PaymentRetryTest.idempotentReplay", suite: "Integration — Payments", reason: "Duplicate key on replay after failover", owner: "Payments Platform", tone: "warning" as Tone },
];

export default function ValidationPage() {
  const passed = gates.filter((g) => g.passed).length;

  return (
    <>
      <PageHeader
        title="Validation & Automated Testing"
        subtitle="Behaviour parity, regression and performance evidence for every transformation before it reaches production."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <FlaskConical className="size-3.5" /> Generate Tests
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <Play className="size-3.5" /> Run Full Suite
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/refactoring">Review diff</PanelLink>}>
        The Claims parity failure traces to a rounding rule in the COBOL source not carried into TR-4823 — a targeted
        diff amendment clears 14 of 16 failing assertions.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Tests Executed" value="12,842" delta="+1,284" deltaLabel="this run" direction="up" tone="brand" icon={FlaskConical} />
        <KpiCard label="Pass Rate" value="87" suffix="%" delta="+3.2%" deltaLabel="vs last run" direction="up" tone="success" icon={CheckCircle2} />
        <KpiCard label="Failed Tests" value="862" delta="-146" deltaLabel="resolved" direction="down" tone="danger" icon={XCircle} />
        <KpiCard label="Code Coverage" value="79" suffix="%" delta="+7%" deltaLabel="six-week gain" direction="up" tone="intel" icon={Gauge} />
        <KpiCard label="Avg Suite Duration" value="22m" delta="-4m" deltaLabel="after parallelization" direction="down" tone="warning" icon={Timer} />
        <KpiCard label="Quality Gate" value="Passed" delta={`${passed}/${gates.length}`} deltaLabel="gates met" direction="up" tone="success" icon={ShieldCheck} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Test Result Distribution" subtitle="Latest full-suite execution">
          <DonutStat data={suiteResults} total="12,842" totalLabel="Tests" />
        </Panel>

        <Panel title="Coverage Trend" subtitle="By test type, trailing six weeks" className="xl:col-span-2">
          <TrendLine
            data={coverageTrend}
            height={218}
            showLegend
            domain={[0, 100]}
            series={[
              { key: "unit", name: "Unit", color: "var(--chart-1)" },
              { key: "integration", name: "Integration", color: "var(--chart-2)" },
              { key: "e2e", name: "End-to-end", color: "var(--chart-5)" },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Suite Results" subtitle="Most recent execution per suite" className="xl:col-span-2" bodyClassName="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Suite</th>
                  <th className="px-4 py-2.5 font-semibold">Tests</th>
                  <th className="px-4 py-2.5 font-semibold">Pass Rate</th>
                  <th className="px-4 py-2.5 font-semibold">Duration</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {suites.map((s) => (
                  <tr key={s.suite} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                    <td className="px-5 py-3 font-medium text-foreground">{s.suite}</td>
                    <td className="num px-4 py-3 text-muted-foreground">{s.tests.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-20">
                          <ProgressBar value={s.pass} tone={s.pass >= 90 ? "success" : s.pass >= 80 ? "warning" : "danger"} />
                        </span>
                        <span className="num text-muted-foreground">{s.pass}%</span>
                      </div>
                    </td>
                    <td className="num px-4 py-3 text-muted-foreground">{s.duration}</td>
                    <td className="px-5 py-3">
                      <StatusPill tone={s.tone}>{s.status}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Quality Gate Status" subtitle="Release blocking criteria">
          <ul className="space-y-2.5">
            {gates.map((g) => (
              <li key={g.gate} className="flex items-center gap-2.5 rounded-lg border p-3 text-xs">
                {g.passed ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-danger" />
                )}
                <span className="min-w-0 flex-1 truncate text-foreground">{g.gate}</span>
                <span className="num font-semibold text-foreground">{g.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Top Failing Tests" subtitle="Assigned to owning teams" bodyClassName="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Test</th>
                <th className="px-4 py-2.5 font-semibold">Suite</th>
                <th className="px-4 py-2.5 font-semibold">Failure Reason</th>
                <th className="px-5 py-2.5 font-semibold">Owner</th>
              </tr>
            </thead>
            <tbody>
              {failures.map((f) => (
                <tr key={f.test} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                  <td className="num px-5 py-3 font-semibold text-foreground">{f.test}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.suite}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <StatusPill tone={f.tone}>{f.tone === "danger" ? "Blocking" : "Warning"}</StatusPill>
                      <span className="text-muted-foreground">{f.reason}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{f.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
