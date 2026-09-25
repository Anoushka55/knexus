"use client";

import Link from "next/link";
import { SmbRoadmapMap } from "@/components/smb/SmbRoadmapMap";
import { useSmbAssessment } from "@/components/smb/SmbAssessmentContext";
import { landscapes, segments } from "@/data/smb/assessment";

export default function SmbRoadmapPage() {
  const { segment, landscape } = useSmbAssessment();
  const segmentLabel = segments.find((s) => s.id === segment)?.label ?? "";
  const landscapeLabel = landscapes.find((l) => l.id === landscape)?.label ?? "";

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="max-w-2xl mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-3">
          {segmentLabel} &middot; {landscapeLabel}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-3">
          How it all connects
        </h1>
        <p className="text-slate-600 leading-relaxed">
          Hover any confirmed pain or bundle to trace what it connects to — click to lock.
        </p>
      </div>

      <SmbRoadmapMap />

      <p className="mt-4 text-xs text-slate-400 leading-relaxed max-w-3xl">
        Pains, services and bundles are illustrative, informed by common managed-services
        engagement patterns — not any specific provider or client.
      </p>

      <div className="mt-10 flex justify-between border-t border-slate-200 pt-6">
        <Link
          href="/capability-map/smb-assessment/scorecard"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Back to scorecard
        </Link>
        <Link
          href="/capability-map/smb-assessment"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Start another assessment
        </Link>
      </div>
    </section>
  );
}
