'use client'

import { useMemo } from 'react'

import { isOpen, weightedValueCr } from './overview'
import { selectNpsSummary } from './feedback'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import type {
  Booking,
  Lead,
  Payment,
  ServiceTicket,
  SurveyResponse,
} from '@/lib/kpmg-dice/types'

/**
 * Experience joined to revenue, and feedback graded against the record.
 *
 * Two capabilities that exist only because the survey response and the payment
 * milestone are rows in one book:
 *
 *   1. NPS weighted by what the respondent actually has at stake, so a ₹8 Cr
 *      customer is not one vote beside a ₹0.6 Cr one — plus the exposure
 *      sitting behind the detractors.
 *   2. The claim-vs-evidence audit that already runs on `crmStatus`, pointed
 *      at the score itself. A 9/10 from a customer with an overdue milestone
 *      and two open tickets is a number worth doubting.
 *
 * Deterministic throughout — arithmetic and threshold rules over the store, in
 * the same shape as the agents' `detectSync` passes. No model, no key.
 */

/* ------------------------------------------------------------------ */
/* Value at stake                                                      */
/* ------------------------------------------------------------------ */

export type StakeKind = 'pipeline' | 'booked' | 'none'

export interface Stake {
  kind: StakeKind
  valueCr: number
}

/**
 * What this customer has at stake, in the only two currencies here.
 *
 * `weightedValueCr` on its own is not enough. STAGE_PROBABILITY is 0 at
 * closed-won, so weighting by it would silently zero every post-handover
 * response — and documentation, payment, handover and service all sit after
 * the sale, which is most of the feedback book. A booked customer's stake is
 * the contracted value, not an expectation of one.
 *
 * The two are never added together. Probability-weighted pipeline and signed
 * revenue are different kinds of rupee, and one blended figure would be
 * exactly the sort of number this product exists to argue against.
 */
export function stakeFor(lead: Lead, booking?: Booking): Stake {
  if (lead.stage === 'closed-won') {
    // Falls back to budget when the booking row is missing, which an imported
    // book can be: the customer still signed for something.
    return { kind: 'booked', valueCr: booking?.valueCr ?? lead.budgetCr }
  }
  if (isOpen(lead)) return { kind: 'pipeline', valueCr: weightedValueCr(lead) }
  return { kind: 'none', valueCr: 0 }
}

/* ------------------------------------------------------------------ */
/* Book index                                                          */
/* ------------------------------------------------------------------ */

export interface BookIndex {
  leadById: Map<string, Lead>
  bookingByLead: Map<string, Booking>
  /** Tickets not yet resolved, counted per lead. */
  openTicketsByLead: Map<string, number>
  /** Payments past their due date, counted per lead. */
  overduePaymentsByLead: Map<string, number>
}

/**
 * One pass per record type, rather than a filter inside the response loop.
 *
 * The response book and the ticket book are both five figures on a real
 * import; scanning tickets per response is the quadratic version of this.
 */
export function indexBook(
  leads: Lead[],
  bookings: Booking[],
  payments: Payment[],
  serviceTickets: ServiceTicket[],
): BookIndex {
  const leadById = new Map(leads.map((l) => [l.id, l]))

  const bookingByLead = new Map<string, Booking>()
  for (const booking of bookings) {
    // A lead with more than one booking keeps the larger — the stake is what
    // they stand to lose, and the smaller unit is not it.
    const held = bookingByLead.get(booking.leadId)
    if (!held || booking.valueCr > held.valueCr) {
      bookingByLead.set(booking.leadId, booking)
    }
  }

  const openTicketsByLead = new Map<string, number>()
  for (const ticket of serviceTickets) {
    if (ticket.status === 'resolved') continue
    openTicketsByLead.set(
      ticket.leadId,
      (openTicketsByLead.get(ticket.leadId) ?? 0) + 1,
    )
  }

  const overduePaymentsByLead = new Map<string, number>()
  for (const payment of payments) {
    if (payment.status !== 'overdue') continue
    overduePaymentsByLead.set(
      payment.leadId,
      (overduePaymentsByLead.get(payment.leadId) ?? 0) + 1,
    )
  }

  return { leadById, bookingByLead, openTicketsByLead, overduePaymentsByLead }
}

/* ------------------------------------------------------------------ */
/* 1. Revenue-weighted NPS and detractor exposure                      */
/* ------------------------------------------------------------------ */

export interface WeightedNps {
  /** NPS with every response weighted by what that customer has at stake. */
  weighted: number
  /** The same book, one vote each — the figure every other screen shows. */
  plain: number
  /** Weighted minus plain. Positive means the money is happier than the crowd. */
  delta: number
  /** Responses that resolved to a customer with something at stake. */
  covered: number
  /** Responses that did not, and so are absent from `weighted`. */
  uncovered: number

