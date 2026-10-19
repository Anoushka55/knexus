import {
  FEATURED_INVITES,
  THEME_DEFS,
  FEATURED_RESPONSES,
  VERBATIM_POOLS,
  npsBandFor,
} from './feedback'
import {
  DEMO_NOW,
  PROJECTS,
  REPS,
  atHour,
  dayPartOf,
  stableIndex,
} from './reference'
import { mapLeadToPersonas } from '@/lib/kpmg-dice/lib/personas/mapping'
import { Rng } from './rng'
import type {
  Booking,
  Engagement,
  EngagementChannel,
  Lead,
  Payment,
  RecoveryCase,
  Sentiment,
  ServiceTicket,
  Severity,
  SiteVisit,
  SurveyChannel,
  SurveyInvite,
  SurveyResponse,
  TouchpointId,
} from '@/lib/kpmg-dice/types'

/**
 * Feedback seed generation.
 *
 * Runs on its own PRNG instance, seeded independently of the lead generator.
 * Sharing the sequence would shift every draw after it and silently move the
 * headline funnel numbers, so the two are kept apart on purpose.
 *
 * Authored records land first — same convention as FEATURED_PROFILES — and
 * generated volume fills in around them.
 */

/** Deliberately not the lead generator's 20260531. */
const FEEDBACK_SEED = 20260601

/**
 * A second seed, for the connected-org view.
 *
 * Switching the data source has to change the numbers or the control is
 * theatre. Both books are generated the same way from the same records, so
 * every screen stays internally coherent whichever one is showing.
 */
export const DATA_SOURCE_SEEDS: Record<'example' | 'client', number> = {
  example: FEEDBACK_SEED,
  client: 20260714,
}

/**
 * The projects the feedback programme actually runs on.
 *
 * Six of the seventeen, the rest held in reserve. This narrows the feedback
 * book only — PROJECTS itself is untouched, so lead generation and its
 * micro-market coverage are unaffected and the headline funnel figures hold. A
 * shorter PROJECTS array would leave more markets without a project, fire the
 * fallback draw more often, and move every number after it.
 *
 * Four slots are pinned. The authored records in feedback.ts are written
 * against these projects and inject ahead of generated volume, so excluding
 * one would put a seventh name in the charts and defeat the point. Only the
 * remaining two genuinely rotate — worth being straight about rather than
 * implying the whole set reshuffles.
 *
 * Selection is derived from the seed rather than drawn from the rng, so it
 * costs no draws; shuffleFeedback and setFeedbackSource already vary the seed,
 * which rotates the two open slots for free.
 */
const ANCHOR_PROJECT_IDS = [
  'prj-serein',
  'prj-eureka-park',
  'prj-dream-acres',
  'prj-royal-pavilion',
]

const ACTIVE_PROJECT_COUNT = 6

function activeProjectsFor(seed: number): Set<string> {
  const active = new Set(ANCHOR_PROJECT_IDS)
  const reserves = PROJECTS.map((p) => p.id).filter((id) => !active.has(id))

  for (let i = 0; active.size < ACTIVE_PROJECT_COUNT && reserves.length; i += 1) {
    // Salted per slot so the two picks differ from one another, not just
    // between seeds.
    const [pick] = reserves.splice(stableIndex(String(seed), i, reserves.length), 1)
    active.add(pick)
  }
  return active
}

/** Target share of sent invites that come back. */
const RESPONSE_RATE = 0.39

function isoDaysBefore(days: number) {
  return new Date(DEMO_NOW.getTime() - days * 86_400_000).toISOString()
}

/**
 * When someone actually fills the survey in.
 *
 * isoDaysBefore inherits DEMO_NOW's time, so every response used to land at
 * the same hour and any measure of *when* people respond was reading a
 * constant. Derived rather than drawn, so the feedback book's existing
 * figures — NPS, CSAT, response counts — are untouched.
 */
const REPLY_HOURS: Record<SurveyChannel, number[]> = {
  // Read on the phone, answered after work.
  whatsapp: [9, 13, 18, 19, 20, 20, 21, 22],
  sms: [9, 12, 18, 19, 20, 21, 21, 22],
  // Cleared alongside the rest of the inbox.
  email: [8, 9, 10, 11, 15, 20, 21, 22],
  // A rep is on the line, so it happens in working hours.
  call: [10, 11, 12, 14, 15, 16, 17, 18],
  'in-app': [11, 13, 19, 20, 21, 21, 22, 23],
}

