
import type { AgentContext } from '@/lib/kpmg-dice/lib/agents'
import {
  isAtRisk,
  isOpen,
  nextBestActionFor,
  selectKpiValues,
  weightedValueCr,
} from '@/lib/kpmg-dice/lib/selectors/overview'
import { formatCrore, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { detectChannel, findLeadByName } from './lookup'
import type { CopilotAction, CopilotReply } from './types'
import type { Lead } from '@/lib/kpmg-dice/types'
import { ref } from '@/lib/kpmg-dice/data/active-reference'

/**
 * Sales Copilot intent routing.
 *
 * Every answer is grounded in the live CRM store, and every action is a
 * `CrmWrite` the user has to confirm — the copilot proposes, it never writes
 * silently.
 */

type Intent =
  | 'next-action'
  | 'draft'
  | 'going-cold'
  | 'lead-summary'
  | 'pipeline'
  | 'unknown'

function classify(query: string): Intent {
  const q = query.toLowerCase()
  if (/draft|write|compose|send a|message for/.test(q)) return 'draft'
  if (/going cold|cold|stalled|silent|at risk|slipping/.test(q)) return 'going-cold'
  if (/next|what should i do|priorit|action/.test(q)) return 'next-action'
  if (/pipeline|how (are|is) (we|my|the)|summary|numbers|forecast/.test(q))
    return 'pipeline'
  if (/tell me about|who is|show me|profile|status of/.test(q))
    return 'lead-summary'
  return 'unknown'
}

function repName(ownerId: string) {
  return ref().reps.find((r) => r.id === ownerId)?.name ?? 'the owner'
}

function projectFor(lead: Lead) {
  return (
    ref().projects.find((p) => lead.interestedProjectIds.includes(p.id))?.name ??
    ref().projects.find((p) => p.location === lead.preferredLocation)?.name
  )
}

function taskAction(
  lead: Lead,
  subject: string,
  dueInDays: number,
  label: string,
): CopilotAction {
  return {
    id: `task-${lead.id}-${dueInDays}`,
    label,
    crmEffect: `Task created on Lead ${lead.id}, due in ${dueInDays === 0 ? 'today' : `${dueInDays} day${dueInDays === 1 ? '' : 's'}`}`,
    icon: 'task',
    write: {
      kind: 'create-task',
      leadId: lead.id,
      subject,
      ownerId: lead.ownerId,
      dueInDays,
      priority: lead.score >= 80 ? 'High' : 'Normal',
    },
  }
}

export async function resolveSalesQuery(
  query: string,
  ctx: AgentContext,
): Promise<CopilotReply> {
  // The context carries the service for the currently selected AI mode.
  const ai = ctx.ai
  const ingested = new Set(ctx.ingestedLeadIds)
  const intent = classify(query)
  const lead = findLeadByName(query, ctx.leads, ingested)

  /* ---------------- Draft a message ---------------- */
  if (intent === 'draft') {
    if (!lead) {
      return {
        text: 'I can draft that — which customer is it for? Try naming them, for example "Draft a WhatsApp follow-up for Rohit Mehta".',
      }
    }

    const channel = detectChannel(query)
    const visits = ctx.siteVisits.filter((v) => v.leadId === lead.id)
    const objection = visits.find((v) => v.objection)?.objection

    const purpose = /site visit|visit/.test(query.toLowerCase())
      ? 'site-visit'
      : /payment|plan|finance/.test(query.toLowerCase())
        ? 'payment-plan'
        : lead.evidence.daysSinceLastActivity > 21
          ? 'nurture'
          : 'follow-up'

    const draft = await ai.draftMessage({
      channel,
      customerName: lead.name,
      repName: repName(lead.ownerId),
      purpose,
      facts: {
        projectName: projectFor(lead),
        budgetCr: lead.budgetCr,
        location: lead.preferredLocation,
        objection,
        daysSinceContact: lead.evidence.daysSinceLastActivity,
      },
    })

    return {
      text: `Here is a ${channel} draft for ${lead.name}. It leads with ${objection ? `their ${objection.toLowerCase()} concern` : 'the last thing you discussed'}, which is what they actually raised on the record.`,
      attachment: {
        kind: 'draft',
        channel,
        subject: draft.subject,
        body: draft.body,
        recipient: lead.name,
      },
      actions: [
        {
          id: `log-${lead.id}`,
          label: 'Send & log to CRM',
          crmEffect: `Activity logged on Lead ${lead.id} with the message body`,
          icon: 'message',
          write: {
            kind: 'log-activity',
            object: 'Lead',
            recordId: lead.id,
            recordName: lead.name,
            action: `${channel === 'whatsapp' ? 'WhatsApp' : channel === 'email' ? 'Email' : 'SMS'} sent`,
            detail: draft.body.replace(/\n+/g, ' ').slice(0, 160),
          },
        },
        taskAction(
          lead,
          `Follow up on ${channel} message — ${lead.name}`,
          3,
          'Schedule a follow-up',
        ),
      ],
    }
  }

  /* ---------------- Leads going cold ---------------- */
  if (intent === 'going-cold') {
    const cold = ctx.leads
      .filter(
        (l) =>
          isOpen(l) &&
          !l.dnd &&
          l.evidence.daysSinceLastActivity > 21 &&
          (l.intent === 'high' || l.intent === 'medium'),
      )
      .sort((a, b) => weightedValueCr(b) - weightedValueCr(a))
      .slice(0, 6)

    if (!cold.length) {
      return { text: 'Nothing is going cold right now — every warm lead has been touched in the last three weeks.' }
    }

    const exposure = cold.reduce((s, l) => s + weightedValueCr(l), 0)

    return {
      text: `${cold.length} warm leads have gone quiet for more than 21 days, carrying ${formatCrore(Math.round(exposure * 10) / 10, { decimals: 1 })} of weighted exposure. These are the ones worth calling today.`,
      attachment: {
        kind: 'lead-list',
        title: 'Going cold — no contact in 21+ days',
        leads: cold.map((l) => ({
          lead: l,
          note: `Silent ${l.evidence.daysSinceLastActivity} days · ${l.stage.replace('-', ' ')} · owner ${repName(l.ownerId).split(' ')[0]}`,
        })),
      },
      actions: [
        {
          id: 'bulk-revive',
          label: `Create revival tasks for all ${cold.length}`,
          crmEffect: `${cold.length} high-priority tasks created against their owners`,
          icon: 'task',
          write: {
            kind: 'create-task',
            leadId: cold[0].id,
            subject: `Revive ${cold.length} cold warm leads — starting with ${cold[0].name}`,
            ownerId: cold[0].ownerId,
            dueInDays: 1,
            priority: 'High',
          },
        },
      ],
    }
  }

  /* ---------------- Pipeline summary ---------------- */
  if (intent === 'pipeline') {
    const kpis = selectKpiValues(ctx.leads, ctx.bookings)
    const atRisk = ctx.leads.filter(isAtRisk).length

    return {
      text: `Across the book: ${formatNumber(kpis.totalLeads)} leads, ${formatNumber(kpis.hotLeads)} of them hot, and ${formatNumber(kpis.bookings)} bookings worth ${formatCrore(kpis.revenueYtdCr)} year to date. The number I would watch is ${formatCrore(kpis.revenueAtRiskCr)} at risk across ${formatNumber(atRisk)} records.`,
      attachment: {
        kind: 'kpi-summary',
        figures: [
          { label: 'Total leads', value: formatNumber(kpis.totalLeads) },
          { label: 'Hot leads', value: formatNumber(kpis.hotLeads) },
          { label: 'Site visits', value: formatNumber(kpis.siteVisits) },
          { label: 'Bookings', value: formatNumber(kpis.bookings) },
          { label: 'Revenue YTD', value: formatCrore(kpis.revenueYtdCr) },
          {
            label: 'At risk',
            value: formatCrore(kpis.revenueAtRiskCr),
            danger: true,
          },
        ],
      },
    }
  }

  /* ---------------- Next action / lead summary ---------------- */
  if (lead) {
    const { action } = nextBestActionFor(lead)
    const visits = ctx.siteVisits.filter((v) => v.leadId === lead.id)
    const objection = visits.find((v) => v.objection)?.objection
    const engagements = ctx.engagements.filter((e) => e.leadId === lead.id)

    const nba = await ai.recommendNextBestAction({
      score: lead.score,
      dnd: lead.dnd,
      intent: lead.intent,
    })

    const reason =
      lead.evidenceNote ??
      `${engagements.length} recorded interactions, last activity ${lead.evidence.daysSinceLastActivity} days ago.`

    const actions: CopilotAction[] = [
      taskAction(
        lead,
        `${action} — ${lead.name}`,
        lead.score >= 90 ? 0 : 2,
        `Create task: ${action}`,
      ),
    ]

    if (lead.evidenceStatus === 'contradicted') {
      actions.push({
        id: `flag-${lead.id}`,
        label: 'Downgrade — evidence does not support the status',
        crmEffect: `Lead ${lead.id} status → Contacted, evidence → weak`,
        icon: 'flag',
        write: {
          kind: 'flag-lead',
          leadId: lead.id,
          flags: { crmStatus: 'Contacted', evidenceStatus: 'weak-evidence' },
          reason: 'Downgraded from Sales Copilot — unsupported status',
        },
      })
    }

    return {
      text: `${lead.name} scores ${lead.score}/100 and sits at ${lead.stage.replace('-', ' ')}. My recommendation is **${action}** — ${nba.reason}${objection ? ` Their stated objection is ${objection.toLowerCase()}, so lead with that.` : ''}`,
      attachment: {
        kind: 'lead-card',
        lead,
        reason,
        action,
      },
      actions,
    }
  }

  /* ---------------- Fallback ---------------- */
  return {
    text: "I did not find a customer in that question. I can help with a specific lead (\"What should I do next with Priya Shah?\"), drafting outreach (\"Draft a WhatsApp follow-up for Rohit Mehta\"), spotting risk (\"Which of my leads are going cold?\") or a pipeline read (\"How is my pipeline looking?\").",
  }
}

export const SALES_PROMPT_CHIPS = [
  'What should I do next with Priya Shah?',
  'Draft a WhatsApp follow-up for Rohit Mehta',
  'Which of my leads are going cold?',
  'How is my pipeline looking?',
  'Tell me about Aditya Ranade',
]
