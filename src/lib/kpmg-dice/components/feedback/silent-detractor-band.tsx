'use client'

import { EarOff } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { InferredNote } from './guardrails'
import { useSilentDetractors } from '@/lib/kpmg-dice/lib/selectors/use-silent-detractor'
import { formatNumber } from '@/lib/kpmg-dice/lib/format'

/**
 * The score for the people who never answered.
 *
 * The single most defensible thing this platform can say, because it is the
 * one every survey tool is structurally unable to say: they hold data only on
 * respondents. It is also the one most likely to be misread as a measurement,
 * so the visual treatment does the arguing — dashed border, inferred styling,
 * the measured score shown beside it rather than replaced by it, and the
 * signals behind the prediction listed rather than asserted.
 */

const PROMOTER = '#00A3A1'
const PASSIVE = '#94A3B8'
const DETRACTOR = '#DC2626'

export function SilentDetractorBand() {
  const s = useSilentDetractors()

  if (!s.silent) {
    return null
  }

  /*
   * Expected counts, not votes.
   *
   * Each silent customer carries a probability rather than a verdict, so the
   * split is the sum of those probabilities. Rounding each person into their
   * likeliest band would throw away exactly the uncertainty this panel exists
   * to be honest about.
   */
  const expectedPassives = Math.max(
    0,
    s.silent - s.expectedPromoters - s.expectedDetractors,
  )
  const bands = [
    { label: 'Expected promoters', value: s.expectedPromoters, color: PROMOTER },
    { label: 'Expected passives', value: expectedPassives, color: PASSIVE },
    { label: 'Expected detractors', value: s.expectedDetractors, color: DETRACTOR },
  ]

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-1.5">
            <EarOff className="size-3.5 text-slate-400" />
            The customers who never answered
          </span>
        </CardTitle>
        <span className="text-[10.5px] font-medium text-slate-400">
          {s.responseRatePct}% response rate ·{' '}
          {formatNumber(s.answered)} of {formatNumber(s.asked)} asked
        </span>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-6">
          {/* The claim */}
          <div className="lg:border-r lg:border-slate-100 lg:pr-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Predicted score · {formatNumber(s.silent)} silent customers
            </p>
            <div className="mt-1 flex items-baseline gap-3">
              <p className="nums text-[26px] font-bold leading-none text-dice-status-danger">
                {s.shadow > 0 ? '+' : ''}
                {s.shadow}
              </p>
              <p className="nums text-[12.5px] text-slate-400">
                measured{' '}
                <span className="font-semibold text-slate-600">
                  {s.measured > 0 ? '+' : ''}
                  {s.measured}
                </span>
              </p>
            </div>

            <p className="mt-2 text-[12.5px] font-semibold leading-snug text-slate-700">
              {Math.abs(s.gap) <= 2
                ? 'The silent and the vocal score about the same — the difference is inside the noise.'
                : s.gap < 0
                  ? `The people who did not reply score ${Math.abs(s.gap)} points worse than the people who did.`
                  : `The people who did not reply score ${s.gap} points better than the people who did.`}
            </p>

            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
              Scored from the behavioural record — calls unanswered, days since
              contact, milestones overdue, tickets unresolved — for customers who
              were asked and never replied. No survey platform holds this record.
            </p>
          </div>

          {/* The split, and the worst of them */}
          <div className="min-w-0">
            <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
              {bands.map((b) => (
                <div
                  key={b.label}
                  style={{
                    width: `${(b.value / s.silent) * 100}%`,
                    backgroundColor: b.color,
                  }}
                />
              ))}
            </div>
            <ul className="mt-2 space-y-1">
              {bands.map((b) => (
                <li
                  key={b.label}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="text-[11.5px] text-slate-500">
                      {b.label}
                    </span>
                  </span>
                  <span className="nums text-[11.5px] font-semibold text-slate-700">
                    {formatNumber(b.value)}
                    <span className="ml-1.5 font-normal text-slate-400">
                      {Math.round((b.value / s.silent) * 100)}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {s.worst.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Most likely to be detractors
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {s.worst.slice(0, 4).map((row) => (
                    <li key={row.leadId} className="flex items-start gap-2">
                      <span className="nums mt-px w-9 shrink-0 text-right text-[12px] font-bold text-dice-status-danger">
                        {Math.round(row.pDetractor * 100)}%
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold text-slate-800">
                          {row.name}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {row.reasons[0]}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <InferredNote>
            A prediction from behaviour, not a collected score. Rates are
            measured on the {formatNumber(s.calibratedOn)} customers who did
            reply — each behavioural bucket learns its own detractor rate from
            them — then applied to those who did not. It belongs beside the
            measured NPS as a prompt to go and ask, never inside it.
          </InferredNote>
        </div>
      </CardContent>
    </Card>
  )
}