function replyHourFor(key: string, salt: number, channel: SurveyChannel) {
  const pool = REPLY_HOURS[channel]
  return pool[stableIndex(key, salt, pool.length)]
}

const PROJECT_NAME = Object.fromEntries(
  PROJECTS.map((p) => [p.id, p.name]),
) as Record<string, string>

/** Channels weighted the way an Indian developer's book actually responds. */
const CHANNELS: SurveyChannel[] = [
  'whatsapp',
  'whatsapp',
  'whatsapp',
  'email',
  'email',
  'sms',
  'call',
]

const WINDOWS = [
  'Tue 10:00-12:00',
  'Wed 18:00-20:00',
  'Thu 19:00-21:00',
  'Sat 11:00-13:00',
  'Sun 17:00-19:00',
]

/** Which WINDOWS entries answer each day-part — weekday evening has two. */
const WINDOWS_BY_DAYPART: Record<string, string[]> = {
  'weekday-day': ['Tue 10:00-12:00'],
  'weekday-evening': ['Wed 18:00-20:00', 'Thu 19:00-21:00'],
  'weekend-day': ['Sat 11:00-13:00'],
  'weekend-evening': ['Sun 17:00-19:00'],
}

/**
 * The channel this lead is actually most reachable on.
 *
 * Reads engagement counts already on the record — whatsappReplies, emailOpens,
 * callsAnswered — rather than drawing from a fixed pool with no relationship
 * to the customer. A lead with no signal at all (genuinely new, all zero)
 * falls back to the pool, since there is nothing yet to predict from.
 */
function channelFor(rng: Rng, lead: Lead): { channel: SurveyChannel; reason: string } {
  const { whatsappReplies, emailOpens, callsAnswered, callsAttempted } = lead.evidence

  const scored: { channel: SurveyChannel; score: number; reason: string }[] = [
    {
      channel: 'whatsapp',
      score: whatsappReplies,
      reason: `Highest engagement on WhatsApp — ${whatsappReplies} repl${whatsappReplies === 1 ? 'y' : 'ies'} logged`,
    },
    {
      channel: 'email',
      score: emailOpens,
      reason: `Highest engagement on email — ${emailOpens} open${emailOpens === 1 ? '' : 's'} logged`,
    },
    {
      channel: 'call',
      score: callsAnswered * 2, // an answered call is a stronger signal than an email open
      reason: `Highest engagement on calls — ${callsAnswered} of ${callsAttempted} answered`,
    },
  ]

  const best = scored.reduce((a, b) => (b.score > a.score ? b : a))
  if (best.score > 0) return { channel: best.channel, reason: best.reason }

  return {
    channel: rng.pick(CHANNELS),
    reason: 'No engagement history on any channel yet — using the book-wide default mix',
  }
}

/**
 * The contact window this lead has actually been reachable in.
 *
 * Buckets the lead's own engagement history by day-part and recommends the
 * bucket where contact has actually landed. Falls back to a channel-shaped
 * default only when there is not enough history to bucket from.
 */
