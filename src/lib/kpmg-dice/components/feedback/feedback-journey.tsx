'use client'

import { useEffect, useMemo, useState } from 'react'
import { CornerDownRight, MessageCircle, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { StagePill } from '@/lib/kpmg-dice/components/shared/pills'
import { HumanReviewNote, LockedQuestionBadge } from './guardrails'
import { CONDITIONAL_FOLLOW_UPS } from '@/lib/kpmg-dice/data/feedback'
import { composeQuestions } from '@/lib/kpmg-dice/lib/selectors/feedback'

import { usePersonaFor } from '@/lib/kpmg-dice/lib/personas/use-persona-map'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { STAGE_ORDER, TOUCHPOINT_LABEL, TOUCHPOINT_ORDER } from '@/lib/kpmg-dice/types'
import type { JourneyStage, SurveyChannel, TouchpointId } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Dynamic Customer Feedback Journey.
 *
 * Composes a survey for one customer from the approved library. The two
 * standard NPS questions are locked: the model chooses which supporting
 * questions to add and how to word the channel copy, but benchmarkability dies
 * the moment the NPS wording drifts, so that part is not on the table.
 */

const STAGE_LABEL: Record<JourneyStage, string> = {
  lead: 'Lead',
  engaged: 'Engaged',
  qualified: 'Qualified',
  'site-visit': 'Site Visit',
  proposal: 'Proposal',
  booking: 'Booking',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
}

const CHANNEL_COPY: Record<SurveyChannel, { label: string; guidance: string }> = {
  whatsapp: {
    label: 'WhatsApp',
    guidance:
      'Two lines, first name only, one question per message. Sign off with the rep name.',
  },
  email: {
    label: 'Email',
    guidance:
      'Subject line names the touchpoint. Full question set in one page, no more than five questions.',
  },
  sms: {
    label: 'SMS',
    guidance: 'Under 160 characters. Single question with a short link.',
  },
  call: {
    label: 'Call',
    guidance:
      'Read the NPS question verbatim, then let the customer talk. Capture the open text as spoken.',
  },
  'in-app': {
    label: 'In-app',
    guidance: 'One question on screen at a time, dismissible without penalty.',
  },
}

export function FeedbackJourney() {
  const leads = useCrmStore((s) => s.leads)
  const engagements = useCrmStore((s) => s.engagements)

  /*
   * Six customers with enough journey behind them to compose a survey against.
   *
   * This filtered on `featured`, which is curation rather than data: only the
   * nine hand-authored profiles in src/data/featured.ts carry it and every
   * generated lead is explicitly false. An imported book therefore produced an
   * empty list, which left the select with no options and blanked the entire
   * page at the `!lead` guard below — the header rendered from the layout, so
   * it read as half-loaded rather than broken.
   *
   * Ranked instead. Authored profiles still sort to the front when the book has
   * them, so the walkthrough is unchanged, and the remaining slots come from
   * whatever book is loaded: conversation history first, because the persona
   * match and the composed questions are both read off it, then journey depth,
   * then score.
   */
  const authored = useMemo(() => {
    const conversations = new Map<string, number>()
    for (const e of engagements) {
      conversations.set(e.leadId, (conversations.get(e.leadId) ?? 0) + 1)
    }

    // Ranked once per lead rather than inside the comparator, which would
    // recompute the stage lookup on every comparison.
    const ranked = leads
      .filter((l) => !l.dnd)
      .map((l) => ({
        lead: l,
        rank:
          (l.featured ? 10_000 : 0) +
          Math.min(conversations.get(l.id) ?? 0, 10) * 30 +
          STAGE_ORDER.indexOf(l.stage) * 25 +
          l.score,
      }))

    // A stable sort, so leads of equal rank keep the book's own order.
    ranked.sort((a, b) => b.rank - a.rank)
    return ranked.slice(0, 6).map((r) => r.lead)
  }, [leads, engagements])

  const [leadId, setLeadId] = useState(authored[0]?.id ?? '')

  /*
   * Deep link from the SPAR engine panel's "Compose in full" action.
   *
   * Read in an effect rather than during render: the query string is not
   * available on the server, and seeding useState from it directly would make
   * the first client render disagree with the server's.
   */
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get('lead')
    if (target && leads.some((l) => l.id === target)) setLeadId(target)
  }, [leads])

  /*
   * The engine links here for whoever is in the survey queue, and that is
   * almost never one of the six authored profiles. Without adding the arriving
   * customer to the options the select would hold a value none of its options
   * carried, so the control would show the wrong name while the panels beside
   * it composed for the right one.
   */
  const featured = useMemo(() => {
    const arrived = leads.find((l) => l.id === leadId)
    if (!arrived || authored.some((l) => l.id === leadId)) return authored
    return [arrived, ...authored]
  }, [authored, leads, leadId])
  const [touchpoint, setTouchpoint] = useState<TouchpointId>('site-visit')
  const [channel, setChannel] = useState<SurveyChannel>('whatsapp')

  const lead = leads.find((l) => l.id === leadId) ?? authored[0]
  const assignment = usePersonaFor(leadId)
  const persona = assignment ? personaById(assignment.best.personaId) : undefined

  /**
   * Question selection.
   *
   * Locked questions always appear. Supporting questions qualify on touchpoint,
   * then on journey stage and persona where the library declares them — which
   * is what makes the survey specific to this customer rather than generic.
   */
  const composed = useMemo(
    () => composeQuestions(lead, touchpoint, assignment?.best.personaId),
    [lead, touchpoint, assignment],
  )

  /*
   * Only reachable now for a book with no contactable leads at all. Says so,
   * rather than rendering nothing — a blank page reads as a failed deploy.
   */
  if (!lead) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-[13px] font-semibold text-slate-700">
            No customer to compose against
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            The loaded book has no contactable leads. Import a book with leads,
            or reset to the example data.
          </p>
        </CardContent>
      </Card>
    )
  }

  const stageIndex = STAGE_ORDER.indexOf(lead.stage)

  return (
    <div className="grid gap-3 xl:grid-cols-[330px_minmax(0,1fr)]">
      {/* ---- Customer feedback profile ---- */}
      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Customer feedback profile</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <select
              aria-label="Customer"
              value={lead.id}
              onChange={(e) => setLeadId(e.target.value)}
              className="mb-3 h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue/30"
            >
              {featured.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2.5">
              <InitialsAvatar name={lead.name} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-slate-900">
                  {lead.name}
                </p>
                <p className="truncate text-[11.5px] text-slate-500">
                  {lead.preferredLocation} · ₹{lead.budgetCr} Cr
                </p>
              </div>
            </div>

            {/* Journey-stage ribbon */}
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Journey stage
              </p>
              <div className="mt-1.5 flex gap-[3px]">
                {STAGE_ORDER.map((stage, i) => (
                  <div
                    key={stage}
                    title={STAGE_LABEL[stage]}
                    className={cn(
                      'h-1.5 flex-1 rounded-full',
                      i <= stageIndex ? 'bg-kpmg-blue' : 'bg-slate-100',
                    )}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-[11.5px] font-semibold text-slate-700">
                {STAGE_LABEL[lead.stage]}
              </p>
            </div>

            {/* Persona preview */}
            {persona && assignment && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <Users className="size-3" />
                  Persona
                </p>
                <p className="mt-1 text-[12.5px] font-bold text-slate-900">
                  {persona.name}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                  {persona.description}
                </p>
                <p className="mt-2 text-[10.5px] font-semibold text-slate-400">
                  {assignment.best.confidence}% match ·{' '}
                  {assignment.best.signals.length} signal(s)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel wording guidance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <MessageCircle className="size-4 text-kpmg-violet" />
              Channel wording
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-1">
              {(Object.keys(CHANNEL_COPY) as SurveyChannel[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={cn(
                    'rounded-md px-2 py-1 text-[11.5px] font-medium transition-colors',
                    c === channel
                      ? 'bg-kpmg-navy text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {CHANNEL_COPY[c].label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-500">
              {CHANNEL_COPY[channel].guidance}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Composer ---- */}
      <div className="min-w-0 space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Dynamic survey composer</CardTitle>
            <div className="flex shrink-0 items-center gap-1.5">
              <StagePill stage={lead.stage} />
              <select
                aria-label="Touchpoint"
                value={touchpoint}
                onChange={(e) => setTouchpoint(e.target.value as TouchpointId)}
                className="h-7 cursor-pointer rounded-md border border-slate-200 bg-white px-1.5 text-[11.5px] font-medium text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue/30"
              >
                {TOUCHPOINT_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {TOUCHPOINT_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="pb-4">
            <ol className="space-y-2">
              {composed.map((question, i) => (
                <li
                  key={question.id}
                  className={cn(
                    'rounded-lg border p-3',
                    question.locked
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-kpmg-blue/25 bg-kpmg-blue/[0.04]',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Q{i + 1} · {question.type}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-[12.5px] leading-snug',
                          question.locked
                            ? 'font-semibold text-slate-700'
                            : 'text-slate-700',
                        )}
                      >
                        {question.text}
                      </p>
                      {question.choices && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {question.choices.map((choice) => (
                            <span
                              key={choice}
                              className="rounded-full bg-white px-2 py-0.5 text-[10.5px] text-slate-500 ring-1 ring-inset ring-slate-200"
                            >
                              {choice}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {question.locked ? (
                      <LockedQuestionBadge />
                    ) : (
                      <span className="shrink-0 rounded-full bg-kpmg-blue/10 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-kpmg-blue">
                        Selected
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500">
              {composed.filter((q) => q.locked).length} governed question(s) plus{' '}
              {composed.filter((q) => !q.locked).length} selected for{' '}
              {TOUCHPOINT_LABEL[touchpoint].toLowerCase()} at the{' '}
              {STAGE_LABEL[lead.stage].toLowerCase()} stage
              {persona ? ` for a ${persona.shortName} buyer` : ''}.
            </p>
          </CardContent>
        </Card>

        {/* Conditional follow-up path */}
        <Card>
          <CardHeader>
            <CardTitle>Conditional follow-up path</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="space-y-2">
              {CONDITIONAL_FOLLOW_UPS.map((row) => (
                <li key={row.when} className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">
                    {row.when}
                  </span>
                  <CornerDownRight className="mt-1 size-3.5 shrink-0 text-slate-300" />
                  <p className="min-w-0 text-[12px] leading-snug text-slate-600">
                    {row.ask}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <HumanReviewNote>
                The composer proposes a question set. Nothing is sent to a
                customer until a person approves it.
              </HumanReviewNote>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { personaById } from '@/lib/kpmg-dice/data/active-reference'