'use client'

import { useMemo, useState } from 'react'

import { mapLeadToPersonas } from '@/lib/kpmg-dice/lib/personas/mapping'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import type { Customer, Engagement, Lead } from '@/lib/kpmg-dice/types'
import { ref } from '@/lib/kpmg-dice/data/active-reference'

export interface LeadFilters {
  market: string
  campaign: string
  rep: string
  persona: string
}

export const EMPTY_FILTERS: LeadFilters = {
  market: 'all',
  campaign: 'all',
  rep: 'all',
  persona: 'all',
}

export interface FilterOption {
  value: string
  label: string
}

export const FILTER_OPTIONS: {
  key: keyof LeadFilters
  label: string
  options: FilterOption[]
}[] = [
  {
    key: 'market',
    label: 'Micro-market',
    options: ref().microMarkets.map((m) => ({ value: m, label: m })),
  },
  {
    key: 'campaign',
    label: 'Campaign',
    options: ref().campaigns.map((c) => ({ value: c.id, label: c.name })),
  },
  {
    key: 'rep',
    label: 'Owner',
    options: ref().reps.map((r) => ({ value: r.id, label: r.name })),
  },
  {
    key: 'persona',
    label: 'Persona',
    options: ref().personas.map((p) => ({ value: p.id, label: p.name })),
  },
]

/**
 * Filter state plus the filtered book.
 *
 * Persona is the expensive filter — it needs the mapping engine — so it only
 * runs when a persona is actually selected.
 */
export function useLeadFilters() {
  const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS)

  const leads = useCrmStore((s) => s.leads)
  const customers = useCrmStore((s) => s.customers)
  const engagements = useCrmStore((s) => s.engagements)

  const filtered = useMemo(() => {
    let out = leads

    if (filters.market !== 'all')
      out = out.filter((l) => l.preferredLocation === filters.market)
    if (filters.campaign !== 'all')
      out = out.filter((l) => l.sourceCampaignId === filters.campaign)
    if (filters.rep !== 'all') out = out.filter((l) => l.ownerId === filters.rep)

    if (filters.persona !== 'all') {
      const customersById: Record<string, Customer> = {}
      for (const c of customers) customersById[c.id] = c
      const engByLead: Record<string, Engagement[]> = {}
      for (const e of engagements) (engByLead[e.leadId] ??= []).push(e)

      out = out.filter(
        (l: Lead) =>
          mapLeadToPersonas({
            lead: l,
            customer: customersById[l.id],
            engagements: engByLead[l.id],
          }).best.personaId === filters.persona,
      )
    }

    return out
  }, [leads, customers, engagements, filters])

  const activeCount = Object.values(filters).filter((v) => v !== 'all').length

  return {
    filters,
    setFilter: (key: keyof LeadFilters, value: string) =>
      setFilters((f) => ({ ...f, [key]: value })),
    clearFilters: () => setFilters(EMPTY_FILTERS),
    filtered,
    activeCount,
    totalCount: leads.length,
  }
}
