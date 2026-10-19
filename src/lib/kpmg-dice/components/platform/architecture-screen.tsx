import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { ARCHITECTURES, architectureBySlug } from './architectures'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * One architecture, full width.
 *
 * The bar at the top is the same shape the CSAT use-case screens use — a way
 * back plus a segment per sibling — so moving between architectures does not
 * mean returning to the tile grid first.
 *
 * The architecture renders bare rather than inside a Card: these are slide
 * reproductions that carry their own title and subtitle, and a card header
 * above one would print the name twice.
 */
export function ArchitectureScreen({ slug }: { slug: string }) {
  const architecture = architectureBySlug(slug)
  if (!architecture) return null

  const { Component } = architecture

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-card">
        <Link
          href="/agents/kpmg-dice/console/platform"
          className="mr-1 flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <ArrowLeft className="size-3.5" />
          How it Works
        </Link>

        {ARCHITECTURES.map((entry) => (
          <Link
            key={entry.slug}
            href={`/agents/kpmg-dice/console/platform/${entry.slug}`}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
              entry.slug === slug
                ? 'bg-kpmg-navy text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            )}
          >
            {entry.shortName}
          </Link>
        ))}
      </div>

      <Component />
    </div>
  )
}
