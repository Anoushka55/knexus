'use client'

import { useMemo } from 'react'

import { isOpen } from './overview'
import { mapLeadToPersonas } from '@/lib/kpmg-dice/lib/personas/mapping'
import { personaById, projectById } from '@/lib/kpmg-dice/data/active-reference'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import type { Engagement, Lead, Unit } from '@/lib/kpmg-dice/types'

/**
 * Which unsold flat should go to whom.
 *
 * Real estate's defining constraint is that stock is finite and every item is
 * unique — you cannot ship another 4 BHK on the eighteenth floor because
 * demand appeared. Experience platforms have no concept of inventory at all;
 * the real-estate CRMs hold inventory but allocate it by whoever asked last.
 *
 * This runs the persona engine backwards. Instead of "what kind of buyer is
 * this", it asks "given this specific unsold unit, who in the book actually
 * fits it, and why" — which turns a satisfaction model into a decision about
 * where revenue goes.
 *
 * Deterministic throughout: `mapLeadToPersonas` is already a pure rule pass,
 * and everything below it is arithmetic. No model, no key.
 */

/* ------------------------------------------------------------------ */
/* Persona affinity                                                    */
/* ------------------------------------------------------------------ */

/**
 * Which unit types each persona actually buys.
 *
 * A configured domain mapping, not a fitted one — and it is the assumption
 * most worth arguing with in a client workshop, so it lives in one table
 * rather than scattered through the scoring.
 *
 * The investor entry is the one that surprises people: investors skew small
 * because yield and exit liquidity beat square footage, which is the opposite
 * of the upgrader sitting next to them in the funnel.
 */
const PERSONA_UNIT_AFFINITY: Record<string, string[]> = {
  'persona-first-time': ['1 BHK', '2 BHK'],
  'persona-upgrade': ['3 BHK', '4 BHK'],
  'persona-investor': ['1 BHK', '2 BHK'],
  'persona-nri': ['3 BHK', '4 BHK'],
  'persona-hni': ['4 BHK', 'Penthouse'],
  // Referrals arrive through someone who already bought, so they buy across
  // the range — no affinity, and pretending otherwise would invent a signal.
  'persona-referral': [],
}

/* ------------------------------------------------------------------ */
/* Fit scoring                                                         */
/* ------------------------------------------------------------------ */

export interface LeadFit {
  lead: Lead
  /** 0–100. */
  score: number
  personaId: string
  personaConfidence: number
  /** Why this lead, in the order the rules contributed. */
  reasons: string[]
}

/**
 * A unit priced further than this from a lead's budget is not a near miss,
 * it is a different conversation. Beyond it the lead is dropped rather than
 * scored low — a ranked list whose tail is nonsense trains people to ignore
 * the head.
 */
const BUDGET_TOLERANCE = 0.28

function budgetFitScore(lead: Lead, unit: Unit) {
  const gap = Math.abs(lead.budgetCr - unit.priceCr) / unit.priceCr
  if (gap > BUDGET_TOLERANCE) return null
  // Linear inside the tolerance: an exact match scores 45, the edge scores 0.
  return Math.round((1 - gap / BUDGET_TOLERANCE) * 45)
}

/**
 * Which rules fired, without the prose.
 *
 * Scoring runs over every lead inside a unit's price window — hundreds of
 * thousands of pairs across the book — while only the top few per unit are
 * ever rendered. Building the reason strings inside that loop meant the vast
 * majority of the work was formatting sentences nobody would read, which was
 * most of this page's render cost.
 */
interface FitFlags {
  score: number
  affinity: boolean
  askedAboutProject: boolean
  wantsLocation: boolean
  highIntent: boolean
}

function scoreOnly(lead: Lead, unit: Unit, personaId: string): FitFlags | null {
  const budget = budgetFitScore(lead, unit)
  if (budget === null) return null

  let score = budget
  const affinity = (PERSONA_UNIT_AFFINITY[personaId] ?? []).includes(
    unit.unitType,
  )
  if (affinity) score += 25

  const askedAboutProject = lead.interestedProjectIds.includes(unit.projectId)
  let wantsLocation = false
  if (askedAboutProject) {
    score += 20
  } else if (projectById(unit.projectId)?.location === lead.preferredLocation) {
    wantsLocation = true
    score += 12
  }

  // A hot lead is worth putting in front of stock today; a cold one is not.
  const highIntent = lead.intent === 'high'
  if (highIntent) score += 10

  return { score: Math.min(100, score), affinity, askedAboutProject, wantsLocation, highIntent }
}

