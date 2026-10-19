'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Horizontal bar list — the workhorse "share of a whole" panel.
 *
 * One hue per list, never cycled: the bar carries magnitude and the row label
 * carries identity, so a filter that changes the row set never repaints the
 * survivors. Values sit outside the bar in a fixed-width column so short bars
 * stay readable and the digits line up.
 */

export type BreakdownTone =
  | 'blue'
  | 'navy'
  | 'teal'
  | 'violet'
  | 'purple'
  | 'magenta'
  | 'danger'
  | 'amber'

const TONE_BAR: Record<BreakdownTone, string> = {
  blue: 'bg-kpmg-blue',
  navy: 'bg-kpmg-navy',
  teal: 'bg-kpmg-teal',
  violet: 'bg-kpmg-violet',
  purple: 'bg-kpmg-purple',
  magenta: 'bg-kpmg-magenta',
  danger: 'bg-status-danger',
  amber: 'bg-amber-500',
}

export interface BreakdownRow {
  key: string
  label: string
  /** Drives bar length, scaled against the largest row. */
  value: number
  /** Right-hand figure; falls back to the raw value. */
  display?: string
  /** Small grey line under the label. */
  caption?: string
  /** Trailing element after the figure — a delta, a breach count. */
  badge?: ReactNode
  icon?: LucideIcon
  onClick?: () => void
}

export function BreakdownList({
  rows,
  tone = 'blue',
  layout = 'inline',
  labelWidth = 'w-[104px]',
  valueWidth = 'w-[56px]',
  barHeight = 'h-4',
  emptyLabel = 'Nothing to show here.',
  className,
}: {
  rows: BreakdownRow[]
  tone?: BreakdownTone
  /**
   * `inline` puts the label in a fixed column beside the bar — compact, but it
   * truncates long names. `stacked` gives the label its own line above a
   * full-width bar, which is what long labels in a narrow rail need.
   */
  layout?: 'inline' | 'stacked'
  labelWidth?: string
  valueWidth?: string
  barHeight?: string
  emptyLabel?: string
  className?: string
}) {
  if (!rows.length) {
    return (
      <p className="py-6 text-center text-[12.5px] text-slate-400">{emptyLabel}</p>
    )
  }

  const max = Math.max(...rows.map((r) => r.value), 1)

  if (layout === 'stacked') {
    return (
      <div className={cn('space-y-3', className)}>
        {rows.map((row) => {
          const Icon = row.icon
          const body = (
            <>
              <span className="flex w-full items-baseline gap-2">
                {Icon && (
                  <Icon
                    className="size-3.5 shrink-0 self-center text-slate-400"
                    strokeWidth={2}
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-slate-600">
                  {row.label}
                </span>
                <span className="nums shrink-0 text-[11.5px] font-semibold text-slate-900">
                  {row.display ?? row.value}
                </span>
                {row.badge}
              </span>
              <span
                className={cn(
                  'mt-1 block w-full overflow-hidden rounded-r-[4px] bg-slate-50',
                  barHeight,
                )}
              >
                <span
                  className={cn('block h-full rounded-r-[4px]', TONE_BAR[tone])}
                  style={{
                    width: `${Math.max(row.value > 0 ? 2 : 0, (row.value / max) * 100)}%`,
                  }}
                />
              </span>
              {row.caption && (
                <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                  {row.caption}
                </span>
              )}
            </>
          )

          return row.onClick ? (
            <button
              key={row.key}
              type="button"
              onClick={row.onClick}
              className="block w-full rounded-md text-left transition-colors hover:bg-slate-50"
            >
              {body}
            </button>
          ) : (
            <div key={row.key}>{body}</div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      {rows.map((row) => {
        const Icon = row.icon
        const body = (
          <>
            {Icon && (
              <Icon
                className="size-3.5 shrink-0 text-slate-400"
                strokeWidth={2}
              />
            )}
            <span className={cn('shrink-0', labelWidth)}>
              <span className="block truncate text-[11.5px] text-slate-600">
                {row.label}
              </span>
              {row.caption && (
                <span className="block truncate text-[10px] text-slate-400">
                  {row.caption}
                </span>
              )}
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50',
                barHeight,
              )}
            >
              <span
                className={cn('block h-full rounded-r-[4px]', TONE_BAR[tone])}
                style={{ width: `${Math.max(row.value > 0 ? 2 : 0, (row.value / max) * 100)}%` }}
              />
            </span>
            <span
              className={cn(
                'nums shrink-0 text-right text-[11.5px] font-semibold text-slate-900',
                valueWidth,
              )}
            >
              {row.display ?? row.value}
            </span>
            {row.badge}
          </>
        )

        return row.onClick ? (
          <button
            key={row.key}
            type="button"
            onClick={row.onClick}
            className="flex w-full items-center gap-2.5 rounded-md text-left transition-colors hover:bg-slate-50"
          >
            {body}
          </button>
        ) : (
          <div key={row.key} className="flex items-center gap-2.5">
            {body}
          </div>
        )
      })}
    </div>
  )
}
