// The scoring engine. Pure functions, no I/O — same input, same number, every
// time. That is the point: the score has to survive a partner arguing with it.

import {
  HUMAN_EXCEPTION_FLOOR,
  MODE_WEIGHT,
  type Activity,
  type AssessmentInput,
  type Adjusters,
  type ExecutionMode,
  type ProcessModel,
} from "./types";

export interface ActivityResult {
  activity: Activity;
  effectiveMinutes: number;
  benchmarkMode: ExecutionMode;
  currentMode: ExecutionMode;
  ceilingMode: ExecutionMode;
  /** Client corrected this row away from the benchmark. */
  moved: boolean;
  /** Effect of that correction on the headline score, in percentage points. */
  deltaPp: number;
  /** Uplift available getting to `automated`, in pp. */
  automationUpliftPp: number;
  /** Uplift available on top of automation, in pp. The net-increment rule. */
  aiUpliftPp: number;
  /** Human minutes per unit this activity could give back. */
  recoverableMinutes: number;
}

export interface WaterfallStep {
  label: string;
  kind: "start" | "down" | "up" | "total";
  /** Signed percentage points. Zero for `start` / `total` rows. */
  valuePp: number;
  /** Running score after this step, 0..1. */
  running: number;
}

export interface AssessmentResult {
  activities: ActivityResult[];
  totalEffectiveMinutes: number;
  scores: {
    benchmark: number;
    current: number;
    achievable: number;
  };
  waterfall: WaterfallStep[];
  savings: {
    recoverableMinutesPerUnit: number;
    /** Share of total process effort that is recoverable, 0..1. */
    recoverableEffortShare: number;
    hoursPerMonth: number;
    fteEquivalent: number;
    annualCost: number;
  };
  /** Challenge ids implicated by activities that are still manual or digitized. */
  liveChallengeIds: string[];
}

/** Working hours per FTE per month — used to turn recovered time into headcount. */
const HOURS_PER_FTE_MONTH = 160;

function clampMultiplier(n: number): number {
  return Math.max(0.3, Math.min(4, n));
}

/**
 * Effort weighting from the client's sub-process mix. Capex and non-PO invoices
 * cost more in matching and coding than PO-backed ones do — the finance
 * analogue of "network procurement has very heavy invoices".
 */
function mixMultiplier(model: ProcessModel, mix: Record<string, number>, stageId: string): number {
  const total = model.variants.reduce((sum, v) => sum + (mix[v.id] ?? 0), 0);
  if (total <= 0) return 1;

  let m = 0;
  for (const v of model.variants) {
    const share = (mix[v.id] ?? 0) / total;
    m += share * v.base * (v.stageMultipliers?.[stageId] ?? 1);
  }
  return clampMultiplier(m);
}

/**
 * Operational drag. Rather than fudging the score, adjusters inflate the
 * minutes on the specific activities they actually hurt.
 */
function adjusterMultiplier(activityId: string, adj: Adjusters): number {
  switch (activityId) {
    case "exception-id":
      return clampMultiplier(1 + (adj.exceptionRate - 0.15) * 3);
    case "po-match":
      return clampMultiplier(1 + (0.85 - adj.firstTimeMatchRate) * 2);
    case "vendor-recon":
      return clampMultiplier(1 + (adj.creditNoteRate - 0.03) * 4);
    default:
      return 1;
  }
}

interface MinutesOpts {
  mix: boolean;
  adjusters: boolean;
}

function multipliersFor(
  model: ProcessModel,
  input: AssessmentInput,
  activity: Activity,
  opts: MinutesOpts
) {
  const mix = opts.mix ? mixMultiplier(model, input.mix, activity.stageId) : 1;
  const adj = opts.adjusters ? adjusterMultiplier(activity.id, input.adjusters) : 1;
  return { mix, adj, combined: mix * adj };
}

function minutesFor(
  model: ProcessModel,
  input: AssessmentInput,
  activity: Activity,
  opts: MinutesOpts
): number {
  return activity.baselineMinutes * multipliersFor(model, input, activity, opts).combined;
}

