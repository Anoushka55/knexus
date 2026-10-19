import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'

import type { AgentContext } from '@/lib/kpmg-dice/lib/agents'
import { formatCrore } from '@/lib/kpmg-dice/lib/format'
import { detectChannel, findLeadByName } from './lookup'
import type { CopilotReply } from './types'
import type { Lead, Payment } from '@/lib/kpmg-dice/types'
import { ref } from '@/lib/kpmg-dice/data/active-reference'

/**
 * Payment Assistant.
 *
 * Turns the offline "what are the payment terms?" question into a concrete
 * schedule, a drafted finance callback, and a logged CRM query.
 */

/** Standard construction-linked plan used when a lead has no booking yet. */
const MILESTONES: [string, number, number][] = [
  ['Booking amount', 0.1, 0],
  ['Agreement & stamp duty', 0.2, 30],
  ['Slab completion (5th floor)', 0.15, 120],
  ['Slab completion (12th floor)', 0.15, 240],
  ['Internal finishing', 0.2, 360],
  ['On possession', 0.2, 480],
]

function projectFor(lead: Lead) {
  return (
    ref().projects.find((p) => lead.interestedProjectIds.includes(p.id)) ??
    ref().projects.find((p) => p.location === lead.preferredLocation) ??
    ref().projects[0]
  )
}

function repName(ownerId: string) {
  return ref().reps.find((r) => r.id === ownerId)?.name ?? 'the owner'
}

/** Builds an indicative schedule for a lead with no booking on record. */
function indicativeSchedule(lead: Lead): Payment[] {
  return MILESTONES.map(([milestone, share, offsetDays], i) => ({
    id: `IND-${lead.id}-${i}`,
    bookingId: `INDICATIVE-${lead.id}`,
    leadId: lead.id,
    milestone: `${milestone} (${Math.round(share * 100)}%)`,
    amountCr: Math.round(lead.budgetCr * share * 100) / 100,
    dueAt: new Date(
      DEMO_NOW.getTime() + offsetDays * 86_400_000,
    ).toISOString(),
    status: 'due' as const,
  }))
}

export async function resolvePaymentQuery(
  query: string,
  ctx: AgentContext,
): Promise<CopilotReply> {
  const ai = ctx.ai
  const ingested = new Set(ctx.ingestedLeadIds)
  const lead = findLeadByName(query, ctx.leads, ingested)
  const q = query.toLowerCase()

  if (!lead) {
    /* Who is asking about payments right now? */
    const askers = ctx.leads
      .filter((l) =>
        ctx.engagements.some(
          (e) =>
            e.leadId === l.id &&
            /payment|loan|emi|stamp duty|construction-linked/i.test(
              `${e.subject} ${e.summary}`,
            ),
        ),
      )
      .slice(0, 6)

    if (askers.length && /who|which|open|queries|pending/.test(q)) {
      return {
        text: `${askers.length} customers have raised a payment or finance question that has no callback logged against it.`,
        attachment: {
          kind: 'lead-list',
          title: 'Open payment queries',
          leads: askers.map((l) => ({
            lead: l,
            note: `Asked ${l.evidence.daysSinceLastActivity} days ago · ${formatCrore(l.budgetCr, { decimals: 1 })} · ${l.stage.replace('-', ' ')}`,
          })),
        },
      }
    }

    return {
      text: 'Name the customer and I will pull their payment plan — for example "Show the payment plan for Neha Iyer" or "Who has open payment queries?".',
    }
  }

  /* ---------------- Draft the finance callback ---------------- */
  if (/draft|message|callback message|write/.test(q)) {
    const channel = detectChannel(query)
    const draft = await ai.draftMessage({
      channel,
      customerName: lead.name,
      repName: repName(lead.ownerId),
      purpose: 'finance-callback',
      facts: {
        projectName: projectFor(lead).name,
        budgetCr: lead.budgetCr,
        location: lead.preferredLocation,
      },
    })

    return {
      text: `Draft finance-callback message for ${lead.name}.`,
      attachment: {
        kind: 'draft',
        channel,
        subject: draft.subject,
        body: draft.body,
        recipient: lead.name,
      },
      actions: [
        {
          id: `fin-task-${lead.id}`,
          label: 'Create finance callback task',
          crmEffect: `High-priority task on Lead ${lead.id}, due tomorrow`,
          icon: 'callback',
          write: {
            kind: 'create-task',
            leadId: lead.id,
            subject: `Finance callback — ${lead.name} (${formatCrore(lead.budgetCr, { decimals: 1 })})`,
            ownerId: lead.ownerId,
            dueInDays: 1,
            priority: 'High',
          },
        },
      ],
    }
  }

  /* ---------------- Pull the schedule ---------------- */
  const booked = ctx.payments.filter((p) => p.leadId === lead.id)
  const rows = booked.length ? booked : indicativeSchedule(lead)
  const project = projectFor(lead)

  const totalCr = Math.round(rows.reduce((s, r) => s + r.amountCr, 0) * 100) / 100
  const paidCr =
    Math.round(
      rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amountCr, 0) * 100,
    ) / 100
  const overdueCr =
    Math.round(
      rows
        .filter((r) => r.status === 'overdue')
        .reduce((s, r) => s + r.amountCr, 0) * 100,
    ) / 100

  const preamble = booked.length
    ? `${lead.name} has a live booking schedule for ${project.name}. ${formatCrore(paidCr, { decimals: 2 })} of ${formatCrore(totalCr, { decimals: 2 })} is collected${overdueCr > 0 ? `, and ${formatCrore(overdueCr, { decimals: 2 })} is overdue` : ''}.`
    : `${lead.name} has not booked yet, so this is the indicative construction-linked plan for ${project.name} at their ${formatCrore(lead.budgetCr, { decimals: 1 })} budget.`

  return {
    text: `${preamble} Possession is ${project.possession}.`,
    attachment: {
      kind: 'payment-schedule',
      lead,
      rows,
      totalCr,
      paidCr,
      overdueCr,
    },
    actions: [
      {
        id: `fin-task-${lead.id}`,
        label: 'Create finance callback task',
        crmEffect: `High-priority task on Lead ${lead.id}, due tomorrow`,
        icon: 'callback',
        write: {
          kind: 'create-task',
          leadId: lead.id,
          subject: `Finance callback — ${lead.name} (${formatCrore(lead.budgetCr, { decimals: 1 })})`,
          ownerId: lead.ownerId,
          dueInDays: 1,
          priority: 'High',
        },
      },
      {
        id: `log-query-${lead.id}`,
        label: 'Log the payment query',
        crmEffect: `Activity logged on Lead ${lead.id}`,
        icon: 'message',
        write: {
          kind: 'log-activity',
          object: 'Lead',
          recordId: lead.id,
          recordName: lead.name,
          action: 'Payment query logged',
          detail: `Payment schedule for ${project.name} shared · ${formatCrore(totalCr, { decimals: 2 })} across ${rows.length} milestones`,
        },
      },
    ],
  }
}

export const PAYMENT_PROMPT_CHIPS = [
  'Show the payment plan for Neha Iyer',
  'Who has open payment queries?',
  'Payment schedule for Ritu Sen',
  'Draft a finance callback for Neha Iyer',
]
