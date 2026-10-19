import { ArrowDown, ArrowUp } from 'lucide-react'

import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Month-on-month delta. `invert` flips the colour semantics for metrics where
 * growth is bad news (revenue at risk), while the arrow still follows direction.
 */
export function Delta({
  value,
  invert = false,
  suffix = 'vs last month',
}: {
  value: number
  invert?: boolean
  suffix?: string
}) {
  const rising = value >= 0
  const good = invert ? !rising : rising
  const Icon = rising ? ArrowUp : ArrowDown

  return (
    <div className="flex items-center gap-1.5">
      <Icon
        className={cn(
          'size-3.5 shrink-0',
          good ? 'text-dice-status-success' : 'text-dice-status-danger',
        )}
        strokeWidth={2.6}
      />
      <span
        className={cn(
          'text-[13px] font-bold',
          good ? 'text-dice-status-success' : 'text-dice-status-danger',
        )}
      >
        {Math.abs(value)}%
      </span>
      <span className="truncate text-xs text-slate-400">{suffix}</span>
    </div>
  )
}

/** Compact up/down arrow used inside dense tables. */
export function TrendArrow({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'flat') {
    return <span className="text-slate-300">—</span>
  }

  const Icon = trend === 'up' ? ArrowUp : ArrowDown
  return (
    <Icon
      className={cn(
        'size-4',
        trend === 'up' ? 'text-dice-status-success' : 'text-dice-status-danger',
      )}
      strokeWidth={2.6}
      aria-label={trend === 'up' ? 'Trending up' : 'Trending down'}
    />
  )
}
