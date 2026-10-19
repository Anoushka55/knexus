import type { Sentiment, TranscriptLine } from '@/lib/kpmg-dice/types'

/**
 * Rolling analysis over a call as it streams.
 *
 * Deterministic and synchronous so the panel keeps pace with playback; the AI
 * service supplies the closing narrative once the call ends.
 */

export interface DetectedEntity {
  label: string
  value: string
  /** Second in the call at which it was first heard. */
  atSecond: number
}

export interface LiveAnalysis {
  sentiment: Sentiment
  /** -1 (hostile) … +1 (enthusiastic). */
  sentimentScore: number
  intent: string
  intentLabel: string
  /** 0–100. */
  confidence: number
  entities: DetectedEntity[]
  /** One point per customer line, for the sentiment arc. */
  arc: { atSecond: number; value: number }[]
  customerLineCount: number
}

const NEGATIVE_PHRASES: [RegExp, number][] = [
  [/do not call again|don'?t call again|stop calling/i, -1],
  [/remove my number|take me off/i, -0.9],
  [/waste of time/i, -0.8],
  [/not interested|no longer interested/i, -0.7],
  [/already (bought|purchased|booked)/i, -0.5],
  [/too expensive|over budget/i, -0.4],
  [/disappointed|frustrated|every week/i, -0.35],
]

const POSITIVE_PHRASES: [RegExp, number][] = [
  [/ready to (move ahead|book|proceed)/i, 0.9],
  [/close this soon|book this quarter|want to book/i, 0.85],
  [/we loved it|looked good|quite impressed|liked/i, 0.6],
  [/still very interested|very interested/i, 0.6],
  [/payment terms|payment plan|home loan|finance team/i, 0.45],
  [/send me|can you send|do let me know/i, 0.3],
  [/works really well|perfect timing/i, 0.5],
]

const NEUTRAL_DEFER: [RegExp, number][] = [
  [/call me after \d+ days|call me later|after 15 days/i, -0.05],
  [/not just yet|depends on/i, -0.1],
]

/** Entity patterns, in priority order. */
const ENTITY_RULES: { label: string; pattern: RegExp; format?: (m: RegExpMatchArray) => string }[] = [
  {
    label: 'Budget',
    pattern: /(?:around\s+)?(two and a half crore|[\d.]+\s*(?:crore|cr))/i,
    format: (m) =>
      /two and a half/i.test(m[1]) ? '₹2.5 Cr' : `₹${m[1].replace(/\s*(crore|cr)/i, '')} Cr`,
  },
  {
    // Named projects only — a bare "Meridian <word>" also matches the company
    // name in the rep's opening line.
    label: 'Project',
    pattern:
      /(?:Meridian\s+)?(Forest Edge|Dream Acres|Windsor|Royal Pavilion|Silicon Oasis|Serein|Eureka Park|Primanti|New Haven|Promont|Lakeside Habitat|Falcon City|Waterford|Park Grove|Sunrise Park|Kew Gardens|White Meadows)/i,
    format: (m) => `Meridian ${m[1]}`,
  },
  { label: 'Unit type', pattern: /(\d\s*BHK)/i },
  { label: 'Timeline', pattern: /(this quarter|after \d+ days|in \d+ days|couple of weeks|by \w+ \d{4}|September|October|December \d{4})/i },
  { label: 'Objection', pattern: /(possession|floor rise|carpet area|loan|registration)/i, format: (m) => {
      const v = m[1].toLowerCase()
      if (v === 'possession') return 'Possession Timeline'
      if (v === 'floor rise') return 'Floor rise pricing'
      if (v === 'carpet area') return 'Carpet area efficiency'
      if (v === 'loan') return 'Loan eligibility'
      return 'Registration / documentation'
    } },
  { label: 'Location', pattern: /(Powai|Thane|Mulund|Andheri|Chembur|Seawoods|Kalyan|Panvel|Borivali|Navi Mumbai)/i },
]

function scoreLine(text: string) {
  let score = 0
  let hits = 0
  for (const [pattern, weight] of [...NEGATIVE_PHRASES, ...POSITIVE_PHRASES, ...NEUTRAL_DEFER]) {
    if (pattern.test(text)) {
      score += weight
      hits += 1
    }
  }
  return { score: hits ? score / hits : 0, hits }
}

function classifyIntent(
  customerText: string,
  sentimentScore: number,
): { intent: string; label: string } {
  if (/do not call again|don'?t call again|stop calling|remove my number/i.test(customerText)) {
    return { intent: 'do-not-contact', label: 'Do Not Contact' }
  }
  if (/already (bought|purchased|booked)/i.test(customerText)) {
    return { intent: 'lost-to-competitor', label: 'Lost to competitor' }
  }
  if (/call me after \d+ days|after 15 days|call me later/i.test(customerText)) {
    return { intent: 'deferred-follow-up', label: 'Deferred follow-up' }
  }
  if (/payment terms|payment plan|home loan|finance team/i.test(customerText)) {
    return { intent: 'payment-enquiry', label: 'Payment / finance enquiry' }
  }
  if (sentimentScore > 0.35) {
    return { intent: 'high-purchase-intent', label: 'High purchase intent' }
  }
  if (sentimentScore < -0.3) {
    return { intent: 'disengaging', label: 'Disengaging' }
  }
  return { intent: 'information-gathering', label: 'Information gathering' }
}

/** Recomputes the whole analysis from the lines revealed so far. */
export function analyseRevealed(lines: TranscriptLine[]): LiveAnalysis {
  const customerLines = lines.filter((l) => l.speaker === 'customer')
  const customerText = customerLines.map((l) => l.text).join(' ')

  const arc: { atSecond: number; value: number }[] = []
  let rolling = 0
  let weight = 0

  for (const line of customerLines) {
    const { score, hits } = scoreLine(line.text)
    // Later lines carry more weight — a call's ending matters most.
    const w = hits ? 1 + hits * 0.5 : 0.35
    rolling = (rolling * weight + score * w) / (weight + w)
    weight += w
    arc.push({ atSecond: line.atSecond, value: Math.max(-1, Math.min(1, rolling)) })
  }

  const sentimentScore = arc.length ? arc[arc.length - 1].value : 0
  const sentiment: Sentiment =
    sentimentScore > 0.18 ? 'positive' : sentimentScore < -0.18 ? 'negative' : 'neutral'

  const { intent, label } = classifyIntent(customerText, sentimentScore)

  const entities: DetectedEntity[] = []
  for (const rule of ENTITY_RULES) {
    for (const line of lines) {
      const match = line.text.match(rule.pattern)
      if (!match) continue
      entities.push({
        label: rule.label,
        value: rule.format ? rule.format(match) : match[1],
        atSecond: line.atSecond,
      })
      break
    }
  }

  // Confidence rises with evidence volume and the strength of the signal.
  const confidence = Math.min(
    97,
    Math.round(
      38 +
        customerLines.length * 6 +
        Math.abs(sentimentScore) * 32 +
        entities.length * 2,
    ),
  )

  return {
    sentiment,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    intent,
    intentLabel: label,
    confidence: customerLines.length ? confidence : 0,
    entities,
    arc,
    customerLineCount: customerLines.length,
  }
}
