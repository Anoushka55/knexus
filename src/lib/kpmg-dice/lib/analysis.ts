import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'

/**
 * Small analytical helpers shared by the record pages and drill-ins.
 *
 * Everything here is pure and derives from the seeded dataset, so the same
 * inputs always produce the same panel — server render and client hydration
 * included. Dates are handled in UTC for the same reason.
 */

export interface MonthBucket {
  key: string
  /** "Jan" */
  label: string
  /** "Jan 2026" — used in tooltips where the year matters. */
  fullLabel: string
  count: number
  value: number
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** The `count` months ending with the month of the demo clock, oldest first. */
export function monthWindow(count: number): MonthBucket[] {
  const out: MonthBucket[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(
      Date.UTC(DEMO_NOW.getUTCFullYear(), DEMO_NOW.getUTCMonth() - i, 1),
    )
    out.push({
      key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`,
      label: MONTH_NAMES[d.getUTCMonth()],
      fullLabel: `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      count: 0,
      value: 0,
    })
  }
  return out
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`
}

/**
 * Bucket records into the trailing `months` window. Records outside the window
 * are dropped rather than folded into the first bucket — a silent pile-up on
 * the left edge reads as a trend that isn't there.
 */
export function bucketByMonth<T>(
  items: T[],
  at: (item: T) => string,
  opts: { months?: number; value?: (item: T) => number } = {},
): MonthBucket[] {
  const { months = 6, value } = opts
  const buckets = monthWindow(months)
  const index = new Map(buckets.map((b) => [b.key, b]))

  for (const item of items) {
    const bucket = index.get(monthKey(at(item)))
    if (!bucket) continue
    bucket.count += 1
    if (value) bucket.value += value(item)
  }

  return buckets
}

export interface ShareRow<T = unknown> {
  key: string
  label: string
  count: number
  /** Count as a percentage of the whole input set. */
  share: number
  items: T[]
}

/** Group by a key, biggest group first, optionally capped. */
export function shareBy<T>(
  items: T[],
  key: (item: T) => string,
  opts: { label?: (key: string) => string; limit?: number } = {},
): ShareRow<T>[] {
  const { label, limit } = opts
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = groups.get(k)
    if (list) list.push(item)
    else groups.set(k, [item])
  }

  const rows = [...groups.entries()]
    .map(([k, list]) => ({
      key: k,
      label: label ? label(k) : k,
      count: list.length,
      share: items.length ? (list.length / items.length) * 100 : 0,
      items: list,
    }))
    .sort((a, b) => b.count - a.count)

  return limit ? rows.slice(0, limit) : rows
}

/** Median of a numeric list; 0 for an empty list. */
export function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Whole days between two ISO instants, floored at zero. */
export function daysBetween(from: string, to: string | Date = DEMO_NOW) {
  const end = typeof to === 'string' ? new Date(to) : to
  return Math.max(
    0,
    Math.round((end.getTime() - new Date(from).getTime()) / 86_400_000),
  )
}

export function pct(part: number, whole: number) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0
}
