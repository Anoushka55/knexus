"use client";

import { Boxes, Clock, Code2, FileCode2, GitBranch, Play, RefreshCw, ScanLine } from "lucide-react";
import { useState } from "react";

import { BarList, DonutStat, TrendLine } from "@/lib/legacy-modernization/charts";
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

const kpis = [
  { label: "Repositories Scanned", value: "248", delta: "+18", deltaLabel: "this month", direction: "up" as const, tone: "brand" as Tone, icon: GitBranch },
  { label: "Lines of Code", value: "84.6M", delta: "+1.2M", deltaLabel: "indexed", direction: "up" as const, tone: "intel" as Tone, icon: Code2 },
  { label: "Languages Detected", value: "12", deltaLabel: "across 6 domains", direction: "flat" as const, tone: "success" as Tone, icon: FileCode2 },
  { label: "Technical Debt", value: "$42.6M", delta: "-8.2%", deltaLabel: "vs last scan", direction: "down" as const, tone: "danger" as Tone, icon: Boxes },
  { label: "Code Duplication", value: "14.2", suffix: "%", delta: "-1.6%", deltaLabel: "improved", direction: "down" as const, tone: "warning" as Tone, icon: ScanLine },
  { label: "Last Scan Duration", value: "2h 34m", deltaLabel: "completed 9 hrs ago", direction: "flat" as const, tone: "neutral" as Tone, icon: Clock },
];

const languages = [
  { name: "Java", value: 28.4, color: "var(--chart-1)", display: "28.4M", share: "34%" },
  { name: "COBOL", value: 14.2, color: "var(--chart-4)", display: "14.2M", share: "17%" },
  { name: "C# / .NET", value: 13.6, color: "var(--chart-5)", display: "13.6M", share: "16%" },
  { name: "JavaScript", value: 11.8, color: "var(--chart-3)", display: "11.8M", share: "14%" },
  { name: "Python", value: 8.4, color: "var(--chart-2)", display: "8.4M", share: "10%" },
  { name: "PL/SQL & Other", value: 8.2, color: "var(--chart-6)", display: "8.2M", share: "9%" },
];

const debtCategories = [
  { label: "Architecture Debt", value: 14.8, display: "$14.8M", share: "35%" },
  { label: "Code Quality", value: 9.6, display: "$9.6M", share: "23%" },
  { label: "Outdated Dependencies", value: 7.4, display: "$7.4M", share: "17%" },
  { label: "Test Coverage Gaps", value: 5.2, display: "$5.2M", share: "12%" },
  { label: "Documentation", value: 3.1, display: "$3.1M", share: "7%" },
  { label: "Infrastructure", value: 2.5, display: "$2.5M", share: "6%" },
];

const scanTrend = [
  { label: "Mar", complexity: 34, duplication: 18.6, coverage: 52 },
  { label: "Apr", complexity: 33, duplication: 18.1, coverage: 56 },
  { label: "May", complexity: 31, duplication: 17.2, coverage: 59 },
  { label: "Jun", complexity: 30, duplication: 16.4, coverage: 63 },
  { label: "Jul", complexity: 28, duplication: 15.3, coverage: 68 },
  { label: "Aug", complexity: 26, duplication: 14.2, coverage: 72 },
];

type Repo = {
  name: string;
  domain: string;
  language: string;
  loc: string;
  health: number;
  complexity: string;
  coverage: number;
  debt: string;
  status: "Scanned" | "Scanning" | "Queued";
};

const repos: Repo[] = [
  { name: "billing-core", domain: "Finance & Billing", language: "Java 8", loc: "1.84M", health: 42, complexity: "Very High", coverage: 38, debt: "$6.2M", status: "Scanned" },
  { name: "claims-batch", domain: "Insurance Ops", language: "COBOL", loc: "2.46M", health: 31, complexity: "Critical", coverage: 12, debt: "$4.8M", status: "Scanned" },
  { name: "crm-platform", domain: "Customer & CRM", language: "C#", loc: "1.12M", health: 64, complexity: "High", coverage: 61, debt: "$3.1M", status: "Scanning" },
  { name: "inventory-svc", domain: "Supply Chain", language: "PHP 7.2", loc: "486K", health: 58, complexity: "Medium", coverage: 78, debt: "$2.4M", status: "Scanned" },
  { name: "payments-gateway", domain: "Finance & Billing", language: "Java 17", loc: "742K", health: 88, complexity: "Low", coverage: 91, debt: "$0.4M", status: "Scanned" },
  { name: "hr-workday-bridge", domain: "Human Resources", language: "Python", loc: "218K", health: 76, complexity: "Medium", coverage: 74, debt: "$0.9M", status: "Queued" },
  { name: "digital-portal-web", domain: "Digital Channels", language: "AngularJS", loc: "612K", health: 49, complexity: "High", coverage: 44, debt: "$2.8M", status: "Scanned" },
];

