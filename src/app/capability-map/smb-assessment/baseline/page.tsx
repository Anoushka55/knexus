"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useSmbAssessment } from "@/components/smb/SmbAssessmentContext";
import { isDefaultPain, landscapes, pains, segments } from "@/data/smb/assessment";
import { cn } from "@/lib/utils";

export default function SmbBaselinePage() {
  const { segment, landscape, selectedPainIds, togglePain, resetToDefaults } = useSmbAssessment();

  const segmentLabel = segments.find((s) => s.id === segment)?.label ?? "";
  const landscapeLabel = landscapes.find((l) => l.id === landscape)?.label ?? "";
  const movedCount = pains.filter(
    (p) => selectedPainIds.includes(p.id) !== isDefaultPain(p, segment, landscape)
  ).length;

  return (
    <>
      <div className="sticky top-16 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-slate-800">{segmentLabel}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{landscapeLabel}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">
              {selectedPainIds.length} of {pains.length} confirmed
              {movedCount > 0 ? ` · ${movedCount} corrected` : ""}
            </span>
          </div>

          <button
            type="button"
            onClick={resetToDefaults}
            disabled={movedCount === 0}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              movedCount > 0
                ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                : "border-slate-100 text-slate-300 cursor-not-allowed"
            )}
          >
            <RotateCcw className="h-3 w-3" />
            Reset to guess
          </button>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="max-w-2xl mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
            Walk the pains
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Every row is pre-filled with what&rsquo;s normally true for {segmentLabel.toLowerCase()}{" "}
            on {landscapeLabel.toLowerCase()}. Read them out; when the client corrects you, click.
            The dashed ring shows where the guess started.
          </p>
        </div>

        <div className="space-y-2">
          {pains.map((pain) => {
            const selected = selectedPainIds.includes(pain.id);
            const wasDefault = isDefaultPain(pain, segment, landscape);
            const moved = selected !== wasDefault;

            return (
              <button
                key={pain.id}
                type="button"
                onClick={() => togglePain(pain.id)}
                aria-pressed={selected}
                className={cn(
                  "w-full text-left rounded-lg border p-4 transition-colors flex items-start gap-4",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
                  selected ? "border-brand-blue bg-brand-soft/40" : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    selected ? "border-brand-blue bg-brand-blue" : "border-slate-300",
                    moved && !selected && "border-dashed border-slate-400",
                    moved && selected && "ring-4 ring-brand-blue/15"
                  )}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{pain.label}</p>
                    {moved && (
                      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-brand-blue">
                        Corrected
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-snug">→ {pain.service}</p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-slate-400 leading-relaxed max-w-3xl">
          These are outcome statements, not products — nobody buys &ldquo;a cloud&rdquo; or &ldquo;a
          license,&rdquo; they buy &ldquo;make sure I don&rsquo;t get hit by ransomware.&rdquo;
        </p>

        <div className="mt-10 flex justify-between border-t border-slate-200 pt-6">
          <Link
            href="/capability-map/smb-assessment"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Back to context
          </Link>
          <Link
            href="/capability-map/smb-assessment/scorecard"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-dark transition-colors shadow-sm"
          >
            See the recommended bundle
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
