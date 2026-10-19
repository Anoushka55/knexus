'use client'

import { useMemo } from 'react'

import { indexBook, type BookIndex } from './use-experience-revenue'
import { selectNpsSummary } from './feedback'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import type {
  JourneyStage,
  Lead,
  SurveyInvite,
  SurveyResponse,
  TouchpointId,
} from '@/lib/kpmg-dice/types'

/**
 * A predicted score for the customers who never answered.
 *
 * The one thing every survey platform is structurally unable to say: they hold
 * data only on respondents, so their NPS is the opinion of the minority
 * willing to fill in a form. We hold the behavioural record for the entire
 * book — calls unanswered, weeks of silence, milestones overdue, tickets still
 * open — which is enough to say something defensible about the rest.
 *
 * This is a PREDICTION and is kept apart from the measured score everywhere it
 * appears. It is never blended into the headline NPS, because a measured
 * number and an inferred one are not the same kind of fact.
 *
 * Deterministic: calibration and prediction are both pure passes over the
 * book, so the same data always produces the same answer. No model, no key.
 */

/* ------------------------------------------------------------------ */
/* Who counts as silent                                                */
/* ------------------------------------------------------------------ */

/**
 * Asked, and never answered.
 *
 * `queued` is excluded because they have not been asked yet, and `suppressed`
 * because the optimiser deliberately held them back — counting either as a
 * non-response would blame the customer for our own decision.
 */
const SILENT_STATUSES: SurveyInvite['status'][] = [
  'sent',
  'abandoned',
  'expired',
]

export function isSilent(invite: SurveyInvite) {
  return SILENT_STATUSES.includes(invite.status) && !invite.respondedAt
}

/* ------------------------------------------------------------------ */
/* Signals                                                             */
/* ------------------------------------------------------------------ */

/**
 * Behavioural signals, each reduced to a bucket.
 *
 * The first version of this scored customers with invented constants — a base
 * of 58, a promoter threshold of 70 — and produced a silent population that
 * scored BETTER than the people who replied, which is not a finding, it is a
 * miscalibration. Nothing anchored those numbers to this book.
 *
 * So the weights are not guessed here, they are measured. Responders carry
 * both a behavioural record and a known band, which is exactly the labelled
 * data a rate table needs. Each bucket learns its own promoter and detractor
 * rate from the people who did answer, and those rates are applied to the
 * people who did not.
 */
/**
 * What a signal gets to look at.
 *
 * Deliberately includes the touchpoint and journey stage, which come from the
 * *invite* rather than the lead. A customer who ignored a handover survey and
 * one who ignored a sales survey are not the same case, and the invite records
 * which it was — throwing that away was leaving the strongest available signal
 * on the floor.
 */
interface SignalCtx {
  lead: Lead
  touchpoint: TouchpointId
  journeyStage: JourneyStage
  index: BookIndex
}

interface Signal {
  id: string
  label: string
  bucket: (ctx: SignalCtx) => string
}

const SIGNALS: Signal[] = [
  {
    id: 'touchpoint',
    label: 'Touchpoint',
    bucket: (ctx) => ctx.touchpoint,
  },
  {
    id: 'stage',
    label: 'Journey stage',
    bucket: (ctx) => ctx.journeyStage,
  },
  {
    id: 'answer',
    label: 'Call answer rate',
    bucket: ({ lead }) => {
      const { callsAnswered, callsAttempted } = lead.evidence
      if (callsAttempted === 0) return 'none-attempted'
      const rate = callsAnswered / callsAttempted
      if (rate === 0) return 'never answers'
      if (rate < 0.3) return 'rarely answers'
      if (rate < 0.6) return 'sometimes answers'
      return 'usually answers'
    },
  },
  {
    id: 'silence',
    label: 'Days since contact',
    bucket: ({ lead }) => {
      const d = lead.evidence.daysSinceLastActivity
      if (d < 7) return 'under a week'
      if (d < 21) return 'under three weeks'
      if (d < 45) return 'over three weeks'
      return 'over six weeks'
    },
  },
  {
    id: 'overdue',
    label: 'Overdue milestones',
    bucket: ({ lead, index }) => {
      const n = index.overduePaymentsByLead.get(lead.id) ?? 0
      return n === 0 ? 'none' : n === 1 ? 'one' : 'two or more'
    },
  },
  {
    id: 'tickets',
    label: 'Unresolved tickets',
    bucket: ({ lead, index }) => {
      const n = index.openTicketsByLead.get(lead.id) ?? 0
      return n === 0 ? 'none' : n === 1 ? 'one' : 'two or more'
    },
  },
  {
    id: 'evidence',
    label: 'Evidence status',
    bucket: ({ lead }) => lead.evidenceStatus,
  },
]

