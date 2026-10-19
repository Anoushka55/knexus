'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

import {
  BEAT_META,
  FEEDBACK_TYPE_META,
  useCasesOfType,
  type UseCaseDef,
} from './use-cases'
import { useFeedbackData } from '@/lib/kpmg-dice/lib/selectors/use-feedback-data'
import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * The hub.
 *
 * Renders the capability table as the product: two labelled type sections, all
 * nine use cases named, and the limitation callout on the seam between them —
 * where it lands on a reader who has just seen what is being limited.
 */

/** Live figure shown on each card, so the hub reads as a product not a slide. */
type Metric = { label: string; value: string }

function TypeOneCard({
  useCase,
  metric,
}: {
  useCase: UseCaseDef
  metric: Metric
}) {
  const Icon = useCase.icon

  return (
    <Link
      href={`/agents/kpmg-dice/console/csat-nps/${useCase.slug}#${useCase.anchor}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-card-hover"
    >
      {/* Flat slate band — Type 1 carries no narrative beat by design. */}
      <div className="h-1 bg-slate-300" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Icon className="size-4 text-slate-500" strokeWidth={2.1} />
          </span>
          <h3 className="mt-1 text-[14px] font-bold leading-snug tracking-[-0.01em] text-slate-900">
            {useCase.name}
          </h3>
        </div>

        {/* Slate numerals: the plainness is the argument, and a brand-blue
            figure here would read as the same class of thing as Type 2. */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {metric.label}
          </p>
          <p className="text-[22px] font-bold leading-tight text-slate-700">
            {metric.value}
          </p>
        </div>

        <p className="text-[11.5px] leading-snug text-slate-500">
          {useCase.problem}
        </p>
      </div>
    </Link>
  )
}

function TypeTwoCard({
  useCase,
  metric,
  chip,
}: {
  useCase: UseCaseDef
  metric: Metric
  chip?: { text: string; tone: string }
}) {
  const Icon = useCase.icon
  const beat = useCase.beat ? BEAT_META[useCase.beat] : undefined

  return (
    <Link
      href={`/agents/kpmg-dice/console/csat-nps/${useCase.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-card-hover"
    >
      {beat && (
        <div
          className={cn(
            'px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.09em]',
            beat.band,
            beat.text,
          )}
        >
          {beat.label}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-kpmg-blue/10">
            <Icon className="size-4 text-kpmg-blue" strokeWidth={2.1} />
          </span>
          <h3 className="mt-1 text-[14px] font-bold leading-snug tracking-[-0.01em] text-slate-900">
            {useCase.name}
          </h3>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {metric.label}
            </p>
            <p className="text-[22px] font-bold leading-tight text-kpmg-blue">
              {metric.value}
            </p>
          </div>
          {chip && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                chip.tone,
              )}
            >
              {chip.text}
            </span>
          )}
        </div>

        <p className="text-[11.5px] leading-snug text-slate-500">
          {useCase.problem}
        </p>

        {/*
          The div stays even when there is no agent name: its mt-auto is what
          pins this row to the bottom of the card. justify-between goes with the
          badge — with one child left it would have shifted the agent name.
        */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          {useCase.agentName && (
            <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-kpmg-violet">
              <Sparkles className="size-3" strokeWidth={2.3} />
              {useCase.agentName}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function CsatNpsHub() {
  const data = useFeedbackData()

  const typeOneMetrics: Record<string, Metric> = {
    'nps-performance': { label: 'NPS', value: `${data.nps.nps > 0 ? '+' : ''}${data.nps.nps}` },
    'csat-service': {
      label: 'Avg CSAT',
      value: `${(
        data.csatByTouchpoint.reduce((s, t) => s + t.csat, 0) /
        Math.max(1, data.csatByTouchpoint.length)
      ).toFixed(1)} / 5`,
    },
    'sentiment-reporting': {
      label: 'Negative',
      value: `${Math.round(
        (data.sentiment.negative / Math.max(1, data.sentiment.total)) * 100,
      )}%`,
    },
  }

  const emerging = data.themes.filter((t) => t.emerging).length

  const typeTwoMetrics: Record<
    string,
    { metric: Metric; chip?: { text: string; tone: string } }
  > = {
    'survey-optimizer': {
      metric: { label: 'In queue', value: formatNumber(data.queue.queued.length) },
      chip: {
        text: `${data.queue.queueMeanPropensity} avg`,
        tone: 'bg-emerald-50 text-emerald-700',
      },
    },
    'feedback-journey': {
      metric: {
        label: 'Suppressed',
        value: formatNumber(data.queue.suppressed.length),
      },
      chip: {
        text: `${data.queue.responseRatePct}% response`,
        tone: 'bg-sky-50 text-sky-700',
      },
    },
    'voc-analyzer': {
      metric: { label: 'Themes', value: formatNumber(data.themes.length) },
      chip: emerging
        ? { text: `${emerging} emerging`, tone: 'bg-amber-50 text-amber-700' }
        : undefined,
    },
    'root-cause': {
      metric: { label: 'Clusters', value: formatNumber(data.clusters.length) },
      chip: data.clusters.length
        ? {
            text: `${data.clusters[0].npsDrag} NPS`,
            tone: 'bg-red-50 text-red-700',
          }
        : undefined,
    },
    'detractor-recovery': {
      metric: {
        label: 'Open cases',
        value: formatNumber(data.recovery.open + data.recovery.inProgress),
      },
      chip: data.recovery.breaching
        ? {
            text: `${data.recovery.breaching} breaching`,
            tone: 'bg-red-50 text-red-700',
          }
        : undefined,
    },
    'control-tower': {
      metric: {
        label: 'Interventions',
        value: formatNumber(data.interventions.length),
      },
      chip: {
        text: `${data.recovery.closureRatePct}% closed`,
        tone: 'bg-amber-50 text-amber-700',
      },
    },
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-rail-800 p-5 text-white shadow-card">
        <div className="min-w-0">
          {/*
            Not the page title again — the app header already renders that
            directly above, and repeating it verbatim wasted the strongest line
            on the screen. This names what the feature does instead, the way the
            agent gallery's banner says "DICE Agent Layer" under "AI Insights".
          */}
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">
            Customer Feedback Intelligence
          </h2>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-white/60">
            Nine capabilities across two types. Reporting says what happened;
            the intelligence layer decides who to ask, explains why a
            score moved, and turns a detractor into a governed recovery action.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-white/50">
            Responses analysed
          </p>
          <p className="text-[26px] font-bold leading-tight">
            {formatNumber(data.nps.responses)}
          </p>
        </div>
      </div>

      {/* Type 1 */}
      <section className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3
            className={cn(
              'text-[13px] font-bold uppercase tracking-wider',
              FEEDBACK_TYPE_META['type-1'].accent,
            )}
          >
            {FEEDBACK_TYPE_META['type-1'].label}
          </h3>
          <p className="min-w-0 text-[11.5px] text-slate-400">
            {FEEDBACK_TYPE_META['type-1'].blurb}
          </p>
          {FEEDBACK_TYPE_META['type-1'].caption && (
            <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-500">
              {FEEDBACK_TYPE_META['type-1'].caption}
            </span>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {useCasesOfType('type-1').map((useCase) => (
            <TypeOneCard
              key={useCase.anchor}
              useCase={useCase}
              metric={typeOneMetrics[useCase.anchor ?? ''] ?? { label: '', value: '—' }}
            />
          ))}
        </div>
      </section>

      {/* Type 2 */}
      <section className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3
            className={cn(
              'text-[13px] font-bold uppercase tracking-wider',
              FEEDBACK_TYPE_META['type-2'].accent,
            )}
          >
            {FEEDBACK_TYPE_META['type-2'].label}
          </h3>
          <p className="min-w-0 text-[11.5px] text-slate-400">
            {FEEDBACK_TYPE_META['type-2'].blurb}
          </p>
          <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-500">
            {FEEDBACK_TYPE_META['type-2'].caption}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {useCasesOfType('type-2').map((useCase) => (
            <TypeTwoCard
              key={useCase.slug}
              useCase={useCase}
              metric={typeTwoMetrics[useCase.slug]?.metric ?? { label: '', value: '—' }}
              chip={typeTwoMetrics[useCase.slug]?.chip}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
