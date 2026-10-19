import { AGENTS_BY_ID } from '@/lib/kpmg-dice/lib/agents'
import type { CrmWrite } from '@/lib/kpmg-dice/lib/agents'
import type { Lead, Severity } from '@/lib/kpmg-dice/types'

/**
 * Real-time triggers.
 *
 * As the call streams, a trigger fires the moment its pattern appears in a
 * customer line. Each one names the DICE agent responsible and carries the
 * exact Salesforce writes it will make — the same `CrmWrite` shape the agent
 * gallery uses, executed through the same runtime.
 */

export interface LiveTrigger {
  id: string
  /** Matched against each customer line as it is revealed. */
  pattern: RegExp
  agentId: string
  detected: string
  action: string
  severity: Severity
  /** Built at fire time so the writes carry the live lead. */
  writes: (lead: Lead) => CrmWrite[]
}

export const LIVE_TRIGGERS: LiveTrigger[] = [
  /* ---------------- Opt-out ---------------- */
  {
    id: 'trg-dnd',
    pattern: /do not call again|don'?t call again|stop calling|remove my number/i,
    agentId: 'agent-sentiment',
    detected: 'Do-Not-Contact intent',
    action:
      'Marking lead Cold + DND, suppressing campaign outreach, notifying the manager',
    severity: 'critical',
    writes: (lead) => [
      {
        kind: 'flag-lead',
        leadId: lead.id,
        flags: {
          crmStatus: 'Do Not Contact',
          cold: true,
          dnd: true,
          intent: 'cold',
        },
        reason: 'Explicit opt-out detected in live call',
      },
      {
        kind: 'suppress-campaign',
        campaignId: lead.sourceCampaignId,
        reason: `Opt-out from ${lead.name} on a live call`,
      },
      {
        kind: 'log-activity',
        object: 'Activity',
        recordId: lead.id,
        recordName: lead.name,
        action: 'Manager notified',
        detail:
          'Opt-out captured in real time — record removed from all active outreach.',
      },
    ],
  },

  /* ---------------- Lost to a competitor ---------------- */
  {
    id: 'trg-lost',
    pattern: /already (bought|purchased|booked)|registered it in/i,
    agentId: 'agent-validation',
    detected: 'Purchase already made elsewhere',
    action: 'Downgrading the CRM status — the pipeline entry is not real',
    severity: 'high',
    writes: (lead) => [
      {
        kind: 'flag-lead',
        leadId: lead.id,
        flags: { evidenceStatus: 'contradicted' },
        reason: 'Customer confirmed a purchase elsewhere during the call',
      },
    ],
  },

  /* ---------------- Deferred callback ---------------- */
  {
    id: 'trg-defer',
    pattern: /call me after (\d+) days|after 15 days|call me later|reconnect in/i,
    agentId: 'agent-followup',
    detected: 'Deferred callback requested',
    action: 'Creating a dated follow-up task and routing to the nurture journey',
    severity: 'high',
    writes: (lead) => [
      {
        kind: 'create-task',
        leadId: lead.id,
        subject: `Callback requested on live call — ${lead.name}`,
        ownerId: lead.ownerId,
        dueInDays: 15,
        priority: 'High',
      },
      {
        kind: 'log-activity',
        object: 'Lead',
        recordId: lead.id,
        recordName: lead.name,
        action: 'Routed to nurture journey',
        detail:
          'Decision deferred pending an existing property sale — nurture until the callback date.',
      },
    ],
  },

  /* ---------------- Payment / finance enquiry ---------------- */
  {
    id: 'trg-payment',
    pattern: /payment terms|payment plan|home loan|finance team|monthly outflow/i,
    agentId: 'agent-payment',
    detected: 'Payment & finance enquiry',
    action: 'Pulling the payment plan and raising a finance callback',
    severity: 'high',
    writes: (lead) => [
      {
        kind: 'create-task',
        leadId: lead.id,
        subject: `Finance callback — payment plan for ${lead.name} (₹${lead.budgetCr} Cr)`,
        ownerId: lead.ownerId,
        dueInDays: 1,
        priority: 'High',
      },
      {
        kind: 'log-activity',
        object: 'Lead',
        recordId: lead.id,
        recordName: lead.name,
        action: 'Payment query logged',
        detail: 'Customer asked for payment terms and home-loan tie-ups on the call.',
      },
    ],
  },

  /* ---------------- Possession objection ---------------- */
  {
    id: 'trg-possession',
    pattern: /possession|lease ends|ready to move|ready-to-move/i,
    agentId: 'agent-visit',
    detected: 'Possession-timeline objection',
    action: 'Logging the objection and surfacing ready-possession inventory',
    severity: 'medium',
    writes: (lead) => [
      {
        kind: 'log-activity',
        object: 'Opportunity',
        recordId: lead.id,
        recordName: lead.name,
        action: 'Objection captured',
        detail:
          'Possession timeline raised as the blocking concern — ready-to-move options to be shared.',
      },
    ],
  },

  /* ---------------- High purchase intent ---------------- */
  {
    id: 'trg-hot',
    pattern: /ready to move ahead|close this soon|book this quarter|want to book|ready to proceed/i,
    agentId: 'agent-nba',
    detected: 'High purchase intent',
    action: 'Flagging as a Hot Lead and creating the next-step task',
    severity: 'high',
    writes: (lead) => [
      {
        kind: 'flag-lead',
        leadId: lead.id,
        flags: { intent: 'high', crmStatus: 'Negotiation' },
        reason: 'High purchase intent detected in live call',
      },
      {
        kind: 'create-task',
        leadId: lead.id,
        subject: `Site visit / closing call — ${lead.name}`,
        ownerId: lead.ownerId,
        dueInDays: 0,
        priority: 'High',
      },
    ],
  },
]

export function agentNameFor(agentId: string) {
  return AGENTS_BY_ID[agentId]?.name ?? 'DICE'
}
