'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'right'
  /** Tailwind width class applied to the header cell. */
  width?: string
  render: (row: T) => ReactNode
}

/**
 * Paginated table shared by every record view.
 *
 * Pagination is client-side over an already-filtered array — the whole book is
 * in memory, so this is a rendering guard (never paint 12,842 rows), not a
 * data-fetching concern.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  onRowClick,
  pageSize = 25,
  emptyLabel = 'No records match this filter.',
  minWidth = 'min-w-[820px]',
}: {
  rows: T[]
  columns: Column<T>[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  pageSize?: number
  emptyLabel?: string
  minWidth?: string
}) {
  const [page, setPage] = useState(0)

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  // Filters change the row set underneath us — snap back into range.
  useEffect(() => {
    if (page > pageCount - 1) setPage(0)
  }, [page, pageCount])

  const visible = useMemo(
    () => rows.slice(page * pageSize, page * pageSize + pageSize),
    [rows, page, pageSize],
  )

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100">
          <Inbox className="size-5 text-slate-400" />
        </div>
        <p className="text-[13px] font-semibold text-slate-600">Nothing here</p>
        <p className="max-w-xs text-[11.5px] leading-relaxed text-slate-400">
          {emptyLabel}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="scrollbar-slim overflow-x-auto">
        <table className={cn('w-full', minWidth)}>
          <thead>
            <tr className="border-b border-slate-200 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    // pr matches the body cells so a right-aligned header never
                    // butts up against the next left-aligned one.
                    'pb-2 pr-3 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 last:pr-0',
                    col.align === 'right' && 'text-right',
                    col.width,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-slate-50 last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-slate-50/70',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'py-2.5 pr-3 text-[12.5px] text-slate-700 last:pr-0',
                      col.align === 'right' && 'text-right',
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-[11.5px] text-slate-500">
            Showing{' '}
            <span className="nums font-semibold text-slate-900">
              {formatNumber(page * pageSize + 1)}–
              {formatNumber(Math.min((page + 1) * pageSize, rows.length))}
            </span>{' '}
            of {formatNumber(rows.length)}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="nums px-1.5 text-[11.5px] font-medium text-slate-600">
              {page + 1} / {formatNumber(pageCount)}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              aria-label="Next page"
              className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
