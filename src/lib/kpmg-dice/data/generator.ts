import { buildFeedback } from './feedback-generator'
import { FEATURED_PROFILES, FEATURED_TRANSCRIPTS } from './featured'
import { Rng } from './rng'
import {
  CAMPAIGNS,
  DEMO_NOW,
  FIRST_NAMES,
  LAST_NAMES,
  MICRO_MARKETS,
  OCCUPATIONS,
  PROJECTS,
  REPS,
  atHour,
  stableIndex,
} from './reference'
import type {
  Booking,
  Customer,
  Engagement,
  EngagementChannel,
  JourneyStage,
  Lead,
  Payment,
  RecoveryCase,
  ServiceTicket,
  SfTask,
  SiteVisit,
  SurveyInvite,
  SurveyResponse,
  Transcript,
  Unit,
} from '@/lib/kpmg-dice/types'

/**
 * Deterministic seed generator.
 *
 * Every campaign carries exact funnel targets, so the generator emits precisely
 * 12,842 leads → 4,652 qualified → 842 site visits → 326 bookings → 246 closed
 * won. Nothing on the Overview is written into a card; the cards read whatever
 * this produces. A fixed PRNG seed plus the DEMO_NOW clock means the server and
 * the browser build byte-identical data.
 */

/* ------------------------ Tuning constants ------------------------ */

/** Probability a lead at each stage eventually converts — the weighting used
 *  for "revenue at risk", so a stalled proposal counts for more than a cold lead. */
export const STAGE_PROBABILITY: Record<JourneyStage, number> = {
  lead: 0.02,
  engaged: 0.05,
  qualified: 0.15,
  'site-visit': 0.3,
  proposal: 0.45,
  booking: 0.85,
  'closed-won': 0,
  'closed-lost': 0,
}

/** Target count of high-intent ("hot") leads across the book. */
const HOT_LEAD_TARGET = 1246

/** Share of the unqualified pool that has gone cold or been lost. */
const CLOSED_LOST_SHARE = 0.07
const ENGAGED_SHARE = 0.35

/** Of the leads past site visit but short of booking, how many sit at proposal. */
const PROPOSAL_SHARE = 0.42

/** Exactly this many generated leads get the "Interested but negative" mismatch;
 *  Vikas Deshmukh is the authored 12th. */
const INTERESTED_NEGATIVE_COUNT = 11

/**
 * Minimum days a lead has existed by the time it reaches each stage. Stage
 * velocity on the pipeline dashboard is the gap between consecutive means, so
 * these have to increase monotonically along the funnel.
 */
const STAGE_BASE_AGE_DAYS: Record<JourneyStage, number> = {
  lead: 5,
  engaged: 35,
  qualified: 70,
  'site-visit': 105,
  proposal: 130,
  booking: 160,
  'closed-won': 185,
  'closed-lost': 60,
}

const CRM_STATUS_BY_STAGE: Record<JourneyStage, string> = {
  lead: 'New',
  engaged: 'Contacted',
  qualified: 'Qualified',
  'site-visit': 'Site Visit Scheduled',
  proposal: 'Proposal Sent',
  booking: 'Booked',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
}

/* ------------------------ Helpers ------------------------ */

