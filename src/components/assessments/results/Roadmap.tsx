"use client";

import Link from "next/link";
import { useAssessmentRun } from "../AssessmentRunContext";
import { Panel } from "../Card";
import { CHART } from "../charts/palette";
import type { CapabilityResult } from "@/lib/assessments/scoring";
import type { Opportunity } from "@/lib/assessments/opportunities";

/**
 * Three waves, sequenced on what the result actually says rather than on a
 * calendar: close what is both badly short and already covered by an agent
 * first, then the rest of the gaps, then what has to be built.
 */
export function Roadmap() {
  const { outcome, opportunities } = useAssessmentRun();

  const agentFor = new Map<string, Opportunity>();
  for (const o of opportunities.opportunities) {
    for (const c of o.covers) {
      if (!agentFor.has(c.result.capability.id)) agentFor.set(c.result.capability.id, o);
    }
  }

  const gapped = outcome.gaps.filter((g) => g.gapScore > 0);
  const wave1 = gapped.filter((g) => g.isPriority && agentFor.has(g.capability.id));
  const wave2 = gapped.filter((g) => !g.isPriority && agentFor.has(g.capability.id));
  const wave3 = gapped.filter((g) => !agentFor.has(g.capability.id));

  const waves = [
    {
      title: "Wave 1 — prove it where the gap is widest",
      note: "Four or more rungs short, and an agent in the catalogue already reaches them. Fastest defensible progress.",
      rows: wave1,
      color: CHART.business,
    },
    {
      title: "Wave 2 — extend across the covered estate",
      note: "Real gaps with an agent available, but a shorter climb. Sequenced behind wave 1 to reuse what it establishes.",
      rows: wave2,
      color: CHART.agentic,
    },
    {
      title: "Wave 3 — build or re-scope",
      note: "No agent reaches these today. Either a Forge build, or change that is not agent-shaped.",
      rows: wave3,
      color: "#94a3b8",
    },
  ];

  return (
    <div className="space-y-6">
      <Panel title="Sequenced roadmap">
        <p className="mb-5 text-sm leading-relaxed text-slate-500">
          Ordered by what the assessment found, not by a fixed timeline. Each wave lists the
          capabilities it closes and the agent that does the closing.
        </p>

        <div className="space-y-6">
          {waves.map((wave) => (
            <div key={wave.title} className="print:break-inside-avoid">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: wave.color }}
                />
                <h3 className="text-sm font-bold text-slate-900">{wave.title}</h3>
                <span className="text-xs font-semibold text-slate-400">
                  {wave.rows.length} {wave.rows.length === 1 ? "capability" : "capabilities"}
                </span>
              </div>
              <p className="mb-3 pl-[1.15rem] text-xs leading-relaxed text-slate-500">
                {wave.note}
              </p>

              {wave.rows.length === 0 ? (
                <p className="pl-[1.15rem] text-xs italic text-slate-400">
                  Nothing falls into this wave.
                </p>
              ) : (
                <ul className="space-y-1.5 border-l-2 pl-4" style={{ borderColor: wave.color }}>
                  {wave.rows.map((row) => (
                    <WaveRow
                      key={row.capability.id}
                      result={row}
                      opportunity={agentFor.get(row.capability.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function WaveRow({
  result,
  opportunity,
}: {
  result: CapabilityResult;
  opportunity?: Opportunity;
}) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg px-2 py-1.5 hover:bg-slate-50">
      <span className="min-w-0">
        <span className="text-sm font-semibold text-slate-800">{result.capability.label}</span>
        <span className="ml-2 text-xs text-slate-400">{result.group.shortLabel}</span>
      </span>
      <span className="flex items-center gap-3 text-xs">
        <span className="tabular-nums text-slate-400">
          {result.agentic} → {result.target}
        </span>
        {opportunity ? (
          <Link
            href={`/agents/${opportunity.agent.id}`}
            className="font-semibold text-brand-blue hover:underline"
          >
            {opportunity.agent.title}
          </Link>
        ) : (
          <span className="font-semibold text-slate-400">Forge candidate</span>
        )}
      </span>
    </li>
  );
}
