'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search, Sparkles, X } from 'lucide-react'

import { PersonaDrillIn } from './persona-drill-in'
import { Card } from '@/lib/kpmg-dice/components/ui/card'
import { Input } from '@/lib/kpmg-dice/components/ui/input'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { ScorePill } from '@/lib/kpmg-dice/components/shared/score-pill'

import { usePersonaMap } from '@/lib/kpmg-dice/lib/personas/use-persona-map'
import { formatCrore, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'
import { useReference } from '@/lib/kpmg-dice/data/use-reference'
import { personaById } from '@/lib/kpmg-dice/data/active-reference'
import { InventoryFitPanel } from '@/lib/kpmg-dice/components/personas/inventory-fit-panel'

/** How many leads each column lists before the "+N more" line. */
const COLUMN_PREVIEW = 6

export function PersonaBoard() {
  const { personas } = useReference()
  const { assignments, buckets, mappedCount } = usePersonaMap()
  const [query, setQuery] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []

    return buckets
      .flatMap((b) => b.leads)
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.preferredLocation.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [buckets, query])

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-rail-800 p-5 text-white shadow-card">
        <div className="min-w-0">
          <h2 className="text-[19px] font-bold tracking-[-0.01em]">
            Dynamic Persona & Property-fit Engine
          </h2>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-white/60">
            Every open lead scored against {personas.length} buyer personas from
            its attributes and behaviour — with the signals that drove the
            assignment kept on the record.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
              Leads mapped
            </p>
            <p className="text-[19px] font-bold">{formatNumber(mappedCount)}</p>
          </div>

          <div className="relative w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a lead to see why…"
              aria-label="Search a lead to see its persona rationale"
              className="h-10 border-white/15 bg-white/10 pl-9 text-[13px] text-white placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-white/10"
            />

            {searchResults.length > 0 && (
              <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-card-hover">
                {searchResults.map((lead) => {
                  const persona =
                    personaById(
                      assignments.get(lead.id)?.best.personaId ?? ''
                    )
                  return (
                    <li key={lead.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(lead.id)
                          setQuery('')
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                      >
                        <InitialsAvatar name={lead.name} className="size-7" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-semibold text-slate-900">
                            {lead.name}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {lead.id} · {lead.preferredLocation}
                          </span>
                        </span>
                        {persona && (
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: persona.color }}
                          >
                            {persona.shortName}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Drill-in */}
      {selectedLeadId && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setSelectedLeadId(null)}
            aria-label="Close persona detail"
            className="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
          <PersonaDrillIn leadId={selectedLeadId} />
        </div>
      )}

      {/* Board */}
      <div className="scrollbar-slim overflow-x-auto pb-2">
        <div className="grid min-w-[1100px] grid-cols-6 gap-3">
          {buckets.map((bucket) => {
            const persona = personaById(bucket.personaId)
            return (
              <Card
                key={bucket.personaId}
                className="flex flex-col overflow-hidden"
              >
                {/* Column head — colour is reinforced by the name, never alone */}
                <div
                  className="px-3 py-2.5 text-white"
                  style={{ backgroundColor: persona.color }}
                >
                  <p className="text-[12.5px] font-bold leading-tight">
                    {persona.name}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-white/80">
                    {persona.budgetBand}
                  </p>
                </div>

                {/* Column stats */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/60">
                  {[
                    { label: 'Leads', value: formatNumber(bucket.count) },
                    { label: 'Budget', value: formatCrore(bucket.avgBudgetCr, { decimals: 1 }) },
                    { label: 'Score', value: String(bucket.avgScore) },
                  ].map((stat) => (
                    <div key={stat.label} className="px-1.5 py-2 text-center">
                      <p className="truncate text-[9.5px] font-medium uppercase tracking-wide text-slate-400">
                        {stat.label}
                      </p>
                      <p className="nums mt-0.5 text-[12px] font-bold text-slate-900">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5">
                  <span className="text-[10.5px] font-medium text-slate-500">
                    {bucket.highIntentCount} high intent
                  </span>
                  <span className="text-[10.5px] font-semibold text-slate-400">
                    {bucket.sharePct}% of book
                  </span>
                </div>

                {/* Leads */}
                <ul className="flex-1 divide-y divide-slate-50">
                  {bucket.leads.slice(0, COLUMN_PREVIEW).map((lead) => (
                    <li key={lead.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                      >
                        <InitialsAvatar name={lead.name} className="size-6 text-[9px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] font-semibold text-slate-800">
                            {lead.name}
                          </span>
                          <span className="block truncate text-[10px] text-slate-400">
                            {lead.preferredLocation} · ₹{lead.budgetCr} Cr
                          </span>
                        </span>
                        <ScorePill score={lead.score} />
                      </button>
                    </li>
                  ))}

                  {bucket.count > COLUMN_PREVIEW && (
                    <li className="px-3 py-2 text-[10.5px] font-medium text-slate-400">
                      +{formatNumber(bucket.count - COLUMN_PREVIEW)} more
                    </li>
                  )}

                  {bucket.count === 0 && (
                    <li className="px-3 py-6 text-center text-[11px] text-slate-400">
                      No leads mapped
                    </li>
                  )}
                </ul>

                {/* Playbook */}
                <div className="border-t border-slate-100 bg-slate-50/60 p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Sparkles className="size-3 text-kpmg-violet" />
                    <p className="text-[9.5px] font-bold uppercase tracking-wider text-kpmg-violet">
                      Recommended playbook
                    </p>
                  </div>
                  <p className="text-[10.5px] leading-relaxed text-slate-600">
                    {persona.playbook}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Persona reference */}
      <Card className="p-5">
        <h3 className="section-title mb-3">Persona reference</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="rounded-lg border border-slate-200 p-3.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: persona.color }}
                />
                <p className="text-[13px] font-bold text-slate-900">
                  {persona.name}
                </p>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
                {persona.description}
              </p>

              <dl className="mt-2.5 space-y-1.5">
                {[
                  ['Motivations', persona.motivations],
                  ['Objections', persona.objections],
                  ['Triggers', persona.buyingTriggers],
                  ['Channels', persona.channels],
                ].map(([label, items]) => (
                  <div key={label as string} className="flex gap-2">
                    <dt className="w-[74px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {label as string}
                    </dt>
                    <dd className="min-w-0 flex-1 text-[11px] leading-snug text-slate-600">
                      {(items as string[]).join(' · ')}
                    </dd>
                  </div>
                ))}
              </dl>

              <Link
                href="/agents/kpmg-dice/console/leads"
                className={cn(
                  'mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold',
                  'text-kpmg-blue hover:text-kpmg-navy',
                )}
              >
                Best fit: {persona.preferredProjectTypes.join(', ')}
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/*
        The engine run backwards.

        The board above answers "what kind of buyer is this". This answers
        "given a flat nobody has bought, who fits it" — the same rules, pointed
        at the constraint that actually binds in real estate.
      */}
      <InventoryFitPanel />
    </div>
  )
}
