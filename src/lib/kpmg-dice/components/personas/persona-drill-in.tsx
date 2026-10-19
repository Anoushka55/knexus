'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CircleCheck, ExternalLink, Loader2, Sparkles } from 'lucide-react'

import { Card } from '@/lib/kpmg-dice/components/ui/card'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { ScorePill } from '@/lib/kpmg-dice/components/shared/score-pill'

import { useAIService } from '@/lib/kpmg-dice/lib/ai/use-ai-service'
import { explainPersonaMatch } from '@/lib/kpmg-dice/lib/personas/mapping'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore } from '@/lib/kpmg-dice/lib/format'
import { personaById } from '@/lib/kpmg-dice/data/active-reference'

/**
 * Why a lead landed on a persona.
 *
 * The assignment is deterministic — the AI service only narrates it, so the
 * same lead never shows a different persona on a second run during a demo.
 */
export function PersonaDrillIn({ leadId }: { leadId: string }) {
  const lead = useCrmStore((s) => s.leadsById[leadId])
  const customers = useCrmStore((s) => s.customers)
  const engagements = useCrmStore((s) => s.engagements)
  const ai = useAIService()

  const [state, setState] = useState<{
    loading: boolean
    rationale: string
    assignment: Awaited<ReturnType<typeof explainPersonaMatch>>['assignment'] | null
  }>({ loading: true, rationale: '', assignment: null })

  useEffect(() => {
    if (!lead) return
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))

    explainPersonaMatch(
      {
        lead,
        customer: customers.find((c) => c.id === leadId),
        engagements: engagements.filter((e) => e.leadId === leadId),
      },
      ai,
    ).then(({ assignment, rationale }) => {
      if (!cancelled) setState({ loading: false, rationale, assignment })
    })

    return () => {
      cancelled = true
    }
  }, [lead, leadId, customers, engagements, ai])

  if (!lead) return null

  const { assignment, rationale, loading } = state
  const persona = assignment ? personaById(assignment.best.personaId) : null
  const runnerUp = assignment?.runnerUp
    ? personaById(assignment.runnerUp.personaId)
    : null

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-5">
        {/* Who */}
        <div className="flex min-w-[220px] items-center gap-3">
          <InitialsAvatar name={lead.name} className="size-12 text-base" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight text-slate-900">
              {lead.name}
            </p>
            <p className="text-[11.5px] text-slate-500">
              {lead.id} · {lead.preferredLocation}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <ScorePill score={lead.score} />
              <span className="text-[11.5px] font-medium text-slate-500">
                {formatCrore(lead.budgetCr, { decimals: 1 })} ·{' '}
                {lead.familySize} members
              </span>
            </div>
          </div>
        </div>

        {/* Assignment */}
        {loading || !persona ? (
          <div className="flex flex-1 items-center gap-2 text-[13px] text-slate-400">
            <Loader2 className="size-4 animate-spin" />
            Scoring against personas…
          </div>
        ) : (
          <>
            <div className="min-w-[200px] flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Assigned persona
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className="rounded-md px-2.5 py-1 text-[13px] font-bold text-white"
                  style={{ backgroundColor: persona.color }}
                >
                  {persona.name}
                </span>
                <span className="nums text-[13px] font-bold text-slate-900">
                  {assignment!.best.confidence}%
                </span>
              </div>

              {/* Confidence bar — track is a lighter step of the same hue */}
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: `${persona.color}22` }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${assignment!.best.confidence}%`,
                    backgroundColor: persona.color,
                  }}
                />
              </div>

              {runnerUp && (
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Runner-up: {runnerUp.name} ({assignment!.runnerUp!.confidence}%)
                </p>
              )}

              <Link
                href={`/agents/kpmg-dice/console/customers/${lead.id}`}
                className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-kpmg-blue hover:text-kpmg-navy"
              >
                Open Customer 360
                <ExternalLink className="size-3.5" />
              </Link>
            </div>

            {/* Evidence */}
            <div className="min-w-[280px] flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Signals used
              </p>
              <ul className="mt-1.5 space-y-1">
                {assignment!.best.signals.map((signal) => (
                  <li key={signal} className="flex gap-1.5">
                    <CircleCheck
                      className="mt-0.5 size-3.5 shrink-0 text-dice-status-success"
                      strokeWidth={2.2}
                    />
                    <span className="text-[11.5px] leading-snug text-slate-600">
                      {signal}
                    </span>
                  </li>
                ))}
                {!assignment!.best.signals.length && (
                  <li className="text-[11.5px] text-slate-400">
                    Assigned on budget band alone — no behavioural signals yet.
                  </li>
                )}
              </ul>
            </div>

            {/* Playbook + rationale */}
            <div className="min-w-[240px] flex-1 rounded-xl border border-kpmg-violet/15 bg-kpmg-violet/[0.05] p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-kpmg-violet" strokeWidth={2.2} />
                <p className="text-[11.5px] font-bold text-kpmg-violet">
                  DICE rationale
                </p>
              </div>
              <p className="text-[11.5px] leading-relaxed text-slate-600">
                {rationale}
              </p>
              <p className="mt-2 border-t border-kpmg-violet/15 pt-2 text-[11px] leading-relaxed text-slate-500">
                <span className="font-semibold text-slate-600">Playbook: </span>
                {persona.playbook}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