const filters = ["All Repositories", "Critical Debt", "End-of-Support", "Low Coverage"];

function healthTone(score: number): Tone {
  return score >= 70 ? "success" : score >= 50 ? "warning" : "danger";
}

export default function DiscoveryPage() {
  const [filter, setFilter] = useState(filters[0]);
  const visible = repos.filter((r) => {
    if (filter === "Critical Debt") return parseFloat(r.debt.replace(/[$M]/g, "")) >= 2.4;
    if (filter === "End-of-Support") return /8|COBOL|7\.2|AngularJS/.test(r.language);
    if (filter === "Low Coverage") return r.coverage < 60;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Discovery & Code Analysis"
        subtitle="Automated scanning of source repositories to inventory languages, quantify debt and surface legacy exposure."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <RefreshCw className="size-3.5" /> Re-index Estate
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <Play className="size-3.5" /> New Scan
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/planning">Plan remediation</PanelLink>}>
        Architecture debt concentrated in <span className="font-semibold">billing-core</span> and{" "}
        <span className="font-semibold">claims-batch</span> accounts for 26% of total estate debt — addressing both
        unlocks 41 downstream services.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Language Distribution" subtitle="Lines of code by language">
          <DonutStat data={languages} total="84.6M" totalLabel="Lines" />
        </Panel>

        <Panel title="Technical Debt Breakdown" subtitle="Estimated remediation cost by category">
          <BarList items={debtCategories} color="var(--chart-4)" />
        </Panel>

        <Panel title="Code Quality Trend" subtitle="Six-month rolling scan results">
          <TrendLine
            data={scanTrend}
            height={218}
            showLegend
            series={[
              { key: "coverage", name: "Coverage %", color: "var(--chart-2)" },
              { key: "duplication", name: "Duplication %", color: "var(--chart-3)" },
              { key: "complexity", name: "Avg Complexity", color: "var(--chart-4)" },
            ]}
          />
        </Panel>
      </div>

      <Panel
        title="Repository Health"
        subtitle={`${visible.length} of ${repos.length} repositories`}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  filter === f
                    ? "border-[color:color-mix(in_oklch,var(--brand)_30%,transparent)] bg-brand-soft text-brand"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
        bodyClassName="px-0 pb-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Repository</th>
                <th className="px-4 py-2.5 font-semibold">Domain</th>
                <th className="px-4 py-2.5 font-semibold">Language</th>
                <th className="px-4 py-2.5 font-semibold">LOC</th>
                <th className="px-4 py-2.5 font-semibold">Health</th>
                <th className="px-4 py-2.5 font-semibold">Complexity</th>
                <th className="px-4 py-2.5 font-semibold">Coverage</th>
                <th className="px-4 py-2.5 font-semibold">Debt</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.name} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                  <td className="num px-5 py-3 font-semibold text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.domain}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.language}</td>
                  <td className="num px-4 py-3 text-muted-foreground">{r.loc}</td>
                  <td className="px-4 py-3">
                    <ScorePill score={r.health} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={r.complexity === "Critical" || r.complexity === "Very High" ? "danger" : r.complexity === "High" ? "warning" : "success"}>
                      {r.complexity}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-16">
                        <ProgressBar value={r.coverage} tone={healthTone(r.coverage)} />
                      </span>
                      <span className="num text-muted-foreground">{r.coverage}%</span>
                    </div>
                  </td>
                  <td className="num px-4 py-3 font-semibold text-foreground">{r.debt}</td>
                  <td className="px-5 py-3">
                    <StatusPill tone={r.status === "Scanned" ? "success" : r.status === "Scanning" ? "brand" : "neutral"}>
                      {r.status}
                    </StatusPill>
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
