"use client";
import { Card, CardHeader } from "@/lib/demand-planning/ui/Card";
import { Badge, rootCauseToVariant } from "@/lib/demand-planning/ui/Badge";
import { AgentInsightCard } from "@/lib/demand-planning/ui/AgentInsightCard";
import { useOverrides } from "@/lib/demand-planning/state/overrideContext";
import { getPlannerLeaderboard } from "@/lib/demand-planning/data/plannerData";
import { Sparkles, RefreshCw, History, TrendingUp, Award, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo } from "react";

export default function LearningPage() {
  const { overrides } = useOverrides();

  const validated = overrides.filter((o) => o.outcome_validated === true).length;
  const rejected = overrides.filter((o) => o.outcome_validated === false).length;
  const pending = overrides.filter((o) => o.outcome_validated === null).length;
  const totalScored = validated + rejected;
  const validationRate = totalScored > 0 ? (validated / totalScored) * 100 : 0;

  // Confidence-over-cycles: simulate progressive improvement
  const cycleData = useMemo(() => {
    const base = Math.max(55, validationRate - 12);
    return Array.from({ length: 6 }, (_, i) => ({
      cycle: `Cycle ${i + 1}`,
      confidence: Math.min(95, base + i * 2.5 + Math.sin(i) * 1.2),
    }));
  }, [validationRate]);

  const sortedOverrides = [...overrides].sort((a, b) => (a.date < b.date ? 1 : -1));

  const leaderboard = getPlannerLeaderboard();
  const topPlanner = leaderboard[0];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">Continuous Improvement</div>
        <h1 className="text-3xl font-extrabold text-navy mt-1 flex items-center gap-2">
          <Sparkles className="text-coral" size={28} /> Learning Dashboard
        </h1>
        <p className="text-sm text-muted mt-1">Audit and observe the autonomous improvement of the DemandIQ Agent.</p>
      </div>

      <AgentInsightCard
        sentiment="positive"
        text={`Of ${totalScored} historical agent decisions, ${validated} were validated by actual outcomes — a ${validationRate.toFixed(0)}% validation rate. Confidence scores have been auto-calibrated accordingly.`}
      />

      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Decisions Logged</div>
          <div className="text-4xl font-extrabold text-navy mt-2">{overrides.length}</div>
        </Card>
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Validation Rate</div>
          <div className="text-4xl font-extrabold text-success mt-2">{validationRate.toFixed(0)}%</div>
        </Card>
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Validated by Outcome</div>
          <div className="text-4xl font-extrabold text-teal mt-2">{validated}</div>
        </Card>
        <Card>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Pending Outcome</div>
          <div className="text-4xl font-extrabold text-warning mt-2">{pending}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Agent Confidence Trend" subtitle="Mean confidence per learning cycle" icon={<TrendingUp size={18} />} />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cycleData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7DDCB" />
                <XAxis dataKey="cycle" tick={{ fontSize: 11, fill: "#7A7390" }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#7A7390" }} />
                <Tooltip contentStyle={{ background: "#2A2755", border: "none", borderRadius: 8, color: "white", fontSize: 12 }} formatter={(v: number) => [`${v.toFixed(1)}%`, "Confidence"]} />
                <Line type="monotone" dataKey="confidence" stroke="#17A2A0" strokeWidth={2.5} dot={{ r: 4, fill: "#17A2A0" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="How the Loop Works" subtitle="Self-improving feedback cycle" icon={<RefreshCw size={18} />} />
          <div className="space-y-3 text-sm text-navy/90 leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex-shrink-0">1</span>
              <span>Planner approves, rejects, or escalates an agent recommendation — with a reason.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex-shrink-0">2</span>
              <span>Each decision is appended to the override log along with the root-cause tag.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex-shrink-0">3</span>
              <span>Outcomes are observed next cycle — was the agent&apos;s classification correct?</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-coral text-white text-xs font-bold flex-shrink-0">4</span>
              <span>Confidence scores are re-weighted by historical validation rate per root-cause type, with recent outcomes weighted double.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal text-white text-xs font-bold flex-shrink-0">↑</span>
              <span className="font-semibold">Next cycle: the agent&apos;s recommendations and confidence reflect what actually worked.</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Override Log — Every Planner Decision" subtitle="Decisions feed the learning loop" icon={<History size={18} />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted text-left border-b border-[#E7DDCB]">
                <th className="font-bold py-3 pr-3">Date</th>
                <th className="font-bold py-3 pr-3">SKU / Depot / Account</th>
                <th className="font-bold py-3 pr-3">Root Cause</th>
                <th className="font-bold py-3 pr-3">Field</th>
                <th className="font-bold py-3 pr-3">Change</th>
                <th className="font-bold py-3 pr-3">Reason</th>
                <th className="font-bold py-3 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {sortedOverrides.slice(0, 18).map((o) => (
                <tr key={o.override_id} className="border-b border-[#F2E9D8]">
                  <td className="py-2.5 pr-3 text-xs font-mono text-navy/70">{o.date}</td>
                  <td className="pr-3 text-[13px]">
                    <div className="font-semibold text-navy">{o.sku_name}</div>
                    <div className="text-[11px] text-muted">{o.depot_name} · {o.account_name}</div>
                  </td>
                  <td className="pr-3"><Badge variant={rootCauseToVariant(o.root_cause_tag)}>{o.root_cause_tag}</Badge></td>
                  <td className="pr-3 text-xs text-navy/80 font-mono">{o.field_overridden}</td>
                  <td className="pr-3 text-xs text-navy/80">{o.old_value} → <strong>{o.new_value}</strong></td>
                  <td className="pr-3 text-xs text-navy/80 max-w-xs">{o.reason}</td>
                  <td className="text-right">
                    {o.outcome_validated === true && <Badge variant="success">✓ Validated</Badge>}
                    {o.outcome_validated === false && <Badge variant="critical">✗ Rejected</Badge>}
                    {o.outcome_validated === null && <Badge variant="warning">Pending</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedOverrides.length > 18 && (
            <div className="text-center pt-3 text-xs text-muted">Showing 18 of {sortedOverrides.length} entries</div>
          )}
        </div>
      </Card>
      <Card>
        <CardHeader title="Planner Performance" subtitle="Accuracy delta: final forecast vs. system baseline" icon={<Award size={18} />} />
        <AgentInsightCard
          sentiment="positive"
          className="mb-4"
          text={`${topPlanner.planner} is the top-performing planner this period, improving forecast accuracy by +${topPlanner.delta.toFixed(1)}pp on average across ${topPlanner.recordCount} overrides (from ${topPlanner.avgOgAccuracy.toFixed(1)}% to ${topPlanner.avgFinalAccuracy.toFixed(1)}%).`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted text-left border-b border-[#E7DDCB]">
                <th className="font-bold py-3 pr-3 w-12">Rank</th>
                <th className="font-bold py-3 pr-3">Planner</th>
                <th className="font-bold py-3 pr-3 text-right">Avg OG Accuracy</th>
                <th className="font-bold py-3 pr-3 text-right">Avg Final Accuracy</th>
                <th className="font-bold py-3 pr-3 text-right">Delta</th>
                <th className="font-bold py-3 text-right"># Overrides</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={row.planner} className="border-b border-[#F2E9D8]">
                  <td className="py-2.5 pr-3 text-xs font-mono text-navy/50">#{i + 1}</td>
                  <td className="py-2.5 pr-3 text-[13px] font-semibold text-navy">{row.planner}</td>
                  <td className="py-2.5 pr-3 text-xs text-navy/70 text-right font-mono">{row.avgOgAccuracy.toFixed(1)}%</td>
                  <td className="py-2.5 pr-3 text-xs text-navy/80 text-right font-mono font-semibold">{row.avgFinalAccuracy.toFixed(1)}%</td>
                  <td className="py-2.5 pr-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${row.delta >= 0 ? "text-success" : "text-critical"}`}>
                      {row.delta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {row.delta >= 0 ? "+" : ""}{row.delta.toFixed(1)}pp
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-navy/60 text-right font-mono">{row.recordCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
