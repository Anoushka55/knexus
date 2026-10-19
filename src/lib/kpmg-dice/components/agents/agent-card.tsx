'use client'

import {
  AlertTriangle,
  CircleCheck,
  Lightbulb,
  Loader2,
  Play,
  Zap,
} from 'lucide-react'

import { Badge } from '@/lib/kpmg-dice/components/ui/badge'
import { Button } from '@/lib/kpmg-dice/components/ui/button'
import { Card, CardContent } from '@/lib/kpmg-dice/components/ui/card'
import type { Agent, AgentRunResult } from '@/lib/kpmg-dice/lib/agents'
import type { Severity } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const SEVERITY_TONE: Record<Severity, string> = {
  critical: 'text-dice-status-danger',
  high: 'text-amber-600',
  medium: 'text-amber-600',
  info: 'text-kpmg-lightblue',
}

const PRIORITY_VARIANT = {
  High: 'danger',
  Medium: 'warning',
  Low: 'secondary',
} as const

/** The four-column story every agent tells: scenario → issue → solution → CRM. */
function StoryRow({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: typeof Zap
  tone: string
}) {
  return (
    <div className="flex gap-2.5">
      <Icon className={cn('mt-0.5 size-3.5 shrink-0', tone)} strokeWidth={2.2} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-slate-600">{value}</p>
      </div>
    </div>
  )
}

export function AgentCard({
  agent,
  result,
  running,
  onRun,
  onExecuteAll,
}: {
  agent: Agent
  result?: AgentRunResult
  running: boolean
  onRun: () => void
  onExecuteAll: () => void
}) {
  const executed = result?.actions.every((a) => a.status === 'executed')

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Identity */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold leading-snug tracking-[-0.01em] text-slate-900">
              {agent.name}
            </h3>
            <p className="mt-1 text-[11.5px] leading-snug text-slate-500">
              {agent.description}
            </p>
          </div>
          <Badge variant={PRIORITY_VARIANT[agent.priority]} className="shrink-0">
            {agent.priority}
          </Badge>
        </div>

        {/* Scenario → CRM action */}
        <div className="space-y-2.5 rounded-lg bg-slate-50/80 p-3">
          <StoryRow
            label="Scenario"
            value={agent.scenario}
            icon={Lightbulb}
            tone="text-kpmg-blue"
          />
          <StoryRow
            label="Current issue"
            value={agent.currentIssue}
            icon={AlertTriangle}
            tone="text-dice-status-danger"
          />
          <StoryRow
            label="AI solution"
            value={agent.aiSolution}
            icon={Zap}
            tone="text-kpmg-violet"
          />
          <StoryRow
            label="Action on CRM"
            value={agent.crmAction}
            icon={CircleCheck}
            tone="text-kpmg-teal"
          />
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {result.totalFindings} finding
                {result.totalFindings === 1 ? '' : 's'}
              </p>
              {result.actions.length > 0 && (
                <button
                  type="button"
                  onClick={onExecuteAll}
                  disabled={executed}
                  className={cn(
                    'text-[11.5px] font-semibold transition-colors',
                    executed
                      ? 'cursor-default text-dice-status-success'
                      : 'text-kpmg-blue hover:text-kpmg-navy',
                  )}
                >
                  {executed
                    ? '✓ Written to CRM'
                    : `Apply ${result.actions.length} action${result.actions.length === 1 ? '' : 's'} →`}
                </button>
              )}
            </div>

            <p className="mt-1.5 text-[11.5px] italic leading-snug text-slate-500">
              {result.summary}
            </p>

            <ul className="mt-2 space-y-1.5">
              {result.findings.slice(0, 3).map((f) => (
                <li key={f.id} className="flex gap-2">
                  <span
                    className={cn(
                      'mt-[5px] size-1.5 shrink-0 rounded-full bg-current',
                      SEVERITY_TONE[f.severity],
                    )}
                  />
                  <span className="min-w-0 text-[11.5px] leading-snug text-slate-700">
                    {f.headline}
                  </span>
                </li>
              ))}
              {result.totalFindings > 3 && (
                <li className="pl-3.5 text-[11px] text-slate-400">
                  and {result.totalFindings - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Run */}
        <div className="mt-auto pt-1">
          <Button
            size="sm"
            variant={result ? 'outline' : 'default'}
            onClick={onRun}
            disabled={running}
            className="w-full"
          >
            {running ? (
              <>
                <Loader2 className="animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                <Play />
                {result ? 'Run again' : 'Run agent'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
