"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useAssessment } from "@/components/test/AssessmentContext";
import { landscapes, p2p } from "@/data/finance/p2p";
import { MODES, MODE_HINT, MODE_LABEL, type ExecutionMode } from "@/lib/assessment/types";
import type { ActivityResult } from "@/lib/assessment/scoring";
import { cn } from "@/lib/utils";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function ModeCell({
  row,
  mode,
  onSet,
}: {
  row: ActivityResult;
  mode: ExecutionMode;
  onSet: (mode: ExecutionMode) => void;
}) {
  const selected = row.currentMode === mode;
  const isBenchmark = row.benchmarkMode === mode;
  const ghost = isBenchmark && !selected && row.moved;

  return (
    <td className="px-1 py-2 text-center">
      <button
        type="button"
        // Clicking the selected dot demotes straight to manual: the one-click
        // "we don't actually do that" motion. Any other column sets explicitly.
        onClick={() => onSet(selected ? "manual" : mode)}
        title={selected ? "Click to mark as manual" : MODE_HINT[mode]}
        aria-label={`${row.activity.label}: set ${MODE_LABEL[mode]}`}
        aria-pressed={selected}
        className="group relative inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue"
      >
        <span
          className={cn(
            "block rounded-full transition-all",
            selected
              ? "h-3.5 w-3.5 bg-brand-blue ring-4 ring-brand-blue/15"
              : ghost
                ? "h-3 w-3 border-2 border-dashed border-slate-400"
                : "h-2.5 w-2.5 border border-slate-300 group-hover:border-brand-blue"
          )}
        />
      </button>
    </td>
  );
}

export default function BaselinePage() {
  const { input, result, setMode, resetOverrides } = useAssessment();

  const landscapeLabel = landscapes.find((l) => l.id === input.landscape)?.label ?? "";
  const movedCount = result.activities.filter((r) => r.moved).length;
  const delta = result.scores.current - result.scores.benchmark;

  const byId = new Map(result.activities.map((r) => [r.activity.id, r]));

  return (
    <>
      {/* ---- sticky live score: consequence is what turns a checklist into an instrument ---- */}
      <div className="sticky top-16 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-slate-800">{landscapeLabel}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{input.sector}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">
              {movedCount} of {result.activities.length} corrected
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                KPMG benchmark
              </p>
              <p className="text-lg font-bold text-slate-400 tabular-nums leading-tight">
                {pct(result.scores.benchmark)}
              </p>
            </div>

            <ArrowRight className="h-4 w-4 text-slate-300" />

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-blue">
                Their actual
              </p>
              <p className="text-lg font-bold text-brand-navy tabular-nums leading-tight">
                {pct(result.scores.current)}
                <span
                  className={cn(
                    "ml-1.5 text-xs font-semibold",
                    delta < 0 ? "text-red-500" : delta > 0 ? "text-brand-green" : "text-slate-400"
                  )}
                >
                  {delta >= 0 ? "+" : ""}
                  {(delta * 100).toFixed(1)}pp
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={resetOverrides}
              disabled={movedCount === 0}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                movedCount > 0
                  ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                  : "border-slate-100 text-slate-300 cursor-not-allowed"
              )}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="max-w-2xl mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
            Walk the process
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Every row is pre-filled with what is normally true for {landscapeLabel}. Read them out;
            when the client says &ldquo;no, we still do that by hand&rdquo;, click. The dashed ring
            shows where the benchmark was.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-brand-navy text-white">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider w-20">
                  Min
                </th>
                {MODES.map((m) => (
                  <th
                    key={m}
                    className="px-1 py-3 text-center text-xs font-bold uppercase tracking-wider w-24"
                  >
                    {MODE_LABEL[m]}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider w-24">
                  Impact
                </th>
              </tr>
            </thead>

            <tbody>
              {p2p.stages.map((stage) => {
                // Highest-effort rows first, so the ten minutes you have go on
                // the rows that actually move the score.
                const rows = p2p.activities
                  .filter((a) => a.stageId === stage.id)
                  .map((a) => byId.get(a.id))
                  .filter((r): r is ActivityResult => Boolean(r))
                  .sort((a, b) => b.effectiveMinutes - a.effectiveMinutes);

                return (
                  <Fragment key={stage.id}>
                    <tr>
                      <td colSpan={7} className="bg-slate-50 px-4 py-2 border-y border-slate-200">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {stage.label}
                        </span>
                      </td>
                    </tr>

                    {rows.map((row) => (
                      <tr
                        key={row.activity.id}
                        className={cn(
                          "border-b border-slate-100 last:border-0 transition-colors",
                          row.moved ? "bg-brand-soft/40" : "hover:bg-slate-50/60"
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-slate-800 leading-snug">
                            {row.activity.label}
                          </p>
                          {row.activity.drivers.length > 0 && (
                            <p className="text-xs text-slate-400 leading-snug mt-0.5">
                              {row.activity.drivers.join(" · ")}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <span className="text-sm font-semibold text-slate-600 tabular-nums">
                            {row.effectiveMinutes.toFixed(0)}
                          </span>
                        </td>

                        {MODES.map((m) => (
                          <ModeCell
                            key={m}
                            row={row}
                            mode={m}
                            onSet={(mode) => setMode(row.activity.id, mode)}
                          />
                        ))}

                        <td className="px-4 py-2.5 text-right">
                          {row.moved ? (
                            <span
                              className={cn(
                                "text-xs font-bold tabular-nums",
                                row.deltaPp < 0 ? "text-red-500" : "text-brand-green"
                              )}
                            >
                              {row.deltaPp >= 0 ? "+" : ""}
                              {row.deltaPp.toFixed(1)}pp
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-400 leading-relaxed max-w-3xl">
          Minutes are per {p2p.unit}, weighted for the invoice mix and operational drag set on the
          previous screen — which is why they do not match the raw baseline. Clicking the filled dot
          demotes the row straight to manual.
        </p>

        <div className="mt-10 flex justify-between border-t border-slate-200 pt-6">
          <Link
            href="/test"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Back to context
          </Link>
          <Link
            href="/test/scorecard"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-dark transition-colors shadow-sm"
          >
            See the scorecard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
