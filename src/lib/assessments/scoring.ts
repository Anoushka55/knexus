/**
 * The scoring engine. Pure functions, no I/O — same input, same number, every
 * time. That is the point: the score has to survive a partner arguing with it.
 *
 * Nothing here imports the agent catalogue. Turning scores into agent
 * recommendations is ./opportunities.ts's job, so this module can be reasoned
 * about purely as arithmetic over the rubric.
 */

import type {
  AnswerPatch,
  AssessmentDefinition,
  AssessmentRunInput,
  Capability,
  CapabilityGroup,
  IndustryBenchmark,
  Level,
  Scale,
} from "./types";

/**
 * A capability must be this many rungs short across both scales to count as a
 * priority. Four, not two: with two scales a gap of one rung on each is the
 * common case, and a "priority" list that contains everything ranks nothing.
 */
export const PRIORITY_GAP_THRESHOLD = 4;

/** How many strengths the executive summary leads with. */
export const STRENGTH_COUNT = 5;

export interface CapabilityResult {
  capability: Capability;
  group: CapabilityGroup;
  business: Level;
  agentic: Level;
  target: Level;
  /** True where the client has corrected the benchmark on at least one field. */
  corrected: boolean;
  gapBusiness: number;
  gapAgentic: number;
  /** Total rungs to climb across both scales — the ranking key. */
  gapScore: number;
  isPriority: boolean;
}

export interface GroupResult {
  group: CapabilityGroup;
  capabilities: CapabilityResult[];
  scores: Record<Scale, number>;
  /** Mean target across the group, for the radar's outer reference. */
  target: number;
  gapScore: number;
}

