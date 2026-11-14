"use client";

import { Archive, Briefcase, Coins, Recycle, Wrench } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/lib/engineering-observability/page-header";
import { Card, KpiCard } from "@/lib/engineering-observability/ui-atoms";
import {
  appAgeProfile,
  modernizationRoadmap,
  notificationConsolidation,
  portfolioApps,
  portfolioStats,
  redundancyAnalysis,
  retirementCandidates,
  techStackDist,
} from "@/lib/engineering-observability/enterprise-data";
import { cn } from "@/lib/engineering-observability/utils";


const pieColors = ["#00338D", "#0091DA", "#0D9488", "#7C3AED", "#EA580C", "#94A3B8"];

const healthStyles: Record<string, string> = {
  Healthy: "bg-healthy-soft text-healthy border-[color:color-mix(in_oklab,var(--healthy)_30%,transparent)]",
  "At Risk": "bg-warning-soft text-warning border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)]",
  "Needs Attention": "bg-critical-soft text-critical border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)]",
  Redundant: "bg-muted text-muted-foreground border-border",
};

const critStyles: Record<string, string> = {
  "Business Critical": "bg-kpmg-light text-kpmg-blue border-[color:color-mix(in_oklab,var(--kpmg-blue)_30%,transparent)]",
  Important: "bg-info-soft text-info border-[color:color-mix(in_oklab,var(--info)_30%,transparent)]",
  Standard: "bg-muted text-muted-foreground border-border",
  "At Risk": "bg-critical-soft text-critical border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)]",
};

function PortfolioPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Engineering Portfolio"
        subtitle="Application estate intelligence — health, redundancy, modernization and run cost"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Total Applications" value={String(portfolioStats.total)} sub={`${portfolioStats.businessCritical} business critical`} icon={<Briefcase className="h-4 w-4 text-primary" />} />
        <KpiCard label="Healthy" value={String(portfolioStats.healthy)} sub={`${portfolioStats.atRisk} at risk`} tone="healthy" icon={<Wrench className="h-4 w-4 text-healthy" />} />
        <KpiCard label="Redundant" value={String(portfolioStats.redundant)} sub={`${portfolioStats.retirement} retirement candidates`} tone="warning" icon={<Recycle className="h-4 w-4 text-warning" />} />
        <KpiCard label="Annual Run Cost" value={portfolioStats.annualRunCost} sub={`${portfolioStats.potentialSavings} potential savings`} icon={<Coins className="h-4 w-4 text-primary" />} />
        <KpiCard label="Tech Debt Score" value={portfolioStats.techDebtScore} delta={-0.4} sub="lower is better" tone="critical" icon={<Archive className="h-4 w-4 text-critical" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Age profile */}
        <Card title="Application Age Profile" subtitle="Distribution by years in service">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appAgeProfile} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Bar dataKey="count" name="Applications" radius={[4, 4, 0, 0]}>
                  {appAgeProfile.map((_, i) => (
                    <Cell key={i} fill={i >= 3 ? "#DC2626" : i === 2 ? "#EA580C" : "#00338D"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            65 applications are 11+ years old — primary driver of the 7.2/10 tech debt score.
          </p>
        </Card>

        {/* Tech stack */}
        <Card title="Technology Stack Distribution" subtitle="Share of application estate">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={techStackDist} dataKey="share" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={2}>
                  {techStackDist.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} formatter={(v) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {techStackDist.map((t, i) => (
              <span key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: pieColors[i % pieColors.length] }} />
                {t.name} {t.share}%
              </span>
            ))}
          </div>
        </Card>

        {/* Modernization indicators */}
        <Card title="Modernization Indicators" subtitle="Estate transformation progress">
          <ul className="space-y-4">
            {[
              { label: "Modernization Progress", value: portfolioStats.modernization, pct: 35 },
              { label: "Cloud Adoption", value: portfolioStats.cloudAdoption, pct: 62 },
              { label: "Automation Coverage", value: portfolioStats.automation, pct: 48 },
            ].map((m) => (
              <li key={m.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{m.label}</span>
                  <span className="font-bold tabular-nums text-foreground">{m.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${m.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Modernization Roadmap
            </div>
            <ul className="space-y-2">
              {modernizationRoadmap.map((r) => (
                <li key={r.app} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
                  <span className="rounded bg-kpmg-light px-1.5 py-0.5 font-bold text-kpmg-blue">{r.initiative}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">{r.app}</span>
                  <span className="text-muted-foreground">{r.target}</span>
                  <span className="font-semibold text-foreground">{r.timeline}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* App table */}
      <Card title="Application Estate" subtitle="Key applications with health and criticality" bodyClassName="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-[color:color-mix(in_oklab,var(--muted)_50%,transparent)] text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">Application</th>
                <th className="px-4 py-2.5 font-semibold">Domain</th>
                <th className="px-4 py-2.5 font-semibold">Criticality</th>
                <th className="px-4 py-2.5 font-semibold">Health</th>
                <th className="px-4 py-2.5 font-semibold">Tech Stack</th>
                <th className="px-4 py-2.5 font-semibold">Age</th>
                <th className="px-4 py-2.5 font-semibold">Owners</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {portfolioApps.map((a) => (
                <tr key={a.id} className="hover:bg-[color:color-mix(in_oklab,var(--muted)_40%,transparent)]">
                  <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.domain}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", critStyles[a.criticality])}>
                      {a.criticality}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", healthStyles[a.health])}>
                      {a.health}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.techStack}</td>
                  <td className="px-4 py-3 text-xs tabular-nums text-foreground">{a.age}</td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-1.5">
                      {a.owners.map((o) => (
                        <span
                          key={o}
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-kpmg-light text-[9px] font-bold text-kpmg-blue"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Redundancy */}
        <Card title="Redundancy Analysis" subtitle="Duplicated capabilities across the estate">
          <ul className="space-y-2.5">
            {redundancyAnalysis.map((r) => (
              <li key={r.app} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{r.app}</div>
                  <div className="text-[11px] text-muted-foreground">{r.type}</div>
                </div>
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", r.impact === "High" ? "border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)] bg-critical-soft text-critical" : r.impact === "Medium" ? "border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)] bg-warning-soft text-warning" : "border-border bg-muted text-muted-foreground")}>
                  {r.impact}
                </span>
                <span className="font-semibold tabular-nums text-foreground">{r.cost}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Retirement */}
        <Card title="Retirement Candidates" subtitle="Applications recommended for decommission">
          <ul className="space-y-2.5">
            {retirementCandidates.map((r) => (
              <li key={r.app} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{r.app}</div>
                  <div className="text-[11px] text-muted-foreground">{r.reason}</div>
                </div>
                <span className="text-[11px] text-muted-foreground">Risk: {r.risk}</span>
                <span className="font-semibold tabular-nums text-healthy">{r.savings}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Consolidation highlight */}
        <Card title="Consolidation Opportunity" subtitle={notificationConsolidation.app}>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-md bg-muted p-2.5">
              <div className="text-lg font-bold text-foreground">{notificationConsolidation.implementations}</div>
              <div className="text-[10px] text-muted-foreground">implementations</div>
            </div>
            <div className="rounded-md bg-muted p-2.5">
              <div className="text-lg font-bold text-foreground">{notificationConsolidation.stacks}</div>
              <div className="text-[10px] text-muted-foreground">tech stacks</div>
            </div>
            <div className="rounded-md bg-muted p-2.5">
              <div className="text-lg font-bold text-foreground">{notificationConsolidation.annualCost}</div>
              <div className="text-[10px] text-muted-foreground">annual cost</div>
            </div>
            <div className="rounded-md bg-warning-soft p-2.5">
              <div className="text-lg font-bold text-warning">{notificationConsolidation.duplicatedCapability}</div>
              <div className="text-[10px] text-muted-foreground">duplicated capability</div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{notificationConsolidation.recommendation}</p>
          <div className="mt-3 rounded-md border border-[color:color-mix(in_oklab,var(--healthy)_30%,transparent)] bg-healthy-soft p-3 text-xs">
            <strong className="text-healthy">Estimated savings:</strong>{" "}
            <span className="font-semibold text-foreground">{notificationConsolidation.estimatedSavings}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PortfolioPage;
