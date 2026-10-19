'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CircleCheck,
  Clock,
  CornerDownRight,
  LifeBuoy,
  ShieldAlert,
} from 'lucide-react'

import { Button } from '@/lib/kpmg-dice/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { SeverityPill } from '@/lib/kpmg-dice/components/shared/pills'
import {
  describeWrite,
  executeWrite,
  recoveryBundle,
} from '@/lib/kpmg-dice/lib/agents/runtime'
import { HumanReviewNote } from './guardrails'
import { caseSlaDaysOverdue } from '@/lib/kpmg-dice/lib/selectors/feedback'
import { useFeedbackData } from '@/lib/kpmg-dice/lib/selectors/use-feedback-data'


import { formatDate, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { TOUCHPOINT_LABEL } from '@/lib/kpmg-dice/types'
import type { RecoveryCase, Severity, SurveyResponse } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Detractor Recovery Copilot.
 *
 * Closes the loop: a detractor score becomes an owned case with an SLA, a
 * drafted response and an escalation path. The copilot proposes and the user
 * commits — nothing is written until the button is clicked, and the draft is
 * never sent to a customer by the platform.
 */

const STATUS_TONE: Record<RecoveryCase['status'], string> = {
  proposed: 'bg-slate-100 text-slate-600',
  open: 'bg-sky-50 text-sky-700',
  'in-progress': 'bg-kpmg-blue/10 text-kpmg-blue',
  escalated: 'bg-red-50 text-red-700',
  closed: 'bg-emerald-50 text-emerald-700',
}

function severityFor(npsScore: number): Severity {
  if (npsScore <= 2) return 'critical'
  if (npsScore <= 4) return 'high'
  return 'medium'
}

function slaDaysFor(npsScore: number) {
  return npsScore <= 2 ? 2 : 5
}

/** The play depends on the aspect — a documentation delay is not a snag. */
const RECOVERY_PLAYS: Record<string, string> = {
  Documentation:
    'Name a single owner today, confirm the registration slot in writing, and give a dated commitment rather than an apology.',
  Service:
    'Assign one owner to the open request, call the customer with a dated plan, and close the loop in writing.',
  Handover:
    'Share the dated possession plan with the site engineer copied in, then schedule a joint walkthrough.',
  Payment:
    'Reconcile the ledger against receipts and issue a corrected statement within 24 hours.',
  Quality:
    'Raise a snag-closure work order with the contractor and set a re-inspection date with the customer present.',
  Amenities: 'Activate the membership and send access credentials the same day.',
  Allotment:
    'Check the allotment letter against parking inventory and confirm the correction in writing.',
  Sales:
    'Have the relationship manager call personally, acknowledge the gap, and set a single point of contact.',
}

function draftFor(response: SurveyResponse, play: string) {
  const first = response.customerName.split(' ')[0]
  return `Dear ${first}, thank you for the feedback on your ${TOUCHPOINT_LABEL[
    response.touchpoint
  ].toLowerCase()} experience — you were right to raise it. I am personally owning this from today and will come back to you with a confirmed date. ${play}`
}

export function DetractorRecovery() {
  const { reps } = useReference()
  const { recoveryQueue, recovery, cases, themes } = useFeedbackData()
  const leadsById = useCrmStore((s) => s.leadsById)
  const updateRecoveryCase = useCrmStore((s) => s.updateRecoveryCase)

  const [selectedId, setSelectedId] = useState('')

  /* Unworked detractors first — an open case is already someone's problem. */
  const queue = useMemo(() => recoveryQueue.slice(0, 14), [recoveryQueue])
  const active = queue.find((r) => r.response.id === selectedId) ?? queue[0]

  const activeThemes = active
    ? themes.filter((t) => t.responseIds.includes(active.response.id))
    : []
  const aspect = activeThemes[0]?.aspect ?? 'Service'
  const play = RECOVERY_PLAYS[aspect] ?? RECOVERY_PLAYS.Service

  const owner = active
    ? reps.find((r) => r.id === (cases.find((c) => c.responseId === active.response.id)?.ownerId))
    : undefined

  /*
   * Everything approval will actually change.
   *
   * Built before the click rather than inside it, so the list below and the
   * writes that land are the same array — a preview assembled separately from
   * the commit is a preview that can lie.
   */
  const assignee = owner ?? reps[0]
  const lead = active ? leadsById[active.response.leadId] : undefined
  const bundle = useMemo(
    () =>
      active && lead && assignee
        ? recoveryBundle({
            responseId: active.response.id,
            customerName: active.response.customerName,
            lead,
            ownerId: assignee.id,
            ownerName: assignee.name,
            severity: severityFor(active.response.npsScore),
            themeId: activeThemes[0]?.id ?? '',
            aspect,
            slaDays: slaDaysFor(active.response.npsScore),
            recommendedResponse: draftFor(active.response, play),
            sourceTicketId: active.response.sourceTicketId,
          })
        : [],
    [active, lead, assignee, activeThemes, aspect, play],
  )

  const openCases = cases
    .filter((c) => c.status !== 'closed')
    .sort((a, b) => caseSlaDaysOverdue(b) - caseSlaDaysOverdue(a))
    .slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Open cases"
          value={formatNumber(recovery.open + recovery.inProgress)}
          sub={`${formatNumber(recovery.escalated)} escalated`}
          icon={LifeBuoy}
          accent="text-kpmg-magenta"
          accentBg="bg-kpmg-magenta/10"
        />
        <StatTile
          label="Breaching SLA"
          value={formatNumber(recovery.breaching)}
          sub="Past due, unresolved"
          icon={ShieldAlert}
          danger
        />
        <StatTile
          label="Closure rate"
          value={`${recovery.closureRatePct}%`}
          sub={`${formatNumber(recovery.closed)} closed`}
          icon={CircleCheck}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Unworked detractors"
          value={formatNumber(recovery.unworked)}
          sub="No case opened yet"
          icon={AlertTriangle}
          accent="text-amber-600"
          accentBg="bg-amber-50"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* Detractor queue */}
        <Card className="flex min-w-0 flex-col">
          <CardHeader>
            <CardTitle>Detractor queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="max-h-[460px] overflow-y-auto scrollbar-slim">
              {queue.map(({ response, existingCase, hasBreachedTicket }) => (
                <li key={response.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(response.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0',
                      response.id === active?.response.id
                        ? 'bg-kpmg-blue/[0.06]'
                        : 'hover:bg-slate-50',
                    )}
                  >
                    <InitialsAvatar name={response.customerName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-slate-900">
                        {response.customerName}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {TOUCHPOINT_LABEL[response.touchpoint]}
                        {hasBreachedTicket && ' · open ticket'}
                      </p>
                    </div>
                    {existingCase ? (
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider',
                          STATUS_TONE[existingCase.status],
                        )}
                      >
                        {existingCase.status}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-amber-700">
                        No case
                      </span>
                    )}
                    <span className="nums shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[12px] font-bold text-red-700">
                      {response.npsScore}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recovery case */}
        {active && (
          <Card className="flex min-w-0 flex-col">
            <CardHeader>
              <CardTitle className="min-w-0 truncate">
                Recovery case — {active.response.customerName}
              </CardTitle>
              <SeverityPill severity={severityFor(active.response.npsScore)} />
            </CardHeader>

            <CardContent className="space-y-3 pb-4">
              <blockquote className="rounded-lg border-l-[3px] border-red-300 bg-red-50/40 py-2 pl-3 pr-3 text-[12.5px] italic leading-relaxed text-slate-600">
                {active.response.verbatim}
              </blockquote>

              {active.response.sourceTicketId && (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11.5px] leading-relaxed text-slate-600">
                  Linked to service ticket{' '}
                  <code className="text-[11px] font-semibold text-slate-700">
                    {active.response.sourceTicketId}
                  </code>
                  , which was open and unresolved when this score was given.
                </p>
              )}

              {/* Owner and SLA */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <p className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
                    Recommended owner
                  </p>
                  <p className="mt-0.5 truncate text-[12px] font-bold text-slate-800">
                    {owner?.name ?? 'Customer Care'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <p className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
                    Recovery SLA
                  </p>
                  <p className="nums mt-0.5 text-[12px] font-bold text-slate-800">
                    {slaDaysFor(active.response.npsScore)} days
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <p className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
                    Theme
                  </p>
                  <p className="mt-0.5 truncate text-[12px] font-bold text-slate-800">
                    {aspect}
                  </p>
                </div>
              </div>

              {/* Drafted response */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Recommended response — draft
                </p>
                <p className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-slate-600">
                  {draftFor(active.response, play)}
                </p>
              </div>

              {/* Escalation path */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Escalation path
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {[
                    owner?.name ?? 'Owner',
                    'Customer Care lead',
                    'Head of CX',
                  ].map((step, i) => (
                    <span key={step} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-slate-300">→</span>}
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {step}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/*
                Case timeline and closure evidence.

                Both were generated on every seeded case and shown nowhere. They
                are what turns "we opened a case" into "here is what happened and
                here is the proof it closed" — which is the whole closure
                discipline argument.
              */}
              {active.existingCase && active.existingCase.timeline.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Case timeline
                  </p>
                  <ol className="mt-2 space-y-0">
                    {active.existingCase.timeline.map((entry, i, all) => (
                      <li key={i} className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-kpmg-blue" />
                          {i < all.length - 1 && (
                            <span className="w-px flex-1 bg-slate-200" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pb-3">
                          <p className="text-[12px] leading-snug text-slate-700">
                            {entry.note}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-slate-400">
                            {entry.actor} · {formatDate(entry.at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {active.existingCase?.closureEvidence && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    <CircleCheck className="size-3" />
                    Closure evidence
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-slate-700">
                    {active.existingCase.closureEvidence}
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-2.5">
                <HumanReviewNote>
                  The draft is prepared for a person to review and send. The
                  platform never contacts a customer on its own.
                </HumanReviewNote>
              </div>

              {!active.existingCase ? (
                <div className="space-y-2.5">
                  {/*
                    What approval commits, itemised.

                    Recovery used to open a case and stop, which left the lead
                    reading exactly as it had before a customer told us they
                    were unhappy. It now corrects the record too — and because
                    it changes the record, it has to say so first.
                  */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Approving this will
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {bundle.map((write, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-[11.5px] leading-snug text-slate-600"
                        >
                          <CornerDownRight className="mt-0.5 size-3 shrink-0 text-kpmg-blue" />
                          {describeWrite(write)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!bundle.length}
                    onClick={() => {
                      for (const write of bundle) {
                        executeWrite(write, {
                          agentId: 'agent-detractor-recovery',
                          label: `Recovery for ${active.response.customerName}`,
                          crmEffect: describeWrite(write),
                        })
                      }
                    }}
                  >
                    <LifeBuoy />
                    Approve and commit
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={active.existingCase.status === 'closed'}
                    onClick={() =>
                      // The store stamps closedAt from DEMO_NOW. Passing a wall
                      // clock here dated a closed case months away from every
                      // other record on the same screen.
                      updateRecoveryCase(
                        active.existingCase!.id,
                        { status: 'closed' },
                        'Resolution confirmed with the customer.',
                      )
                    }
                  >
                    <CircleCheck />
                    {active.existingCase.status === 'closed'
                      ? 'Closed'
                      : 'Mark resolved'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* SLA view */}
      <Card>
        <CardHeader>
          <CardTitle>Open cases by SLA</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul>
            {openCases.map((recoveryCase) => {
              const overdue = caseSlaDaysOverdue(recoveryCase)
              const themeLabel =
                themeById(recoveryCase.themeId)?.label ?? '—'
              return (
                <li
                  key={recoveryCase.id}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0"
                >
                  <InitialsAvatar name={recoveryCase.customerName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-slate-900">
                      {recoveryCase.customerName}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {themeLabel} · opened {formatDate(recoveryCase.openedAt)}
                    </p>
                  </div>
                  <SeverityPill severity={recoveryCase.severity} />
                  <span
                    className={cn(
                      'nums shrink-0 rounded-md px-2 py-0.5 text-[11.5px] font-semibold',
                      overdue > 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {overdue > 0
                      ? `${overdue}d over`
                      : `${Math.abs(overdue)}d left`}
                  </span>
                  <span
                    className={cn(
                      'hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider sm:inline-flex',
                      STATUS_TONE[recoveryCase.status],
                    )}
                  >
                    {recoveryCase.status}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-slate-100 px-4 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Clock className="size-3.5 text-slate-400" />
              Cases past SLA escalate automatically to the next step in the
              path.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useReference } from '@/lib/kpmg-dice/data/use-reference'
import { themeById } from '@/lib/kpmg-dice/data/active-reference'