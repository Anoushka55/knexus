import type { AgentActionPlan, CrmWrite } from './types'

/**
 * When two agents want opposite things for the same customer.
 *
 * The oppositions below are real contradictions in this domain, not invented
 * ones: you cannot both write a customer off and schedule work on them, and you
 * cannot both mark them do-not-contact and plan to contact them. Anything less
 * clear-cut is left out — a conflict list that fires on merely-different
 * actions would train a reader to ignore it.
 *
 * Detection is deliberately conservative. A missed conflict is a gap; a false
 * one costs the feature its credibility the first time somebody checks.
 */

type Stance = 'writing-off' | 'investing' | 'contacting' | 'silencing'

/** What a proposed write says about how the customer should be treated. */
function stanceOf(write: CrmWrite): Stance | null {
  switch (write.kind) {
    case 'flag-lead': {
      if (write.flags.dnd) return 'silencing'
      if (write.flags.cold || write.flags.intent === 'low') return 'writing-off'
      return null
    }
    case 'create-task':
    case 'create-recovery-case':
      return 'investing'
    case 'schedule-survey':
      return 'contacting'
    case 'suppress-survey':
      return 'silencing'
    default:
      return null
  }
}

/** Stances that cannot both be right about the same customer at the same time. */
const OPPOSED: [Stance, Stance][] = [
  ['writing-off', 'investing'],
  ['writing-off', 'contacting'],
  ['silencing', 'contacting'],
  ['silencing', 'investing'],
]

function opposes(a: Stance, b: Stance) {
  return OPPOSED.some(([x, y]) => (a === x && b === y) || (a === y && b === x))
}

export interface AgentConflict {
  leadId: string
  a: AgentActionPlan
  b: AgentActionPlan
  /** Plain-language statement of what the disagreement actually is. */
  summary: string
}

const STANCE_WORDS: Record<Stance, string> = {
  'writing-off': 'stop working this customer',
  investing: 'put owned effort into this customer',
  contacting: 'reach out to this customer',
  silencing: 'stop contacting this customer',
}

export function detectConflicts(plans: AgentActionPlan[]): AgentConflict[] {
  const out: AgentConflict[] = []

  for (let i = 0; i < plans.length; i += 1) {
    for (let j = i + 1; j < plans.length; j += 1) {
      const a = plans[i]
      const b = plans[j]
      if (!a.leadId || a.leadId !== b.leadId) continue
      if (a.agentId === b.agentId) continue

      const sa = stanceOf(a.write)
      const sb = stanceOf(b.write)
      if (!sa || !sb || !opposes(sa, sb)) continue

      out.push({
        leadId: a.leadId,
        a,
        b,
        summary: `One agent wants to ${STANCE_WORDS[sa]}; the other wants to ${STANCE_WORDS[sb]}.`,
      })
    }
  }
  return out
}
