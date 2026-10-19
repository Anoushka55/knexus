import { Sparkles } from 'lucide-react'

import { Card } from '@/lib/kpmg-dice/components/ui/card'

/**
 * Shared placeholder for routes that land in a later build step, so every
 * nav destination resolves to a real, on-brand page from day one.
 */
export function ComingSoon({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card className="flex min-h-[440px] flex-col items-center justify-center gap-4 border-dashed bg-white/60 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kpmg-purple to-kpmg-violet text-white shadow-lg shadow-kpmg-violet/20">
        <Sparkles className="size-6" strokeWidth={1.9} />
      </div>

      <div className="max-w-md space-y-1.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-kpmg-violet">
          Coming up in this build
        </p>
        <h2 className="text-xl font-bold tracking-[-0.01em] text-slate-900">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </Card>
  )
}
