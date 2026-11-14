"use client";

import { AlertOctagon, CloudCog, PiggyBank, ShieldAlert, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
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
  costByDomain,
  costByProvider,
  costOpportunities,
  recentAnomalies,
  riskFindings,
  spendTrend,
} from "@/lib/engineering-observability/enterprise-data";
import { cn } from "@/lib/engineering-observability/utils";


const pieColors = ["#00338D", "#0091DA", "#0D9488", "#7C3AED", "#EA580C", "#94A3B8"];

const impactStyles: Record<string, string> = {
  High: "bg-critical-soft text-critical border-[color:color-mix(in_oklab,var(--critical)_30%,transparent)]",
  Medium: "bg-warning-soft text-warning border-[color:color-mix(in_oklab,var(--warning)_30%,transparent)]",
  Low: "bg-muted text-muted-foreground border-border",
};

function CostRiskPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Cost & Risk"
        subtitle="Cloud economics, optimization opportunities and engineering risk posture"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Monthly Cloud Spend" value="£207K" delta={6.4} invertDelta icon={<CloudCog className="h-4 w-4 text-primary" />} />
        <KpiCard label="Annual Run Cost" value="£2.48M" delta={4.1} invertDelta icon={<TrendingUp className="h-4 w-4 text-warning" />} />
        <KpiCard label="Optimization Opportunity" value="£412K" sub="per year" tone="healthy" icon={<PiggyBank className="h-4 w-4 text-healthy" />} />
        <KpiCard label="Cost Anomalies (24h)" value="5" delta={2} invertDelta tone="warning" icon={<AlertOctagon className="h-4 w-4 text-warning" />} />
        <KpiCard label="Open Risk Findings" value="100" delta={-8} tone="critical" icon={<ShieldAlert className="h-4 w-4 text-critical" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Spend trend */}
        <Card title="Cloud Spend Trend" subtitle="Daily spend by category (£K) — last 30 days" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendTrend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="compute" stackId="1" stroke="#00338D" fill="#00338D" fillOpacity={0.7} name="Compute" />
                <Area type="monotone" dataKey="database" stackId="1" stroke="#0091DA" fill="#0091DA" fillOpacity={0.7} name="Database" />
                <Area type="monotone" dataKey="storage" stackId="1" stroke="#0D9488" fill="#0D9488" fillOpacity={0.7} name="Storage" />
                <Area type="monotone" dataKey="network" stackId="1" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.7} name="Network" />
                <Area type="monotone" dataKey="other" stackId="1" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.7} name="Other" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Breakdowns */}
        <div className="space-y-6">
          <Card title="Cost by Business Domain" subtitle="Annualised (£K)">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costByDomain} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={2}>
                    {costByDomain.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} formatter={(v) => [`£${v}K`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-1 space-y-1">
              {costByDomain.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-sm" style={{ background: pieColors[i % pieColors.length] }} />
                  <span className="flex-1 text-foreground">{d.name}</span>
                  <span className="font-semibold tabular-nums text-foreground">£{d.value}K</span>
                  <span className="text-muted-foreground">{d.share}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Cost by Provider" subtitle="Multi-cloud distribution">
            <ul className="space-y-2">
              {costByProvider.map((p, i) => (
                <li key={p.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: pieColors[i % pieColors.length] }} />
                  <span className="w-14 font-medium text-foreground">{p.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: p.share, background: pieColors[i % pieColors.length] }} />
                  </div>
                  <span className="w-16 text-right text-xs font-semibold tabular-nums text-foreground">£{p.value}K</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Optimization opportunities */}
      <Card title="Optimization Opportunities" subtitle="Ranked by annual savings · mapped to services and capabilities" bodyClassName="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-[color:color-mix(in_oklab,var(--muted)_50%,transparent)] text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">Opportunity</th>
                <th className="px-4 py-2.5 font-semibold">Resource</th>
                <th className="px-4 py-2.5 font-semibold">Service</th>
                <th className="px-4 py-2.5 font-semibold">Capability</th>
                <th className="px-4 py-2.5 font-semibold">Impact</th>
                <th className="px-4 py-2.5 font-semibold">Effort</th>
                <th className="px-4 py-2.5 text-right font-semibold">Annual Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {costOpportunities.map((o) => (
                <tr key={o.id} className="hover:bg-[color:color-mix(in_oklab,var(--muted)_40%,transparent)]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{o.title}</div>
                    <div className="text-xs text-muted-foreground">{o.workload}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{o.resource}</td>
                  <td className="px-4 py-3 text-xs text-foreground">{o.service}</td>
                  <td className="px-4 py-3 text-xs text-foreground">{o.capability}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", impactStyles[o.impact])}>{o.impact}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", impactStyles[o.effort])}>{o.effort}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-healthy">{o.annualSavings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk findings */}
        <Card title="Risk Findings" subtitle="Security & compliance posture across cloud estate">
          <ul className="space-y-2.5">
            {riskFindings.map((r) => (
              <li key={r.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-16 rounded border px-1.5 py-0.5 text-center text-[10px] font-bold",
                    impactStyles[r.severity],
                  )}
                >
                  {r.severity}
                </span>
                <span className="flex-1 text-sm text-foreground">{r.label}</span>
                <span className="text-sm font-bold tabular-nums text-foreground">{r.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Anomalies */}
        <Card title="Recent Cost Anomalies" subtitle="AI-detected spend anomalies, last 24 hours">
          <ul className="space-y-2.5">
            {recentAnomalies.map((a) => (
              <li key={a.label} className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                <AlertOctagon className="h-4 w-4 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-foreground">{a.label}</div>
                  <div className="text-[11px] text-muted-foreground">{a.time}</div>
                </div>
                <span className="text-xs font-semibold tabular-nums text-foreground">{a.cost}</span>
                <span className="text-xs font-bold text-critical">{a.delta}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default CostRiskPage;
