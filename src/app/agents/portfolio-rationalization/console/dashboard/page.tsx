"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/portfolio-rationalization/session";
import { RATIONALIZATION_ACTIONS, type RationalizationAction } from "@/lib/portfolio-rationalization/types";
import { ActionBadge, EmptyState, KpiCard, SectionCard, scoreColor } from "../_components";

export default function DashboardPage() {
  const { tools, duplications, assessment } = useSession();
  const [filterAction, setFilterAction] = useState<RationalizationAction | "">("");
  const [filterCategory, setFilterCategory] = useState("");

  const totalCost = useMemo(() => tools.reduce((a, t) => a + (t.annual_cost || 0), 0), [tools]);
  const potSavings = useMemo(() => duplications.reduce((a, d) => a + d.potential_annual_savings, 0), [duplications]);
  const retireEol = useMemo(
    () => tools.filter((t) => t.end_of_life || t.rationalization_action === "Retire").length,
    [tools],
  );
  const avgScore = useMemo(
    () => (tools.length ? Math.round((tools.reduce((a, t) => a + (t.composite_score || 0), 0) / tools.length) * 10) / 10 : 0),
    [tools],
  );
  const health = assessment?.portfolio_overview?.portfolio_health;

  const actionCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of tools) {
      const a = t.rationalization_action || "TBD";
      c[a] = (c[a] || 0) + 1;
    }
    return c;
  }, [tools]);

  const categories = useMemo(() => [...new Set(tools.map((t) => t.category))].sort(), [tools]);

  const filtered = useMemo(
    () =>
      tools.filter(
        (t) => (!filterAction || t.rationalization_action === filterAction) && (!filterCategory || t.category === filterCategory),
      ),
    [tools, filterAction, filterCategory],
  );

  const costByAction = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of tools) {
      const a = t.rationalization_action || "TBD";
      c[a] = (c[a] || 0) + (t.annual_cost || 0);
    }
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [tools]);

  const categoryHealth = useMemo(() => {
    const m = new Map<string, { cnt: number; scores: number[]; action: number }>();
    for (const t of tools) {
      const cat = t.category || "Other";
      if (!m.has(cat)) m.set(cat, { cnt: 0, scores: [], action: 0 });
      const e = m.get(cat)!;
      e.cnt++;
      if (t.composite_score) e.scores.push(t.composite_score);
      if (t.rationalization_action === "Retire" || t.rationalization_action === "Replace") e.action++;
    }
    return [...m.entries()].sort((a, b) => b[1].cnt - a[1].cnt).slice(0, 7);
  }, [tools]);

  if (!tools.length) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <SectionCard title="Dashboard">
          <EmptyState message="No tools ingested yet. Head to Data Ingest to upload or paste your technology portfolio." />
          <div className="text-center mt-2">
            <Link
              href="/agents/portfolio-rationalization/console/ingest"
              className="inline-flex items-center h-9 px-4 rounded-md bg-[var(--ptr-navy)] text-white text-sm font-medium hover:bg-[var(--ptr-navy-light)]"
            >
              Go to Data Ingest
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Tools Assessed" value={String(tools.length)} sub="portfolio active" />
        <KpiCard label="Annual Spend" value={`$${totalCost.toLocaleString()}`} sub="technology budget" barPct={70} barColor="var(--ptr-navy)" />
        <KpiCard label="Overlap Pairs" value={String(duplications.length)} sub="consolidation alerts" />
        <KpiCard
          label="Est. Savings"
          value={`$${potSavings.toLocaleString()}`}
          sub="annual potential"
          barPct={Math.min(100, Math.round((potSavings / Math.max(totalCost, 1)) * 100))}
          barColor="var(--ptr-green)"
        />
        <KpiCard label="Retire / EOL" value={String(retireEol)} sub="immediate action" valueColor="var(--ptr-red)" />
        <KpiCard
          label="Avg Tool Score"
          value={avgScore.toFixed(1)}
          sub={health ? `portfolio: ${health}` : "portfolio health"}
          valueColor={scoreColor(avgScore)}
          barPct={Math.round(avgScore * 10)}
          barColor={scoreColor(avgScore)}
        />
      </div>

      {/* 6R layer nav */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white rounded-full border border-[var(--ptr-border)] px-2 py-1.5">
        <button
          onClick={() => setFilterAction("")}
          className={`px-3 h-7 rounded-full text-xs font-medium whitespace-nowrap ${!filterAction ? "bg-[var(--ptr-navy)] text-white" : "text-[var(--ptr-muted)] hover:text-[var(--ptr-navy)]"}`}
        >
          All Tools <span className="ml-1 opacity-70">{tools.length}</span>
        </button>
        {RATIONALIZATION_ACTIONS.filter((a) => actionCounts[a]).map((a) => (
          <button
            key={a}
            onClick={() => setFilterAction(a)}
            className={`px-3 h-7 rounded-full text-xs font-medium whitespace-nowrap ${filterAction === a ? "bg-[var(--ptr-navy)] text-white" : "text-[var(--ptr-muted)] hover:text-[var(--ptr-navy)]"}`}
          >
            {a} <span className="ml-1 opacity-70">{actionCounts[a]}</span>
          </button>
        ))}
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--ptr-navy)]">Tool Portfolio</h3>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs border border-[var(--ptr-border)] rounded px-2 py-1 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-[420px] overflow-y-auto ptr-scroll divide-y divide-[var(--ptr-border)]">
            {filtered.length === 0 && <EmptyState message="No tools match this filter." />}
            {filtered.slice(0, 50).map((t) => (
              <div key={t.id} className="py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <ActionBadge action={t.rationalization_action} />
                  <span className="text-[13px] font-semibold flex-1 truncate">{t.name}</span>
                  <span className="text-[11px] font-bold" style={{ color: scoreColor(t.composite_score ?? 0) }}>
                    {(t.composite_score ?? 0).toFixed(1)}/10
                  </span>
                </div>
                <div className="text-[11px] text-[var(--ptr-muted)] pl-0.5">
                  {t.vendor || "—"} &bull; {t.category}
                  {t.annual_cost ? ` • $${t.annual_cost.toLocaleString()}/yr` : ""}
                  {t.user_count ? ` • ${t.user_count} users` : ""}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Impact-Weighted Cost Distribution">
          <div className="space-y-2.5">
            {costByAction.map(([action, cost]) => {
              const pct = totalCost ? (cost / totalCost) * 100 : 0;
              return (
                <div key={action} className="flex items-center gap-2">
                  <div className="w-20 text-[10px] font-bold text-[var(--ptr-text)] shrink-0">{action}</div>
                  <div className="flex-1 h-4 bg-[#f0f3fa] rounded overflow-hidden">
                    <div className={`h-full ptr-dot-${action.toLowerCase()}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-16 text-right text-[9px] text-[var(--ptr-muted)] shrink-0">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Category Health">
          <div className="space-y-2">
            {categoryHealth.map(([cat, d]) => {
              const sc = d.scores.length ? Math.round((d.scores.reduce((a, b) => a + b, 0) / d.scores.length) * 10) / 10 : 0;
              const col = scoreColor(sc);
              return (
                <div key={cat} className="flex items-center gap-3 py-1.5 border-b border-[var(--ptr-border)] last:border-0">
                  <div
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-extrabold shrink-0"
                    style={{ borderColor: col, color: col, background: `${col}22` }}
                  >
                    {sc}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold truncate">{cat}</div>
                    <div className="text-[10px] text-[var(--ptr-muted)]">
                      {d.cnt} tool{d.cnt !== 1 ? "s" : ""} &bull; Avg {sc}/10
                    </div>
                    {d.action > 0 && <div className="text-[10px] font-semibold text-[var(--ptr-red)]">Action needed: {d.action}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
