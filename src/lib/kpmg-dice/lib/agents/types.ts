import type { SeedCampaign } from '@/lib/kpmg-dice/data/reference'
import type { AIService } from '@/lib/kpmg-dice/lib/ai'
import type {
  Booking,
  FeedbackTheme,
  RecoveryCase,
  RootCauseCluster,
  Engagement,
  Lead,
  Payment,
  ServiceTicket,
  Severity,
  SfActivity,
  SfTask,
  SiteVisit,
  SurveyInvite,
  SurveyResponse,
} from '@/lib/kpmg-dice/types'

/**
 * KPMG AI archetype framework. Every agent declares which archetype it is an
 * instance of, which is how the gallery groups them and how the platform page
 * maps capability to business value.
 */
export type AgentArchetype =
  | 'pattern-identifier'
  | 'predictive-algorithm'
  | 'content-generator'
  | 'information-extractor'
  | 'digital-assistant'
  | 'language-translator'
  | 'code-generator'

export type AgentPriority = 'High' | 'Medium' | 'Low'

export const ARCHETYPE_META: Record<
  AgentArchetype,
  { label: string; blurb: string; priority: AgentPriority; accent: string }
> = {
  'pattern-identifier': {
    label: 'Pattern Identifiers',
    blurb: 'Spot signals and anomalies across large volumes of interactions.',
    priority: 'High',
    accent: 'text-kpmg-navy',
  },
  'predictive-algorithm': {
    label: 'Predictive Algorithms',
    blurb: 'Score likelihood and forecast outcomes from historical behaviour.',
    priority: 'High',
    accent: 'text-kpmg-blue',
  },
  'information-extractor': {
    label: 'Information Extractors',
    blurb: 'Pull structured facts out of unstructured conversations.',
    priority: 'High',
    accent: 'text-kpmg-teal',
  },
  'digital-assistant': {
    label: 'Digital Assistants',
    blurb: 'Take the routine follow-through off the team’s plate.',
    priority: 'High',
    accent: 'text-kpmg-violet',
  },
  'content-generator': {
    label: 'Content Generators',
    blurb: 'Draft the outbound message, summary or plan.',
    priority: 'Medium',
    accent: 'text-kpmg-purple',
  },
  'language-translator': {
    label: 'Language Translators',
    blurb: 'Bridge language and channel between customer and team.',
    priority: 'Medium',
    accent: 'text-kpmg-magenta',
  },
  'code-generator': {
    label: 'Code Generators',
    blurb: 'Generate integration and automation logic.',
    priority: 'Low',
    accent: 'text-slate-500',
  },
}

/* ------------------------------------------------------------------ */
/* Everything an agent can see                                         */
/* ------------------------------------------------------------------ */

export interface AgentContext {
  leads: Lead[]
  engagements: Engagement[]
  siteVisits: SiteVisit[]
  bookings: Booking[]
  payments: Payment[]
  serviceTickets: ServiceTicket[]
  tasks: SfTask[]
  campaigns: SeedCampaign[]
  ingestedLeadIds: string[]
  surveyInvites: SurveyInvite[]
  surveyResponses: SurveyResponse[]
  recoveryCases: RecoveryCase[]
  /**
   * Themes and clusters, derived once per context.
   *
   * Extraction walks every verbatim, and several agents need it in both
   * detect and recommend. Recomputing per call meant a "Run all" pass rescanned
   * the whole book about six times.
   */
  feedbackThemes: FeedbackTheme[]
  feedbackClusters: RootCauseCluster[]
  /**
   * What agents earlier in the chain concluded. Empty for a solo run, which is
   * why every agent keeps a fallback to reading raw records — nothing
   * regresses when an agent is run on its own from the gallery.
   */
  priorFindings?: AgentFinding[]
  ai: AIService
}

/* ------------------------------------------------------------------ */
/* What an agent produces                                              */
/* ------------------------------------------------------------------ */

export interface AgentFinding {
  id: string
  /**
   * Which agent concluded this. Stamped by defineAgent rather than by each
   * agent, so it cannot be forgotten. Attribution used to live only on the run
   * result, which meant a pooled view could not say who said what.
   */
  agentId?: string
  /**
   * Set when this conclusion rests on another agent's rather than on raw
   * records. This is what makes a chain a chain instead of a list, and the UI
   * resolves the citation through it at render time — so a handoff that did
   * not happen has nothing to draw.
   */
  citesFindingId?: string
  leadId?: string
  subjectName: string
  headline: string
  detail: string
  severity: Severity
  /**
   * How much weight to put on this conclusion, 0-100.
   *
   * Derived, and deliberately never 100: it reflects how much evidence supports
   * the finding, how serious the agent judged it, and whether another agent
   * independently reached a compatible conclusion about the same customer. It
   * is not a model probability, and the UI says so — presenting a heuristic as
   * a calibrated likelihood would be the dishonest version of this.
   */
  confidence?: number
  /**
   * Whether the customer said this, or the record only implies it.
   *
   * A field rather than careful phrasing, because phrasing depends on whoever
   * writes the headline next and cannot be asserted. `inferred` findings are
   * weighted lower and marked in the UI: a lead who answered a call and was
   * never followed up is a real case, but it is not the same as one who said
   * "call me back".
   */
  signal?: 'stated' | 'inferred'
  /** The specific records/behaviour that justified the finding. */
  evidence: string[]
  impactCr?: number
}

