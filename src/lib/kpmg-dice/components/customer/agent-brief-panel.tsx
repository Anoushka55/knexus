'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Link2, Loader2, TriangleAlert } from 'lucide-react'

import { Card } from '@/lib/kpmg-dice/components/ui/card'
import { CHAINS } from '@/lib/kpmg-dice/lib/agents/chains'
import { AGENTS_BY_ID } from '@/lib/kpmg-dice/lib/agents/registry'
import { runChain, type ChainRunResult } from '@/lib/kpmg-dice/lib/agents/runtime'
import { useAgentContext } from '@/lib/kpmg-dice/lib/agents/use-agent-context'

/**
 * What the agents concluded about this customer.
 *
 * The full trace lives on /agent-chain. This is the condensed read for the
 * place a rep actually opens the customer, and it links through rather than
 * re-rendering the trace — two components drawing the same thing drift, and the
 * one nobody is looking at drifts first.
 *
 * The chain is chosen by which one actually fires for this customer rather than
 * fixed, so the panel reflects the record in front of it. Most customers have
 * one or two agents with something to say; a customer with none says so.
 */
export function AgentBriefPanel({ leadId }: { leadId: string }) {
  const ctx = useAgentContext()
  const [best, setBest] = useState<{ run: ChainRunResult; name: string } | null>(
    null,
  )
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    let cancelled = false
    setBusy(true)

    // Try every chain and keep the one that gets furthest on this customer.
    Promise.all(
      CHAINS.map(async (c) => ({
        name: c.name,
        run: await runChain(c.id, leadId, ctx),
      })),
    )
      .then((results) => {
        if (cancelled) return
        const scored = results
          .map((r) => ({
            ...r,
            concluded: r.run.steps.filter((s) => s.status === 'concluded').length,
          }))
          .sort(
            (a, b) =>
              b.run.conflicts.length - a.run.conflicts.length ||
              b.run.handoffs - a.run.handoffs ||
              b.concluded - a.concluded,
          )
        const top = scored[0]
        setBest(top && top.concluded > 0 ? { run: top.run, name: top.name } : null)
      })
      .finally(() => !cancelled && setBusy(false))

    return () => {
      cancelled = true
    }
  }, [leadId, ctx])

  if (busy) {
    return (
      <Card className="flex items-center gap-2 p-5 text-[12.5px] text-slate-500">
        <Loader2 className="size-3.5 animate-spin" />
        Running the agent chains for this customer…
      </Card>
    )
  }

  /* No chain fired. Common, and not a failure — say it rather than render blank. */
  if (!best) {
    return (
      <Card className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Agent analysis
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
          No agent chain reaches this customer yet — their record does not carry
          the tickets, scores or stalled activity the chains look for. That is a
          property of the record, not a gap in the analysis.
        </p>
        <Link
          href="/agents/kpmg-dice/console/agent-chain"
          className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-kpmg-blue hover:underline"
        >
          See how the chains work
          <ArrowRight className="size-3.5" />
        </Link>
      </Card>
    )
  }

  const { run, name } = best
  const concluded = run.steps.filter((s) => s.status === 'concluded')

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-kpmg-violet">
          Agent analysis · {name}
        </p>
        <Link
          href="/agents/kpmg-dice/console/agent-chain"
          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-kpmg-blue hover:underline"
        >
          Full trace
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-600">
        {concluded.length} agent{concluded.length === 1 ? '' : 's'} contributed
        {run.handoffs > 0
          ? `, and ${run.handoffs} conclusion${run.handoffs === 1 ? ' was' : 's were'} carried forward rather than re-derived.`
          : ', each reaching its conclusion independently.'}
      </p>

      <ul className="mt-3 space-y-1.5">
        {concluded.map((step) => (
          <li key={step.agentId} className="flex gap-2">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-kpmg-violet/50" />
            <span className="min-w-0">
              <span className="text-[12px] font-semibold text-slate-800">
                {step.agentName.replace(' Agent', '')}
              </span>
              <span className="block text-[11.5px] leading-snug text-slate-500">
                {step.findings[0]?.headline}
              </span>
              {step.cited && (
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-kpmg-violet">
                  <Link2 className="size-3" />
                  cites {step.cited.agentName.replace(' Agent', '')}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {run.conflicts.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            <TriangleAlert className="size-3" strokeWidth={2.4} />
            Agents disagree
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-slate-600">
            {run.conflicts[0].summary}
          </p>
        </div>
      )}

      {run.plans.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Proposed · not written
          </p>
          <ul className="mt-1.5 space-y-1">
            {run.plans.map((p) => (
              <li key={p.id} className="text-[11.5px] leading-snug text-slate-600">
                {p.label}
                <span className="text-slate-400">
                  {' · '}
                  {AGENTS_BY_ID[p.agentId]?.name.replace(' Agent', '')}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Commit these from the Agent Chain screen — nothing here writes.
          </p>
        </div>
      )}
    </Card>
  )
}
