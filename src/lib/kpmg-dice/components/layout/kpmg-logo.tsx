import { BRAND } from '@/lib/kpmg-dice/config/brand'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * The sidebar wordmark: the firm's mark, then the product locked up beneath it.
 *
 * Stacked rather than side by side because the product name is the thing that
 * needed weight — read across a single line it looked like a label sitting
 * next to a logo. On its own line under a rule it reads as what it is, and the
 * arrangement leaves room for a descriptor that would not fit inline.
 *
 * The name comes from `BRAND.product`. It used to be the literal "Index",
 * which appeared nowhere else in the codebase and disagreed with the browser
 * tab, the platform page and the config — the rail was the only surface still
 * calling the product something else.
 *
 * A plain <img> rather than next/image — the asset is a fixed-size local PNG
 * that never needs resizing or lazy loading, and next/image is not otherwise
 * used in this build. Explicit width and height are set so the rail does not
 * reflow while it loads.
 *
 * The mark is white on transparency, which is why it only works against the
 * dark rail. Its intrinsic aspect is 2.5:1, measured from the asset's own ink
 * bounds, so the widths below are derived rather than guessed.
 */

/*
 * Two rendered heights, and the widths that aspect gives.
 *
 * Never below 22: the four squares are hairline outlines in the artwork, so
 * they thin out fast as the mark shrinks. Expanded takes the extra couple of
 * pixels because it now heads a two-line lockup and has to hold its own above
 * the rule; collapsed keeps the smaller size, where the mark is alone in a
 * 72px rail and has nothing to balance against.
 *
 * The asset itself is 800x320 — around fifteen times what is drawn here — so
 * the detail is in the file; this is only how much of it is shown.
 */
const MARK_H = 24
const MARK_H_COLLAPSED = 22
const ASPECT = 2.5

function Mark({ height }: { height: number }) {
  const width = Math.round(height * ASPECT)
  return (
    <img
      src="/kpmg-dice-logo.png"
      alt={BRAND.vendor}
      width={width}
      height={height}
      style={{ width, height }}
      className="block shrink-0 select-none"
    />
  )
}

export function KpmgLogo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean
  className?: string
}) {
  /*
   * Collapsed the rail is 72px, which will not carry a lockup. The mark alone
   * is the better survivor — it is recognised instantly, where a lone "DICE"
   * at that width names a product nobody outside the room knows yet.
   */
  if (collapsed) {
    return (
      <div className={cn('flex items-center', className)}>
        <Mark height={MARK_H_COLLAPSED} />
      </div>
    )
  }

  return (
    <div className={cn('min-w-0', className)}>
      <Mark height={MARK_H} />

      {/* The rule carries the endorsement: the firm above, the product below. */}
      <div className="mt-1.5 flex items-baseline gap-2 border-t border-white/20 pt-1.5">
        <span className="shrink-0 text-[12.5px] font-bold tracking-[0.16em] text-white">
          {BRAND.product}
        </span>
        <span className="min-w-0 truncate text-[9px] uppercase tracking-[0.06em] text-white/55">
          {BRAND.railDescriptor}
        </span>
      </div>
    </div>
  )
}