  /**
   * Contracted value held by customers whose latest score is a detractor.
   * Counted once per customer, not once per response.
   */
  bookedExposureCr: number
  /** The same, for probability-weighted open pipeline. Never added to it. */
  pipelineExposureCr: number

  bookedTotalCr: number
  pipelineTotalCr: number
  /** Customers behind the exposure, for the sub-line. */
  detractorCustomers: number
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * NPS weighted by value at stake, and the exposure behind the detractors.
 *
 * The weighted score counts every response — each one is an opinion, and a
 * customer who answered twice held that value on both occasions. The exposure
 * figures count each customer once, off their most recent score, because a
 * customer who dropped from promoter to detractor is at risk today and their
 * older answer is history, not a second sum of money.
 */
export function selectWeightedNps(
  responses: SurveyResponse[],
  index: BookIndex,
): WeightedNps {
  let promoterWeight = 0
  let detractorWeight = 0
  let totalWeight = 0
  let covered = 0

  /** Latest response per customer, for the exposure half. */
  const latest = new Map<string, SurveyResponse>()

  for (const response of responses) {
    const lead = index.leadById.get(response.leadId)
    if (lead) {
      const held = latest.get(response.leadId)
      if (!held || response.respondedAt > held.respondedAt) {
        latest.set(response.leadId, response)
      }
    }

    if (!lead) continue
    const stake = stakeFor(lead, index.bookingByLead.get(lead.id))
    if (stake.valueCr <= 0) continue

    covered += 1
    totalWeight += stake.valueCr
    if (response.npsBand === 'promoter') promoterWeight += stake.valueCr
    if (response.npsBand === 'detractor') detractorWeight += stake.valueCr
  }

  let bookedExposureCr = 0
  let pipelineExposureCr = 0
  let bookedTotalCr = 0
  let pipelineTotalCr = 0
  let detractorCustomers = 0

  for (const [leadId, response] of latest) {
    const lead = index.leadById.get(leadId)
    if (!lead) continue
    const stake = stakeFor(lead, index.bookingByLead.get(leadId))
    if (stake.valueCr <= 0) continue

    if (stake.kind === 'booked') bookedTotalCr += stake.valueCr
    else pipelineTotalCr += stake.valueCr

    if (response.npsBand !== 'detractor') continue
    detractorCustomers += 1
    if (stake.kind === 'booked') bookedExposureCr += stake.valueCr
    else pipelineExposureCr += stake.valueCr
  }

  const weighted = totalWeight
    ? Math.round(((promoterWeight - detractorWeight) / totalWeight) * 100)
    : 0
  const plain = selectNpsSummary(responses).nps

  return {
    weighted,
    plain,
    delta: weighted - plain,
    covered,
    uncovered: responses.length - covered,
    bookedExposureCr: round1(bookedExposureCr),
    pipelineExposureCr: round1(pipelineExposureCr),
    bookedTotalCr: round1(bookedTotalCr),
    pipelineTotalCr: round1(pipelineTotalCr),
    detractorCustomers,
  }
}

/* ------------------------------------------------------------------ */
/* 2. Evidence-graded feedback                                         */
/* ------------------------------------------------------------------ */

/**
 * Deliberately the same three words the lead audit uses.
 *
 * `EvidenceStatus` already grades a rep's claim against the interaction
 * record; this grades a customer's score against it. Inventing a second
 * vocabulary for the same judgement would suggest they are different kinds of
 * check, and they are not.
 */
export type FeedbackGrade = 'supported' | 'unverified' | 'contradicted'

export interface GradedResponse {
  response: SurveyResponse
  grade: FeedbackGrade
  /** Why, in the order the rules fired. Never empty for a graded row. */
  reasons: string[]
}

const POSITIVE_BANDS = new Set(['promoter', 'passive'])

/**
 * Grade one score against what the record shows.
 *
 * Only an *active* failure contradicts a positive score — an open ticket, a
 * milestone already overdue, or a lead the evidence audit has itself marked
 * contradicted. A detractor with no visible cause stays `unverified` rather
 * than `contradicted`: we cannot explain the score, and saying so is honest
 * where inventing a disagreement would not be.
 */
export function gradeResponse(
  response: SurveyResponse,
  index: BookIndex,
): GradedResponse {
  const lead = index.leadById.get(response.leadId)
  if (!lead) {
    return {
      response,
      grade: 'unverified',
      reasons: ['No customer record for this response'],
    }
  }

  const openTickets = index.openTicketsByLead.get(lead.id) ?? 0
  const overdue = index.overduePaymentsByLead.get(lead.id) ?? 0

  const failures: string[] = []
  if (openTickets > 0) {
    failures.push(
      `${openTickets} unresolved ticket${openTickets > 1 ? 's' : ''}`,
    )
  }
  if (overdue > 0) {
    failures.push(`${overdue} overdue milestone${overdue > 1 ? 's' : ''}`)
  }
  if (lead.evidenceStatus === 'contradicted') {
    failures.push('CRM status contradicted by the interaction record')
  }

  if (POSITIVE_BANDS.has(response.npsBand)) {
    if (failures.length) {
      return { response, grade: 'contradicted', reasons: failures }
    }
    const supports: string[] = []
    if (
      lead.evidenceStatus === 'supported' ||
      lead.evidenceStatus === 'strong-evidence'
    ) {
      supports.push('Interaction record supports the CRM status')
    }
    if (lead.evidence.callsAnswered > 0) {
      supports.push(`${lead.evidence.callsAnswered} calls answered`)
    }
    if (lead.evidence.siteVisitsAttended > 0) {
      supports.push(
        `${lead.evidence.siteVisitsAttended} site visits attended`,
      )
    }
    if (supports.length >= 2) {
      return { response, grade: 'supported', reasons: supports }
    }
    return {
      response,
      grade: 'unverified',
      reasons: supports.length
        ? supports
        : ['No interaction record behind this score'],
    }
  }

  // Detractor: the record either explains the score or it does not.
  if (failures.length) {
    return { response, grade: 'supported', reasons: failures }
  }
  return {
    response,
    grade: 'unverified',
    reasons: ['Nothing on the record explains this score'],
  }
}

export interface EvidenceGradeSummary {
  total: number
  supported: number
  unverified: number
  contradicted: number
  supportedPct: number
  unverifiedPct: number
  contradictedPct: number

