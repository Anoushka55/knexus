import { MockAIService } from './mock-ai-service'
import type {
  AICoachingInput,
  AICoachingResult,
  AICompletionRequest,
  AICompletionResult,
  AIDraftInput,
  AIRootCauseInput,
  AIRootCauseResult,
  AIDraftResult,
  AINextBestAction,
  AIService,
  AISentimentResult,
  AISummaryResult,
  AIThemeExtraction,
} from './types'

/**
 * Live Anthropic implementation.
 *
 * Calls the server route at /api/ai, which holds the API key — nothing secret
 * reaches the browser. Every method falls back to the mock on any failure
 * (missing key, network, refusal), so a live demo degrades to the mock instead
 * of breaking mid-presentation.
 */
export class LiveAIService implements AIService {
  readonly mode = 'live' as const

  /** Shared fallback so behaviour is identical to pure-mock mode. */
  private readonly fallback = new MockAIService()

  private async call<T>(
    task: string,
    prompt: string,
    context?: Record<string, unknown>,
  ): Promise<{ text: string; data?: T } | null> {
    try {
      const response = await fetch('/agents/kpmg-dice/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task, prompt, context }),
      })

      if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as {
          message?: string
        } | null
        console.warn(
          `[DICE] Live AI unavailable (${response.status}): ${detail?.message ?? 'no detail'} — using mock for this call.`,
        )
        return null
      }

      return (await response.json()) as { text: string; data?: T }
    } catch (error) {
      console.warn('[DICE] Live AI request failed — using mock:', error)
      return null
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const prompt = request.messages.map((m) => m.content).join('\n')
    const result = await this.call<never>('complete', prompt, request.context)

    if (!result) return this.fallback.complete(request)
    return { text: result.text, mode: 'live' }
  }

  async analyzeSentiment(
    text: string,
    context?: Record<string, unknown>,
  ): Promise<AISentimentResult> {
    const result = await this.call<AISentimentResult>(
      'sentiment',
      `Analyse this conversation text:\n\n${text}`,
      context,
    )

    if (!result?.data) return this.fallback.analyzeSentiment(text, context)
    return result.data
  }

  async summarize(
    text: string,
    context?: Record<string, unknown>,
  ): Promise<AISummaryResult> {
    const result = await this.call<AISummaryResult>(
      'summary',
      `Summarise this conversation:\n\n${text}`,
      context,
    )

    if (!result?.data) return this.fallback.summarize(text, context)
    return result.data
  }

  async recommendNextBestAction(
    context: Record<string, unknown>,
  ): Promise<AINextBestAction> {
    const result = await this.call<AINextBestAction>(
      'next-best-action',
      'Recommend the next best action for this lead.',
      context,
    )

    if (!result?.data) return this.fallback.recommendNextBestAction(context)
    return result.data
  }

  async coachRep(input: AICoachingInput): Promise<AICoachingResult> {
    const result = await this.call<AICoachingResult>(
      'coaching',
      `Coach this sales rep on their current book.`,
      input as unknown as Record<string, unknown>,
    )

    if (!result?.data) return this.fallback.coachRep(input)
    return result.data
  }

  async draftMessage(input: AIDraftInput): Promise<AIDraftResult> {
    const result = await this.call<{ subject: string; body: string }>(
      'draft',
      `Draft a ${input.channel} message to ${input.customerName} for the purpose "${input.purpose}", signed by ${input.repName} of Meridian Developers.`,
      input as unknown as Record<string, unknown>,
    )

    if (!result?.data) return this.fallback.draftMessage(input)
    return {
      subject: result.data.subject || undefined,
      body: result.data.body,
      channel: input.channel,
    }
  }

  async extractThemes(
    verbatims: string[],
    context?: Record<string, unknown>,
  ): Promise<AIThemeExtraction> {
    const result = await this.call<AIThemeExtraction>(
      'voc-themes',
      `Group these ${verbatims.length} customer comments into themes by aspect. Quote spans verbatim.`,
      { ...context, verbatims },
    )

    if (!result?.data) return this.fallback.extractThemes(verbatims, context)
    return result.data
  }

  async explainRootCause(input: AIRootCauseInput): Promise<AIRootCauseResult> {
    const result = await this.call<AIRootCauseResult>(
      'root-cause',
      `Explain why customers raising "${input.theme}" at the ${input.journeyStage} stage score lower. State a hypothesis, not a cause.`,
      input as unknown as Record<string, unknown>,
    )

    if (!result?.data) return this.fallback.explainRootCause(input)
    return result.data
  }
}
