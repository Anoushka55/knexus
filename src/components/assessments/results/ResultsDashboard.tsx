"use client";

import Link from "next/link";
import {
  ArrowRight,
  Grid3x3,
  Hammer,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useAssessmentRun } from "../AssessmentRunContext";
import { KpiTile } from "../KpiTile";
import { GroupBars } from "../charts/GroupBars";
import { MaturityRadar } from "../charts/MaturityRadar";
import { CapabilityHeatmap } from "../charts/CapabilityHeatmap";
import { AssessmentNarrative } from "../AssessmentNarrative";
import { Card, Panel } from "../Card";

/**
 * The whole result on one screen.
 *
 * Everything here is a summary with a fixed row count, so the page stays a
 * dashboard rather than becoming a document — the long lists, per-capability
 * gap bars and the sequenced roadmap all live in the report, one click away.
 */
export function ResultsDashboard() {
  const { definition, outcome, opportunities } = useAssessmentRun();
  const reportHref = `/assessments/${definition.slug}/results/report`;

  const gapCount = outcome.gaps.filter((g) => g.gapScore > 0).length;
  const uncovered = opportunities.forgeCandidates.filter((c) => c.reason === "no-agent");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          icon={TrendingUp}
          label="Overall Business Maturity"
          value={outcome.overall.byGroup.business.toFixed(1)}
          outOf="5"
          tone="business"
          delta={outcome.vsPeer.business}
          deltaLabel="vs illustrative benchmark"
        />
        <KpiTile
          icon={Target}
          label="Overall Agentic AI Maturity"
          value={outcome.overall.byGroup.agentic.toFixed(1)}
          outOf="5"
          tone="agentic"
          delta={outcome.vsPeer.agentic}
          deltaLabel="vs illustrative benchmark"
        />
        <KpiTile
          icon={Grid3x3}
          label="Assessed Capabilities"
          value={String(outcome.counts.capabilities)}
          caption={`across ${outcome.counts.groups} capability groups`}
        />
        <KpiTile
          icon={Lightbulb}
          label="Priority Opportunities"
          value={String(outcome.counts.priorityOpportunities)}
          caption="four or more rungs short of target"
        />
      </div>

      <AssessmentNarrative />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Maturity by Capability Group">
          <GroupBars groups={outcome.groups} />
        </Panel>
        <Panel title="Capability Maturity Radar">
          <MaturityRadar groups={outcome.groups} />
        </Panel>
        <Panel title="Capability Heatmap">
          {/* Capped and scrolled, so 28 rows cannot stretch the dashboard. */}
          <div className="max-h-[19rem] overflow-y-auto pr-1">
            <CapabilityHeatmap capabilities={outcome.capabilities} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Key Strengths"
          icon={<TrendingUp className="h-4 w-4 text-brand-green" />}
        >
          <ol className="space-y-2.5">
            {outcome.strengths.map((s, i) => (
              <li key={s.capability.id} className="flex gap-2.5">
                <Rank index={i} tone="green" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug text-slate-800">
                    {s.capability.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Business {s.business} · Agentic {s.agentic} — {s.group.shortLabel}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel
          title="Top Maturity Gaps"
          icon={<TriangleAlert className="h-4 w-4 text-amber-500" />}
          action={{ href: reportHref, label: `All ${gapCount}` }}
        >
          <ol className="space-y-2.5">
            {outcome.gaps.slice(0, 5).map((g, i) => (
              <li key={g.capability.id} className="flex gap-2.5">
                <Rank index={i} tone="amber" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-slate-800">
                    {g.capability.label}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-xs text-slate-500">
                      Current {g.agentic} · Target {g.target}
                    </span>
                    <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[0.65rem] font-bold text-red-600">
                      Gap {g.gapScore}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel
          title="Recommended AI Opportunities"
          icon={<Lightbulb className="h-4 w-4 text-amber-500" />}
          action={{
            href: reportHref,
            label: `All ${opportunities.opportunities.length}`,
          }}
        >
          <ul className="space-y-2">
            {opportunities.opportunities.slice(0, 5).map((o) => (
              <li key={o.agent.id}>
                <Link
                  href={`/agents/${o.agent.id}`}
                  className="group -mx-2 flex gap-2.5 rounded-lg p-2 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-brand-blue">
                        {o.agent.title}
                      </p>
                      <span className="flex-shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-[0.62rem] font-bold text-green-700">
                        {o.totalRungs} rung{o.totalRungs === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {o.rationale}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-slate-300 group-hover:text-brand-blue" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {uncovered.length > 0 && (
        <Card>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Hammer className="h-4 w-4 text-amber-500" />
              No agent covers these yet
            </span>
            {uncovered.map((c) => (
              <span
                key={c.result.capability.id}
                className="rounded-full border border-dashed border-amber-300 bg-amber-50/60 px-2.5 py-1 text-xs font-semibold text-slate-700"
              >
                {c.result.capability.label}
              </span>
            ))}
            <Link
              href="/forge"
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline print:hidden"
            >
              Build in Agent Forge <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
          {outcome.benchmark.disclosure}
        </p>
        <Link
          href={reportHref}
          className="inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline print:hidden"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Full report with per-capability detail and roadmap
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Card>
    </div>
  );
}

function Rank({ index, tone }: { index: number; tone: "green" | "amber" }) {
  return (
    <span
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ${
        tone === "green" ? "bg-green-50 text-brand-green" : "bg-amber-50 text-amber-600"
      }`}
    >
      {index + 1}
    </span>
  );
}
