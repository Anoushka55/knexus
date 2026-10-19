'use client'

import { useMemo, useState } from 'react'
import {
  Ban,
  CircleCheck,
  Clock,
  CornerDownRight,
  Database,
  Send,
  TrendingUp,
} from 'lucide-react'

import { Button } from '@/lib/kpmg-dice/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { HumanReviewNote } from './guardrails'
import { useFeedbackData } from '@/lib/kpmg-dice/lib/selectors/use-feedback-data'
import { composeQuestions, selectDataInputs } from '@/lib/kpmg-dice/lib/selectors/feedback'
import { CONDITIONAL_FOLLOW_UPS } from '@/lib/kpmg-dice/data/feedback'
import { usePersonaFor } from '@/lib/kpmg-dice/lib/personas/use-persona-map'
import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { TOUCHPOINT_LABEL, type TouchpointId } from '@/lib/kpmg-dice/types'
import type { SurveyInvite } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * AI Survey Participation Optimizer.
 *
 * Two halves, deliberately given equal weight. The queue is who to ask next;
 * the suppression list is who not to ask and why. An optimiser that only ever
 * says "send" is a mailing list — the restraint is what makes it a decision.
 */

/* Sequential, one hue, light to dark: propensity is magnitude, not identity. */
const BAND_STYLE: Record<
  'high' | 'medium' | 'low',
  { bar: string; chip: string; label: string }
> = {
  high: {
    bar: 'bg-kpmg-navy',
    chip: 'bg-kpmg-navy/10 text-kpmg-navy',
    label: 'High',
  },
  medium: {
    bar: 'bg-kpmg-blue',
    chip: 'bg-kpmg-blue/10 text-kpmg-blue',
    label: 'Medium',
  },
  low: {
    bar: 'bg-kpmg-lightblue',
    chip: 'bg-kpmg-lightblue/10 text-sky-700',
    label: 'Low',
  },
}

const CHANNEL_LABEL: Record<SurveyInvite['channel'], string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  call: 'Call',
  'in-app': 'In-app',
}

/**
 * The inputs the engine runs on.
 *
 * The pitch names six existing data sources; without them on screen a client
 * has to take on trust that the predictions are reading anything real. Each
 * row counts live records and says what that input decides, so the column is
 * auditable rather than decorative — a disconnected input reads zero here
 * instead of quietly printing a number that sounds plausible.
 */