/**
 * A write the agent wants to make against the simulated Salesforce org.
 * Modelled as data rather than a closure so a plan can be inspected, shown in
 * the UI and replayed before anything is committed.
 */
export type CrmWrite =
  | {
      kind: 'flag-lead'
      leadId: string
      flags: Partial<
        Pick<Lead, 'intent' | 'cold' | 'dnd' | 'crmStatus' | 'evidenceStatus'>
      >
      reason: string
    }
  | {
      kind: 'create-task'
      leadId: string
      subject: string
      ownerId: string
      dueInDays: number
      priority: SfTask['priority']
    }
  | {
      kind: 'log-activity'
      object: SfActivity['object']
      recordId: string
      recordName: string
      action: string
      detail: string
    }
  | { kind: 'suppress-campaign'; campaignId: string; reason: string }
  | {
      kind: 'schedule-survey'
      inviteId: string
      leadId: string
      reason: string
    }
  | { kind: 'suppress-survey'; inviteId: string; leadId: string; reason: string }
  | {
      kind: 'create-recovery-case'
      responseId: string
      leadId: string
      ownerId: string
      severity: Severity
      themeId: string
      slaDays: number
      recommendedResponse: string
      sourceTicketId?: string
    }
  | {
      kind: 'tag-feedback'
      responseId: string
      recordName: string
      tag: string
      reason: string
    }
  | { kind: 'ingest-sanitized'; leadIds: string[] }
  | {
      kind: 'update-lead'
      leadId: string
      patch: Partial<Lead>
      action: string
      detail: string
    }

export interface AgentActionPlan {
  id: string
  agentId: string
  findingId: string
  leadId?: string
  label: string
  reason: string
  /** Plain-language description of the CRM effect, shown before executing. */
  crmEffect: string
  write: CrmWrite
  status: 'suggested' | 'executed'
}

/**
 * One committed decision, kept.
 *
 * The platform already argues that agents propose and humans commit, and
 * `detectConflicts` already surfaces the cases where two agents want opposite
 * things — but none of it survived the run that produced it. A demo could show
 * a disagreement and then had nothing to show afterwards.
 *
 * Written at the single point every approved write passes through, so the log
 * cannot fall behind by a call site somebody forgot to update.
 */
export interface DecisionLogEntry {
  id: string
  at: string
  /** Absent for writes committed outside an agent run — a rep acting directly. */
  agentId?: string
  agentName: string
  leadId?: string
  /** What was proposed, in the agent's own words. */
  label: string
  /** The plain-language CRM effect shown before the human approved it. */
  crmEffect: string
  writeKind: CrmWrite['kind']
  /** What the facade reported back once it landed. */
  result: string
  /** True when another agent wanted the opposite thing for the same customer. */
  contested: boolean
  /** The opposing agent's plan, named — meaningless unless `contested`. */
  contestedWith?: string
}

export interface AgentRunResult {
  agentId: string
  findings: AgentFinding[]
  actions: AgentActionPlan[]
  /** One-line narrative from the AI service. */
  summary: string
  /** Findings beyond those returned, for the "and N more" line. */
  totalFindings: number
  ranAt: string
}

/* ------------------------------------------------------------------ */
/* The agent contract                                                  */
/* ------------------------------------------------------------------ */

export interface Agent {
  id: string
  name: string
  archetype: AgentArchetype
  priority: AgentPriority
  description: string

  /** The four columns the gallery card shows. */
  scenario: string
  currentIssue: string
  aiSolution: string
  crmAction: string

  /**
   * Pure rule pass — no AI call, no awaiting. The Overview widgets read this
   * directly so the dashboard paints instantly; `detect` layers the AI
   * narrative on top of the same rules for the gallery.
   */
  detectSync(ctx: AgentContext): AgentFinding[]

  detect(ctx: AgentContext): Promise<AgentFinding[]>

  recommendAction(
    findings: AgentFinding[],
    ctx: AgentContext,
  ): Promise<AgentActionPlan[]>
}
