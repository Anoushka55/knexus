import { initials } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/** Stable per-name colour so a customer keeps the same chip everywhere. */
const PALETTE = [
  'bg-kpmg-purple',
  'bg-kpmg-blue',
  'bg-kpmg-teal',
  'bg-kpmg-magenta',
  'bg-kpmg-violet',
  'bg-kpmg-navy',
]

function paletteIndex(name: string) {
  let sum = 0
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i)
  return sum % PALETTE.length
}

export function InitialsAvatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
        PALETTE[paletteIndex(name)],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

/** Muted variant used for the record owner (a rep), not the customer. */
export function OwnerChip({ code }: { code: string }) {
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-kpmg-blue/10 text-[10.5px] font-bold text-kpmg-blue">
      {code}
    </span>
  )
}
