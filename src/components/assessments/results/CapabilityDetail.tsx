"use client";

import { useAssessmentRun } from "../AssessmentRunContext";
import { Panel } from "../Card";
import { CHART } from "../charts/palette";
import type { CapabilityResult } from "@/lib/assessments/scoring";

/**
 * Every capability, grouped, with both scales and the target side by side.
 *
 * A table rather than the dashboard's heatmap: the heatmap shows one scale at a
 * time behind a dropdown, which works on screen and fails on paper. Here all
 * three numbers are visible at once and survive printing.
 */
export function CapabilityDetail() {
  const { outcome } = useAssessmentRun();

  return (
    <div className="space-y-4">
      {outcome.groups.map((group) => (
        <Panel key={group.group.id} title={group.group.label}>
          <p className="mb-3 text-xs leading-relaxed text-slate-500">{group.group.blurb}</p>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-400">
                <th className="py-1.5 font-semibold">Capability</th>
                <th className="w-20 py-1.5 text-right font-semibold">Business</th>
                <th className="w-20 py-1.5 text-right font-semibold">Agentic</th>
                <th className="w-16 py-1.5 text-right font-semibold">Target</th>
                <th className="w-14 py-1.5 text-right font-semibold">Gap</th>
              </tr>
            </thead>
            <tbody>
              {group.capabilities.map((c) => (
                <Row key={c.capability.id} result={c} />
              ))}
              <tr className="border-t border-slate-200 font-bold text-slate-700">
                <td className="py-1.5">Group average</td>
                <td className="py-1.5 text-right tabular-nums">
                  {group.scores.business.toFixed(1)}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {group.scores.agentic.toFixed(1)}
                </td>
                <td className="py-1.5 text-right tabular-nums">{group.target.toFixed(1)}</td>
                <td className="py-1.5 text-right tabular-nums">{group.gapScore}</td>
              </tr>
            </tbody>
          </table>
        </Panel>
      ))}
    </div>
  );
}

function Row({ result }: { result: CapabilityResult }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-1.5 pr-3 text-slate-600">
        {result.capability.label}
        {result.corrected && (
          <span className="ml-1.5 text-[0.62rem] font-bold uppercase tracking-wide text-brand-blue">
            corrected
          </span>
        )}
      </td>
      <td className="py-1.5 text-right">
        <Value value={result.business} color={CHART.business} />
      </td>
      <td className="py-1.5 text-right">
        <Value value={result.agentic} color={CHART.agentic} />
      </td>
      <td className="py-1.5 text-right font-semibold tabular-nums text-slate-700">
        {result.target}
      </td>
      <td
        className={`py-1.5 text-right font-bold tabular-nums ${
          result.isPriority ? "text-red-600" : result.gapScore > 0 ? "text-amber-600" : "text-slate-300"
        }`}
      >
        {result.gapScore || "—"}
      </td>
    </tr>
  );
}

function Value({ value, color }: { value: number; color: string }) {
  return (
    <span className="inline-flex items-center justify-end gap-1.5 tabular-nums text-slate-700">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {value}
    </span>
  );
}
