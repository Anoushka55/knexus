/**
 * AI service abstraction.
 *
 * EVERY AI feature in DICE must call through this interface — never a provider
 * SDK directly. A mock implementation ships now so the whole POC runs with zero
 * API keys; the live Anthropic implementation is added later behind the same
 * interface and selected by `getAIService()`.
 */

export type AIMode = 'mock' | 'live'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AICompletionRequest {
  /** Steers the model's role, e.g. "You are a real-estate sales analyst". */
  system?: string
  messages: AIMessage[]
  /** Arbitrary grounding data (lead records, transcripts) the mock also reads. */
  context?: Record<string, unknown>
  maxTokens?: number
  temperature?: number
}

export interface AICompletionResult {
  text: string
  mode: AIMode
  /** Populated in live mode; mock reports zeros. */
  usage?: { inputTokens: number; outputTokens: number }
}

/* ---------------- Typed task results used across the app ---------------- */

export interface AISentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative'
  /** 0..1 */
  confidence: number
  intent: string
  signals: string[]
}

export interface AISummaryResult {
  headline: string
  bullets: string[]
}

export interface AINextBestAction {
  action: string
  reason: string
  /** 0..100 */
  confidence: number
  urgency: 'immediate' | 'today' | 'this-week' | 'scheduled'
}

/** Manager-facing coaching for one rep. */
export interface AICoachingInput {
  name: string
  leadsOwned: number
  openLeads: number
  backlog: number
  stalled: number
  conversionPct: number
  responseHours: number
  revenueCr: number
  overloaded: boolean
}

export interface AICoachingResult {
  /** The single thing to fix first. */
  focus: string
  insight: string
}

/** Outbound message drafting — the Content Generator archetype. */
export interface AIDraftInput {
  channel: 'whatsapp' | 'email' | 'sms'
  customerName: string
  repName: string
  purpose:
    | 'follow-up'
    | 'site-visit'
    | 'payment-plan'
    | 'finance-callback'
    | 'nurture'
    | 'virtual-tour'
  facts: {
    projectName?: string
    budgetCr?: number
    location?: string
    objection?: string
    daysSinceContact?: number
  }
}

export interface AIDraftResult {
  subject?: string
  body: string
  /** Rough character count guidance the UI can show. */
  channel: AIDraftInput['channel']
}

/** One theme the analyser pulled out of a batch of verbatims. */
export interface AIExtractedTheme {
  label: string
  aspect: string
  sentiment: 'positive' | 'neutral' | 'negative'
  /** 0..100 */
  confidence: number
  /** Spans from the source text, never paraphrased. */
  evidence: string[]
}

export interface AIThemeExtraction {
  themes: AIExtractedTheme[]
  summary: string
}

export interface AIRootCauseInput {
  theme: string
  journeyStage: string
  touchpoint: string
  affectedResponses: number
  npsDrag: number
  correlation: number
  evidence: string[]
}

export interface AIRootCauseResult {
  /** Stated as a hypothesis, never as an established cause. */
  hypothesis: string
  correlates: string[]
  /** 0..100 */
  confidence: number
}

export interface AIService {
  readonly mode: AIMode
  /** Free-form completion — the escape hatch every other method builds on. */
  complete(request: AICompletionRequest): Promise<AICompletionResult>
  analyzeSentiment(
    text: string,
    context?: Record<string, unknown>,
  ): Promise<AISentimentResult>
  summarize(
    text: string,
    context?: Record<string, unknown>,
  ): Promise<AISummaryResult>
  recommendNextBestAction(
    context: Record<string, unknown>,
  ): Promise<AINextBestAction>
  /** Rep-level coaching — a different job from lead-level reasoning. */
  coachRep(input: AICoachingInput): Promise<AICoachingResult>
  /** Drafts an outbound message for a rep to send. */
  draftMessage(input: AIDraftInput): Promise<AIDraftResult>
  /** Pulls themes out of a batch of open-text feedback. */
  extractThemes(
    verbatims: string[],
    context?: Record<string, unknown>,
  ): Promise<AIThemeExtraction>
  /** Explains a root-cause cluster as a hypothesis requiring validation. */
  explainRootCause(input: AIRootCauseInput): Promise<AIRootCauseResult>
}
