'use client'

import { useCallback, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

import { AgentCard } from './agent-card'
import { AgentConsole } from './agent-console'
import { Button } from '@/lib/kpmg-dice/components/ui/button'
import {
  AGENTS,
  ARCHETYPE_META,
  executeAction,
  runAgent,
  totalExposureCr,
  useAgentContext,
  type AgentArchetype,
  type AgentRunResult,
} from '@/lib/kpmg-dice/lib/agents'
import { formatCrore } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/** Archetype display order — highest-priority families first. */
const ARCHETYPE_ORDER: AgentArchetype[] = [
  'pattern-identifier',
  'predictive-algorithm',
  'information-extractor',
  'digital-assistant',
  'content-generator',
  'language-translator',
  'code-generator',
]

export function AgentsGallery() {
  const ctx = useAgentContext()
  const [results, setResults] = useState<Record<string, AgentRunResult>>({})
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [runningAll, setRunningAll] = useState(false)

  const run = useCallback(
    async (agentId: string) => {
      const agent = AGENTS.find((a) => a.id === agentId)
      if (!agent) return

      setRunning((r) => ({ ...r, [agentId]: true }))
      try {
        const result = await runAgent(agent, ctx)
        setResults((r) => ({ ...r, [agentId]: result }))
      } finally {
        setRunning((r) => ({ ...r, [agentId]: false }))
      }
    },
    [ctx],
  )

  const runAll = useCallback(async () => {
    setRunningAll(true)
    try {
      // Sequential so the console reads as a narrative rather than a burst.
      for (const agent of AGENTS) {
        setRunning((r) => ({ ...r, [agent.id]: true }))
        const result = await runAgent(agent, ctx)
        setResults((r) => ({ ...r, [agent.id]: result }))
        setRunning((r) => ({ ...r, [agent.id]: false }))
      }
    } finally {
      setRunningAll(false)
    }
  }, [ctx])

  const executeAll = useCallback(
    (agentId: string, result: AgentRunResult | undefined) => {
      if (!result) return

      // The CRM writes must happen outside the state updater — they call into
      // the Zustand store, and a setState from inside a render pass warns about
      // updating another component mid-render.
      for (const action of result.actions) {
        if (action.status === 'executed') continue
        executeAction(action)
      }

      setResults((prev) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          actions: prev[agentId].actions.map((a) => ({
            ...a,
            status: 'executed' as const,
          })),
        },
      }))
    },
    [],
  )

  const grouped = ARCHETYPE_ORDER.map((archetype) => ({
    archetype,
    meta: ARCHETYPE_META[archetype],
    agents: AGENTS.filter((a) => a.archetype === archetype),
  })).filter((group) => group.agents.length > 0)

  const exposure = totalExposureCr(ctx)
  const findingsCount = Object.values(results).reduce(
    (sum, r) => sum + r.totalFindings,
    0,
  )

  return (
    <div className="animate-fade-in grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        {/* Header strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-rail-800 p-5 text-white shadow-card">
          <div className="min-w-0">
            <h2 className="text-[19px] font-bold tracking-[-0.01em]">
              DICE Agent Layer
            </h2>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-white/60">
              {AGENTS.length} agents watching{' '}
              {ctx.leads.length.toLocaleString('en-IN')} leads, grouped by KPMG
              AI archetype. Each one detects a specific CRM failure and writes
              the fix back into Salesforce.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                Exposure detected
              </p>
              <p className="text-[19px] font-bold">{formatCrore(exposure)}</p>
            </div>
            {findingsCount > 0 && (
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  Findings
                </p>
                <p className="text-[19px] font-bold">{findingsCount}</p>
              </div>
            )}
            <Button
              variant="brand"
              onClick={runAll}
              disabled={runningAll}
              className="shrink-0"
            >
              {runningAll ? (
                <>
                  <Loader2 className="animate-spin" />
                  Running all…
                </>
              ) : (
                <>
                  <Sparkles />
                  Run all agents
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Grouped agent cards */}
        {grouped.map(({ archetype, meta, agents }) => (
          <section key={archetype}>
            <div className="mb-2.5 flex items-baseline gap-3">
              <h3
                className={cn(
                  'text-[13px] font-bold uppercase tracking-wider',
                  meta.accent,
                )}
              >
                {meta.label}
              </h3>
              <p className="min-w-0 truncate text-[11.5px] text-slate-400">
                {meta.blurb}
              </p>
              <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-500">
                {meta.priority} priority
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  result={results[agent.id]}
                  running={!!running[agent.id]}
                  onRun={() => run(agent.id)}
                  onExecuteAll={() => executeAll(agent.id, results[agent.id])}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="min-w-0">
        <AgentConsole />
      </div>
    </div>
  )
}
