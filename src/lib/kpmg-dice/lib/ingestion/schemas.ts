/**
 * What each of the twelve record types looks like as CSV.
 *
 * One table, used for three jobs that must agree: recognising which file is
 * which, coercing string cells back into typed fields, and knowing what a row
 * references. Splitting these across three definitions is how a column quietly
 * ends up parsed one way and validated another.
 *
 * The field lists mirror the interfaces in `@/types` and the flattening the
 * exporter applies — nested objects as dotted names, string arrays joined with
 * a semicolon, arrays of objects as JSON in one cell.
 */

export type RecordType =
  | 'leads'
  | 'customers'
  | 'engagements'
  | 'siteVisits'
  | 'bookings'
  | 'payments'
  | 'serviceTickets'
  | 'transcripts'
  | 'tasks'
  | 'surveyInvites'
  | 'surveyResponses'
  | 'recoveryCases'
  // The reference sets. They describe the platform rather than its records, so
  // they merge first and nothing validates a foreign key against them.
  | 'projects'
  | 'reps'
  | 'campaigns'
  | 'personas'
  | 'themes'
  | 'microMarkets'

export type FieldType = 'string' | 'number' | 'boolean' | 'string[]' | 'json'

export interface FieldSpec {
  name: string
  type: FieldType
  optional?: boolean
}

export interface RecordSchema {
  type: RecordType
  label: string
  fields: FieldSpec[]
  /**
   * Headers that identify this shape. Deliberately the distinctive ones, not
   * every field — `id` and `leadId` are shared by almost everything and would
   * make every schema look like every other.
   */
  signature: string[]
  /** Foreign keys checked before a row is accepted. */
  refs: { field: string; to: RecordType }[]
  /** Types that must be merged before this one. */
  dependsOn: RecordType[]
}

const s = (name: string, optional = false): FieldSpec => ({ name, type: 'string', optional })
const n = (name: string, optional = false): FieldSpec => ({ name, type: 'number', optional })
const b = (name: string, optional = false): FieldSpec => ({ name, type: 'boolean', optional })
const sa = (name: string, optional = false): FieldSpec => ({ name, type: 'string[]', optional })
const j = (name: string, optional = false): FieldSpec => ({ name, type: 'json', optional })

/** The nine evidence counters, exported as dotted columns. */
const EVIDENCE = [
  'websiteVisits',
  'brochureViews',
  'emailOpens',
  'callsAnswered',
  'callsAttempted',
  'whatsappReplies',
  'projectsViewed',
  'siteVisitsAttended',
  'daysSinceLastActivity',
].map((k) => n(`evidence.${k}`))

