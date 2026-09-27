"use client";

import { Fragment } from "react";
import { RotateCcw } from "lucide-react";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";
import { CapabilityRow } from "@/components/assessments/CapabilityRow";
import { StepFooter } from "@/components/assessments/StepFooter";

export default function AssessmentStep() {
  const { definition, outcome, setAnswer, clearAnswer, markComplete, reset, input } =
    useAssessmentRun();

  const corrected = outcome.counts.corrected;

  return (
    <div>
      {/* Live totals, so the room sees the effect of each correction as it is made. */}
      <div className="sticky top-16 z-30 -mx-6 mb-8 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur-sm print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            <Live label="Business" value={outcome.overall.byGroup.business} tone="#2649a8" />
            <Live label="Agentic" value={outcome.overall.byGroup.agentic} tone="#8B5CF6" />
            <span className="text-xs font-semibold text-slate-400">
              {corrected} of {outcome.counts.capabilities} corrected
            </span>
          </div>
          {corrected > 0 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-blue"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset all
            </button>
          )}
        </div>
      </div>

      <div className="mb-8 max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
          Step 2 of 3
        </p>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
          Assessment
        </h1>
        <p className="leading-relaxed text-slate-600">
          Every row starts on the benchmark position. Work down the list and move only what is
          wrong — the dashed ring marks where each row started, so what you changed stays visible.
        </p>
      </div>

      {definition.groups.map((group) => {
        const rows = outcome.capabilities.filter((c) => c.capability.groupId === group.id);
        return (
          <Fragment key={group.id}>
            <div className="mb-4 mt-10 first:mt-0">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{group.label}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{group.blurb}</p>
            </div>
            <div className="space-y-3">
              {rows.map((result) => (
                <CapabilityRow
                  key={result.capability.id}
                  result={result}
                  benchmark={outcome.benchmark.rows[result.capability.id]}
                  rubric={definition.rubric}
                  onChange={(scale, level) => setAnswer(result.capability.id, scale, level)}
                  onReset={() => clearAnswer(result.capability.id)}
                />
              ))}
            </div>
          </Fragment>
        );
      })}

      <StepFooter
        back={{ href: `/assessments/${definition.slug}`, label: "Back to scope" }}
        next={{
          href: `/assessments/${definition.slug}/results`,
          label: input.completedOn ? "See results" : "Complete and see results",
          onClick: markComplete,
        }}
      />
    </div>
  );
}

function Live({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tone }} />
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold tabular-nums text-slate-900">{value.toFixed(1)}</span>
    </span>
  );
}
