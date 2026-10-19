'use client'

import { Database, Terminal } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const SOURCE_TONE: Record<string, string> = {
  DICE: 'bg-kpmg-violet/10 text-kpmg-violet',
  Agentforce: 'bg-sky-50 text-sky-700',
  Rep: 'bg-slate-100 text-slate-600',
  'EAI Ingestion': 'bg-kpmg-teal/10 text-kpmg-teal',
}

/**
 * Live view of the simulated Salesforce activity feed. Every agent write lands
 * here, which is the proof that "run agent" changed the CRM rather than just
 * printing a suggestion.
 */
export function AgentConsole() {
  const activities = useCrmStore((s) => s.activities)
  const tasks = useCrmStore((s) => s.tasks)
  const diceTasks = tasks.filter((t) => t.createdBy === 'DICE').length

  return (
    <Card className="flex max-h-[calc(100vh-190px)] flex-col xl:sticky xl:top-0">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Terminal className="size-4 text-kpmg-violet" />
          CRM Activity Feed
        </CardTitle>
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <Database className="size-3.5" />
          {activities.length} write{activities.length === 1 ? '' : 's'}
          {diceTasks > 0 && ` · ${diceTasks} task${diceTasks === 1 ? '' : 's'}`}
        </div>
      </CardHeader>

      <CardContent className="scrollbar-slim flex-1 overflow-y-auto p-0">
        {activities.length === 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100">
              <Database className="size-5 text-slate-400" />
            </div>
            <p className="text-[13px] font-semibold text-slate-600">
              No writes yet
            </p>
            <p className="max-w-[220px] text-[11.5px] leading-relaxed text-slate-400">
              Run an agent and apply its actions — every Salesforce write shows
              up here with the fields it changed.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activities.slice(0, 40).map((activity) => (
              <li key={activity.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12.5px] font-semibold leading-snug text-slate-900">
                    {activity.action}
                  </p>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      SOURCE_TONE[activity.source] ?? 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {activity.source}
                  </span>
                </div>

                <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">
                  {activity.detail}
                </p>

                <p className="mt-1 text-[10.5px] font-medium text-slate-400">
                  {activity.object} · {activity.recordName}
                </p>

                {!!activity.changes?.length && (
                  <ul className="mt-1.5 space-y-0.5 rounded-md bg-slate-50 px-2 py-1.5">
                    {activity.changes.map((change) => (
                      <li
                        key={change.field}
                        className="flex items-center gap-1.5 text-[10.5px]"
                      >
                        <span className="font-semibold text-slate-500">
                          {change.field}
                        </span>
                        <span className="truncate text-slate-400 line-through">
                          {change.before}
                        </span>
                        <span className="text-slate-300">→</span>
                        <span className="truncate font-semibold text-kpmg-teal">
                          {change.after}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
