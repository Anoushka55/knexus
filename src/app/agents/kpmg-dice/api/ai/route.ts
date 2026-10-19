import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

/**
 * Server-side Anthropic proxy.
 *
 * The API key stays on the server — the browser never sees it, and no
 * NEXT_PUBLIC_ variable is involved. If no key is configured the route returns
 * 503 and the client transparently falls back to the mock, so the demo runs
 * end to end with zero configuration.
 */

export const runtime = 'nodejs'

const MODEL = 'claude-opus-5'

/** Every task returns structured JSON except `complete`, which returns prose. */
type Task =
  | 'complete'
  | 'sentiment'
  | 'summary'
  | 'next-best-action'
  | 'coaching'
  | 'draft'
  | 'voc-themes'
  | 'root-cause'

interface TaskSpec {
  system: string
  /** JSON Schema for structured output; omitted for free-form prose. */
  schema?: Record<string, unknown>
}

/** Structured-output schemas require additionalProperties:false and full `required`. */
const TASKS: Record<Task, TaskSpec> = {
  complete: {
    system:
      'You are a real-estate CRM analyst for a Mumbai developer. Answer in two sentences of plain prose. No preamble, no markdown.',
  },

  sentiment: {
    system:
      'You analyse sales conversations for a real-estate developer. Judge the customer sentiment, the underlying intent, and the phrases that justify your reading.',
    schema: {
      type: 'object',
      properties: {
        sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
        confidence: { type: 'number' },
        intent: {
          type: 'string',
          description:
            'Short kebab-case intent, e.g. do-not-contact, deferred-follow-up, payment-enquiry, high-purchase-intent.',
        },
        signals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exact phrases from the text that drove the judgement.',
        },
      },
      required: ['sentiment', 'confidence', 'intent', 'signals'],
      additionalProperties: false,
    },
  },

  summary: {
    system:
      'You summarise sales conversations. The headline states the outcome in one clause; the bullets carry only facts present in the text.',
    schema: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        bullets: { type: 'array', items: { type: 'string' } },
      },
      required: ['headline', 'bullets'],
      additionalProperties: false,
    },
  },

  'next-best-action': {
    system:
      'You recommend the single next best action for a real-estate sales lead. Be specific and time-bound; the reason must cite the evidence given.',
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string' },
        reason: { type: 'string' },
        confidence: { type: 'number' },
        urgency: {
          type: 'string',
          enum: ['immediate', 'today', 'this-week', 'scheduled'],
        },
      },
      required: ['action', 'reason', 'confidence', 'urgency'],
      additionalProperties: false,
    },
  },

  coaching: {
    system:
      'You are a sales director coaching one rep. Name the single biggest constraint on their book and the concrete fix. Ground every claim in the numbers given.',
    schema: {
      type: 'object',
      properties: {
        focus: { type: 'string', description: 'Three or four words.' },
        insight: { type: 'string', description: 'One or two sentences.' },
      },
      required: ['focus', 'insight'],
      additionalProperties: false,
    },
  },

  draft: {
    system:
      'You draft outbound messages for a real-estate sales rep in India. WhatsApp and SMS are short and signed off; email carries a subject line. Lead with the customer’s stated concern. Never invent facts.',
    schema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'Empty string for WhatsApp and SMS.',
        },
        body: { type: 'string' },
      },
      required: ['subject', 'body'],
      additionalProperties: false,
    },
  },

  'voc-themes': {
    system:
      'You analyse open-text customer feedback for a real-estate developer. Group comments into themes by aspect. Every theme must quote spans from the supplied text verbatim — never paraphrase, never invent a quote. Confidence reflects how much text supports the theme.',
    schema: {
      type: 'object',
      properties: {
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              aspect: {
                type: 'string',
                description:
                  'One of Documentation, Service, Handover, Payment, Quality, Sales, Amenities, Allotment.',
              },
              sentiment: {
                type: 'string',
                enum: ['positive', 'neutral', 'negative'],
              },
              confidence: { type: 'number' },
              evidence: {
                type: 'array',
                items: { type: 'string' },
                description: 'Exact spans copied from the supplied text.',
              },
            },
            required: ['label', 'aspect', 'sentiment', 'confidence', 'evidence'],
            additionalProperties: false,
          },
        },
        summary: { type: 'string' },
      },
      required: ['themes', 'summary'],
      additionalProperties: false,
    },
  },

  'root-cause': {
    system:
      'You explain why a group of customers gave low satisfaction scores. State a hypothesis, never a proven cause: the data shows association, not causation. Name what would have to be checked in the business to confirm it.',
    schema: {
      type: 'object',
      properties: {
        hypothesis: {
          type: 'string',
          description: 'One or two sentences, phrased as a hypothesis.',
        },
        correlates: {
          type: 'array',
          items: { type: 'string' },
          description: 'What would need validating before treating this as a cause.',
        },
        confidence: { type: 'number' },
      },
      required: ['hypothesis', 'correlates', 'confidence'],
      additionalProperties: false,
    },
  },
}

interface AiRequest {
  task: Task
  prompt: string
  context?: Record<string, unknown>
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'no-api-key',
        message:
          'ANTHROPIC_API_KEY is not set on the server. DICE is running on the mock AI service.',
      },
      { status: 503 },
    )
  }

  let body: AiRequest
  try {
    body = (await request.json()) as AiRequest
  } catch {
    return NextResponse.json({ error: 'bad-json' }, { status: 400 })
  }

  const spec = TASKS[body.task]
  if (!spec) {
    return NextResponse.json(
      { error: 'unknown-task', message: `Unknown task "${body.task}"` },
      { status: 400 },
    )
  }

  const client = new Anthropic({ apiKey })

  const userContent = body.context
    ? `${body.prompt}\n\nContext:\n${JSON.stringify(body.context, null, 2)}`
    : body.prompt

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4096,
      // Server-side fallback: a policy refusal is re-run on Anthropic's
      // recommended fallback model rather than surfacing as a dead end.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: spec.system,
      output_config: {
        effort: 'low',
        ...(spec.schema
          ? { format: { type: 'json_schema', schema: spec.schema } }
          : {}),
      },
      messages: [{ role: 'user', content: userContent }],
    })

    // Always check stop_reason before reading content — a refusal returns 200
    // with empty or partial content.
    if (response.stop_reason === 'refusal') {
      return NextResponse.json(
        {
          error: 'refusal',
          message: 'The model declined this request.',
          category: response.stop_details?.category ?? null,
        },
        { status: 422 },
      )
    }

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()

    if (!text) {
      return NextResponse.json(
        { error: 'empty-response', message: 'Model returned no text.' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      mode: 'live',
      model: response.model,
      text,
      data: spec.schema ? (JSON.parse(text) as unknown) : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    })
  } catch (error) {
    const status =
      error instanceof Anthropic.APIError ? (error.status ?? 502) : 502
    const message =
      error instanceof Error ? error.message : 'Unknown Anthropic API error'

    return NextResponse.json({ error: 'api-error', message }, { status })
  }
}

/** Probe used by the settings toggle to decide whether Live mode is available. */
export function GET() {
  return NextResponse.json({
    available: Boolean(process.env.ANTHROPIC_API_KEY),
    model: MODEL,
  })
}
