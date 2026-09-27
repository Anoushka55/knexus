import type { AssessmentOutcome } from "./scoring";
import type { OpportunityResult } from "./opportunities";

/**
 * The deterministic executive read.
 *
 * This is the real output, not a fallback that nobody sees: it renders while
 * the model is answering, whenever the key is absent, whenever the call fails,
 * and for restricted accounts who never reach the API at all. The Claude
 * version rewrites the prose — it never supplies a number.
 */

export interface NarrativeFacts {
  title: string;
  industry: string;
  scope: string;
  business: number;
  agentic: number;
  peerBusiness: number;
  peerAgentic: number;
  capabilities: number;
  groups: number;
  priorityOpportunities: number;
  strongestGroup: { label: string; business: number; agentic: number };
  weakestGroup: { label: string; business: number; agentic: number };
  topGaps: { label: string; group: string; current: number; target: number; gap: number }[];
  topAgents: { title: string; rationale: string }[];
  uncovered: string[];
}

export function narrativeFacts(
  outcome: AssessmentOutcome,
  opportunities: OpportunityResult,
  meta: { industry: string; scope: string },
): NarrativeFacts {
  const ranked = [...outcome.groups].sort(
    (a, b) => b.scores.agentic + b.scores.business - (a.scores.agentic + a.scores.business),
  );
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];

  return {
    title: outcome.definition.title,
    industry: meta.industry,
    scope: meta.scope,
    business: Number(outcome.overall.byGroup.business.toFixed(1)),
    agentic: Number(outcome.overall.byGroup.agentic.toFixed(1)),
    peerBusiness: outcome.benchmark.peer.business,
    peerAgentic: outcome.benchmark.peer.agentic,
    capabilities: outcome.counts.capabilities,
    groups: outcome.counts.groups,
    priorityOpportunities: outcome.counts.priorityOpportunities,
    strongestGroup: {
      label: strongest.group.label,
      business: Number(strongest.scores.business.toFixed(1)),
      agentic: Number(strongest.scores.agentic.toFixed(1)),
    },
    weakestGroup: {
      label: weakest.group.label,
      business: Number(weakest.scores.business.toFixed(1)),
      agentic: Number(weakest.scores.agentic.toFixed(1)),
    },
    topGaps: outcome.gaps
      .filter((g) => g.gapScore > 0)
      .slice(0, 3)
      .map((g) => ({
        label: g.capability.label,
        group: g.group.label,
        current: g.agentic,
        target: g.target,
        gap: g.gapScore,
      })),
    topAgents: opportunities.opportunities.slice(0, 3).map((o) => ({
      title: o.agent.title,
      rationale: o.rationale,
    })),
    uncovered: opportunities.forgeCandidates
      .filter((c) => c.reason === "no-agent")
      .map((c) => c.result.capability.label),
  };
}

export function buildTemplateNarrative(f: NarrativeFacts): string {
  const spread = Number((f.business - f.agentic).toFixed(1));
  const gapList = f.topGaps.map((g) => g.label.toLowerCase()).join(", ");
  const agentList = f.topAgents.map((a) => a.title).join(", ");

  const parts: string[] = [];

  parts.push(
    `Across ${f.capabilities} capabilities in ${f.groups} groups, ${f.scope.toLowerCase()} maturity sits at ${f.business.toFixed(
      1,
    )} on the business scale and ${f.agentic.toFixed(1)} on the agentic scale, against an illustrative starting position of ${f.peerBusiness.toFixed(
      1,
    )} and ${f.peerAgentic.toFixed(1)}.`,
  );

  if (spread >= 0.5) {
    parts.push(
      `The ${spread.toFixed(
        1,
      )}-point spread between the two is the headline: these are capabilities that are run well but carried almost entirely by people, which is where agents have the most room and the least disruption to earn it.`,
    );
  } else {
    parts.push(
      `Business and agentic maturity track closely, so the constraint is the capability itself rather than the absence of automation on top of it.`,
    );
  }

  parts.push(
    `${f.strongestGroup.label} is the strongest group at ${f.strongestGroup.business.toFixed(
      1,
    )} / ${f.strongestGroup.agentic.toFixed(1)}; ${f.weakestGroup.label} trails at ${f.weakestGroup.business.toFixed(
      1,
    )} / ${f.weakestGroup.agentic.toFixed(1)}.`,
  );

  if (f.topGaps.length > 0) {
    parts.push(
      `${f.priorityOpportunities} ${
        f.priorityOpportunities === 1 ? "capability is" : "capabilities are"
      } four or more rungs short of target, led by ${gapList}.`,
    );
  }

  if (f.topAgents.length > 0) {
    parts.push(`The agents that close the most ground first are ${agentList}.`);
  }

  if (f.uncovered.length > 0) {
    parts.push(
      `${f.uncovered.join(" and ")} ${
        f.uncovered.length === 1 ? "has" : "have"
      } no agent in the catalogue today and would need to be built.`,
    );
  }

  return parts.join(" ");
}
