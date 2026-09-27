"use client";

import Link from "next/link";
import { ArrowRight, Grid3x3, Lightbulb, Target, TrendingUp, TriangleAlert } from "lucide-react";
import { useAssessmentRun } from "../AssessmentRunContext";
import { KpiTile } from "../KpiTile";
import { GroupBars } from "../charts/GroupBars";
import { MaturityRadar } from "../charts/MaturityRadar";
import { CapabilityHeatmap } from "../charts/CapabilityHeatmap";
import { AssessmentNarrative } from "../AssessmentNarrative";
import { Card, Panel } from "../Card";

export function ExecutiveSummary() {
  const { definition, outcome, opportunities } = useAssessmentRun();
  const base = `/assessments/${definition.slug}`;

  return (
    <div className="space-y-6">
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
          caption="capabilities four or more rungs short"
        />
      </div>

      <AssessmentNarrative />

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Maturity by Capability Group">
          <GroupBars
            groups={outcome.groups}
            drillHref={(id) => `${base}/results/capabilities?group=${id}`}
          />
        </Panel>
        <Panel title="Capability Maturity Radar">
          <MaturityRadar groups={outcome.groups} />
        </Panel>
        <Panel title="Capability Heatmap">
          <CapabilityHeatmap capabilities={outcome.capabilities.slice(0, 10)} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Key Strengths"
          icon={<TrendingUp className="h-4 w-4 text-brand-green" />}
          action={{ href: `${base}/results/capabilities`, label: "View all" }}
        >
          <ol className="space-y-3">
            {outcome.strengths.map((s, i) => (
              <li key={s.capability.id} className="flex gap-3">
                <Rank index={i} tone="green" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{s.capability.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Business {s.business} · Agentic {s.agentic} — {s.group.label}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel
          title="Top Maturity Gaps"
          icon={<TriangleAlert className="h-4 w-4 text-amber-500" />}
          action={{ href: `${base}/results/gaps`, label: `View all (${outcome.gaps.filter((g) => g.gapScore > 0).length})` }}
        >
          <ol className="space-y-3">
            {outcome.gaps.slice(0, 5).map((g, i) => (
              <li key={g.capability.id} className="flex gap-3">
                <Rank index={i} tone="amber" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{g.capability.label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-slate-500">
                      Current {g.agentic} · Target {g.target}
                    </span>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[0.68rem] font-bold text-red-600">
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
            href: `${base}/results/recommendations`,
            label: `View all (${opportunities.opportunities.length})`,
          }}
        >
          <ul className="space-y-3">
            {opportunities.opportunities.slice(0, 3).map((o) => (
              <li key={o.agent.id}>
                <Link
                  href={`/agents/${o.agent.id}`}
                  className="group flex gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-blue">
                      {o.agent.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{o.rationale}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-300 group-hover:text-brand-blue" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Card className="text-xs leading-relaxed text-slate-500">
        {outcome.benchmark.disclosure}
      </Card>
    </div>
  );
}

function Rank({ index, tone }: { index: number; tone: "green" | "amber" }) {
  return (
    <span
      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${
        tone === "green" ? "bg-green-50 text-brand-green" : "bg-amber-50 text-amber-600"
      }`}
    >
      {index + 1}
    </span>
  );
}