  /** Promoters only — the claim leadership actually leans on. */
  promoters: number
  promotersSupported: number
  promotersSupportedPct: number
  /** Promoter scores the record actively disagrees with — the worklist. */
  promotersContradicted: number

  /**
   * The contradicted rows themselves, worst first, capped.
   *
   * A summary that says "these 40 aren't" has to be able to name them, and a
   * screen that lists forty rows is enough to make the point.
   */
  worst: GradedResponse[]
}

const MAX_WORST = 40

export function selectEvidenceGrades(
  responses: SurveyResponse[],
  index: BookIndex,
): EvidenceGradeSummary {
  let supported = 0
  let unverified = 0
  let contradicted = 0
  let promoters = 0
  let promotersSupported = 0
  let promotersContradicted = 0
  const worst: GradedResponse[] = []

  for (const response of responses) {
    const graded = gradeResponse(response, index)
    if (graded.grade === 'supported') supported += 1
    else if (graded.grade === 'contradicted') contradicted += 1
    else unverified += 1

    if (response.npsBand === 'promoter') {
      promoters += 1
      if (graded.grade === 'supported') promotersSupported += 1
      if (graded.grade === 'contradicted') {
        promotersContradicted += 1
        worst.push(graded)
      }
    }
  }

  // Most reasons first: a promoter with three things wrong is the one to open.
  worst.sort((a, b) => b.reasons.length - a.reasons.length)

  const total = responses.length
  const pct = (n: number) => (total ? round1((n / total) * 100) : 0)

  return {
    total,
    supported,
    unverified,
    contradicted,
    supportedPct: pct(supported),
    unverifiedPct: pct(unverified),
    contradictedPct: pct(contradicted),
    promoters,
    promotersSupported,
    promotersSupportedPct: promoters
      ? round1((promotersSupported / promoters) * 100)
      : 0,
    promotersContradicted,
    worst: worst.slice(0, MAX_WORST),
  }
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

/**
 * Subscribed separately from `useFeedbackData` on purpose.
 *
 * These are the only two capabilities that need the lead, booking, payment and
 * ticket books alongside the responses. Folding them into the shared hook
 * would make every feedback screen re-render on any lead edit to produce
 * figures only this band shows.
 */
export function useExperienceRevenue() {
  const surveyResponses = useCrmStore((s) => s.surveyResponses)
  const leads = useCrmStore((s) => s.leads)
  const bookings = useCrmStore((s) => s.bookings)
  const payments = useCrmStore((s) => s.payments)
  const serviceTickets = useCrmStore((s) => s.serviceTickets)

  return useMemo(() => {
    const index = indexBook(leads, bookings, payments, serviceTickets)
    return {
      nps: selectWeightedNps(surveyResponses, index),
      grades: selectEvidenceGrades(surveyResponses, index),
    }
  }, [surveyResponses, leads, bookings, payments, serviceTickets])
}
