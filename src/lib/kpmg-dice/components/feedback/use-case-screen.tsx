'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

import { ComingSoon } from '@/lib/kpmg-dice/components/layout/coming-soon'
import { ControlTower } from './control-tower'
import { DetractorRecovery } from './detractor-recovery'
import { FeedbackJourney } from './feedback-journey'
import { NpsReporting } from './nps-reporting'
import { RootCause } from './root-cause'
import { SurveyOptimizer } from './survey-optimizer'
import { VocAnalyzer } from './voc-analyzer'
import {
  FEEDBACK_TYPE_META,
  USE_CASES,
  findUseCaseBySlug,
  type FeedbackType,
} from './use-cases'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Shell shared by every use-case screen.
 *
 * The segmented bar stays grouped by type rather than listing nine flat tabs,
 * so the Type 1 / Type 2 division survives navigation instead of only existing
 * on the hub.
 */

/** One entry per distinct route, in narrative order. */
const ROUTE_ORDER: { slug: string; label: string; type: FeedbackType }[] = [
  { slug: 'nps-reporting', label: 'Reporting', type: 'type-1' },
  { slug: 'survey-optimizer', label: 'Participation', type: 'type-2' },
  { slug: 'feedback-journey', label: 'Feedback Journey', type: 'type-2' },
  { slug: 'voc-analyzer', label: 'Voice of Customer', type: 'type-2' },
  { slug: 'root-cause', label: 'Root Cause', type: 'type-2' },
  { slug: 'detractor-recovery', label: 'Recovery', type: 'type-2' },
  { slug: 'control-tower', label: 'Control Tower', type: 'type-2' },
]

function SegmentedBar({ active }: { active: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-card">
      <Link
        href="/agents/kpmg-dice/console/csat-nps"
        className="mr-1 flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" />
        All nine
      </Link>

      {(['type-1', 'type-2'] as FeedbackType[]).map((type) => (
        <div key={type} className="flex items-center gap-1">
          {type === 'type-2' && (
            <span className="px-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              AI-Powered
            </span>
          )}
          {ROUTE_ORDER.filter((r) => r.type === type).map((route) => (
            <Link
              key={route.slug}
              href={`/agents/kpmg-dice/console/csat-nps/${route.slug}`}
              aria-current={route.slug === active ? 'page' : undefined}
              className={cn(
                'rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors',
                route.slug === active
                  ? 'bg-kpmg-navy text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
              )}
            >
              {route.label}
            </Link>
          ))}
        </div>
      ))}
    </div>
  )
}

export function UseCaseScreen({ slug }: { slug: string }) {
  const useCase = findUseCaseBySlug(slug)
  if (!useCase) return null

  // Type 1's three use cases share this route, so the header names the group.
  const isTypeOne = useCase.type === 'type-1'
  const covered = USE_CASES.filter((u) => u.slug === slug)

  return (
    <div className="animate-fade-in space-y-4">
      <SegmentedBar active={slug} />

      {/* Identity */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
            {FEEDBACK_TYPE_META[useCase.type].label}
          </p>
          <h2 className="mt-0.5 text-[18px] font-bold tracking-[-0.01em] text-slate-900">
            {isTypeOne
              ? 'CSAT & NPS Reporting'
              : useCase.name}
          </h2>
          <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-slate-500">
            {isTypeOne
              ? covered.map((u) => u.name).join(' · ')
              : useCase.problem}
          </p>
        </div>

        {useCase.agentName && (
          <Link
            href="/agents/kpmg-dice/console/ai-insights"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-kpmg-violet/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-kpmg-violet transition-colors hover:bg-kpmg-violet/15"
          >
            <Sparkles className="size-3.5" strokeWidth={2.3} />
            {useCase.agentName}
          </Link>
        )}
      </div>

      <Screen slug={slug} />
    </div>
  )
}

function Screen({ slug }: { slug: string }) {
  switch (slug) {
    case 'nps-reporting':
      return <NpsReporting />
    case 'survey-optimizer':
      return <SurveyOptimizer />
    case 'feedback-journey':
      return <FeedbackJourney />
    case 'voc-analyzer':
      return <VocAnalyzer />
    case 'root-cause':
      return <RootCause />
    case 'detractor-recovery':
      return <DetractorRecovery />
    case 'control-tower':
      return <ControlTower />
    default: {
      const useCase = findUseCaseBySlug(slug)
      return (
        <ComingSoon
          title={useCase?.name ?? 'Use case'}
          description={useCase?.aiAction ?? ''}
        />
      )
    }
  }
}
