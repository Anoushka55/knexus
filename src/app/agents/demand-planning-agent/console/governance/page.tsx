"use client";
import { useMemo, useState } from "react";
import { Card } from "@/lib/demand-planning/ui/Card";
import { Badge, rootCauseToVariant } from "@/lib/demand-planning/ui/Badge";
import { Button } from "@/lib/demand-planning/ui/Button";
import { AgentInsightCard } from "@/lib/demand-planning/ui/AgentInsightCard";
import { useOverrides, getEffectiveStatus } from "@/lib/demand-planning/state/overrideContext";
import { useDataContext } from "@/lib/demand-planning/state/dataContext";
import { formatINR } from "@/lib/demand-planning/utils";
import { FileText, TrendingDown, TrendingUp, CheckCircle2, Send, GitMerge } from "lucide-react";
import Link from "next/link";
import { consensusAdjustedCount } from "@/lib/demand-planning/data/forecastCollabData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const BASE = "/agents/demand-planning-agent/console";

const RC_COLORS: Record<string, string> = {
  "Data Quality": "#2A2755",
  "Promo": "#E0355C",
  "Seasonality": "#17A2A0",
  "Supply": "#E8A33D",
  "Market Event": "#2F6FED",
};

export default function GovernancePage() {
  const [generated, setGenerated] = useState(false);
  const [narrative, setNarrative] = useState(
    "Forecast accuracy held steady at ~83% MoM, but bias has crept up in Mumbai depot driven by promo realization shortfalls in CleanMax. Recommend tightening the promo realization factor and reviewing seasonal index for the upcoming festive quarter."
  );
  const [toast, setToast] = useState<string | null>(null);
  const { exceptionStatusOverrides } = useOverrides();
  const { activeDataset } = useDataContext();

  const periods = useMemo(() => Array.from(new Set(activeDataset.map((r) => r.period))).sort(), [activeDataset]);
  const latestP = periods[periods.length - 1];
  const prevP = periods[periods.length - 2];

  const monthly = useMemo(() => {
    const m: Record<string, { fa: number; bias: number; n: number }> = {};
    activeDataset.forEach((r) => {
      if (!m[r.period]) m[r.period] = { fa: 0, bias: 0, n: 0 };
      m[r.period].fa += r.fa_pct;
      m[r.period].bias += r.bias_pct;
      m[r.period].n += 1;
    });
    return m;
  }, [activeDataset]);

  const latestFA = monthly[latestP] ? monthly[latestP].fa / monthly[latestP].n : 0;
  const prevFA = monthly[prevP] ? monthly[prevP].fa / monthly[prevP].n : 0;
  const latestBias = monthly[latestP] ? monthly[latestP].bias / monthly[latestP].n : 0;
  const prevBias = monthly[prevP] ? monthly[prevP].bias / monthly[prevP].n : 0;

  const open = useMemo(() =>
    activeDataset.filter((r) => {
      const s = getEffectiveStatus(r, exceptionStatusOverrides);
      return (s === "Open" || s === "Escalated") && r.root_cause_tag !== "None";
    }),
  [activeDataset, exceptionStatusOverrides]);

  const tierCounts: Record<string, number> = {};
  open.forEach((r) => { tierCounts[r.approval_tier] = (tierCounts[r.approval_tier] ?? 0) + 1; });

  const rcCounts: Record<string, number> = {};
  open.forEach((r) => { rcCounts[r.root_cause_tag] = (rcCounts[r.root_cause_tag] ?? 0) + 1; });

  const pieData = Object.entries(rcCounts).map(([name, value]) => ({ name, value }));
  const totalImpact = open.reduce((s, r) => s + r.financial_impact_inr, 0);
  const directorCount = tierCounts["Director"] ?? 0;
  const prevDirectorCount = Math.max(0, directorCount - 1); // simulate prior

  // SLA past due — for demo, treat sla_date before today as past due
  const today = "2026-06-13";
  const pastDue = open.filter((r) => r.sla_date < today).slice(0, 4);

  const distribute = () => {
    setToast("Pre-read distributed — all stakeholders notified.");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-coral font-bold">Agent Output · S&amp;OP Pre-Read</div>
        <h1 className="text-3xl font-extrabold text-navy mt-1">Governance Pre-Reads</h1>
        <p className="text-sm text-muted mt-1">Auto-compiled, agent-generated S&amp;OP packs for governance distribution.</p>
      </div>

      <AgentInsightCard
        sentiment="negative"
        text={`Director-tier exceptions have increased by ${directorCount - prevDirectorCount} this cycle, driven mostly by promo and data-quality issues. The pre-read flags these for executive review.`}
      />

      {!generated ? (
        <Card className="text-center py-12">
          <FileText size={36} className="text-coral mx-auto mb-4" />
          <h2 className="text-lg font-bold text-navy mb-2">Generate Monthly Pre-Read Pack</h2>
          <p className="text-sm text-muted max-w-md mx-auto mb-5">
            The DemandIQ Agent will compile KPIs, exceptions, root causes, and SLA breaches into a single S&amp;OP-ready report.
          </p>
          <Button variant="primary" size="lg" onClick={() => setGenerated(true)}>Generate Pre-Read Pack</Button>
        </Card>
      ) : (
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-[#E7DDCB] shadow-[0_4px_20px_rgba(42,39,85,0.06)] overflow-hidden">
          {/* Cover */}
          <div className="bg-navy text-white px-8 py-6">
            <div className="text-[10px] uppercase tracking-widest text-coral font-bold mb-1">S&amp;OP Pre-Read · {latestP}</div>
            <h2 className="text-2xl font-extrabold">Monthly Demand Planning Pack</h2>
            <p className="text-xs text-white/70 mt-2">Auto-generated by the DemandIQ Agent · Awaiting planner narrative &amp; distribution</p>
          </div>

          <div className="px-8 py-6 space-y-8">
            {/* Consensus Forecast notice */}
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-teal/5 border border-teal/20 text-xs text-navy">
              <GitMerge size={14} className="text-teal flex-shrink-0 mt-0.5" />
              <span>
                <strong>Consensus forecast incorporated.</strong>{" "}
                Brand owners submitted adjustments for {consensusAdjustedCount} SKUs vs. the
                statistical baseline — these figures have been carried into this pre-read.{" "}
                <Link
                  href={`${BASE}/forecast-collaboration`}
                  className="text-teal underline underline-offset-2 hover:opacity-80"
                >
                  View Forecast Collaboration →
                </Link>
              </span>
            </div>

            {/* KPI Summary */}
            <section>
              <SectionHeading num="1" title="KPI Summary" />
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <MetricBlock
                  label="Forecast Accuracy"
                  current={`${latestFA.toFixed(1)}%`}
                  prev={`${prevFA.toFixed(1)}%`}
                  delta={latestFA - prevFA}
                  better="up"
                />
                <MetricBlock
                  label="Bias (absolute)"
                  current={`${Math.abs(latestBias).toFixed(1)}%`}
                  prev={`${Math.abs(prevBias).toFixed(1)}%`}
                  delta={Math.abs(latestBias) - Math.abs(prevBias)}
                  better="down"
                />
              </div>
            </section>

            {/* Exception summary */}
            <section>
              <SectionHeading num="2" title="Exception Summary" />
              <div className="text-sm text-navy mb-3">
                Total open exceptions: <strong>{open.length}</strong> · Financial exposure: <strong className="text-coral">{formatINR(totalImpact)}</strong>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["Director", "L2", "L1", "Auto-Close"] as const).map((t) =>
                  tierCounts[t] ? (
                    <div key={t} className={`px-3 py-2 rounded-lg border ${t === "Director" ? "border-critical bg-critical/5" : "border-[#E7DDCB]"}`}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t}</div>
                      <div className={`text-xl font-bold ${t === "Director" ? "text-critical" : "text-navy"}`}>{tierCounts[t]}</div>
                    </div>
                  ) : null
                )}
              </div>
            </section>

            {/* Root cause */}
            <section>
              <SectionHeading num="3" title="Root Cause Breakdown" />
              <div className="grid sm:grid-cols-2 gap-4 mt-2 items-center">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} paddingAngle={2}>
                        {pieData.map((p) => <Cell key={p.name} fill={RC_COLORS[p.name] ?? "#7A7390"} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#2A2755", border: "none", borderRadius: 8, color: "white", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {pieData.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ background: RC_COLORS[p.name] ?? "#7A7390" }} />
                        <span className="text-navy font-medium">{p.name}</span>
                      </div>
                      <span className="font-mono font-bold text-navy">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Past due */}
            <section>
              <SectionHeading num="4" title="Unresolved Items — SLA Past Due" />
              {pastDue.length === 0 ? (
                <div className="text-sm text-success font-semibold flex items-center gap-2"><CheckCircle2 size={16} /> No items past SLA.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted text-left">
                      <th className="font-bold py-2 pr-3">Item</th>
                      <th className="font-bold py-2 pr-3">Root Cause</th>
                      <th className="font-bold py-2 pr-3">Owner</th>
                      <th className="font-bold py-2 text-right">SLA Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastDue.map((r, i) => (
                      <tr key={i} className="border-t border-[#F2E9D8]">
                        <td className="py-2 pr-3 font-semibold text-navy text-[13px]">{r.sku_name}</td>
                        <td className="pr-3"><Badge variant={rootCauseToVariant(r.root_cause_tag)}>{r.root_cause_tag}</Badge></td>
                        <td className="text-xs pr-3 text-navy/80">{r.owner}</td>
                        <td className="text-right font-mono text-xs text-critical font-bold">{r.sla_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Narrative */}
            <section>
              <SectionHeading num="5" title="Planner Narrative (editable)" />
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                rows={5}
                className="w-full mt-2 px-4 py-3 bg-cream border border-[#E7DDCB] rounded-lg text-sm text-navy focus:outline-none focus:ring-2 focus:ring-coral/30 leading-relaxed"
              />
            </section>

            {/* Distribute */}
            <div className="border-t border-[#E7DDCB] pt-5 flex items-center justify-between">
              <Button variant="outline" onClick={() => setGenerated(false)}>Re-generate</Button>
              <Button variant="primary" size="lg" onClick={distribute}>
                <Send size={16} /> Approve &amp; Distribute
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-2 text-sm">
          <CheckCircle2 size={18} className="text-success" /> {toast}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-coral text-white text-xs font-bold">{num}</span>
      <h3 className="text-base font-bold text-navy">{title}</h3>
    </div>
  );
}

function MetricBlock({ label, current, prev, delta, better }: { label: string; current: string; prev: string; delta: number; better: "up" | "down" }) {
  const improved = better === "up" ? delta > 0 : delta < 0;
  const Icon = delta > 0 ? TrendingUp : TrendingDown;
  return (
    <div className="bg-cream rounded-lg p-4 border border-[#E7DDCB]">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-2xl font-extrabold text-navy">{current}</div>
        <div className={`text-xs font-bold flex items-center gap-1 mb-1 ${improved ? "text-success" : "text-critical"}`}>
          <Icon size={12} /> {Math.abs(delta).toFixed(1)}pp
        </div>
      </div>
      <div className="text-[11px] text-muted">Prev: {prev}</div>
    </div>
  );
}
