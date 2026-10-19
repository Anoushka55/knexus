import { DEMO_NOW, MONTHLY_ROLLUPS } from '@/lib/kpmg-dice/data/reference'
import { STAGE_PROBABILITY } from '@/lib/kpmg-dice/data/generator'
import type {
  Booking,
  JourneyStage,
  Lead,
  RiskAlert,
  ServiceTicket,
  SfTask,
  Trend,
} from '@/lib/kpmg-dice/types'
import { ref } from '@/lib/kpmg-dice/data/active-reference'

/**
 * Every figure the Overview renders is computed here from the seed dataset.
 * No card holds a literal.
 */

const OPEN_STAGES: JourneyStage[] = [
  'lead',
  'engaged',
  'qualified',
  'site-visit',
  'proposal',
  'booking',
]

export function isOpen(lead: Lead) {
  return OPEN_STAGES.includes(lead.stage)
}

/** Has the lead reached at least this stage? */
const REACH: Record<string, JourneyStage[]> = {
  qualified: ['qualified', 'site-visit', 'proposal', 'booking', 'closed-won'],
  siteVisit: ['site-visit', 'proposal', 'booking', 'closed-won'],
  booking: ['booking', 'closed-won'],
  closedWon: ['closed-won'],
}

/* ------------------------------------------------------------------ */
/* Funnel                                                              */
/* ------------------------------------------------------------------ */

export interface FunnelRow {
  label: string
  shortLabel?: string
  count: number
  conversionFromPrev: number | null
  color: string
  onColor: 'light' | 'dark'
}

/** Validated ordinal ramp (single hue, monotone lightness, light end ≥ 2:1). */
const FUNNEL_RAMP = [
  { color: '#7FB3E3', onColor: 'dark' as const },
  { color: '#3D8FD1', onColor: 'dark' as const },
  { color: '#0A6CBA', onColor: 'light' as const },
  { color: '#00509C', onColor: 'light' as const },
  { color: '#00338D', onColor: 'light' as const },
]

export function selectFunnel(leads: Lead[]): FunnelRow[] {
  const total = leads.length
  const qualified = leads.filter((l) => REACH.qualified.includes(l.stage)).length
  const siteVisits = leads.filter((l) => REACH.siteVisit.includes(l.stage)).length
  const bookings = leads.filter((l) => REACH.booking.includes(l.stage)).length
  const closedWon = leads.filter((l) => REACH.closedWon.includes(l.stage)).length

  const counts = [
    { label: 'Leads', count: total },
    { label: 'Qualified Leads', shortLabel: 'Qualified', count: qualified },
    { label: 'Site Visits', count: siteVisits },
    { label: 'Bookings', count: bookings },
    { label: 'Closed Won', count: closedWon },
  ]

  return counts.map((row, i) => ({
    ...row,
    conversionFromPrev:
      i === 0 ? null : round1((row.count / counts[i - 1].count) * 100),
    ...FUNNEL_RAMP[i],
  }))
}

