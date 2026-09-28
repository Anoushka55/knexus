"use client";

import { useState } from "react";
import { LEVELS, type Scale } from "@/lib/assessments/types";
import type { CapabilityResult } from "@/lib/assessments/scoring";
import { CHART, rampFor } from "./palette";

/**
 * Capabilities down, levels 1–5 across, one shaded cell at the achieved level.
 *
 * No number sits inside a cell: the darker ramp steps fall under AA against
 * white, and a value printed on every cell is noise anyway. The numbers live in
 * the gutter on the right, in ink.
 */
export function CapabilityHeatmap({
  capabilities,
  title,
  compact = false,
  onSelect,
}: {
  capabilities: CapabilityResult[];
  title?: string;
  /** Opens the capability in an overlay when a row is clicked. */
  onSelect?: (capabilityId: string) => void;
  /** Tighter rows and no caption, for the fixed-height cockpit. */
  compact?: boolean;
}) {
  const [scale, setScale] = useState<Scale>("business");
  const ramp = rampFor(scale);

  return (
    <figure className="m-0">
      <div className="mb-4 flex items-center justify-between gap-4">
        {title && <h3 className="text-sm font-bold tracking-tight text-slate-900">{title}</h3>}
        <label className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="sr-only">Scale shown</span>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as Scale)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="business">Business maturity</option>
            <option value="agentic">Agentic maturity</option>
          </select>
        </label>
      </div>

      <table className="w-full border-separate border-spacing-y-1 text-xs">
        <thead>
          <tr>
            <th className="w-[45%] pb-1 text-left font-semibold text-slate-400">Capability</th>
            {LEVELS.map((level) => (
              <th key={level} className="pb-1 text-center font-semibold text-slate-400">
                {level}
              </th>
            ))}
            <th className="w-10 pb-1 text-right font-semibold text-slate-400">Score</th>
          </tr>
        </thead>
        <tbody>
          {capabilities.map((c) => {
            const value = scale === "business" ? c.business : c.agentic;
            return (
              <tr
                key={c.capability.id}
                onClick={onSelect ? () => onSelect(c.capability.id) : undefined}
                className={onSelect ? "cursor-pointer hover:bg-slate-50" : undefined}
              >
                <td className="truncate pr-3 text-slate-600" title={c.capability.label}>
                  {c.capability.label}
                </td>
                {LEVELS.map((level) => {
                  const filled = level <= value;
                  return (
                    <td key={level} className="px-0.5">
                      <div
                        className={compact ? "h-4 rounded-sm" : "h-6 rounded"}
                        title={`${c.capability.label}: level ${value}`}
                        style={{
                          backgroundColor: filled ? ramp[level - 1] : CHART.track,
                        }}
                      />
                    </td>
                  );
                })}
                <td className="pl-2 text-right font-bold tabular-nums text-slate-700">{value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!compact && (
      <figcaption className="mt-2 text-[0.7rem] text-slate-400">
        Shaded to the level reached. Targets and gaps are in the full report.
      </figcaption>
      )}
    </figure>
  );
}
