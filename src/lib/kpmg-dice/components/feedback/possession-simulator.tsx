'use client'

import { useMemo, useState } from 'react'
import { CalendarClock } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { InferredNote } from './guardrails'
import {
  usePossessionImpact,
  TURN_RATE_PER_30_DAYS,
} from '@/lib/kpmg-dice/lib/selectors/use-possession-impact'
import { useReference } from '@/lib/kpmg-dice/data/use-reference'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * "We are going to be ninety days late. What happens?"
 *
 * The decision a developer agonises over, with nowhere to ask it. Qualtrics
 * holds no construction schedule and no booked revenue; the real-estate CRMs
 * hold both and have no experience model to run them through. This sits in the
 * gap and prices the announcement before it is made.
 *
 * The screen is explicit about which half of the answer is which — who is
 * exposed and what they are worth is read off the record, while how many of
 * them turn is a stated assumption you are meant to push back on.
 */

const SLIPS = [0, 30, 60, 90, 180]

export function PossessionSimulator() {
  const { projects } = useReference()
  const bookings = useCrmStore((s) => s.bookings)
  const surveyResponses = useCrmStore((s) => s.surveyResponses)

  /*
   * Opens on the most exposed project that customers have actually rated.
   *
   * Two conditions, and both are needed. Ranking by booked value alone opened
   * on a project with no feedback against it, because the feedback programme
   * runs on six active projects while bookings span all seventeen — so the
   * panel showed real money and a score that could not move, which reads as a
   * bug rather than as the coverage gap it is.
   */
  const busiest = useMemo(() => {
    const valueByProject = new Map<string, number>()
    for (const b of bookings) {
      valueByProject.set(
        b.projectId,
        (valueByProject.get(b.projectId) ?? 0) + b.valueCr,
      )
    }
    const rated = new Set(surveyResponses.map((r) => r.projectId))

    let best = projects[0]?.id ?? ''
    let bestValue = -1
    let bestRated = false
    for (const project of projects) {
      const value = valueByProject.get(project.id) ?? 0
      const isRated = rated.has(project.id)
      // A rated project always beats an unrated one, whatever the value.
      if (isRated !== bestRated ? isRated : value > bestValue) {
        bestValue = value
        bestRated = isRated
        best = project.id
      }
    }
    return best
  }, [bookings, surveyResponses, projects])

  const [chosen, setChosen] = useState<string | null>(null)
  const projectId = chosen ?? busiest
  const setProjectId = setChosen
  const [slipDays, setSlipDays] = useState(90)

  const impact = usePossessionImpact(projectId, slipDays)
  if (!impact) return null

  const none = impact.affectedCustomers === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5 text-kpmg-violet" />
            Possession slip — what it would cost
          </span>
        </CardTitle>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Project"
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11.5px] font-medium text-slate-700"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </CardHeader>

      <CardContent className="pb-4">
        {/* The decision being simulated */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[11.5px] text-slate-500">
            Handover currently{' '}
            <span className="font-semibold text-slate-700">
              {impact.possession}
            </span>
            . Slip by
          </span>
          <div className="flex gap-1" role="group" aria-label="Slip in days">
            {SLIPS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSlipDays(d)}
                aria-pressed={d === slipDays}
                className={cn(
                  'rounded-md border px-2 py-1 text-[11.5px] font-semibold transition-colors',
                  d === slipDays
                    ? 'border-kpmg-violet bg-kpmg-violet/10 text-kpmg-violet'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {d === 0 ? 'No slip' : `${d}d`}
              </button>
            ))}
          </div>
        </div>

        {none ? (
          <p className="mt-4 text-[12.5px] text-slate-500">
            No bookings on this project, so a slip has nobody to affect.
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
              {/* Reach — read off the record */}
              <div className="lg:border-r lg:border-slate-100 lg:pr-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Customers exposed
                </p>
                <p className="nums mt-1 text-[26px] font-bold leading-none text-slate-900">
                  {formatNumber(impact.affectedCustomers)}
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
                  holding{' '}
                  <span className="font-semibold text-slate-700">
                    {formatCrore(impact.bookedValueCr, { decimals: 1 })}
                  </span>{' '}
                  of booked value.
                </p>
                <p className="mt-2.5 border-t border-slate-100 pt-2 text-[11.5px] leading-relaxed text-slate-500">
                  <span className="font-semibold text-status-danger">
                    {formatNumber(impact.aggravatedCustomers)}
                  </span>{' '}
                  already have an unresolved ticket or an overdue milestone —
                  the delay lands on a relationship that is already strained.
                </p>
              </div>

              {/* The simulated result */}
              <div className="lg:border-r lg:border-slate-100 lg:pr-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Projected NPS · book-wide
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p
                    className={cn(
                      'nums text-[26px] font-bold leading-none',
                      impact.npsDelta < 0 ? 'text-status-danger' : 'text-slate-900',
                    )}
                  >
                    {impact.npsAfter > 0 ? '+' : ''}
                    {impact.npsAfter}
                  </p>
                  <p className="nums text-[12.5px] text-slate-400">
                    from{' '}
                    <span className="font-semibold text-slate-600">
                      {impact.npsBefore > 0 ? '+' : ''}
                      {impact.npsBefore}
                    </span>
                  </p>
                </div>
                <p className="mt-1.5 text-[12.5px] font-semibold leading-snug text-slate-700">
                  {slipDays === 0
                    ? 'No slip, no damage — the baseline.'
                    : impact.respondents === 0
                      ? 'Nobody has scored this project yet, so the measured NPS cannot move — but the exposure on the left is real.'
                      : `${formatNumber(impact.projectedTurns)} of ${formatNumber(impact.respondents)} customers who have scored this project turn detractor, ${formatCrore(impact.valueTurningCr, { decimals: 1 })} of booked value with them.`}
                </p>
                {impact.personaMix.length > 0 && (
                  <p className="mt-2.5 border-t border-slate-100 pt-2 text-[11.5px] leading-relaxed text-slate-500">
                    Concentrated in{' '}
                    {impact.personaMix
                      .slice(0, 2)
                      .map((p) => `${p.label} (${formatNumber(p.count)})`)
                      .join(' and ')}
                    .
                  </p>
                )}
              </div>

              {/* Who to ring */}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Call these first
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {impact.callList.slice(0, 5).map((c) => (
                    <li key={c.leadId} className="flex items-start gap-2">
                      <span className="nums mt-px w-14 shrink-0 text-right text-[12px] font-bold text-kpmg-blue">
                        {formatCrore(c.bookingValueCr, { decimals: 1 })}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold text-slate-800">
                          {c.name}
                          <span className="ml-1.5 font-normal text-slate-400">
                            {c.personaLabel}
                          </span>
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {c.aggravators.length
                            ? c.aggravators.join(' · ')
                            : 'Nothing outstanding on the record'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <InferredNote>
                Two populations, deliberately not merged: the money at risk is
                held by everyone who booked, while the score can only move for
                the {formatNumber(impact.respondents)} who have actually rated
                this project. Reach and exposure are read off the booking,
                payment and ticket record. The sensitivity is not:{' '}
                <span className="font-semibold">
                  {Math.round(TURN_RATE_PER_30_DAYS * 100)}% of unhappy-but-not-yet-detractor
                  customers per 30 days
                </span>{' '}
                is a configured assumption with no delay events in this book to
                fit it against — argue with it before you quote the number.
              </InferredNote>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
