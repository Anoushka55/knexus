"use client";

import { CHART } from "./palette";
import type { GroupResult } from "@/lib/assessments/scoring";

/**
 * Six-axis radar carrying both scales.
 *
 * Two translucent polygons over each other would read as a third colour where
 * they overlap, so identity is carried by the 2px strokes and the vertex dots,
 * the legend is not optional, and the same numbers are repeated in a <details>
 * table underneath for anyone not reading the picture.
 */

const SIZE = 340;
const CX = SIZE / 2;
const CY = SIZE / 2;
/** 56px of gutter, because six axis labels around a 340px box is tight. */
const R = SIZE / 2 - 56;
const MAX = 5;

export function MaturityRadar({
  groups,
  compact = false,
}: {
  groups: GroupResult[];
  /** Fills its container and drops the data table, for the fixed-height cockpit. */
  compact?: boolean;
}) {
  const n = groups.length;
  // Axis 0 at twelve o'clock, then clockwise.
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  // The centre is 0, not 1 — otherwise a genuine score of 1.0 vanishes.
  const radius = (value: number) => (Math.max(0, Math.min(MAX, value)) / MAX) * R;
  const point = (i: number, value: number) => ({
    x: CX + Math.cos(angle(i)) * radius(value),
    y: CY + Math.sin(angle(i)) * radius(value),
  });
  const polygon = (pick: (g: GroupResult) => number) =>
    groups.map((g, i) => {
      const p = point(i, pick(g));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const series = [
    { key: "business" as const, label: "Business maturity", color: CHART.business, pick: (g: GroupResult) => g.scores.business },
    { key: "agentic" as const, label: "Agentic maturity", color: CHART.agentic, pick: (g: GroupResult) => g.scores.agentic },
  ];

  return (
    <figure className={compact ? "m-0 flex h-full flex-col" : "m-0"}>
      <div className="flex flex-wrap items-center justify-end gap-4 pb-2">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={compact ? "mx-auto h-full w-full" : "mx-auto h-auto w-full max-w-[340px]"}
        role="img"
        aria-label="Maturity by capability group, business and agentic scales"
      >
        {/* Rings at every whole level, labelled up the vertical axis. */}
        {[1, 2, 3, 4, 5].map((level) => (
          <polygon
            key={level}
            points={groups
              .map((_, i) => {
                const p = point(i, level);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(" ")}
            fill="none"
            stroke={CHART.grid}
            strokeWidth={1}
          />
        ))}

        {groups.map((_, i) => {
          const p = point(i, MAX);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke={CHART.grid}
              strokeWidth={1}
            />
          );
        })}

        {[1, 2, 3, 4, 5].map((level) => (
          <text
            key={level}
            x={CX + 4}
            y={CY - radius(level) + 3}
            fontSize={9}
            fill="#94a3b8"
            className="select-none"
          >
            {level}
          </text>
        ))}

        {series.map((s) => (
          <polygon
            key={s.key}
            points={polygon(s.pick)}
            fill={s.color}
            fillOpacity={0.12}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}

        {series.map((s) =>
          groups.map((g, i) => {
            const p = point(i, s.pick(g));
            return (
              <circle
                key={`${s.key}-${g.group.id}`}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={s.color}
                stroke={CHART.surface}
                strokeWidth={1.5}
              />
            );
          }),
        )}

        {groups.map((g, i) => {
          const a = angle(i);
          const lx = CX + Math.cos(a) * (R + 26);
          const ly = CY + Math.sin(a) * (R + 22);
          const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
          const words = g.group.shortLabel.split(" ");
          // Wrap to two lines rather than letting a long label run off the box.
          const lines =
            words.length > 2 ? [words.slice(0, 2).join(" "), words.slice(2).join(" ")] : [g.group.shortLabel];
          return (
            <text
              key={g.group.id}
              x={lx}
              y={ly - (lines.length - 1) * 5}
              fontSize={10}
              fontWeight={600}
              fill="#475569"
              textAnchor={anchor}
              className="select-none"
            >
              {lines.map((line, li) => (
                <tspan key={line} x={lx} dy={li === 0 ? 0 : 11}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>

      {!compact && (
      <details className="mt-3 text-xs text-slate-500">
        <summary className="cursor-pointer font-semibold hover:text-brand-blue">
          View as a table
        </summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="py-1 font-semibold">Group</th>
              <th className="py-1 text-right font-semibold">Business</th>
              <th className="py-1 text-right font-semibold">Agentic</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.group.id} className="border-t border-slate-100">
                <td className="py-1 text-slate-600">{g.group.label}</td>
                <td className="py-1 text-right tabular-nums text-slate-700">
                  {g.scores.business.toFixed(1)}
                </td>
                <td className="py-1 text-right tabular-nums text-slate-700">
                  {g.scores.agentic.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      )}
    </figure>
  );
}