/**
 * How far the nominal mode actually carries. Complexity does not merely make an
 * activity longer — it makes the automation stop working: a capex invoice with a
 * sixty-line schedule falls out of the matcher and lands on a person. So effort
 * above the norm discounts the mode weight rather than inflating it.
 *
 * This is the mechanic behind "it was not 30%, it was 15%, because the nature of
 * the invoices is very complex."
 *
 * Capped at 1: an easier-than-average mix does not make an activity more than
 * fully automated.
 */
function effectivenessFor(
  model: ProcessModel,
  input: AssessmentInput,
  activity: Activity,
  opts: MinutesOpts
): number {
  const { combined } = multipliersFor(model, input, activity, opts);
  return Math.max(0.25, Math.min(1, 1 / combined));
}

/** Time-weighted automation score. An 18-minute activity must not weigh the same as a 5-minute one. */
function scoreWith(
  model: ProcessModel,
  input: AssessmentInput,
  modeOf: (a: Activity) => ExecutionMode,
  opts: MinutesOpts
): number {
  let weighted = 0;
  let total = 0;
  for (const a of model.activities) {
    const m = minutesFor(model, input, a, opts);
    total += m;
    weighted += m * MODE_WEIGHT[modeOf(a)] * effectivenessFor(model, input, a, opts);
  }
  return total > 0 ? weighted / total : 0;
}

export function benchmarkModeOf(input: AssessmentInput) {
  return (a: Activity): ExecutionMode => a.benchmark[input.landscape];
}

export function currentModeOf(input: AssessmentInput) {
  return (a: Activity): ExecutionMode => input.overrides[a.id] ?? a.benchmark[input.landscape];
}

/**
 * A client can be ahead of the ceiling on a given row. Never let that produce
 * a negative opportunity — the ceiling floats up to meet them.
 */
function effectiveCeiling(current: ExecutionMode, ceiling: ExecutionMode): number {
  return Math.max(MODE_WEIGHT[ceiling], MODE_WEIGHT[current]);
}

