import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'
import {
  isAtRisk,
  isOpen,
  nextBestActionFor,
  selectCampaignRows,
  selectNextBestActions,
  selectRiskAlerts,
  weightedValueCr,
} from '@/lib/kpmg-dice/lib/selectors/overview'
import type {
  Agent,
  AgentActionPlan,
  AgentContext,
  AgentFinding,
  CrmWrite,
} from './types'
import { FEEDBACK_AGENTS } from './feedback-agents'
import type { Lead, Severity } from '@/lib/kpmg-dice/types'

/**
 * The DICE agent registry.
 *
 * Each agent maps one real-world CRM failure to a detection rule and a concrete
 * write back into Salesforce. Detection is deterministic; the AI service supplies
 * the narrative layer on top, so the gallery reads like reasoning while the
 * findings stay reproducible during a live demo.
 */

/** Cap what any single run surfaces so the console stays readable. */
const MAX_FINDINGS = 5

/**
 * One finding per lead, keeping the stronger signal.
 *
 * A lead can match both the text rule and the structural one. Two findings for
 * the same person is double-counting, and showing the inferred one where the
 * customer actually said it would understate what is known.
 */
function dedupeBySignal<T extends { lead: Lead; signal: 'stated' | 'inferred' }>(
  rows: T[],
): T[] {
  const byLead = new Map<string, T>()
  for (const row of rows) {
    const held = byLead.get(row.lead.id)
    if (!held || (held.signal === 'inferred' && row.signal === 'stated')) {
      byLead.set(row.lead.id, row)
    }
  }
  return [...byLead.values()]
}

/**
 * The two production queues the Command Center renders.
 *
 * These are the exact rule passes the Next Best Action and Risk Dashboard
 * agents run inside `detectSync`, exported so the Overview widgets read from
 * the agent layer rather than re-deriving the same logic.
 */
export function nextBestActionQueue(ctx: AgentContext) {
  return selectNextBestActions(ctx.leads, new Set(ctx.ingestedLeadIds))
}

export function riskDigest(ctx: AgentContext) {
  return selectRiskAlerts(ctx.leads, ctx.tasks, ctx.serviceTickets)
}

export function finding(
  partial: Omit<AgentFinding, 'id'> & { id?: string },
): AgentFinding {
  return { id: partial.id ?? `f-${partial.subjectName}-${partial.headline}`, ...partial }
}

export function plan(
  agentId: string,
  f: AgentFinding,
  label: string,
  reason: string,
  crmEffect: string,
  write: CrmWrite,
): AgentActionPlan {
  return {
    id: `${agentId}::${f.id}`,
    agentId,
    findingId: f.id,
    leadId: f.leadId,
    label,
    reason,
    crmEffect,
    write,
    status: 'suggested',
  }
}

/** Shared scaffolding: rules run sync, the AI narrative wraps them. */
export function defineAgent(
  spec: Omit<Agent, 'detect'> & {
    narrate?: (findings: AgentFinding[], ctx: AgentContext) => string
  },
): Agent {
  /*
   * Stamp attribution here rather than in each agent. Seventeen agents would
   * each have had to remember, and a finding without an agentId is invisible
   * in a pooled view — the failure would be silent.
   */
  const stamp = (findings: AgentFinding[]) =>
    findings.map((f) => (f.agentId ? f : { ...f, agentId: spec.id }))

  return {
    ...spec,
    // Both paths stamp: the Overview widgets read detectSync directly.
    detectSync(ctx) {
      return stamp(spec.detectSync(ctx))
    },
    async detect(ctx) {
      const findings = stamp(spec.detectSync(ctx))
      if (findings.length) {
        // One AI call per run, used to colour the headline finding.
        await ctx.ai.analyzeSentiment(
          `${findings[0].headline} ${findings[0].detail}`,
          { agent: spec.id },
        )
      }
      return findings
    },
  }
}

/* ------------------------------------------------------------------ */
/* 1. Sentiment & Intent Detection                                     */
/* ------------------------------------------------------------------ */

