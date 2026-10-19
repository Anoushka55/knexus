/**
 * Shared domain types for DICE.
 *
 * The whole app reads its shapes from here — seed data, the simulated CRM,
 * the Zustand stores and every selector.
 */

/* ------------------------------------------------------------------ */
/* Shared enums / unions                                               */
/* ------------------------------------------------------------------ */

/** Ordered — index position drives funnel maths. See STAGE_ORDER. */
export type JourneyStage =
  | 'lead'
  | 'engaged'
  | 'qualified'
  | 'site-visit'
  | 'proposal'
  | 'booking'
  | 'closed-won'
  | 'closed-lost'

export const STAGE_ORDER: JourneyStage[] = [
  'lead',
  'engaged',
  'qualified',
  'site-visit',
  'proposal',
  'booking',
  'closed-won',
]

export type IntentLevel = 'high' | 'medium' | 'low' | 'cold'

export type Sentiment = 'positive' | 'neutral' | 'negative'

export type EngagementChannel =
  | 'call'
  | 'email'
  | 'whatsapp'
  | 'website'
  | 'site-visit'

export type Severity = 'critical' | 'high' | 'medium' | 'info'

export type Trend = 'up' | 'down' | 'flat'

/**
 * What the CRM record claims. The pitch turns on `crmStatus` diverging from
 * `evidenceStatus` — a rep marking "Interested" with nothing to back it up.
 */
export type CrmStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Qualified'
  | 'Site Visit Scheduled'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Booked'
  | 'Closed Won'
  | 'Closed Lost'
  | 'Cold'
  | 'Do Not Contact'

/** What the interaction history actually supports. */
export type EvidenceStatus =
  | 'unverified'
  | 'weak-evidence'
  | 'supported'
  | 'strong-evidence'
  | 'contradicted'

/* ------------------------------------------------------------------ */
/* Core records                                                        */
/* ------------------------------------------------------------------ */

/** Behavioural signals DICE reasons over — the "evidence" half of the story. */
export interface LeadEvidence {
  websiteVisits: number
  brochureViews: number
  emailOpens: number
  callsAnswered: number
  callsAttempted: number
  whatsappReplies: number
  projectsViewed: number
  siteVisitsAttended: number
  /** Days since the last inbound or outbound touch, at DEMO_NOW. */
  daysSinceLastActivity: number
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string

  /** 0–100 DICE lead score. */
  score: number
  intent: IntentLevel
  stage: JourneyStage

  budgetCr: number
  preferredLocation: string
  interestedProjectIds: string[]
  familySize: number

  sourceCampaignId: string
  ownerId: string

  /** The divergence at the heart of the pitch. */
  crmStatus: CrmStatus
  evidenceStatus: EvidenceStatus

  sentiment: Sentiment
  dnd: boolean
  cold: boolean

  evidence: LeadEvidence
  /** Authored evidence summary for featured leads; generated otherwise. */
  evidenceNote?: string

  /** True for the hand-authored profiles with full journeys. */
  featured: boolean
  /**
   * Interaction history has been sanitised and ingested through EAI, so DICE
   * can reason over this record. Kept separate from "has engagement rows" —
   * generated leads carry conversation history for the Engagements view
   * without entering the next-best-action queue.
   */
  ingested?: boolean

