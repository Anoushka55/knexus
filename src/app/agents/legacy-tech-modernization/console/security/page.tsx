"use client";

import { AlertTriangle, Bug, FileCheck2, Lock, ScanLine, ShieldAlert, ShieldCheck } from "lucide-react";

import { BarList, DonutStat, TrendLine } from "@/lib/legacy-modernization/charts";
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

const severity = [
  { name: "Critical", value: 42, color: "var(--chart-4)" },
  { name: "High", value: 118, color: "var(--chart-3)" },
  { name: "Medium", value: 186, color: "var(--chart-1)" },
  { name: "Low", value: 89, color: "var(--chart-2)" },
];

const riskTrend = [
  { label: "Mar", critical: 68, high: 164, medium: 242 },
  { label: "Apr", critical: 62, high: 152, medium: 231 },
  { label: "May", critical: 58, high: 141, medium: 218 },
  { label: "Jun", critical: 51, high: 134, medium: 206 },
  { label: "Jul", critical: 46, high: 126, medium: 194 },
  { label: "Aug", critical: 42, high: 118, medium: 186 },
];

const cves = [
  { id: "CVE-2024-38271", pkg: "log4j-core 2.14.1", severity: "Critical", cvss: 9.8, app: "Billing Platform", age: "6 days", fix: "Upgrade to 2.23.1" },
  { id: "CVE-2024-21733", pkg: "tomcat-embed-core 9.0.62", severity: "Critical", cvss: 9.1, app: "Customer Portal", age: "11 days", fix: "Upgrade to 9.0.86" },
  { id: "CVE-2023-44487", pkg: "netty-codec-http2 4.1.86", severity: "High", cvss: 8.6, app: "Payments Gateway", age: "3 days", fix: "Upgrade to 4.1.100" },
  { id: "CVE-2024-29025", pkg: "spring-web 5.3.20", severity: "High", cvss: 8.2, app: "CRM Platform", age: "18 days", fix: "Upgrade to 5.3.34" },
  { id: "CVE-2023-34034", pkg: "spring-security 5.7.3", severity: "High", cvss: 7.9, app: "Claims Processing", age: "24 days", fix: "Upgrade to 5.7.10" },
  { id: "CVE-2024-25710", pkg: "commons-compress 1.21", severity: "Medium", cvss: 6.5, app: "Inventory Service", age: "9 days", fix: "Upgrade to 1.26.0" },
];

const compliance = [
  { framework: "SOC 2 Type II", score: 94, tone: "success" as Tone, status: "Compliant" },
  { framework: "PCI DSS 4.0", score: 81, tone: "warning" as Tone, status: "Gaps Identified" },
  { framework: "GDPR", score: 89, tone: "success" as Tone, status: "Compliant" },
  { framework: "ISO 27001", score: 87, tone: "success" as Tone, status: "Compliant" },
  { framework: "HIPAA", score: 68, tone: "danger" as Tone, status: "Remediation Required" },
];

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        title="Security & Compliance"
        subtitle="Vulnerability exposure, remediation velocity and regulatory posture tied to the applications being modernized."
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-secondary">
              <FileCheck2 className="size-3.5" /> Compliance Report
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-bright">
              <ScanLine className="size-3.5" /> Run Security Scan
            </button>
          </>
        }
      />

      <InsightBar action={<PanelLink to="/refactoring">Queue upgrade</PanelLink>}>
        Three transitive dependency upgrades on Billing Platform close 61% of critical exposure — all are covered by
        existing contract tests, so the change carries low regression risk.
      </InsightBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Security Score" value="72" suffix="/100" delta="+5" deltaLabel="vs last month" direction="up" tone="warning" icon={ShieldCheck} />
        <KpiCard label="Open Vulnerabilities" value="435" delta="-89" deltaLabel="remediated" direction="down" tone="danger" icon={Bug} />
        <KpiCard label="Critical Findings" value="42" delta="-9" deltaLabel="this month" direction="down" tone="danger" icon={ShieldAlert} />
        <KpiCard label="Mean Time to Remediate" value="11.4" suffix="d" delta="-2.6d" deltaLabel="faster" direction="down" tone="success" icon={AlertTriangle} />
        <KpiCard label="Encrypted Data Stores" value="86" suffix="%" delta="+4%" deltaLabel="coverage" direction="up" tone="intel" icon={Lock} />
        <KpiCard label="Compliance Coverage" value="84" suffix="%" delta="+3%" deltaLabel="frameworks met" direction="up" tone="success" icon={FileCheck2} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Vulnerability Severity Distribution" subtitle="435 open findings">
          <DonutStat data={severity} total="435" totalLabel="Findings" />
        </Panel>

        <Panel title="Risk Trend" subtitle="Open findings by severity, six months" className="xl:col-span-2">
          <TrendLine
            data={riskTrend}
            height={218}
            showLegend
            series={[
              { key: "critical", name: "Critical", color: "var(--chart-4)" },
              { key: "high", name: "High", color: "var(--chart-3)" },
              { key: "medium", name: "Medium", color: "var(--chart-1)" },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Critical & High CVEs" subtitle="Mapped to owning applications" className="xl:col-span-2" bodyClassName="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="border-y bg-[color:color-mix(in_oklch,var(--secondary)_60%,transparent)] text-[11px] tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">CVE</th>
                  <th className="px-4 py-2.5 font-semibold">Package</th>
                  <th className="px-4 py-2.5 font-semibold">Severity</th>
                  <th className="px-4 py-2.5 font-semibold">CVSS</th>
                  <th className="px-4 py-2.5 font-semibold">Application</th>
                  <th className="px-4 py-2.5 font-semibold">Age</th>
                  <th className="px-5 py-2.5 font-semibold">Recommended Fix</th>
                </tr>
              </thead>
              <tbody>
                {cves.map((c) => (
                  <tr key={c.id} className="border-b transition-colors last:border-0 hover:bg-[color:color-mix(in_oklch,var(--secondary)_40%,transparent)]">
                    <td className="num px-5 py-3 font-semibold text-foreground">{c.id}</td>
                    <td className="num px-4 py-3 text-muted-foreground">{c.pkg}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={c.severity === "Critical" ? "danger" : c.severity === "High" ? "warning" : "neutral"}>
                        {c.severity}
                      </StatusPill>
                    </td>
                    <td className="num px-4 py-3 font-semibold text-foreground">{c.cvss}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.app}</td>
                    <td className="num px-4 py-3 text-muted-foreground">{c.age}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Compliance Frameworks" subtitle="Control coverage by framework">
            <ul className="space-y-3 text-xs">
              {compliance.map((c) => (
                <li key={c.framework}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-foreground">{c.framework}</span>
                    <StatusPill tone={c.tone}>{c.status}</StatusPill>
                  </div>
                  <ProgressBar value={c.score} tone={c.tone} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Exposure by Domain" subtitle="Open findings">
            <BarList
              color="var(--chart-4)"
              items={[
                { label: "Finance & Billing", value: 148, display: "148" },
                { label: "Insurance Ops", value: 112, display: "112" },
                { label: "Digital Channels", value: 76, display: "76" },
                { label: "Customer & CRM", value: 58, display: "58" },
                { label: "Supply Chain", value: 41, display: "41" },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
