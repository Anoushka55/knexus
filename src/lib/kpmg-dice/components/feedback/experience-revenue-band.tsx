'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { useExperienceRevenue } from '@/lib/kpmg-dice/lib/selectors/use-experience-revenue'
import { formatCrore, formatNumber } from '@/lib/kpmg-dice/lib/format'

/**
 * Experience joined to revenue, on the executive screen.
 *
 * The Control Tower already answers what is moving satisfaction and what is
 * being done about it. This is the half it was missing: what the dissatisfaction
 * is worth, and how much of the score can be trusted in the first place.
 *
 * Kept off the Type 1 reporting screen deliberately — that screen's flatness is
 * the argument, and an evidence grade is precisely the thing descriptive
 * reporting cannot produce.
 */

/*
 * The same diverging pair the NPS screen uses: teal rather than green, because
 * green against this red measures ΔE 5.0 under deuteranopia and teal measures
 * 15.5. Every segment below also carries a number, so the bar is never the only
 * encoding.
 */
const SUPPORTED = '#00A3A1'
const UNVERIFIED = '#94A3B8'
const CONTRADICTED = '#DC2626'

function Figure({
  label,
  value,
  sub,
  tone = 'text-slate-900',
}: {
  label: string
  value: string
  sub: string
  tone?: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`nums mt-1 text-[26px] font-bold leading-none ${tone}`}>
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">{sub}</p>
    </div>
  )
}

export function ExperienceRevenueBand() {
  const { nps, grades } = useExperienceRevenue()

  const gradeRows = [
    { label: 'Supported', value: grades.supported, pct: grades.supportedPct, color: SUPPORTED },
    { label: 'Unverified', value: grades.unverified, pct: grades.unverifiedPct, color: UNVERIFIED },
    { label: 'Contradicted', value: grades.contradicted, pct: grades.contradictedPct, color: CONTRADICTED },
  ]

  if (!grades.total) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue-weighted view</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-[12.5px] text-slate-500">
            No survey responses in this book yet. Import feedback, or reset to the
            example data.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue-weighted view</CardTitle>
        <span className="text-[10.5px] font-medium text-slate-400">
          {formatNumber(nps.covered)} of {formatNumber(grades.total)} responses
          match a customer with value at stake
        </span>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          {/* ---- 1. The score, weighted by what the respondent holds ---- */}
          <div className="lg:border-r lg:border-slate-100 lg:pr-6">
            <Figure
              label="Revenue-weighted NPS"
              value={`${nps.weighted > 0 ? '+' : ''}${nps.weighted}`}
              sub={
                nps.delta === 0
                  ? 'Identical to the unweighted score — value is spread evenly across the bands.'
                  : nps.delta > 0
                    ? `${nps.delta} points above the unweighted score. Your higher-value customers are the happier ones.`
                    : `${Math.abs(nps.delta)} points below the unweighted score. The money is less happy than the crowd.`
              }
            />
            <p className="nums mt-3 border-t border-slate-100 pt-2.5 text-[11.5px] text-slate-500">
              Unweighted, one vote each:{' '}
              <span className="font-semibold text-slate-700">
                {nps.plain > 0 ? '+' : ''}
                {nps.plain}
              </span>
            </p>
          </div>

          {/* ---- 2. What the detractors are holding ---- */}
          <div className="lg:border-r lg:border-slate-100 lg:pr-6">
            <Figure
              label="Held by detractors — booked"
              value={formatCrore(nps.bookedExposureCr, { decimals: 1 })}
              sub={`Contracted value, of ${formatCrore(nps.bookedTotalCr, { decimals: 1 })} booked in this book.`}
              tone="text-status-danger"
            />
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Held by detractors — pipeline
              </p>
              <p className="nums mt-1 text-[18px] font-bold leading-none text-slate-900">
                {formatCrore(nps.pipelineExposureCr, { decimals: 1 })}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
                Probability-weighted, across{' '}
                {formatNumber(nps.detractorCustomers)} detracting customers.
              </p>
            </div>
          </div>

          {/* ---- 3. How much of the score the record supports ---- */}
          <div className="min-w-0">
            <Figure
              label="Promoter scores evidence-backed"
              value={`${grades.promotersSupportedPct}%`}
              sub={
                grades.promotersContradicted > 0
                  ? `${formatNumber(grades.promotersContradicted)} promoter ${grades.promotersContradicted === 1 ? 'score is' : 'scores are'} contradicted by an open ticket or an overdue milestone.`
                  : 'No promoter score is contradicted by an open ticket or an overdue milestone.'
              }
            />

            <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
              <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
                {gradeRows.map((row) => (
                  <div
                    key={row.label}
                    style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                  />
                ))}
              </div>
              <ul className="space-y-1">
                {gradeRows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="text-[11.5px] text-slate-500">
                        {row.label}
                      </span>
                    </span>
                    <span className="nums text-[11.5px] font-semibold text-slate-700">
                      {formatNumber(row.value)}
                      <span className="ml-1.5 font-normal text-slate-400">
                        {row.pct}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/*
          Stated on the screen rather than left to the reader.

          Blending contracted revenue with probability-weighted pipeline into a
          single "revenue at risk" figure would be the exact overclaim this
          product exists to argue against, so the two are never added.
        */}
        <p className="mt-4 border-t border-slate-100 pt-3 text-[11.5px] leading-relaxed text-slate-500">
          Booked and pipeline exposure are reported apart and never summed —
          contracted revenue and probability-weighted pipeline are different
          kinds of rupee. Grades are threshold rules over the interaction,
          payment and ticket record, not a prediction.
        </p>
      </CardContent>
    </Card>
  )
}
