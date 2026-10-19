import { DEMO_NOW } from './reference'
import type {
  NpsBand,
  Sentiment,
  SurveyInvite,
  SurveyQuestion,
  SurveyResponse,
  TouchpointId,
} from '@/lib/kpmg-dice/types'

/**
 * Feedback reference data.
 *
 * Two halves. The authored records are the ones a presenter actually opens,
 * written so the evidence provably supports the conclusion the analyser draws
 * from it. The pools below build volume around them.
 *
 * Authored records follow the FEATURED_PROFILES convention — attached to
 * featured leads by id, so a hero customer carries one story from first touch
 * through to recovery.
 */

function daysBefore(days: number) {
  return new Date(DEMO_NOW.getTime() - days * 86_400_000).toISOString()
}

/** Standard NPS banding. Fixed by the methodology, not a tunable. */
export function npsBandFor(score: number): NpsBand {
  if (score >= 9) return 'promoter'
  if (score >= 7) return 'passive'
  return 'detractor'
}

/* ------------------------------------------------------------------ */
/* Governed question library                                           */
/* ------------------------------------------------------------------ */

/**
 * The approved library the Dynamic Feedback Journey composes from.
 *
 * The two standard NPS questions are `locked` — the composer renders them
 * read-only. Benchmarkability dies the moment the wording drifts, so the AI
 * selects and sequences questions but never rewrites these.
 */
export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q-nps',
    text: 'How likely are you to recommend Meridian Developers to a friend or colleague?',
    type: 'nps',
    locked: true,
    touchpoints: [
      'sales',
      'site-visit',
      'documentation',
      'payment',
      'handover',
      'service',
    ],
  },
  {
    id: 'q-nps-why',
    text: 'What is the primary reason for your score?',
    type: 'open-text',
    locked: true,
    touchpoints: [
      'sales',
      'site-visit',
      'documentation',
      'payment',
      'handover',
      'service',
    ],
  },
  {
    id: 'q-csat-sales',
    text: 'How satisfied were you with the responsiveness of your relationship manager?',
    type: 'csat',
    locked: false,
    touchpoints: ['sales'],
  },
  {
    id: 'q-csat-visit',
    text: 'How satisfied were you with the site visit experience?',
    type: 'csat',
    locked: false,
    touchpoints: ['site-visit'],
  },
  {
    id: 'q-csat-doc',
    text: 'How satisfied were you with the clarity of the documentation process?',
    type: 'csat',
    locked: false,
    touchpoints: ['documentation'],
  },
  {
    id: 'q-csat-payment',
    text: 'How satisfied were you with the clarity of your payment schedule?',
    type: 'csat',
    locked: false,
    touchpoints: ['payment'],
  },
  {
    id: 'q-csat-handover',
    text: 'How satisfied were you with the handover process?',
    type: 'csat',
    locked: false,
    touchpoints: ['handover'],
  },
  {
    id: 'q-csat-service',
    text: 'How satisfied were you with how your request was resolved?',
    type: 'csat',
    locked: false,
    touchpoints: ['service'],
  },
  {
    id: 'q-doc-blocker',
    text: 'Which part of the documentation process took longest?',
    type: 'choice',
    locked: false,
    touchpoints: ['documentation'],
    choices: [
      'Registration slot',
      'Agreement draft',
      'Loan paperwork',
      'Stamp duty',
      'Nothing delayed me',
    ],
  },
  {
    id: 'q-visit-decider',
    text: 'What would most influence your decision from here?',
    type: 'choice',
    locked: false,
    touchpoints: ['site-visit'],
    journeyStages: ['site-visit', 'proposal'],
    choices: ['Price', 'Possession date', 'Layout', 'Location', 'Amenities'],
  },
  {
    id: 'q-nri-channel',
    text: 'What time zone and channel suit you best for a follow-up?',
    type: 'open-text',
    locked: false,
    touchpoints: ['sales', 'site-visit'],
    personaIds: ['persona-nri'],
  },
  {
    id: 'q-handover-snag',
    text: 'Were any snags outstanding at handover?',
    type: 'open-text',
    locked: false,
    touchpoints: ['handover'],
  },
]

/* ------------------------------------------------------------------ */
/* Theme taxonomy                                                      */
/* ------------------------------------------------------------------ */

