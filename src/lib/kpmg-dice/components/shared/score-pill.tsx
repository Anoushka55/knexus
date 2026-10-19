import { cn } from '@/lib/kpmg-dice/lib/utils'

/** Lead score badge — green ≥ 80, amber ≥ 60, red below. */
export function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 80
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : score >= 60
        ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
        : 'bg-red-50 text-red-700 ring-red-600/20'

  return (
    <span
      className={cn(
        'inline-flex min-w-[34px] items-center justify-center rounded-md px-1.5 py-0.5 text-[12.5px] font-bold ring-1 ring-inset',
        tone,
      )}
    >
      {score}
    </span>
  )
}
