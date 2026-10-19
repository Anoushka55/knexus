'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  CircleCheck,
  ClipboardPlus,
  Flag,
  Loader2,
  PhoneCall,
  Send,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import { AttachmentView } from './attachment-view'
import { Button } from '@/lib/kpmg-dice/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { executeWrite, useAgentContext, type AgentContext } from '@/lib/kpmg-dice/lib/agents'
import { CURRENT_USER } from '@/lib/kpmg-dice/config/brand'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import type { CopilotAction, CopilotMessage, CopilotReply } from '@/lib/kpmg-dice/lib/copilot/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const ACTION_ICONS: Record<CopilotAction['icon'], LucideIcon> = {
  task: ClipboardPlus,
  flag: Flag,
  message: Send,
  suppress: ShieldAlert,
  callback: PhoneCall,
}

let messageSeq = 0
const nextId = () => `msg-${++messageSeq}`

/**
 * Shared chat surface for all three copilots.
 *
 * The copilot proposes; the user commits. Actions render as buttons carrying the
 * exact CRM effect, and only write when clicked.
 */
export function ChatShell({
  title,
  subtitle,
  greeting,
  chips,
  resolve,
  accent = 'text-kpmg-violet',
}: {
  title: string
  subtitle: string
  greeting: string
  chips: string[]
  resolve: (query: string, ctx: AgentContext) => Promise<CopilotReply>
  accent?: string
}) {
  const ctx = useAgentContext()
  const activities = useCrmStore((s) => s.activities)

  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const ask = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (!trimmed || busy) return

      setInput('')
      setBusy(true)

      const pendingId = nextId()
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'user', text: trimmed },
        { id: pendingId, role: 'assistant', text: '', pending: true },
      ])

      try {
        const reply = await resolve(trimmed, ctx)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  ...m,
                  pending: false,
                  text: reply.text,
                  attachment: reply.attachment,
                  actions: reply.actions,
                }
              : m,
          ),
        )
      } finally {
        setBusy(false)
      }
    },
    [busy, ctx, resolve],
  )

  /** Commits one action's CRM write, outside any state updater. */
  const runAction = useCallback((messageId: string, action: CopilotAction) => {
    const result = executeWrite(action.write)
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              executed: [...(m.executed ?? []), result],
              executedActionIds: [...(m.executedActionIds ?? []), action.id],
            }
          : m,
      ),
    )
  }, [])

  return (
    <div className="animate-fade-in grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="flex min-w-0 flex-col">
        <CardHeader className="border-b border-slate-100">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className={cn('size-4', accent)} />
              {title}
            </CardTitle>
            <p className="mt-0.5 text-[11.5px] text-slate-500">{subtitle}</p>
          </div>
          {activities.length > 0 && (
            <span className="shrink-0 rounded-full bg-kpmg-teal/10 px-2 py-0.5 text-[11px] font-semibold text-kpmg-teal">
              {activities.length} CRM write{activities.length === 1 ? '' : 's'}
            </span>
          )}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col p-0">
          {/* Transcript */}
          <div
            ref={scrollRef}
            className="scrollbar-slim h-[540px] space-y-4 overflow-y-auto p-5"
          >
            {/* Greeting */}
            <div className="flex gap-3">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-lg bg-kpmg-violet/10',
                )}
              >
                <Sparkles className="size-3.5 text-kpmg-violet" />
              </span>
              <p className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-700">
                {greeting}
              </p>
            </div>

            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end gap-3">
                  <p className="max-w-[80%] rounded-2xl rounded-tr-sm bg-kpmg-blue px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white">
                    {msg.text}
                  </p>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-kpmg-navy text-[10px] font-bold text-white">
                    {CURRENT_USER.initials}
                  </span>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-kpmg-violet/10">
                    <Sparkles className="size-3.5 text-kpmg-violet" />
                  </span>

                  <div className="min-w-0 max-w-[86%] flex-1">
                    {msg.pending ? (
                      <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2.5 text-[12.5px] text-slate-500">
                        <Loader2 className="size-3.5 animate-spin" />
                        Thinking…
                      </div>
                    ) : (
                      <>
                        <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2.5">
                          <p className="text-[12.5px] leading-relaxed text-slate-700">
                            {renderEmphasis(msg.text)}
                          </p>
                        </div>

                        {msg.attachment && (
                          <AttachmentView attachment={msg.attachment} />
                        )}

                        {!!msg.actions?.length && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {msg.actions.map((action) => {
                              const done = msg.executedActionIds?.includes(
                                action.id,
                              )
                              const Icon = done
                                ? CircleCheck
                                : ACTION_ICONS[action.icon]
                              return (
                                <button
                                  key={action.id}
                                  type="button"
                                  onClick={() => runAction(msg.id, action)}
                                  disabled={done}
                                  title={action.crmEffect}
                                  className={cn(
                                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors',
                                    done
                                      ? 'cursor-default border-status-success/30 bg-emerald-50 text-emerald-700'
                                      : 'border-kpmg-blue/30 text-kpmg-blue hover:bg-kpmg-blue/[0.06]',
                                  )}
                                >
                                  <Icon className="size-3.5" />
                                  {action.label}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {!!msg.executed?.length && (
                          <ul className="mt-2 space-y-1 rounded-lg bg-emerald-50 px-2.5 py-2">
                            {msg.executed.map((r, i) => (
                              <li
                                key={`${r}-${i}`}
                                className="flex items-start gap-1.5"
                              >
                                <CircleCheck
                                  className="mt-[2px] size-3.5 shrink-0 text-status-success"
                                  strokeWidth={2.4}
                                />
                                <span className="text-[11px] leading-snug text-emerald-800">
                                  Written to CRM — {r}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-slate-100 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                ask(input)
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your pipeline…"
                aria-label="Ask the copilot"
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kpmg-blue focus:bg-white"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !input.trim()}
                className="size-10 shrink-0 rounded-xl"
                aria-label="Send"
              >
                {busy ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ArrowUp strokeWidth={2.5} />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Suggested prompts */}
      <div className="min-w-0 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Try asking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => ask(chip)}
                disabled={busy}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-left text-[12px] leading-snug text-slate-600 transition-colors hover:border-kpmg-blue/40 hover:bg-kpmg-blue/[0.04] hover:text-kpmg-navy disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How this works</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11.5px] leading-relaxed text-slate-500">
              Answers are grounded in the live CRM store — the same{' '}
              {ctx.leads.length.toLocaleString('en-IN')} leads the dashboards
              read. Actions are proposed, never written silently: each button
              shows the exact Salesforce effect before you click, and the result
              appears in the activity feed and on the customer&apos;s 360.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/** Renders **bold** spans without pulling in a markdown dependency. */
function renderEmphasis(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold text-slate-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  )
}