/**
 * Theme definitions with the keywords that identify them.
 *
 * Extraction is deterministic keyword matching, not an AI call — the same run
 * produces the same themes every time, which is what makes a live demo safe.
 * The AI service layers narrative on top, exactly as the agent registry does
 * with its rule passes.
 */
export interface ThemeDef {
  id: string
  label: string
  parentId?: string
  aspect: string
  keywords: string[]
  /**
   * Phrases that veto a match even when a keyword is present.
   *
   * Topic words appear in praise as often as in complaint — "without me having
   * to chase" is a compliment that contains "chase". Without this, positive
   * verbatims get filed under the problem they are the absence of.
   */
  excludes?: string[]
  suggestedCrmTag: string
  /** The low-volume theme the confidence indicator exists to qualify. */
  emerging?: boolean
}

/**
 * Labels name the *aspect*, not a verdict.
 *
 * An earlier pass labelled these as problems ("Documentation delay") while
 * matching on topic words ("documentation"), so praise for smooth paperwork was
 * filed under a delay theme. Aspect-neutral labels plus per-response sentiment
 * is also what the brief asks for: classify sentiment by aspect.
 */
export const THEME_DEFS: ThemeDef[] = [
  {
    id: 'thm-documentation',
    label: 'Documentation and registration',
    aspect: 'Documentation',
    keywords: [
      'registration',
      'documentation',
      'paperwork',
      'agreement',
      'stamp duty',
    ],
    suggestedCrmTag: 'CX::Documentation',
  },
  {
    id: 'thm-ownership',
    label: 'Request ownership and follow-through',
    parentId: 'thm-documentation',
    aspect: 'Service',
    keywords: [
      'nobody owns',
      'no owner',
      'someone different',
      'have to chase',
      'had to chase',
      'chased',
      'no one owns',
      'still open with no',
      'two reminders',
      'few reminders',
    ],
    excludes: [
      'without me having to chase',
      'without having to chase',
      'no chase needed',
    ],
    suggestedCrmTag: 'CX::Ownership-Gap',
  },
  {
    id: 'thm-handover',
    label: 'Handover and possession timeline',
    aspect: 'Handover',
    keywords: ['possession', 'handover', 'date keeps'],
    suggestedCrmTag: 'CX::Handover-Timeline',
  },
  {
    id: 'thm-payment',
    label: 'Payment statements and receipts',
    aspect: 'Payment',
    keywords: [
      'statement',
      'receipt',
      'ledger',
      'demand letter',
      'instalment',
      'reconcile',
    ],
    suggestedCrmTag: 'CX::Payment-Clarity',
  },
  {
    id: 'thm-quality',
    label: 'Finish and snag quality',
    aspect: 'Quality',
    keywords: ['snag', 'finish', 'workmanship', 'fittings'],
    suggestedCrmTag: 'CX::Snag-Quality',
  },
  {
    id: 'thm-sales',
    label: 'Sales responsiveness',
    aspect: 'Sales',
    keywords: [
      'responsive',
      'helpful',
      'patient',
      'answered every',
      'kept me informed',
      'relationship manager',
    ],
    suggestedCrmTag: 'CX::Sales-Responsiveness',
  },
  {
    id: 'thm-amenities',
    label: 'Amenities access',
    aspect: 'Amenities',
    keywords: ['clubhouse', 'gym', 'amenities', 'access card', 'membership'],
    suggestedCrmTag: 'CX::Amenities-Access',
  },
  {
    id: 'thm-parking',
    label: 'Parking allotment clarity',
    aspect: 'Allotment',
    keywords: ['parking', 'car park', 'allotment letter', 'parking slot'],
    suggestedCrmTag: 'CX::Parking-Allotment',
    emerging: true,
  },
]

export const THEME_DEFS_BY_ID = Object.fromEntries(
  THEME_DEFS.map((t) => [t.id, t]),
) as Record<string, ThemeDef>

/* ------------------------------------------------------------------ */
/* Authored hero cohort                                                */
/* ------------------------------------------------------------------ */

/** Fields resolved from the featured lead at build time are omitted here. */
export type FeaturedInvite = Omit<
  SurveyInvite,
  'id' | 'customerName' | 'journeyStage'
>

export type FeaturedResponse = Omit<
  SurveyResponse,
  'id' | 'inviteId' | 'customerName' | 'journeyStage' | 'projectName' | 'npsBand'
>

/**
 * The invites hero 1 turns on.
 *
 * Both halves matter. An optimiser that only ever says "send" is a mailing
 * list; the suppressed invite is what makes it a decision.
 */