function isoDaysBefore(days: number) {
  return new Date(DEMO_NOW.getTime() - days * 86_400_000).toISOString()
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/**
 * Hour of day for a logged contact.
 *
 * DEMO_NOW carries a time and isoDaysBefore subtracts whole days, so every
 * engagement inherited the same 10:30 and the record held no time-of-day
 * signal at all. Anything downstream that claims to read *when* a customer is
 * reachable was therefore reading a constant.
 *
 * The hour is derived from ids already on the record rather than drawn from
 * the rng: the lead generator's sequence is load-bearing for the headline
 * funnel figures, and consuming even one extra draw here would shift every
 * number after it. Same input, same hour, no draw taken.
 */
const CONTACT_HOURS: Record<EngagementChannel, number[]> = {
  // Reps dial during the working day; almost never after dinner.
  call: [10, 11, 12, 14, 15, 16, 17, 18],
  // Read on the commute and after the kids are down.
  whatsapp: [9, 13, 18, 19, 20, 20, 21, 21],
  email: [9, 10, 11, 15, 19, 20, 21, 22],
  // Browsing is a late-evening habit.
  website: [13, 19, 20, 21, 22, 22, 23, 8],
  // Site visits are daylight, and mostly at the weekend.
  'site-visit': [10, 11, 11, 12, 15, 16, 16, 17],
}

function contactHourFor(
  leadId: string,
  serial: number,
  channel: EngagementChannel,
) {
  const pool = CONTACT_HOURS[channel]
  return pool[stableIndex(leadId, serial, pool.length)]
}

/** Splits a total into per-stage bucket counts for one campaign. */
function stageBuckets(t: {
  leads: number
  qualified: number
  siteVisits: number
  bookings: number
  closedWon: number
}): Record<JourneyStage, number> {
  const closedWon = t.closedWon
  const booking = t.bookings - t.closedWon
  const postVisit = t.siteVisits - t.bookings
  const proposal = Math.round(postVisit * PROPOSAL_SHARE)
  const siteVisit = postVisit - proposal
  const qualified = t.qualified - t.siteVisits

  const unqualified = t.leads - t.qualified
  const closedLost = Math.round(unqualified * CLOSED_LOST_SHARE)
  const engaged = Math.round(unqualified * ENGAGED_SHARE)
  const lead = unqualified - closedLost - engaged

  return {
    lead,
    engaged,
    qualified,
    'site-visit': siteVisit,
    proposal,
    booking,
    'closed-won': closedWon,
    'closed-lost': closedLost,
  }
}

/** Days since last touch — deeper stages are worked harder, so they go stale less. */
function staleDays(rng: Rng, stage: JourneyStage) {
  const roll = rng.float()
  switch (stage) {
    case 'booking':
    case 'closed-won':
      return rng.int(1, 12)
    case 'proposal':
      return roll < 0.72 ? rng.int(1, 14) : rng.int(22, 40)
    case 'site-visit':
      return roll < 0.7 ? rng.int(1, 16) : rng.int(22, 45)
    case 'qualified':
      return roll < 0.76 ? rng.int(1, 20) : rng.int(22, 70)
    case 'engaged':
      return roll < 0.55 ? rng.int(2, 21) : rng.int(22, 90)
    default:
      return roll < 0.4 ? rng.int(1, 21) : rng.int(22, 130)
  }
}

/** Share of the lead book each rep carries, in REPS order. */
const REP_WEIGHTS = [0.245, 0.235, 0.235, 0.225, 0.06]

function weightedRepIndex(rng: Rng) {
  const roll = rng.float()
  let cumulative = 0
  for (let i = 0; i < REP_WEIGHTS.length; i += 1) {
    cumulative += REP_WEIGHTS[i]
    if (roll < cumulative) return i
  }
  return REP_WEIGHTS.length - 1
}

function budgetFor(rng: Rng, location: string) {
  const local = PROJECTS.filter((p) => p.location === location)
  const range = local.length
    ? rng.pick(local).priceRangeCr
    : ([1.0, 3.5] as [number, number])
  return round2(rng.float(range[0], range[1]))
}

/* ------------------------ Generation ------------------------ */

export interface SeedDataset {
  leads: Lead[]
  customers: Customer[]
  engagements: Engagement[]
  siteVisits: SiteVisit[]
  bookings: Booking[]
  units: Unit[]
  payments: Payment[]
  serviceTickets: ServiceTicket[]
  transcripts: Transcript[]
  tasks: SfTask[]
  surveyInvites: SurveyInvite[]
  surveyResponses: SurveyResponse[]
  recoveryCases: RecoveryCase[]
}


/* ------------------------------------------------------------------ */
/* Inventory                                                           */
/* ------------------------------------------------------------------ */

/** Typical carpet area by unit type, in square feet. */
const CARPET_SQFT: Record<string, number> = {
  '1 BHK': 460,
  '2 BHK': 730,
  '3 BHK': 1060,
  '4 BHK': 1520,
  Penthouse: 2450,
}

const FACINGS: Unit['facing'][] = ['East', 'West', 'North', 'South']

/**
 * Builds the unit book: every sold unit, plus what is still on the shelf.
 *
 * Sold units are derived from `bookings` rather than generated in parallel —
 * one booking, one unit, carrying that booking's own value. Generating both
 * independently would let the inventory disagree with the pipeline about how
 * much has gone, and every allocation decision downstream would rest on the
 * difference.
 */
function buildUnits(rng: Rng, bookings: Booking[]): Unit[] {
  const units: Unit[] = []
  let serial = 0

  const next = (projectId: string) => {
    serial += 1
    return `UNT-${projectId.replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase()}-${String(serial).padStart(5, '0')}`
  }

  // 1. One sold unit per booking.
  for (const booking of bookings) {
    units.push({
      id: next(booking.projectId),
      projectId: booking.projectId,
      projectName: booking.projectName,
      tower: rng.pick(['A', 'B', 'C']),
      unitType: booking.unitType,
      floor: rng.int(2, 24),
      carpetAreaSqft: CARPET_SQFT[booking.unitType] ?? 800,
      priceCr: booking.valueCr,
      facing: rng.pick(FACINGS),
      status: 'sold',
      bookingId: booking.id,
    })
  }

  // 2. What is left on the shelf, per project.
  for (const project of PROJECTS) {
    const [low, high] = project.priceRangeCr
    const types = project.unitTypes

    for (let i = 0; i < types.length; i += 1) {
      const unitType = types[i]
      // Price rises with unit size across the project's own band, so a 1 BHK
      // never prices above a 4 BHK in the same tower.
      const base = types.length > 1 ? low + ((high - low) * i) / (types.length - 1) : low

      const count = rng.int(9, 26)
      for (let u = 0; u < count; u += 1) {
        const floor = rng.int(2, 26)
        // A floor-rise premium, capped so the top floor is not a different
        // product from the bottom one.
        const priceCr = round2(base * (1 + Math.min(floor, 25) * 0.004))
        units.push({
          id: next(project.id),
          projectId: project.id,
          projectName: project.name,
          tower: rng.pick(['A', 'B', 'C']),
          unitType,
          floor,
          carpetAreaSqft: CARPET_SQFT[unitType] ?? 800,
          priceCr,
          facing: rng.pick(FACINGS),
          status: 'available',
        })
      }
    }
  }

  return units
}

export function buildSeedDataset(): SeedDataset {
  const rng = new Rng(20260531)

  const leads: Lead[] = []
  const engagements: Engagement[] = []
  const siteVisits: SiteVisit[] = []
  const bookings: Booking[] = []
  const payments: Payment[] = []
  const serviceTickets: ServiceTicket[] = []
  const tasks: SfTask[] = []
  const customers: Customer[] = []

  /* ---- 1. Featured (authored) records ---- */

  const featuredByBucket = new Map<string, number>()

  FEATURED_PROFILES.forEach((profile, pIdx) => {
    const { lead } = profile
    // The authored profiles are the records whose history has been ingested.
    leads.push({ ...lead, ingested: true })

    const key = `${lead.sourceCampaignId}::${lead.stage}`
    featuredByBucket.set(key, (featuredByBucket.get(key) ?? 0) + 1)

    profile.engagements.forEach((e, i) => {
      // Authored records are written with daysBefore(), which inherits
      // DEMO_NOW's 10:30 — the same flat time the generated ones used to
      // carry. The hero cohort is the most likely thing on screen, so it
      // gets a real hour by the same derivation rather than a constant.
      engagements.push({
        ...e,
        id: `eng-f${pIdx}-${i}`,
        leadId: lead.id,
        occurredAt: atHour(e.occurredAt, contactHourFor(lead.id, i, e.channel)),
      })
    })

    profile.siteVisits?.forEach((v, i) => {
      siteVisits.push({ ...v, id: `sv-f${pIdx}-${i}`, leadId: lead.id })
    })

    profile.tickets?.forEach((t, i) => {
      serviceTickets.push({
        ...t,
        id: `tkt-f${pIdx}-${i}`,
        leadId: lead.id,
        customerName: lead.name,
      })
    })

    customers.push({
      id: lead.id,
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      budgetCr: lead.budgetCr,
      preferredLocation: lead.preferredLocation,
      familySize: lead.familySize,
      intent: lead.intent,
      stage: lead.stage,
      occupation: profile.occupation,
      isNri: profile.isNri,
    })
  })

  /* ---- 2. Generated book, campaign by campaign ---- */

  let serial = 80000
  const generated: Lead[] = []

  for (const campaign of CAMPAIGNS) {
    const buckets = stageBuckets(campaign.targets)

    for (const [stageKey, totalCount] of Object.entries(buckets)) {
      const stage = stageKey as JourneyStage
      const alreadyAuthored =
        featuredByBucket.get(`${campaign.id}::${stage}`) ?? 0
      const count = totalCount - alreadyAuthored

      for (let i = 0; i < count; i += 1) {
        serial += 1
        const id = `MRD-${serial}`
        const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`
        const location = rng.pick(MICRO_MARKETS)
        const converted = stage === 'booking' || stage === 'closed-won'

        // Converted leads are priced around the campaign's average booking
        // value so revenue rolls up from the records themselves.
        const budgetCr = converted
          ? round2(
              Math.max(
                0.6,
                campaign.targets.avgBookingCr + rng.float(-1.15, 1.15),
              ),
            )
          : budgetFor(rng, location)

        const days = staleDays(rng, stage)
        // Age grows with how far the lead has travelled, so the difference in
        // mean age between consecutive stages is a real measure of velocity.
        const ageDays = days + STAGE_BASE_AGE_DAYS[stage] + rng.int(0, 25)

        const dnd = rng.chance(0.012)
        const negative = rng.chance(0.06)

        // Uneven books — Vikram Rao joined recently and carries a lighter,
        // fresher list, which is what keeps his follow-up backlog under control.
        const owner = REPS[weightedRepIndex(rng)].id

        const projectPool = PROJECTS.filter((p) => p.location === location)
        const interested = (
          projectPool.length ? projectPool : [rng.pick(PROJECTS)]
        )
          .slice(0, rng.int(1, 2))
          .map((p) => p.id)

        const callsAttempted = rng.int(1, 9)
        const callsAnswered = Math.min(
          callsAttempted,
          rng.int(0, converted ? 6 : 3),
        )

        generated.push({
          id,
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          phone: `+91 9${rng.int(1000000000, 1999999999)}`.slice(0, 16),
          score: 0, // assigned below, by rank
          intent: 'low',
          stage,
          budgetCr,
          preferredLocation: location,
          interestedProjectIds: interested,
          familySize: rng.int(1, 6),
          sourceCampaignId: campaign.id,
          ownerId: owner,
          crmStatus: CRM_STATUS_BY_STAGE[stage] as Lead['crmStatus'],
          evidenceStatus: 'unverified',
          sentiment: negative ? 'negative' : rng.chance(0.4) ? 'positive' : 'neutral',
          dnd,
          cold: dnd || stage === 'closed-lost',
          featured: false,
          ingested: false,
          evidence: {
            websiteVisits: rng.int(0, converted ? 9 : 5),
            brochureViews: rng.int(0, converted ? 5 : 3),
            emailOpens: rng.int(0, 8),
            callsAnswered,
            callsAttempted,
            whatsappReplies: rng.int(0, converted ? 10 : 4),
            projectsViewed: interested.length,
            siteVisitsAttended:
              stage === 'site-visit' ||
              stage === 'proposal' ||
              stage === 'booking' ||
              stage === 'closed-won'
                ? rng.int(1, 2)
                : // Most lost leads never made it to a site visit.
                  stage === 'closed-lost' && rng.chance(0.12)
                  ? 1
                  : 0,
            daysSinceLastActivity: days,
          },
          createdAt: isoDaysBefore(ageDays),
          lastActivityAt: isoDaysBefore(days),
        })
      }
    }
  }

  /* ---- 3. Score & intent, assigned by rank to hit the hot-lead target ---- */

  const stageBoost: Record<JourneyStage, number> = {
    lead: 0,
    engaged: 8,
    qualified: 18,
    'site-visit': 30,
    proposal: 36,
    booking: 44,
    'closed-won': 46,
    'closed-lost': -18,
  }

  for (const lead of generated) {
    const e = lead.evidence
    const raw =
      22 +
      stageBoost[lead.stage] +
      e.websiteVisits * 1.8 +
      e.brochureViews * 2.4 +
      e.emailOpens * 0.9 +
      e.callsAnswered * 3.1 +
      e.whatsappReplies * 1.4 +
      e.siteVisitsAttended * 5 -
      // Staleness is penalised hard: a lead nobody has touched in a month is
      // not a hot lead, however good its original evidence looked.
      Math.min(e.daysSinceLastActivity, 60) * 0.75 -
      (lead.sentiment === 'negative' ? 14 : 0) -
      (lead.dnd ? 25 : 0)

    // Squash the raw signal sum through a logistic curve. A linear clamp piled
    // a large share of the book onto 99, which reads as a broken model; this
    // keeps the mass in the 30–75 band and reserves the 90s for genuinely
    // exceptional records.
    lead.score = Math.max(
      3,
      Math.min(99, Math.round(3 + 96 / (1 + Math.exp(-(raw - 40) / 18)))),
    )

    // Evidence status is derived from behaviour, then compared with what the
    // rep put in the CRM — the divergence is the pitch.
    const engagementDepth =
      e.callsAnswered * 2 + e.siteVisitsAttended * 3 + e.brochureViews
    const claimsProgress =
      lead.stage === 'qualified' ||
      lead.stage === 'site-visit' ||
      lead.stage === 'proposal'

    lead.evidenceStatus =
      engagementDepth >= 8
        ? 'strong-evidence'
        : engagementDepth >= 4
          ? 'supported'
          : claimsProgress && e.daysSinceLastActivity > 30 && e.callsAnswered === 0
            ? 'contradicted'
            : engagementDepth >= 1
              ? 'weak-evidence'
              : 'unverified'
  }

  /**
   * Intent is ranked on "heat" — the score discounted by how long the record
   * has been silent — not on the displayed score. A strong lead nobody has
   * touched in six weeks is not hot, but it should still show its real score.
   */
  const heat = (l: Lead) =>
    l.score - Math.min(l.evidence.daysSinceLastActivity, 90) * 0.42

  const eligible = generated
    .filter((l) => !l.dnd && l.stage !== 'closed-lost' && l.stage !== 'closed-won')
    .sort((a, b) => heat(b) - heat(a))

  const featuredHot = FEATURED_PROFILES.filter(
    (p) => p.lead.intent === 'high',
  ).length
  const hotQuota = HOT_LEAD_TARGET - featuredHot

  eligible.forEach((lead, i) => {
    lead.intent =
      i < hotQuota ? 'high' : i < hotQuota + 3600 ? 'medium' : 'low'
  })
  for (const lead of generated) {
    if (lead.dnd) lead.intent = 'cold'
    else if (lead.stage === 'closed-lost') lead.intent = 'cold'
  }

  // The "marked Interested but the calls say otherwise" cohort, fixed in size
  // so the alert count is stable across runs.
  const mismatchPool = generated
    .filter((l) => l.stage === 'qualified' && l.sentiment === 'negative')
    .slice(0, INTERESTED_NEGATIVE_COUNT)
  for (const lead of mismatchPool) {
    lead.crmStatus = 'Interested'
    lead.evidenceStatus = 'contradicted'
  }

  leads.push(...generated)

  /* ---- 4. Bookings, payments, site visits for converted leads ---- */

  let bookingSerial = 0
  for (const lead of leads) {
    if (lead.stage !== 'booking' && lead.stage !== 'closed-won') continue

    bookingSerial += 1
    const project =
      PROJECTS.find((p) => lead.interestedProjectIds.includes(p.id)) ??
      PROJECTS.find((p) => p.location === lead.preferredLocation) ??
      PROJECTS[0]

    const bookedDaysAgo = rng.int(6, 150)
    const booking: Booking = {
      id: `BKG-${10000 + bookingSerial}`,
      leadId: lead.id,
      projectId: project.id,
      projectName: project.name,
      unitType: rng.pick(project.unitTypes),
      valueCr: lead.budgetCr,
      bookedAt: isoDaysBefore(bookedDaysAgo),
      closedWon: lead.stage === 'closed-won',
    }
    bookings.push(booking)

    const schedule: [string, number][] = [
      ['Booking amount (10%)', 0.1],
      ['Agreement & stamp duty (20%)', 0.2],
      ['Slab completion (30%)', 0.3],
      ['Possession (40%)', 0.4],
    ]
    schedule.forEach(([milestone, share], i) => {
      const dueDaysAgo = bookedDaysAgo - i * 45
      const paid = dueDaysAgo > 0 && rng.chance(0.78)
      payments.push({
        id: `PAY-${booking.id}-${i}`,
        bookingId: booking.id,
        leadId: lead.id,
        milestone,
        amountCr: round2(booking.valueCr * share),
        dueAt: isoDaysBefore(dueDaysAgo),
        paidAt: paid ? isoDaysBefore(Math.max(0, dueDaysAgo - rng.int(0, 8))) : undefined,
        status: paid ? 'paid' : dueDaysAgo > 0 ? 'overdue' : 'due',
      })
    })
  }

  // Generated site visits for every lead that reached the site-visit stage.
  let visitSerial = 0
  for (const lead of leads) {
    if (lead.featured) continue
    if (lead.evidence.siteVisitsAttended < 1) continue

    visitSerial += 1
    const project =
      PROJECTS.find((p) => lead.interestedProjectIds.includes(p.id)) ?? PROJECTS[0]
    const converted = lead.stage === 'booking' || lead.stage === 'closed-won'

    siteVisits.push({
      id: `SV-${20000 + visitSerial}`,
      leadId: lead.id,
      projectId: project.id,
      projectName: project.name,
      scheduledAt: isoDaysBefore(lead.evidence.daysSinceLastActivity + rng.int(3, 40)),
      attended: true,
      feedback: converted ? 'Positive — proceeded to booking.' : undefined,
      objection: converted
        ? undefined
        : rng.pick([
            'Possession Timeline',
            'Pricing vs competitor',
            'Carpet area efficiency',
            'Loan eligibility',
            'Location connectivity',
          ]),
      outcome: converted ? 'booked' : rng.chance(0.5) ? 'considering' : 'dropped',
    })
  }

  /* ---- 4b. Conversation history for the generated book ---- */

  /**
   * Engagement rows for every lead that got past qualification, so the
   * Engagements view reflects the whole book rather than the ten authored
   * profiles. These carry no `ingested` flag, so they never enter the
   * next-best-action queue — that stays gated on sanitised records.
   */
  const ENGAGEMENT_TEMPLATES: Record<
    EngagementChannel,
    { subject: string; summary: string }[]
  > = {
    website: [
      { subject: 'Enquiry form submitted', summary: 'Submitted an enquiry from the project landing page.' },
      { subject: 'Return visit — pricing page', summary: 'Came back to the pricing and floor-plan pages.' },
      { subject: 'Brochure download', summary: 'Downloaded the project brochure and unit layouts.' },
    ],
    call: [
      { subject: 'Qualification call', summary: 'Confirmed budget band, preferred configuration and timeline.' },
      { subject: 'Follow-up call', summary: 'Checked in on the shortlist and answered pricing questions.' },
      { subject: 'Attempted contact', summary: 'Outbound attempt — no answer, voicemail left.' },
      { subject: 'Objection discussion', summary: 'Talked through possession timeline and payment structure.' },
    ],
    email: [
      { subject: 'Floor plans & price list', summary: 'Sent the configuration pack and indicative pricing.' },
      { subject: 'Site visit invitation', summary: 'Invited to a weekend site visit with directions.' },
      { subject: 'Offer reminder', summary: 'Shared the current launch offer and its closing date.' },
    ],
    whatsapp: [
      { subject: 'Availability question', summary: 'Asked which configurations are still open.' },
      { subject: 'Visit scheduling', summary: 'Coordinated a slot for the site visit.' },
      { subject: 'Payment plan question', summary: 'Asked how the construction-linked plan is staged.' },
    ],
    'site-visit': [
      { subject: 'Site visit — sample flat', summary: 'Walked the sample flat and amenity deck with the sales team.' },
      { subject: 'Repeat site visit', summary: 'Second visit, this time with family, to confirm the layout.' },
    ],
  }

  const CHANNEL_WEIGHTS: EngagementChannel[] = [
    'call', 'call', 'email', 'whatsapp', 'website', 'website', 'site-visit',
  ]

  let engagementSerial = 0
  for (const lead of leads) {
    if (lead.featured) continue
    // Deep-funnel leads always get a history; a slice of qualified ones do too.
    const deep = ['site-visit', 'proposal', 'booking', 'closed-won'].includes(lead.stage)
    if (!deep && !(lead.stage === 'qualified' && rng.chance(0.3))) continue

    const count = deep ? rng.int(3, 6) : rng.int(2, 3)
    // Walk backwards from the last touch so the timeline reads chronologically.
    let daysAgo = lead.evidence.daysSinceLastActivity

    for (let i = 0; i < count; i += 1) {
      const channel = deep && i === 0 ? 'site-visit' : rng.pick(CHANNEL_WEIGHTS)
      const template = rng.pick(ENGAGEMENT_TEMPLATES[channel])

      engagementSerial += 1
      engagements.push({
        id: `ENG-${50000 + engagementSerial}`,
        leadId: lead.id,
        channel,
        direction:
          channel === 'email' || (channel === 'call' && rng.chance(0.65))
            ? 'outbound'
            : 'inbound',
        sentiment:
          lead.sentiment === 'negative' && i === 0
            ? 'negative'
            : rng.chance(0.42)
              ? 'positive'
              : 'neutral',
        subject: template.subject,
        summary: template.summary,
        durationMins: channel === 'call' ? rng.int(2, 14) : undefined,
        occurredAt: atHour(
          isoDaysBefore(daysAgo),
          contactHourFor(lead.id, engagementSerial, channel),
        ),
      })

      daysAgo += rng.int(4, 26)
    }
  }

  /* ---- 5. Overdue follow-up tasks (drives the rep backlog alert) ---- */

  let taskSerial = 0
  for (const lead of leads) {
    const open =
      lead.stage !== 'closed-won' &&
      lead.stage !== 'closed-lost' &&
      !lead.dnd
    // A follow-up is owed on any open, stale lead that is still worth a call:
    // it has to be warm enough to matter and have engaged at least once.
    const needsFollowUp =
      open &&
      lead.evidence.daysSinceLastActivity > 21 &&
      lead.score >= 50 &&
      (lead.evidence.callsAnswered > 0 || lead.evidence.whatsappReplies > 0)

    if (!needsFollowUp) continue

    taskSerial += 1
    tasks.push({
      id: `TSK-${30000 + taskSerial}`,
      subject: `Follow up — ${lead.name}`,
      whatId: lead.id,
      ownerId: lead.ownerId,
      dueAt: isoDaysBefore(lead.evidence.daysSinceLastActivity - 14),
      priority: lead.intent === 'high' ? 'High' : 'Normal',
      status: 'Open',
      createdBy: 'Rep',
      createdAt: isoDaysBefore(lead.evidence.daysSinceLastActivity),
    })
  }

  /* ---- 6. Post-sales service tickets for booked customers ---- */

  const bookedLeads = leads.filter((l) => l.stage === 'booking' && !l.featured)
  const ticketSubjects: [string, string, ServiceTicket['severity']][] = [
    ['Possession date clarification', 'Handover', 'medium'],
    ['Payment receipt not reflected', 'Finance', 'high'],
    ['Snag list pending closure', 'Quality', 'high'],
    ['Parking allotment change request', 'Allotment', 'info'],
    ['Loan disbursement NOC delay', 'Documentation', 'critical'],
    ['Club membership activation', 'Amenities', 'info'],
  ]

  bookedLeads.slice(0, 42).forEach((lead, i) => {
    const [subject, category, severity] = ticketSubjects[i % ticketSubjects.length]
    const openedDaysAgo = rng.int(2, 40)
    const slaDays = severity === 'critical' ? 3 : severity === 'high' ? 7 : 14
    const resolved = rng.chance(0.45)

    serviceTickets.push({
      id: `TKT-${40000 + i}`,
      leadId: lead.id,
      customerName: lead.name,
      subject,
      category,
      severity,
      openedAt: isoDaysBefore(openedDaysAgo),
      slaDueAt: isoDaysBefore(openedDaysAgo - slaDays),
      resolvedAt: resolved ? isoDaysBefore(rng.int(0, openedDaysAgo)) : undefined,
      status: resolved ? 'resolved' : rng.chance(0.5) ? 'in-progress' : 'open',
      detail: `${subject} raised by ${lead.name} for ${lead.preferredLocation}.`,
    })
  })

  /* ---- 7. Customers for the converted book ---- */

  for (const lead of leads) {
    if (lead.featured) continue
    if (lead.stage !== 'booking' && lead.stage !== 'closed-won') continue

    customers.push({
      id: lead.id,
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      budgetCr: lead.budgetCr,
      preferredLocation: lead.preferredLocation,
      familySize: lead.familySize,
      intent: lead.intent,
      stage: lead.stage,
      occupation: rng.pick(OCCUPATIONS),
      isNri: rng.chance(0.08),
    })
  }

  /* ---- 8. Feedback, on its own PRNG ---- */

  const feedback = buildFeedback({
    leads,
    bookings,
    siteVisits,
    serviceTickets,
    payments,
    engagements,
  })

  return {
    leads,
    customers,
    engagements,
    siteVisits,
    bookings,
    units: buildUnits(rng, bookings),
    payments,
    serviceTickets,
    transcripts: FEATURED_TRANSCRIPTS,
    tasks,
    ...feedback,
  }
}