export function selectOverallConversion(leads: Lead[]) {
  const closedWon = leads.filter((l) => l.stage === 'closed-won').length
  return round2((closedWon / leads.length) * 100)
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */

/** Probability-weighted pipeline value — a stalled proposal is worth more
 *  than a stalled cold lead, so "revenue at risk" reflects real exposure. */
export function weightedValueCr(lead: Lead) {
  return lead.budgetCr * STAGE_PROBABILITY[lead.stage]
}

/** Stages deep enough that losing the lead actually costs revenue. */
const DEEP_STAGES: JourneyStage[] = [
  'qualified',
  'site-visit',
  'proposal',
  'booking',
]

/**
 * A lead is at risk when it sits in the revenue-bearing part of the funnel and
 * DICE has a concrete reason to doubt it: it has gone quiet while hot, the CRM
 * status is contradicted by the interaction record, or the rep logged interest
 * that the call sentiment does not support.
 */
export function isAtRisk(lead: Lead) {
  if (!isOpen(lead) || lead.dnd) return false
  if (!DEEP_STAGES.includes(lead.stage)) return false
  return (
    (lead.intent === 'high' && lead.evidence.daysSinceLastActivity > 21) ||
    lead.evidenceStatus === 'contradicted' ||
    (lead.sentiment === 'negative' && lead.crmStatus === 'Interested')
  )
}

export interface KpiValues {
  totalLeads: number
  /** Net Promoter Score across the feedback book. */
  nps: number
  hotLeads: number
  siteVisits: number
  bookings: number
  revenueYtdCr: number
  revenueAtRiskCr: number
}

export function selectKpiValues(
  leads: Lead[],
  bookings: Booking[],
  nps = 0,
): KpiValues {
  return {
    nps,
    totalLeads: leads.length,
    hotLeads: leads.filter((l) => l.intent === 'high').length,
    siteVisits: leads.filter((l) => REACH.siteVisit.includes(l.stage)).length,
    bookings: bookings.length,
    revenueYtdCr: Math.round(bookings.reduce((sum, b) => sum + b.valueCr, 0)),
    revenueAtRiskCr: Math.round(
      leads.filter(isAtRisk).reduce((sum, l) => sum + weightedValueCr(l), 0),
    ),
  }
}

/** Month-on-month deltas are stored rather than derived — a current-state
 *  snapshot cannot recompute what last month looked like. */
export const KPI_DELTAS = {
  // Matches the monthly trend the feedback book actually produces: 31 in April
  // down to 28 in May. Satisfaction is declining, and the tile says so.
  nps: -3,
  totalLeads: 18,
  hotLeads: 12,
  siteVisits: 11,
  bookings: 18,
  revenueYtdCr: 22,
  revenueAtRiskCr: -9,
} as const

/* ------------------------------------------------------------------ */
/* Conversion trend                                                    */
/* ------------------------------------------------------------------ */

export interface TrendPoint {
  month: string
  leadToSiteVisit: number
  leadToBooking: number
}

/**
 * Prior months come from stored monthly rollups; the latest point is computed
 * live off the current book, so the chart lands on today's real numbers.
 */
export function selectConversionTrend(leads: Lead[]): TrendPoint[] {
  const total = leads.length
  const siteVisits = leads.filter((l) => REACH.siteVisit.includes(l.stage)).length
  const bookings = leads.filter((l) => REACH.booking.includes(l.stage)).length

  const history = MONTHLY_ROLLUPS.slice(0, -1).map((r) => ({
    month: r.month,
    leadToSiteVisit: r.leadToSiteVisit,
    leadToBooking: r.leadToBooking,
  }))

  return [
    ...history,
    {
      month: MONTHLY_ROLLUPS[MONTHLY_ROLLUPS.length - 1].month,
      leadToSiteVisit: round1((siteVisits / total) * 100),
      leadToBooking: round1((bookings / total) * 100),
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

export interface CampaignRow {
  id: string
  name: string
  channel: string
  headline: boolean
  leads: number
  qualifiedLeads: number
  qualifiedPct: number
  siteVisits: number
  siteVisitPct: number
  bookings: number
  bookingRate: number
  trend: Trend
  spendLakh: number
  costPerQualifiedLakh: number
  /** Cost per lead, in rupees. */
  costPerLead: number
  /** Cost per booking, in ₹ Lakh. */
  costPerBookingLakh: number
  /** 0–100 composite weighted toward outcomes, not volume. */
  qualityScore: number
  recommendation: 'Scale' | 'Optimise' | 'Pause'
}

/**
 * Quality score weights outcomes far above volume: a booking is worth 5x a
 * site visit and ~17x a qualified lead. That is what stops a campaign with
 * 3,200 leads and 19 bookings from looking like a winner.
 */
function qualityScoreFor(
  qualifiedPct: number,
  siteVisitPct: number,
  bookingRate: number,
) {
  return Math.min(
    100,
    Math.round(qualifiedPct * 0.3 + siteVisitPct * 2 + bookingRate * 5),
  )
}

function recommendationFor(score: number): CampaignRow['recommendation'] {
  if (score >= 50) return 'Scale'
  if (score >= 30) return 'Optimise'
  return 'Pause'
}

/** Stored direction-of-travel per campaign (needs a prior period to compute). */
const CAMPAIGN_TREND: Record<string, Trend> = {
  'cmp-summer-homes': 'up',
  'cmp-urban-living': 'up',
  'cmp-premium-living': 'down',
  'cmp-refer-earn': 'down',
  'cmp-digital-organic': 'down',
  'cmp-portals': 'down',
  'cmp-broker': 'down',
  'cmp-corporate': 'flat',
  'cmp-walkin': 'flat',
}

export function selectCampaignRows(leads: Lead[]): CampaignRow[] {
  return ref().campaigns.map((campaign) => {
    const owned = leads.filter((l) => l.sourceCampaignId === campaign.id)
    const qualified = owned.filter((l) => REACH.qualified.includes(l.stage)).length
    const siteVisits = owned.filter((l) => REACH.siteVisit.includes(l.stage)).length
    const bookings = owned.filter((l) => REACH.booking.includes(l.stage)).length

    const qualifiedPct = round1((qualified / owned.length) * 100)
    const siteVisitPct = round1((siteVisits / owned.length) * 100)
    const bookingRate = round1((bookings / owned.length) * 100)
    const qualityScore = qualityScoreFor(qualifiedPct, siteVisitPct, bookingRate)

    return {
      id: campaign.id,
      name: campaign.name,
      channel: campaign.channel,
      headline: campaign.headline,
      leads: owned.length,
      qualifiedLeads: qualified,
      qualifiedPct,
      siteVisits,
      siteVisitPct,
      bookings,
      bookingRate,
      trend: CAMPAIGN_TREND[campaign.id] ?? 'flat',
      spendLakh: campaign.spendLakh,
      costPerQualifiedLakh: qualified
        ? round2(campaign.spendLakh / qualified)
        : 0,
      costPerLead: owned.length
        ? Math.round((campaign.spendLakh * 100_000) / owned.length)
        : 0,
      costPerBookingLakh: bookings ? round1(campaign.spendLakh / bookings) : 0,
      qualityScore,
      recommendation: recommendationFor(qualityScore),
    }
  }).sort((a, b) => b.bookingRate - a.bookingRate)
}

export function selectTopCampaigns(leads: Lead[], limit = 5) {
  return selectCampaignRows(leads).slice(0, limit)
}

/* ------------------------------------------------------------------ */
/* Next best actions                                                   */
/* ------------------------------------------------------------------ */

export type NbaIcon =
  | 'call'
  | 'site-visit'
  | 'payment-plan'
  | 'whatsapp'
  | 'follow-up'
  | 'suppress'

export interface RecommendedActionRow {
  id: string
  leadId: string
  customerName: string
  project: string
  budget: string
  score: number
  action: string
  actionIcon: NbaIcon
  reason: string
  owner: string
}

/** Rule layer behind the Next Best Action column. Prompt 4 routes this through
 *  the agent framework; the mapping stays the same. */
export function nextBestActionFor(lead: Lead): {
  action: string
  icon: NbaIcon
} {
  if (lead.dnd || lead.evidenceStatus === 'contradicted') {
    return { action: 'Validate & re-qualify', icon: 'suppress' }
  }
  if (lead.evidence.daysSinceLastActivity > 14) {
    return { action: `Follow-up in 15 days`, icon: 'follow-up' }
  }
  if (lead.score >= 90) return { action: 'Call within 2 hrs', icon: 'call' }
  if (lead.score >= 80) return { action: 'Schedule Site Visit', icon: 'site-visit' }
  if (lead.score >= 70) return { action: 'Send Payment Plan', icon: 'payment-plan' }
  return { action: 'Nurture via WhatsApp', icon: 'whatsapp' }
}

function fallbackReason(lead: Lead) {
  const e = lead.evidence
  const bits: string[] = []
  if (e.websiteVisits >= 3) bits.push(`visited website ${e.websiteVisits}x`)
  if (e.brochureViews >= 2) bits.push(`viewed ${e.brochureViews} brochures`)
  if (e.siteVisitsAttended >= 1) bits.push('attended a site visit')
  if (e.daysSinceLastActivity > 14)
    bits.push(`no activity in ${e.daysSinceLastActivity} days`)
  if (!bits.length) bits.push('limited engagement recorded')
  return `${bits.slice(0, 2).join('; ')}`.replace(/^./, (c) => c.toUpperCase())
}

/** Stages where a sales next-best-action still applies — a booked unit is
 *  handed to post-sales, not re-pitched. */
const ACTIONABLE_STAGES: JourneyStage[] = [
  'lead',
  'engaged',
  'qualified',
  'site-visit',
  'proposal',
]

/**
 * DICE only recommends an action for leads whose interaction history has been
 * ingested and sanitised through EAI — you cannot reason about a next step from
 * a bare CRM row. `ingestedLeadIds` is that set; everything else waits for
 * ingestion. Within it, the queue ranks purely on lead score.
 */
export function selectNextBestActions(
  leads: Lead[],
  ingestedLeadIds: Set<string>,
  limit = 5,
): RecommendedActionRow[] {
  return [...leads]
    .filter(
      (l) =>
        ingestedLeadIds.has(l.id) &&
        ACTIONABLE_STAGES.includes(l.stage) &&
        !l.dnd,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((lead) => {
      const { action, icon } = nextBestActionFor(lead)
      const rep = ref().reps.find((r) => r.id === lead.ownerId)
      return {
        id: `nba-${lead.id}`,
        leadId: lead.id,
        customerName: lead.name,
        project: lead.preferredLocation,
        budget: `₹${lead.budgetCr} Cr`,
        score: lead.score,
        action,
        actionIcon: icon,
        reason: lead.evidenceNote ?? fallbackReason(lead),
        owner: rep?.initials ?? '—',
      }
    })
}

/* ------------------------------------------------------------------ */
/* Risk alerts                                                         */
/* ------------------------------------------------------------------ */

export function selectRiskAlerts(
  leads: Lead[],
  tasks: SfTask[],
  tickets: ServiceTicket[],
): RiskAlert[] {
  const alerts: RiskAlert[] = []
  const now = DEMO_NOW.toISOString()

  /* 1 — hot leads gone quiet */
  const staleHot = leads.filter(
    (l) =>
      isOpen(l) &&
      l.intent === 'high' &&
      l.evidence.daysSinceLastActivity > 21 &&
      ['qualified', 'site-visit', 'proposal'].includes(l.stage),
  )
  if (staleHot.length) {
    const value = staleHot.reduce((s, l) => s + weightedValueCr(l), 0)
    alerts.push({
      id: 'risk-stale-hot',
      severity: 'critical',
      headline: `${staleHot.length} Hot Leads inactive for > 21 days`,
      detail: `Potential revenue at risk ₹${round1(value)} Cr`,
      impactedRevenueCr: round1(value),
      raisedAt: now,
      href: '/agents/kpmg-dice/console/risk-alerts',
    })
  }

  /* 2 — CRM status contradicted by the conversation record */
  const mismatched = leads.filter(
    (l) => l.crmStatus === 'Interested' && l.sentiment === 'negative',
  )
  if (mismatched.length) {
    alerts.push({
      id: 'risk-sentiment-mismatch',
      severity: 'high',
      headline: `${mismatched.length} Leads marked 'Interested' but negative sentiment in calls`,
      detail: 'Review required',
      raisedAt: now,
      href: '/agents/kpmg-dice/console/risk-alerts',
    })
  }

  /* 3 — rep follow-up backlog */
  const backlogByRep = new Map<string, number>()
  for (const task of tasks) {
    if (task.status !== 'Open') continue
    backlogByRep.set(task.ownerId, (backlogByRep.get(task.ownerId) ?? 0) + 1)
  }
  const overloaded = [...backlogByRep.values()].filter((n) => n > 50).length
  if (overloaded) {
    alerts.push({
      id: 'risk-rep-backlog',
      severity: 'medium',
      headline: `${overloaded} Sales Reps with follow-up backlog > 50 leads`,
      detail: 'Action needed',
      raisedAt: now,
      href: '/agents/kpmg-dice/console/team-performance',
    })
  }

  /* 4 — worst-performing marketing campaign by booking rate. Long-tail
        sources (portals, brokers, walk-ins) are not campaigns you can retarget,
        so they are excluded from the recommendation. */
  const headlineIds = new Set(
    ref().campaigns.filter((c) => c.headline).map((c) => c.id),
  )
  const campaignRows = selectCampaignRows(leads).filter((c) =>
    headlineIds.has(c.id),
  )
  const worst = campaignRows[campaignRows.length - 1]
  if (worst) {
    alerts.push({
      id: 'risk-campaign',
      severity: 'info',
      headline: `Campaign '${worst.name}' low booking rate (${worst.bookingRate}%)`,
      detail: 'Optimise campaign targeting',
      raisedAt: now,
      href: '/agents/kpmg-dice/console/campaign-analytics',
    })
  }

  /* 5 — SLA breaches on open service tickets */
  const breached = tickets.filter(
    (t) => t.status !== 'resolved' && new Date(t.slaDueAt) < DEMO_NOW,
  )
  if (breached.length) {
    alerts.push({
      id: 'risk-sla',
      severity: 'high',
      headline: `${breached.length} service tickets past SLA`,
      detail: 'Post-sales experience at risk',
      raisedAt: now,
      href: '/agents/kpmg-dice/console/service-tickets',
    })
  }

  return alerts
}

/* ------------------------------------------------------------------ */
/* Shared numeric helpers                                              */
/* ------------------------------------------------------------------ */

function round1(n: number) {
  return Math.round(n * 10) / 10
}
function round2(n: number) {
  return Math.round(n * 100) / 100
}
