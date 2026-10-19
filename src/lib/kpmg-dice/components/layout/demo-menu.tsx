'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  CircleCheck,
  Database,
  Gauge,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  UserRound,
  Workflow,
  Zap,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/lib/kpmg-dice/components/ui/dropdown-menu'
import { useHeroLead } from '@/lib/kpmg-dice/lib/selectors/use-overview-data'
import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { useSettingsStore } from '@/lib/kpmg-dice/store/settings-store'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Presenter controls: reset the dataset, jump straight to a demo beat, and
 * switch the AI service between mock and live.
 */
export function DemoMenu() {
  const router = useRouter()
  // The snapshot's own choice, so the menu never offers a lead the book lost.
  const hero = useHeroLead()
  const resetDemoData = useCrmStore((s) => s.resetDemoData)
  const activityCount = useCrmStore((s) => s.activities.length)

  const dataSource = useSettingsStore((s) => s.dataSource)
  const setDataSource = useSettingsStore((s) => s.setDataSource)
  const setFeedbackSource = useCrmStore((s) => s.setFeedbackSource)
  const shuffleFeedback = useCrmStore((s) => s.shuffleFeedback)
  const feedbackVariant = useCrmStore((s) => s.feedbackVariant)

  const aiMode = useSettingsStore((s) => s.aiMode)
  const setAiMode = useSettingsStore((s) => s.setAiMode)
  const liveAvailable = useSettingsStore((s) => s.liveAvailable)
  const probe = useSettingsStore((s) => s.probeLiveAvailability)

  const leads = useCrmStore((s) => s.leads)
  const ingestedLeadIds = useCrmStore((s) => s.ingestedLeadIds)
  const ingestSanitizedData = useCrmStore((s) => s.ingestSanitizedData)

  const [justReset, setJustReset] = useState(false)
  const [justIngested, setJustIngested] = useState(0)

  /*
   * One EAI batch.
   *
   * The store already had ingestSanitizedData and the activity-feed entry that
   * goes with it, but nothing ever called them — the ingestion story was
   * visible on the architecture diagram and unreachable in the product. This
   * gives it the entry point it was missing.
   *
   * Ingested leads become eligible for DICE reasoning, so a batch genuinely
   * changes what Next Best Action has to work with rather than only writing a
   * log line.
   */
  const INGEST_BATCH = 1000
  const ingestedSet = new Set(ingestedLeadIds)
  const pending = leads.filter((l) => !ingestedSet.has(l.id))

  function handleIngest() {
    const batch = pending.slice(0, INGEST_BATCH).map((l) => l.id)
    if (!batch.length) return
    ingestSanitizedData(batch)
    setJustIngested(batch.length)
    setTimeout(() => setJustIngested(0), 2400)
  }

  // Ask the server once whether a key is configured.
  useEffect(() => {
    void probe()
  }, [probe])

  function handleReset() {
    // Restore the feed that is actually selected, not always the example one.
    resetDemoData(dataSource)
    setJustReset(true)
    setTimeout(() => setJustReset(false), 1800)
  }

  return (
    <div className="flex items-center gap-2">
      {activityCount > 0 && (
        <span className="rounded-full bg-kpmg-teal/10 px-2 py-0.5 text-[11px] font-semibold text-kpmg-teal">
          {activityCount} CRM write{activityCount === 1 ? '' : 's'}
        </span>
      )}

      {feedbackVariant > 0 && (
        <span
          title="Feedback data has been re-rolled. Reset returns to the canonical book."
          className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
        >
          Variant {feedbackVariant}
        </span>
      )}

      {justIngested > 0 && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-kpmg-teal">
          <CircleCheck className="size-3" />
          {formatNumber(justIngested)} records ingested
        </span>
      )}

      {justReset && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-dice-status-success">
          <CircleCheck className="size-3" />
          Demo data reset
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium outline-none transition-colors',
            'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            'focus-visible:ring-2 focus-visible:ring-kpmg-blue/30',
          )}
        >
          <Sparkles className="size-3.5" />
          Demo
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[264px]">
          <DropdownMenuLabel>Run the story</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push('/agents/kpmg-dice/console/live-transcript')}>
            <Play />
            Play the hot-lead transcript
          </DropdownMenuItem>
          {hero ? (
            <DropdownMenuItem
              onClick={() => router.push(`/agents/kpmg-dice/console/customers/${hero.lead.id}`)}
            >
              <UserRound />
              Jump to {hero.lead.name}&apos;s 360
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => router.push('/agents/kpmg-dice/console/ai-insights')}>
            <Zap />
            Open the agent gallery
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push('/agents/kpmg-dice/console/csat-nps/detractor-recovery')}
          >
            <Gauge />
            Run the CSAT story
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/agents/kpmg-dice/console/platform')}>
            <Workflow />
            Show the architecture
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Data source</DropdownMenuLabel>
          <div className="px-1.5 pb-1">
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              {(
                [
                  { key: 'example' as const, label: 'Example' },
                  { key: 'client' as const, label: 'Client' },
                ]
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setDataSource(option.key)
                    // Regenerate the feedback book so the switch actually
                    // changes the figures rather than only the label.
                    setFeedbackSource(option.key)
                  }}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1 text-[11.5px] font-semibold transition-colors',
                    dataSource === option.key
                      ? 'bg-kpmg-navy text-white'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 px-1 text-[10.5px] leading-snug text-slate-400">
              {dataSource === 'client'
                ? 'Reading the connected org feed. Every figure on every screen reloads.'
                : 'Reading the example book. Switch to compare the same screens against a different feed.'}
            </p>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Data ingestion</DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={(e) => {
              // onSelect, not onClick: Radix closes the menu on select, so
              // preventing the click does nothing. Kept open on purpose — the
              // count updates in place, and a menu that vanishes on the batch
              // looks like nothing happened.
              e.preventDefault()
              handleIngest()
            }}
            disabled={pending.length === 0}
          >
            <Database />
            {pending.length === 0
              ? 'All records ingested'
              : `Ingest new data (${formatNumber(Math.min(INGEST_BATCH, pending.length))} records)`}
          </DropdownMenuItem>
          <p className="px-2 pb-1.5 pt-0.5 text-[10.5px] leading-snug text-slate-400">
            {formatNumber(ingestedLeadIds.length)} of {formatNumber(leads.length)}{' '}
            records cleaned and written to Salesforce through the EAI layer. Each
            batch is logged to the CRM activity feed, and ingested records become
            eligible for DICE reasoning.
          </p>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>AI mode</DropdownMenuLabel>
          <div className="px-1.5 pb-1">
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              {(['mock', 'live'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAiMode(mode)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1 text-[11.5px] font-semibold capitalize transition-colors',
                    aiMode === mode
                      ? 'bg-kpmg-navy text-white'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="mt-1.5 px-1 text-[10.5px] leading-snug text-slate-400">
              {aiMode === 'live'
                ? 'Reasoning runs through the model route. Narrative varies; the underlying figures never do.'
                : 'Deterministic narrative. Identical wording on every run.'}
            </p>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => shuffleFeedback(dataSource)}>
            <Shuffle />
            Shuffle feedback data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleReset}>
            <RotateCcw />
            Reset demo data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
