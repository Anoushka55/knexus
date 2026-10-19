'use client'

import { Search, X } from 'lucide-react'

import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

export interface ToolbarSelect {
  key: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

/**
 * One control row above a record table — search plus scoped dropdowns, matching
 * the FilterBar pattern used on the manager views.
 */
export function RecordToolbar({
  query,
  onQueryChange,
  placeholder = 'Search…',
  selects = [],
  resultCount,
  totalCount,
  onClear,
}: {
  query: string
  onQueryChange: (value: string) => void
  placeholder?: string
  selects?: ToolbarSelect[]
  resultCount: number
  totalCount: number
  onClear?: () => void
}) {
  const dirty = query.trim().length > 0 || selects.some((s) => s.value !== 'all')

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card">
      <div className="relative min-w-[220px] flex-1 sm:max-w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12.5px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kpmg-blue"
        />
      </div>

      {selects.map((select) => (
        <label key={select.key}>
          <span className="sr-only">{select.label}</span>
          <select
            value={select.value}
            onChange={(e) => select.onChange(e.target.value)}
            aria-label={select.label}
            className={cn(
              'h-8 cursor-pointer rounded-lg border px-2 text-[12px] font-medium outline-none transition-colors',
              select.value === 'all'
                ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                : 'border-kpmg-blue bg-kpmg-blue/[0.06] text-kpmg-navy',
            )}
          >
            <option value="all">All {select.label.toLowerCase()}</option>
            {select.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {dirty && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="size-3.5" />
          Clear
        </button>
      )}

      <span className="ml-auto text-[12px] text-slate-500">
        <span className="nums font-bold text-slate-900">
          {formatNumber(resultCount)}
        </span>{' '}
        of {formatNumber(totalCount)}
      </span>
    </div>
  )
}
