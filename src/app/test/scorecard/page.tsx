"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useAssessment } from "@/components/test/AssessmentContext";
import { landscapes, p2p } from "@/data/finance/p2p";
import { cn } from "@/lib/utils";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function inr(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function Dial({ value, label, tone }: { value: number; label: string; tone: "muted" | "primary" | "green" }) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const color =
    tone === "primary" ? "#1a3a8f" : tone === "green" ? "#16a34a" : "#cbd5e1";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
        />
      </svg>
      <p
        className={cn(
          "-mt-[76px] text-3xl font-extrabold tabular-nums",
          tone === "primary" ? "text-brand-navy" : tone === "green" ? "text-brand-green" : "text-slate-400"
        )}
      >
        {pct(value)}
      </p>
      <p className="mt-10 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

export default function ScorecardPage() {
  const { input, result } = useAssessment();

  const landscapeLabel = landscapes.find((l) => l.id === input.landscape)?.label ?? "";
  const challenges = p2p.challenges.filter((c) => result.liveChallengeIds.includes(c.id));

  // Waterfall bars are positioned between the previous running value and this one,
  // so the chart is a rendering of the numbers rather than a second source of them.
  let prev = result.waterfall[0].running;

  return (
    <>
      <section className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-3">
              {landscapeLabel} &middot; {input.sector} &middot; Procure to Pay
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-3">
              Where you actually are
            </h1>
            <p className="text-slate-600 leading-relaxed">
              Every number below traces back to a row the client confirmed themselves.
            </p>
          </div>
        </div>
      </section>

      {/* ---- the three numbers ---- */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-around">
              <Dial value={result.scores.benchmark} label="Benchmark" tone="muted" />
              <Dial value={result.scores.current} label="Your actual" tone="primary" />
              <Dial value={result.scores.achievable} label="Achievable" tone="green" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  value: pct(result.savings.recoverableEffortShare),
                  label: "Of total process effort is recoverable",
                },
                {
                  value: result.savings.fteEquivalent.toFixed(0),
                  label: `FTE of the ${input.fteCount} running this today`,
                },
                {
                  value: inr(result.savings.annualCost),
                  label: "Annual cost equivalent",
                },
                {
                  value: `${result.savings.recoverableMinutesPerUnit.toFixed(0)} min`,
                  label: `Per ${p2p.unit}, of ${result.totalEffectiveMinutes.toFixed(0)} today`,
                },
              ].map((m) => (
                <div key={m.label} className="border-t-2 border-brand-blue pt-3">
                  <p className="text-3xl font-extrabold tracking-tight text-brand-navy tabular-nums">
                    {m.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 leading-snug">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- the reverse calculation ---- */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-1">The reverse calculation</h2>
            <p className="text-sm text-slate-500 mb-8">
              How the benchmark becomes their number, and their number becomes the opportunity.
            </p>

            <div className="space-y-1.5">
              {result.waterfall.map((step, i) => {
                const isTotal = step.kind === "total" || step.kind === "start";
                const from = isTotal ? 0 : Math.min(prev, step.running);
                const to = isTotal ? step.running : Math.max(prev, step.running);
                prev = step.running;

                return (
                  <div
                    key={`${step.label}-${i}`}
                    className={cn(
                      "grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,15rem)_1fr_auto] items-center gap-3 rounded-lg px-3 py-2",
                      isTotal && "bg-slate-50 border border-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm leading-snug",
                        isTotal ? "font-bold text-slate-900" : "text-slate-600"
                      )}
                    >
                      {step.label}
                    </span>

                    <div className="hidden sm:block relative h-5 rounded bg-slate-100">
                      <div
                        className={cn(
                          "absolute inset-y-0 rounded transition-all",
                          step.kind === "up" && "bg-brand-green/70",
                          step.kind === "down" && "bg-red-400/70",
                          isTotal && "bg-brand-navy"
                        )}
                        style={{
                          left: `${Math.max(0, from) * 100}%`,
                          width: `${Math.max(0.5, (to - from)) * 100}%`,
                        }}
                      />
                    </div>

                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums text-right whitespace-nowrap",
                        isTotal
                          ? "text-brand-navy"
                          : step.kind === "up"
                            ? "text-brand-green"
                            : "text-red-500"
                      )}
                    >
                      {isTotal
                        ? pct(step.running)
                        : `${step.valuePp >= 0 ? "+" : ""}${step.valuePp.toFixed(1)}pp`}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-5 text-xs text-slate-400 leading-relaxed max-w-2xl">
              Each step releases exactly one variable and re-runs the same scoring function, so the
              chart cannot drift from the headline number. The floor is the roughly 5% that always
              needs a human eye, on an exception basis.
            </p>
          </div>

          {/* ---- challenges ---- */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">What this means day to day</h2>
            <p className="text-sm text-slate-500 mb-6">
              Surfaced by the rows still sitting below automated. Confirm these with the client.
            </p>

            <ul className="space-y-2.5">
              {challenges.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-card"
                >
                  <p className="text-sm text-slate-700 leading-snug">{c.label}</p>
                </li>
              ))}
              {challenges.length === 0 && (
                <li className="rounded-lg border border-dashed border-slate-200 p-4">
                  <p className="text-sm text-slate-400">
                    Nothing below automated — this estate is already in good shape.
                  </p>
                </li>
              )}
            </ul>

            <div className="mt-6 rounded-lg bg-brand-soft border border-brand-blue/15 p-4 flex gap-2.5">
              <TrendingUp className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Closing the gap to {pct(result.scores.achievable)} is worth{" "}
                <span className="font-bold text-brand-navy">
                  {result.savings.fteEquivalent.toFixed(1)} FTE
                </span>{" "}
                at today&rsquo;s volume of {input.volumePerMonth.toLocaleString("en-IN")}{" "}
                {p2p.unit}s a month.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between border-t border-slate-200 pt-6">
          <Link
            href="/test/baseline"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Back to baseline
          </Link>
          <Link
            href="/test/roadmap"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-dark transition-colors shadow-sm"
          >
            What we would do about it
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
