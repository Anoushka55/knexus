'use client'

import { ArrowDownRight, ArrowUpRight, Gauge, ListChecks, ShieldAlert } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { ExperienceRevenueBand } from '@/lib/kpmg-dice/components/feedback/experience-revenue-band'
import { PossessionSimulator } from '@/lib/kpmg-dice/components/feedback/possession-simulator'
import { SilentDetractorBand } from '@/lib/kpmg-dice/components/feedback/silent-detractor-band'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { useFeedbackData } from '@/lib/kpmg-dice/lib/selectors/use-feedback-data'
import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import type { Intervention } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Voice-of-Customer Control Tower.
 *
 * The executive close: what is moving satisfaction, what is at risk, and what
 * is being done about it. Impact and effort are configured inputs rather than
 * model outputs — presenting a prioritisation as if it were predicted would
 * overclaim exactly where the guardrails say not to.
 */

/*
 * Status is an ordered progression, not a set of categories, so it takes a
 * single hue stepped light to dark rather than four unrelated colours.
 *
 * Steps validated: monotonic in lightness, adjacent CVD separation 14.6 dE
 * against a target of 8. The lightest step sits at 2.85:1 against the plot
 * surface, under the 3:1 bar, which is discharged the way the rule requires --
 * every mark carries a visible number and the same rows are listed as text in
 * the backlog directly below.
 */
const STATUS_RAMP: Record<Intervention['status'], { fill: string; ink: string }> =
  {
    backlog: { fill: '#6B9BCC', ink: '#0F172A' },
    planned: { fill: '#2E6DB4', ink: '#FFFFFF' },
    'in-flight': { fill: '#00338D', ink: '#FFFFFF' },
    done: { fill: '#00338D', ink: '#FFFFFF' },
  }

const STATUS_ORDER: Intervention['status'][] = ['backlog', 'planned', 'in-flight']

const STATUS_TONE: Record<Intervention['status'], string> = {
  backlog: 'bg-slate-100 text-slate-600',
  planned: 'bg-sky-50 text-sky-700',
  'in-flight': 'bg-kpmg-blue/10 text-kpmg-blue',
  done: 'bg-emerald-50 text-emerald-700',
}

function DriverRow({
  label,
  aspect,
  mentions,
  delta,
}: {
  label: string
  aspect: string
  mentions: number
  delta: number
}) {
  const positive = delta > 0
  return (
    <li className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0">
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg',
          positive ? 'bg-kpmg-teal/10' : 'bg-red-50',
        )}
      >
        {positive ? (
          <ArrowUpRight className="size-3.5 text-kpmg-teal" strokeWidth={2.4} />
        ) : (
          <ArrowDownRight className="size-3.5 text-red-600" strokeWidth={2.4} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-slate-900">
          {label}
        </p>
        <p className="truncate text-[11px] text-slate-500">
          {aspect} · {formatNumber(mentions)} mentions
        </p>
      </div>
      <span
        className={cn(
          'nums shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-bold',
          positive
            ? 'bg-kpmg-teal/10 text-kpmg-teal'
            : 'bg-red-50 text-red-700',
        )}
      >
        {positive ? '+' : ''}
        {delta}
      </span>
    </li>
  )
}

