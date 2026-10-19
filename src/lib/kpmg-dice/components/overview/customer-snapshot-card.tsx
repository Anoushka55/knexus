'use client'

import Link from 'next/link'
import { Check, Lightbulb, Target } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { CardLink } from '@/lib/kpmg-dice/components/shared/card-link'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { useHeroLead } from '@/lib/kpmg-dice/lib/selectors/use-overview-data'
import { nextBestActionFor } from '@/lib/kpmg-dice/lib/selectors/overview'
import { formatCrore } from '@/lib/kpmg-dice/lib/format'
import { STAGE_ORDER, type Engagement, type Lead, type SiteVisit } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

interface JourneyStep {
  label: string
  date: string | null
  state: 'complete' | 'current' | 'upcoming'
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

/**
 * The five milestones the journey strip shows, mapped onto their position in
 * the full stage order — 'qualified' has no node of its own on this strip.
 */
const MILESTONES: { label: string; stage: (typeof STAGE_ORDER)[number] }[] = [
  { label: 'Lead', stage: 'lead' },
  { label: 'Engaged', stage: 'engaged' },
  { label: 'Site Visit', stage: 'site-visit' },
  { label: 'Proposal', stage: 'proposal' },
  { label: 'Booking', stage: 'booking' },
]

function buildJourney(
  lead: Lead,
  engagements: Engagement[],
  siteVisits: SiteVisit[],
): JourneyStep[] {
  const currentIndex = STAGE_ORDER.indexOf(lead.stage)
  const sorted = [...engagements].sort(
    (a, b) => +new Date(a.occurredAt) - +new Date(b.occurredAt),
  )

  const dateFor = (stage: string): string | null => {
    if (stage === 'lead') return lead.createdAt
    if (stage === 'engaged') {
      const first = sorted.find((e) => e.channel === 'call' || e.channel === 'whatsapp')
      return first?.occurredAt ?? null
    }
    if (stage === 'site-visit') return siteVisits[0]?.scheduledAt ?? null
    return null
  }

  return MILESTONES.map(({ label, stage }) => {
    const index = STAGE_ORDER.indexOf(stage)
    const state: JourneyStep['state'] =
      index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'
    const iso = state === 'upcoming' ? null : dateFor(stage)
    return { label, date: iso ? shortDate(iso) : null, state }
  })
}

/** Turns the recorded objection into the concrete play a rep should run. */
const OBJECTION_PLAYS: Record<string, string> = {
  'Possession Timeline': 'Share ready-possession options & arrange finance callback.',
  'Pricing vs competitor': 'Send a like-for-like value comparison & a floor-rise waiver.',
  'Carpet area efficiency': 'Share the carpet-area efficiency sheet & a sample-flat walkthrough.',
  'Loan eligibility': 'Arrange a home-loan eligibility check with a partner bank.',
  'Location connectivity': 'Share the connectivity & infrastructure roadmap for the micro-market.',
}

function JourneyTimeline({ steps }: { steps: JourneyStep[] }) {
  return (
    <div className="relative">
      {/* Connector sits behind the nodes, inset to the first/last node centres */}
      <div className="absolute left-[10%] right-[10%] top-[9px] h-0.5 bg-slate-200" />

      <ol className="relative flex justify-between">
        {steps.map((step) => (
          <li key={step.label} className="flex w-1/5 flex-col items-center gap-1.5">
            <span
              className={cn(
                'flex size-5 items-center justify-center rounded-full ring-2 ring-white',
                step.state === 'complete' && 'bg-kpmg-blue text-white',
                step.state === 'current' &&
                  'bg-kpmg-purple text-white ring-[3px] ring-kpmg-purple/20',
                step.state === 'upcoming' && 'border-2 border-slate-300 bg-white',
              )}
            >
              {step.state === 'complete' && (
                <Check className="size-3" strokeWidth={3.2} />
              )}
            </span>

            <span
              className={cn(
                'text-center text-[11px] font-medium leading-tight',
                step.state === 'upcoming' ? 'text-slate-400' : 'text-slate-700',
              )}
            >
              {step.label}
            </span>
            <span className="text-[10px] leading-none text-slate-400">
              {step.date ?? '—'}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function CustomerSnapshotCard({ leadId }: { leadId?: string } = {}) {
  const hero = useHeroLead(leadId)
  if (!hero) return null

  const { lead, engagements, siteVisits } = hero
  const journey = buildJourney(lead, engagements, siteVisits)
  const objection = siteVisits.find((v) => v.objection)?.objection
  const { action } = nextBestActionFor(lead)

  const facts = [
    { label: 'Budget', value: formatCrore(lead.budgetCr, { decimals: 1 }) },
    { label: 'Location', value: lead.preferredLocation },
    { label: 'Family', value: `${lead.familySize} Members` },
  ]

  const intentLabel =
    lead.intent === 'high'
      ? 'High Intent'
      : lead.intent === 'medium'
        ? 'Medium Intent'
        : lead.intent === 'cold'
          ? 'Cold'
          : 'Low Intent'

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Customer Journey Orchestration Copilot</CardTitle>
        <CardLink
          href={`/agents/kpmg-dice/console/customers/${lead.id}`}
          label="View Full Profile"
          align="start"
          className="text-[12px]"
        />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        {/* Identity above the facts row — side by side, the facts box ran off
            the card edge and forced the name to wrap. */}
        <div className="flex items-center gap-3">
          <InitialsAvatar name={lead.name} className="size-12 text-base" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight text-slate-900">
              {lead.name}
            </p>
            <p className="text-[11.5px] text-slate-500">Lead ID: {lead.id}</p>
          </div>
          <span
            className={cn(
              'ml-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
              lead.intent === 'high'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-600',
            )}
          >
            {intentLabel}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
          {facts.map((fact) => (
            <div key={fact.label} className="px-2 py-2 text-center">
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {fact.label}
              </p>
              <p className="mt-0.5 text-[12.5px] font-bold text-slate-900">
                {fact.value}
              </p>
            </div>
          ))}
        </div>

        {/* Journey */}
        <div className="mt-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Journey Progress
          </p>
          <JourneyTimeline steps={journey} />
        </div>

        {/* AI panels */}
        <div className="mt-5 grid flex-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-kpmg-violet/15 bg-kpmg-violet/[0.05] p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="size-3.5 text-kpmg-violet" strokeWidth={2.2} />
              <p className="text-[12px] font-bold text-kpmg-violet">AI Insights</p>
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-600">
              {lead.score >= 80 ? 'High' : lead.score >= 60 ? 'Moderate' : 'Low'}{' '}
              probability to convert in next 15 days.
              {objection ? ` Main objection: ${objection}.` : ''}
            </p>
          </div>

          <div className="rounded-xl border border-kpmg-teal/15 bg-kpmg-teal/[0.05] p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Target className="size-3.5 text-kpmg-teal" strokeWidth={2.2} />
              <p className="text-[12px] font-bold text-kpmg-teal">
                Recommended Action
              </p>
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-600">
              {(objection && OBJECTION_PLAYS[objection]) ?? `${action}.`}
            </p>
            <Link
              href={`/agents/kpmg-dice/console/customers/${lead.id}`}
              className="mt-2 inline-flex text-[11.5px] font-semibold text-kpmg-teal hover:underline"
            >
              Take Action →
            </Link>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <CardLink
            href={`/agents/kpmg-dice/console/customers/${lead.id}`}
            label="View full customer journey"
            align="start"
          />
        </div>
      </CardContent>
    </Card>
  )
}