/** Turns the flags into prose — called only for the fits that survive. */
function explainFit(
  lead: Lead,
  unit: Unit,
  personaId: string,
  personaConfidence: number,
  flags: FitFlags,
): LeadFit {
  const reasons = [`Budget ₹${lead.budgetCr} Cr against a ₹${unit.priceCr} Cr unit`]
  if (flags.affinity) reasons.push(`${unit.unitType} is what this persona buys`)
  if (flags.askedAboutProject) reasons.push('Already asked about this project')
  else if (flags.wantsLocation) reasons.push(`Wants ${lead.preferredLocation}`)
  if (flags.highIntent) reasons.push('High intent')

  return { lead, score: flags.score, personaId, personaConfidence, reasons }
}

export function scoreLeadForUnit(
  lead: Lead,
  unit: Unit,
  personaId: string,
  personaConfidence: number,
): LeadFit | null {
  const flags = scoreOnly(lead, unit, personaId)
  return flags ? explainFit(lead, unit, personaId, personaConfidence, flags) : null
}

/* ------------------------------------------------------------------ */
/* Per-unit matching                                                   */
/* ------------------------------------------------------------------ */

export interface UnitMatch {
  unit: Unit
  /** Best-fitting open leads, strongest first. */
  fits: LeadFit[]
  /** True when nobody in the book fits — the finding this exists to surface. */
  orphan: boolean
}

const MAX_FITS_PER_UNIT = 4

/**
 * What counts as a credible buyer.
 *
 * Set above 45 deliberately: 45 is the most budget proximity alone can score,
 * so a threshold of 45 would call anyone with roughly the right money a
 * match — and on a book this size that is everybody, which is why the first
 * run reported zero unplaceable units out of six hundred.
 *
 * At 60 a lead has to clear the budget test AND bring a real affinity signal:
 * the persona actually buys this unit type, or they have already asked about
 * this project. That is what makes the orphan list mean something.
 */
const CREDIBLE_FIT = 60

export interface PersonaShare {
  personaId: string
  label: string
  count: number
  pct: number
}

export interface InventorySummary {
  /**
   * How the open book splits across the six personas.
   *
   * Returned from here because the mapping has already been paid for — this
   * hook assigns a persona to every open lead to decide fit, and the counts
   * fall out of that. Asking `usePersonaMap` for the same answer would run the
   * same sixteen rules against the same leads a second time.
   */
  personaMix: PersonaShare[]

  unitsTotal: number
  unitsSold: number
  unitsAvailable: number
  /** Face value of everything still on the shelf. */
  unsoldValueCr: number
  /** Units with at least one credible buyer in the book. */
  placeable: number
  /** Units with none — stock the current pipeline cannot absorb. */
  orphans: number
  orphanValueCr: number
  /** Best-matched units first, capped for rendering. */
  matches: UnitMatch[]
  /** The orphans themselves, most valuable first. */
  orphanUnits: Unit[]
}

const MAX_MATCHES = 40
const MAX_ORPHANS = 20

const round1 = (n: number) => Math.round(n * 10) / 10

/** First index whose budget is at or above `value`, in a budget-sorted list. */
function lowerBound(sorted: Lead[], value: number) {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].budgetCr < value) lo = mid + 1
    else hi = mid
  }
  return lo
}

