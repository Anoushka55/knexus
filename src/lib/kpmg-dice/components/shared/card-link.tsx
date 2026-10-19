import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/kpmg-dice/lib/utils'

/** The "View all … →" affordance in every card footer. */
export function CardLink({
  href,
  label,
  className,
  align = 'center',
}: {
  href: string
  label: string
  className?: string
  align?: 'center' | 'start'
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-1 text-[13px] font-semibold text-kpmg-blue transition-colors hover:text-kpmg-navy',
        align === 'center' ? 'justify-center' : 'justify-start',
        className,
      )}
    >
      {label}
      <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
