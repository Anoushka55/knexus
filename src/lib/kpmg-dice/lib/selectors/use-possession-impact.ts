'use client'

import { useMemo } from 'react'

import { selectNpsSummary } from './feedback'
import { indexBook } from './use-experience-revenue'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { personaById, projectById } from '@/lib/kpmg-dice/data/active-reference'
import { mapLeadToPersonas } from '@/lib/kpmg-dice/lib/personas/mapping'
import type { Booking, SurveyResponse } from '@/lib/kpmg-dice/types'

/**
 * What a possession slip would cost, before anyone announces it.
 *
 * The decision a developer actually agonises over — "we are going to be ninety
 * days late on Tower B, what happens" — and there is nowhere to ask it. An
 * experience platform can tell you how people felt last quarter; it holds no
 * construction schedule and no booked revenue. A real-estate CRM holds both
 * and has no experience model to run them through.
 *
 * So this simulates the announcement against the actual book: who is exposed,
 * what they are worth, how many of them would likely turn, and who to call
 * first.
 *
 * Honest about which half is which. The REACH and the EXPOSURE are computed
 * from real records. The SENSITIVITY — how many people a delay turns — is a
 * configured assumption, in the same way the Control Tower's impact and effort
 * scores are configured rather than predicted. It is stated on the screen and
 * meant to be argued with.
 */

/* ------------------------------------------------------------------ */
/* The one configured input                                            */
/* ------------------------------------------------------------------ */

/**
 * Share of affected non-detractors who turn detractor per 30 days of slip.
 *
 * A configured elasticity, not a fitted one — this book contains no delay
 * events to fit against, and presenting a guess as a trained coefficient is
 * exactly the overclaim the guardrails exist to prevent.
 */
export const TURN_RATE_PER_30_DAYS = 0.12

/** Past this, further delay stops changing minds — they have already gone. */
const MAX_TURN_SHARE = 0.75

/**
 * Customers already carrying an operational failure turn faster.
 *
 * Someone with an overdue milestone and an open ticket has spent their
 * goodwill; the delay lands on a relationship that is already strained.
 */
const AGGRAVATED_MULTIPLIER = 1.6

export interface AffectedCustomer {
  leadId: string
  name: string
  bookingValueCr: number
  personaLabel: string
  /** Their most recent score, where they have given one. */
  band?: SurveyResponse['npsBand']
  /** Open tickets plus overdue milestones — why they turn faster. */
  aggravators: string[]
  /** Rank key: value weighted by how likely they are to turn. */
  priority: number
}

export interface PossessionImpact {
  projectId: string
  projectName: string
  possession: string
  slipDays: number

  /* ---- computed from the record ---- */
  affectedCustomers: number
  bookedValueCr: number
  /** Of those, how many already have an unresolved failure on file. */
  aggravatedCustomers: number
  aggravatedValueCr: number

  /* ---- the simulation ---- */
  /**
   * Customers who have actually scored this project.
   *
   * Deliberately not the same population as `affectedCustomers`. The money at
   * risk is held by everyone who booked; the NPS can only move for people who
   * have given a score. Conflating the two let the first version claim sixteen
   * customers turned while the score sat unchanged at +32, because not one of
   * them had ever answered a survey.
   */
  respondents: number
  projectedTurns: number
  npsBefore: number
  npsAfter: number
  npsDelta: number
  /** Booked value held by customers projected to turn. */
  valueTurningCr: number

  personaMix: { label: string; count: number }[]
  /** Who to call first — highest value among the most likely to turn. */
  callList: AffectedCustomer[]
}

const MAX_CALL_LIST = 8
const round1 = (n: number) => Math.round(n * 10) / 10

