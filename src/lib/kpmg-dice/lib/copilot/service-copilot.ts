import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'
import type { AgentContext } from '@/lib/kpmg-dice/lib/agents'
import { findLeadByName } from './lookup'
import type { CopilotReply } from './types'
import type { ServiceTicket } from '@/lib/kpmg-dice/types'
import { ref } from '@/lib/kpmg-dice/data/active-reference'

/**
 * Service Assistant.
 *
 * Summarises open post-sales tickets, scores SLA risk, and recommends both a
 * resolution and an owner — so unresolved tickets stop quietly damaging CX.
 */

/** Negative = days until SLA, positive = days already breached. */
export function slaDaysOverdue(ticket: ServiceTicket) {
  return Math.round(
    (DEMO_NOW.getTime() - new Date(ticket.slaDueAt).getTime()) / 86_400_000,
  )
}

const RESOLUTION_PLAYS: Record<string, string> = {
  Documentation:
    'Assign a documentation owner, confirm the registration slot in writing, and share the appointment date the same day.',
  Finance:
    'Reconcile the receipt against the collection ledger and issue a corrected statement within 24 hours.',
  Handover:
    'Share the dated possession plan with the site engineer copied in, then schedule a joint walkthrough.',
  Quality:
    'Raise a snag-closure work order with the contractor and set a re-inspection date with the customer present.',
  Allotment:
    'Check parking inventory against the allotment letter and confirm the reassignment in writing.',
  Amenities:
    'Activate the membership on the facilities system and send the access credentials.',
}

function ownerFor(ticket: ServiceTicket, ctx: AgentContext) {
  const lead = ctx.leads.find((l) => l.id === ticket.leadId)
  const rep = ref().reps.find((r) => r.id === lead?.ownerId)
  // Critical and breached tickets escalate beyond the owning rep.
  if (ticket.severity === 'critical' || slaDaysOverdue(ticket) > 0) {
    return `${rep?.name ?? 'Owner'} + Customer Care lead`
  }
  return rep?.name ?? 'Customer Care'
}

export async function resolveServiceQuery(
  query: string,
  ctx: AgentContext,
): Promise<CopilotReply> {
  const ai = ctx.ai
  const q = query.toLowerCase()
  const ingested = new Set(ctx.ingestedLeadIds)
  const lead = findLeadByName(query, ctx.leads, ingested)

  const open = ctx.serviceTickets.filter((t) => t.status !== 'resolved')

  /* ---------------- Tickets for one customer ---------------- */
  if (lead) {
    const theirs = open.filter((t) => t.leadId === lead.id)
    if (!theirs.length) {
      return {
        text: `${lead.name} has no open service tickets. ${ctx.serviceTickets.filter((t) => t.leadId === lead.id).length} historic ticket(s) are all resolved.`,
      }
    }
    return buildTicketReply(
      theirs,
      ctx,
      ai,
      `${lead.name} has ${theirs.length} open ticket${theirs.length === 1 ? '' : 's'}.`,
    )
  }

  /* ---------------- SLA-breached only ---------------- */
  if (/sla|breach|overdue|late|escalat/.test(q)) {
    const breached = open
      .filter((t) => slaDaysOverdue(t) > 0)
      .sort((a, b) => slaDaysOverdue(b) - slaDaysOverdue(a))

    if (!breached.length) {
      return { text: 'No open ticket has breached its SLA. Everything is inside target.' }
    }
    const shown = breached.slice(0, 6)
    return buildTicketReply(
      shown,
      ctx,
      ai,
      breached.length > shown.length
        ? `${breached.length} open tickets have breached their SLA — showing the ${shown.length} most overdue.`
        : `${breached.length} open ticket${breached.length === 1 ? ' has' : 's have'} breached their SLA.`,
    )
  }

  /* ---------------- Default: worst-first worklist ---------------- */
  if (!open.length) {
    return { text: 'There are no open service tickets right now.' }
  }

  const worst = [...open]
    .sort((a, b) => slaDaysOverdue(b) - slaDaysOverdue(a))
    .slice(0, 6)

  return buildTicketReply(
    worst,
    ctx,
    ai,
    `${open.length} tickets are open — showing the ${worst.length} closest to breaching.`,
  )
}

async function buildTicketReply(
  tickets: ServiceTicket[],
  ctx: AgentContext,
  ai: AgentContext['ai'],
  /** Complete lead-in sentence; the caller owns the counts so they stay honest. */
  leadIn: string,
): Promise<CopilotReply> {
  const enriched = await Promise.all(
    tickets.map(async (ticket) => {
      const { headline } = await ai.summarize(ticket.detail, {
        projectName: ticket.category,
      })
      const overdue = slaDaysOverdue(ticket)
      return {
        ticket,
        slaDays: overdue,
        summary: headline,
        resolution:
          RESOLUTION_PLAYS[ticket.category] ??
          'Assign an owner and confirm a resolution date with the customer.',
        owner: ownerFor(ticket, ctx),
      }
    }),
  )

  const breachedShown = enriched.filter((e) => e.slaDays > 0).length
  const nextUp = enriched.find((e) => e.slaDays <= 0)

  const tail = breachedShown
    ? ` These need an owner today${nextUp ? `, and ${nextUp.ticket.customerName}'s breaches in ${Math.abs(nextUp.slaDays)} day${Math.abs(nextUp.slaDays) === 1 ? '' : 's'}` : ''}.`
    : ' Nothing has breached yet — the closest is listed first.'

  return {
    text: `${leadIn}${tail}`,
    attachment: { kind: 'ticket-list', tickets: enriched },
    actions: enriched.slice(0, 1).map((e) => ({
      id: `resolve-${e.ticket.id}`,
      label: `Create resolution task — ${e.ticket.customerName}`,
      crmEffect: `Task created and assigned to ${e.owner}`,
      icon: 'task' as const,
      write: {
        kind: 'create-task' as const,
        leadId: e.ticket.leadId,
        subject: `Resolve: ${e.ticket.subject} (${e.ticket.customerName})`,
        ownerId:
          ctx.leads.find((l) => l.id === e.ticket.leadId)?.ownerId ??
          ref().reps[0].id,
        dueInDays: e.slaDays > 0 ? 0 : 1,
        priority: 'High' as const,
      },
    })),
  }
}

export const SERVICE_PROMPT_CHIPS = [
  'Show me all open tickets',
  'Which tickets have breached SLA?',
  'Any open tickets for Ritu Sen?',
  'What should we escalate today?',
]