export function assess(model: ProcessModel, input: AssessmentInput): AssessmentResult {
  const benchMode = benchmarkModeOf(input);
  const currMode = currentModeOf(input);

  const full: MinutesOpts = { mix: true, adjusters: true };

  const totalEffectiveMinutes = model.activities.reduce(
    (sum, a) => sum + minutesFor(model, input, a, full),
    0
  );

  // ---- per-activity ----
  const activities: ActivityResult[] = model.activities.map((a) => {
    const effectiveMinutes = minutesFor(model, input, a, full);
    const benchmarkMode = benchMode(a);
    const currentMode = currMode(a);
    const share = totalEffectiveMinutes > 0 ? effectiveMinutes / totalEffectiveMinutes : 0;
    const eff = effectivenessFor(model, input, a, full);

    const wCurrent = MODE_WEIGHT[currentMode] * eff;
    const wCeiling = effectiveCeiling(currentMode, a.ceiling) * eff;

    // The net-increment rule: an already-automated activity yields only the
    // 0.75 -> 1.00 step, not the full swing from manual.
    const wAutomated = MODE_WEIGHT.automated * eff;
    const automationPart = Math.max(0, Math.min(wCeiling, wAutomated) - wCurrent);
    const aiPart = Math.max(0, wCeiling - Math.max(wCurrent, wAutomated));

    return {
      activity: a,
      effectiveMinutes,
      benchmarkMode,
      currentMode,
      ceilingMode: a.ceiling,
      moved: currentMode !== benchmarkMode,
      deltaPp: (wCurrent - MODE_WEIGHT[benchmarkMode] * eff) * share * 100,
      automationUpliftPp: automationPart * share * 100,
      aiUpliftPp: aiPart * share * 100,
      recoverableMinutes: effectiveMinutes * (wCeiling - wCurrent),
    };
  });

  // ---- the reverse calculation ----
  // Each step releases exactly one variable, so the chart can never drift
  // from the headline number.
  const sBenchmark = scoreWith(model, input, benchMode, { mix: false, adjusters: false });
  const sWithMix = scoreWith(model, input, benchMode, { mix: true, adjusters: false });
  const sWithAdj = scoreWith(model, input, benchMode, full);
  const sCurrent = scoreWith(model, input, currMode, full);

  const automationUplift = activities.reduce((s, r) => s + r.automationUpliftPp, 0) / 100;
  const aiUplift = activities.reduce((s, r) => s + r.aiUpliftPp, 0) / 100;
  const achievable = Math.max(
    sCurrent,
    sCurrent + automationUplift + aiUplift - HUMAN_EXCEPTION_FLOOR
  );

  const implemented = sCurrent - sWithAdj;

  const waterfall: WaterfallStep[] = [
    { label: "KPMG benchmark for this ERP landscape", kind: "start", valuePp: 0, running: sBenchmark },
    {
      label: "Your invoice mix complexity",
      kind: sWithMix >= sBenchmark ? "up" : "down",
      valuePp: (sWithMix - sBenchmark) * 100,
      running: sWithMix,
    },
    {
      label: "Exception and credit-note drag",
      kind: sWithAdj >= sWithMix ? "up" : "down",
      valuePp: (sWithAdj - sWithMix) * 100,
      running: sWithAdj,
    },
    {
      label: implemented < 0 ? "Not actually implemented" : "Ahead of benchmark",
      kind: implemented < 0 ? "down" : "up",
      valuePp: implemented * 100,
      running: sCurrent,
    },
    { label: "Your actual automation", kind: "total", valuePp: 0, running: sCurrent },
    {
      label: "Automation opportunity",
      kind: "up",
      valuePp: automationUplift * 100,
      running: sCurrent + automationUplift,
    },
    {
      label: "AI net increment",
      kind: "up",
      valuePp: aiUplift * 100,
      running: sCurrent + automationUplift + aiUplift,
    },
    {
      label: "Human exception floor",
      kind: "down",
      valuePp: -HUMAN_EXCEPTION_FLOOR * 100,
      running: achievable,
    },
    { label: "Achievable", kind: "total", valuePp: 0, running: achievable },
  ];

  // ---- savings ----
  // Anchored to the headcount the client gave us, not to an invented capacity
  // assumption. Volume x minutes / hours-per-FTE produces a saving larger than
  // the team that actually runs the process, which loses the room instantly.
  // The defensible quantity is the *share* of effort that is recoverable; their
  // own stated headcount scales it, and it can never exceed that headcount.
  const recoverableMinutesPerUnit = activities.reduce((s, r) => s + r.recoverableMinutes, 0);
  const recoverableEffortShare =
    totalEffectiveMinutes > 0 ? recoverableMinutesPerUnit / totalEffectiveMinutes : 0;
  const fteEquivalent = input.fteCount * recoverableEffortShare;
  const hoursPerMonth = fteEquivalent * HOURS_PER_FTE_MONTH;

  // ---- challenges still in play ----
  const liveChallengeIds = Array.from(
    new Set(
      activities
        .filter((r) => MODE_WEIGHT[r.currentMode] < MODE_WEIGHT.automated)
        .flatMap((r) => r.activity.challengeIds)
    )
  );

  return {
    activities,
    totalEffectiveMinutes,
    scores: { benchmark: sBenchmark, current: sCurrent, achievable },
    waterfall,
    savings: {
      recoverableMinutesPerUnit,
      recoverableEffortShare,
      hoursPerMonth,
      fteEquivalent,
      annualCost: fteEquivalent * input.costPerFteAnnual,
    },
    liveChallengeIds,
  };
}

/** Rank agents by the minutes they would give back across the activities they cover. */
export function recommendAgents(model: ProcessModel, result: AssessmentResult) {
  const byAgent = new Map<string, { minutes: number; activityIds: string[] }>();

  for (const r of result.activities) {
    if (r.recoverableMinutes <= 0) continue;
    for (const agentId of r.activity.agentIds) {
      const entry = byAgent.get(agentId) ?? { minutes: 0, activityIds: [] };
      entry.minutes += r.recoverableMinutes;
      entry.activityIds.push(r.activity.id);
      byAgent.set(agentId, entry);
    }
  }

  return model.agents
    .map((agent) => ({ agent, ...(byAgent.get(agent.id) ?? { minutes: 0, activityIds: [] }) }))
    .filter((m) => m.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}
