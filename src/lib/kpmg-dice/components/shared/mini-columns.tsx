'use client'

import { useState } from 'react'

import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Small monthly column chart — single series, one hue, hover tooltip.
 *
 * Deliberately not Recharts: at six columns the library costs more than it
 * gives, and a plain-div chart has no ResponsiveContainer measuring pass to
 * blank out in a screenshot.
 */

export interface ColumnPoint {
  key: string
  label: string
  /** Tooltip heading — usually the month with its year. */
  fullLabel?: string
  value: number
  /** Optional second figure shown in the tooltip. */
  secondary?: string
}

export function MiniColumns({
  points,
  tone = 'bg-kpmg-blue',
  height = 'h-[132px]',
  valueLabel = (v: number) => formatNumber(v),
  caption,
}: {
  points: ColumnPoint[]
  tone?: string
  height?: string
  valueLabel?: (value: number) => string
  caption?: string
}) {
  const [hover, setHover] = useState<string | null>(null)
  const max = Math.max(...points.map((p) => p.value), 1)
  const active = points.find((p) => p.key === hover)

  return (
    <div>
      <div className="relative">
        {/* Tooltip sits above the plot so it never covers the bar being read. */}
        <div className="mb-1.5 h-[34px]">
          {active ? (
            <div className="inline-flex flex-col rounded-lg border border-slate-200 bg-white px-2.5 py-1 shadow-card">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {active.fullLabel ?? active.label}
              </span>
              <span className="nums text-[12px] font-bold text-slate-900">
                {valueLabel(active.value)}
                {active.secondary && (
                  <span className="ml-1.5 font-medium text-slate-500">
                    {active.secondary}
                  </span>
                )}
              </span>
            </div>
          ) : (
            caption && (
              <p className="pt-1 text-[11px] text-slate-400">{caption}</p>
            )
          )}
        </div>

        <div className={cn('flex items-end gap-1.5', height)}>
          {points.map((p) => (
            <button
              key={p.key}
              type="button"
              onMouseEnter={() => setHover(p.key)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(p.key)}
              onBlur={() => setHover(null)}
              aria-label={`${p.fullLabel ?? p.label}: ${valueLabel(p.value)}`}
              className="group flex h-full flex-1 flex-col justify-end"
            >
              <span
                className={cn(
                  'w-full rounded-t-[4px] transition-opacity',
                  tone,
                  hover && hover !== p.key ? 'opacity-45' : 'opacity-100',
                )}
                style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex gap-1.5 border-t border-slate-100 pt-1.5">
        {points.map((p) => (
          <span
            key={p.key}
            className={cn(
              'flex-1 text-center text-[10.5px]',
              hover === p.key ? 'font-semibold text-slate-700' : 'text-slate-400',
            )}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}
