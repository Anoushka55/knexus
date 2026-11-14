"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { useSession } from "@/lib/portfolio-rationalization/session";
import { RATIONALIZATION_ACTIONS, type Tool } from "@/lib/portfolio-rationalization/types";
import { ActionBadge, EmptyState, LoadSampleButton, KpiCard, SectionCard, scoreColor } from "../_components";

const BASE = "/agents/portfolio-rationalization/console";

const ACTION_BAR_COLOR: Record<string, string> = {
  Retain: "var(--ptr-green)",
  Rehost: "var(--ptr-blue)",
  Replatform: "#0077c8",
  Refactor: "var(--ptr-purple)",
  Replace: "var(--ptr-amber)",
  Retire: "var(--ptr-red)",
};

const SIX_R = RATIONALIZATION_ACTIONS.filter((a) => a !== "TBD");

function fmtMoney(v: number) {
  return v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${Math.round(v).toLocaleString()}`;
}

function isRetireCandidate(t: Tool) {
  return !!t.end_of_life || t.rationalization_action === "Retire";
}

/** Risk comes from the scored risk dimension (higher = riskier); falls back to the composite score. */
function riskLevel(t: Tool): "High" | "Medium" | "Low" {
  const r = t.scores?.risk_score;
  if (typeof r === "number") return r >= 7 ? "High" : r >= 4 ? "Medium" : "Low";
  const s = t.composite_score ?? 0;
  return s <= 3 ? "High" : s <= 6 ? "Medium" : "Low";
}

const RISK_COLOR = { High: "var(--ptr-red)", Medium: "var(--ptr-amber-dark)", Low: "var(--ptr-green)" } as const;

function statusFor(score: number) {
  return score >= 7 ? { label: "Good", cls: "ptr-badge-retain" } : score >= 4 ? { label: "Review", cls: "ptr-badge-replatform" } : { label: "Action", cls: "ptr-badge-replace" };
}

type Alert = { sev: "critical" | "high" | "low"; title: string; desc: string; tag: string };
const SEV_COLOR = { critical: "var(--ptr-red)", high: "var(--ptr-amber)", low: "var(--ptr-green)" } as const;

function csvCell(v: unknown) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export default function CommandCenterPage() {
  const { tools, duplications } = useSession();

  const stats = useMemo(() => {
    const total = tools.length;
    const spend = tools.reduce((a, t) => a + (t.annual_cost || 0), 0);
    const retire = tools.filter(isRetireCandidate).length;
    const dupSavings = duplications.reduce((a, d) => a + d.potential_annual_savings, 0);
    const avg = total ? Math.round((tools.reduce((a, t) => a + (t.composite_score || 0), 0) / total) * 10) / 10 : 0;
    const counts: Record<string, number> = Object.fromEntries(SIX_R.map((a) => [a, 0]));
    for (const t of tools) if (t.rationalization_action && t.rationalization_action in counts) counts[t.rationalization_action]++;
    return { total, spend, retire, dupSavings, avg, counts };
  }, [tools, duplications]);

  const roadmap = useMemo(() => {
    const eol = tools.filter(isRetireCandidate);
    const eolCost = eol.reduce((a, t) => a + (t.annual_cost || 0), 0);
    const reshape = tools.filter((t) => t.rationalization_action === "Replace" || t.rationalization_action === "Refactor").length;
    const migrate = tools.filter(
      (t) => (t.rationalization_action === "Rehost" || t.rationalization_action === "Replatform") && /on-?prem/i.test(t.deployment || ""),
    ).length;
    return [
      { name: "Retire EOL & Unused Tools", detail: `Immediate — ${eol.length} candidate${eol.length === 1 ? "" : "s"}${eolCost ? ` (${fmtMoney(eolCost)}/yr)` : ""}`, count: eol.length },
      { name: "Consolidate Overlapping Tools", detail: `${duplications.length} overlap pair${duplications.length === 1 ? "" : "s"}${stats.dupSavings ? ` — ${fmtMoney(stats.dupSavings)}/yr potential` : ""}`, count: duplications.length },
      { name: "Replace & Refactor", detail: `${reshape} tool${reshape === 1 ? "" : "s"} need redesign or a better alternative`, count: reshape },
      { name: "Migrate On-Prem to Cloud", detail: `Rehost/Replatform — ${migrate} on-prem tool${migrate === 1 ? "" : "s"} in scope`, count: migrate },
    ].map((r, i) => ({ ...r, phase: `Phase ${i + 1}` }));
  }, [tools, duplications, stats.dupSavings]);

  const alerts = useMemo<Alert[]>(() => {
    const out: Alert[] = [];
    const eol = tools.filter((t) => t.end_of_life);
    if (eol.length) {
      const cost = eol.reduce((a, t) => a + (t.annual_cost || 0), 0);
      out.push({ sev: "critical", title: "End-of-Life Tools Detected", desc: `${eol.length} tool${eol.length === 1 ? "" : "s"} past end-of-life${cost ? ` consuming ${fmtMoney(cost)}/yr` : ""} — retirement recommended`, tag: "Top priority" });
    }
    const topDup = [...duplications].sort((a, b) => b.potential_annual_savings - a.potential_annual_savings)[0];
    if (topDup) {
      out.push({ sev: "critical", title: `Overlapping ${topDup.category} Capabilities`, desc: `${topDup.tool_a} & ${topDup.tool_b} overlap ${topDup.overlap_percentage}% — consolidating could save ${fmtMoney(topDup.potential_annual_savings)}/yr`, tag: "High impact" });
    }
    const lowAdoption = tools.filter((t) => typeof t.scores?.adoption_rate === "number" && t.scores.adoption_rate <= 2);
    if (lowAdoption.length) {
      out.push({ sev: "high", title: "Low-Adoption Tools", desc: `${lowAdoption.length} tool${lowAdoption.length === 1 ? "" : "s"} with very low adoption — licence downsizing or retirement advised`, tag: "Medium priority" });
    }
    const highRisk = tools.filter((t) => (t.scores?.risk_score ?? 0) >= 7);
    if (highRisk.length) {
      out.push({ sev: "high", title: "High-Risk Tools", desc: `${highRisk.length} tool${highRisk.length === 1 ? "" : "s"} flagged for security, compliance, obsolescence or lock-in risk`, tag: "Medium priority" });
    }
    const rehost = tools.filter((t) => t.rationalization_action === "Rehost" && /on-?prem/i.test(t.deployment || ""));
    if (rehost.length) {
      out.push({ sev: "low", title: "Cloud Migration Opportunities", desc: `${rehost.length} on-prem tool${rehost.length === 1 ? "" : "s"} qualify for Rehost`, tag: "Initiative" });
    }
    return out;
  }, [tools, duplications]);

  function exportCsv() {
    const rows = [
      ["Tool Name", "Category", "6R Action", "Health Score", "Annual Cost"],
      ...tools.map((t) => [t.name, t.category, t.rationalization_action ?? "", t.composite_score ?? "", t.annual_cost ?? ""]),
    ];
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio-rationalization.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!tools.length) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <SectionCard title="Operations Command Center">
          <EmptyState message="No portfolio data yet — ingest your tool inventory and run an AI Assessment first." />
          <div className="text-center mt-2">
            <Link
              href={`${BASE}/ingest`}
              className="inline-flex items-center h-9 px-4 rounded-md bg-[var(--ptr-navy)] text-white text-sm font-medium hover:bg-[var(--ptr-navy-light)]"
            >
              Go to Data Ingest
            </Link>
            <LoadSampleButton className="ml-2" />
          </div>
        </SectionCard>
      </div>
    );
  }

  const assessed = SIX_R.some((a) => stats.counts[a] > 0);

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Tools in Portfolio" value={String(stats.total)} sub={`${fmtMoney(stats.spend)} annual spend`} />
        <KpiCard label="Retire Candidates" value={String(stats.retire)} sub="action needed" valueColor="var(--ptr-red)" />
        <KpiCard label="Est. Annual Savings" value={fmtMoney(stats.dupSavings)} sub="from overlaps" valueColor="var(--ptr-green)" />
        <KpiCard
          label="Avg. Health Score"
          value={stats.avg ? `${stats.avg}/10` : "—"}
          sub="composite score"
          valueColor={stats.avg ? scoreColor(stats.avg) : undefined}
        />
        <KpiCard label="Overlap Pairs" value={String(duplications.length)} sub="consolidation alerts" valueColor="var(--ptr-blue)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="space-y-5">
          <SectionCard title="6R Rationalization Summary">
            {assessed ? (
              <div className="space-y-2.5">
                {SIX_R.map((a) => {
                  const n = stats.counts[a];
                  const pct = Math.round((n / stats.total) * 100);
                  return (
                    <div key={a} className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold text-[var(--ptr-navy)] min-w-[72px]">{a}</span>
                      <div className="flex-1 h-2 rounded bg-[var(--ptr-background)] border border-[var(--ptr-border)] overflow-hidden">
                        <div className="h-full rounded transition-[width] duration-500" style={{ width: `${pct}%`, background: ACTION_BAR_COLOR[a] }} />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--ptr-muted)] min-w-[28px] text-right">{n}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="Run an AI Assessment to populate rationalization data" />
            )}
          </SectionCard>

          <SectionCard title="Rationalization Roadmap">
            <ul className="divide-y divide-[var(--ptr-border)] -my-1">
              {roadmap.map((r) => (
                <li key={r.phase} className={`flex items-center justify-between gap-3 py-2.5 ${r.count ? "" : "opacity-50"}`}>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--ptr-navy)]">{r.name}</div>
                    <div className="text-[11px] text-[var(--ptr-muted)]">{r.detail}</div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--ptr-background)] text-[var(--ptr-navy)] border border-[var(--ptr-border)]">
                    {r.phase}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <SectionCard title="AI Priority Actions">
          {alerts.length ? (
            <ul className="space-y-3">
              {alerts.map((a) => (
                <li key={a.title} className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: SEV_COLOR[a.sev] }} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--ptr-navy)]">{a.title}</div>
                    <div className="text-xs text-[var(--ptr-muted)] leading-relaxed">{a.desc}</div>
                    <div className="text-[10px] font-semibold text-[var(--ptr-slate)] mt-0.5">{a.tag}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No priority actions flagged for this portfolio." />
          )}
        </SectionCard>
      </div>

      <SectionCard>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--ptr-border)]">
          <h3 className="text-sm font-bold text-[var(--ptr-navy)]">Portfolio Rationalization Status</h3>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--ptr-border)] bg-white text-xs font-semibold text-[var(--ptr-navy)] hover:bg-[var(--ptr-background)]"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto max-h-[480px] ptr-scroll">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-[var(--ptr-slate)] sticky top-0 bg-white">
                {["Tool Name", "Category", "6R Action", "Health Score", "Annual Cost", "Risk", "Status"].map((h) => (
                  <th key={h} className="py-2 pr-4 font-semibold border-b border-[var(--ptr-border)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tools.map((t) => {
                const score = t.composite_score ?? 0;
                const risk = riskLevel(t);
                const st = statusFor(score);
                return (
                  <tr key={t.id} className="border-b border-[var(--ptr-border)] last:border-0">
                    <td className="py-2 pr-4 font-semibold text-[var(--ptr-navy)]">{t.name}</td>
                    <td className="py-2 pr-4">{t.category || "—"}</td>
                    <td className="py-2 pr-4">{t.rationalization_action ? <ActionBadge action={t.rationalization_action} /> : "—"}</td>
                    <td className="py-2 pr-4 font-bold" style={{ color: score ? scoreColor(score) : undefined }}>
                      {score ? `${score}/10` : "—"}
                    </td>
                    <td className="py-2 pr-4">{t.annual_cost ? fmtMoney(t.annual_cost) : "—"}</td>
                    <td className="py-2 pr-4 font-bold" style={{ color: RISK_COLOR[risk] }}>
                      {risk}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`ptr-badge ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
