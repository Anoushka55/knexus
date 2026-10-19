"use client";
import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/lib/demand-planning/ui/Card";
import { Badge } from "@/lib/demand-planning/ui/Badge";
import { Button } from "@/lib/demand-planning/ui/Button";
import { FilterBar } from "@/lib/demand-planning/ui/FilterBar";
import { AgentInsightCard } from "@/lib/demand-planning/ui/AgentInsightCard";
import { generateDailyFA } from "@/lib/demand-planning/data/mockData";
import { DEFAULT_FILTERS, applyFilters, Filters } from "@/lib/demand-planning/data/options";
import { useDataContext } from "@/lib/demand-planning/state/dataContext";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, Legend } from "recharts";
import { ShoppingCart, Percent, TrendingUp, TrendingDown, Target } from "lucide-react";

export default function KpiDemandSensingPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const { activeDataset } = useDataContext();
  const filtered = useMemo(() => applyFilters(activeDataset, filters), [activeDataset, filters]);

  const faTrend = useMemo(() => {
    if (filters.period !== "all" && filtered.length > 0) {
      return generateDailyFA(filtered[0]).map((d) => ({ x: d.date, val: d.fa_pct }));
    }
    const byM: Record<string, { sum: number; n: number }> = {};
    filtered.forEach((r) => {
      if (!byM[r.period]) byM[r.period] = { sum: 0, n: 0 };
      byM[r.period].sum += r.fa_pct;
      byM[r.period].n += 1;
    });
    return Object.entries(byM).sort().map(([p, v]) => ({ x: p, val: v.sum / v.n }));
  }, [filtered, filters.period]);

  const biasTrend = useMemo(() => {
    const byM: Record<string, { sum: number; n: number }> = {};
    filtered.forEach((r) => {
      if (!byM[r.period]) byM[r.period] = { sum: 0, n: 0 };
      byM[r.period].sum += r.bias_pct;
      byM[r.period].n += 1;
    });
    return Object.entries(byM).sort().map(([p, v]) => ({ x: p, val: v.sum / v.n }));
  }, [filtered]);

  const demandSensing = useMemo(() => {
    const byM: Record<string, { sellIn: number; offtake: number }> = {};
    filtered.forEach((r) => {
      if (!byM[r.period]) byM[r.period] = { sellIn: 0, offtake: 0 };
      byM[r.period].sellIn += r.sell_in_qty;
      byM[r.period].offtake += r.offtake_qty;
    });
    return Object.entries(byM).sort().slice(-6).map(([p, v]) => ({ x: p, sellIn: v.sellIn, offtake: v.offtake }));
  }, [filtered]);

  const offtakeDelta = useMemo(() => {
    if (demandSensing.length < 2) return 0;
    const recent = demandSensing.slice(-3);
    const avgOff = recent.reduce((s, r) => s + r.offtake, 0) / recent.length;
    const avgSell = recent.reduce((s, r) => s + r.sellIn, 0) / recent.length;
    return ((avgOff - avgSell) / avgSell) * 100;
  }, [demandSensing]);

  const promoPeriods = filtered.filter((r) => r.promo_flag).slice(0, 5);

  const latestFA = faTrend.length ? faTrend[faTrend.length - 1].val : 0;
  const latestBias = biasTrend.length ? biasTrend[biasTrend.length - 1].val : 0;
  const inBand = latestFA >= 85 && Math.abs(latestBias) <= 5;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">DemandIQ Agent · Core Calculations</div>
        <h1 className="text-3xl font-extrabold text-navy mt-1">KPI &amp; Demand Sensing</h1>
        <p className="text-sm text-muted mt-1">Analyze Forecast Accuracy (FA%) and Bias trends against target bands.</p>
      </div>

      <AgentInsightCard
        sentiment="positive"
        text="Bias has remained within ±5% target band for 5 consecutive months — demand sensing calibration is performing well. Continue current realization factor weights."
      />

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Forecast Accuracy (FA %)" subtitle="Target: ≥ 85% (shaded green band)" icon={<TrendingUp size={18} />} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={faTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7DDCB" />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: "#7A7390" }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#7A7390" }} />
                <ReferenceArea y1={85} y2={100} fill="#2E8B57" fillOpacity={0.1} />
                <Tooltip contentStyle={{ background: "#2A2755", border: "none", borderRadius: 8, color: "white", fontSize: 12 }} formatter={(v: number) => [`${v.toFixed(1)}%`, "FA"]} />
                <Line type="monotone" dataKey="val" stroke="#E0355C" strokeWidth={2.5} dot={{ r: 3, fill: "#E0355C" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Bias %" subtitle="Target: ± 5% (shaded green band)" icon={<Target size={18} />} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={biasTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7DDCB" />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: "#7A7390" }} />
                <YAxis domain={[-50, 50]} tick={{ fontSize: 11, fill: "#7A7390" }} />
                <ReferenceArea y1={-5} y2={5} fill="#2E8B57" fillOpacity={0.1} />
                <Tooltip contentStyle={{ background: "#2A2755", border: "none", borderRadius: 8, color: "white", fontSize: 12 }} formatter={(v: number) => [`${v.toFixed(1)}%`, "Bias"]} />
                <Line type="monotone" dataKey="val" stroke="#17A2A0" strokeWidth={2.5} dot={{ r: 3, fill: "#17A2A0" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-widest text-muted font-bold">Latest Period Status</div>
          <Badge variant={inBand ? "success" : "warning"}>
            {inBand ? "Within Target Bands" : "Breaching Target Band"}
          </Badge>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="text-navy">
            <span className="text-muted">FA: </span>
            <span className="font-bold">{latestFA.toFixed(1)}%</span>
          </div>
          <div className="text-navy">
            <span className="text-muted">Bias: </span>
            <span className="font-bold">{latestBias.toFixed(1)}%</span>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Demand Sensing: Sell-in vs Offtake" subtitle="Last 6 months volume comparison" icon={<ShoppingCart size={18} />} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandSensing} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7DDCB" />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: "#7A7390" }} />
                <YAxis tick={{ fontSize: 11, fill: "#7A7390" }} />
                <Tooltip contentStyle={{ background: "#2A2755", border: "none", borderRadius: 8, color: "white", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sellIn" name="Sell-in" fill="#2A2755" radius={[4, 4, 0, 0]} />
                <Bar dataKey="offtake" name="Offtake" fill="#17A2A0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {Math.abs(offtakeDelta) > 8 && (
            <div className={`mt-3 rounded-lg p-3 text-xs flex items-start gap-2 ${offtakeDelta > 0 ? "bg-warning/10 border border-warning/30 text-navy" : "bg-info/10 border border-info/30 text-navy"}`}>
              {offtakeDelta > 0 ? <TrendingUp size={16} className="text-warning flex-shrink-0 mt-0.5" /> : <TrendingDown size={16} className="text-info flex-shrink-0 mt-0.5" />}
              <span>
                <strong>Demand signal:</strong> Offtake is trending {offtakeDelta > 0 ? "above" : "below"} sell-in by{" "}
                <strong>{Math.abs(offtakeDelta).toFixed(1)}%</strong> over the last 3 months. Agent recommends adjusting
                short-horizon forecast {offtakeDelta > 0 ? "upward" : "downward"}.
              </span>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Promo Realization" subtitle="Historical and projected promo lift analysis" icon={<Percent size={18} />} />
          {promoPeriods.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted">No promotions in current filter selection.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted text-left">
                  <th className="font-bold pb-2 pr-3">Period</th>
                  <th className="font-bold pb-2 pr-3 text-center">Promo Lift</th>
                  <th className="font-bold pb-2 text-right">Action / Note</th>
                </tr>
              </thead>
              <tbody>
                {promoPeriods.map((r, i) => (
                  <tr key={i} className="border-t border-[#F2E9D8]">
                    <td className="py-2.5 pr-3 text-sm font-semibold text-navy">{r.period}</td>
                    <td className="text-center"><Badge variant="coral">+{r.promo_lift_pct}%</Badge></td>
                    <td className="text-right">
                      {r.promo_has_history
                        ? <span className="text-xs text-success font-semibold">✓ Realization factor auto-applied</span>
                        : <Button size="sm" variant="outline">Approve Lift</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