export function useInventoryFit(projectId?: string): InventorySummary {
  const units = useCrmStore((s) => s.units)
  const leads = useCrmStore((s) => s.leads)
  const customers = useCrmStore((s) => s.customers)
  const engagements = useCrmStore((s) => s.engagements)

  return useMemo(() => {
    const scoped = projectId
      ? units.filter((u) => u.projectId === projectId)
      : units
    const available = scoped.filter((u) => u.status === 'available')

    /*
     * Persona is resolved once per lead, not once per lead per unit.
     *
     * `mapLeadToPersonas` runs sixteen rules against six personas; doing that
     * inside the unit loop would be that cost multiplied by the entire
     * available stock, to produce the same answer every time.
     */
    /*
     * Sorted by budget, because the budget test is exactly a range test.
     *
     * The naive shape is every available unit against every open lead — a few
     * hundred units against several thousand leads is millions of scoring
     * calls per render, to discard almost all of them on the first line.
     * `BUDGET_TOLERANCE` means only leads inside a price window can ever
     * match, so the window is found by binary search and the rest are never
     * touched.
     */
    const open = leads.filter(isOpen).sort((a, b) => a.budgetCr - b.budgetCr)
    const customerByLead = new Map(customers.map((c) => [c.leadId, c]))

    /*
     * Engagements are passed for the same reason `usePersonaMap` passes them:
     * several mapping rules read them, so leaving them out here would assign a
     * different persona than the Persona Mapping screen does for the same
     * lead. A hub that disagrees with the page it links to is worse than one
     * that says nothing.
     */
    const engagementsByLead: Record<string, Engagement[]> = {}
    for (const e of engagements) (engagementsByLead[e.leadId] ??= []).push(e)
    const personaOf = new Map<string, { id: string; confidence: number }>()
    const mixCounts = new Map<string, number>()
    for (const lead of open) {
      const assignment = mapLeadToPersonas({
        lead,
        customer: customerByLead.get(lead.id),
        engagements: engagementsByLead[lead.id],
      })
      personaOf.set(lead.id, {
        id: assignment.best.personaId,
        confidence: assignment.best.confidence,
      })
      mixCounts.set(
        assignment.best.personaId,
        (mixCounts.get(assignment.best.personaId) ?? 0) + 1,
      )
    }

    const personaMix: PersonaShare[] = [...mixCounts.entries()]
      .map(([personaId, count]) => ({
        personaId,
        label:
          personaById(personaId)?.shortName ??
          personaById(personaId)?.name ??
          personaId,
        count,
        pct: open.length ? Math.round((count / open.length) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const matches: UnitMatch[] = []
    let placeable = 0
    let orphans = 0
    let orphanValueCr = 0
    let unsoldValueCr = 0
    const orphanUnits: Unit[] = []

    for (const unit of available) {
      unsoldValueCr += unit.priceCr

      // Scored without prose, sorted, then only the survivors are explained.
      const scored: { lead: Lead; personaId: string; confidence: number; flags: FitFlags }[] = []
      const lo = lowerBound(open, unit.priceCr * (1 - BUDGET_TOLERANCE))
      const hi = lowerBound(open, unit.priceCr * (1 + BUDGET_TOLERANCE))
      for (let i = lo; i < hi; i += 1) {
        const lead = open[i]
        const persona = personaOf.get(lead.id)
        if (!persona) continue
        const flags = scoreOnly(lead, unit, persona.id)
        if (flags && flags.score >= CREDIBLE_FIT) {
          scored.push({ lead, personaId: persona.id, confidence: persona.confidence, flags })
        }
      }

      scored.sort((a, b) => b.flags.score - a.flags.score)
      const fits: LeadFit[] = scored
        .slice(0, MAX_FITS_PER_UNIT)
        .map((c) => explainFit(c.lead, unit, c.personaId, c.confidence, c.flags))
      const orphan = scored.length === 0
      if (orphan) {
        orphans += 1
        orphanValueCr += unit.priceCr
        orphanUnits.push(unit)
      } else {
        placeable += 1
      }

      matches.push({ unit, fits, orphan })
    }

    // Strongest single match first — that is the unit to act on today.
    matches.sort((a, b) => (b.fits[0]?.score ?? 0) - (a.fits[0]?.score ?? 0))
    orphanUnits.sort((a, b) => b.priceCr - a.priceCr)

    return {
      personaMix,
      unitsTotal: scoped.length,
      unitsSold: scoped.length - available.length,
      unitsAvailable: available.length,
      unsoldValueCr: round1(unsoldValueCr),
      placeable,
      orphans,
      orphanValueCr: round1(orphanValueCr),
      matches: matches.filter((m) => !m.orphan).slice(0, MAX_MATCHES),
      orphanUnits: orphanUnits.slice(0, MAX_ORPHANS),
    }
  }, [units, leads, customers, engagements, projectId])
}