/* ------------------------------------------------------------------ */
/* Calibration                                                         */
/* ------------------------------------------------------------------ */

interface Rates {
  promoter: number
  detractor: number
  n: number
}

/**
 * A bucket needs this many responders before its own rates are trusted.
 *
 * Below it the book-wide rate is used instead. Two responders in a bucket can
 * produce a 100% detractor rate, and a prediction built on that would name
 * confident nonsense as its top finding.
 */
const MIN_BUCKET = 25

export interface Calibration {
  base: Rates
  /** signal id → bucket → rates measured on responders. */
  bySignal: Map<string, Map<string, Rates>>
}

export function calibrate(
  responses: SurveyResponse[],
  index: BookIndex,
): Calibration {
  const base: Rates = { promoter: 0, detractor: 0, n: 0 }
  const bySignal = new Map<string, Map<string, Rates>>()
  for (const signal of SIGNALS) bySignal.set(signal.id, new Map())

  for (const response of responses) {
    const lead = index.leadById.get(response.leadId)
    if (!lead) continue

    const isPromoter = response.npsBand === 'promoter'
    const isDetractor = response.npsBand === 'detractor'

    base.n += 1
    if (isPromoter) base.promoter += 1
    if (isDetractor) base.detractor += 1

    for (const signal of SIGNALS) {
      const table = bySignal.get(signal.id)!
      const key = signal.bucket({
        lead,
        touchpoint: response.touchpoint,
        journeyStage: response.journeyStage,
        index,
      })
      const cell = table.get(key) ?? { promoter: 0, detractor: 0, n: 0 }
      cell.n += 1
      if (isPromoter) cell.promoter += 1
      if (isDetractor) cell.detractor += 1
      table.set(key, cell)
    }
  }

  // Counts become rates in place, so prediction is a lookup rather than a
  // division per silent customer per signal.
  const toRate = (c: Rates): Rates =>
    c.n
      ? { promoter: c.promoter / c.n, detractor: c.detractor / c.n, n: c.n }
      : { promoter: 0, detractor: 0, n: 0 }

  const out: Calibration = { base: toRate(base), bySignal: new Map() }
  for (const [id, table] of bySignal) {
    const rated = new Map<string, Rates>()
    for (const [key, cell] of table) rated.set(key, toRate(cell))
    out.bySignal.set(id, rated)
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Prediction                                                          */
/* ------------------------------------------------------------------ */

export interface SilentScore {
  leadId: string
  name: string
  /** Probability this customer would answer as a promoter, 0–1. */
  pPromoter: number
  pDetractor: number
  /** Expected NPS contribution, −100 to +100. */
  expected: number
  /** Signals whose measured detractor rate exceeds the book's, worst first. */
  reasons: string[]
}

/**
 * How much worse than the book a bucket has to be before it is worth naming.
 *
 * Below this the signal is still in the average — it just does not earn a line
 * of explanation, and a reason list that names everything explains nothing.
 */
const NOTABLE_LIFT = 1.25

export function predictSilent(
  lead: Lead,
  invite: SurveyInvite,
  index: BookIndex,
  cal: Calibration,
): SilentScore {
  let pPromoter = 0
  let pDetractor = 0
  const notable: { text: string; lift: number }[] = []

  for (const signal of SIGNALS) {
    const key = signal.bucket({
      lead,
      touchpoint: invite.touchpoint,
      journeyStage: invite.journeyStage,
      index,
    })
    const cell = cal.bySignal.get(signal.id)?.get(key)
    const rates = cell && cell.n >= MIN_BUCKET ? cell : cal.base

    pPromoter += rates.promoter
    pDetractor += rates.detractor

    if (rates !== cal.base && cal.base.detractor > 0) {
      const lift = rates.detractor / cal.base.detractor
      if (lift >= NOTABLE_LIFT) {
        notable.push({
          text: `${signal.label}: ${key} — ${Math.round(rates.detractor * 100)}% of these responders were detractors`,
          lift,
        })
      }
    }
  }

  pPromoter /= SIGNALS.length
  pDetractor /= SIGNALS.length

  notable.sort((a, b) => b.lift - a.lift)

  return {
    leadId: lead.id,
    name: lead.name,
    pPromoter,
    pDetractor,
    expected: Math.round((pPromoter - pDetractor) * 100),
    reasons: notable.length
      ? notable.slice(0, 3).map((r) => r.text)
      : ['Nothing on the record separates this customer from the book average'],
  }
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

export interface SilentDetractorSummary {
  /** Invites actually put in front of somebody. */
  asked: number
  answered: number
  /** Non-respondents we could score, because their lead is in the book. */
  silent: number
  responseRatePct: number

  /** Expected counts — the sum of per-customer probabilities, not a vote. */
  expectedPromoters: number
  expectedDetractors: number
  /** Predicted NPS across the silent majority. Never merged with `measured`. */
  shadow: number
  /** The real, measured score, for the comparison. */
  measured: number
  /** Shadow minus measured — negative means the silent are unhappier. */
  gap: number
  /** Responders per bucket that had to fall back to the book rate. */
  calibratedOn: number

  /** Most likely detractors first, capped — the worklist this is for. */
  worst: SilentScore[]
}

const MAX_WORST = 25

export function useSilentDetractors(): SilentDetractorSummary {
  const surveyInvites = useCrmStore((s) => s.surveyInvites)
  const surveyResponses = useCrmStore((s) => s.surveyResponses)
  const leads = useCrmStore((s) => s.leads)
  const bookings = useCrmStore((s) => s.bookings)
  const payments = useCrmStore((s) => s.payments)
  const serviceTickets = useCrmStore((s) => s.serviceTickets)

  return useMemo(() => {
    const index = indexBook(leads, bookings, payments, serviceTickets)
    const cal = calibrate(surveyResponses, index)

    let asked = 0
    let answered = 0
    const scored: SilentScore[] = []
    // One customer, one prediction, however many invites they ignored.
    const seen = new Map<string, SurveyInvite>()

    for (const invite of surveyInvites) {
      if (invite.status === 'queued' || invite.status === 'suppressed') continue
      asked += 1
      if (invite.respondedAt || invite.status === 'responded') {
        answered += 1
        continue
      }
      if (!isSilent(invite)) continue
      // One prediction per customer, from their most recent ignored invite —
      // the touchpoint they last went quiet on is the relevant one.
      const held = seen.get(invite.leadId)
      if (!held || (invite.sentAt ?? '') > (held.sentAt ?? '')) {
        seen.set(invite.leadId, invite)
      }
    }

    for (const invite of seen.values()) {
      const lead = index.leadById.get(invite.leadId)
      if (!lead) continue
      scored.push(predictSilent(lead, invite, index, cal))
    }

    let sumPromoter = 0
    let sumDetractor = 0
    for (const row of scored) {
      sumPromoter += row.pPromoter
      sumDetractor += row.pDetractor
    }

    const silent = scored.length
    const shadow = silent
      ? Math.round(((sumPromoter - sumDetractor) / silent) * 100)
      : 0
    const measured = selectNpsSummary(surveyResponses).nps

    return {
      asked,
      answered,
      silent,
      responseRatePct: asked ? Math.round((answered / asked) * 1000) / 10 : 0,
      expectedPromoters: Math.round(sumPromoter),
      expectedDetractors: Math.round(sumDetractor),
      shadow,
      measured,
      gap: shadow - measured,
      calibratedOn: cal.base.n,
      worst: [...scored]
        .sort((a, b) => b.pDetractor - a.pDetractor)
        .slice(0, MAX_WORST),
    }
  }, [surveyInvites, surveyResponses, leads, bookings, payments, serviceTickets])
}