const sentimentAgent = defineAgent({
  id: 'agent-sentiment',
  name: 'Sentiment & Intent Detection Agent',
  archetype: 'pattern-identifier',
  priority: 'High',
  description:
    'Reads call and message sentiment against the status a rep recorded, and catches opt-outs the CRM never registered.',
  scenario: 'A customer says "don’t call me again" on a call.',
  currentIssue: 'The rep leaves the lead open and campaigns keep firing at them.',
  aiSolution:
    'Detect the opt-out and negative sentiment, and compare it with the recorded lead status.',
  crmAction: 'Mark Cold + DND, suppress campaign outreach, notify the manager.',

  detectSync(ctx) {
    const suspects = ctx.leads
      .filter(
        (l) =>
          isOpen(l) &&
          l.sentiment === 'negative' &&
          ['Interested', 'Qualified', 'Contacted', 'New'].includes(l.crmStatus),
      )
      // Highest revenue exposure first — a run should surface the findings
      // worth acting on, not whichever records happen to sort first.
      .sort((a, b) => weightedValueCr(b) - weightedValueCr(a))

    return suspects.slice(0, MAX_FINDINGS).map((lead) =>
      finding({
        id: `sentiment-${lead.id}`,
        leadId: lead.id,
        subjectName: lead.name,
        severity: lead.evidenceStatus === 'contradicted' ? 'critical' : 'high',
        headline: `${lead.name} shows negative intent but sits as "${lead.crmStatus}"`,
        detail:
          'Conversation sentiment contradicts the recorded status. Outreach is still active against this record.',
        evidence: [
          `Call sentiment: negative across ${lead.evidence.callsAnswered} answered call(s)`,
          `${lead.evidence.callsAttempted} outbound attempts logged`,
          `CRM status "${lead.crmStatus}" unchanged for ${lead.evidence.daysSinceLastActivity} days`,
        ],
        impactCr: weightedValueCr(lead),
      }),
    )
  },

  async recommendAction(findings) {
    return findings.map((f) =>
      plan(
        'agent-sentiment',
        f,
        'Mark Cold + DND and suppress outreach',
        'Explicit negative intent detected; continuing outreach risks the relationship and breaches preference.',
        'Lead.Status → Do Not Contact · Lead.Cold → true · campaign outreach suppressed',
        {
          kind: 'flag-lead',
          leadId: f.leadId!,
          flags: {
            crmStatus: 'Do Not Contact',
            cold: true,
            dnd: true,
            intent: 'cold',
          },
          reason: `Negative intent detected by DICE — ${f.headline}`,
        },
      ),
    )
  },
})

/* ------------------------------------------------------------------ */
/* 2. Follow-up Scheduler                                              */
/* ------------------------------------------------------------------ */

const DEFER_PATTERN = /call (me )?(back )?(after|in)\s|after \d+ days|next month|call me later/i

