

import {
  caseSlaDaysOverdue,
  selectRecoverySummary,
  selectRootCauseClusters,
  selectSurveyQueue,
  selectThemes,
} from '@/lib/kpmg-dice/lib/selectors/feedback'
import { TOUCHPOINT_LABEL } from '@/lib/kpmg-dice/types'
import type { Severity } from '@/lib/kpmg-dice/types'
import { defineAgent, finding, plan } from './registry'
import type { Agent, AgentContext } from './types'
import { ref, themeById } from '@/lib/kpmg-dice/data/active-reference'

/**
 * The CSAT & NPS agents.
 *
 * One per Type 2 use case. Kept out of registry.ts because that file is already
 * long, but they use the same `defineAgent` scaffolding and the same contract:
 * a deterministic rule pass produces the findings, the AI service supplies the
 * narrative, and every action is a declared CRM write shown before it runs.
 */

/** Cap what a single run surfaces, matching the registry's own limit. */
const MAX_FINDINGS = 5

function severityForScore(npsScore: number): Severity {
  if (npsScore <= 2) return 'critical'
  if (npsScore <= 4) return 'high'
  return 'medium'
}

/* ------------------------------------------------------------------ */
/* 12. Survey Participation Optimizer                                  */
/* ------------------------------------------------------------------ */