export const SCHEMAS: Record<RecordType, RecordSchema> = {
  leads: {
    type: 'leads',
    label: 'Leads',
    signature: ['crmStatus', 'evidenceStatus', 'evidence.websiteVisits', 'score'],
    refs: [],
    dependsOn: [],
    fields: [
      s('id'), s('name'), s('email'), s('phone'),
      n('score'), s('intent'), s('stage'),
      n('budgetCr'), s('preferredLocation'), sa('interestedProjectIds'), n('familySize'),
      s('sourceCampaignId'), s('ownerId'),
      s('crmStatus'), s('evidenceStatus'), s('sentiment'),
      b('dnd'), b('cold'), b('featured'),
      s('evidenceNote', true),
      ...EVIDENCE,
      s('createdAt'), s('lastActivityAt'), b('ingested', true),
    ],
  },

  customers: {
    type: 'customers',
    label: 'Customers',
    // Both are Customer-only and always present. personaId would have been
    // distinctive too, but it is optional and no seeded row carries one, so the
    // column is absent from the export entirely.
    signature: ['occupation', 'isNri'],
    refs: [{ field: 'leadId', to: 'leads' }],
    dependsOn: ['leads'],
    fields: [
      s('id'), s('leadId'), s('name'), s('email'), s('phone'),
      s('personaId', true), n('budgetCr'), s('preferredLocation'), n('familySize'),
      s('intent'), s('stage'), s('occupation'), b('isNri'),
    ],
  },

  engagements: {
    type: 'engagements',
    label: 'Engagements',
    signature: ['channel', 'direction', 'summary', 'occurredAt'],
    refs: [{ field: 'leadId', to: 'leads' }],
    dependsOn: ['leads'],
    fields: [
      s('id'), s('leadId'), s('channel'), s('direction'), s('sentiment'),
      s('subject'), s('summary'), n('durationMins', true), s('occurredAt'),
    ],
  },

  siteVisits: {
    type: 'siteVisits',
    label: 'Site visits',
    signature: ['scheduledAt', 'attended', 'objection'],
    refs: [{ field: 'leadId', to: 'leads' }],
    dependsOn: ['leads'],
    fields: [
      s('id'), s('leadId'), s('projectId'), s('projectName'),
      s('scheduledAt'), b('attended'),
      s('feedback', true), s('objection', true), s('outcome', true),
    ],
  },

  bookings: {
    type: 'bookings',
    label: 'Bookings',
    signature: ['unitType', 'valueCr', 'bookedAt', 'closedWon'],
    refs: [{ field: 'leadId', to: 'leads' }],
    dependsOn: ['leads'],
    fields: [
      s('id'), s('leadId'), s('projectId'), s('projectName'),
      s('unitType'), n('valueCr'), s('bookedAt'), b('closedWon'),
    ],
  },

  payments: {
    type: 'payments',
    label: 'Payments',
    signature: ['bookingId', 'milestone', 'amountCr', 'dueAt'],
    refs: [
      { field: 'leadId', to: 'leads' },
      { field: 'bookingId', to: 'bookings' },
    ],
    dependsOn: ['leads', 'bookings'],
    fields: [
      s('id'), s('bookingId'), s('leadId'), s('milestone'),
      n('amountCr'), s('dueAt'), s('paidAt', true), s('status'),
    ],
  },

  serviceTickets: {
    type: 'serviceTickets',
    label: 'Service tickets',
    signature: ['severity', 'openedAt', 'slaDueAt', 'category'],
    refs: [{ field: 'leadId', to: 'leads' }],
    dependsOn: ['leads'],
    fields: [
      s('id'), s('leadId'), s('customerName'), s('subject'), s('category'),
      s('severity'), s('openedAt'), s('slaDueAt'), s('resolvedAt', true),
      s('status'), s('detail'),
    ],
  },

  transcripts: {
    type: 'transcripts',
    label: 'Transcripts',
    signature: ['scenario', 'repName', 'recordedAt', 'lines'],
    refs: [{ field: 'leadId', to: 'leads' }],
    dependsOn: ['leads'],
    fields: [
      s('id'), s('leadId'), s('title'), s('scenario'),
      s('repName'), s('recordedAt'), j('lines'),
    ],
  },

  tasks: {
    type: 'tasks',
    label: 'Tasks',
    signature: ['whatId', 'priority', 'createdBy', 'dueAt'],
    refs: [{ field: 'whatId', to: 'leads' }],
    dependsOn: ['leads'],
    fields: [
      s('id'), s('subject'), s('whatId'), s('ownerId'), s('dueAt'),
      s('priority'), s('status'), s('createdBy'), s('createdAt'),
    ],
  },

  surveyInvites: {
    type: 'surveyInvites',
    label: 'Survey invites',
    signature: ['touchpoint', 'responsePropensity', 'fatigueScore', 'recommendedWindow'],
    refs: [{ field: 'leadId', to: 'leads' }],
    dependsOn: ['leads'],
    fields: [
      s('id'), s('leadId'), s('customerName'), s('touchpoint'), s('journeyStage'),
      s('channel'), s('sentAt', true), s('respondedAt', true), s('status'),
      n('responsePropensity'), n('fatigueScore'), s('recommendedWindow'), b('eligible'),
      s('suppressedReason', true), s('suppressedLabel', true),
      s('channelReason', true), s('windowReason', true),
      sa('signals'), b('featured', true),
    ],
  },

  surveyResponses: {
    type: 'surveyResponses',
    label: 'Survey responses',
    signature: ['npsScore', 'npsBand', 'csatScore', 'verbatim'],
    refs: [
      { field: 'leadId', to: 'leads' },
      { field: 'inviteId', to: 'surveyInvites' },
    ],
    dependsOn: ['leads', 'surveyInvites'],
    fields: [
      s('id'), s('inviteId'), s('leadId'), s('customerName'), s('touchpoint'),
      s('projectId'), s('projectName'), s('personaId', true), s('journeyStage'),
      n('npsScore'), s('npsBand'), n('csatScore'), s('verbatim'),
      s('sentiment'), s('channel'), s('respondedAt'),
      s('sourceTicketId', true), b('featured', true),
    ],
  },

  recoveryCases: {
    type: 'recoveryCases',
    label: 'Recovery cases',
    signature: ['responseId', 'themeId', 'escalationPath', 'recommendedResponse'],
    refs: [
      { field: 'leadId', to: 'leads' },
      { field: 'responseId', to: 'surveyResponses' },
    ],
    dependsOn: ['leads', 'surveyResponses'],
    fields: [
      s('id'), s('responseId'), s('leadId'), s('customerName'), s('severity'),
      s('themeId'), s('ownerId'), s('openedAt'), s('slaDueAt'), s('closedAt', true),
      s('status'), s('recommendedResponse'), sa('escalationPath'), j('timeline'),
      s('closureEvidence', true), s('sourceTicketId', true),
    ],
  },

  /* ---------- reference sets ---------- */

  projects: {
    type: 'projects',
    label: 'Projects',
    signature: ['priceRangeCr', 'possession', 'unitTypes'],
    refs: [],
    dependsOn: [],
    fields: [
      s('id'), s('name'), s('location'),
      sa('priceRangeCr'), s('possession'), sa('unitTypes'),
    ],
  },

  reps: {
    type: 'reps',
    label: 'Sales reps',
    signature: ['initials', 'territory'],
    refs: [],
    dependsOn: [],
    fields: [s('id'), s('name'), s('initials'), s('territory')],
  },

  campaigns: {
    type: 'campaigns',
    label: 'Campaigns',
    signature: ['spendLakh', 'headline', 'targets.leads'],
    refs: [],
    dependsOn: [],
    fields: [
      s('id'), s('name'), s('channel'), s('startedAt'),
      n('spendLakh'), b('headline'),
      n('targets.leads'), n('targets.qualified'), n('targets.siteVisits'),
      n('targets.bookings'), n('targets.closedWon'),
    ],
  },

  personas: {
    type: 'personas',
    label: 'Personas',
    signature: ['motivations', 'objections', 'buyingTriggers', 'playbook'],
    refs: [],
    dependsOn: [],
    fields: [
      s('id'), s('name'), s('shortName'), s('description'),
      s('budgetBand'), sa('budgetRangeCr'), s('typicalFamilySize'),
      sa('motivations'), sa('objections'), sa('channels'), sa('buyingTriggers'),
      sa('preferredProjectTypes'), sa('bestFitProjects'), s('playbook'), s('color'),
    ],
  },

  themes: {
    type: 'themes',
    label: 'Feedback themes',
    signature: ['aspect', 'keywords', 'suggestedCrmTag'],
    refs: [],
    dependsOn: [],
    fields: [
      s('id'), s('label'), s('aspect'), sa('keywords'), s('suggestedCrmTag'),
      s('parentId', true), sa('excludes', true),
    ],
  },

  microMarkets: {
    type: 'microMarkets',
    label: 'Micro-markets',
    // A plain string list in the app; given an id here because every schema
    // assumes one and the upsert keys on it.
    signature: ['marketName'],
    refs: [],
    dependsOn: [],
    fields: [s('id'), s('marketName')],
  },
}