const followUpAgent = defineAgent({
  id: 'agent-followup',
  name: 'Follow-up Scheduler Agent',
  archetype: 'digital-assistant',
  priority: 'High',
  description:
    'Catches deferred callbacks promised on a call and turns them into scheduled tasks before they are forgotten.',
  scenario: 'A customer asks to be called back after 15 days.',
  currentIssue: 'The commitment lives in the rep’s memory and the follow-up never happens.',
  aiSolution:
    'Extract the deferral from the conversation and check whether a task exists to cover it.',
  crmAction: 'Create a dated Task + reminder and route the lead to a nurture journey.',

  detectSync(ctx) {
    const openTaskLeadIds = new Set(
      ctx.tasks.filter((t) => t.status === 'Open').map((t) => t.whatId),
    )

    /*
     * Two ways to be a follow-up case.
     *
     * The customer saying "call me back" is the strong signal, but it only
     * exists if somebody typed it. A real CRM export is often terse and the
     * situation is still there: a call was answered, weeks passed, nothing was
     * scheduled. That is inferred rather than stated, and marked so it cannot
     * pass for the customer's own words.
     */
    const deferred = ctx.leads
      .filter((lead) => isOpen(lead) && !lead.dnd && !openTaskLeadIds.has(lead.id))
      .map((lead) => {
        const said = ctx.engagements.some(
          (e) =>
            e.leadId === lead.id &&
            (DEFER_PATTERN.test(e.summary) || DEFER_PATTERN.test(e.subject)),
        )
        if (said) return { lead, signal: 'stated' as const }
        const days = lead.evidence.daysSinceLastActivity
        // Narrow on purpose: answered at least once, and silent long enough to
        // be neglect rather than a live conversation.
        return lead.evidence.callsAnswered > 0 && days >= 14 && days <= 60
          ? { lead, signal: 'inferred' as const }
          : null
      })
      .filter((r): r is { lead: Lead; signal: 'stated' | 'inferred' } => r !== null)
      .sort((a, b) => weightedValueCr(b.lead) - weightedValueCr(a.lead))

    return dedupeBySignal(deferred)
      .slice(0, MAX_FINDINGS)
      .map(({ lead, signal }) =>
        finding({
          id: `followup-${lead.id}`,
          leadId: lead.id,
          subjectName: lead.name,
          severity: signal === 'stated' ? 'high' : 'medium',
          signal,
          headline:
            signal === 'stated'
              ? `${lead.name} asked for a callback — no task was ever created`
              : `${lead.name} answered a call ${lead.evidence.daysSinceLastActivity} days ago — nothing scheduled since`,
          detail:
            signal === 'stated'
              ? `${lead.evidence.daysSinceLastActivity} days since the commitment was made, with nothing scheduled against the record.`
              : `${lead.evidence.callsAnswered} of ${lead.evidence.callsAttempted} calls were answered, and no follow-up task exists on the record.`,
          evidence:
            signal === 'stated'
              ? [
                  'Deferral captured in the call summary',
                  'No open follow-up task on the record',
                  `Lead score ${lead.score}, budget ₹${lead.budgetCr} Cr`,
                ]
              : [
                  `${lead.evidence.callsAnswered} answered call(s) on the record`,
                  'No open follow-up task on the record',
                  'Inferred from the record — the customer did not ask for a callback',
                ],
          impactCr: weightedValueCr(lead),
        }),
      )
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const lead = ctx.leads.find((l) => l.id === f.leadId)!
      return plan(
        'agent-followup',
        f,
        'Schedule the promised callback',
        'The customer set the timing themselves — honouring it is the highest-converting touchpoint available.',
        'Task created against the Lead with a due date and reminder',
        {
          kind: 'create-task',
          leadId: lead.id,
          subject: `Callback promised on call — ${lead.name}`,
          ownerId: lead.ownerId,
          dueInDays: 1,
          priority: 'High',
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 3. AI Lead Validation                                               */
/* ------------------------------------------------------------------ */

const leadValidationAgent = defineAgent({
  id: 'agent-validation',
  name: 'AI Lead Validation Agent',
  archetype: 'pattern-identifier',
  priority: 'High',
  description:
    'Tests every optimistic CRM status against the interaction evidence and downgrades the ones nothing supports.',
  scenario: 'A lead is marked "Interested" with no evidence behind it.',
  currentIssue: 'Pipeline inflates and the manager forecasts against numbers that are not real.',
  aiSolution:
    'Compare CRM status against calls, emails, WhatsApp and site-visit evidence.',
  crmAction: 'Downgrade unsupported statuses or confirm them, and log the evidence trail.',

  detectSync(ctx) {
    const contradicted = ctx.leads
      .filter((l) => isOpen(l) && l.evidenceStatus === 'contradicted')
      .sort((a, b) => weightedValueCr(b) - weightedValueCr(a))

    return contradicted.slice(0, MAX_FINDINGS).map((lead) =>
      finding({
        id: `validation-${lead.id}`,
        leadId: lead.id,
        subjectName: lead.name,
        severity: 'high',
        headline: `"${lead.crmStatus}" is not supported by any interaction on ${lead.name}`,
        detail:
          'No answered call, no site visit and no content engagement behind a status that counts toward forecast.',
        evidence: [
          `${lead.evidence.callsAnswered} of ${lead.evidence.callsAttempted} calls answered`,
          `${lead.evidence.brochureViews} brochures opened, ${lead.evidence.siteVisitsAttended} site visits attended`,
          `Last activity ${lead.evidence.daysSinceLastActivity} days ago`,
        ],
        impactCr: weightedValueCr(lead),
      }),
    )
  },

  async recommendAction(findings) {
    return findings.map((f) =>
      plan(
        'agent-validation',
        f,
        'Downgrade to Contacted and re-qualify',
        'Removing unsupported records from the qualified pool is what makes the forecast trustworthy.',
        'Lead.Status → Contacted · evidence trail written to the Activity timeline',
        {
          kind: 'flag-lead',
          leadId: f.leadId!,
          flags: { crmStatus: 'Contacted', evidenceStatus: 'weak-evidence' },
          reason: 'Status downgraded by DICE — no supporting interaction evidence',
        },
      ),
    )
  },
})

/* ------------------------------------------------------------------ */
/* 4. Payment Assistant                                                */
/* ------------------------------------------------------------------ */

const PAYMENT_PATTERN = /payment (terms|plan|schedule)|construction-linked|down payment|stamp duty|home loan|emi/i

const paymentAgent = defineAgent({
  id: 'agent-payment',
  name: 'Payment Assistant Agent',
  archetype: 'information-extractor',
  priority: 'High',
  description:
    'Extracts commercial questions from conversations and makes sure a finance response is actually scheduled.',
  scenario: 'A customer asks about payment terms mid-conversation.',
  currentIssue: 'The query is handled offline, never logged, and the answer never lands.',
  aiSolution:
    'Extract the payment question, pull the matching plan, and check whether finance has been engaged.',
  crmAction: 'Create a finance callback Task and log the query against the Lead.',

  detectSync(ctx) {
    /*
     * A stated payment question, or a proposal nobody chased.
     *
     * Reaching proposal means commercials were discussed whether or not the
     * summary records the question; no open task means nothing came of it.
     */
    const openTasks = new Set(
      ctx.tasks.filter((t) => t.status === 'Open').map((t) => t.whatId),
    )
    const askers = ctx.leads
      .filter((lead) => isOpen(lead) && !lead.dnd)
      .map((lead) => {
        const asked = ctx.engagements.some(
          (e) =>
            e.leadId === lead.id &&
            (PAYMENT_PATTERN.test(e.summary) || PAYMENT_PATTERN.test(e.subject)),
        )
        if (asked) return { lead, signal: 'stated' as const }
        return lead.stage === 'proposal' && !openTasks.has(lead.id)
          ? { lead, signal: 'inferred' as const }
          : null
      })
      .filter((r): r is { lead: Lead; signal: 'stated' | 'inferred' } => r !== null)
      .sort((a, b) => weightedValueCr(b.lead) - weightedValueCr(a.lead))

    return dedupeBySignal(askers)
      .slice(0, MAX_FINDINGS)
      .map(({ lead, signal }) =>
      finding({
        id: `payment-${lead.id}`,
        leadId: lead.id,
        subjectName: lead.name,
        severity: signal === 'stated' ? 'high' : 'medium',
        signal,
        headline:
          signal === 'stated'
            ? `${lead.name} asked about payment terms — no finance callback logged`
            : `${lead.name} is at proposal with no finance follow-up scheduled`,
        detail:
          signal === 'stated'
            ? `Commercial intent raised ${lead.evidence.daysSinceLastActivity} days ago on a ₹${lead.budgetCr} Cr opportunity.`
            : `A proposal has been sent on a ₹${lead.budgetCr} Cr opportunity and no finance task exists against it.`,
        evidence:
          signal === 'stated'
            ? [
                'Payment/loan question captured in the conversation record',
                `Stage: ${lead.stage} · Score ${lead.score}`,
                'No finance callback task on the record',
              ]
            : [
                'Stage: proposal — commercials have been put to the customer',
                'No finance callback task on the record',
                'Inferred from the record — no payment question was captured',
              ],
        impactCr: weightedValueCr(lead),
      }),
    )
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const lead = ctx.leads.find((l) => l.id === f.leadId)!
      return plan(
        'agent-payment',
        f,
        'Raise a finance callback and share the payment plan',
        'A pricing question from a proposal-stage buyer is the shortest path to a booking — if someone answers it.',
        'Task created for the finance desk · query logged to the Lead activity timeline',
        {
          kind: 'create-task',
          leadId: lead.id,
          subject: `Finance callback — payment plan for ${lead.name} (₹${lead.budgetCr} Cr)`,
          ownerId: lead.ownerId,
          dueInDays: 1,
          priority: 'High',
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 5. Visit Conversion                                                 */
/* ------------------------------------------------------------------ */

const visitConversionAgent = defineAgent({
  id: 'agent-visit',
  name: 'Visit Conversion Agent',
  archetype: 'predictive-algorithm',
  priority: 'High',
  description:
    'Looks at visits that did not convert, surfaces the objection that stopped them, and recommends the counter.',
  scenario: 'A customer visits the site but never books.',
  currentIssue: 'No reason is captured, so the same objection kills the next visit too.',
  aiSolution:
    'Summarise visit feedback, classify the objection, and predict which counter-play converts.',
  crmAction: 'Log the objection on the Opportunity and task the owner with the counter-play.',

  detectSync(ctx) {
    const bookedLeadIds = new Set(ctx.bookings.map((b) => b.leadId))

    const stalled = ctx.siteVisits
      .filter((v) => v.attended && !bookedLeadIds.has(v.leadId))
      .map((visit) => {
        const lead = ctx.leads.find((l) => l.id === visit.leadId)
        return lead && isOpen(lead) ? { visit, lead } : null
      })
      .filter((x): x is { visit: (typeof ctx.siteVisits)[number]; lead: Lead } => !!x)
      .sort((a, b) => weightedValueCr(b.lead) - weightedValueCr(a.lead))

    return stalled.slice(0, MAX_FINDINGS).map(({ visit, lead }) =>
      finding({
        id: `visit-${visit.id}`,
        leadId: lead.id,
        subjectName: lead.name,
        severity: 'medium',
        headline: `${lead.name} visited ${visit.projectName} but has not booked`,
        detail: visit.objection
          ? `Objection recorded: ${visit.objection}.`
          : 'No objection was captured at the visit — the reason for the stall is unknown.',
        evidence: [
          `Visit outcome: ${visit.outcome ?? 'not recorded'}`,
          visit.feedback ?? 'No written feedback captured',
          `${lead.evidence.daysSinceLastActivity} days since last contact`,
        ],
        impactCr: weightedValueCr(lead),
      }),
    )
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const lead = ctx.leads.find((l) => l.id === f.leadId)!
      return plan(
        'agent-visit',
        f,
        'Run the objection counter-play',
        'Visits that stall without a captured objection convert at roughly half the rate of ones that get a targeted follow-up.',
        'Objection logged on the Opportunity · counter-play task assigned to the owner',
        {
          kind: 'create-task',
          leadId: lead.id,
          subject: `Objection handling after site visit — ${lead.name}`,
          ownerId: lead.ownerId,
          dueInDays: 2,
          priority: 'Normal',
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 6. Campaign Quality Analytics                                       */
/* ------------------------------------------------------------------ */

const campaignAgent = defineAgent({
  id: 'agent-campaign',
  name: 'Campaign Quality Analytics Agent',
  archetype: 'predictive-algorithm',
  priority: 'High',
  description:
    'Scores every campaign on the quality of what it produced rather than the volume it produced.',
  scenario: 'A campaign delivers 1,000 leads and almost no bookings.',
  currentIssue: 'ROI is judged on lead count, so spend keeps flowing to the worst sources.',
  aiSolution:
    'Score each campaign on qualified-lead, site-visit and booking rate, then classify scale / optimise / pause.',
  crmAction: 'Write the recommendation to the Campaign and suppress outreach on failures.',

  detectSync(ctx) {
    const rows = selectCampaignRows(ctx.leads)

    /*
     * An absolute rule and a relative one.
     *
     * Under 3% is a failing channel on any book. But a portfolio where every
     * channel clears that bar left this agent silent, which reads as broken
     * rather than as good news — so when nothing breaches the floor, the worst
     * performers relative to the book's own average are reported instead.
     * Marked inferred: "worse than its peers" is a weaker claim than "below the
     * bar", and the weighting should say so.
     */
    const failing = rows.filter((row) => row.bookingRate < 3)
    const withLeads = rows.filter((row) => row.leads > 0)
    const portfolioRate = withLeads.length
      ? withLeads.reduce((a, r) => a + r.bookingRate, 0) / withLeads.length
      : 0
    const laggards = failing.length
      ? []
      : withLeads.filter((row) => row.bookingRate < portfolioRate * 0.6)

    return (failing.length ? failing : laggards)
      .sort((a, b) => a.bookingRate - b.bookingRate)
      .slice(0, MAX_FINDINGS)
      .map((row) => {
        const relative = failing.length === 0
        const verdict = relative
          ? 'underperforming'
          : row.bookingRate < 1
            ? 'pause'
            : 'optimise'
        const severity: Severity = relative
          ? 'medium'
          : row.bookingRate < 1
            ? 'high'
            : 'medium'
        return finding({
          id: `campaign-${row.id}`,
          subjectName: row.name,
          severity,
          signal: relative ? 'inferred' : 'stated',
          headline: `${row.name} — ${verdict} (booking rate ${row.bookingRate}%)`,
          detail: relative
            ? `${row.leads.toLocaleString('en-IN')} leads at a ${row.bookingRate}% booking rate, against a portfolio average of ${portfolioRate.toFixed(1)}%.`
            : `${row.leads.toLocaleString('en-IN')} leads produced a ${row.bookingRate}% booking rate at ₹${row.spendLakh} L spend.`,
          evidence: [
            `Qualified-lead rate ${row.qualifiedPct}%`,
            `Site-visit rate ${row.siteVisitPct}%`,
            relative
              ? `Portfolio average ${portfolioRate.toFixed(1)}% — no channel is below the 3% floor`
              : `Cost per qualified lead ₹${row.costPerQualifiedLakh} L`,
          ],
        })
      })
  },

  async recommendAction(findings) {
    return findings.map((f) => {
      const campaignId = f.id.replace('campaign-', '')
      const pausing = f.headline.includes('pause')
      return plan(
        'agent-campaign',
        f,
        pausing ? 'Pause the campaign' : 'Optimise targeting',
        'Quality-weighted scoring puts spend behind the sources that actually book, not the ones that just fill the funnel.',
        pausing
          ? 'Campaign outreach suppressed · recommendation logged'
          : 'Recommendation written to the Campaign record',
        pausing
          ? {
              kind: 'suppress-campaign',
              campaignId,
              reason: f.headline,
            }
          : {
              kind: 'log-activity',
              object: 'Activity',
              recordId: campaignId,
              recordName: f.subjectName,
              action: 'Campaign recommendation',
              detail: `Optimise targeting — ${f.detail}`,
            },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 7. Customer 360                                                     */
/* ------------------------------------------------------------------ */

const customer360Agent = defineAgent({
  id: 'agent-customer360',
  name: 'Customer 360 Agent',
  archetype: 'information-extractor',
  priority: 'High',
  description:
    'Consolidates activity scattered across projects into one preference profile and picks the best-fit inventory.',
  scenario: 'A customer browses several projects across channels.',
  currentIssue: 'Sales sees only the single enquiry they were assigned and pitches the wrong unit.',
  aiSolution:
    'Merge activity across projects into one preference set and rank inventory against it.',
  crmAction: 'Update Contact preferences and write the recommended best-fit project.',

  detectSync(ctx) {
    const multi = ctx.leads
      .filter(
        (l) => isOpen(l) && l.interestedProjectIds.length > 1 && !l.dnd,
      )
      .sort((a, b) => b.score - a.score)

    return multi.slice(0, MAX_FINDINGS).map((lead) =>
      finding({
        id: `c360-${lead.id}`,
        leadId: lead.id,
        subjectName: lead.name,
        severity: 'info',
        headline: `${lead.name} is evaluating ${lead.interestedProjectIds.length} projects — only one enquiry is recorded`,
        detail:
          'Cross-project browsing is fragmented across channels, so the assigned rep is working from a partial picture.',
        evidence: [
          `${lead.evidence.projectsViewed} projects viewed`,
          `${lead.evidence.websiteVisits} website sessions, ${lead.evidence.brochureViews} brochures opened`,
          `Budget ₹${lead.budgetCr} Cr · preferred ${lead.preferredLocation}`,
        ],
      }),
    )
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const lead = ctx.leads.find((l) => l.id === f.leadId)!
      return plan(
        'agent-customer360',
        f,
        'Consolidate preferences on the Contact',
        'One merged preference profile lets the rep lead with the unit the customer is actually shortlisting.',
        'Contact preferences updated · best-fit project written to the record',
        {
          kind: 'log-activity',
          object: 'Contact',
          recordId: lead.id,
          recordName: lead.name,
          action: 'Preferences consolidated',
          detail: `${lead.interestedProjectIds.length} projects merged into one profile · best fit for ₹${lead.budgetCr} Cr in ${lead.preferredLocation}`,
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 8. Virtual Selling Assistant                                        */
/* ------------------------------------------------------------------ */

const virtualSellingAgent = defineAgent({
  id: 'agent-virtual',
  name: 'Virtual Selling Assistant Agent',
  archetype: 'content-generator',
  priority: 'Medium',
  description:
    'Keeps remote and NRI buyers moving when an in-person site visit is not possible.',
  scenario: 'An NRI buyer cannot travel for a site visit.',
  currentIssue: 'The journey stalls at scheduling and the lead quietly goes cold.',
  aiSolution:
    'Detect the travel constraint and generate a virtual tour plus a timezone-aware walkthrough slot.',
  crmAction: 'Send the virtual tour and book a video walkthrough Task.',

  detectSync(ctx) {
    /*
     * Stated travel constraint, or a buyer who never came.
     *
     * The phrase only exists if a rep wrote it down. Engaged repeatedly, scoring
     * well and never having attended a visit is the same blocker showing in the
     * record instead of in the text.
     */
    const stalled = ctx.leads
      .filter(
        (lead) =>
          isOpen(lead) && !lead.dnd && lead.evidence.siteVisitsAttended === 0,
      )
      .map((lead) => {
        const constrained = ctx.engagements.some(
          (e) =>
            e.leadId === lead.id &&
            /cannot travel|video walkthrough|virtual|nri|before october|overseas/i.test(
              `${e.subject} ${e.summary}`,
            ),
        )
        if (constrained) return { lead, signal: 'stated' as const }
        const touches = ctx.engagements.filter((e) => e.leadId === lead.id).length
        return touches >= 2 && lead.score >= 60
          ? { lead, signal: 'inferred' as const }
          : null
      })
      .filter((r): r is { lead: Lead; signal: 'stated' | 'inferred' } => r !== null)
      .sort((a, b) => weightedValueCr(b.lead) - weightedValueCr(a.lead))

    return dedupeBySignal(stalled)
      .slice(0, MAX_FINDINGS)
      .map(({ lead, signal }) =>
        finding({
          id: `virtual-${lead.id}`,
          leadId: lead.id,
          subjectName: lead.name,
          severity: 'medium',
          signal,
          headline:
            signal === 'stated'
              ? `${lead.name} cannot attend a site visit — journey stalled at scheduling`
              : `${lead.name} is engaged but has never visited a site`,
          detail:
            signal === 'stated'
              ? `Qualified buyer with a ₹${lead.budgetCr} Cr budget stuck for ${lead.evidence.daysSinceLastActivity} days on a logistics blocker.`
              : `Score ${lead.score} on a ₹${lead.budgetCr} Cr budget, with no site visit attended after repeated contact.`,
          evidence:
            signal === 'stated'
              ? [
                  'Travel constraint stated in the conversation record',
                  `${lead.evidence.websiteVisits} website sessions since — interest is still live`,
                  'No virtual alternative offered',
                ]
              : [
                  'No site visit attended on the record',
                  `Score ${lead.score} · ${lead.evidence.websiteVisits} website sessions`,
                  'Inferred from the record — no travel constraint was stated',
                ],
          impactCr: weightedValueCr(lead),
        }),
      )
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const lead = ctx.leads.find((l) => l.id === f.leadId)!
      return plan(
        'agent-virtual',
        f,
        'Send virtual tour & book a video walkthrough',
        'Replacing the blocked step keeps the journey moving instead of waiting on travel that may never happen.',
        'Virtual tour logged to the Lead · video walkthrough Task created',
        {
          kind: 'create-task',
          leadId: lead.id,
          subject: `Video walkthrough (timezone-adjusted) — ${lead.name}`,
          ownerId: lead.ownerId,
          dueInDays: 2,
          priority: 'High',
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 9. Risk Dashboard                                                   */
/* ------------------------------------------------------------------ */

const riskDashboardAgent = defineAgent({
  id: 'agent-risk',
  name: 'Risk Dashboard Agent',
  archetype: 'pattern-identifier',
  priority: 'High',
  description:
    'Produces the daily pipeline truth — every red flag across the book, ranked by revenue exposure.',
  scenario: 'A manager wants an honest read on the pipeline every morning.',
  currentIssue: 'Manual MIS arrives late and reflects what reps typed, not what happened.',
  aiSolution:
    'Generate a pipeline summary with ranked red flags computed straight off the interaction record.',
  crmAction: 'Publish the risk digest and raise tasks against the owning reps.',

  detectSync(ctx) {
    const alerts = riskDigest(ctx)

    return alerts.slice(0, MAX_FINDINGS).map((alert) =>
      finding({
        id: alert.id,
        subjectName: 'Pipeline',
        severity: alert.severity,
        headline: alert.headline,
        detail: alert.detail,
        evidence: [
          alert.impactedRevenueCr
            ? `Weighted exposure ₹${alert.impactedRevenueCr} Cr`
            : 'No direct revenue exposure',
          `Raised against the book as at ${DEMO_NOW.toLocaleDateString('en-GB')}`,
        ],
        impactCr: alert.impactedRevenueCr,
      }),
    )
  },

  async recommendAction(findings) {
    return findings.map((f) =>
      plan(
        'agent-risk',
        f,
        'Publish to the daily risk digest',
        'Surfacing exposure the same morning is what turns a monthly MIS into something a manager can act on.',
        'Risk digest entry written to the Activity timeline',
        {
          kind: 'log-activity',
          object: 'Activity',
          recordId: f.id,
          recordName: 'Daily pipeline truth',
          action: 'Risk digest published',
          detail: `${f.headline} — ${f.detail}`,
        },
      ),
    )
  },
})

/* ------------------------------------------------------------------ */
/* 10. Service Resolution                                              */
/* ------------------------------------------------------------------ */

const serviceAgent = defineAgent({
  id: 'agent-service',
  name: 'Service Resolution Agent',
  archetype: 'digital-assistant',
  priority: 'High',
  description:
    'Watches post-sales tickets against SLA and routes the ones about to breach with a recommended resolution.',
  scenario: 'A service ticket raised after booking goes unresolved.',
  currentIssue: 'Post-sales experience degrades exactly when advocacy is being formed.',
  aiSolution:
    'Summarise the ticket, score SLA risk, and recommend both the resolution and the owner.',
  crmAction: 'Create a resolution Task with an owner and escalate SLA breaches.',

  detectSync(ctx) {
    const atRisk = ctx.serviceTickets
      .filter((t) => t.status !== 'resolved')
      .map((t) => ({ t, overdueMs: DEMO_NOW.getTime() - new Date(t.slaDueAt).getTime() }))
      .filter(({ overdueMs }) => overdueMs > -3 * 86_400_000)
      .sort((a, b) => b.overdueMs - a.overdueMs)

    return atRisk.slice(0, MAX_FINDINGS).map(({ t, overdueMs }) => {
      const days = Math.round(overdueMs / 86_400_000)
      return finding({
        id: `service-${t.id}`,
        leadId: t.leadId,
        subjectName: t.customerName,
        severity: days > 0 ? 'critical' : 'high',
        headline:
          days > 0
            ? `${t.subject} — SLA breached by ${days} day${days === 1 ? '' : 's'}`
            : `${t.subject} — SLA breaches in ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`,
        detail: t.detail,
        evidence: [
          `Category: ${t.category} · severity ${t.severity}`,
          `Status: ${t.status}`,
          `Customer: ${t.customerName}`,
        ],
      })
    })
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const lead = ctx.leads.find((l) => l.id === f.leadId)
      return plan(
        'agent-service',
        f,
        'Assign a resolution owner',
        'An unowned ticket is the single most common cause of a poor post-sales score.',
        'Resolution Task created and assigned · SLA breach escalated',
        {
          kind: 'create-task',
          leadId: f.leadId ?? '',
          subject: `Resolve: ${f.headline}`,
          ownerId: lead?.ownerId ?? ctx.leads[0].ownerId,
          dueInDays: 1,
          priority: 'High',
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 11. Next Best Action — powers the Overview action queue             */
/* ------------------------------------------------------------------ */

const nextBestActionAgent = defineAgent({
  id: 'agent-nba',
  name: 'Next Best Action Agent',
  archetype: 'predictive-algorithm',
  priority: 'High',
  description:
    'Ranks the ingested book by conversion likelihood and states the single action that moves each lead forward.',
  scenario: 'A rep opens the CRM and sees 400 leads with no order to them.',
  currentIssue: 'Effort spreads evenly instead of concentrating where it converts.',
  aiSolution:
    'Score every ingested lead and pair it with the highest-yield next action and a stated reason.',
  crmAction: 'Publish the ranked action queue onto the Command Center.',

  detectSync(ctx) {
    const rows = nextBestActionQueue(ctx)

    return rows.map((row) => {
      /*
       * If an earlier agent already established what this customer wants or
       * where the visit stalled, act on that conclusion rather than deriving
       * the reason again from the score alone. Empty on a solo run, so the
       * gallery behaviour is unchanged.
       */
      const prior = (ctx.priorFindings ?? []).filter(
        (f) => f.leadId === row.leadId,
      )
      const source =
        prior.find((f) => f.agentId === 'agent-customer360') ??
        prior.find((f) => f.agentId === 'agent-visit') ??
        prior.find((f) => f.agentId === 'agent-validation')

      return finding({
        id: `nba-${row.leadId}`,
        leadId: row.leadId,
        subjectName: row.customerName,
        severity: row.score >= 80 ? 'high' : row.score >= 60 ? 'medium' : 'info',
        citesFindingId: source?.id,
        headline: `${row.customerName} — ${row.action}`,
        detail: row.reason,
        evidence: source
          ? [`Acting on: ${source.headline}`, `Lead score ${row.score}/100`, `Owner ${row.owner}`]
          : [
              `Lead score ${row.score}/100`,
              `${row.project} · ${row.budget}`,
              `Owner ${row.owner}`,
            ],
      })
    })
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const lead = ctx.leads.find((l) => l.id === f.leadId)!
      const { action } = nextBestActionFor(lead)
      return plan(
        'agent-nba',
        f,
        action,
        f.detail,
        'Task created against the Lead and surfaced on the Command Center queue',
        {
          kind: 'create-task',
          leadId: lead.id,
          subject: `${action} — ${lead.name}`,
          ownerId: lead.ownerId,
          dueInDays: lead.score >= 90 ? 0 : 2,
          priority: lead.score >= 80 ? 'High' : 'Normal',
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */

export const AGENTS: Agent[] = [
  sentimentAgent,
  followUpAgent,
  leadValidationAgent,
  paymentAgent,
  visitConversionAgent,
  campaignAgent,
  customer360Agent,
  virtualSellingAgent,
  riskDashboardAgent,
  serviceAgent,
  nextBestActionAgent,
  ...FEEDBACK_AGENTS,
]

export const AGENTS_BY_ID = Object.fromEntries(
  AGENTS.map((a) => [a.id, a]),
) as Record<string, Agent>

export {
  nextBestActionAgent,
  riskDashboardAgent,
  sentimentAgent,
  leadValidationAgent,
}

/** Total exposure the agents can see right now — used by the gallery header. */
export function totalExposureCr(ctx: AgentContext) {
  return Math.round(
    ctx.leads.filter(isAtRisk).reduce((sum, l) => sum + weightedValueCr(l), 0),
  )
}
