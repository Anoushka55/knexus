
import type { Booking, Lead, SfTask } from '@/lib/kpmg-dice/types'
import { isOpen } from './overview'
import { STALL_THRESHOLD_DAYS } from './pipeline'
import { ref } from '@/lib/kpmg-dice/data/active-reference'

/** Reps above this open-task count get flagged as overloaded. */
export const BACKLOG_THRESHOLD = 50

export interface RepStats {
  id: string
  name: string
  initials: string
  territory: string
  leadsOwned: number
  openLeads: number
  hotLeads: number
  /** Median-ish response time, derived from answered-call ratio. */
  avgResponseHours: number
  followUpBacklog: number
  overloaded: boolean
  siteVisitsBooked: number
  conversions: number
  revenueCr: number
  /** Closed-won ÷ leads owned, %. */
  conversionPct: number
  stalledLeads: number
}

export function selectRepStats(
  leads: Lead[],
  bookings: Booking[],
  tasks: SfTask[],
): RepStats[] {
  const bookingByLead = new Map(bookings.map((b) => [b.leadId, b]))

  return ref().reps.map((rep) => {
    const owned = leads.filter((l) => l.ownerId === rep.id)
    const open = owned.filter(isOpen)
    const won = owned.filter((l) => l.stage === 'closed-won')

    const revenue = owned.reduce((sum, l) => {
      const booking = bookingByLead.get(l.id)
      return booking ? sum + booking.valueCr : sum
    }, 0)

    const backlog = tasks.filter(
      (t) => t.ownerId === rep.id && t.status === 'Open',
    ).length

    // Response time is inferred from how reliably calls get answered plus how
    // stale the book is — a proxy, but one grounded in the interaction record.
    const attempted = owned.reduce((s, l) => s + l.evidence.callsAttempted, 0)
    const answered = owned.reduce((s, l) => s + l.evidence.callsAnswered, 0)
    const answerRate = attempted ? answered / attempted : 0
    const avgStale = open.length
      ? open.reduce((s, l) => s + l.evidence.daysSinceLastActivity, 0) / open.length
      : 0

    return {
      id: rep.id,
      name: rep.name,
      initials: rep.initials,
      territory: rep.territory,
      leadsOwned: owned.length,
      openLeads: open.length,
      hotLeads: owned.filter((l) => l.intent === 'high').length,
      avgResponseHours: Math.round((2 + (1 - answerRate) * 9 + avgStale * 0.12) * 10) / 10,
      followUpBacklog: backlog,
      overloaded: backlog > BACKLOG_THRESHOLD,
      siteVisitsBooked: owned.filter((l) => l.evidence.siteVisitsAttended > 0).length,
      conversions: won.length,
      revenueCr: Math.round(revenue),
      conversionPct: owned.length
        ? Math.round((won.length / owned.length) * 1000) / 10
        : 0,
      stalledLeads: open.filter(
        (l) => l.evidence.daysSinceLastActivity > STALL_THRESHOLD_DAYS,
      ).length,
    }
  }).sort((a, b) => b.revenueCr - a.revenueCr)
}

