"use client";

import Link from "next/link";
import { MetricsRow } from "@/components/solutions/MetricsRow";
import { useAssessment } from "@/components/test/AssessmentContext";
import { RoadmapMap } from "@/components/test/RoadmapMap";
import { landscapes, p2p } from "@/data/finance/p2p";
import { recommendAgents } from "@/lib/assessment/scoring";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function inr(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function RoadmapPage() {
  const { input, result } = useAssessment();

  const landscapeLabel = landscapes.find((l) => l.id === input.landscape)?.label ?? "";
  const openCount = result.activities.filter((r) => r.recoverableMinutes > 0.5).length;
  const agentCount = recommendAgents(p2p, result).length;

  const metrics = [
    { value: pct(result.scores.current), label: "Automation level today, on their own answers." },
    { value: pct(result.scores.achievable), label: "Achievable once the named activities are addressed." },
    { value: `${openCount}`, label: "Activities still carrying recoverable human effort." },
    { value: `${agentCount}`, label: "Agents in the inventory that already cover them." },
    { value: inr(result.savings.annualCost), label: "Annual cost equivalent of the gap." },
  ];

  return (
    <>
      <section className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-4">
              {landscapeLabel} &middot; {input.sector} &middot; Procure to Pay
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4">
              What we would do about it
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Hover any node to see everything it connects to across activities, challenges, agents
              and proof points — click to lock.
            </p>
          </div>
        </div>
      </section>

      <MetricsRow
        metrics={metrics}
        source={`Derived from the ${result.activities.length} activities walked on the baseline screen, weighted for a ${input.sector.toLowerCase()} invoice mix and the operational drag captured in the context step.`}
      />

      <section className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
        <RoadmapMap />

        <div className="mt-12 flex justify-between border-t border-slate-200 pt-6">
          <Link
            href="/test/scorecard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Back to scorecard
          </Link>
          <Link
            href="/test"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Start another assessment
          </Link>
        </div>
      </section>
    </>
  );
}
