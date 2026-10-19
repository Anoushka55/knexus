"use client";

import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useSession } from "@/lib/enterprise-architecture/session";
import { Card, Pill, StatTile, ActionBadge, EmptyState } from "@/components/enterprise-architecture/primitives";
import { LayoutGrid } from "lucide-react";

const BASE = "/agents/enterprise-architecture-agent/console";

const ACTION_COLORS: Record<string, string> = {
  Retain: "#16A34A",
  Rehost: "#1E49E2",
  Replatform: "#60A5FA",
  Refactor: "#F59E0B",
  Replace: "#F97316",
  Retire: "#DC2626",
};

export default function DashboardPage() {
  const { timeResult, arbResult, mappingResult, maturityResult, insightsResult, savedReports } = useSession();

  const breakdown = timeResult?.portfolio_summary.action_breakdown ?? {};
  const chartData = Object.entries(breakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">EA Strategy Dashboard</h1>
        <p className="text-sm text-muted-foreground">Portfolio health, governance status, and pipeline progress at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Applications" value={timeResult?.applications.length ?? 0} />
        <StatTile
          label="Total annual cost"
          value={`$${(timeResult?.portfolio_summary.total_annual_cost ?? 0).toLocaleString()}`}
        />
        <StatTile
          label="Potential savings"
          value={`$${(timeResult?.portfolio_summary.potential_savings ?? 0).toLocaleString()}`}
          tone="success"
        />
        <StatTile label="Maturity score" value={maturityResult ? `${maturityResult.overall_maturity_score}/5` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="6R Action Breakdown" className="lg:col-span-1">
          {chartData.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={ACTION_COLORS[d.name] ?? "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                {chartData.map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: ACTION_COLORS[d.name] }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={<LayoutGrid className="w-8 h-8" />} title="No portfolio data yet" body="Run EA Analysis to see the 6R breakdown." />
          )}
        </Card>

        <Card title="Pipeline Status" className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <PipelineTile label="TIME" done={!!timeResult} href={`${BASE}/analysis`} />
            <PipelineTile label="ARB" done={!!arbResult} href={`${BASE}/arb`} value={arbResult?.decision} />
            <PipelineTile label="MAPPING" done={!!mappingResult} href={`${BASE}/mapping`} value={mappingResult?.skipped ? "skipped" : mappingResult?.overall_impact_level} />
            <PipelineTile label="MATURITY" done={!!maturityResult} href={`${BASE}/maturity`} value={maturityResult ? `${maturityResult.overall_maturity_score}/5` : undefined} />
            <PipelineTile label="INSIGHTS" done={!!insightsResult} href={`${BASE}/command-center`} value={insightsResult?.risk_profile?.overall_risk} />
            <PipelineTile label="REPORT" done={savedReports.length > 0} href={`${BASE}/reports`} value={savedReports.length ? `${savedReports.length} saved` : undefined} />
          </div>
        </Card>
      </div>

      {timeResult && (
        <Card title="Portfolio" subtitle={`Top apps by cost — ${timeResult.applications.length} total`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-1.5 pr-3">Name</th>
                  <th className="py-1.5 pr-3">Category</th>
                  <th className="py-1.5 pr-3">Action</th>
                  <th className="py-1.5 pr-3">Annual Cost</th>
                </tr>
              </thead>
              <tbody>
                {timeResult.applications
                  .slice()
                  .sort((a, b) => (b.annual_cost ?? 0) - (a.annual_cost ?? 0))
                  .slice(0, 8)
                  .map((a) => (
                    <tr key={a.id} className="border-b border-border/60">
                      <td className="py-1.5 pr-3 font-medium">{a.name}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{a.category}</td>
                      <td className="py-1.5 pr-3">
                        <ActionBadge action={a.rationalization_action} />
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">{a.annual_cost ? `$${a.annual_cost.toLocaleString()}` : "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!timeResult && (
        <Card>
          <EmptyState
            icon={<LayoutGrid className="w-10 h-10" />}
            title="Nothing to show yet"
            body="Head to EA Analysis to upload a portfolio and start the pipeline."
          />
        </Card>
      )}
    </div>
  );
}

function PipelineTile({ label, done, href, value }: { label: string; done: boolean; href: string; value?: string }) {
  return (
    <Link href={href} className="border border-border rounded-ea-sm p-3 block hover:border-navy transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold text-navy">{label}</span>
        <Pill tone={done ? "success" : "muted"}>{done ? "done" : "pending"}</Pill>
      </div>
      <div className="text-xs text-muted-foreground truncate">{value ?? "—"}</div>
    </Link>
  );
}
