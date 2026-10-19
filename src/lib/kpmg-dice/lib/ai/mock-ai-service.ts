
import type {
  AICoachingInput,
  AICoachingResult,
  AIDraftInput,
  AIRootCauseInput,
  AIRootCauseResult,
  AIDraftResult,
  AICompletionRequest,
  AICompletionResult,
  AINextBestAction,
  AIService,
  AISentimentResult,
  AISummaryResult,
  AIThemeExtraction,
} from './types'
import { ref, themeById } from '@/lib/kpmg-dice/data/active-reference'

/**
 * Deterministic-but-varied mock AI.
 *
 * Outputs are derived from the input text/context (keyword signals + a stable
 * hash) rather than being static strings, so the demo reads as a real model
 * without any network call. Same input always yields the same output, which
 * keeps a live demo repeatable.
 */

function hash(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function pick<T>(items: readonly T[], seed: string): T {
  return items[hash(seed) % items.length]
}

/** Simulated think time so loading states are exercised in the UI. */
function delay(seed: string, min = 220, max = 640) {
  const ms = min + (hash(seed) % (max - min))
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

const NEGATIVE_MARKERS = [
  'not interested',
  "don't call",
  'do not call',
  'stop calling',
  'remove my number',
  'waste of time',
  'too expensive',
  'disappointed',
  'delay',
  'complaint',
]

const POSITIVE_MARKERS = [
  'interested',
  'book',
  'payment plan',
  'possession',
  'site visit',
  'loan',
  'when can i',
  'ready to',
  'looks good',
  'schedule',
]

const DEFER_MARKERS = ['after 15 days', 'next month', 'call me later', 'busy']

function scoreText(text: string) {
  const lower = text.toLowerCase()
  const negatives = NEGATIVE_MARKERS.filter((m) => lower.includes(m))
  const positives = POSITIVE_MARKERS.filter((m) => lower.includes(m))
  const defers = DEFER_MARKERS.filter((m) => lower.includes(m))
  return { lower, negatives, positives, defers }
}

export class MockAIService implements AIService {
  readonly mode = 'mock' as const

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const prompt = request.messages.map((m) => m.content).join('\n')
    await delay(prompt)

    const { positives, negatives, defers } = scoreText(prompt)
    const stance = negatives.length
      ? 'risk'
      : defers.length
        ? 'nurture'
        : positives.length
          ? 'accelerate'
          : 'neutral'

    const openers = {
      risk: [
        'This conversation shows clear disengagement signals.',
        'The customer is signalling they want out of the funnel.',
      ],
      nurture: [
        'The buyer is warm but has asked for time.',
        'Interest is real, timing is the blocker.',
      ],
      accelerate: [
        'Strong buying signals across this interaction.',
        'This lead is showing purchase-ready behaviour.',
      ],
      neutral: [
        'Engagement is steady with no strong directional signal yet.',
        'Not enough evidence to move this lead either way.',
      ],
    } as const

    const closers = {
      risk: 'Recommend suppressing outbound campaigns and routing to a manager review.',
      nurture:
        'Recommend a scheduled follow-up with a value-led touchpoint before the callback date.',
      accelerate:
        'Recommend contacting within the next two hours while intent is peaking.',
      neutral: 'Recommend one qualification touchpoint to establish intent.',
    } as const

    const text = `${pick(openers[stance], prompt)} ${closers[stance]}`

    return { text, mode: this.mode, usage: { inputTokens: 0, outputTokens: 0 } }
  }

  async analyzeSentiment(
    text: string,
    context?: Record<string, unknown>,
  ): Promise<AISentimentResult> {
    await delay(text, 120, 320)
    const { negatives, positives, defers } = scoreText(text)

    if (negatives.length) {
      return {
        sentiment: 'negative',
        confidence: Math.min(0.72 + negatives.length * 0.07, 0.97),
        intent: negatives.some((n) => n.includes('call'))
          ? 'do-not-contact'
          : 'objection',
        signals: negatives,
      }
    }

    if (positives.length > defers.length) {
      return {
        sentiment: 'positive',
        confidence: Math.min(0.64 + positives.length * 0.08, 0.96),
        intent: positives.some((p) => p.includes('payment'))
          ? 'payment-enquiry'
          : 'high-purchase-intent',
        signals: positives,
      }
    }

    if (defers.length) {
      return {
        sentiment: 'neutral',
        confidence: 0.68 + (hash(text) % 12) / 100,
        intent: 'deferred-follow-up',
        signals: defers,
      }
    }

    return {
      sentiment: 'neutral',
      confidence: 0.52 + (hash(text + JSON.stringify(context ?? {})) % 20) / 100,
      intent: 'information-gathering',
      signals: [],
    }
  }

  async summarize(
    text: string,
    context?: Record<string, unknown>,
  ): Promise<AISummaryResult> {
    await delay(text, 180, 480)
    const { negatives, positives, defers } = scoreText(text)

    const headline = negatives.length
      ? 'Customer requested no further contact'
      : defers.length
        ? 'Customer deferred the decision to a later date'
        : positives.length
          ? 'Customer showed strong intent and asked commercial questions'
          : 'Routine engagement with no decisive outcome'

    const bullets: string[] = []
    if (positives.length)
      bullets.push(`Positive signals detected: ${positives.slice(0, 3).join(', ')}`)
    if (defers.length)
      bullets.push(`Timing constraint raised: ${defers.slice(0, 2).join(', ')}`)
    if (negatives.length)
      bullets.push(`Risk language detected: ${negatives.slice(0, 3).join(', ')}`)
    if (context?.projectName)
      bullets.push(`Discussed project: ${String(context.projectName)}`)
    if (!bullets.length)
      bullets.push('No decisive signals captured in this interaction')

    return { headline, bullets }
  }

  async recommendNextBestAction(
    context: Record<string, unknown>,
  ): Promise<AINextBestAction> {
    const seed = JSON.stringify(context)
    await delay(seed, 160, 420)

    const score = Number(context.score ?? 50)
    const dnd = Boolean(context.dnd)

    if (dnd) {
      return {
        action: 'Suppress outreach & confirm DND',
        reason: 'Customer explicitly opted out of contact.',
        confidence: 96,
        urgency: 'immediate',
      }
    }

    if (score >= 85) {
      return {
        action: 'Call within 2 hrs',
        reason:
          'High intent with recent repeat activity — conversion probability peaks inside the first 2 hours.',
        confidence: 91,
        urgency: 'immediate',
      }
    }

    if (score >= 70) {
      return {
        action: 'Schedule Site Visit',
        reason: 'Budget matches inventory and engagement is trending up.',
        confidence: 82,
        urgency: 'today',
      }
    }

    if (score >= 55) {
      return {
        action: 'Send Payment Plan',
        reason: 'Commercial questions raised but no proposal shared yet.',
        confidence: 74,
        urgency: 'this-week',
      }
    }

    return {
      action: 'Nurture via WhatsApp',
      reason: 'Low recent activity — keep warm with a low-friction touchpoint.',
      confidence: 63,
      urgency: 'scheduled',
    }
  }

  /**
   * Coaching is a manager-facing job, not lead reasoning — it picks the single
   * biggest constraint on the rep's book and phrases the fix. Wording varies by
   * rep so five cards do not read identically.
   */
  async coachRep(input: AICoachingInput): Promise<AICoachingResult> {
    const seed = `${input.name}:${input.backlog}:${input.stalled}`
    await delay(seed, 140, 380)

    const stalledShare = input.openLeads
      ? input.stalled / input.openLeads
      : 0

    const first = input.name.split(' ')[0]

    if (input.overloaded) {
      return {
        focus: 'Reduce follow-up backlog',
        insight: pick(
          [
            `${first} is carrying ${input.backlog} overdue follow-ups. Redistribute the lowest-scoring third of the book so the top leads get worked properly.`,
            `Backlog of ${input.backlog} is the binding constraint here — capacity, not capability. Rebalance before adding any new leads to ${first}'s queue.`,
            `At ${input.backlog} open tasks, ${first} cannot service the whole book. Triage by lead score and move the tail to nurture.`,
          ],
          seed,
        ),
      }
    }

    if (stalledShare > 0.4) {
      return {
        focus: 'Re-engage stalled leads',
        insight: pick(
          [
            `${Math.round(stalledShare * 100)}% of ${first}'s open book has gone quiet. A structured re-engagement sequence would recover more than new-lead volume will.`,
            `${first} is opening more than closing — ${input.stalled} stalled leads against ${input.openLeads} open. Focus the week on revival, not acquisition.`,
          ],
          seed,
        ),
      }
    }

    if (input.responseHours > 12) {
      return {
        focus: 'Cut first-response time',
        insight: `First response is averaging ${input.responseHours}h. Getting ${first} under 4h on hot leads is the single highest-yield change available.`,
      }
    }

    if (input.conversionPct < 1.8) {
      return {
        focus: 'Improve qualification',
        insight: `${first} converts at ${input.conversionPct}% on ${input.leadsOwned} leads. The volume is there; tighten qualification so effort concentrates on genuine buyers.`,
      }
    }

    return {
      focus: 'Maintain and scale',
      insight: `${first} is running a healthy book — ₹${input.revenueCr} Cr closed at ${input.conversionPct}% conversion. Worth studying what is working here and porting it to the team.`,
    }
  }

  /**
   * Drafts an outbound message. Tone follows the channel — WhatsApp is short and
   * direct, email carries a subject and structure — and the body is built from
   * the facts on the record rather than a template with slots.
   */
  async draftMessage(input: AIDraftInput): Promise<AIDraftResult> {
    const seed = `${input.customerName}:${input.purpose}:${input.channel}`
    await delay(seed, 200, 520)

    const first = input.customerName.split(' ')[0]
    const { projectName, budgetCr, location, objection, daysSinceContact } =
      input.facts

    const openers = {
      whatsapp: `Hi ${first},`,
      sms: `Hi ${first},`,
      email: `Dear ${first},`,
    } as const

    const bodies: Record<AIDraftInput['purpose'], string> = {
      'follow-up': [
        `just following up on our conversation${projectName ? ` about ${projectName}` : ''}.`,
        objection
          ? ` You had mentioned ${objection.toLowerCase()} as your main concern — I have options that address exactly that.`
          : '',
        daysSinceContact && daysSinceContact > 14
          ? ' I know it has been a few weeks, so no pressure at all.'
          : '',
        ' Would a short call this week work for you?',
      ].join(''),

      'site-visit': [
        `I can arrange a site visit${projectName ? ` at ${projectName}` : ''}${location ? ` in ${location}` : ''} this weekend.`,
        ' Saturday morning slots tend to be quietest, so you get proper time with the sample flat.',
        ' Shall I block one for you and your family?',
      ].join(' '),

      'payment-plan': [
        `sharing the payment plan you asked about${budgetCr ? ` for the ₹${budgetCr} Cr configuration` : ''}.`,
        ' It is a construction-linked schedule, so outflow is spread across milestones rather than upfront.',
        ' Happy to walk you through the numbers on a call.',
      ].join(''),

      'finance-callback': [
        `our finance desk will call you${projectName ? ` regarding ${projectName}` : ''} to go through the payment schedule and home-loan tie-ups.`,
        ' We work with partner banks who can pre-approve within 48 hours.',
        ' Would tomorrow morning suit you?',
      ].join(''),

      nurture: [
        `thought of you — a few new configurations have opened up${location ? ` in ${location}` : ''}${budgetCr ? ` around the ₹${budgetCr} Cr mark` : ''}.`,
        ' No urgency at all, just keeping you posted as things move.',
      ].join(''),

      'virtual-tour': [
        `since travelling for a site visit is difficult right now, I have set up a virtual walkthrough${projectName ? ` of ${projectName}` : ''}.`,
        ' We can do a live video tour at a time that works in your timezone, and I will share the recorded walkthrough as well.',
      ].join(''),
    }

    const closers = {
      whatsapp: `\n\n— ${input.repName}, Meridian Developers`,
      sms: ` — ${input.repName}, Meridian`,
      email: `\n\nBest regards,\n${input.repName}\nMeridian Developers`,
    } as const

    const subjects: Record<AIDraftInput['purpose'], string> = {
      'follow-up': `Following up${projectName ? ` — ${projectName}` : ''}`,
      'site-visit': `Site visit${projectName ? ` at ${projectName}` : ''} this weekend?`,
      'payment-plan': `Payment plan${projectName ? ` — ${projectName}` : ''}`,
      'finance-callback': 'Finance callback & home-loan options',
      nurture: `New configurations${location ? ` in ${location}` : ''}`,
      'virtual-tour': `Virtual walkthrough${projectName ? ` — ${projectName}` : ''}`,
    }

    return {
      subject: input.channel === 'email' ? subjects[input.purpose] : undefined,
      body: `${openers[input.channel]} ${bodies[input.purpose]}${closers[input.channel]}`,
      channel: input.channel,
    }
  }

  /**
   * Deterministic theme extraction.
   *
   * Matches the same taxonomy the selectors use, so the mock and the rule pass
   * never disagree on stage. Evidence is copied from the supplied text rather
   * than written, because a fabricated quote is the one failure mode this
   * feature cannot survive.
   */
  async extractThemes(
    verbatims: string[],
    context?: Record<string, unknown>,
  ): Promise<AIThemeExtraction> {
    await delay(verbatims.join('|').slice(0, 120), 220, 560)

    const acc = new Map<string, { evidence: string[]; negative: number; total: number }>()

    for (const verbatim of verbatims) {
      const text = verbatim.toLowerCase()
      for (const def of ref().themes) {
        if (def.excludes?.some((phrase) => text.includes(phrase))) continue
        if (!def.keywords.some((keyword) => text.includes(keyword))) continue

        const entry = acc.get(def.id) ?? { evidence: [], negative: 0, total: 0 }
        entry.total += 1
        if (/not|no |delay|never|still|chas|wrong|poor/.test(text)) entry.negative += 1
        if (entry.evidence.length < 3) entry.evidence.push(verbatim)
        acc.set(def.id, entry)
      }
    }

    const themes = [...acc.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([id, entry]) => {
        const def = themeById(id)
        const negativeShare = entry.total ? entry.negative / entry.total : 0
        return {
          label: def.label,
          aspect: def.aspect,
          sentiment:
            negativeShare > 0.5
              ? ('negative' as const)
              : negativeShare > 0.2
                ? ('neutral' as const)
                : ('positive' as const),
          confidence: Math.min(92, 40 + entry.total * 4),
          evidence: entry.evidence,
        }
      })

    void context
    return {
      themes,
      summary: themes.length
        ? `${themes.length} theme(s) across ${verbatims.length} response(s); ${themes[0].label} is the most frequent.`
        : 'No recognised theme in this batch.',
    }
  }

  async explainRootCause(input: AIRootCauseInput): Promise<AIRootCauseResult> {
    await delay(`${input.theme}:${input.journeyStage}`, 200, 520)

    return {
      // Phrased as a hypothesis on purpose: the number is an association.
      hypothesis: `Feedback about ${input.theme.toLowerCase()} concentrates at the ${input.journeyStage} stage on the ${input.touchpoint.toLowerCase()} touchpoint, where it coincides with an NPS drag of ${input.npsDrag} across ${input.affectedResponses} responses. A process gap at that handoff is the most plausible explanation, but this is association rather than an established cause.`,
      correlates: [
        `Whether ${input.touchpoint.toLowerCase()} turnaround times moved in the same period`,
        'Whether the affected responses concentrate in specific projects or teams',
        'Whether an operational change preceded the shift',
      ],
      confidence: Math.round(Math.min(88, 45 + Math.abs(input.correlation) * 50)),
    }
  }
}
