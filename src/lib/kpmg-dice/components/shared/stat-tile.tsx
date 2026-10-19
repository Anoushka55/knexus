import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Stat tile: label (sentence case) · value · optional sub-line.
 * Values use proportional figures — tabular digits look loose at display size.
 */
export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'text-kpmg-blue',
  accentBg = 'bg-kpmg-blue/10',
  danger = false,
}: {
  label: string
  value: string
  sub?: string
  icon?: LucideIcon
  accent?: string
  accentBg?: string
  danger?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              accentBg,
            )}
          >
            <Icon className={cn('size-4', accent)} strokeWidth={2.1} />
          </span>
        )}
        <p className="text-[12.5px] font-medium text-slate-500">{label}</p>
      </div>
      <p
        className={cn(
          'mt-2 text-[24px] font-bold leading-none tracking-[-0.02em]',
          danger ? 'text-dice-status-danger' : 'text-slate-900',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[11.5px] text-slate-400">{sub}</p>}
    </div>
  )
}