export const FEATURED_INVITES: FeaturedInvite[] = [
  {
    leadId: 'MRD-79291', // Priya Shah — the platform hero record
    touchpoint: 'site-visit',
    channel: 'whatsapp',
    status: 'queued',
    responsePropensity: 87,
    fatigueScore: 0,
    recommendedWindow: 'Thu 19:00-21:00',
    eligible: true,
    channelReason:
      'Replies on WhatsApp within 40 minutes on average, across 11 replies',
    windowReason: 'Evening contact answered on 4 of 4 previous attempts',
    signals: [
      'Attended a site visit 2 days ago, so recall is still fresh',
      'Replies on WhatsApp within 40 minutes on average across 11 replies',
      'No survey sent in the trailing 90 days',
      'Evening contact answered on 4 of 4 previous attempts',
    ],
    featured: true,
  },
  {
    leadId: 'MRD-79402', // Neha Iyer — deliberately held back
    touchpoint: 'sales',
    channel: 'email',
    status: 'suppressed',
    responsePropensity: 31,
    fatigueScore: 3,
    recommendedWindow: '-',
    eligible: false,
    suppressedLabel: '3 sent / 90d',
    suppressedReason:
      'Three surveys already sent in the trailing 90 days. A fourth risks fatigue and depresses the response rate for the whole cohort.',
    signals: [
      '3 surveys sent in 90 days, 1 completed',
      'Last two invites abandoned after the first question',
      'Active proposal negotiation, so a survey competes with a commercial conversation',
    ],
    featured: true,
  },
]

/**
 * The authored responses.
 *
 * Ritu Sen carries heroes 2 and 3 end to end. She is already booked with an
 * SLA-breaching documentation ticket in FEATURED_PROFILES, so her detractor
 * score has a cause that predates this module entirely. Her verbatim is written
 * to decompose into exactly two themes — registration delay as the dominant
 * driver, ownership as the secondary — so the analyser's output can be checked
 * against the text live, in front of the client.
 */
export const FEATURED_RESPONSES: FeaturedResponse[] = [
  {
    leadId: 'MRD-79603', // Ritu Sen — the NPS 4 detractor
    touchpoint: 'documentation',
    projectId: 'prj-serein',
    npsScore: 4,
    csatScore: 2,
    verbatim:
      'The sales process was genuinely good and the unit is everything we wanted. But I have now chased the registration appointment three times over two weeks and still have no date. Every time I call I speak to someone different and have to explain it again, so nobody owns this. That is the only reason for my score.',
    sentiment: 'negative',
    channel: 'whatsapp',
    respondedAt: daysBefore(4),
    featured: true,
  },
  {
    leadId: 'MRD-79540', // Sanya Kapoor — the promoter
    touchpoint: 'sales',
    projectId: 'prj-eureka-park',
    npsScore: 9,
    csatScore: 5,
    verbatim:
      'Siddharth has been extremely responsive across time zones and answered every question about the payment schedule without me having to chase. Being overseas, that mattered more than anything else.',
    sentiment: 'positive',
    channel: 'email',
    respondedAt: daysBefore(9),
    featured: true,
  },

  /* Three mentions of one new issue — low n, low confidence, on purpose. */
  {
    leadId: 'MRD-79318', // Rohit Mehta
    touchpoint: 'documentation',
    projectId: 'prj-dream-acres',
    npsScore: 7,
    csatScore: 3,
    verbatim:
      'Mostly smooth, but the allotment letter shows one parking slot when we were told two at booking. Still waiting on clarity.',
    sentiment: 'neutral',
    channel: 'email',
    respondedAt: daysBefore(11),
    featured: true,
  },
  {
    leadId: 'MRD-79455', // Arjun Nair
    touchpoint: 'sales',
    projectId: 'prj-royal-pavilion',
    npsScore: 6,
    csatScore: 3,
    verbatim:
      'Reasonable experience overall. The parking allotment terms were not explained clearly before I signed.',
    sentiment: 'neutral',
    channel: 'sms',
    respondedAt: daysBefore(7),
    featured: true,
  },
  {
    leadId: 'MRD-79641', // Aditya Ranade
    touchpoint: 'site-visit',
    projectId: 'prj-royal-pavilion',
    npsScore: 6,
    csatScore: 3,
    verbatim:
      'Good project. I asked twice about the car park allocation for a second vehicle and did not get a straight answer.',
    sentiment: 'neutral',
    channel: 'call',
    respondedAt: daysBefore(3),
    featured: true,
  },
]