function windowFor(
  rng: Rng,
  channel: SurveyChannel,
  history: Engagement[],
): { window: string; reason: string } {
  if (history.length >= 3) {
    const counts = new Map<string, number>()
    for (const e of history) {
      const part = dayPartOf(e.occurredAt)
      counts.set(part, (counts.get(part) ?? 0) + 1)
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const [bestPart, bestCount] = ranked[0]
    const runnerUp = ranked[1]?.[1] ?? 0

    /*
     * A winner only counts if it actually won. Three contacts spread one per
     * day-part used to elect an arbitrary bucket and report "1 of 3 logged
     * contacts land in this window" — a tie presented as a finding. Requiring
     * a clear plurality means the honest answer, that there is no pattern yet,
     * is the one that gets shown.
     */
    if (bestCount >= 2 && bestCount > runnerUp) {
      const options = WINDOWS_BY_DAYPART[bestPart] ?? WINDOWS
      return {
        window: rng.pick(options),
        reason: `${bestCount} of ${history.length} logged contacts land in this window`,
      }
    }
  }

  // No usable pattern — a channel-shaped default beats a flat guess, and
  // saying which case applies beats implying a prediction was made.
  const defaultPart =
    channel === 'call'
      ? 'weekday-day'
      : channel === 'email'
        ? rng.pick(['weekday-day', 'weekday-evening'])
        : 'weekday-evening'
  return {
    window: rng.pick(WINDOWS_BY_DAYPART[defaultPart] ?? WINDOWS),
    reason:
      history.length >= 3
        ? `No day-part stands out across ${history.length} logged contacts — defaulted to a ${channel}-appropriate window`
        : `Too little contact history to bucket — defaulted to a ${channel}-appropriate window`,
  }
}

/**
 * Which touchpoints a lead has actually reached.
 *
 * A survey about handover sent to someone who has not booked is the exact
 * irrelevance the Dynamic Feedback Journey exists to prevent, so eligibility is
 * derived from the records rather than assigned at random.
 */
function touchpointsFor(
  lead: Lead,
  hasVisit: boolean,
  hasBooking: boolean,
  hasTicket: boolean,
): TouchpointId[] {
  const out: TouchpointId[] = []
  const engagedEnough =
    lead.stage !== 'lead' && lead.stage !== 'closed-lost' && !lead.dnd
  if (engagedEnough) out.push('sales')
  if (hasVisit) out.push('site-visit')
  if (hasBooking) out.push('documentation', 'payment')
  if (lead.stage === 'closed-won') out.push('handover')
  if (hasTicket) out.push('service')
  return out
}

/** Sentiment skews by touchpoint — post-sales is where satisfaction leaks. */
const NEGATIVE_RATE: Record<TouchpointId, number> = {
  sales: 0.14,
  'site-visit': 0.16,
  documentation: 0.34,
  payment: 0.22,
  handover: 0.31,
  service: 0.38,
}

function sentimentFor(rng: Rng, touchpoint: TouchpointId): Sentiment {
  const negative = NEGATIVE_RATE[touchpoint]
  const roll = rng.float()
  if (roll < negative) return 'negative'
  if (roll < negative + 0.26) return 'neutral'
  return 'positive'
}

function npsFor(rng: Rng, sentiment: Sentiment) {
  if (sentiment === 'negative') return rng.int(0, 6)
  if (sentiment === 'neutral') return rng.int(6, 8)
  return rng.int(9, 10)
}

function csatFor(rng: Rng, sentiment: Sentiment) {
  if (sentiment === 'negative') return rng.int(1, 2)
  if (sentiment === 'neutral') return rng.int(3, 3)
  return rng.int(4, 5)
}

function propensityFor(rng: Rng, lead: Lead, fatigue: number) {
  // Recency of contact and demonstrated channel responsiveness do most of the
  // work; fatigue drags it down. Illustrative until validated with client data.
  const recency = Math.max(0, 40 - lead.evidence.daysSinceLastActivity * 1.6)
  const responsiveness = Math.min(
    30,
    lead.evidence.whatsappReplies * 2.5 + lead.evidence.emailOpens * 1.2,
  )
  const answered = Math.min(15, lead.evidence.callsAnswered * 3)
  const base = 18 + recency + responsiveness + answered - fatigue * 9
  return Math.max(4, Math.min(96, Math.round(base + rng.float(-6, 6))))
}

function signalsFor(lead: Lead, touchpoint: TouchpointId, fatigue: number) {
  const out = [
    `Last activity ${lead.evidence.daysSinceLastActivity} day(s) ago`,
    `${lead.evidence.whatsappReplies} WhatsApp repl(ies), ${lead.evidence.emailOpens} email open(s) logged`,
    `Reached the ${touchpoint.replace('-', ' ')} touchpoint at stage "${lead.stage}"`,
  ]
  if (fatigue > 0) out.push(`${fatigue} survey(s) already sent in 90 days`)
  return out
}

/**
 * Why an invite is held back.
 *
 * First rule that applies wins, ordered by how absolute the objection is: a
 * preference beats a complaint, a complaint beats a bill, a bill beats a deal
 * in progress. Every rule reads a real record on the lead, so a held-back row
 * can be defended the same way every other claim in this feature can.
 */
function suppressionFor(input: {
  lead: Lead
  hasOpenTicket: boolean
  hasOverduePayment: boolean
  fatigue: number
}): { label: string; reason: string } | null {
  const { lead, hasOpenTicket, hasOverduePayment, fatigue } = input
  const first = lead.name.split(' ')[0]

  if (lead.dnd) {
    return {
      label: 'Do not contact',
      reason: `${first} is marked Do Not Contact. Outreach is suppressed regardless of predicted response.`,
    }
  }

  if (hasOpenTicket) {
    return {
      label: 'Open complaint',
      reason:
        'An unresolved service ticket is open. Asking for a score before the complaint is closed measures the complaint, not the relationship.',
    }
  }

  if (hasOverduePayment) {
    return {
      label: 'Payment overdue',
      reason:
        'A payment milestone is overdue and collections are in contact. A satisfaction request landing beside a demand letter reads badly.',
    }
  }

  if (lead.stage === 'proposal') {
    return {
      label: 'In negotiation',
      reason:
        'A proposal is live with this customer. A survey competes with the commercial conversation and risks the deal for a data point.',
    }
  }

  if (fatigue >= 3) {
    return {
      label: `${fatigue} sent / 90d`,
      reason: `${fatigue} surveys already sent in the trailing 90 days. A further invite risks fatigue and depresses the response rate for the whole cohort.`,
    }
  }

  // 75 days, not 45. At 45 this rule alone swallowed a third of the book and
  // the optimiser stopped looking like it ever sends anything.
  if (lead.evidence.daysSinceLastActivity > 75) {
    return {
      label: 'No recent contact',
      reason: `No inbound or outbound activity for ${lead.evidence.daysSinceLastActivity} days. A survey is the wrong way to re-open a cold relationship.`,
    }
  }

  if (lead.evidence.emailOpens === 0 && lead.evidence.whatsappReplies === 0) {
    return {
      label: 'Non-responsive',
      reason:
        'No opens or replies on any channel to date. Sending again adds volume without adding representation.',
    }
  }

  return null
}

export interface FeedbackDataset {
  surveyInvites: SurveyInvite[]
  surveyResponses: SurveyResponse[]
  recoveryCases: RecoveryCase[]
}

export function buildFeedback(input: {
  leads: Lead[]
  bookings: Booking[]
  siteVisits: SiteVisit[]
  serviceTickets: ServiceTicket[]
  payments: Payment[]
  engagements: Engagement[]
  seed?: number
}): FeedbackDataset {
  const seed = input.seed ?? FEEDBACK_SEED
  const rng = new Rng(seed)
  const activeProjects = activeProjectsFor(seed)

  const { leads, bookings, siteVisits, serviceTickets, payments, engagements } = input
  const leadsById = new Map(leads.map((l) => [l.id, l]))

  const bookedLeadIds = new Set(bookings.map((b) => b.leadId))
  const visitedLeadIds = new Set(
    siteVisits.filter((v) => v.attended).map((v) => v.leadId),
  )
  const ticketsByLead = new Map<string, ServiceTicket[]>()
  for (const t of serviceTickets) {
    const list = ticketsByLead.get(t.leadId)
    if (list) list.push(t)
    else ticketsByLead.set(t.leadId, [t])
  }
  const projectByLead = new Map(bookings.map((b) => [b.leadId, b.projectId]))

  // Leads carrying an overdue milestone. Asking someone to rate you days after
  // a demand letter is the fastest way to buy a detractor you created.
  const overdueLeadIds = new Set(
    payments.filter((p) => p.status === 'overdue').map((p) => p.leadId),
  )

  const engagementsByLead = new Map<string, Engagement[]>()
  for (const e of engagements) {
    const list = engagementsByLead.get(e.leadId)
    if (list) list.push(e)
    else engagementsByLead.set(e.leadId, [e])
  }

  const surveyInvites: SurveyInvite[] = []
  const surveyResponses: SurveyResponse[] = []

  /*
   * Persona per lead, resolved once.
   *
   * The persona engine already scores every lead; without stamping the winner
   * onto the response, SurveyResponse.personaId stayed undefined forever and
   * the persona half of the brief's "project/persona comparison" had no data
   * behind it. Memoised because a lead can carry several responses and the
   * mapper is a full rule pass over every persona.
   */
  const personaCache = new Map<string, string | undefined>()
  function personaFor(lead: Lead) {
    if (!personaCache.has(lead.id)) {
      personaCache.set(lead.id, mapLeadToPersonas({ lead }).best.personaId)
    }
    return personaCache.get(lead.id)
  }

  /**
   * The unresolved ticket that best explains a detractor score.
   *
   * This is the Service Resolution → Detractor Recovery chain: the platform
   * already flagged the SLA risk, and this is where it finds out whether
   * advocacy actually broke.
   */
  function precedingTicket(leadId: string, respondedAt: string) {
    const list = ticketsByLead.get(leadId)
    if (!list) return undefined
    return list.find(
      (t) => t.status !== 'resolved' && t.openedAt <= respondedAt,
    )
  }

  /* ---- 1. Authored hero cohort ---- */

  const authoredLeadIds = new Set<string>()
  let seq = 0

  FEATURED_INVITES.forEach((invite) => {
    const lead = leadsById.get(invite.leadId)
    if (!lead) return
    authoredLeadIds.add(lead.id)
    surveyInvites.push({
      ...invite,
      id: `inv-f${seq++}`,
      customerName: lead.name,
      journeyStage: lead.stage,
    })
  })

  FEATURED_RESPONSES.forEach((response, i) => {
    const lead = leadsById.get(response.leadId)
    if (!lead) return
    authoredLeadIds.add(lead.id)

    const inviteId = `inv-fr${i}`
    surveyInvites.push({
      id: inviteId,
      leadId: lead.id,
      customerName: lead.name,
      touchpoint: response.touchpoint,
      journeyStage: lead.stage,
      channel: response.channel,
      sentAt: isoDaysBefore(
        Math.round(
          (DEMO_NOW.getTime() - new Date(response.respondedAt).getTime()) /
            86_400_000,
        ) + 2,
      ),
      respondedAt: response.respondedAt,
      status: 'responded',
      responsePropensity: 74,
      fatigueScore: 0,
      recommendedWindow: '-',
      eligible: true,
      signals: ['Authored demo record'],
      featured: true,
    })

    const authoredRespondedAt = atHour(
      response.respondedAt,
      replyHourFor(lead.id, i, response.channel),
    )

    surveyResponses.push({
      ...response,
      respondedAt: authoredRespondedAt,
      id: `res-f${i}`,
      inviteId,
      customerName: lead.name,
      journeyStage: lead.stage,
      projectName: PROJECT_NAME[response.projectId] ?? 'Meridian',
      personaId: response.personaId ?? personaFor(lead),
      npsBand: npsBandFor(response.npsScore),
      sourceTicketId:
        response.sourceTicketId ??
        precedingTicket(lead.id, response.respondedAt)?.id,
    })
  })

  /* ---- 2. Generated volume ---- */

  for (const lead of leads) {
    if (authoredLeadIds.has(lead.id)) continue

    const touchpoints = touchpointsFor(
      lead,
      visitedLeadIds.has(lead.id),
      bookedLeadIds.has(lead.id),
      ticketsByLead.has(lead.id),
    )
    if (touchpoints.length === 0) continue

    /*
     * Skip before the first draw, not inside the touchpoint loop: bailing out
     * mid-sequence would leave the rng half-advanced for this lead and make the
     * rest of the book depend on which leads were filtered.
     */
    const leadProjectId =
      projectByLead.get(lead.id) ?? lead.interestedProjectIds[0] ?? PROJECTS[0].id
    if (!activeProjects.has(leadProjectId)) continue

    // Fatigue is a property of the customer, not of any one invite.
    const fatigue = rng.chance(0.12) ? rng.int(2, 4) : rng.int(0, 1)

    touchpoints.forEach((touchpoint, tIdx) => {
      const id = `inv-${lead.id}-${tIdx}`
      const propensity = propensityFor(rng, lead, fatigue)

      // Predict once per invite: the channel this lead is reachable on, and
      // the window their own history shows them being contactable in. Every
      // branch below reuses the same pair — a suppressed invite gets no
      // window recommendation, but it still gets a real channel.
      const { channel, reason: channelReason } = channelFor(rng, lead)
      const { window, reason: windowReason } = windowFor(
        rng,
        channel,
        engagementsByLead.get(lead.id) ?? [],
      )
      const signals = signalsFor(lead, touchpoint, fatigue)

      // Spans the full six-month trend window. At 120 days the two earliest
      // buckets held no responses and the chart opened on a flat zero line,
      // which reads as broken data rather than as a young feedback programme.
      const daysAgo = rng.int(2, 178)

      // Restraint first. An optimiser that only ever says "send" is a list.
      const suppression = suppressionFor({
        lead,
        hasOpenTicket: (ticketsByLead.get(lead.id) ?? []).some(
          (t) => t.status !== 'resolved',
        ),
        hasOverduePayment: overdueLeadIds.has(lead.id),
        fatigue,
      })

      if (suppression) {
        surveyInvites.push({
          id,
          leadId: lead.id,
          customerName: lead.name,
          touchpoint,
          journeyStage: lead.stage,
          channel,
          status: 'suppressed',
          responsePropensity: propensity,
          fatigueScore: fatigue,
          recommendedWindow: '-',
          eligible: false,
          suppressedLabel: suppression.label,
          suppressedReason: suppression.reason,
          signals,
          channelReason,
          windowReason,
        })
        return
      }

      // A slice stays queued so the optimiser has a live queue to work.
      if (rng.chance(0.08)) {
        surveyInvites.push({
          id,
          leadId: lead.id,
          customerName: lead.name,
          touchpoint,
          journeyStage: lead.stage,
          channel,
          status: 'queued',
          responsePropensity: propensity,
          fatigueScore: fatigue,
          recommendedWindow: window,
          eligible: true,
          signals,
          channelReason,
          windowReason,
        })
        return
      }

      const sentAt = isoDaysBefore(daysAgo)
      const responded = rng.chance(RESPONSE_RATE)

      if (!responded) {
        surveyInvites.push({
          id,
          leadId: lead.id,
          customerName: lead.name,
          touchpoint,
          journeyStage: lead.stage,
          channel,
          sentAt,
          status: rng.chance(0.45) ? 'abandoned' : 'expired',
          responsePropensity: propensity,
          fatigueScore: fatigue,
          recommendedWindow: window,
          eligible: true,
          signals,
          channelReason,
          windowReason,
        })
        return
      }

      const respondedAt = atHour(
        isoDaysBefore(Math.max(0, daysAgo - rng.int(1, 3))),
        replyHourFor(lead.id, tIdx, channel),
      )
      const sentiment = sentimentFor(rng, touchpoint)
      const npsScore = npsFor(rng, sentiment)
      const projectId = leadProjectId

      surveyInvites.push({
        id,
        leadId: lead.id,
        customerName: lead.name,
        touchpoint,
        journeyStage: lead.stage,
        channel,
        sentAt,
        respondedAt,
        status: 'responded',
        responsePropensity: propensity,
        fatigueScore: fatigue,
        recommendedWindow: window,
        eligible: true,
        signals,
        channelReason,
        windowReason,
      })

      surveyResponses.push({
        id: `res-${lead.id}-${tIdx}`,
        inviteId: id,
        leadId: lead.id,
        customerName: lead.name,
        touchpoint,
        projectId,
        projectName: PROJECT_NAME[projectId] ?? 'Meridian',
        personaId: personaFor(lead),
        journeyStage: lead.stage,
        npsScore,
        npsBand: npsBandFor(npsScore),
        csatScore: csatFor(rng, sentiment),
        verbatim: rng.pick(VERBATIM_POOLS[touchpoint][sentiment]),
        sentiment,
        channel,
        respondedAt,
        sourceTicketId: precedingTicket(lead.id, respondedAt)?.id,
      })
    })
  }

  /* ---- 3. Recovery cases ---- */

  const recoveryCases = buildRecoveryCases(rng, surveyResponses, leadsById)

  return { surveyInvites, surveyResponses, recoveryCases }
}

/**
 * Seeded recovery history.
 *
 * Enough closed cases to make the SLA view and closure discipline meaningful,
 * and a live open queue. New cases are created by the Recovery Copilot during
 * the demo — after human review — rather than appearing here.
 */
function buildRecoveryCases(
  rng: Rng,
  responses: SurveyResponse[],
  leadsById: Map<string, Lead>,
): RecoveryCase[] {
  const detractors = responses
    .filter((r) => r.npsBand === 'detractor')
    // Worst score first, then the ones with a ticket already breaching.
    .sort((a, b) => {
      if (a.npsScore !== b.npsScore) return a.npsScore - b.npsScore
      return (b.sourceTicketId ? 1 : 0) - (a.sourceTicketId ? 1 : 0)
    })
    .slice(0, 96)

  return detractors.map((response, i) => {
    const lead = leadsById.get(response.leadId)
    const ownerId = lead?.ownerId ?? REPS[0].id
    const ownerName = REPS.find((r) => r.id === ownerId)?.name ?? 'Customer Care'
    const slaDays = response.npsScore <= 2 ? 2 : 5
    const severity: Severity =
      response.npsScore <= 2
        ? 'critical'
        : response.npsScore <= 4
          ? 'high'
          : 'medium'

    /*
     * Status is drawn first and the dates are then made consistent with it.
     * Deriving status from the dates instead pushed almost everything into
     * "escalated", which reads as a broken queue rather than a managed one —
     * the SLA view needs a healthy majority for a breach to mean anything.
     */
    const roll = rng.float()
    const status: RecoveryCase['status'] =
      roll < 0.55
        ? 'closed'
        : roll < 0.79
          ? 'open'
          : roll < 0.92
            ? 'in-progress'
            : 'escalated'

    // Escalated cases are past SLA by construction; the rest are still inside it.
    const openedDaysAgo =
      status === 'escalated'
        ? slaDays + rng.int(2, 14)
        : status === 'closed'
          ? rng.int(slaDays, 45)
          : rng.int(0, slaDays)

    const closedDaysAgo =
      status === 'closed' ? Math.max(0, openedDaysAgo - rng.int(1, slaDays)) : 0

    const timeline = [
      {
        at: isoDaysBefore(openedDaysAgo),
        actor: 'DICE',
        note: `Detractor score ${response.npsScore}/10 detected on the ${response.touchpoint} survey.`,
      },
    ]
    if (status !== 'open') {
      timeline.push({
        at: isoDaysBefore(Math.max(0, openedDaysAgo - 1)),
        actor: ownerName,
        note: 'Case acknowledged and customer contacted.',
      })
    }
    if (status === 'escalated') {
      timeline.push({
        at: isoDaysBefore(Math.max(0, openedDaysAgo - slaDays)),
        actor: 'Customer Care lead',
        note: 'SLA breached with no confirmed resolution. Escalated.',
      })
    }
    if (status === 'closed') {
      timeline.push({
        at: isoDaysBefore(closedDaysAgo),
        actor: ownerName,
        note: 'Resolution confirmed with the customer and case closed.',
      })
    }

    return {
      id: `rec-${i.toString().padStart(4, '0')}`,
      responseId: response.id,
      leadId: response.leadId,
      customerName: response.customerName,
      severity,
      themeId: dominantThemeId(response.verbatim),
      ownerId,
      openedAt: isoDaysBefore(openedDaysAgo),
      slaDueAt: isoDaysBefore(openedDaysAgo - slaDays),
      closedAt: status === 'closed' ? isoDaysBefore(closedDaysAgo) : undefined,
      status,
      recommendedResponse:
        'Acknowledge the delay, name a single owner, and commit to a dated next step in writing.',
      escalationPath: [ownerName, 'Customer Care lead', 'Head of CX'],
      timeline,
      closureEvidence:
        status === 'closed'
          ? 'Customer confirmed resolution on the follow-up call.'
          : undefined,
      sourceTicketId: response.sourceTicketId,
    }
  })
}

/**
 * The theme with the most keyword hits in a verbatim.
 *
 * Same matcher the analyser uses, so a case and the theme it is filed under
 * never disagree — a mismatch between the two is exactly the kind of thing a
 * client notices on stage.
 */
function dominantThemeId(verbatim: string) {
  const text = verbatim.toLowerCase()
  let bestId = THEME_DEFS[0].id
  let bestHits = 0
  for (const def of THEME_DEFS) {
    const hits = def.keywords.filter((k) => text.includes(k)).length
    if (hits > bestHits) {
      bestHits = hits
      bestId = def.id
    }
  }
  return bestHits > 0 ? bestId : ''
}
