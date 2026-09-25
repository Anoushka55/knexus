"use client";

import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { useSmbAssessment } from "@/components/smb/SmbAssessmentContext";
import { landscapes, segments } from "@/data/smb/assessment";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all";

export default function SmbContextPage() {
  const { segment, landscape, setSegment, setLandscape } = useSmbAssessment();

  const segmentInfo = segments.find((s) => s.id === segment);
  const landscapeInfo = landscapes.find((l) => l.id === landscape);

  return (
    <>
      <section className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-3">
              SMB Assessment
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-3">
              Set the context
            </h1>
            <p className="text-slate-600 leading-relaxed">
              SMBs don&rsquo;t buy technology products, they buy outcomes. Pick what you already
              know from the conversation so far — everything downstream starts from a guess based
              on this, which the client then corrects.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-10 max-w-3xl">
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
              Company size
            </label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as typeof segment)}
              className={inputClass}
            >
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="rounded-lg bg-brand-soft border border-brand-blue/15 p-3 flex gap-2">
              <Info className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">{segmentInfo?.note}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
              Current IT landscape
            </label>
            <select
              value={landscape}
              onChange={(e) => setLandscape(e.target.value as typeof landscape)}
              className={inputClass}
            >
              {landscapes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <div className="rounded-lg bg-brand-soft border border-brand-blue/15 p-3 flex gap-2">
              <Info className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">{landscapeInfo?.note}</p>
            </div>
          </div>
        </div>

        <p className={cn("mt-8 text-xs text-slate-400 leading-relaxed max-w-2xl")}>
          Nothing here connects to the client&rsquo;s systems. This is what you already know from
          the sales conversation — the next screen pre-fills a guess from it, which you correct
          live as the client tells you what&rsquo;s actually true.
        </p>

        <div className="mt-12 flex justify-end border-t border-slate-200 pt-6">
          <Link
            href="/capability-map/smb-assessment/baseline"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-dark transition-colors shadow-sm"
          >
            Continue to baseline
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
