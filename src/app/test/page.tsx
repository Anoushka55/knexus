"use client";

import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { useAssessment } from "@/components/test/AssessmentContext";
import { landscapes, p2p } from "@/data/finance/p2p";
import type { LandscapeId } from "@/lib/assessment/types";
import { cn } from "@/lib/utils";

const SECTORS = ["Telecom", "Media", "Technology", "Consumer & Retail", "Power & Energy", "Financial Services"];
const LOCATIONS = ["Offshore GCC", "Onshore", "Nearshore", "Hybrid"];

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
      <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all";

export default function ContextPage() {
  const { input, setInput } = useAssessment();

  const mixTotal = p2p.variants.reduce((sum, v) => sum + (input.mix[v.id] ?? 0), 0);

  function setMix(variantId: string, value: number) {
    setInput({ mix: { ...input.mix, [variantId]: value } });
  }

  function setAdjuster(key: keyof typeof input.adjusters, value: number) {
    setInput({ adjusters: { ...input.adjusters, [key]: value } });
  }

  return (
    <>
      <section className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-3">
              Finance &middot; Shared Services
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-3">
              Set the context
            </h1>
            <p className="text-slate-600 leading-relaxed">
              Nothing here connects to the client&rsquo;s systems. You pick what you already know
              from the sales call; the tool then asserts what is normally true for that landscape,
              and the client corrects it in the room.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* ---- left: the basics ---- */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              1 &middot; Engagement
            </h2>

            <Field label="Sector">
              <select
                value={input.sector}
                onChange={(e) => setInput({ sector: e.target.value })}
                className={inputClass}
              >
                {SECTORS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field label="Process">
              <select value={input.processId} disabled className={cn(inputClass, "text-slate-500")}>
                <option value="procure-to-pay">Procure to Pay</option>
              </select>
            </Field>

            <Field label="ERP landscape" hint="This is the whole of the &ldquo;client environment&rdquo; input.">
              <select
                value={input.landscape}
                onChange={(e) => setInput({ landscape: e.target.value as LandscapeId })}
                className={inputClass}
              >
                {landscapes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="rounded-lg bg-brand-soft border border-brand-blue/15 p-3 flex gap-2">
              <Info className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                {landscapes.find((l) => l.id === input.landscape)?.note}
              </p>
            </div>
          </div>

          {/* ---- middle: the mix ---- */}
          <div className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold text-slate-900">2 &middot; Invoice mix</h2>
              <span
                className={cn(
                  "text-xs font-bold",
                  Math.round(mixTotal) === 100 ? "text-brand-green" : "text-amber-600"
                )}
              >
                {Math.round(mixTotal)}%
              </span>
            </div>

            {p2p.variants.map((v) => (
              <div key={v.id}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800">{v.label}</span>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    {input.mix[v.id] ?? 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={input.mix[v.id] ?? 0}
                  onChange={(e) => setMix(v.id, Number(e.target.value))}
                  className="w-full accent-brand-blue"
                />
                <p className="text-xs text-slate-400 leading-snug">{v.note}</p>
              </div>
            ))}

            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              Shares are normalised, so they need not total exactly 100. A capex-heavy mix costs
              far more in matching and coding than a PO-backed one.
            </p>
          </div>

          {/* ---- right: scale and drag ---- */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              3 &middot; Scale &amp; operational drag
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Volume / month">
                <input
                  type="number"
                  value={input.volumePerMonth}
                  onChange={(e) => setInput({ volumePerMonth: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
              <Field label="Team size (FTE)">
                <input
                  type="number"
                  value={input.fteCount}
                  onChange={(e) => setInput({ fteCount: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Delivery model">
                <select
                  value={input.location}
                  onChange={(e) => setInput({ location: e.target.value })}
                  className={inputClass}
                >
                  {LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Cost / FTE / yr (₹)">
                <input
                  type="number"
                  step={50000}
                  value={input.costPerFteAnnual}
                  onChange={(e) => setInput({ costPerFteAnnual: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
            </div>

            {(
              [
                { key: "exceptionRate", label: "Exception rate", hint: "Invoices that fall out" },
                { key: "firstTimeMatchRate", label: "First-time match rate", hint: "Matched with no touch" },
                { key: "creditNoteRate", label: "Credit note / cancellation rate", hint: "Share of volume" },
              ] as const
            ).map((adj) => (
              <div key={adj.key}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800">{adj.label}</span>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    {Math.round(input.adjusters[adj.key] * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(input.adjusters[adj.key] * 100)}
                  onChange={(e) => setAdjuster(adj.key, Number(e.target.value) / 100)}
                  className="w-full accent-brand-blue"
                />
                <p className="text-xs text-slate-400 leading-snug">{adj.hint}</p>
              </div>
            ))}

            <Field label="Remarks">
              <textarea
                rows={3}
                value={input.remarks}
                onChange={(e) => setInput({ remarks: e.target.value })}
                placeholder="Anything specific the client told you — entity count, shift pattern, systems in flight…"
                className={cn(inputClass, "resize-none")}
              />
            </Field>
          </div>
        </div>

        <div className="mt-12 flex justify-end border-t border-slate-200 pt-6">
          <Link
            href="/test/baseline"
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
