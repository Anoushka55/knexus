"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Download,
  Grid3x3,
  Layers,
  Lightbulb,
  Radio,
  Target,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { useAssessmentRun } from "../AssessmentRunContext";
import { ShareButton } from "../ShareButton";
import { GroupBars } from "../charts/GroupBars";
import { MaturityRadar } from "../charts/MaturityRadar";
import { CapabilityHeatmap } from "../charts/CapabilityHeatmap";
import { CHART } from "../charts/palette";

/**
 * The executive cockpit: the whole result inside one desktop viewport.
 *
 * The layout is a flex column with two rows that flex — the analytics row and
 * the panel row — and everything else fixed. That is deliberate: it cannot
 * produce page scroll at any viewport height, it simply gives the charts less
 * room and lets each panel scroll internally. Fixed pixel heights would fit
 * 1440x900 exactly and break on every other screen.
 *
 * Every figure here is computed. Nothing on this page is a constant.
 */
export function ResultsCockpit() {
  const { definition, input, outcome, opportunities } = useAssessmentRun();
  const scope = definition.scopes.find((s) => s.id === input.scopeId);
  const reportHref = `/assessments/${definition.slug}/results/report`;

  const completed = input.completedOn
    ? new Date(input.completedOn).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "In progress";

  const gapCount = outcome.gaps.filter((g) => g.gapScore > 0).length;

  return (
    // data-cockpit is what the globals.css rules key off to cap main and drop
    // the footer — see the cockpit block there.
    <div
      data-cockpit="true"
      className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-6 py-4"
    >
      {/* Title, context and actions on one band. */}
      <header className="flex flex-none flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-blue">
            Assessment results
          </p>
          <h1 className="truncate text-2xl font-extrabold leading-tight tracking-tight text-slate-900">
            {definition.title}
          </h1>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            A consolidated view of current maturity, capability gaps and the agents that close them.
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-4">
          <dl className="hidden items-center gap-4 rounded-xl border border-slate-200 bg-white px-3 py-2 xl:flex">
            <Meta icon={Radio} label="Industry" value={input.industryLabel} />
            <Meta icon={Layers} label="Scope" value={scope?.label ?? "—"} />
            <Meta icon={CalendarDays} label="Completed" value={completed} />
          </dl>
          <div className="flex items-center gap-2">
            <ShareButton />
            <Link
              href={reportHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
            >
              <Download className="h-3.5 w-3.5" />
              Download report
            </Link>
          </div>
        </div>
      </header>

      <div className="grid flex-none grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          icon={TrendingUp}
          tint="#16a34a"
          label="Overall Business Maturity"
          value={outcome.overall.byGroup.business.toFixed(1)}
          outOf="5"
          bar={outcome.overall.byGroup.business / 5}
          barColor={CHART.business}
          delta={outcome.vsPeer.business}
        />
        <Kpi
          icon={Target}
          tint="#8B5CF6"
          label="Overall Agentic AI Maturity"
          value={outcome.overall.byGroup.agentic.toFixed(1)}
          outOf="5"
          bar={outcome.overall.byGroup.agentic / 5}
          barColor={CHART.agentic}
          delta={outcome.vsPeer.agentic}
        />
        <Kpi
          icon={Grid3x3}
          tint="#2649a8"
          label="Assessed Capabilities"
          value={String(outcome.counts.capabilities)}
          caption={`Across ${outcome.counts.groups} capability groups`}
        />
        <Kpi
          icon={Lightbulb}
          tint="#f3a54a"
          label="Priority Opportunities"
          value={String(outcome.counts.priorityOpportunities)}
          caption="Four or more rungs short of target"
        />
      </div>

      {/* The two rows that absorb whatever height is left. */}
      <div className="grid min-h-0 flex-[3] grid-cols-1 gap-3 xl:grid-cols-3">
        <Panel title="Maturity by Capability Group">
          <GroupBars groups={outcome.groups} />
        </Panel>
        <Panel title="Capability Maturity">
          <MaturityRadar groups={outcome.groups} compact />
        </Panel>
        <Panel title="Capability Heatmap">
          <CapabilityHeatmap capabilities={outcome.capabilities} compact />
        </Panel>
      </div>

      <div className="grid min-h-0 flex-[2] grid-cols-1 gap-3 xl:grid-cols-3">
        <Panel
          title="Key Strengths"
          icon={<TrendingUp className="h-3.5 w-3.5 text-brand-green" />}
          action={{ href: reportHref, label: `View all (${outcome.counts.capabilities})` }}
        >
          <ol className="space-y-2">
            {outcome.strengths.slice(0, 4).map((s, i) => (
              <li key={s.capability.id} className="flex gap-2.5">
                <Rank index={i} tone="green" />
                <div className="min-w-0">
                  <p className="truncate text-[0.82rem] font-semibold text-slate-800">
                    {s.capability.label}
                  </p>
                  <p className="truncate text-[0.7rem] text-slate-500">
                    Business {s.business} · Agentic {s.agentic} — {s.group.shortLabel}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel
          title="Top Maturity Gaps"
          icon={<TriangleAlert className="h-3.5 w-3.5 text-amber-500" />}
          action={{ href: reportHref, label: `View all (${gapCount})` }}
        >
          <ol className="space-y-2">
            {outcome.gaps.slice(0, 4).map((g, i) => (
              <li key={g.capability.id} className="flex gap-2.5">
                <Rank index={i} tone="amber" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.82rem] font-semibold text-slate-800">
                    {g.capability.label}
                  </p>
                  <p className="flex items-center gap-2 text-[0.7rem] text-slate-500">
                    Current {g.agentic} · Target {g.target}
                    <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[0.62rem] font-bold text-red-600">
                      Gap {g.gapScore}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel
          title="Recommended AI Opportunities"
          icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
          action={{
            href: reportHref,
            label: `View all (${opportunities.opportunities.length})`,
          }}
        >
          <ul className="space-y-1">
            {opportunities.opportunities.slice(0, 4).map((o) => (
              <li key={o.agent.id}>
                <Link
                  href={`/agents/${o.agent.id}`}
                  className="group -mx-1.5 flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.82rem] font-semibold text-slate-800 group-hover:text-brand-blue">
                      {o.agent.title}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {o.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="truncate rounded bg-slate-100 px-1.5 py-0.5 text-[0.6rem] font-semibold text-slate-500"
                        >
                          {t}
                        </span>
                      ))}
                      <span className="flex-shrink-0 text-[0.6rem] font-bold text-green-700">
                        {o.totalRungs} rung{o.totalRungs === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300 group-hover:text-brand-blue" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <p className="flex-none truncate text-[0.65rem] text-slate-400" title={outcome.benchmark.disclosure}>
        {outcome.benchmark.disclosure}
      </p>
    </div>
  );
}

/** A panel that never grows the page — it scrolls inside its own box instead. */
function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-card">
      <div className="mb-2.5 flex flex-none items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 truncate text-[0.82rem] font-bold tracking-tight text-slate-900">
          {icon}
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="flex-shrink-0 text-[0.68rem] font-semibold text-brand-blue hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">{children}</div>
    </section>
  );
}

function Kpi({
  icon: Icon,
  tint,
  label,
  value,
  outOf,
  caption,
  bar,
  barColor,
  delta,
}: {
  icon: ComponentType<LucideProps>;
  tint: string;
  label: string;
  value: string;
  outOf?: string;
  caption?: string;
  bar?: number;
  barColor?: string;
  delta?: number;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-card">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tint}1a`, color: tint }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="truncate text-[0.7rem] font-semibold text-slate-500">{label}</p>
      </div>

      <p className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold tabular-nums leading-none tracking-tight text-slate-900">
          {value}
        </span>
        {outOf && <span className="text-xs font-semibold text-slate-400">/ {outOf}</span>}
      </p>

      {delta !== undefined && (
        <p
          className={`mt-1 truncate text-[0.65rem] font-semibold ${
            up ? "text-brand-green" : "text-red-500"
          }`}
        >
          {up ? "↑ +" : "↓ "}
          {delta.toFixed(1)} vs illustrative benchmark
        </p>
      )}
      {caption && <p className="mt-1 truncate text-[0.65rem] text-slate-400">{caption}</p>}

      {bar !== undefined && barColor && (
        <div
          className="mt-2 h-1 overflow-hidden rounded-full"
          style={{ backgroundColor: CHART.track }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(2, bar * 100)}%`, backgroundColor: barColor }}
          />
        </div>
      )}
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
      <div className="min-w-0">
        <dt className="text-[0.62rem] leading-tight text-slate-400">{label}</dt>
        <dd className="truncate text-[0.7rem] font-bold leading-tight text-slate-700">{value}</dd>
      </div>
    </div>
  );
}

function Rank({ index, tone }: { index: number; tone: "green" | "amber" }) {
  return (
    <span
      className={`flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold ${
        tone === "green" ? "bg-green-50 text-brand-green" : "bg-amber-50 text-amber-600"
      }`}
      style={{ height: 18, width: 18 }}
    >
      {index + 1}
    </span>
  );
}
