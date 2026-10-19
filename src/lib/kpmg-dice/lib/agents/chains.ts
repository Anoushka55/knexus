import type { AgentFinding } from './types'

/**
 * Declared agent chains.
 *
 * Order matters: an agent can only cite what ran before it. Each chain is a
 * different shape on purpose — reactive, diagnostic, proactive — so the
 * mechanism does not read as one scripted story.
 *
 * Five agents are deliberately absent. Payment Assistant, Visit Conversion,
 * Campaign Quality Analytics, Customer 360 and Virtual Selling are single-step
 * or feed a different flow; drawing them in would be decoration.
 */

export interface ChainStep {
  agentId: string
  /** What this step contributes, shown under the node in the trace. */
  role: 'Observe' | 'Judge' | 'Act' | 'Roll up'
}

export interface ChainDef {
  id: string
  name: string
  kind: 'Reactive' | 'Diagnostic' | 'Proactive' | 'Contested'
  premise: string
  steps: ChainStep[]
}

export const CHAINS: ChainDef[] = [
  {
    /*
     * The one where they disagree.
     *
     * Sentiment reads an opt-out and wants the customer left alone; Recovery
     * and Payment read a detractor score and an unresolved bill and want owned
     * effort put in. Both are defensible from the record, and they cannot both
     * be acted on — which is exactly the case a human has to settle.
     */
    id: 'contested',
    name: 'Contested customer',
    kind: 'Contested',
    premise:
      'Two agents read the same customer and want opposite things. Somebody has to decide.',
    steps: [
      { agentId: 'agent-sentiment', role: 'Observe' },
      { agentId: 'agent-service', role: 'Observe' },
      { agentId: 'agent-payment', role: 'Act' },
      { agentId: 'agent-detractor-recovery', role: 'Act' },
    ],
  },
  {
    id: 'buying-picture',
    name: 'What this customer actually wants',
    kind: 'Proactive',
    premise:
      'Interest is spread across projects and visits, and nobody has assembled it into a next move.',
    steps: [
      { agentId: 'agent-customer360', role: 'Observe' },
      { agentId: 'agent-visit', role: 'Judge' },
      { agentId: 'agent-nba', role: 'Act' },
      { agentId: 'agent-survey-optimizer', role: 'Act' },
    ],
  },
  {
    id: 'post-sales',
    name: 'Post-sales advocacy collapse',
    kind: 'Reactive',
    premise:
      'A booked customer, money and service both in play, and a score that shows the damage.',
    steps: [
      { agentId: 'agent-payment', role: 'Observe' },
      { agentId: 'agent-service', role: 'Observe' },
      { agentId: 'agent-customer360', role: 'Judge' },
      { agentId: 'agent-detractor-recovery', role: 'Act' },
    ],
  },
  {
    id: 'pipeline-truth',
    name: 'Pipeline truth',
    kind: 'Diagnostic',
    premise: 'A lead sitting at a stage the evidence does not support.',
    steps: [
      { agentId: 'agent-sentiment', role: 'Observe' },
      { agentId: 'agent-validation', role: 'Judge' },
      { agentId: 'agent-customer360', role: 'Judge' },
      { agentId: 'agent-nba', role: 'Act' },
    ],
  },
]

export const CHAINS_BY_ID = Object.fromEntries(CHAINS.map((c) => [c.id, c]))

/**
 * Agents that cannot appear in a per-customer chain, named rather than quietly
 * omitted.
 *
 * These emit findings with no leadId — they are roll-ups over the whole book
 * (themes, clusters, campaign scores, pipeline risk), so there is nothing to
 * hand to or from a single customer. Established by measuring their output,
 * not by reasoning about their role: four agents that looked like roll-ups
 * turned out to be per-customer, and four that looked per-customer turned out
 * to be aggregates.
 */
export const NON_CHAINING_AGENT_IDS = [
  'agent-campaign',
  'agent-risk',
  'agent-voc-analyzer',
  'agent-root-cause',
  'agent-feedback-journey',
]

/**
 * One step's outcome.
 *
 * `status` is what stops the trace being a picture: an agent that had nothing
 * to work with reports it rather than rendering an empty node that looks the
 * same as a successful one.
 */
export interface ChainStepResult {
  agentId: string
  agentName: string
  role: ChainStep['role']
  status: 'concluded' | 'nothing-to-add'
  findings: AgentFinding[]
  /** The finding this step cited, resolved for display. */
  cited?: { agentName: string; headline: string; evidence: string[] }
}
