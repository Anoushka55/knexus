'use client'

import { useMemo, useState } from 'react'

import { Card } from '@/lib/kpmg-dice/components/ui/card'
import { CustomerSnapshotCard } from '@/lib/kpmg-dice/components/overview/customer-snapshot-card'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { RecordToolbar } from '@/lib/kpmg-dice/components/shared/record-toolbar'
import { ScorePill } from '@/lib/kpmg-dice/components/shared/score-pill'
import { selectHeroLead } from '@/lib/kpmg-dice/lib/selectors/use-overview-data'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Customer 360 landing.
 *
 * The snapshot card was reachable only on the Overview, and only for the one
 * customer the ranking picked — there was no way to open it on somebody else.
 * This is the picker that was missing: search on the left, the same card on the
 * right. The card is the Overview's, called with a `leadId` rather than
 * reimplemented, so the two can never drift.
 */

/**
 * Rendered rows are capped.
 *
 * The book runs to five figures and this is a picker, not the lead table —
 * painting every match would cost a second on each keystroke to produce a list
 * nobody scrolls. The toolbar states the true match count beside it, so the cap
 * is visible rather than a silent truncation.
 */
const MAX_ROWS = 50

export function CustomerDirectory() {
  const leads = useCrmStore((s) => s.leads)
  const siteVisits = useCrmStore((s) => s.siteVisits)
  const [query, setQuery] = useState('')

  // Opens on the same customer the Overview leads with, so the page has
  // something real on it before anyone types.
  const fallback = useMemo(
    () => selectHeroLead(leads, siteVisits),
    [leads, siteVisits],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId = selectedId ?? fallback?.id ?? null

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return leads
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.preferredLocation.toLowerCase().includes(q),
    )
  }, [leads, query])

  const rows = matches.slice(0, MAX_ROWS)

  if (!leads.length) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center gap-1.5 text-center">
        <p className="text-[15px] font-semibold text-slate-700">
          No customers in this book
        </p>
        <p className="max-w-sm text-[12.5px] text-slate-500">
          Import a book with leads, or reset to the example data.
        </p>
      </Card>
    )
  }

  return (
    <div className="animate-fade-in space-y-3">
      <RecordToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search name, lead ID or micro-market…"
        resultCount={matches.length}
        totalCount={leads.length}
        onClear={() => setQuery('')}
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Picker */}
        <Card className="flex min-w-0 flex-col overflow-hidden">
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-[12.5px] text-slate-500">
              No customer matches “{query}”.
            </p>
          ) : (
            <ul className="min-w-0">
              {rows.map((lead) => {
                const active = lead.id === activeId
                return (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(lead.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-center gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left transition-colors last:border-0',
                        active ? 'bg-kpmg-blue/[0.06]' : 'hover:bg-slate-50',
                      )}
                    >
                      <InitialsAvatar name={lead.name} className="size-8 text-[11px]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-slate-900">
                          {lead.name}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {lead.id} · {lead.preferredLocation} ·{' '}
                          {formatCrore(lead.budgetCr, { decimals: 1 })}
                        </span>
                      </span>
                      <ScorePill score={lead.score} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {matches.length > rows.length && (
            <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
              Showing {rows.length} of {matches.length} — narrow the search to
              reach the rest.
            </p>
          )}
        </Card>

        {/* The Overview's own card, pointed at the selection. */}
        <div className="min-w-0">
          <CustomerSnapshotCard leadId={activeId ?? undefined} />
        </div>
      </div>
    </div>
  )
}
