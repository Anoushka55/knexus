"use client";

import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";
import { useIsRestricted } from "@/components/providers/SessionProvider";
import { useAssessmentRun } from "../AssessmentRunContext";
import { Panel } from "../Card";
import type { Opportunity } from "@/lib/assessments/opportunities";

/**
 * Gaps turned into named agents.
 *
 * This is the part a maturity survey cannot do, so it is worth being precise
 * rather than enthusiastic: each card states how many rungs the agent actually
 * closes, and whether it reaches the target or only part of the way.
 */
export function Recommendations() {
  const { opportunities } = useAssessmentRun();
  const restricted = useIsRestricted();
  const { opportunities: ranked, forgeCandidates } = opportunities;

  const uncovered = forgeCandidates.filter((c) => c.reason === "no-agent");
  const beyondReach = forgeCandidates.filter((c) => c.reason === "no-lever");

  return (
    <div className="space-y-6">
      <Panel title={`Recommended AI opportunities (${ranked.length})`}>
        <p className="mb-4 text-sm leading-relaxed text-slate-500">
          Ranked by how many rungs of agentic maturity each agent closes across the capabilities
          it is mapped to, counting its three strongest.
        </p>
        <ol className="space-y-3">
          {ranked.map((o, i) => (
            <OpportunityCard key={o.agent.id} opportunity={o} rank={i + 1} />
          ))}
        </ol>
      </Panel>

      {uncovered.length > 0 && (
        <Panel title={`No agent covers this yet (${uncovered.length})`} icon={<Hammer className="h-4 w-4 text-amber-500" />}>
          <p className="mb-4 text-sm leading-relaxed text-slate-500">
            These capabilities are short of target and nothing in the catalogue addresses them.
            They are the honest candidates for a purpose-built agent.
          </p>
          <ul className="space-y-2">
            {uncovered.map((c) => (
              <li
                key={c.result.capability.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {c.result.capability.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {c.result.group.label} · agentic {c.result.agentic} against a{" "}
                    {c.result.target} target
                  </p>
                </div>
                {!restricted && (
                  <Link
                    href="/forge"
                    className="flex-shrink-0 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue-dark print:hidden"
                  >
                    Build in Forge
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {beyondReach.length > 0 && (
        <Panel title={`Beyond current catalogue reach (${beyondReach.length})`}>
          <p className="mb-3 text-sm leading-relaxed text-slate-500">
            These are already at a level the mapped agents cannot lift them past. Closing them
            needs either a more autonomous agent than the catalogue currently holds, or change
            that is not agent-shaped at all.
          </p>
          <ul className="flex flex-wrap gap-2">
            {beyondReach.map((c) => (
              <li
                key={c.result.capability.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                {c.result.capability.label}
                <span className="ml-1.5 font-normal text-slate-400">
                  {c.result.agentic} → {c.result.target}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function OpportunityCard({ opportunity: o, rank }: { opportunity: Opportunity; rank: number }) {
  return (
    <li className="rounded-xl border border-slate-200 p-4 print:break-inside-avoid">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-[0.7rem] font-bold text-brand-blue">
          {rank}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Link
              href={`/agents/${o.agent.id}`}
              className="text-sm font-bold text-slate-900 hover:text-brand-blue"
            >
              {o.agent.title}
            </Link>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-bold text-slate-500">
              Reaches level {o.reach}
            </span>
            <span className="rounded bg-green-50 px-1.5 py-0.5 text-[0.65rem] font-bold text-green-700">
              {o.totalRungs} rung{o.totalRungs === 1 ? "" : "s"}
            </span>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-slate-500">{o.rationale}</p>

          <ul className="mb-3 space-y-1">
            {o.covers.map((c) => (
              <li
                key={c.result.capability.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="truncate text-slate-600">{c.result.capability.label}</span>
                <span className="flex flex-shrink-0 items-center gap-2">
                  <span className="tabular-nums text-slate-400">
                    {c.result.agentic} → {Math.min(o.reach, c.result.target)}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${
                      c.coverage === "full"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {c.coverage}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            {o.tags.map((t) => (
              <span
                key={t}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-500"
              >
                {t}
              </span>
            ))}
            <Link
              href={`/agents/${o.agent.id}`}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline print:hidden"
            >
              View agent <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
