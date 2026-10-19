'use client'

import { useMemo } from 'react'

import { isOpen } from '@/lib/kpmg-dice/lib/selectors/overview'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import type { Customer, Engagement, Lead, PersonaAssignment } from '@/lib/kpmg-dice/types'
import { mapBook, mapLeadToPersonas } from './mapping'
import { ref } from '@/lib/kpmg-dice/data/active-reference'

export interface PersonaBucket {
  personaId: string
  leads: Lead[]
  count: number
  avgBudgetCr: number
  avgScore: number
  highIntentCount: number
  /** Share of the mapped book, %. */
  sharePct: number
}

/** Maps the whole open book once, then buckets it by best-fit persona. */
export function usePersonaMap() {
  const leads = useCrmStore((s) => s.leads)
  const customers = useCrmStore((s) => s.customers)
  const engagements = useCrmStore((s) => s.engagements)

  return useMemo(() => {
    const customersById: Record<string, Customer> = {}
    for (const c of customers) customersById[c.id] = c

    const engagementsByLead: Record<string, Engagement[]> = {}
    for (const e of engagements) {
      ;(engagementsByLead[e.leadId] ??= []).push(e)
    }

    const openLeads = leads.filter(isOpen)
    const assignments = mapBook(openLeads, customersById, engagementsByLead)

    const buckets: PersonaBucket[] = ref().personas.map((persona) => {
      const bucketLeads = openLeads.filter(
        (l) => assignments.get(l.id)?.best.personaId === persona.id,
      )
      const count = bucketLeads.length
      const sumBudget = bucketLeads.reduce((s, l) => s + l.budgetCr, 0)
      const sumScore = bucketLeads.reduce((s, l) => s + l.score, 0)

      return {
        personaId: persona.id,
        // Records with an ingested interaction history come first — those are
        // the ones with a full evidence trail to drill into — then by score.
        leads: [...bucketLeads].sort((a, b) => {
          const aIngested = engagementsByLead[a.id] ? 1 : 0
          const bIngested = engagementsByLead[b.id] ? 1 : 0
          if (aIngested !== bIngested) return bIngested - aIngested
          return b.score - a.score
        }),
        count,
        avgBudgetCr: count ? Math.round((sumBudget / count) * 10) / 10 : 0,
        avgScore: count ? Math.round(sumScore / count) : 0,
        highIntentCount: bucketLeads.filter((l) => l.intent === 'high').length,
        sharePct: openLeads.length
          ? Math.round((count / openLeads.length) * 1000) / 10
          : 0,
      }
    })

    return { assignments, buckets, mappedCount: openLeads.length }
  }, [leads, customers, engagements])
}

/** Single-lead mapping for the Customer 360 header and the drill-in panel. */
export function usePersonaFor(leadId: string): PersonaAssignment | null {
  const lead = useCrmStore((s) => s.leadsById[leadId])
  const customers = useCrmStore((s) => s.customers)
  const engagements = useCrmStore((s) => s.engagements)

  return useMemo(() => {
    if (!lead) return null
    return mapLeadToPersonas({
      lead,
      customer: customers.find((c) => c.id === leadId),
      engagements: engagements.filter((e) => e.leadId === leadId),
    })
  }, [lead, customers, engagements, leadId])
}