const surveyOptimizerAgent = defineAgent({
  id: 'agent-survey-optimizer',
  name: 'Survey Optimizer Agent',
  archetype: 'predictive-algorithm',
  priority: 'High',
  description:
    'Predicts who will actually answer a survey, on which channel and when — and holds back the customers a fourth request would only annoy.',
  scenario: 'A satisfaction survey goes out to the whole book on the same day.',
  currentIssue:
    'Low completion makes the feedback unrepresentative, and the customers who do respond are the ones already being over-asked.',
  aiSolution:
    'Score response likelihood from recency and channel behaviour, recommend a channel and window, and detect survey fatigue.',
  crmAction:
    'Schedule the invite on the recommended channel, or suppress it and record why.',

  detectSync(ctx) {
    const { queued } = selectSurveyQueue(ctx.surveyInvites)

    return queued.slice(0, MAX_FINDINGS).map((row) =>
      finding({
        id: `survey-${row.invite.id}`,
        leadId: row.invite.leadId,
        subjectName: row.invite.customerName,
        severity: row.invite.responsePropensity >= 80 ? 'high' : 'medium',
        headline: `${row.invite.customerName} is ${row.invite.responsePropensity}% likely to respond on ${row.invite.channel}`,
        detail: `Recommended window ${row.invite.recommendedWindow} for the ${TOUCHPOINT_LABEL[
          row.invite.touchpoint
        ].toLowerCase()} touchpoint. Asking now is worth more than asking everyone.`,
        evidence: row.invite.signals,
      }),
    )
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const invite = ctx.surveyInvites.find((i) => `survey-${i.id}` === f.id)
      return plan(
        'agent-survey-optimizer',
        f,
        'Schedule the survey invite',
        'Predicted response likelihood is high and no fatigue signal is present.',
        `Survey invite scheduled · channel ${invite?.channel ?? 'recommended'} · ${invite?.recommendedWindow ?? 'recommended window'}`,
        {
          kind: 'schedule-survey',
          inviteId: invite?.id ?? '',
          leadId: f.leadId!,
          reason: f.headline,
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 13. Dynamic Feedback Journey                                        */
/* ------------------------------------------------------------------ */

const feedbackJourneyAgent = defineAgent({
  id: 'agent-feedback-journey',
  name: 'Feedback Journey Agent',
  archetype: 'content-generator',
  priority: 'Medium',
  description:
    'Composes the survey for the customer in front of it — right questions for the journey stage and persona, from the approved library.',
  scenario:
    'A customer who has just taken possession receives the same survey as a first-time enquiry.',
  currentIssue:
    'Generic surveys get abandoned, and the answers that do come back are too shallow to act on.',
  aiSolution:
    'Select supporting questions from the governed library by touchpoint, journey stage and persona, and adapt the channel wording.',
  crmAction: 'Record the composed question set against the invite for approval.',

  detectSync(ctx) {
    // Abandoned invites are the evidence that the survey did not fit.
    const abandoned = ctx.surveyInvites.filter((i) => i.status === 'abandoned')

    const byTouchpoint = new Map<string, number>()
    for (const invite of abandoned) {
      byTouchpoint.set(
        invite.touchpoint,
        (byTouchpoint.get(invite.touchpoint) ?? 0) + 1,
      )
    }

    return [...byTouchpoint.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FINDINGS)
      .map(([touchpoint, count]) =>
        finding({
          id: `journey-${touchpoint}`,
          subjectName: TOUCHPOINT_LABEL[touchpoint as keyof typeof TOUCHPOINT_LABEL],
          severity: count > 400 ? 'high' : 'medium',
          headline: `${count} ${TOUCHPOINT_LABEL[
            touchpoint as keyof typeof TOUCHPOINT_LABEL
          ].toLowerCase()} surveys abandoned before completion`,
          detail:
            'A tailored question set for this touchpoint, adapted to journey stage and persona, is the lever with the most headroom here.',
          evidence: [
            `${count} abandonment(s) recorded at this touchpoint`,
            'Standard NPS wording stays governed; only supporting questions adapt',
          ],
        }),
      )
  },

  async recommendAction(findings) {
    return findings.map((f) =>
      plan(
        'agent-feedback-journey',
        f,
        'Compose a stage-aware question set',
        'Relevance is the strongest available lever on abandonment.',
        'Composed question set recorded against the touchpoint for approval',
        {
          kind: 'log-activity',
          object: 'Activity',
          recordId: f.id,
          recordName: f.subjectName,
          action: 'Feedback journey composed',
          detail: f.headline,
        },
      ),
    )
  },
})

/* ------------------------------------------------------------------ */
/* 14. Voice-of-Customer Analyzer                                      */
/* ------------------------------------------------------------------ */

const vocAnalyzerAgent = defineAgent({
  id: 'agent-voc-analyzer',
  name: 'VoC Analyzer Agent',
  archetype: 'information-extractor',
  priority: 'High',
  description:
    'Turns open-text feedback into themes with the customer quote that justifies each one, and flags what is newly appearing.',
  scenario: 'Thousands of free-text comments arrive with no consistent coding.',
  currentIssue:
    'Manual categorisation is slow, inconsistent between analysts, and loses the link back to what the customer actually said.',
  aiSolution:
    'Extract themes and sub-themes, classify sentiment by aspect, and attach the supporting text and a confidence to each.',
  crmAction: 'Suggest a CRM tag against the response for review.',

  detectSync(ctx) {
    const themes = ctx.feedbackThemes

    // Emerging first — a new issue is worth more attention than a known one.
    const ranked = [...themes].sort((a, b) => {
      if (a.emerging !== b.emerging) return a.emerging ? -1 : 1
      if (a.sentiment !== b.sentiment) return a.sentiment === 'negative' ? -1 : 1
      return b.mentions - a.mentions
    })

    return ranked.slice(0, MAX_FINDINGS).map((theme) =>
      finding({
        id: `voc-${theme.id}`,
        subjectName: theme.label,
        severity: theme.emerging
          ? 'info'
          : theme.sentiment === 'negative'
            ? 'high'
            : 'info',
        headline: theme.emerging
          ? `New theme appearing: ${theme.label} (${theme.mentions} mentions)`
          : `${theme.label} — ${theme.mentions} mentions, ${theme.sentiment}`,
        detail: `Aspect ${theme.aspect}. Confidence ${theme.confidence}%.`,
        evidence: theme.evidence,
      }),
    )
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const theme = ctx.feedbackThemes.find((t) => `voc-${t.id}` === f.id)
      return plan(
        'agent-voc-analyzer',
        f,
        `Tag responses ${theme?.suggestedCrmTag ?? 'for review'}`,
        'Consistent tagging makes the theme reportable and keeps traceability to the source comment.',
        `${theme?.mentions ?? 0} response(s) tagged ${theme?.suggestedCrmTag ?? ''}`,
        {
          kind: 'tag-feedback',
          responseId: theme?.responseIds[0] ?? '',
          recordName: theme?.label ?? f.subjectName,
          tag: theme?.suggestedCrmTag ?? 'CX::Review',
          reason: f.headline,
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 15. Root Cause Intelligence                                         */
/* ------------------------------------------------------------------ */

const rootCauseAgent = defineAgent({
  id: 'agent-root-cause',
  name: 'Root Cause Agent',
  archetype: 'pattern-identifier',
  priority: 'High',
  description:
    'Connects low scores to the journey stage and process behind them, and separates a real pattern from a coincidence.',
  scenario: 'NPS drops and nobody can say which part of the operation caused it.',
  currentIssue:
    'Scores are visible but the operational driver is not, so improvement effort goes wherever the loudest complaint came from.',
  aiSolution:
    'Cluster related themes against journey stages, measure association with detractor scores, and rank by the drag each cluster carries.',
  crmAction: 'Raise a diagnostic task for the owning function.',

  detectSync(ctx) {
    return ctx.feedbackClusters.slice(0, MAX_FINDINGS).map((cluster) =>
      finding({
        id: `cause-${cluster.id}`,
        subjectName: cluster.label,
        severity: cluster.npsDrag <= -4 ? 'critical' : 'high',
        headline: `${cluster.label} drags NPS by ${cluster.npsDrag} across ${cluster.affectedResponses} responses`,
        detail: `Concentrated at the ${cluster.journeyStage} stage on the ${TOUCHPOINT_LABEL[
          cluster.touchpoint
        ].toLowerCase()} touchpoint. Association with detractor scores is ${cluster.correlation.toFixed(
          2,
        )} — diagnostic only, and requires business validation before it is treated as a cause.`,
        evidence: cluster.evidence,
      }),
    )
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const cluster = ctx.feedbackClusters.find((c) => `cause-${c.id}` === f.id)
      const aspect = themeById(cluster?.themeIds[0] ?? '')?.aspect ?? 'Service'
      /*
       * Logged against the cluster rather than raised as a Task.
       *
       * A cluster spans hundreds of customers and has no owning record, so a
       * Task would need a whatId it does not have — passing the theme id put
       * "thm-documentation" in the activity feed where a customer name belongs
       * and produced a task no lead could ever see.
       */
      return plan(
        'agent-root-cause',
        f,
        `Open a diagnostic review on ${aspect}`,
        'The pattern repeats across enough responses to be worth investigating, not merely logging.',
        `Diagnostic review logged for the ${aspect} function · ${cluster?.affectedResponses ?? 0} responses attached`,
        {
          kind: 'log-activity',
          object: 'Activity',
          recordId: cluster?.id ?? f.id,
          recordName: `${aspect} — ${f.subjectName}`,
          action: 'Diagnostic review opened',
          detail: `${cluster?.affectedResponses ?? 0} responses, NPS drag ${cluster?.npsDrag ?? 0}. Association ${cluster?.correlation.toFixed(2) ?? '0'} requires business validation.`,
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 16. Detractor Recovery                                              */
/* ------------------------------------------------------------------ */

const detractorRecoveryAgent = defineAgent({
  id: 'agent-detractor-recovery',
  name: 'Recovery Copilot Agent',
  archetype: 'digital-assistant',
  priority: 'High',
  description:
    'Turns a detractor score into an owned case with an SLA, a recommended owner and a drafted reply for a human to send.',
  scenario: 'A customer scores 4 out of 10 and nothing happens next.',
  currentIssue:
    'Detractor feedback is captured without an owner or a deadline, so the customer hears nothing and the score stands.',
  aiSolution:
    'Detect the detractor, rank by severity and whether a service ticket was already breaching, and draft a customer-safe response.',
  crmAction: 'Open a recovery case with an owner and an SLA, after review.',

  detectSync(ctx) {
    const withCase = new Set(ctx.recoveryCases.map((c) => c.responseId))

    const unworked = ctx.surveyResponses
      .filter((r) => r.npsBand === 'detractor' && !withCase.has(r.id))
      .sort((a, b) => {
        // A detractor whose ticket was already open outranks an equal score
        // without one: the platform saw that coming.
        const aTicket = a.sourceTicketId ? 1 : 0
        const bTicket = b.sourceTicketId ? 1 : 0
        if (aTicket !== bTicket) return bTicket - aTicket
        return a.npsScore - b.npsScore
      })

    return unworked.slice(0, MAX_FINDINGS).map((response) => {
      /*
       * Prefer an earlier agent's conclusion over re-reading the raw record.
       *
       * Run alone this finds nothing and the agent falls back to citing the
       * ticket id exactly as before, so the gallery is unchanged. Run in a
       * chain it carries Service Resolution's and VoC Analyzer's actual
       * conclusions forward instead of independently re-deriving them, which is
       * the whole difference between agents sharing inputs and agents sharing
       * conclusions.
       */
      const prior = (ctx.priorFindings ?? []).filter(
        (f) => f.leadId === response.leadId,
      )
      const fromService = prior.find((f) => f.agentId === 'agent-service')
      const fromVoc = prior.find((f) => f.agentId === 'agent-voc-analyzer')

      const handedOver: string[] = []
      if (fromService) handedOver.push(`Service Resolution: ${fromService.headline}`)
      if (fromVoc) handedOver.push(`VoC Analyzer: ${fromVoc.headline}`)

      return finding({
        id: `recovery-${response.id}`,
        leadId: response.leadId,
        subjectName: response.customerName,
        severity: severityForScore(response.npsScore),
        citesFindingId: fromService?.id ?? fromVoc?.id,
        headline: `${response.customerName} scored ${response.npsScore}/10 with no recovery case open`,
        detail: response.sourceTicketId
          ? `An unresolved service ticket (${response.sourceTicketId}) was already open when this score was given.`
          : `Detractor on the ${TOUCHPOINT_LABEL[response.touchpoint].toLowerCase()} touchpoint with no owner assigned.`,
        evidence: handedOver.length
          ? [
              ...handedOver,
              `Verbatim: "${response.verbatim.slice(0, 140)}${response.verbatim.length > 140 ? '…' : ''}"`,
            ]
          : [
              `Verbatim: "${response.verbatim.slice(0, 140)}${response.verbatim.length > 140 ? '…' : ''}"`,
              `Channel ${response.channel} · ${TOUCHPOINT_LABEL[response.touchpoint]}`,
              response.sourceTicketId
                ? `Linked service ticket ${response.sourceTicketId} still unresolved`
                : 'No linked service ticket',
            ],
      })
    })
  },

  async recommendAction(findings, ctx) {
    return findings.map((f) => {
      const response = ctx.surveyResponses.find(
        (r) => `recovery-${r.id}` === f.id,
      )
      const lead = ctx.leads.find((l) => l.id === f.leadId)
      const slaDays = (response?.npsScore ?? 5) <= 2 ? 2 : 5

      // The theme this specific response belongs to, not a blank id — a blank
      // id meant every case the agent opened showed no theme label anywhere
      // downstream, including in the activity feed and on the case itself.
      const theme = response
        ? ctx.feedbackThemes.find((t) => t.responseIds.includes(response.id))
        : undefined

      return plan(
        'agent-detractor-recovery',
        f,
        'Open a recovery case with an owner and SLA',
        'A detractor with no owner and no deadline is a customer who hears nothing.',
        `Recovery case opened · owner ${
          ref().reps.find((r) => r.id === lead?.ownerId)?.name ?? 'Customer Care'
        } · SLA ${slaDays} day(s)`,
        {
          kind: 'create-recovery-case',
          responseId: response?.id ?? '',
          leadId: f.leadId!,
          ownerId: lead?.ownerId ?? ref().reps[0].id,
          severity: f.severity,
          themeId: theme?.id ?? '',
          slaDays,
          recommendedResponse:
            'Acknowledge the delay, name a single owner, and commit to a dated next step in writing.',
          sourceTicketId: response?.sourceTicketId,
        },
      )
    })
  },
})

/* ------------------------------------------------------------------ */
/* 17. Voice-of-Customer Control Tower                                 */
/* ------------------------------------------------------------------ */

const controlTowerAgent = defineAgent({
  id: 'agent-voc-control-tower',
  name: 'Control Tower Agent',
  archetype: 'pattern-identifier',
  priority: 'Medium',
  description:
    'Watches whether recovery actually happens — which cases are past SLA, and how much detractor feedback nobody has picked up.',
  scenario:
    'Recovery cases are opened during the quarter and quietly age past their SLA.',
  currentIssue:
    'Leadership sees the score but not whether the follow-through behind it is holding.',
  aiSolution:
    'Track closure discipline and SLA breaches, and surface the detractor volume with no case attached at all.',
  crmAction: 'Escalate overdue cases to the next step in the path.',

  detectSync(ctx) {
    const summary = selectRecoverySummary(ctx.surveyResponses, ctx.recoveryCases)
    const findings = []

    const breaching = ctx.recoveryCases
      .filter((c) => c.status !== 'closed' && caseSlaDaysOverdue(c) > 0)
      .sort((a, b) => caseSlaDaysOverdue(b) - caseSlaDaysOverdue(a))

    for (const recoveryCase of breaching.slice(0, MAX_FINDINGS - 1)) {
      const overdue = caseSlaDaysOverdue(recoveryCase)
      findings.push(
        finding({
          id: `tower-${recoveryCase.id}`,
          leadId: recoveryCase.leadId,
          subjectName: recoveryCase.customerName,
          severity: overdue > 5 ? 'critical' : 'high',
          headline: `${recoveryCase.customerName}'s recovery case is ${overdue} day(s) past SLA`,
          detail:
            'The case is open, the deadline has passed and no closure evidence has been recorded.',
          evidence: [
            `Opened ${recoveryCase.openedAt.slice(0, 10)}, SLA ${recoveryCase.slaDueAt.slice(0, 10)}`,
            `Status ${recoveryCase.status}`,
            `Escalation path: ${recoveryCase.escalationPath.join(' → ')}`,
          ],
        }),
      )
    }

    if (summary.unworked > 0) {
      findings.push(
        finding({
          id: 'tower-unworked',
          subjectName: 'Unworked detractors',
          severity: summary.unworked > 200 ? 'critical' : 'high',
          headline: `${summary.unworked} detractors have no recovery case at all`,
          detail:
            'These customers gave a detractor score and no owner has picked them up. This is the real exposure behind the closure rate.',
          evidence: [
            `Closure rate ${summary.closureRatePct}% across ${ctx.recoveryCases.length} case(s)`,
            `${summary.breaching} case(s) currently breaching SLA`,
          ],
        }),
      )
    }

    return findings
  },

  async recommendAction(findings, ctx) {
    return findings
      .filter((f) => f.id !== 'tower-unworked')
      .map((f) => {
        const recoveryCase = ctx.recoveryCases.find(
          (c) => `tower-${c.id}` === f.id,
        )
        return plan(
          'agent-voc-control-tower',
          f,
          'Escalate to the next step in the path',
          'The SLA has passed with no closure evidence recorded.',
          `Escalation task raised · ${recoveryCase?.escalationPath[1] ?? 'Customer Care lead'}`,
          {
            kind: 'create-task',
            leadId: f.leadId ?? '',
            subject: `Escalated recovery — ${f.subjectName}`,
            ownerId: ref().reps[0].id,
            dueInDays: 1,
            priority: 'High',
          },
        )
      })
  },
})

export const FEEDBACK_AGENTS: Agent[] = [
  surveyOptimizerAgent,
  feedbackJourneyAgent,
  vocAnalyzerAgent,
  rootCauseAgent,
  detractorRecoveryAgent,
  controlTowerAgent,
]

/** Total detractor exposure the feedback agents can see — gallery header. */
export function detractorCount(ctx: AgentContext) {
  return ctx.surveyResponses.filter((r) => r.npsBand === 'detractor').length
}
