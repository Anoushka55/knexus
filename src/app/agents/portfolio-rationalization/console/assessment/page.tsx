"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { useSession } from "@/lib/portfolio-rationalization/session";
import { runAssessment } from "@/lib/portfolio-rationalization/client";
import type { ExecutiveSummary } from "@/lib/portfolio-rationalization/types";
import { EmptyState, PriorityBadge, SectionCard } from "../_components";

const INDUSTRY_OPTIONS = ["telecom", "banking", "insurance", "retail", "healthcare", "manufacturing", "energy", "public sector", "technology", "other"];

export default function AssessmentPage() {
  const { tools, duplications, assessment, setAssessment, wizard } = useSession();
  const [industry, setIndustry] = useState(wizard.org.industry || "telecom");
  const [focus, setFocus] = useState(wizard.business.focus || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const result = await runAssessment(tools, duplications, industry, focus);
      setAssessment(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!tools.length) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <SectionCard title="AI Assessment">
          <EmptyState message="Ingest tool data first before running an assessment." />
          <div className="text-center mt-2">
            <Link href="/agents/portfolio-rationalization/console/ingest" className="text-sm text-[var(--ptr-blue)] font-medium hover:underline">
              Go to Data Ingest →
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  const ex = assessment?.executive_summary;
  const exObj: ExecutiveSummary | undefined = typeof ex === "object" ? ex : undefined;
  const exStr = typeof ex === "string" ? ex : undefined;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <SectionCard title="Run AI Assessment">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--ptr-navy)]">Industry</span>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="ptr-input">
              {INDUSTRY_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {i[0].toUpperCase() + i.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-xs font-semibold text-[var(--ptr-navy)]">Focus Area (optional)</span>
            <input value={focus} onChange={(e) => setFocus(e.target.value)} className="ptr-input" placeholder="e.g., Observability stack, Security tools…" />
          </label>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="mt-4 h-11 px-5 rounded-md bg-[var(--ptr-green)] text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Running assessment…" : "Run AI Assessment"}
        </button>
        {error && <p className="mt-3 text-sm text-[var(--ptr-red)]">{error}</p>}
      </SectionCard>

      {!assessment && !loading && (
        <SectionCard>
          <EmptyState message="Run the AI assessment to generate the executive summary, 6R roadmap, and risk analysis." />
        </SectionCard>
      )}

      {assessment && (
        <>
          <SectionCard title="Executive Summary">
            {exStr ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{exStr}</p>
            ) : (
              <div className="space-y-3">
                <ExecPanel label="Current State of Tool Ecosystem" content={exObj?.tool_ecosystem} color="#003366" />
                <ExecPanel label="Overlapping Tools — Cost Reduction" content={exObj?.overlapping_tools} color="#E31837" />
                <ExecPanel label="Benchmarking vs Market" content={exObj?.benchmarking} color="#7B2FBE" />
                <ExecPanel label="KPIs vs To-Be Success Factors" content={exObj?.kpis_success_factors} color="#b08000" />
                <ExecPanel label="Recommendations" content={exObj?.recommendations} color="#00A651" />
                <ExecPanel label="Rollout Roadmap" content={exObj?.rollout_roadmap} color="#0063DC" />
              </div>
            )}
          </SectionCard>

          {assessment.before_after_comparison && (
            <SectionCard title="Before vs After: Rationalization Impact">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="text-[11px] font-bold uppercase text-[var(--ptr-red)] mb-3">Current State (As-Is)</div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Stat label="Tools" value={String(assessment.before_after_comparison.current_state.tool_count ?? "--")} />
                    <Stat label="Annual Cost" value={fmtMoney(assessment.before_after_comparison.current_state.annual_cost)} />
                    <Stat label="Duplicate Pairs" value={String(assessment.before_after_comparison.current_state.duplicate_pairs ?? "--")} />
                    <Stat label="Risk Level" value={assessment.before_after_comparison.current_state.risk_level ?? "--"} />
                  </div>
                  {(assessment.before_after_comparison.current_state.key_issues ?? []).map((x, i) => (
                    <div key={i} className="text-xs py-1 border-b border-red-100">
                      ⚠ {x}
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="text-[11px] font-bold uppercase text-[var(--ptr-green)] mb-3">Future State (Post-Rationalization)</div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Stat label="Tools (Projected)" value={String(assessment.before_after_comparison.future_state.projected_tool_count ?? "--")} />
                    <Stat label="Annual Cost (Est.)" value={fmtMoney(assessment.before_after_comparison.future_state.projected_annual_cost)} />
                    <Stat label="Annual Savings" value={fmtMoney(assessment.before_after_comparison.future_state.estimated_annual_savings)} />
                    <Stat label="Target Risk" value={assessment.before_after_comparison.future_state.risk_level ?? "--"} />
                  </div>
                  {(assessment.before_after_comparison.future_state.improvements ?? []).map((x, i) => (
                    <div key={i} className="text-xs py-1 border-b border-green-100">
                      ✓ {x}
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {assessment.three_pillars && (
            <SectionCard title="Strategic Pillars">
              <div className="grid md:grid-cols-3 gap-4">
                <PillarCard title="As-is Tools Assessment" content={assessment.three_pillars.as_is_assessment} />
                <PillarCard title="Governance Framework" content={assessment.three_pillars.governance_framework} />
                <PillarCard title="Tools Standardization" content={assessment.three_pillars.tools_standardization} />
              </div>
            </SectionCard>
          )}

          {!!assessment.top_recommendations?.length && (
            <SectionCard title="Top Priority Recommendations">
              <div className="space-y-2.5">
                {assessment.top_recommendations.map((r) => (
                  <div key={r.rank} className="rounded-lg border border-blue-100 bg-blue-50/50 border-l-4 border-l-[var(--ptr-blue)] p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-[var(--ptr-blue)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">{r.rank}</span>
                      <strong className="text-sm text-[var(--ptr-navy)] flex-1">{r.title}</strong>
                      <PriorityBadge level={r.priority} />
                    </div>
                    <p className="text-xs text-[var(--ptr-text)] leading-relaxed mb-1">{r.description}</p>
                    <p className="text-[11px] text-[var(--ptr-blue)] italic">
                      Impact: {r.impact} &bull; {r.timeline}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {!!assessment.risk_highlights?.length && (
            <SectionCard title="Risk Highlights">
              <div className="space-y-2">
                {assessment.risk_highlights.map((r, i) => (
                  <div key={i} className="flex gap-3 rounded-lg border border-red-100 bg-red-50/50 p-3">
                    <PriorityBadge level={r.severity} />
                    <div>
                      <div className="text-sm font-bold">{r.risk_type} Risk</div>
                      <div className="text-xs text-[var(--ptr-text)] my-1">{r.description}</div>
                      <div className="text-[11px] text-[var(--ptr-green)] font-semibold">Mitigation: {r.mitigation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {!!assessment.tool_analysis?.length && (
            <SectionCard title="Per-Tool Analysis">
              <div className="space-y-4">
                {assessment.tool_analysis.map((ta, i) => (
                  <div key={i} className="rounded-lg border border-[var(--ptr-border)] overflow-hidden">
                    <div className="bg-[var(--ptr-navy)] text-white px-4 py-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-bold">{ta.tool_name}</div>
                        <div className="text-[11px] opacity-75">{ta.overview}</div>
                      </div>
                      <span className="text-[11px] bg-white/20 px-2.5 py-1 rounded-full">{ta.recommendation}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 p-3 text-xs">
                      <div>
                        <div className="font-bold text-[var(--ptr-green)] mb-1">Strengths</div>
                        {ta.strengths?.map((s, j) => (
                          <div key={j} className="py-0.5">
                            {s}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--ptr-red)] mb-1">Challenges</div>
                        {ta.challenges?.map((c, j) => (
                          <div key={j} className="py-0.5">
                            {c}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="font-bold text-[#b08000] mb-1">Gaps</div>
                        {ta.gaps?.map((g, j) => (
                          <div key={j} className="py-0.5">
                            {g}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}

function ExecPanel({ label, content, color }: { label: string; content?: string; color: string }) {
  if (!content) return null;
  const items = content
    .trim()
    .split("\n")
    .filter((l) => l.trim().startsWith("- "));
  return (
    <div className="rounded-r-lg border-l-4 p-3.5" style={{ borderColor: color, background: `${color}0d` }}>
      <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color }}>
        {label}
      </div>
      {items.length ? (
        <ul className="space-y-1">
          {items.map((l, i) => (
            <li key={i} className="text-xs flex gap-2">
              <span style={{ color }}>•</span>
              <span>{l.trim().slice(2)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}

function PillarCard({ title, content }: { title: string; content?: string }) {
  const items = (content || "")
    .trim()
    .split("\n")
    .filter((l) => l.trim().startsWith("- "));
  return (
    <div className="rounded-lg border border-[var(--ptr-border)] p-4">
      <div className="text-sm font-bold text-[var(--ptr-navy)] mb-2">{title}</div>
      {items.length ? (
        <ul className="space-y-1">
          {items.map((l, i) => (
            <li key={i} className="text-xs flex gap-2">
              <span className="text-[var(--ptr-blue)]">•</span>
              <span>{l.trim().slice(2)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--ptr-muted)]">Run assessment to generate content.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-md p-2 text-center">
      <div className="text-sm font-extrabold text-[var(--ptr-navy)]">{value}</div>
      <div className="text-[10px] uppercase text-[var(--ptr-muted)]">{label}</div>
    </div>
  );
}

function fmtMoney(v?: number) {
  return v ? `$${Math.round(v).toLocaleString()}` : "--";
}
