'use client'

import { ListFilter, X } from 'lucide-react'

import { FILTER_OPTIONS, type LeadFilters } from '@/lib/kpmg-dice/lib/filters/use-lead-filters'
import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * One filter row above everything it scopes — never per-card filters, so every
 * panel on the page always reflects the same slice.
 */
export function FilterBar({
  filters,
  setFilter,
  clearFilters,
  activeCount,
  resultCount,
  totalCount,
}: {
  filters: LeadFilters
  setFilter: (key: keyof LeadFilters, value: string) => void
  clearFilters: () => void
  activeCount: number
  resultCount: number
  totalCount: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card">
      <div className="flex items-center gap-1.5 text-slate-400">
        <ListFilter className="size-4" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          Filters
        </span>
      </div>

      {FILTER_OPTIONS.map(({ key, label, options }) => (
        <label key={key} className="flex items-center gap-1.5">
          <span className="sr-only">{label}</span>
          <select
            value={filters[key]}
            onChange={(e) => setFilter(key, e.target.value)}
            aria-label={label}
            className={cn(
              'h-8 cursor-pointer rounded-lg border px-2 text-[12px] font-medium outline-none transition-colors',
              filters[key] === 'all'
                ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                : 'border-kpmg-blue bg-kpmg-blue/[0.06] text-kpmg-navy',
            )}
          >
            <option value="all">All {label.toLowerCase()}s</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="size-3.5" />
          Clear {activeCount}
        </button>
      )}

      <span className="ml-auto text-[12px] text-slate-500">
        <span className="nums font-bold text-slate-900">
          {formatNumber(resultCount)}
        </span>{' '}
        of {formatNumber(totalCount)} leads
      </span>
    </div>
  )
}
