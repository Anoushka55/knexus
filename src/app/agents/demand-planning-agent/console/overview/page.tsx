"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/lib/demand-planning/ui/Card";
import { Badge, rootCauseToVariant } from "@/lib/demand-planning/ui/Badge";
import { FilterBar } from "@/lib/demand-planning/ui/FilterBar";
import { AgentInsightCard } from "@/lib/demand-planning/ui/AgentInsightCard";
import { generateDailyFA, SKU_SEGMENTS, getSegmentColor } from "@/lib/demand-planning/data/mockData";
import { DEFAULT_FILTERS, applyFilters, Filters } from "@/lib/demand-planning/data/options";
import { useDataContext } from "@/lib/demand-planning/state/dataContext";
import { useOverrides, getEffectiveStatus } from "@/lib/demand-planning/state/overrideContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from "recharts";
import { Target, Activity, AlertTriangle, Package, ArrowRight } from "lucide-react";

const BASE = "/agents/demand-planning-agent/console";

export default function OverviewPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const { exceptionStatusOverrides } = useOverrides();
  const { activeDataset } = useDataContext();

  const filtered = useMemo(() => applyFilters(activeDataset, filters), [activeDataset, filters]);
  const latestPeriod = useMemo(() => [...filtered].map((r) => r.period).sort().pop(), [filtered]);
  const latest = useMemo(() => filtered.filter((r) => r.period === latestPeriod), [filtered, latestPeriod]);

  const avgFA = latest.length ? latest.reduce((s, r) => s + r.fa_pct, 0) / latest.length : 0;
  const avgBiasAbs = latest.length ? latest.reduce((s, r) => s + Math.abs(r.bias_pct), 0) / latest.length : 0;
  const openExceptions = filtered.filter((r) => {
    const status = getEffectiveStatus(r, exceptionStatusOverrides);
    return status === "Open" || status === "Escalated";
  }).length;
  const lowCoverage = latest.filter((r) => r.coverage_weeks < 2).length;

  // Trend data — monthly OR daily based on period filter
  const trendData = useMemo(() => {
    if (filters.period !== "all" && filtered.length > 0) {
      // Daily drill-down: pick first matching record's daily curve
      const rec = filtered[0];
      const daily = generateDailyFA(rec);
      return daily.map((d) => ({ x: d.date, fa: d.fa_pct }));
    }
    // Monthly
    const byMonth: Record<string, { sum: number; n: number }> = {};
    filtered.forEach((r) => {
      if (!byMonth[r.period]) byMonth[r.period] = { sum: 0, n: 0 };
      byMonth[r.period].sum += r.fa_pct;
      byMonth[r.period].n += 1;
    });
    return Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([p, v]) => ({ x: p, fa: v.sum / v.n }));
  }, [filtered, filters.period]);

  const topIssues = useMemo(() => {
    return latest
      .filter((r) => r.root_cause_tag !== "None")
      .sort((a, b) => a.fa_pct - b.fa_pct)
      .slice(0, 5);
  }, [latest]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">Overview</div>
        <h1 className="text-3xl font-extrabold text-navy mt-1">Planning Overview</h1>
        <p className="text-sm text-muted mt-1">
          Monitor real-time demand performance and exception alerts.
        </p>
      </div>

      <AgentInsightCard
        sentiment="negative"
        text="Forecast accuracy has dipped slightly over the last 3 months, driven mainly by Promo and Data Quality root causes. The agent recommends reviewing promo realization factors for SKUs in the CleanMax brand."
      />

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Forecast Accuracy"
          value={`${avgFA.toFixed(1)}%`}
          status={avgFA >= 80 ? "success" : avgFA >= 70 ? "warning" : "critical"}
          icon={<Activity size={18} />}
          statusLabel={avgFA >= 80 ? "On Track" : avgFA >= 70 ? "Watch" : "Below Target"}
          target="v/s target 80%"
        />
        <KpiCard
          label="Forecast Bias"
          value={`${avgBiasAbs.toFixed(1)}%`}
          status={avgBiasAbs <= 10 ? "success" : avgBiasAbs <= 20 ? "warning" : "critical"}
          icon={<Target size={18} />}
          statusLabel={avgBiasAbs <= 10 ? "Within Band" : "Off Target"}
          target="v/s target ≤10%"
        />
        <KpiCard
          label="Open Exceptions"
          value={`${openExceptions}`}
          status={openExceptions > 6 ? "critical" : openExceptions > 2 ? "warning" : "success"}
          icon={<AlertTriangle size={18} />}
          statusLabel={openExceptions > 0 ? "Action Required" : "All Clear"}
        />
        <KpiCard
          label="Low Coverage SKUs"
          value={`${lowCoverage}`}
          status={lowCoverage > 0 ? "critical" : "success"}
          icon={<Package size={18} />}
          statusLabel={lowCoverage > 0 ? "Stock-out Risk" : "Healthy"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Forecast Accuracy Trend"
            subtitle={filters.period === "all" ? "12-month rolling trend" : `Daily trend for ${filters.period}`}
            icon={<Activity size={18} />}
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7DDCB" />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: "#7A7390" }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#7A7390" }} />
                <ReferenceArea y1={85} y2={100} fill="#2E8B57" fillOpacity={0.08} />
                <Tooltip
                  contentStyle={{ background: "#2A2755", border: "none", borderRadius: 8, color: "white", fontSize: 12 }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "FA"]}
                />
                <Line type="monotone" dataKey="fa" stroke="#E0355C" strokeWidth={2.5} dot={{ r: 3, fill: "#E0355C" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Top Issues"
            subtitle="Worst performing SKU / Depot / Account combinations"
            icon={<AlertTriangle size={18} />}
            action={
              <Link href={`${BASE}/exceptions`} className="text-xs font-semibold text-coral hover:text-coral-dark flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted text-left">
                  <th className="font-bold pb-2 pr-3">SKU / Account</th>
                  <th className="font-bold pb-2 pr-3">Depot</th>
                  <th className="font-bold pb-2 pr-3">Segment</th>
                  <th className="font-bold pb-2 pr-2 text-right">FA%</th>
                  <th className="font-bold pb-2 pr-2 text-right">Bias%</th>
                  <th className="font-bold pb-2 text-right">Root Cause</th>
                </tr>
              </thead>
              <tbody>
                {topIssues.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-6 text-muted text-xs">No issues in current filter selection.</td></tr>
                )}
                {topIssues.map((r, i) => {
                  const seg = SKU_SEGMENTS[r.sku_id];
                  const segColor = getSegmentColor(seg.segment);
                  return (
                    <tr key={i} className="border-t border-[#F2E9D8]">
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold text-navy text-[13px]">{r.sku_name}</div>
                        <div className="text-[11px] text-muted">{r.account_name}</div>
                      </td>
                      <td className="text-xs text-navy/80 pr-3">{r.depot_id}</td>
                      <td className="pr-3"><Badge variant="navy" className={`${segColor.bg} ${segColor.text} border-transparent`}>{seg.segment}</Badge></td>
                      <td className="text-right font-mono text-critical font-bold">{r.fa_pct.toFixed(0)}%</td>
                      <td className="text-right font-mono text-critical font-bold">{r.bias_pct.toFixed(0)}%</td>
                      <td className="text-right"><Badge variant={rootCauseToVariant(r.root_cause_tag)}>{r.root_cause_tag}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, status, icon, statusLabel, target }: {
  label: string; value: string;
  status: "success" | "warning" | "critical";
  icon: React.ReactNode;
  statusLabel: string;
  target?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E7DDCB] p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
        <div className="text-teal">{icon}</div>
      </div>
      <div className="text-3xl font-extrabold text-navy">{value}</div>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant={status}>{statusLabel}</Badge>
        {target && <span className="text-[10px] text-muted">{target}</span>}
      </div>
    </div>
  );
}
