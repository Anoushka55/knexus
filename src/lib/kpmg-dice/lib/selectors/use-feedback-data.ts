'use client'

import { useMemo } from 'react'

import { personaById } from '@/lib/kpmg-dice/data/active-reference'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import {
  selectCsatByTouchpoint,
  selectCsatTrend,
  selectIssueTrends,
  selectDrivers,
  selectInterventions,
  selectJourneyHeatmap,
  selectNpsSummary,
  selectNpsTrend,
  selectPropensityHeatmap,
  selectRecoveryQueue,
  selectRecoverySummary,
  selectRepresentation,
  selectResponseKnowledge,
  selectRootCauseClusters,
  selectSatisfactionByPersona,
  selectSatisfactionByProject,
  selectSentimentBreakdown,
  selectWordFrequency,
  selectSurveyQueue,
  selectThemes,
} from './feedback'

/**
 * One pass over the feedback book, shared by every screen in the feature.
 *
 * Theme extraction walks every verbatim, and the clusters, drivers and
 * interventions all derive from it — computing them per screen would repeat the
 * same scan four times on a book this size.
 */
export function useFeedbackData() {
  const surveyInvites = useCrmStore((s) => s.surveyInvites)
  const surveyResponses = useCrmStore((s) => s.surveyResponses)
  const recoveryCases = useCrmStore((s) => s.recoveryCases)

  return useMemo(() => {
    const themes = selectThemes(surveyResponses)
    const clusters = selectRootCauseClusters(surveyResponses, themes)

    return {
      invites: surveyInvites,
      responses: surveyResponses,
      cases: recoveryCases,

      /* Type 1 */
      nps: selectNpsSummary(surveyResponses),
      npsTrend: selectNpsTrend(surveyResponses),
      csatByTouchpoint: selectCsatByTouchpoint(surveyResponses),
      csatTrend: selectCsatTrend(surveyResponses),
      wordFrequency: selectWordFrequency(surveyResponses),
      sentiment: selectSentimentBreakdown(surveyResponses),

      /* Type 2 */
      themes,
      clusters,
      journeyHeatmap: selectJourneyHeatmap(surveyResponses),
      byPersona: selectSatisfactionByPersona(
        surveyResponses,
        themes,
        (id) => personaById(id)?.shortName ?? id,
      ),
      byProject: selectSatisfactionByProject(surveyResponses, themes),
      issueTrends: selectIssueTrends(surveyResponses, themes),
      queue: selectSurveyQueue(surveyInvites),
      propensityHeatmap: selectPropensityHeatmap(surveyInvites),
      recoveryQueue: selectRecoveryQueue(surveyResponses, recoveryCases),
      recovery: selectRecoverySummary(surveyResponses, recoveryCases),
      drivers: selectDrivers(surveyResponses, themes),
      interventions: selectInterventions(clusters),

      /* Outcome measures — what the engine's predictions actually produced. */
      representation: selectRepresentation(
        surveyInvites,
        surveyResponses,
        (id) => personaById(id)?.shortName ?? id,
      ),
      responseKnowledge: selectResponseKnowledge(
        surveyResponses,
        (id) => personaById(id)?.shortName ?? id,
      ),
    }
  }, [surveyInvites, surveyResponses, recoveryCases])
}

/** Everything recorded against one customer, for the Customer 360 drill-in. */
export function useFeedbackForLead(leadId: string) {
  const surveyInvites = useCrmStore((s) => s.surveyInvites)
  const surveyResponses = useCrmStore((s) => s.surveyResponses)
  const recoveryCases = useCrmStore((s) => s.recoveryCases)

  return useMemo(() => {
    const responses = surveyResponses.filter((r) => r.leadId === leadId)
    return {
      invites: surveyInvites.filter((i) => i.leadId === leadId),
      responses,
      cases: recoveryCases.filter((c) => c.leadId === leadId),
      latest: responses.sort((a, b) =>
        b.respondedAt.localeCompare(a.respondedAt),
      )[0],
    }
  }, [surveyInvites, surveyResponses, recoveryCases, leadId])
}
