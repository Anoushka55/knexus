import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { ARCHITECTURES } from './architectures'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Reference architectures, as tiles.
 *
 * These used to render inline, six layers deep, pushing the rest of the page
 * below the fold and sharing width with an outcomes rail. Each one now gets a
 * tile here and the whole page to itself when opened.
 *
 * The chips state plain facts about the diagram's own structure — a slide
 * reproduction has no build-coverage figure to report, and reusing the old
 * "N of M in this build" chip here would have invented one.
 */
export function ArchitectureTiles() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {ARCHITECTURES.map((architecture) => {
        const Icon = architecture.icon
        return (
          <Link
            key={architecture.slug}
            href={`/agents/kpmg-dice/console/platform/${architecture.slug}`}
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-kpmg-blue/10">
                <Icon className="size-4 text-kpmg-blue" strokeWidth={2.1} />
              </span>
              <h3 className="mt-1 text-[14px] font-bold leading-snug tracking-[-0.01em] text-slate-900">
                {architecture.name}
              </h3>
            </div>

            <p className="mt-2.5 flex-1 text-[11.5px] leading-relaxed text-slate-500">
              {architecture.blurb}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-slate-100 pt-2.5">
              {/*
                A reserved tile says so on its face. Showing the same chips and
                the same call to action as a populated one would only reveal the
                difference after a click.
              */}
              {architecture.pending ? (
                <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10.5px] font-semibold text-slate-400">
                  Awaiting content
                </span>
              ) : (
                architecture.facts.map((fact) => (
                  <span
                    key={fact}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600"
                  >
                    {fact}
                  </span>
                ))
              )}
              <span
                className={cn(
                  'ml-auto flex items-center gap-1 text-[11.5px] font-semibold',
                  architecture.pending ? 'text-slate-400' : 'text-kpmg-blue',
                )}
              >
                {architecture.pending ? 'Reserved' : 'Open'}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
