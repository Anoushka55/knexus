'use client'

import { useMemo } from 'react'

import { nextBestActionQueue, riskDigest, useAgentContext } from '@/lib/kpmg-dice/lib/agents'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import type { JourneyStage, Lead, SiteVisit } from '@/lib/kpmg-dice/types'
import {
  selectConversionTrend,
  selectFunnel,
  selectKpiValues,
  selectOverallConversion,
  selectTopCampaigns,
} from './overview'
import { selectNpsSummary } from './feedback'

/**
 * Single subscription point for the Overview.
 *
 * Selectors sweep the full 12,842-lead book, so each result is memoised against
 * the slice it actually depends on — a lead flag recomputes the funnel and the
 * alerts without touching the campaign table.
 */
export function useOverviewData() {
  const ctx = useAgentContext()
  const { leads, bookings } = ctx

  // NPS comes from the feedback book, so the Overview shows satisfaction
  // beside revenue rather than hiding it one click into the rail.
  const surveyResponses = useCrmStore((s) => s.surveyResponses)
  const kpis = useMemo(
    () => selectKpiValues(leads, bookings, selectNpsSummary(surveyResponses).nps),
    [leads, bookings, surveyResponses],
  )
  const funnel = useMemo(() => selectFunnel(leads), [leads])
  const overallConversion = useMemo(
    () => selectOverallConversion(leads),
    [leads],
  )
  const trend = useMemo(() => selectConversionTrend(leads), [leads])
  const campaigns = useMemo(() => selectTopCampaigns(leads), [leads])

  // Both queues come from the agent layer — the same rule pass the Next Best
  // Action and Risk Dashboard agents run inside their detect step.
  const nextBestActions = useMemo(() => nextBestActionQueue(ctx), [ctx])
  const alerts = useMemo(() => riskDigest(ctx), [ctx])

  return {
    kpis,
    funnel,
    overallConversion,
    trend,
    campaigns,
    nextBestActions,
    alerts,
  }
}

/**
 * Which lead the snapshot should open on, for any book.
 *
 * This used to be a hardcoded id — the seeded lead the demo script narrates.
 * A direct `leadsById[...]` lookup returns undefined for a book that does not
 * contain it, and the snapshot card opens with `if (!hero) return null`, so an
 * imported book made the whole card vanish rather than show the new client's
 * own customer. Ranking has no such failure mode: it returns someone whenever
 * the book has anyone.
 *
 * Ranked rather than filtered, so this always returns someone as long as the
 * book has a lead at all. The weights encode what makes the card worth looking
 * at rather than what makes a lead important commercially:
 *
 * - a recorded objection outranks everything, because it is what fills both the
 *   AI Insights line and the Recommended Action play;
 * - a mid-journey stage next, because the progress strip only reads as a
 *   journey when there are nodes behind the current one and nodes ahead of it;
 * - then intent and score, to break ties towards a lead a rep would actually
 *   be working.
 *
 * `dnd` leads are skipped: the card's whole call to action is "Take Action",
 * and pointing it at someone who has asked not to be contacted is the one
 * recommendation it must never make.
 */
const STAGE_WEIGHT: Partial<Record<JourneyStage, number>> = {
  engaged: 40,
  qualified: 60,
  'site-visit': 80,
  proposal: 80,
}

export function selectHeroLead(
  leads: Lead[],
  siteVisits: SiteVisit[],
): Lead | null {
  if (!leads.length) return null

  const withObjection = new Set(
    siteVisits.filter((v) => v.objection).map((v) => v.leadId),
  )

  let best: Lead | null = null
  let bestRank = -Infinity

  for (const lead of leads) {
    if (lead.dnd) continue
    const rank =
      lead.score +
      (withObjection.has(lead.id) ? 200 : 0) +
      (STAGE_WEIGHT[lead.stage] ?? 0) +
      (lead.intent === 'high' ? 30 : lead.intent === 'medium' ? 10 : 0)
    // Strictly greater, so an equal rank keeps the earlier lead and the choice
    // is stable across renders rather than drifting with iteration order.
    if (rank > bestRank) {
      bestRank = rank
      best = lead
    }
  }

  // Every lead in the book is dnd. Rare, but returning null here would blank
  // the card for a reason the user cannot act on.
  return best ?? leads[0]
}

/**
 * The lead the snapshot renders.
 *
 * `leadId` names one; without it the ranked pick stands. The Overview passes
 * nothing and is unaffected — the directory names a customer, and the same card
 * serves both rather than being forked into a near-copy.
 *
 * An id that resolves to nothing falls back to the ranked pick rather than
 * blanking the card, which is what a stale link or a replaced book produces.
 */
export function useHeroLead(leadId?: string) {
  const leadsById = useCrmStore((s) => s.leadsById)
  const leads = useCrmStore((s) => s.leads)
  const engagements = useCrmStore((s) => s.engagements)
  const siteVisits = useCrmStore((s) => s.siteVisits)

  return useMemo(() => {
    const named = leadId ? leadsById[leadId] : undefined
    const lead = named ?? selectHeroLead(leads, siteVisits)
    if (!lead) return null
    return {
      lead,
      engagements: engagements.filter((e) => e.leadId === lead.id),
      siteVisits: siteVisits.filter((v) => v.leadId === lead.id),
    }
  }, [leadId, leadsById, leads, engagements, siteVisits])
}