export const RECORD_TYPES = Object.keys(SCHEMAS) as RecordType[]

/** The six sets that describe the platform rather than its records. */
export const REFERENCE_TYPES: RecordType[] = [
  'projects', 'reps', 'campaigns', 'personas', 'themes', 'microMarkets',
]

export const isReferenceType = (t: RecordType) => REFERENCE_TYPES.includes(t)

/**
 * Merge order.
 *
 * A topological sort rather than a hand-written list, so adding a type with a
 * new dependency cannot leave the order quietly wrong.
 */
export function mergeOrder(types: RecordType[]): RecordType[] {
  const wanted = new Set(types)
  const out: RecordType[] = []
  const placed = new Set<RecordType>()

  const visit = (t: RecordType) => {
    if (placed.has(t)) return
    placed.add(t)
    for (const dep of SCHEMAS[t].dependsOn) if (wanted.has(dep)) visit(dep)
    out.push(t)
  }
  // Reference sets first: they name the projects and reps everything else
  // renders through, so anything drawn straight after a merge resolves.
  for (const t of REFERENCE_TYPES) if (wanted.has(t)) visit(t)
  for (const t of RECORD_TYPES) if (wanted.has(t)) visit(t)
  return out
}

/**
 * Which schema a set of headers looks like.
 *
 * Scored on the signature rather than the filename — a renamed file must still
 * import, and a file whose headers match nothing must be reported rather than
 * guessed at.
 */
export function detectType(headers: string[]): {
  type: RecordType | null
  confidence: number
} {
  const present = new Set(headers)
  let best: RecordType | null = null
  let bestScore = 0

  for (const type of RECORD_TYPES) {
    const sig = SCHEMAS[type].signature
    const hits = sig.filter((h) => present.has(h)).length
    const score = hits / sig.length
    if (score > bestScore) {
      bestScore = score
      best = type
    }
  }

  // Half the signature is not recognition, it is a coincidence.
  return bestScore >= 0.75 ? { type: best, confidence: bestScore } : { type: null, confidence: bestScore }
}
