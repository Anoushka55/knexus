import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'
import type { JourneyStage, Lead } from '@/lib/kpmg-dice/types'
import { isOpen, weightedValueCr } from './overview'

/**
 * Pipeline metrics — the "daily pipeline truth" a manager actually needs:
 * how many, worth how much, moving how fast, and how many have stopped moving.
 */

export const PIPELINE_STAGES: { stage: JourneyStage; label: string }[] = [
  { stage: 'lead', label: 'Lead' },
  { stage: 'engaged', label: 'Engaged' },
  { stage: 'qualified', label: 'Qualified' },
  { stage: 'site-visit', label: 'Site Visit' },
  { stage: 'proposal', label: 'Proposal' },
  { stage: 'booking', label: 'Booking' },
  { stage: 'closed-won', label: 'Closed Won' },
]

/** A deal is stalled once it has gone this long without any interaction. */
export const STALL_THRESHOLD_DAYS = 21

export interface StageMetrics {
  stage: JourneyStage
  label: string
  /** Leads currently sitting at this stage. */
  count: number
  /** Leads that have reached this stage or gone beyond it. */
  reachedCount: number
  /** Conversion from the previous stage, %. */
  conversionPct: number | null
  /** Sum of budget for leads at this stage, ₹ Cr. */
  valueCr: number
  /** Probability-weighted value at this stage, ₹ Cr. */
  weightedValueCr: number
  /** Mean days from lead creation to now, for leads at this stage. */
  avgAgeDays: number
  /** Mean days spent moving from the previous stage into this one. */
  velocityDays: number | null
  stalledCount: number
  stalledValueCr: number
}

function ageDays(lead: Lead) {
  return Math.max(
    0,
    Math.round((DEMO_NOW.getTime() - new Date(lead.createdAt).getTime()) / 86_400_000),
  )
}

export function selectStageMetrics(leads: Lead[]): StageMetrics[] {
  const order = PIPELINE_STAGES.map((s) => s.stage)

  const rows = PIPELINE_STAGES.map(({ stage, label }, i) => {
    const atStage = leads.filter((l) => l.stage === stage)
    // Every record entered as a lead — including the ones later marked lost,
    // which sit outside the ordered funnel.
    const reached =
      i === 0
        ? leads
        : leads.filter((l) => {
            const idx = order.indexOf(l.stage)
            return idx >= i && idx !== -1
          })

    const stalled = atStage.filter(
      (l) => isOpen(l) && l.evidence.daysSinceLastActivity > STALL_THRESHOLD_DAYS,
    )

    const avgAge = atStage.length
      ? Math.round(atStage.reduce((s, l) => s + ageDays(l), 0) / atStage.length)
      : 0

    return {
      stage,
      label,
      count: atStage.length,
      reachedCount: reached.length,
      conversionPct: null as number | null,
      valueCr: Math.round(atStage.reduce((s, l) => s + l.budgetCr, 0)),
      weightedValueCr: Math.round(
        atStage.reduce((s, l) => s + weightedValueCr(l), 0),
      ),
      avgAgeDays: avgAge,
      velocityDays: null as number | null,
      stalledCount: stalled.length,
      stalledValueCr: Math.round(stalled.reduce((s, l) => s + l.budgetCr, 0)),
    }
  })

  // Conversion and velocity both need the preceding stage.
  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1]
    rows[i].conversionPct = prev.reachedCount
      ? Math.round((rows[i].reachedCount / prev.reachedCount) * 1000) / 10
      : null
    rows[i].velocityDays = Math.max(0, rows[i].avgAgeDays - prev.avgAgeDays)
  }

  return rows
}

export interface PipelineTotals {
  openLeads: number
  openValueCr: number
  weightedValueCr: number
  stalledCount: number
  stalledValueCr: number
  avgCycleDays: number
}

export function selectPipelineTotals(leads: Lead[]): PipelineTotals {
  const open = leads.filter(isOpen)
  const stalled = open.filter(
    (l) => l.evidence.daysSinceLastActivity > STALL_THRESHOLD_DAYS,
  )
  const won = leads.filter((l) => l.stage === 'closed-won')

  return {
    openLeads: open.length,
    openValueCr: Math.round(open.reduce((s, l) => s + l.budgetCr, 0)),
    weightedValueCr: Math.round(open.reduce((s, l) => s + weightedValueCr(l), 0)),
    stalledCount: stalled.length,
    stalledValueCr: Math.round(stalled.reduce((s, l) => s + l.budgetCr, 0)),
    avgCycleDays: won.length
      ? Math.round(won.reduce((s, l) => s + ageDays(l), 0) / won.length)
      : 0,
  }
}
