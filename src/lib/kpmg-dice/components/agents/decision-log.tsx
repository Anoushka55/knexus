'use client'

import { GitFork, ScrollText } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatDate, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * The governance trail: every AI-influenced decision a human committed.
 *
 * Distinct from the CRM activity feed, which records what changed on a record.
 * This records who wanted it, whether another agent wanted the opposite, and
 * that a person committed it — which is the artefact a regulated or consulting
 * buyer actually asks for.
 *
 * Written at `executeWrite`, so it covers the chain, the agent gallery, the
 * copilot and Risk Alerts without any of them knowing this panel exists.
 */

/** Plain-language names for the write kinds — the log is read by non-engineers. */
const KIND_LABEL: Record<string, string> = {
  'flag-lead': 'Lead flagged',
  'update-lead': 'Lead updated',
  'create-task': 'Task created',
  'log-activity': 'Activity logged',
  'suppress-campaign': 'Campaign suppressed',
  'ingest-sanitized': 'Records ingested',
  'schedule-survey': 'Survey scheduled',
  'suppress-survey': 'Survey suppressed',
  'create-recovery-case': 'Recovery case opened',
  'tag-feedback': 'Feedback tagged',
}

export function DecisionLog() {
  const decisionLog = useCrmStore((s) => s.decisionLog)
  const contested = decisionLog.filter((d) => d.contested).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI decision log</CardTitle>
        <span className="text-[10.5px] font-medium text-slate-400">
          {formatNumber(decisionLog.length)} committed
          {contested > 0 && ` · ${formatNumber(contested)} contested`}
        </span>
      </CardHeader>

      <CardContent className="pb-4">
        {decisionLog.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-8 text-center">
            <ScrollText className="size-5 text-slate-300" />
            <p className="text-[12.5px] font-semibold text-slate-600">
              Nothing committed yet
            </p>
            <p className="max-w-sm text-[11.5px] leading-relaxed text-slate-500">
              Run a chain and commit the brief. Every write a person approves is
              recorded here with the agent that proposed it — and with the
              opposing agent, where one disagreed.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {decisionLog.map((entry) => (
              <li key={entry.id} className="flex gap-3 py-2.5 first:pt-0">
                <span
                  className={cn(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                    entry.contested
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-kpmg-blue/10 text-kpmg-blue',
                  )}
                >
                  {entry.contested ? (
                    <GitFork className="size-3.5" strokeWidth={2.2} />
                  ) : (
                    <ScrollText className="size-3.5" strokeWidth={2.2} />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="text-[12.5px] font-semibold text-slate-900">
                      {entry.label}
                    </p>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {KIND_LABEL[entry.writeKind] ?? entry.writeKind}
                    </span>
                    {entry.contested && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Contested
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">
                    {entry.crmEffect}
                  </p>

                  {entry.contested && entry.contestedWith && (
                    /*
                     * The opposing plan, named.
                     *
                     * A log that says "contested" without saying by whom is a
                     * badge, not an audit trail — the whole value of recording
                     * a disagreement is being able to see both sides of it
                     * after the fact.
                     */
                    <p className="mt-1 rounded-md border border-amber-200 bg-amber-50/70 px-2 py-1 text-[11px] leading-snug text-amber-900">
                      Opposed by {entry.contestedWith}
                    </p>
                  )}

                  <p className="mt-1 text-[10.5px] text-slate-400">
                    {entry.agentName} · committed by a person ·{' '}
                    {formatDate(entry.at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
