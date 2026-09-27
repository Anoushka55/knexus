"use client";

import { challenges, priorities } from "@/data/tmtSolutions";
import { useAssessmentRun } from "../AssessmentRunContext";
import { CHART } from "../charts/palette";
import { Panel } from "../Card";
import type { CapabilityResult } from "@/lib/assessments/scoring";

const challengeById = new Map(challenges.map((c) => [c.id, c]));
const priorityById = new Map(priorities.map((p) => [p.id, p]));

/**
 * Every gapped capability, largest climb first, with the two scales shown
 * separately — a capability that is run well but unautomated is a different
 * problem from one that is neither, and averaging them would hide that.
 */
export function GapAnalysis() {
  const { outcome } = useAssessmentRun();
  const gaps = outcome.gaps.filter((g) => g.gapScore > 0);
  const clean = outcome.capabilities.filter((g) => g.gapScore === 0);

  return (
    <div className="space-y-6">
      <Panel title={`Maturity gaps (${gaps.length})`}>
        <ol className="space-y-3">
          {gaps.map((g, i) => (
            <GapRow key={g.capability.id} result={g} rank={i + 1} />
          ))}
        </ol>
      </Panel>

      {clean.length > 0 && (
        <Panel title={`At or above target (${clean.length})`}>
          <ul className="flex flex-wrap gap-2">
            {clean.map((c) => (
              <li
                key={c.capability.id}
                className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700"
              >
                {c.capability.label}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function GapRow({ result, rank }: { result: CapabilityResult; rank: number }) {
  const linkedChallenges = result.capability.challengeIds
    .map((id) => challengeById.get(id))
    .filter(Boolean);
  const linkedPriorities = result.capability.priorityIds
    .map((id) => priorityById.get(id))
    .filter(Boolean);

  return (
    <li className="rounded-xl border border-slate-200 p-4 print:break-inside-avoid">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[0.7rem] font-bold text-slate-500">
            {rank}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{result.capability.label}</p>
            <p className="mt-0.5 text-xs text-slate-400">{result.group.label}</p>
          </div>
        </div>
        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-bold ${
            result.isPriority ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
          }`}
        >
          Gap {result.gapScore}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ScaleBar
          label="Business"
          current={result.business}
          target={result.target}
          color={CHART.business}
        />
        <ScaleBar
          label="Agentic"
          current={result.agentic}
          target={result.target}
          color={CHART.agentic}
        />
      </div>

      {(linkedChallenges.length > 0 || linkedPriorities.length > 0) && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {linkedPriorities.length > 0 && (
            <p className="text-xs leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-600">Blocks:</span>{" "}
              {linkedPriorities.map((p) => p!.title).join(" · ")}
            </p>
          )}
          {linkedChallenges.length > 0 && (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {linkedChallenges.map((c) => c!.title).join(" · ")}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function ScaleBar({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-slate-500">{label}</span>
        <span className="tabular-nums text-slate-500">
          {current} → <span className="font-bold text-slate-800">{target}</span>
        </span>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: CHART.track }}
      >
        {/* The target sits as a lighter band behind the achieved value. */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-30"
          style={{ width: `${(target / 5) * 100}%`, backgroundColor: color }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${(current / 5) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