export interface AssessmentOutcome {
  definition: AssessmentDefinition;
  benchmark: IndustryBenchmark;
  capabilities: CapabilityResult[];
  groups: GroupResult[];
  overall: {
    /** The headline. Mean of the group means, so every group counts equally. */
    byGroup: Record<Scale, number>;
    /** Mean of every capability. Exposed only so a reviewer can reconcile the two. */
    byCapability: Record<Scale, number>;
  };
  /** Overall minus the benchmark's peer figure, per scale. */
  vsPeer: Record<Scale, number>;
  counts: {
    capabilities: number;
    groups: number;
    priorityOpportunities: number;
    corrected: number;
  };
  /** Highest floor first — a genuine strength is strong on both scales. */
  strengths: CapabilityResult[];
  /** Largest total climb first. */
  gaps: CapabilityResult[];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Lay the client's sparse corrections over the benchmark.
 * An absent key — or an absent field — means "accept the benchmark".
 */
export function resolveAnswer(
  benchmark: IndustryBenchmark,
  capabilityId: string,
  patch: AnswerPatch | undefined,
) {
  const row = benchmark.rows[capabilityId];
  if (!row) {
    // assertDefinition() catches this in development; in production a missing
    // row must not take the page down, so fall back to the bottom of the scale.
    return { business: 1 as Level, agentic: 1 as Level, target: 3 as Level, corrected: false };
  }
  return {
    business: patch?.business ?? row.business,
    agentic: patch?.agentic ?? row.agentic,
    target: patch?.target ?? row.target,
    corrected:
      patch?.business !== undefined ||
      patch?.agentic !== undefined ||
      patch?.target !== undefined,
  };
}

export function getBenchmark(
  definition: AssessmentDefinition,
  benchmarkId: string,
): IndustryBenchmark {
  return (
    definition.benchmarks.find((b) => b.id === benchmarkId) ??
    definition.benchmarks.find((b) => b.id === definition.defaultBenchmarkId) ??
    definition.benchmarks[0]
  );
}

export function assess(
  definition: AssessmentDefinition,
  input: AssessmentRunInput,
): AssessmentOutcome {
  const benchmark = getBenchmark(definition, input.benchmarkId);
  const groupById = new Map(definition.groups.map((g) => [g.id, g]));

  const capabilities: CapabilityResult[] = definition.capabilities.map((capability) => {
    const { business, agentic, target, corrected } = resolveAnswer(
      benchmark,
      capability.id,
      input.answers[capability.id],
    );

    // Never negative: a client already past their own target has no gap, they
    // have a target that needs raising. Same guard as the P2P engine's ceiling.
    const gapBusiness = Math.max(0, target - business);
    const gapAgentic = Math.max(0, target - agentic);
    const gapScore = gapBusiness + gapAgentic;

    return {
      capability,
      group: groupById.get(capability.groupId)!,
      business,
      agentic,
      target,
      corrected,
      gapBusiness,
      gapAgentic,
      gapScore,
      isPriority: gapScore >= PRIORITY_GAP_THRESHOLD,
    };
  });

  const byId = new Map(capabilities.map((c) => [c.capability.id, c]));

  const groups: GroupResult[] = definition.groups.map((group) => {
    const members = definition.capabilities
      .filter((c) => c.groupId === group.id)
      .map((c) => byId.get(c.id)!);

    // Weighted, but the weight defaults to 1 and is expected to stay there.
    // A maturity model has no objective quantity to weight by — unlike minutes
    // in the P2P engine — so any weight is invented and must be justified in
    // the UI wherever it is not 1.
    const weightOf = (r: CapabilityResult) => r.capability.weight ?? 1;
    const totalWeight = members.reduce((sum, r) => sum + weightOf(r), 0) || 1;
    const weighted = (pick: (r: CapabilityResult) => number) =>
      members.reduce((sum, r) => sum + pick(r) * weightOf(r), 0) / totalWeight;

    return {
      group,
      capabilities: members,
      scores: {
        business: weighted((r) => r.business),
        agentic: weighted((r) => r.agentic),
      },
      target: weighted((r) => r.target),
      gapScore: members.reduce((sum, r) => sum + r.gapScore, 0),
    };
  });

  // Mean of the group means, not of all 28 capabilities: with uneven group
  // sizes the latter silently gives the bigger groups more say, which would
  // contradict what the radar and the six bars visually assert.
  const overall = {
    byGroup: {
      business: mean(groups.map((g) => g.scores.business)),
      agentic: mean(groups.map((g) => g.scores.agentic)),
    },
    byCapability: {
      business: mean(capabilities.map((c) => c.business)),
      agentic: mean(capabilities.map((c) => c.agentic)),
    },
  };

  const gaps = [...capabilities].sort(
    (a, b) =>
      b.gapScore - a.gapScore ||
      // Agentic gaps break ties: those are the ones this platform can close.
      b.gapAgentic - a.gapAgentic ||
      definition.capabilities.indexOf(a.capability) -
        definition.capabilities.indexOf(b.capability),
  );

  const strengths = [...capabilities]
    .sort(
      (a, b) =>
        Math.min(b.business, b.agentic) - Math.min(a.business, a.agentic) ||
        a.gapScore - b.gapScore ||
        definition.capabilities.indexOf(a.capability) -
          definition.capabilities.indexOf(b.capability),
    )
    .slice(0, STRENGTH_COUNT);

  return {
    definition,
    benchmark,
    capabilities,
    groups,
    overall,
    vsPeer: {
      business: overall.byGroup.business - benchmark.peer.business,
      agentic: overall.byGroup.agentic - benchmark.peer.agentic,
    },
    counts: {
      capabilities: capabilities.length,
      groups: groups.length,
      priorityOpportunities: capabilities.filter((c) => c.isPriority).length,
      corrected: capabilities.filter((c) => c.corrected).length,
    },
    strengths,
    gaps,
  };
}

/** The empty run: every answer inherited from the benchmark. */
export function createRunInput(
  definition: AssessmentDefinition,
  overrides: Partial<AssessmentRunInput> = {},
): AssessmentRunInput {
  return {
    definitionId: definition.slug,
    benchmarkId: definition.defaultBenchmarkId,
    scopeId: definition.scopes[0]?.id ?? "enterprise",
    industryLabel: definition.kicker,
    completedOn: null,
    answers: {},
    notes: "",
    ...overrides,
  };
}
