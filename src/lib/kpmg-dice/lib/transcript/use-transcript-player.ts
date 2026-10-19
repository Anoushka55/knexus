'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { executeWrite } from '@/lib/kpmg-dice/lib/agents'
import { useAIService } from '@/lib/kpmg-dice/lib/ai/use-ai-service'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import type { Lead, Transcript } from '@/lib/kpmg-dice/types'
import { analyseRevealed, type LiveAnalysis } from './analysis'
import { LIVE_TRIGGERS, agentNameFor } from './triggers'

/** Virtual clock tick — 250ms of wall time per step, scaled by playback speed. */
const TICK_MS = 250

export interface FiredAction {
  triggerId: string
  agentId: string
  agentName: string
  detected: string
  action: string
  severity: 'critical' | 'high' | 'medium' | 'info'
  atSecond: number
  /** Human-readable results of the CRM writes that were committed. */
  results: string[]
}

export interface CallSummary {
  outcome: string
  narrative: string
  nextBestAction: string
  fieldChanges: { field: string; before: string; after: string }[]
}

export function useTranscriptPlayer(transcript: Transcript) {
  const leadsById = useCrmStore((s) => s.leadsById)
  const lead: Lead | undefined = leadsById[transcript.leadId]
  const ai = useAIService()

  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(2)
  const [fired, setFired] = useState<FiredAction[]>([])
  const [summary, setSummary] = useState<CallSummary | null>(null)
  const [summarising, setSummarising] = useState(false)

  const firedIds = useRef<Set<string>>(new Set())
  // Snapshot of the fields DICE touched, captured before the first write.
  const beforeSnapshot = useRef<Record<string, string> | null>(null)

  const duration = useMemo(
    () => transcript.lines[transcript.lines.length - 1].atSecond + 6,
    [transcript],
  )

  const revealed = useMemo(
    () => transcript.lines.filter((l) => l.atSecond <= elapsed),
    [transcript, elapsed],
  )

  const analysis: LiveAnalysis = useMemo(
    () => analyseRevealed(revealed),
    [revealed],
  )

  const ended = elapsed >= duration

  /* ---- reset when the selected call changes ---- */
  useEffect(() => {
    setElapsed(0)
    setPlaying(false)
    setFired([])
    setSummary(null)
    firedIds.current = new Set()
    beforeSnapshot.current = null
  }, [transcript.id])

  /* ---- the clock ---- */
  useEffect(() => {
    if (!playing) return
    const handle = setInterval(() => {
      setElapsed((t) => {
        const next = t + (TICK_MS / 1000) * speed
        if (next >= duration) {
          setPlaying(false)
          return duration
        }
        return next
      })
    }, TICK_MS)
    return () => clearInterval(handle)
  }, [playing, speed, duration])

  /* ---- fire triggers against newly revealed customer lines ---- */
  useEffect(() => {
    if (!lead) return

    for (const line of revealed) {
      if (line.speaker !== 'customer') continue

      for (const trigger of LIVE_TRIGGERS) {
        if (firedIds.current.has(trigger.id)) continue
        if (!trigger.pattern.test(line.text)) continue

        firedIds.current.add(trigger.id)

        // Capture the before-state once, ahead of any write.
        if (!beforeSnapshot.current) {
          beforeSnapshot.current = {
            'Lead Status': lead.crmStatus,
            Intent: lead.intent,
            'Evidence Check': lead.evidenceStatus,
            DND: String(lead.dnd),
          }
        }

        const results = trigger.writes(lead).map((write) => executeWrite(write))

        setFired((prev) => [
          ...prev,
          {
            triggerId: trigger.id,
            agentId: trigger.agentId,
            agentName: agentNameFor(trigger.agentId),
            detected: trigger.detected,
            action: trigger.action,
            severity: trigger.severity,
            atSecond: line.atSecond,
            results,
          },
        ])
      }
    }
  }, [revealed, lead])

  /* ---- closing summary, once the call ends ---- */
  useEffect(() => {
    if (!ended || summary || summarising || !lead) return
    if (analysis.customerLineCount === 0) return

    setSummarising(true)
    const customerText = revealed
      .filter((l) => l.speaker === 'customer')
      .map((l) => l.text)
      .join(' ')

    Promise.all([
      ai.summarize(customerText, { projectName: lead.preferredLocation }),
      ai.recommendNextBestAction({
        score: lead.score,
        dnd: lead.dnd,
        intent: lead.intent,
      }),
    ]).then(([summaryResult, nba]) => {
      const after: Record<string, string> = {
        'Lead Status': lead.crmStatus,
        Intent: lead.intent,
        'Evidence Check': lead.evidenceStatus,
        DND: String(lead.dnd),
      }
      const before = beforeSnapshot.current ?? after

      setSummary({
        outcome: summaryResult.headline,
        narrative: summaryResult.bullets.join(' · '),
        nextBestAction: `${nba.action} — ${nba.reason}`,
        fieldChanges: Object.keys(after)
          .filter((field) => before[field] !== after[field])
          .map((field) => ({
            field,
            before: before[field],
            after: after[field],
          })),
      })
      setSummarising(false)
    })
  }, [ended, summary, summarising, lead, analysis.customerLineCount, revealed, ai])

  const play = useCallback(() => {
    if (elapsed >= duration) setElapsed(0)
    setPlaying(true)
  }, [elapsed, duration])

  const pause = useCallback(() => setPlaying(false), [])

  const restart = useCallback(() => {
    setElapsed(0)
    setPlaying(true)
    setFired([])
    setSummary(null)
    firedIds.current = new Set()
    beforeSnapshot.current = null
  }, [])

  return {
    lead,
    elapsed,
    duration,
    playing,
    speed,
    setSpeed,
    revealed,
    analysis,
    fired,
    summary,
    summarising,
    ended,
    play,
    pause,
    restart,
    progressPct: Math.min(100, (elapsed / duration) * 100),
  }
}
