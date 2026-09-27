/**
 * Where a maturity gap becomes a named agent.
 *
 * This is the only module that joins the scoring engine to the agent catalogue,
 * which keeps ./scoring.ts arguable purely as arithmetic. Everything here is
 * deterministic — the Claude narrative sits above these results and never
 * inside them.
 */

import { agents, type AgentData } from "@/data/agents";
import type { Level } from "./types";
import type { AssessmentOutcome, CapabilityResult } from "./scoring";

/** An agent is only ranked on its strongest few capabilities, not on breadth. */
export const MAX_CAPABILITIES_PER_AGENT = 3;

/**
 * Two agents in the catalogue carry no scope/autonomy coordinates. Both read as
 * Process scope with user-approved execution from their own descriptions, so
 * they are placed here rather than by editing the catalogue — that belongs in
 * its own change, reviewed on its own terms.
 */
const DERIVED_REACH: Record<string, Level> = {
  "next-best-action-agent": 3,
  "demand-planning-agent": 3,
};

/**
 * How far up the 1–5 maturity ladder an agent can carry a capability.
 *
 * `scope + autonomy - 2` means level 5 requires both journey-level scope and at
 * least guardrailed autonomy, and level 1 is unreachable by design: level 1
 * means a person does this unaided, so no agent can "achieve" it.
 *
 * Worth being honest about the resolution here — the catalogue only spans a
 * handful of distinct coordinates, so this is a sound eligibility filter but it
 * is not what does the ranking. The crosswalk and the gap sizes do that.
 */
export function agentReach(agent: AgentData): Level | null {
  if (!agent.scope || !agent.autonomy) return DERIVED_REACH[agent.id] ?? null;
  const reach = agent.scope.level + agent.autonomy.level - 2;
  return Math.max(1, Math.min(5, reach)) as Level;
}

export interface OpportunityCoverage {
  result: CapabilityResult;
  /** Rungs of agentic maturity this agent can actually close here. */
  rungs: number;
  /** Whether the agent reaches the target, or only part of the way. */
  coverage: "full" | "partial";
}

export interface Opportunity {
  agent: AgentData;
  reach: Level;
  covers: OpportunityCoverage[];
  totalRungs: number;
  fullCount: number;
  rationale: string;
  tags: string[];
}

/** A gapped capability that nothing in the catalogue covers yet. */
export interface ForgeCandidate {
  result: CapabilityResult;
  reason: "no-agent" | "no-lever";
}

export interface OpportunityResult {
  opportunities: Opportunity[];
  forgeCandidates: ForgeCandidate[];
}

const agentById = new Map(agents.map((a) => [a.id, a]));

export function recommendOpportunities(outcome: AssessmentOutcome): OpportunityResult {
  const byAgent = new Map<string, OpportunityCoverage[]>();
  const forgeCandidates: ForgeCandidate[] = [];

  for (const result of outcome.gaps) {
    if (result.gapScore <= 0) continue;

    const { agentIds } = result.capability;
    if (agentIds.length === 0) {
      forgeCandidates.push({ result, reason: "no-agent" });
      continue;
    }

    let levered = false;
    for (const agentId of agentIds) {
      const agent = agentById.get(agentId);
      if (!agent) continue;
      const reach = agentReach(agent);
      if (reach === null) continue;

      // An agent that cannot get past where you already are is not a lever.
      const rungs = Math.max(0, Math.min(reach, result.target) - result.agentic);
      if (rungs <= 0) continue;

      levered = true;
      const list = byAgent.get(agentId) ?? [];
      list.push({
        result,
        rungs,
        coverage: reach >= result.target ? "full" : "partial",
      });
      byAgent.set(agentId, list);
    }

    // Tagged agents exist, but none of them reach past the current position.
    if (!levered) forgeCandidates.push({ result, reason: "no-lever" });
  }

  const opportunities: Opportunity[] = [];

  // Array.from rather than iterating the Map directly — this tsconfig targets
  // below es2015, so Map iteration needs downlevelIteration.
  for (const [agentId, rawCovers] of Array.from(byAgent.entries())) {
    const agent = agentById.get(agentId)!;
    const reach = agentReach(agent)!;

    const covers = rawCovers.sort((a, b) => b.rungs - a.rungs);
    const counted = covers.slice(0, MAX_CAPABILITIES_PER_AGENT);
    const lead = counted[0];

    opportunities.push({
      agent,
      reach,
      covers,
      totalRungs: counted.reduce((sum, c) => sum + c.rungs, 0),
      fullCount: covers.filter((c) => c.coverage === "full").length,
      rationale: `Closes ${lead.rungs} rung${lead.rungs === 1 ? "" : "s"} on ${
        lead.result.capability.label
      } (level ${lead.result.agentic} to ${Math.min(reach, lead.result.target)} of a ${
        lead.result.target
      } target)${covers.length > 1 ? `, and contributes to ${covers.length - 1} more` : ""}.`,
      tags: [lead.result.group.shortLabel, agent.categories[0]].filter(Boolean) as string[],
    });
  }

  opportunities.sort(
    (a, b) =>
      b.totalRungs - a.totalRungs ||
      b.fullCount - a.fullCount ||
      (b.agent.accuracy ?? 0) - (a.agent.accuracy ?? 0) ||
      agents.indexOf(a.agent) - agents.indexOf(b.agent),
  );

  return { opportunities, forgeCandidates };
}
