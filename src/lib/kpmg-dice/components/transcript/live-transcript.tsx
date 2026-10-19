'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  CircleCheck,
  Gauge,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  Zap,
} from 'lucide-react'

import { SentimentArc } from './sentiment-arc'
import { Button } from '@/lib/kpmg-dice/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { ScorePill } from '@/lib/kpmg-dice/components/shared/score-pill'
import { useTranscriptPlayer, type FiredAction } from '@/lib/kpmg-dice/lib/transcript/use-transcript-player'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore } from '@/lib/kpmg-dice/lib/format'
import type { Severity } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const SPEEDS = [1, 2, 4] as const

const SCENARIO_LABEL: Record<string, string> = {
  dnd: 'Opt-out call',
  deferred: 'Deferred decision',
  'hot-intent': 'Hot-intent buyer',
}

const SEVERITY_STYLE: Record<Severity, { ring: string; text: string; bg: string }> = {
  critical: { ring: 'border-status-danger/30', text: 'text-status-danger', bg: 'bg-red-50' },
  high: { ring: 'border-amber-300/50', text: 'text-amber-700', bg: 'bg-amber-50' },
  medium: { ring: 'border-kpmg-blue/25', text: 'text-kpmg-blue', bg: 'bg-sky-50' },
  info: { ring: 'border-slate-200', text: 'text-slate-600', bg: 'bg-slate-50' },
}

