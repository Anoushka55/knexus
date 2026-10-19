import type { Lead } from '@/lib/kpmg-dice/types'

/**
 * Finds the lead a question is about.
 *
 * Ingested records win ties — those are the ones with a full interaction
 * history, so they are almost always who the rep means.
 */
export function findLeadByName(
  query: string,
  leads: Lead[],
  ingestedIds: Set<string>,
): Lead | undefined {
  const lower = query.toLowerCase()

  // Direct lead-ID reference, e.g. "MRD-79291".
  const idMatch = lower.match(/mrd-\d+/)
  if (idMatch) {
    const byId = leads.find((l) => l.id.toLowerCase() === idMatch[0])
    if (byId) return byId
  }

  const candidates = leads.filter((lead) => {
    const name = lead.name.toLowerCase()
    const [first, last] = name.split(' ')
    return (
      lower.includes(name) ||
      (first && first.length > 3 && lower.includes(first)) ||
      (last && last.length > 3 && lower.includes(last))
    )
  })

  if (!candidates.length) return undefined

  return (
    candidates
      .sort((a, b) => {
        const aIngested = ingestedIds.has(a.id) ? 1 : 0
        const bIngested = ingestedIds.has(b.id) ? 1 : 0
        if (aIngested !== bIngested) return bIngested - aIngested
        // Then prefer a full-name match over a single-name match.
        const aFull = query.toLowerCase().includes(a.name.toLowerCase()) ? 1 : 0
        const bFull = query.toLowerCase().includes(b.name.toLowerCase()) ? 1 : 0
        if (aFull !== bFull) return bFull - aFull
        return b.score - a.score
      })
      .at(0) ?? undefined
  )
}

/** Channel the question implies, defaulting to WhatsApp. */
export function detectChannel(query: string): 'whatsapp' | 'email' | 'sms' {
  const lower = query.toLowerCase()
  if (lower.includes('email') || lower.includes('mail')) return 'email'
  if (lower.includes('sms') || lower.includes('text message')) return 'sms'
  return 'whatsapp'
}
