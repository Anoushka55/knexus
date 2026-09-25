"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useSmbAssessment } from "@/components/smb/SmbAssessmentContext";
import { landscapes, painLabel, segments } from "@/data/smb/assessment";
import { cn } from "@/lib/utils";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default function SmbScorecardPage() {
  const { segment, landscape, result } = useSmbAssessment();

  const segmentLabel = segments.find((s) => s.id === segment)?.label ?? "";
  const landscapeLabel = landscapes.find((l) => l.id === landscape)?.label ?? "";
  const { recommended, coverageByBundle, scoreablePainIds, overarchingSelected } = result;

  return (
    <>
      <section className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-3">
              {segmentLabel} &middot; {landscapeLabel}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-3">
              The recommended bundle
            </h1>
            <p className="text-slate-600 leading-relaxed">
              One bundle, not a product list — built from exactly the pains the client confirmed.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        {scoreablePainIds.length === 0 && overarchingSelected.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center max-w-2xl">
            <p className="text-sm text-slate-400">
              No pains confirmed yet — go back to the baseline and check at least one.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              {recommended && (
                <div className="rounded-2xl border-2 border-brand-blue bg-brand-soft/40 p-6 mb-8">
                  <div className="flex items-baseline justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-brand-blue mb-1">
                        Best fit
                      </p>
                      <h2 className="text-2xl font-extrabold text-slate-900">
                        {recommended.bundle.label}
                      </h2>
                    </div>
                    <p className="text-3xl font-extrabold text-brand-navy tabular-nums">
                      {pct(recommended.coverage)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {recommended.bundle.components.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-white border border-brand-blue/20 px-2.5 py-1 text-xs font-medium text-brand-blue"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-slate-600">
                    Covers {recommended.coveredPainIds.length} of {scoreablePainIds.length} confirmed
                    pains
                    {overarchingSelected.length > 0
                      ? ` — plus ${overarchingSelected.length === 1 ? "the" : "both"} overarching need${
                          overarchingSelected.length > 1 ? "s" : ""
                        } below, which any bundle satisfies.`
                      : "."}
                  </p>
                </div>
              )}

              <h3 className="text-sm font-bold text-slate-900 mb-3">All three bundles compared</h3>
              <div className="space-y-3">
                {coverageByBundle
                  .slice()
                  .sort((a, b) => b.coverage - a.coverage)
                  .map((c) => (
                    <div
                      key={c.bundle.id}
                      className={cn(
                        "rounded-xl border p-4",
                        c.bundle.id === recommended?.bundle.id
                          ? "border-brand-blue bg-white"
                          : "border-slate-200 bg-slate-50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className="text-sm font-bold text-slate-900">{c.bundle.label}</p>
                        <p className="text-sm font-bold text-slate-600 tabular-nums">
                          {pct(c.coverage)}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full bg-brand-blue"
                          style={{ width: `${Math.max(2, c.coverage * 100)}%` }}
                        />
                      </div>
                      {c.coveredPainIds.length > 0 && (
                        <div className="flex items-start gap-1.5 mb-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-green flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-600 leading-snug">
                            {c.coveredPainIds.map((id) => painLabel(id)).join(" · ")}
                          </p>
                        </div>
                      )}
                      {c.uncoveredPainIds.length > 0 && (
                        <div className="flex items-start gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-400 leading-snug">
                            Doesn&rsquo;t reach: {c.uncoveredPainIds.map((id) => painLabel(id)).join(" · ")}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Confirmed pains</h3>
              <ul className="space-y-2">
                {scoreablePainIds.map((id) => (
                  <li
                    key={id}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
                  >
                    {painLabel(id)}
                  </li>
                ))}
                {overarchingSelected.map((id) => (
                  <li
                    key={id}
                    className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500"
                  >
                    {painLabel(id)}{" "}
                    <span className="text-xs text-slate-400">— satisfied by any bundle</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-12 flex justify-between border-t border-slate-200 pt-6">
          <Link
            href="/capability-map/smb-assessment/baseline"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Back to baseline
          </Link>
          <Link
            href="/capability-map/smb-assessment/roadmap"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-dark transition-colors shadow-sm"
          >
            See how it all connects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
