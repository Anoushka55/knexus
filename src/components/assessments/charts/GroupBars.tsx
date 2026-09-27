"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CHART } from "./palette";
import type { GroupResult } from "@/lib/assessments/scoring";

/** Six rows, two bars each, with a drill-in to that group's capabilities. */
export function GroupBars({
  groups,
  drillHref,
}: {
  groups: GroupResult[];
  /** Given a group id, where the chevron goes. Omit to render them inert. */
  drillHref?: (groupId: string) => string;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Legend color={CHART.business} label="Business maturity" />
        <Legend color={CHART.agentic} label="Agentic maturity" />
      </div>

      <ul className="space-y-3">
        {groups.map((g, index) => {
          const row = (
            <>
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 truncate text-sm font-semibold text-slate-800">
                  {index + 1}. {g.group.label}
                </p>
                <Bar value={g.scores.business} color={CHART.business} />
                <div className="h-1" />
                <Bar value={g.scores.agentic} color={CHART.agentic} />
              </div>
              <div className="w-10 flex-shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-slate-900">
                  {g.scores.business.toFixed(1)}
                </p>
                <p className="text-sm font-bold tabular-nums text-slate-400">
                  {g.scores.agentic.toFixed(1)}
                </p>
              </div>
            </>
          );

          return (
            <li key={g.group.id}>
              {drillHref ? (
                <Link
                  href={drillHref(g.group.id)}
                  className="flex items-center gap-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                >
                  {row}
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
                </Link>
              ) : (
                <div className="flex items-center gap-4 px-2 py-1.5">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full"
      style={{ backgroundColor: CHART.track }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(2, (value / 5) * 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
