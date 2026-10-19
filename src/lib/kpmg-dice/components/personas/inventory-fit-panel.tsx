'use client'

import { useState } from 'react'
import { Boxes, TriangleAlert } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { useInventoryFit } from '@/lib/kpmg-dice/lib/selectors/use-inventory-fit'
import { useReference } from '@/lib/kpmg-dice/data/use-reference'
import { formatCrore, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * The persona engine, run backwards.
 *
 * Every other screen asks "what kind of buyer is this". This one starts from a
 * flat nobody has bought and asks who in the book fits it — which is the
 * question a sales head actually has on a Monday, and the one no experience
 * platform can answer because none of them model inventory.
 *
 * The orphan list is the finding, not the footnote: units the current pipeline
 * cannot absorb at all are a demand-generation brief, and they are invisible
 * anywhere else in the product.
 */

export function InventoryFitPanel() {
  const { projects } = useReference()
  const [projectId, setProjectId] = useState<string>('')
  const fit = useInventoryFit(projectId || undefined)
  const [tab, setTab] = useState<'matched' | 'orphans'>('matched')

  if (!fit.unitsTotal) return null

  const sellThrough = fit.unitsTotal
    ? Math.round((fit.unitsSold / fit.unitsTotal) * 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-1.5">
            <Boxes className="size-3.5 text-kpmg-blue" />
            Unsold inventory, matched to the book
          </span>
        </CardTitle>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Filter by project"
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11.5px] font-medium text-slate-700"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Reconciliation, stated rather than assumed */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Available
            </p>
            <p className="nums mt-1 text-[22px] font-bold leading-none text-slate-900">
              {formatNumber(fit.unitsAvailable)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              of {formatNumber(fit.unitsTotal)} units · {sellThrough}% sold
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              On the shelf
            </p>
            <p className="nums mt-1 text-[22px] font-bold leading-none text-kpmg-blue">
              {formatCrore(fit.unsoldValueCr, { decimals: 0 })}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">face value unsold</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Placeable today
            </p>
            <p className="nums mt-1 text-[22px] font-bold leading-none text-kpmg-teal">
              {formatNumber(fit.placeable)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              have a credible buyer in the book
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              No buyer in the book
            </p>
            <p className="nums mt-1 text-[22px] font-bold leading-none text-dice-status-danger">
              {formatNumber(fit.orphans)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {formatCrore(fit.orphanValueCr, { decimals: 0 })} needing new demand
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 border-b border-slate-100">
          {(
            [
              ['matched', `Best matches (${formatNumber(fit.matches.length)})`],
              ['orphans', `Nobody fits (${formatNumber(fit.orphans)})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'border-b-2 px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors',
                tab === key
                  ? 'border-kpmg-blue text-kpmg-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'matched' ? (
          <ul className="mt-1 divide-y divide-slate-100">
            {fit.matches.slice(0, 8).map((m) => (
              <li key={m.unit.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-[12.5px] font-bold text-slate-900">
                    {m.unit.projectName} · {m.unit.unitType}
                    <span className="ml-1.5 font-medium text-slate-500">
                      Tower {m.unit.tower}, floor {m.unit.floor}, {m.unit.facing}-facing
                    </span>
                  </p>
                  <p className="nums text-[12.5px] font-bold text-kpmg-blue">
                    {formatCrore(m.unit.priceCr, { decimals: 2 })}
                  </p>
                </div>

                <ul className="mt-2 space-y-1.5">
                  {m.fits.map((f) => (
                    <li key={f.lead.id} className="flex items-start gap-2">
                      <InitialsAvatar
                        name={f.lead.name}
                        className="mt-px size-6 text-[10px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold text-slate-800">
                          {f.lead.name}
                          <span className="ml-1.5 font-normal text-slate-400">
                            {f.personaConfidence}% persona confidence
                          </span>
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {f.reasons.join(' · ')}
                        </span>
                      </span>
                      <span className="nums shrink-0 rounded-md bg-kpmg-blue/10 px-1.5 py-0.5 text-[11px] font-bold text-kpmg-blue">
                        {f.score}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3">
            {fit.orphanUnits.length === 0 ? (
              <p className="py-6 text-center text-[12.5px] text-slate-500">
                Every available unit has at least one credible buyer in the book.
              </p>
            ) : (
              <>
                <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-500">
                  <TriangleAlert className="mt-px size-3.5 shrink-0 text-dice-status-danger" />
                  <span>
                    No open lead is within {Math.round(0.28 * 100)}% of these
                    prices with a matching persona. This is a demand-generation
                    brief, not a sales one — the pipeline cannot absorb this stock
                    as it stands.
                  </span>
                </p>
                <ul className="mt-2.5 divide-y divide-slate-100">
                  {fit.orphanUnits.slice(0, 8).map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold text-slate-800">
                          {u.projectName} · {u.unitType}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          Tower {u.tower}, floor {u.floor} · {formatNumber(u.carpetAreaSqft)} sq ft
                        </span>
                      </span>
                      <span className="nums shrink-0 text-[12px] font-bold text-dice-status-danger">
                        {formatCrore(u.priceCr, { decimals: 2 })}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <p className="mt-3 border-t border-slate-100 pt-2.5 text-[11.5px] leading-relaxed text-slate-500">
          Fit is deterministic: budget proximity, the persona's actual unit-type
          affinity, stated project interest and intent. The affinity table is a
          configured domain assumption, not a fitted one — it is the first thing
          to argue with in a workshop.
        </p>
      </CardContent>
    </Card>
  )
}
