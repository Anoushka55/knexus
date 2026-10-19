'use client'

import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Count matrix with sequential shading — one hue, light to dark, so density
 * reads as magnitude rather than category. Zero cells stay unfilled instead of
 * taking the lightest step, which keeps "none" visually distinct from "few".
 */

export interface CrossTabColumn {
  key: string
  label: string
  /** Marks a column as the problem side of the matrix. */
  alarming?: boolean
}

export interface CrossTabRow {
  key: string
  label: string
  caption?: string
  cells: Record<string, number>
}

/** Five steps of the KPMG blue ramp, monotone in lightness. */
const RAMP = [
  { bg: '#EAF2FB', text: 'text-slate-600' },
  { bg: '#C5DCF3', text: 'text-slate-700' },
  { bg: '#7FB3E3', text: 'text-slate-900' },
  { bg: '#0A6CBA', text: 'text-white' },
  { bg: '#00338D', text: 'text-white' },
]

function step(value: number, max: number) {
  if (value <= 0) return null
  const ratio = value / max
  if (ratio > 0.7) return RAMP[4]
  if (ratio > 0.45) return RAMP[3]
  if (ratio > 0.22) return RAMP[2]
  if (ratio > 0.08) return RAMP[1]
  return RAMP[0]
}

export function CrossTab({
  columns,
  rows,
  rowHeader = '',
  formatCell = (v: number) => (v ? v.toLocaleString('en-IN') : '—'),
}: {
  columns: CrossTabColumn[]
  rows: CrossTabRow[]
  rowHeader?: string
  formatCell?: (value: number) => string
}) {
  const max = Math.max(
    ...rows.flatMap((r) => columns.map((c) => r.cells[c.key] ?? 0)),
    1,
  )

  return (
    <div className="scrollbar-slim overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-[2px]">
        <thead>
          <tr>
            <th className="pb-1 pr-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
              {rowHeader}
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'pb-1 text-center text-[10.5px] font-semibold uppercase tracking-wide',
                  c.alarming ? 'text-status-danger' : 'text-slate-400',
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="pr-2 align-middle">
                <span className="block whitespace-nowrap text-[11.5px] font-medium text-slate-700">
                  {r.label}
                </span>
                {r.caption && (
                  <span className="block whitespace-nowrap text-[10px] text-slate-400">
                    {r.caption}
                  </span>
                )}
              </td>
              {columns.map((c) => {
                const value = r.cells[c.key] ?? 0
                const tone = step(value, max)
                return (
                  <td
                    key={c.key}
                    className={cn(
                      'nums h-8 rounded-[4px] text-center text-[11.5px] font-semibold',
                      tone ? tone.text : 'text-slate-300',
                    )}
                    style={{ backgroundColor: tone?.bg ?? '#FBFCFE' }}
                  >
                    {formatCell(value)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