function formatClock(seconds: number) {
  const s = Math.floor(seconds)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function ActionCard({ action }: { action: FiredAction }) {
  const style = SEVERITY_STYLE[action.severity]
  return (
    <li
      className={cn(
        'animate-fade-in rounded-lg border p-3',
        style.ring,
        style.bg,
      )}
    >
      <div className="flex items-start gap-2">
        <Zap className={cn('mt-0.5 size-3.5 shrink-0', style.text)} strokeWidth={2.4} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-[12px] font-bold leading-snug', style.text)}>
            Detected: {action.detected}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-slate-600">
            {action.action}
          </p>
          <p className="mt-1 text-[10.5px] font-medium text-slate-400">
            {action.agentName} · at {formatClock(action.atSecond)}
          </p>

          <ul className="mt-1.5 space-y-0.5 rounded-md bg-white/70 px-2 py-1.5">
            {action.results.map((r) => (
              <li key={r} className="flex items-start gap-1.5">
                <CircleCheck className="mt-[3px] size-3 shrink-0 text-kpmg-teal" strokeWidth={2.4} />
                <span className="text-[10.5px] leading-snug text-slate-600">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  )
}

export function LiveTranscript() {
  const transcripts = useCrmStore((s) => s.transcripts)
  const [selectedId, setSelectedId] = useState(transcripts[0]?.id ?? '')

  const transcript = useMemo(
    () => transcripts.find((t) => t.id === selectedId) ?? transcripts[0],
    [transcripts, selectedId],
  )

  const player = useTranscriptPlayer(transcript)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the newest line in view as the call streams.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [player.revealed.length])

  /*
   * Transcripts are the one record type the seeded book supplies entirely from
   * the authored set, so a replace-import that carried no transcripts CSV
   * empties this screen. Legitimate — but it has to say so, not render nothing.
   */
  if (!transcript) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-[13px] font-semibold text-slate-700">
            No call recordings in this book
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            Import a transcripts file to replay a call here, or reset to the
            example data.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { lead, analysis } = player

  return (
    <div className="animate-fade-in space-y-4">
      {/* ---------- Call selector + controls ---------- */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {transcripts.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition-colors',
                  t.id === transcript.id
                    ? 'border-kpmg-blue bg-kpmg-blue/[0.06]'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <span
                  className={cn(
                    'block text-[10px] font-bold uppercase tracking-wider',
                    t.id === transcript.id ? 'text-kpmg-blue' : 'text-slate-400',
                  )}
                >
                  {SCENARIO_LABEL[t.scenario]}
                </span>
                <span className="block text-[12.5px] font-semibold text-slate-800">
                  {t.title}
                </span>
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={player.playing ? player.pause : player.play}
              className="w-[92px]"
            >
              {player.playing ? <Pause /> : <Play />}
              {player.playing ? 'Pause' : player.elapsed > 0 ? 'Resume' : 'Play'}
            </Button>
            <Button size="sm" variant="outline" onClick={player.restart}>
              <RotateCcw />
              Restart
            </Button>

            <div className="flex rounded-lg border border-slate-200 p-0.5">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => player.setSpeed(s)}
                  aria-pressed={player.speed === s}
                  className={cn(
                    'rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
                    player.speed === s
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-400 hover:text-slate-700',
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>

            <span className="nums w-[86px] text-right text-[12px] font-medium text-slate-500">
              {formatClock(player.elapsed)} / {formatClock(player.duration)}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-kpmg-blue transition-[width] duration-200 ease-linear"
            style={{ width: `${player.progressPct}%` }}
          />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        {/* ---------- Transcript ---------- */}
        <Card className="flex flex-col">
          <CardHeader className="border-b border-slate-100">
            <div className="flex min-w-0 items-center gap-2.5">
              {lead && <InitialsAvatar name={lead.name} className="size-8" />}
              <div className="min-w-0">
                <CardTitle className="truncate">
                  {lead?.name ?? transcript.title}
                </CardTitle>
                <p className="truncate text-[11.5px] text-slate-500">
                  Rep: {transcript.repName}
                  {lead && ` · ${lead.id} · ${formatCrore(lead.budgetCr, { decimals: 1 })}`}
                </p>
              </div>
            </div>
            {player.playing && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2 py-1 text-[10.5px] font-bold text-status-danger">
                <span className="size-1.5 animate-pulse rounded-full bg-status-danger" />
                LIVE
              </span>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div
              ref={scrollRef}
              className="scrollbar-slim h-[480px] space-y-3 overflow-y-auto p-5"
            >
              {player.revealed.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100">
                    <Play className="size-5 text-slate-400" />
                  </div>
                  <p className="text-[13px] font-semibold text-slate-600">
                    Press Play to start the call
                  </p>
                  <p className="max-w-[260px] text-[11.5px] leading-relaxed text-slate-400">
                    DICE analyses each line as it arrives and writes to Salesforce
                    the moment intent is detected.
                  </p>
                </div>
              )}

              {player.revealed.map((line, i) => (
                <div
                  key={`${line.atSecond}-${i}`}
                  className={cn(
                    'flex animate-fade-in',
                    line.speaker === 'rep' ? 'justify-start' : 'justify-end',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2.5',
                      line.speaker === 'rep'
                        ? 'rounded-tl-sm bg-slate-100 text-slate-700'
                        : 'rounded-tr-sm bg-kpmg-blue text-white',
                    )}
                  >
                    <p
                      className={cn(
                        'mb-0.5 text-[10px] font-bold uppercase tracking-wider',
                        line.speaker === 'rep' ? 'text-slate-400' : 'text-white/60',
                      )}
                    >
                      {line.speaker === 'rep' ? transcript.repName : lead?.name ?? 'Customer'}
                      {' · '}
                      {formatClock(line.atSecond)}
                    </p>
                    <p className="text-[12.5px] leading-relaxed">{line.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ---------- AI analysis ---------- */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4 text-kpmg-violet" />
                Live AI Analysis
              </CardTitle>
              <span className="shrink-0 text-[11px] font-medium text-slate-400">
                {analysis.customerLineCount} customer line
                {analysis.customerLineCount === 1 ? '' : 's'}
              </span>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Intent + confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Detected intent
                  </p>
                  <p className="mt-1 text-[13.5px] font-bold text-slate-900">
                    {analysis.customerLineCount ? analysis.intentLabel : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="size-3 text-slate-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Confidence
                    </p>
                  </div>
                  <p className="nums mt-1 text-[13.5px] font-bold text-slate-900">
                    {analysis.confidence}%
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-kpmg-blue/15">
                    <div
                      className="h-full rounded-full bg-kpmg-blue transition-[width] duration-300"
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sentiment arc */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Rolling sentiment
                  </p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10.5px] font-bold capitalize',
                      analysis.sentiment === 'positive'
                        ? 'bg-emerald-50 text-emerald-700'
                        : analysis.sentiment === 'negative'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {analysis.sentiment} ({analysis.sentimentScore > 0 ? '+' : ''}
                    {analysis.sentimentScore.toFixed(2)})
                  </span>
                </div>
                <SentimentArc points={analysis.arc} />
              </div>

              {/* Entities */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Key entities extracted
                </p>
                {analysis.entities.length === 0 ? (
                  <p className="text-[11.5px] text-slate-400">
                    Nothing extracted yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.entities.map((e) => (
                      <span
                        key={`${e.label}-${e.value}`}
                        className="animate-fade-in rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px]"
                      >
                        <span className="font-semibold text-slate-400">
                          {e.label}:{' '}
                        </span>
                        <span className="font-semibold text-slate-800">{e.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions taken */}
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-4 text-kpmg-teal" />
                Actions on CRM
              </CardTitle>
              <span className="shrink-0 text-[11px] font-medium text-slate-400">
                {player.fired.length} fired
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {player.fired.length === 0 ? (
                <p className="py-6 text-center text-[11.5px] text-slate-400">
                  No thresholds crossed yet — DICE writes only when it has enough
                  evidence.
                </p>
              ) : (
                <ul className="space-y-2">
                  {player.fired.map((a) => (
                    <ActionCard key={a.triggerId} action={a} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---------- Call summary ---------- */}
      {(player.summarising || player.summary) && (
        <Card className="animate-fade-in overflow-hidden">
          <div className="border-b border-kpmg-violet/20 bg-kpmg-violet/[0.06] px-5 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-kpmg-violet" strokeWidth={2.2} />
              <h3 className="text-[14px] font-bold text-kpmg-violet">
                Call summary
              </h3>
              {player.summarising && (
                <Loader2 className="size-3.5 animate-spin text-kpmg-violet" />
              )}
            </div>
          </div>

          {player.summary && (
            <div className="grid gap-5 p-5 lg:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Outcome
                </p>
                <p className="mt-1 text-[13.5px] font-bold text-slate-900">
                  {player.summary.outcome}
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
                  {player.summary.narrative}
                </p>
                <p className="mt-2 text-[11.5px] text-slate-500">
                  <span className="font-semibold text-slate-600">
                    Sentiment arc:{' '}
                  </span>
                  {analysis.arc.length
                    ? `${analysis.arc[0].value.toFixed(2)} → ${analysis.arc[analysis.arc.length - 1].value.toFixed(2)}`
                    : '—'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Next best action
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700">
                  {player.summary.nextBestAction}
                </p>
                {lead && (
                  <Link
                    href={`/agents/kpmg-dice/console/customers/${lead.id}`}
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-kpmg-blue hover:text-kpmg-navy"
                  >
                    Open {lead.name}&apos;s Customer 360
                    <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  CRM fields updated
                </p>
                {player.summary.fieldChanges.length === 0 ? (
                  <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-slate-400">
                    <TriangleAlert className="size-3.5" />
                    No field changes were required.
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-1">
                    {player.summary.fieldChanges.map((c) => (
                      <li
                        key={c.field}
                        className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-[11px]"
                      >
                        <span className="font-semibold text-slate-500">
                          {c.field}
                        </span>
                        <span className="truncate text-slate-400 line-through">
                          {c.before}
                        </span>
                        <ArrowRight className="size-3 shrink-0 text-slate-300" />
                        <span className="truncate font-bold text-kpmg-teal">
                          {c.after}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