export function usePossessionImpact(
  projectId: string,
  slipDays: number,
): PossessionImpact | null {
  const bookings = useCrmStore((s) => s.bookings)
  const leads = useCrmStore((s) => s.leads)
  const surveyResponses = useCrmStore((s) => s.surveyResponses)
  const payments = useCrmStore((s) => s.payments)
  const serviceTickets = useCrmStore((s) => s.serviceTickets)

  return useMemo(() => {
    const project = projectById(projectId)
    if (!project) return null

    const index = indexBook(leads, [], payments, serviceTickets)

    const affected: Booking[] = bookings.filter((b) => b.projectId === projectId)

    // Latest score per customer, so a turn is applied to a person once.
    const latest = new Map<string, SurveyResponse>()
    for (const r of surveyResponses) {
      const held = latest.get(r.leadId)
      if (!held || r.respondedAt > held.respondedAt) latest.set(r.leadId, r)
    }

    const rows: AffectedCustomer[] = []
    let bookedValueCr = 0
    let aggravatedCustomers = 0
    let aggravatedValueCr = 0

    for (const booking of affected) {
      const lead = index.leadById.get(booking.leadId)
      bookedValueCr += booking.valueCr

      const openTickets = index.openTicketsByLead.get(booking.leadId) ?? 0
      const overdue = index.overduePaymentsByLead.get(booking.leadId) ?? 0
      const aggravators: string[] = []
      if (openTickets > 0) {
        aggravators.push(`${openTickets} unresolved ticket${openTickets > 1 ? 's' : ''}`)
      }
      if (overdue > 0) {
        aggravators.push(`${overdue} overdue milestone${overdue > 1 ? 's' : ''}`)
      }
      if (aggravators.length) {
        aggravatedCustomers += 1
        aggravatedValueCr += booking.valueCr
      }

      const response = latest.get(booking.leadId)
      /*
       * Falls back to the persona engine when the customer never answered.
       *
       * `SurveyResponse.personaId` only exists for people who replied, and
       * most booked customers have not — which labelled the entire call list
       * "Unmapped", on a panel whose whole job is telling somebody who to
       * ring. Mapping runs on the handful of booked leads here, not the book.
       */
      const personaId =
        response?.personaId ??
        (lead ? mapLeadToPersonas({ lead }).best.personaId : undefined)
      rows.push({
        leadId: booking.leadId,
        name: lead?.name ?? booking.leadId,
        bookingValueCr: booking.valueCr,
        personaLabel: personaId
          ? (personaById(personaId)?.shortName ?? personaId)
          : 'Unmapped',
        band: response?.npsBand,
        aggravators,
        priority:
          booking.valueCr * (aggravators.length ? AGGRAVATED_MULTIPLIER : 1),
      })
    }

    /*
     * The simulation.
     *
     * A zero-day slip must turn nobody and move nothing — a model that shows
     * damage from doing nothing is miscalibrated, and everything downstream of
     * it is noise.
     */
    const baseShare = Math.min(
      MAX_TURN_SHARE,
      (slipDays / 30) * TURN_RATE_PER_30_DAYS,
    )

    /*
     * Who can actually move the score.
     *
     * Everyone who scored THIS project — a customer can rate a handover
     * without appearing in the booking book, and a booked customer can easily
     * never have answered anything. Only this population can change an NPS.
     */
    const projectResponses = surveyResponses.filter(
      (r) => r.projectId === projectId,
    )
    const respondentLatest = new Map<string, SurveyResponse>()
    for (const r of projectResponses) {
      const held = respondentLatest.get(r.leadId)
      if (!held || r.respondedAt > held.respondedAt) {
        respondentLatest.set(r.leadId, r)
      }
    }

    const bookingValueOf = new Map(rows.map((r) => [r.leadId, r.bookingValueCr]))
    const aggravatedIds = new Set(
      rows.filter((r) => r.aggravators.length).map((r) => r.leadId),
    )

    const turning = new Set<string>()
    let valueTurningCr = 0
    if (baseShare > 0) {
      // Deterministic: rank by exposure, then take the top share. Rolling dice
      // here would give a different answer on every render.
      const candidates = [...respondentLatest.values()]
        .filter((r) => r.npsBand !== 'detractor')
        .sort(
          (a, b) =>
            (bookingValueOf.get(b.leadId) ?? 0) -
            (bookingValueOf.get(a.leadId) ?? 0),
        )

      const aggravatedFirst = candidates.filter((r) => aggravatedIds.has(r.leadId))
      const rest = candidates.filter((r) => !aggravatedIds.has(r.leadId))

      const takeFrom = (list: SurveyResponse[], share: number) => {
        const n = Math.min(list.length, Math.round(list.length * share))
        for (let i = 0; i < n; i += 1) {
          turning.add(list[i].leadId)
          valueTurningCr += bookingValueOf.get(list[i].leadId) ?? 0
        }
      }
      takeFrom(aggravatedFirst, Math.min(MAX_TURN_SHARE, baseShare * AGGRAVATED_MULTIPLIER))
      takeFrom(rest, baseShare)
    }

    // Recompute the real NPS with those customers flipped, rather than
    // applying a headline points adjustment to it.
    const npsBefore = selectNpsSummary(surveyResponses).nps
    const simulated = turning.size
      ? surveyResponses.map((r) =>
          turning.has(r.leadId) &&
          respondentLatest.get(r.leadId)?.id === r.id
            ? { ...r, npsBand: 'detractor' as const }
            : r,
        )
      : surveyResponses
    const npsAfter = selectNpsSummary(simulated).nps

    // Mix taken from respondents, who carry a personaId. Booked customers who
    // never answered have no persona on the record, and labelling all of them
    // "Unmapped" said nothing except that the wrong list was being counted.
    const mix = new Map<string, number>()
    for (const r of respondentLatest.values()) {
      const label = r.personaId
        ? (personaById(r.personaId)?.shortName ?? r.personaId)
        : 'Unmapped'
      mix.set(label, (mix.get(label) ?? 0) + 1)
    }

    return {
      projectId,
      projectName: project.name,
      possession: project.possession,
      slipDays,
      affectedCustomers: rows.length,
      respondents: respondentLatest.size,
      bookedValueCr: round1(bookedValueCr),
      aggravatedCustomers,
      aggravatedValueCr: round1(aggravatedValueCr),
      projectedTurns: turning.size,
      npsBefore,
      npsAfter,
      npsDelta: npsAfter - npsBefore,
      valueTurningCr: round1(valueTurningCr),
      personaMix: [...mix.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
      callList: rows
        .sort((a, b) => b.priority - a.priority)
        .slice(0, MAX_CALL_LIST),
    }
  }, [projectId, slipDays, bookings, leads, surveyResponses, payments, serviceTickets])
}
