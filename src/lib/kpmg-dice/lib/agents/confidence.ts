import type { AgentFinding } from './types'

/**
 * How much weight a conclusion carries.
 *
 * Three inputs, all real: how many distinct facts the agent cited, how serious
 * it judged the finding, and — once a chain runs — whether another agent
 * reached a compatible conclusion about the same customer independently.
 *
 * The ceiling is 95, never 100. An agent reading a partial record should not be
 * able to express certainty, and a bar that can reach the end invites a reader
 * to treat it as a probability. It is a weighting, and the UI labels it as one.
 */

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 20,
  high: 14,
  medium: 7,
  info: 2,
}

/*
 * Calibrated so the scale actually separates conclusions.
 *
 * The first cut ran a base of 40 with an uncapped corroboration bonus, and a
 * four-agent chain pushed every finding to the ceiling — a score where
 * everything reads 95 tells a reader nothing. The maximum reachable here is 85,
 * so the top of the bar means something and the ceiling is genuinely rare.
 */
const BASE = 25
const CEILING = 92
const MAX_EVIDENCE = 25
const PER_EVIDENCE = 6
/** Per corroborating agent, and capped — agreement helps, it does not certify. */
export const CORROBORATION_BONUS = 6
const MAX_CORROBORATION = 15

/**
 * Charged against a finding the record only implies.
 *
 * An inferred case is real but weaker than a stated one, and scoring them
 * identically would flatten exactly the distinction the signal exists to draw.
 */
const INFERRED_PENALTY = 12

export function baselineConfidence(f: AgentFinding): number {
  const fromEvidence = Math.min(MAX_EVIDENCE, f.evidence.length * PER_EVIDENCE)
  const fromSeverity = SEVERITY_WEIGHT[f.severity] ?? 0
  const inferred = f.signal === 'inferred' ? INFERRED_PENALTY : 0
  return Math.max(
    BASE - INFERRED_PENALTY,
    Math.min(CEILING, BASE + fromEvidence + fromSeverity - inferred),
  )
}

/** Raised when another agent independently concluded something about this customer. */
export function withCorroboration(f: AgentFinding, corroborators: number): AgentFinding {
  if (!corroborators) return f
  const base = f.confidence ?? baselineConfidence(f)
  return {
    ...f,
    confidence: Math.min(
      CEILING,
      base + Math.min(MAX_CORROBORATION, corroborators * CORROBORATION_BONUS),
    ),
  }
}

export function confidenceBand(v: number): 'low' | 'moderate' | 'strong' {
  if (v >= 80) return 'strong'
  if (v >= 60) return 'moderate'
  return 'low'
}
