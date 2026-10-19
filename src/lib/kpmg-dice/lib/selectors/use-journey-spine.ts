'use client'

import { useMemo } from 'react'

import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'
import type { Booking, Lead, JourneyStage, Payment, ServiceTicket, SiteVisit } from '@/lib/kpmg-dice/types'

/**
 * The pre-sales funnel, then post-sale health — kept apart on purpose.
 *
 * The two halves measure different things and must never share a visual
 * language. Stages one to four are a cohort narrowing: each is a subset of the
 * one before, so a percentage between them is a conversion. Payments and
 * service are not subsets of bookings at all — "92% of payments are on
 * schedule" is a health reading, and drawing it on the same conversion track
 * as the funnel says "92% of bookings became payments", which is a different
 * and untrue claim.
 *
 * So the shape itself separates them: `funnel` carries conversions,
 * `health` cannot, and no component can accidentally draw one as the other.
 */

/* ------------------------------------------------------------------ */
/* Funnel                                                              */
/* ------------------------------------------------------------------ */

/**
 * Cohort membership by stage reached.
 *
 * Mirrors `REACH` in overview.ts, extended with `engaged`, which the funnel
 * there never needed — it reports Qualified, and the spine wants the softer
 * step before it.
 */
const REACHED: Record<string, JourneyStage[]> = {
  engaged: [
    'engaged',
    'qualified',
    'site-visit',
    'proposal',
    'booking',
    'closed-won',
  ],
  siteVisit: ['site-visit', 'proposal', 'booking', 'closed-won'],
  booking: ['booking', 'closed-won'],
}

export interface SpineStage {
  id: string
  /** "Stage 01" — the spine's own numbering, shown as an eyebrow. */
  index: string
  label: string
  count: number
  /** Share of the first stage, for the track width. */
  share: number
  /** Conversion from the previous stage. Null on the first. */
  conversionFromPrev: number | null
  /** The weakest hand-off in the funnel — computed, never hardcoded. */
  bottleneck: boolean
}

export interface HealthStage {
  id: string
  index: string
  label: string
  count: number
  caption: string
  /** True when the reading is bad enough to say so. */
  alarming: boolean
}

export interface JourneySpine {
  funnel: SpineStage[]
  health: HealthStage[]
  /** One line under the heading — first stage in, last funnel stage out. */
  summary: string
  /** The weakest hand-off, for the Journey engine card to quote. */
  weakest?: { from: string; to: string; conversion: number }
}

const round1 = (n: number) => Math.round(n * 10) / 10

function countReached(leads: Lead[], stages: JourneyStage[]) {
  let n = 0
  for (const lead of leads) if (stages.includes(lead.stage)) n += 1
  return n
}

/* ------------------------------------------------------------------ */
/* Visit → booking                                                     */
/* ------------------------------------------------------------------ */

/**
 * Median days from a customer's first attended visit to their booking.
 *
 * Median rather than mean: a handful of customers who booked nine months after
 * a visit would drag an average into a number no rep recognises.
 */
export function medianVisitToBookingDays(
  siteVisits: SiteVisit[],
  bookings: Booking[],
): number | null {
  const firstVisit = new Map<string, number>()
  for (const visit of siteVisits) {
    if (!visit.attended) continue
    const t = Date.parse(visit.scheduledAt)
    if (Number.isNaN(t)) continue
    const held = firstVisit.get(visit.leadId)
    if (held === undefined || t < held) firstVisit.set(visit.leadId, t)
  }

  const gaps: number[] = []
  for (const booking of bookings) {
    const visitedAt = firstVisit.get(booking.leadId)
    if (visitedAt === undefined) continue
    const bookedAt = Date.parse(booking.bookedAt)
    if (Number.isNaN(bookedAt) || bookedAt < visitedAt) continue
    gaps.push((bookedAt - visitedAt) / 86_400_000)
  }

  if (!gaps.length) return null
  gaps.sort((a, b) => a - b)
  const mid = Math.floor(gaps.length / 2)
  const median =
    gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2
  return round1(median)
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

function paymentHealth(payments: Payment[]): HealthStage {
  const overdue = payments.filter((p) => p.status === 'overdue').length
  const onSchedule = payments.length
    ? round1(((payments.length - overdue) / payments.length) * 100)
    : 0
  return {
    id: 'payments',
    index: 'Stage 05',
    label: 'Payments',
    count: payments.length,
    caption: `${onSchedule}% on schedule · ${overdue} overdue`,
    // Overdue is the actionable half; naming "due" beside it invites the
    // reader to add two overlapping numbers.
    alarming: onSchedule < 85,
  }
}

function serviceHealth(tickets: ServiceTicket[]): HealthStage {
  const now = DEMO_NOW.getTime()
  let breached = 0
  let open = 0
  for (const ticket of tickets) {
    if (ticket.status === 'resolved') continue
    open += 1
    const dueAt = Date.parse(ticket.slaDueAt)
    if (!Number.isNaN(dueAt) && dueAt < now) breached += 1
  }
  return {
    id: 'service',
    index: 'Stage 06',
    label: 'Service',
    count: open,
    caption: breached
      ? `${breached} past SLA`
      : 'All open tickets inside SLA',
    alarming: breached > 0,
  }
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useJourneySpine(): JourneySpine {
  const leads = useCrmStore((s) => s.leads)
  const payments = useCrmStore((s) => s.payments)
  const serviceTickets = useCrmStore((s) => s.serviceTickets)

  return useMemo(() => {
    const counts = [
      { id: 'leads', label: 'Leads', count: leads.length },
      {
        id: 'engaged',
        label: 'Engaged',
        count: countReached(leads, REACHED.engaged),
      },
      {
        id: 'site-visits',
        label: 'Site visits',
        count: countReached(leads, REACHED.siteVisit),
      },
      {
        id: 'bookings',
        label: 'Bookings',
        count: countReached(leads, REACHED.booking),
      },
    ]

    const first = counts[0].count || 1
    const funnel: SpineStage[] = counts.map((row, i) => ({
      ...row,
      index: `Stage 0${i + 1}`,
      share: Math.round((row.count / first) * 100),
      conversionFromPrev:
        i === 0 || !counts[i - 1].count
          ? null
          : round1((row.count / counts[i - 1].count) * 100),
      bottleneck: false,
    }))

    /*
     * The weakest hand-off, found rather than asserted.
     *
     * The mockup this layout came from flagged site visits by hand. On a book
     * where the worst step is somewhere else, a hardcoded flag points at the
     * wrong stage and quietly discredits the whole panel.
     */
    let worst: SpineStage | undefined
    for (const stage of funnel) {
      if (stage.conversionFromPrev === null) continue
      if (!worst || stage.conversionFromPrev < worst.conversionFromPrev!) {
        worst = stage
      }
    }
    if (worst) worst.bottleneck = true

    const weakest = worst
      ? {
          from: funnel[funnel.indexOf(worst) - 1].label,
          to: worst.label,
          conversion: worst.conversionFromPrev!,
        }
      : undefined

    return {
      funnel,
      health: [paymentHealth(payments), serviceHealth(serviceTickets)],
      summary: `${counts[0].count.toLocaleString('en-IN')} leads entered the book. ${counts[3].count.toLocaleString('en-IN')} reached booking.`,
      weakest,
    }
  }, [leads, payments, serviceTickets])
}
