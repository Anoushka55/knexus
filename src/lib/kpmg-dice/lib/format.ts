/**
 * Formatting helpers shared across the console. Every number that appears in
 * the UI goes through here so the demo stays internally consistent.
 */

/** 1245 -> "₹1,245 Cr" */
export function formatCrore(value: number, opts: { decimals?: number } = {}) {
  const { decimals = 0 } = opts
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} Cr`
}

/** 12842 -> "12,842" (Indian grouping) */
export function formatNumber(value: number) {
  return value.toLocaleString('en-IN')
}

/** 0.362 -> "36.2%" */
export function formatPercent(value: number, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`
}

/** Already-a-percentage variant: 36.2 -> "36.2%" */
export function formatPercentValue(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`
}

/** "17 Aug 2026" */
export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** "17 Aug 2026, 10:30 AM" */
export function formatDateTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatDate(d)}, ${d
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase()
    .replace(' AM', ' AM')
    .replace(' PM', ' PM')}`
}

/** "Priya Shah" -> "PS" */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