/* ------------------------------------------------------------------ */
/* Generated verbatim pools                                            */
/* ------------------------------------------------------------------ */

/**
 * Pools the generator draws from for the non-authored responses.
 *
 * Every entry is written to match at least one theme's keywords. A verbatim
 * that matches nothing produces a response the analyser cannot explain, which
 * reads as a bug on stage rather than as a gap in the data.
 */
export const VERBATIM_POOLS: Record<TouchpointId, Record<Sentiment, string[]>> =
  {
    sales: {
      positive: [
        'The relationship manager was responsive and kept me informed at every step.',
        'Helpful and patient through a long decision, and answered every question I had.',
        'Very responsive team, and the follow-ups were useful rather than pushy.',
      ],
      neutral: [
        'Reasonable process. Nothing stood out either way.',
        'Fine overall, though I did have to follow up more than once.',
      ],
      negative: [
        'Had to chase for a callback more than once, and no owner was ever assigned.',
        'I was told two different things about pricing and had to chase to resolve it.',
      ],
    },
    'site-visit': {
      positive: [
        'The site visit was well organised and the sample flat finish was excellent.',
        'Good visit, and the team was helpful about the possession timeline.',
      ],
      neutral: [
        'Visit was fine. Would have liked to see a higher floor.',
        'Useful visit, though the possession date was still vague.',
      ],
      negative: [
        'Nobody was expecting us at the site and we waited forty minutes with no owner in sight.',
        'The sample flat finish was below the quality shown in the brochure.',
      ],
    },
    documentation: {
      positive: [
        'The documentation was explained clearly and the agreement came through quickly.',
        'Registration slot was confirmed within a week with no chase needed.',
      ],
      neutral: [
        'Paperwork was manageable but the stamp duty explanation could be clearer.',
        'Mostly smooth, though the parking slot on the allotment letter needed correcting.',
      ],
      negative: [
        'I have chased the registration appointment repeatedly and still have no date.',
        'The agreement draft came back with errors twice and nobody owns the correction.',
        'Documentation has been the weakest part, and I always have to follow up.',
      ],
    },
    payment: {
      positive: [
        'The payment schedule was clear and every receipt arrived on time.',
        'Demand letters were well timed and the statement was easy to reconcile.',
      ],
      neutral: [
        'Payments worked, though the statement format is hard to read.',
        'Instalment reminders arrive late but the amounts are correct.',
      ],
      negative: [
        'My last receipt never arrived and the ledger statement does not reconcile.',
        'Received a demand letter for an instalment I had already paid.',
      ],
    },
    handover: {
      positive: [
        'Handover was on schedule and the snag list was closed before we moved in.',
        'Possession happened on the promised date with no surprises.',
      ],
      neutral: [
        'Handover happened but a few snags are still open.',
        'Possession date moved once, then held.',
      ],
      negative: [
        'The possession date keeps moving and nobody will commit to a timeline.',
        'We took handover with the snag list still open and the finish below standard.',
      ],
    },
    service: {
      positive: [
        'The request was resolved the same week and someone followed up to confirm.',
        'Clubhouse access was activated quickly once I raised it.',
      ],
      neutral: [
        'Ticket was resolved eventually, though it took a few reminders.',
        'Amenities access came through after a delay.',
      ],
      negative: [
        'Raised a request three weeks ago and it is still open with no owner.',
        'The gym membership was never activated despite two reminders.',
      ],
    },
  }

/**
 * Follow-ups fire on the answer, not on the customer — that is the point.
 *
 * Lives in the data layer because two screens ask the same question of it: the
 * journey composer shows the whole branch set, and the SPAR engine panel shows
 * the one branch a given score band would take.
 */
export const CONDITIONAL_FOLLOW_UPS: {
  band: NpsBand
  when: string
  ask: string
}[] = [
  {
    band: 'detractor',
    when: 'Score 0-6 (detractor)',
    ask: 'What one thing would have made this better? A recovery case is opened for review.',
  },
  {
    band: 'passive',
    when: 'Score 7-8 (passive)',
    ask: 'What would have made this a 9 or 10?',
  },
  {
    band: 'promoter',
    when: 'Score 9-10 (promoter)',
    ask: 'Would you be willing to refer a friend or colleague?',
  },
]