function DataInputs() {
  const leads = useCrmStore((s) => s.leads)
  const engagements = useCrmStore((s) => s.engagements)
  const payments = useCrmStore((s) => s.payments)
  const surveyInvites = useCrmStore((s) => s.surveyInvites)
  const surveyResponses = useCrmStore((s) => s.surveyResponses)
  const ingestedLeadIds = useCrmStore((s) => s.ingestedLeadIds)

  const rows = useMemo(
    () =>
      selectDataInputs({
        leads,
        engagements,
        payments,
        invites: surveyInvites,
        responses: surveyResponses,
        ingestedLeadIds,
      }),
    [
      leads,
      engagements,
      payments,
      surveyInvites,
      surveyResponses,
      ingestedLeadIds,
    ],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Database className="size-4 text-kpmg-blue" />
          Key data inputs
        </CardTitle>
        <span className="text-[10.5px] font-medium text-slate-400">
          Existing records, counted live
        </span>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="min-w-0 border-l-2 border-slate-100 pl-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="min-w-0 truncate text-[11.5px] font-semibold text-slate-700">
                  {row.label}
                </p>
                <p className="nums shrink-0 text-[13px] font-bold text-slate-900">
                  {row.value}
                </p>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{row.detail}</p>
              <p className="mt-1 text-[11px] leading-snug text-slate-400">
                {row.usedFor}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * The four decisions, as one engine — the deck's KPMG SPAR AI Engine.
 *
 * Right moment, preferred channel, relevant questions and smart follow-up are
 * separate model outputs, and until now they were also separate screens — the
 * customer's own record answered all four but nothing ever showed them
 * together. Numbered because the numbering is the deck's, so what a client
 * sees on screen matches what they were pitched.
 *
 * Every panel states its own evidence. A step that had nothing to read says so
 * rather than presenting a default as a prediction.
 */
function EngineStep({
  n,
  title,
  value,
  evidence,
  children,
}: {
  n: number
  title: string
  value?: string
  evidence?: string
  children?: React.ReactNode
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="flex items-baseline gap-1.5">
        <span className="nums text-[13px] font-bold leading-none text-kpmg-blue">
          {n}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
      </div>
      {value && (
        <p className="mt-1.5 text-[12.5px] font-semibold leading-snug text-slate-900">
          {value}
        </p>
      )}
      {children}
      {evidence && (
        <p className="mt-1 text-[11px] leading-snug text-slate-500">{evidence}</p>
      )}
    </div>
  )
}

function EngagementEngine({ invite }: { invite: SurveyInvite }) {
  const lead = useCrmStore((s) => s.leadsById[invite.leadId])
  const assignment = usePersonaFor(invite.leadId)

  /*
   * Whether this customer's history has actually arrived through EAI.
   *
   * It is the honest caveat on every prediction below: DICE reasons over the
   * ingested record, so a customer whose history has not been ingested is one
   * the engine is guessing about from thinner evidence. Saying so beats
   * presenting the same confidence for both.
   */
  const ingested = useCrmStore((s) => s.ingestedLeadIds.includes(invite.leadId))

  const questions = composeQuestions(
    lead,
    invite.touchpoint,
    assignment?.best.personaId,
  )

  /*
   * Each decision reads its own field. An earlier cut picked these back out of
   * the signals list by matching the generator's wording, which meant the
   * authored hero record — whose signals say the same things in different
   * words — rendered both steps with no evidence at all.
   */
  const channelWhy = invite.channelReason
  const windowWhy = invite.windowReason
  const predictWhy = invite.signals

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-kpmg-blue">
          KPMG SPAR AI Engine
        </p>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            ingested
              ? 'bg-kpmg-teal/10 text-kpmg-teal'
              : 'bg-amber-50 text-amber-700',
          )}
        >
          {ingested
            ? 'History ingested'
            : 'History not ingested — predicting on thinner evidence'}
        </span>
      </div>

      {/* Predict — the ring the four numbered decisions sit inside. */}
      <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Predict &mdash; who is most likely to respond
          </span>
          <span className="nums shrink-0 text-[13px] font-bold text-slate-900">
            {invite.responsePropensity}
            <span className="text-[10px] font-semibold text-slate-400">/100</span>
          </span>
        </div>
        <ul className="mt-1.5 space-y-1">
          {predictWhy.map((signal, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="mt-[7px] size-1 shrink-0 rounded-full bg-slate-400" />
              <span className="text-[11.5px] leading-snug text-slate-600">
                {signal}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <EngineStep
          n={1}
          title="Smart follow-up"
          evidence="The branch is chosen by the score the customer gives, not decided in advance."
        >
          <ul className="mt-1.5 space-y-1">
            {CONDITIONAL_FOLLOW_UPS.map((row) => (
              <li key={row.band} className="flex gap-1.5">
                <CornerDownRight className="mt-[2px] size-3 shrink-0 text-slate-400" />
                <span className="text-[11.5px] leading-snug text-slate-600">
                  <span className="font-semibold text-slate-700">{row.when}</span>{' '}
                  &mdash; {row.ask}
                </span>
              </li>
            ))}
          </ul>
        </EngineStep>

        <EngineStep
          n={2}
          title="Preferred channel"
          value={CHANNEL_LABEL[invite.channel]}
          evidence={channelWhy}
        />

        <EngineStep
          n={4}
          title="At the right moment"
          value={
            invite.recommendedWindow === '-'
              ? 'Not scheduled'
              : invite.recommendedWindow
          }
          evidence={windowWhy}
        />

        <EngineStep
          n={3}
          title="Relevant questions"
          evidence={`${questions.length} question(s) qualified on touchpoint, stage and persona.`}
        >
          <ul className="mt-1.5 space-y-1">
            {questions.slice(0, 3).map((q) => (
              <li key={q.id} className="flex gap-1.5">
                <span className="mt-[6px] size-1 shrink-0 rounded-full bg-kpmg-blue/50" />
                <span className="text-[11.5px] leading-snug text-slate-700">
                  {q.text}
                  {q.locked && (
                    <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      locked
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <a
            href={`/agents/kpmg-dice/console/csat-nps/feedback-journey?lead=${invite.leadId}`}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-kpmg-blue hover:underline"
          >
            Compose in full
            <span aria-hidden>&rarr;</span>
          </a>
        </EngineStep>
      </div>
    </div>
  )
}

function QueueRow({
  invite,
  band,
  onSchedule,
  scheduled,
}: {
  invite: SurveyInvite
  band: 'high' | 'medium' | 'low'
  onSchedule: () => void
  scheduled: boolean
}) {
  const [open, setOpen] = useState(false)
  const style = BAND_STYLE[band]

  return (
    <li className="border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <InitialsAvatar name={invite.customerName} />

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-[13px] font-semibold text-slate-900">
            {invite.customerName}
          </p>
          <p className="truncate text-[11.5px] text-slate-500">
            {TOUCHPOINT_LABEL[invite.touchpoint]} · {CHANNEL_LABEL[invite.channel]}{' '}
            · {invite.recommendedWindow}
          </p>
        </button>

        {/* Propensity: bar plus the number, never colour alone. */}
        <div className="hidden w-[120px] shrink-0 items-center gap-2 sm:flex">
          <div className="h-1.5 min-w-0 flex-1 rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full', style.bar)}
              style={{ width: `${invite.responsePropensity}%` }}
            />
          </div>
          <span className="nums w-[28px] shrink-0 text-right text-[12px] font-bold text-slate-700">
            {invite.responsePropensity}
          </span>
        </div>

        <span
          className={cn(
            'hidden shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold md:inline-flex',
            style.chip,
          )}
        >
          {style.label}
        </span>

        <Button
          size="sm"
          variant={scheduled ? 'outline' : 'default'}
          disabled={scheduled}
          onClick={onSchedule}
          className="shrink-0"
        >
          {scheduled ? (
            'Scheduled'
          ) : (
            <>
              <Send />
              Schedule
            </>
          )}
        </Button>
      </div>

      {open && <EngagementEngine invite={invite} />}
    </li>
  )
}

/**
 * What the predictions actually produced.
 *
 * A survey programme can lift its response rate and still only ever hear from
 * the same segment, so participation on its own is not evidence the engine is
 * working. These two read the responses that came back rather than restating
 * the model's own outputs — they are the loop closing, not the pitch repeating.
 */
function TallyBars({
  rows,
}: {
  rows: { label: string; count: number; pct: number }[]
}) {
  return (
    <ul className="mt-1.5 space-y-1.5">
      {rows.slice(0, 4).map((row) => (
        <li key={row.label} className="flex items-center gap-2">
          <span className="w-[104px] shrink-0 truncate text-[11.5px] text-slate-600">
            {row.label}
          </span>
          <div className="h-1.5 min-w-0 flex-1 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-kpmg-blue"
              style={{ width: `${row.pct}%` }}
            />
          </div>
          {/* The number is always printed — the bar is never the only encoding. */}
          <span className="nums w-[34px] shrink-0 text-right text-[11.5px] font-semibold text-slate-700">
            {row.pct}%
          </span>
        </li>
      ))}
    </ul>
  )
}

function OutcomePanels({
  representation,
  responseKnowledge,
}: {
  representation: ReturnType<typeof useFeedbackData>['representation']
  responseKnowledge: ReturnType<typeof useFeedbackData>['responseKnowledge']
}) {
  const gaps = [
    ...representation.missingPersonaLabels,
    ...representation.missingStages,
  ]

  return (
    <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Broader representation</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-6">
            <div>
              <p className="nums text-[22px] font-bold leading-none text-slate-900">
                {representation.personasHeard}
                <span className="text-[13px] font-semibold text-slate-400">
                  /{representation.personasAsked}
                </span>
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Personas heard
              </p>
            </div>
            <div>
              <p className="nums text-[22px] font-bold leading-none text-slate-900">
                {representation.stagesHeard}
                <span className="text-[13px] font-semibold text-slate-400">
                  /{representation.stagesAsked}
                </span>
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Stages heard
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500">
            {gaps.length === 0 ? (
              <>
                Every persona and journey stage that was surveyed is represented
                in the responses.
              </>
            ) : (
              <>
                Not yet heard from:{' '}
                <span className="font-semibold text-slate-700">
                  {gaps.join(', ')}
                </span>
                . Coverage is measured against who was asked, not against the
                whole book.
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response knowledge</CardTitle>
          <span className="text-[10.5px] font-medium text-slate-400">
            Observed, not predicted
          </span>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Who responds
              </p>
              <TallyBars rows={responseKnowledge.byPersona} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                When
              </p>
              <TallyBars rows={responseKnowledge.byDayPart} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Through which channel
              </p>
              <TallyBars rows={responseKnowledge.byChannel} />
            </div>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500">
            Share of the {formatNumber(responseKnowledge.total)} responses
            received. This is what the next round of targeting learns from.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function SurveyOptimizer() {
  const { queue, propensityHeatmap, representation, responseKnowledge } =
    useFeedbackData()
  const scheduleSurveyInvite = useCrmStore((s) => s.scheduleSurveyInvite)

  /*
   * Scheduling moves the invite out of the queue this list is derived from, so
   * the row unmounts in the same update. Holding a session-local record of what
   * was sent keeps the confirmation on screen — otherwise a click just makes a
   * row disappear, which reads as a failure rather than a write.
   */
  const [sent, setSent] = useState<
    { id: string; name: string; channel: string; window: string }[]
  >([])

  const heatmapByTouchpoint = propensityHeatmap.reduce<
    Record<string, Record<string, number>>
  >((acc, cell) => {
    ;(acc[cell.touchpoint] ??= {})[cell.band] = cell.count
    return acc
  }, {})

  const touchpoints = Object.keys(heatmapByTouchpoint) as TouchpointId[]
  const maxCell = Math.max(1, ...propensityHeatmap.map((c) => c.count))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="In the queue"
          value={formatNumber(queue.queued.length)}
          sub="Eligible, not yet sent"
          icon={Send}
        />
        <StatTile
          label="Mean propensity"
          value={`${queue.queueMeanPropensity}`}
          sub="Predicted response likelihood"
          icon={TrendingUp}
        />
        <StatTile
          label="Response rate"
          value={`${queue.responseRatePct}%`}
          sub={`${formatNumber(queue.respondedCount)} of ${formatNumber(queue.sentCount)} sent`}
          icon={Clock}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Held back"
          value={formatNumber(queue.suppressed.length)}
          sub="Fatigue or preference"
          icon={Ban}
          accent="text-amber-600"
          accentBg="bg-amber-50"
        />
      </div>

      <DataInputs />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* The queue */}
        <Card className="flex min-w-0 flex-col">
          <CardHeader>
            <CardTitle>Survey opportunity queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sent.length > 0 && (
              <ul className="border-b border-emerald-100 bg-emerald-50/50">
                {sent.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-2 px-4 py-2 text-[11.5px]"
                  >
                    <CircleCheck
                      className="size-3.5 shrink-0 text-emerald-600"
                      strokeWidth={2.2}
                    />
                    <span className="font-semibold text-slate-800">
                      {row.name}
                    </span>
                    <span className="min-w-0 truncate text-slate-500">
                      scheduled on {row.channel} · {row.window}
                    </span>
                    <span className="ml-auto shrink-0 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">
                      Written to CRM
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <ul>
              {queue.queued.slice(0, 12).map(({ invite, band }) => (
                <QueueRow
                  key={invite.id}
                  invite={invite}
                  band={band}
                  scheduled={false}
                  onSchedule={() => {
                    scheduleSurveyInvite(
                      invite.id,
                      `Predicted response likelihood ${invite.responsePropensity}%`,
                    )
                    setSent((rows) => [
                      {
                        id: invite.id,
                        name: invite.customerName,
                        channel: invite.channel,
                        window: invite.recommendedWindow,
                      },
                      ...rows,
                    ])
                  }}
                />
              ))}
            </ul>
            <div className="border-t border-slate-100 px-4 py-2.5">
              <HumanReviewNote>
                Nothing is sent until you schedule it. Each send writes a survey
                invite to the CRM activity feed.
              </HumanReviewNote>
            </div>
          </CardContent>
        </Card>

        {/* The restraint */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Ban className="size-4 text-amber-600" />
              Held back
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="max-h-[420px] overflow-y-auto scrollbar-slim">
              {queue.suppressed.slice(0, 8).map(({ invite }) => (
                <li
                  key={invite.id}
                  className="border-b border-slate-100 px-4 py-2.5 last:border-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12.5px] font-semibold text-slate-900">
                      {invite.customerName}
                    </p>
                    <span className="nums shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-700">
                      {invite.suppressedLabel ??
                        `${invite.fatigueScore} sent / 90d`}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    {invite.suppressedReason}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <OutcomePanels
        representation={representation}
        responseKnowledge={responseKnowledge}
      />

      {/* Response likelihood heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Response likelihood by touchpoint</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="w-full min-w-[420px]">
              <thead>
                <tr>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Touchpoint
                  </th>
                  {(['high', 'medium', 'low'] as const).map((band) => (
                    <th
                      key={band}
                      className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {BAND_STYLE[band].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {touchpoints.map((touchpoint) => (
                  <tr key={touchpoint}>
                    <td className="py-1 pr-3 text-[12px] text-slate-600">
                      {TOUCHPOINT_LABEL[touchpoint]}
                    </td>
                    {(['high', 'medium', 'low'] as const).map((band) => {
                      const count = heatmapByTouchpoint[touchpoint]?.[band] ?? 0
                      return (
                        <td key={band} className="py-1 pl-1.5">
                          {/* Value printed in every cell — never colour alone. */}
                          <div
                            className="flex items-center justify-end rounded-md px-2 py-1.5"
                            style={{
                              backgroundColor: `rgba(0, 94, 184, ${
                                0.06 + (count / maxCell) * 0.42
                              })`,
                            }}
                          >
                            <span className="nums text-[12px] font-semibold text-slate-800">
                              {formatNumber(count)}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
