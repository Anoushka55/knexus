'use client'

import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import type { AgentforceVsDice, Customer, Lead, SfActivity, SfTask } from '@/lib/kpmg-dice/types'

/**
 * Typed facade over the simulated Salesforce org.
 *
 * Mirrors the shape of a real Salesforce integration — Lead, Contact,
 * Opportunity, Task and Activity operations — so agents, copilots and the live
 * transcript engine all write through one seam rather than poking at React
 * state. Every method resolves against the same in-memory store the UI renders
 * from, so a write is visible everywhere on the next tick.
 */
export const salesforceCrm = {
  /* ------------------------- reads ------------------------- */

  getLead(id: string): Lead | undefined {
    return useCrmStore.getState().leadsById[id]
  },

  listLeads(filter?: (lead: Lead) => boolean): Lead[] {
    const { leads } = useCrmStore.getState()
    return filter ? leads.filter(filter) : leads
  },

  getTasksFor(leadId: string): SfTask[] {
    return useCrmStore.getState().tasks.filter((t) => t.whatId === leadId)
  },

  getActivityFeed(limit = 50): SfActivity[] {
    return useCrmStore.getState().activities.slice(0, limit)
  },

  getActivitiesFor(recordId: string): SfActivity[] {
    return useCrmStore
      .getState()
      .activities.filter((a) => a.recordId === recordId)
  },

  isIngested(leadId: string): boolean {
    return useCrmStore.getState().ingestedLeadIds.includes(leadId)
  },

  /* ------------------------- writes ------------------------ */

  updateLead(
    id: string,
    patch: Partial<Lead>,
    meta?: { source?: SfActivity['source']; action?: string; detail?: string },
  ) {
    useCrmStore.getState().updateLead(id, patch, meta)
  },

  flagLead(
    id: string,
    flags: Parameters<ReturnType<typeof useCrmStore.getState>['flagLead']>[1],
    reason: string,
    source: SfActivity['source'] = 'DICE',
  ) {
    useCrmStore.getState().flagLead(id, flags, reason, source)
  },

  createTask(input: Parameters<ReturnType<typeof useCrmStore.getState>['createTask']>[0]) {
    return useCrmStore.getState().createTask(input)
  },

  completeTask(id: string) {
    useCrmStore.getState().completeTask(id)
  },

  logActivity(input: Omit<SfActivity, 'id' | 'at'> & { at?: string }) {
    useCrmStore.getState().logActivity(input)
  },

  /**
   * Keeps one AI-influenced decision.
   *
   * Distinct from `logActivity`, which records what changed on a record. This
   * records who wanted it, whether another agent disagreed, and that a human
   * committed it — the governance trail, not the field history.
   */
  recordDecision(
    input: Parameters<
      ReturnType<typeof useCrmStore.getState>['recordDecision']
    >[0],
  ) {
    useCrmStore.getState().recordDecision(input)
  },

  upsertContact(customer: Customer) {
    useCrmStore.getState().upsertContact(customer)
  },

  scheduleSurveyInvite(inviteId: string, reason: string) {
    useCrmStore.getState().scheduleSurveyInvite(inviteId, reason)
  },

  suppressSurveyInvite(inviteId: string, reason: string) {
    useCrmStore.getState().suppressSurveyInvite(inviteId, reason)
  },

  createRecoveryCase(
    input: Parameters<
      ReturnType<typeof useCrmStore.getState>['createRecoveryCase']
    >[0],
  ) {
    return useCrmStore.getState().createRecoveryCase(input)
  },

  updateRecoveryCase(
    id: string,
    patch: Parameters<
      ReturnType<typeof useCrmStore.getState>['updateRecoveryCase']
    >[1],
    note?: string,
  ) {
    useCrmStore.getState().updateRecoveryCase(id, patch, note)
  },

  suppressCampaign(campaignId: string, reason: string) {
    useCrmStore.getState().suppressCampaign(campaignId, reason)
  },

  /**
   * Cleaned, de-duplicated customer data flowing INTO Salesforce through the
   * EAI layer — the "sanitize first, then the CRM can be effective" step. Each
   * batch is logged so the ingestion pipeline is visible in the activity feed.
   */
  ingestSanitizedData(leadIds: string[]) {
    useCrmStore.getState().ingestSanitizedData(leadIds)
  },

  resetDemoData() {
    useCrmStore.getState().resetDemoData()
  },
}

/**
 * What native Agentforce sees on a record versus what DICE adds on top.
 *
 * Agentforce reads the CRM fields a rep typed in. DICE reads the interaction
 * evidence underneath them — which is how the gaps below get found.
 */
export function agentforceVsDice(lead: Lead): AgentforceVsDice {
  const e = lead.evidence
  const gaps: string[] = []

  if (lead.evidenceStatus === 'contradicted') {
    gaps.push(`Status "${lead.crmStatus}" is not supported by any interaction`)
  }
  if (e.daysSinceLastActivity > 21) {
    gaps.push(`No follow-up task despite ${e.daysSinceLastActivity} days of silence`)
  }
  if (lead.sentiment === 'negative' && lead.crmStatus === 'Interested') {
    gaps.push('Negative call sentiment not reflected in the lead status')
  }
  if (e.projectsViewed > 1) {
    gaps.push(
      `${e.projectsViewed} projects browsed, but only one enquiry is recorded`,
    )
  }
  if (!gaps.length) gaps.push('Record is current, but carries no intent signal')

  const signalCount =
    e.websiteVisits + e.emailOpens + e.callsAnswered + e.whatsappReplies

  const adds = [
    `Lead score ${lead.score}/100 from ${signalCount} behavioural signal${signalCount === 1 ? '' : 's'}`,
    `Evidence check: ${lead.evidenceStatus.replace('-', ' ')}`,
    'Real-time sentiment and intent from call transcripts',
    'Consolidated cross-project preferences',
    'Next best action with a stated reason',
  ]

  return {
    agentforceView: {
      status: lead.crmStatus,
      lastSyncedAt: lead.lastActivityAt,
      gaps,
    },
    diceView: {
      status: lead.crmStatus,
      evidenceStatus: lead.evidenceStatus,
      score: lead.score,
      adds,
    },
  }
}
