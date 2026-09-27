"use client";

import { Info } from "lucide-react";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";
import { StepFooter } from "@/components/assessments/StepFooter";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-all focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20";

export default function IndustryScopeStep() {
  const { definition, input, outcome, setField } = useAssessmentRun();

  return (
    <div className="max-w-3xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
        Step 1 of 3
      </p>
      <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
        Industry &amp; scope
      </h1>
      <p className="mb-8 leading-relaxed text-slate-600">
        These choices set the starting position the grid is pre-filled with, and the wording on
        the report. Nothing here is scored — the score comes from what you correct in step two.
      </p>

      <div className="space-y-6">
        <Field
          label="Industry"
          hint="Shown on the report header. The capability set itself is telecom-shaped."
        >
          <input
            className={inputClass}
            value={input.industryLabel}
            onChange={(e) => setField({ industryLabel: e.target.value })}
          />
        </Field>

        <Field label="Benchmark" hint={outcome.benchmark.disclosure}>
          <select
            className={inputClass}
            value={input.benchmarkId}
            onChange={(e) => setField({ benchmarkId: e.target.value })}
          >
            {definition.benchmarks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Scope" hint="What the answers describe — the whole operator, or one part of it.">
          <div className="space-y-2">
            {definition.scopes.map((scope) => {
              const selected = input.scopeId === scope.id;
              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setField({ scopeId: scope.id })}
                  aria-pressed={selected}
                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-brand-blue bg-brand-soft"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-brand-blue" : "border-slate-300"
                    }`}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-brand-blue" />}
                  </span>
                  <span>
                    <span
                      className={`block text-sm font-semibold ${
                        selected ? "text-brand-blue" : "text-slate-800"
                      }`}
                    >
                      {scope.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">{scope.note}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Notes" hint="Optional. Carried onto the report.">
          <textarea
            className={`${inputClass} min-h-[5rem] resize-y`}
            value={input.notes}
            onChange={(e) => setField({ notes: e.target.value })}
            placeholder="Anything that frames this assessment — the business unit, the participants, the date it reflects."
          />
        </Field>
      </div>

      <div className="mt-8 flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
        <p className="text-xs leading-relaxed text-slate-500">
          {outcome.benchmark.disclosure}
        </p>
      </div>

      <StepFooter
        next={{
          href: `/assessments/${definition.slug}/assessment`,
          label: `Start the assessment — ${definition.capabilities.length} capabilities`,
        }}
      />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</label>
      {hint && <p className="mb-2 text-xs leading-relaxed text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}