  createdAt: string
  lastActivityAt: string
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface Customer {
  id: string
  leadId: string
  name: string
  email: string
  phone: string
  personaId?: string
  budgetCr: number
  preferredLocation: string
  familySize: number
  intent: IntentLevel
  stage: JourneyStage
  occupation: string
  /** Set for the NRI persona — drives the Virtual Selling Assistant scenario. */
  isNri: boolean
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface Persona {
  id: string
  name: string
  /** Compact label for board columns and badges. */
  shortName: string
  description: string
  budgetBand: string
  budgetRangeCr: [number, number]
  typicalFamilySize: string
  motivations: string[]
  objections: string[]
  channels: string[]
  buyingTriggers: string[]
  preferredProjectTypes: string[]
  /** Project ids from PROJECTS. */
  bestFitProjects: string[]
  playbook: string
  /** Validated categorical hue for the persona board. */
  color: string
}

/** One persona scored against a lead, with the evidence behind the score. */
export interface PersonaMatch {
  personaId: string
  /** 0–100, normalised across all personas. */
  confidence: number
  rawScore: number
  signals: string[]
}

export interface PersonaAssignment {
  leadId: string
  best: PersonaMatch
  runnerUp?: PersonaMatch
  all: PersonaMatch[]
}

export interface Engagement {
  id: string
  leadId: string
  channel: EngagementChannel
  direction: 'inbound' | 'outbound'
  sentiment: Sentiment
  subject: string
  summary: string
  /** Minutes, for calls. */
  durationMins?: number
  occurredAt: string
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface SiteVisit {
  id: string
  leadId: string
  projectId: string
  projectName: string
  scheduledAt: string
  attended: boolean
  feedback?: string
  objection?: string
  outcome?: 'booked' | 'considering' | 'dropped' | 'pending'
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface Booking {
  id: string
  leadId: string
  projectId: string
  projectName: string
  unitType: string
  valueCr: number
  bookedAt: string
  closedWon: boolean
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface Payment {
  id: string
  bookingId: string
  leadId: string
  milestone: string
  amountCr: number
  dueAt: string
  paidAt?: string
  status: 'paid' | 'due' | 'overdue'
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface ServiceTicket {
  id: string
  leadId: string
  customerName: string
  subject: string
  category: string
  severity: Severity
  openedAt: string
  slaDueAt: string
  resolvedAt?: string
  status: 'open' | 'in-progress' | 'resolved'
  detail: string
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

/**
 * One physical unit of inventory.
 *
 * Real estate's defining constraint, and the one thing no experience platform
 * models: stock is finite and each item is unique. A CX tool can tell you a
 * segment is unhappy; only a book that holds the unsold units can tell you
 * which flat to offer whom.
 *
 * Sold units are generated from `bookings` rather than alongside them, so the
 * two can never disagree about how much has actually gone.
 */
export interface Unit {
  id: string
  projectId: string
  projectName: string
  tower: string
  unitType: string
  floor: number
  carpetAreaSqft: number
  priceCr: number
  facing: 'East' | 'West' | 'North' | 'South'
  status: 'available' | 'sold'
  /** Set when, and only when, `status` is 'sold'. */
  bookingId?: string
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface Campaign {
  id: string
  name: string
  channel: string
  startedAt: string
  spendLakh: number
}

export interface Project {
  id: string
  name: string
  location: string
  priceRangeCr: [number, number]
  possession: string
  unitTypes: string[]
}

export interface TranscriptLine {
  speaker: 'rep' | 'customer'
  text: string
  /** Seconds from call start — drives the live-transcript playback. */
  atSecond: number
}

export interface Transcript {
  id: string
  leadId: string
  title: string
  scenario: 'dnd' | 'deferred' | 'hot-intent'
  repName: string
  recordedAt: string
  lines: TranscriptLine[]
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface AgentAction {
  id: string
  agentId: string
  leadId?: string
  label: string
  reason: string
  createdAt: string
  status: 'suggested' | 'executed' | 'dismissed'
}

export interface RiskAlert {
  id: string
  severity: Severity
  headline: string
  detail: string
  impactedRevenueCr?: number
  ownerId?: string
  raisedAt: string
  /** Route the alert drills into. */
  href?: string
}

export interface SalesRep {
  id: string
  name: string
  initials: string
  territory: string
}

export interface RepPerformance {
  id: string
  name: string
  initials: string
  leadsOwned: number
  avgResponseHours: number
  followUpBacklog: number
  siteVisitsBooked: number
  conversions: number
  revenueCr: number
}

/* ------------------------------------------------------------------ */
/* Simulated Salesforce objects                                        */
/* ------------------------------------------------------------------ */

export interface SfTask {
  id: string
  subject: string
  whatId: string
  ownerId: string
  dueAt: string
  priority: 'High' | 'Normal' | 'Low'
  status: 'Open' | 'Completed'
  createdBy: 'DICE' | 'Agentforce' | 'Rep'
  createdAt: string
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface SfActivity {
  id: string
  /** Salesforce object the write landed on. */
  object: 'Lead' | 'Contact' | 'Opportunity' | 'Task' | 'Activity'
  recordId: string
  recordName: string
  action: string
  detail: string
  source: 'DICE' | 'Agentforce' | 'Rep' | 'EAI Ingestion'
  /** Field-level before → after, for the "what DICE changed" panels. */
  changes?: { field: string; before: string; after: string }[]
  at: string
}

/**
 * The comparison block the pitch leans on: what native Agentforce sees on a
 * record versus what DICE adds on top.
 */
export interface AgentforceVsDice {
  agentforceView: {
    status: string
    lastSyncedAt: string
    gaps: string[]
  }
  diceView: {
    status: string
    evidenceStatus: EvidenceStatus
    score: number
    adds: string[]
  }
}

/* ------------------------------------------------------------------ */
/* CSAT & NPS — customer feedback intelligence                         */
/* ------------------------------------------------------------------ */

/** Standard NPS banding: 9–10 promoter, 7–8 passive, 0–6 detractor. */
export type NpsBand = 'promoter' | 'passive' | 'detractor'

export type SurveyChannel = 'whatsapp' | 'email' | 'sms' | 'call' | 'in-app'

/** The journey moments a survey can be attached to. */
export type TouchpointId =
  | 'sales'
  | 'site-visit'
  | 'documentation'
  | 'payment'
  | 'handover'
  | 'service'

export const TOUCHPOINT_ORDER: TouchpointId[] = [
  'sales',
  'site-visit',
  'documentation',
  'payment',
  'handover',
  'service',
]

export const TOUCHPOINT_LABEL: Record<TouchpointId, string> = {
  sales: 'Sales',
  'site-visit': 'Site Visit',
  documentation: 'Documentation',
  payment: 'Payment',
  handover: 'Handover',
  service: 'Service',
}

/**
 * A survey the platform decided to send — or decided not to.
 *
 * The Participation Optimizer reasons over these: `responsePropensity` is the
 * prediction, `eligible` + `suppressedReason` is the restraint. A demo has to
 * show both halves, or "optimiser" just means "send more".
 */
export interface SurveyInvite {
  id: string
  leadId: string
  customerName: string
  touchpoint: TouchpointId
  journeyStage: JourneyStage
  channel: SurveyChannel
  /** Undefined until the invite is actually sent — queued invites have none. */
  sentAt?: string
  respondedAt?: string
  status: 'queued' | 'sent' | 'responded' | 'abandoned' | 'expired' | 'suppressed'
  /** 0–100 predicted response likelihood. Illustrative until validated. */
  responsePropensity: number
  /** Surveys already sent to this customer in the trailing 90 days. */
  fatigueScore: number
  /** Recommended send window, e.g. "Tue 10:00–12:00". */
  recommendedWindow: string
  eligible: boolean
  /** Populated when `eligible` is false — why the optimiser held back. */
  suppressedReason?: string
  /** Short chip for the held-back list, e.g. "Payment overdue". */
  suppressedLabel?: string
  /**
   * Why this channel and this window, carried separately from `signals`.
   *
   * The SPAR engine panel shows each decision beside its own evidence. Picking
   * that evidence back out of the signals list by matching on wording meant an
   * authored record — whose signals are hand-written and phrased differently —
   * silently rendered with no evidence at all.
   */
  channelReason?: string
  windowReason?: string
  /** Signals behind the propensity score, shown as evidence. */
  signals: string[]
  featured?: boolean
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

export interface SurveyResponse {
  id: string
  inviteId: string
  leadId: string
  customerName: string
  touchpoint: TouchpointId
  projectId: string
  projectName: string
  personaId?: string
  journeyStage: JourneyStage
  /** 0–10 as collected. */
  npsScore: number
  npsBand: NpsBand
  /** 1–5 for the touchpoint being rated. */
  csatScore: number
  verbatim: string
  sentiment: Sentiment
  channel: SurveyChannel
  respondedAt: string
  /** Ticket that preceded this response, when one did — see the recovery chain. */
  sourceTicketId?: string
  featured?: boolean
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

/** One theme extracted from open text, with the spans that justified it. */
export interface FeedbackTheme {
  id: string
  label: string
  /** Set when this is a sub-theme — drives the theme hierarchy view. */
  parentId?: string
  aspect: string
  sentiment: Sentiment
  /** 0–100. Illustrative until validated. */
  confidence: number
  mentions: number
  responseIds: string[]
  /** Verbatim spans backing the theme — never paraphrased. */
  evidence: string[]
  /** Low-volume but accelerating; the confidence indicator earns its place here. */
  emerging: boolean
  suggestedCrmTag: string
}

/**
 * Related themes grouped against a journey stage.
 *
 * `correlation` is a diagnostic signal requiring business validation, never a
 * causal claim — the UI copy must say so.
 */
export interface RootCauseCluster {
  id: string
  label: string
  themeIds: string[]
  journeyStage: JourneyStage
  touchpoint: TouchpointId
  projectIds: string[]
  /** Times this pattern has recurred across the trailing window. */
  repeatCount: number
  /** -1..1, diagnostic only. */
  correlation: number
  affectedResponses: number
  /** Mean NPS of affected responses minus book mean — negative is drag. */
  npsDrag: number
  evidence: string[]
}

export interface RecoveryCase {
  id: string
  responseId: string
  leadId: string
  customerName: string
  severity: Severity
  themeId: string
  ownerId: string
  openedAt: string
  slaDueAt: string
  closedAt?: string
  status: 'proposed' | 'open' | 'in-progress' | 'closed' | 'escalated'
  /** Drafted for a human to approve — never auto-sent. */
  recommendedResponse: string
  escalationPath: string[]
  timeline: { at: string; actor: string; note: string }[]
  closureEvidence?: string
  /** Set when the detractor signal originated in an SLA-breached ticket. */
  sourceTicketId?: string
  /** Set when this record arrived through a CSV import; names the batch. */
  importedBatchId?: string
}

/** Governed question library backing the Dynamic Feedback Journey composer. */
export interface SurveyQuestion {
  id: string
  text: string
  type: 'nps' | 'csat' | 'open-text' | 'choice'
  /** Standard NPS wording is locked — rendered read-only, never edited. */
  locked: boolean
  touchpoints: TouchpointId[]
  personaIds?: string[]
  journeyStages?: JourneyStage[]
  choices?: string[]
}

export interface Intervention {
  id: string
  title: string
  clusterId: string
  /** Unique per cluster, unlike owner — used to label the matrix. */
  aspect: string
  /** 1–10, both configured rather than inferred. */
  impact: number
  effort: number
  owner: string
  status: 'backlog' | 'planned' | 'in-flight' | 'done'
  slaDueAt?: string
}