export function ControlTower() {
  const { drivers, interventions, recovery, nps, npsTrend, clusters, issueTrends } =
    useFeedbackData()

  const previous = npsTrend.filter((p) => p.responses > 0).slice(-2)[0]
  const npsDelta = previous ? nps.nps - previous.nps : 0

  /* Impact-effort matrix: high impact / low effort is the top-left quadrant. */
  const maxImpact = 10
  const maxEffort = 10

  // Complaint range drives the area scale for the marks.
  const complaintCounts = interventions.map(
    (i) => clusters.find((c) => c.id === i.clusterId)?.affectedResponses ?? 0,
  )
  const maxComplaints = Math.max(...complaintCounts, 1)
  const minComplaints = Math.min(...complaintCounts, 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Net Promoter Score"
          value={`${nps.nps > 0 ? '+' : ''}${nps.nps}`}
          sub={`${npsDelta >= 0 ? '+' : ''}${npsDelta} vs previous month`}
          icon={Gauge}
        />
        <StatTile
          label="Detractors"
          value={`${nps.detractorPct}%`}
          sub={`${formatNumber(nps.detractors)} responses`}
          icon={ShieldAlert}
          danger
        />
        <StatTile
          label="Recovery closure"
          value={`${recovery.closureRatePct}%`}
          sub={`${formatNumber(recovery.breaching)} breaching SLA`}
          icon={ListChecks}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Interventions"
          value={formatNumber(interventions.length)}
          sub={`${interventions.filter((i) => i.status === 'in-flight').length} in flight`}
          icon={ListChecks}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
      </div>

      {/*
        What the dissatisfaction is worth, and how much of the score the record
        supports. Placed above the drivers because an executive asks what it
        costs before asking what caused it.
      */}
      <ExperienceRevenueBand />

      {/*
        The half of the book that never answered.

        Directly beneath the measured figures and visually distinct from them —
        it is a prediction, and the two must never be read as one number.
      */}
      <SilentDetractorBand />

      {/*
        The forward-looking one.

        Everything above reports what the book already says. This asks what it
        would say after a decision nobody has taken yet — which is the only
        version a board can act on before the fact.
      */}
      <PossessionSimulator />

      {/* Drivers, both directions */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>What is lifting satisfaction</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {drivers.strengths.length ? (
              <ul>
                {drivers.strengths.map((d) => (
                  <DriverRow
                    key={d.label}
                    label={d.label}
                    aspect={d.aspect}
                    mentions={d.mentions}
                    delta={d.npsDelta}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-[12px] text-slate-400">
                No theme is lifting NPS above the book mean.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>What is dragging it down</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul>
              {drivers.drags.map((d) => (
                <DriverRow
                  key={d.label}
                  label={d.label}
                  aspect={d.aspect}
                  mentions={d.mentions}
                  delta={d.npsDelta}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/*
        Issue trends.

        The drivers panels say what is hurting now. This says whether it is
        getting better or worse, which is the only version a board can act on.
      */}
      <Card>
        <CardHeader>
          <CardTitle>Issue trends</CardTitle>
          <span className="text-[10.5px] font-medium text-slate-400">
            Complaints per month · worsening first
          </span>
        </CardHeader>
        <CardContent className="pb-4">
          <ul className="space-y-2.5">
            {issueTrends.map((series) => {
              const peak = Math.max(...series.points.map((pt) => pt.mentions), 1)
              return (
                <li key={series.themeId} className="flex items-center gap-3">
                  <span className="w-[168px] shrink-0 truncate text-[12px] text-slate-700">
                    {series.label}
                  </span>

                  {/* Sparkline: bars share one scale, endpoint emphasised. */}
                  <span className="flex h-8 min-w-0 flex-1 items-end gap-[3px]">
                    {series.points.map((pt, i) => (
                      <span
                        key={pt.month}
                        title={`${pt.month} — ${pt.mentions} complaints`}
                        className={cn(
                          'min-w-0 flex-1 rounded-sm',
                          i === series.points.length - 1
                            ? 'bg-kpmg-blue'
                            : 'bg-slate-200',
                        )}
                        style={{
                          height: `${Math.max(6, (pt.mentions / peak) * 100)}%`,
                        }}
                      />
                    ))}
                  </span>

                  <span
                    className={cn(
                      'nums w-[42px] shrink-0 text-right text-[12px] font-bold',
                      series.change > 0
                        ? 'text-red-600'
                        : series.change < 0
                          ? 'text-kpmg-teal'
                          : 'text-slate-400',
                    )}
                  >
                    {series.change > 0 ? '+' : ''}
                    {series.change}
                  </span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Impact-effort matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Intervention priority &mdash; impact against effort</CardTitle>
          <span className="text-[10.5px] font-medium text-slate-400">
            Configured inputs, not predictions
          </span>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Plot, with room reserved on the left and below for the axes. */}
          <div className="flex gap-2">
            {/* y axis */}
            <div className="flex w-[18px] shrink-0 flex-col items-center justify-between py-1">
              <span className="nums text-[9.5px] text-slate-400">10</span>
              <span
                className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                Impact &rarr;
              </span>
              <span className="nums text-[9.5px] text-slate-400">1</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="relative h-[280px] w-full rounded-lg border border-slate-200 bg-slate-50/50">
                {/* Quadrant guides. Only the acting quadrant is tinted. */}
                <div className="absolute left-0 top-0 h-1/2 w-1/2 rounded-tl-lg bg-kpmg-teal/[0.06]" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-slate-200" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />

                <span className="absolute left-2.5 top-2 text-[10px] font-bold uppercase tracking-wider text-kpmg-teal">
                  Do first
                </span>
                <span className="absolute right-2.5 top-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Plan
                </span>
                <span className="absolute bottom-2 left-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Quick wins
                </span>
                <span className="absolute bottom-2 right-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Deprioritise
                </span>

                {/*
                  Three encodings, not one. Position is impact against effort,
                  area is how many complaints the intervention answers, and the
                  fill steps with its status. The number keys to the backlog
                  below and is what stopped the labels colliding.
                */}
                {interventions.map((intervention, i) => {
                  const cluster = clusters.find(
                    (c) => c.id === intervention.clusterId,
                  )
                  const complaints = cluster?.affectedResponses ?? 0

                  // Area-scaled: radius by sqrt, because a diameter read
                  // linearly exaggerates a large value by its square.
                  const span = Math.sqrt(maxComplaints) - Math.sqrt(minComplaints)
                  const t = span
                    ? (Math.sqrt(complaints) - Math.sqrt(minComplaints)) / span
                    : 0
                  const size = Math.round(22 + t * 16)
                  const tone = STATUS_RAMP[intervention.status]

                  return (
                    <div
                      key={intervention.id}
                      title={`${i + 1}. ${intervention.title} — impact ${intervention.impact}, effort ${intervention.effort} · ${formatNumber(complaints)} complaints · ${intervention.status} · ${intervention.owner}`}
                      className="absolute flex -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full font-bold ring-2 ring-white"
                      style={{
                        left: `${(intervention.effort / maxEffort) * 82 + 9}%`,
                        bottom: `${(intervention.impact / maxImpact) * 74 + 12}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        fontSize: `${Math.max(10, Math.round(size * 0.42))}px`,
                        backgroundColor: tone.fill,
                        color: tone.ink,
                      }}
                    >
                      {i + 1}
                    </div>
                  )
                })}
              </div>

              {/* x axis */}
              <div className="mt-1 flex items-center justify-between px-1">
                <span className="nums text-[9.5px] text-slate-400">1</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Effort &rarr;
                </span>
                <span className="nums text-[9.5px] text-slate-400">10</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Size
              </span>
              <span className="size-2.5 rounded-full bg-slate-300" />
              <span className="size-4 rounded-full bg-slate-300" />
              <span className="text-[11.5px] text-slate-500">
                complaints answered
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Status
              </span>
              {STATUS_ORDER.map((status) => (
                <span key={status} className="flex items-center gap-1.5">
                  <span
                    className="size-3 rounded-full ring-1 ring-white"
                    style={{ backgroundColor: STATUS_RAMP[status].fill }}
                  />
                  <span className="text-[11.5px] capitalize text-slate-500">
                    {status}
                  </span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Number
              </span>
              <span className="text-[11.5px] text-slate-500">
                matches the backlog row below
              </span>
            </div>
          </div>

          <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-500">
            Both axes run 1 to 10, so the empty lower band is a finding rather
            than a gap: every issue large enough to cluster is high impact, and
            they separate on effort instead.
          </p>
        </CardContent>
      </Card>

      {/* Intervention backlog */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement backlog</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul>
            {interventions.map((intervention, i) => {
              const cluster = clusters.find(
                (c) => c.id === intervention.clusterId,
              )
              return (
                <li
                  key={intervention.id}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0"
                >
                  {/* Matches the numbered dot on the matrix above. */}
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-kpmg-blue text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-slate-900">
                      {intervention.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {intervention.owner}
                      {cluster
                        ? ` · ${formatNumber(cluster.affectedResponses)} complaints · ${cluster.npsDrag} NPS among them`
                        : ''}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    <span className="nums rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      I{intervention.impact}
                    </span>
                    <span className="nums rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      E{intervention.effort}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider',
                      STATUS_TONE[intervention.status],
                    )}
                  >
                    {intervention.status}
                  </span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
