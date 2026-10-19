'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Check,
  CircleAlert,
  CircleCheck,
  CreditCard,
  Globe,
  Gauge,
  LifeBuoy,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Target,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

import { Card } from '@/lib/kpmg-dice/components/ui/card'
import { AgentBriefPanel } from './agent-brief-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/kpmg-dice/components/ui/tabs'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { ScorePill } from '@/lib/kpmg-dice/components/shared/score-pill'


import { agentforceVsDice } from '@/lib/kpmg-dice/lib/crm'
import { usePersonaFor } from '@/lib/kpmg-dice/lib/personas/use-persona-map'
import { selectThemesForResponse } from '@/lib/kpmg-dice/lib/selectors/feedback'
import { useFeedbackData, useFeedbackForLead } from '@/lib/kpmg-dice/lib/selectors/use-feedback-data'
import { nextBestActionFor, weightedValueCr } from '@/lib/kpmg-dice/lib/selectors/overview'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { TOUCHPOINT_LABEL } from '@/lib/kpmg-dice/types'
import { formatCrore, formatDate } from '@/lib/kpmg-dice/lib/format'
import {
  STAGE_ORDER,
  type Booking,
  type Engagement,
  type EngagementChannel,
  type LeadEvidence,
  type Payment,
  type Sentiment,
  type ServiceTicket,
  type SiteVisit,
} from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const CHANNEL_ICONS: Record<EngagementChannel, LucideIcon> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  website: Globe,
  'site-visit': MapPin,
}

const SENTIMENT_TONE: Record<Sentiment, string> = {
  positive: 'bg-emerald-50 text-emerald-700',
  neutral: 'bg-slate-100 text-slate-600',
  negative: 'bg-red-50 text-red-700',
}

/**
 * One row on the consolidated timeline, whatever record produced it.
 *
 * `sentiment` is optional on purpose. Only an engagement carries one; a payment
 * or a booking does not, and inventing a mood for them so every row looks alike
 * would put a judgement on screen that no record supports.
 */
interface TimelineEntry {
  id: string
  /** ISO, for ordering. */
  at: string
  icon: LucideIcon
  title: string
  detail: string
  /** The grey line beside the title — channel, direction, status. */
  meta: string
  sentiment?: Sentiment
}

/**
 * Imported dates are whatever the file said.
 *
 * An unparseable one must not poison the sort — NaN compares false against
 * everything and would scatter the rest of the list — so it sinks to the
 * bottom instead.
 */
function timeOf(at: string): number {
  const t = new Date(at).getTime()
  return Number.isFinite(t) ? t : 0
}

/**
 * Every interaction this customer has, from every record type.
 *
 * The tab used to read `engagements` alone. On an imported book whose
 * conversation history is thin that showed "Engagements (0)" next to a journey
 * strip carrying a real site-visit date — the records had joined and simply
 * were not being rendered. The page's own subtitle promises a consolidated view
 * across every channel; this is that view.
 *
 * Nothing here is generated. Every row is a record the loaded book supplied.
 */
function buildTimeline(input: {
  engagements: Engagement[]
  visits: SiteVisit[]
  booking?: Booking
  payments: Payment[]
  tickets: ServiceTicket[]
}): TimelineEntry[] {
  const out: TimelineEntry[] = []

  for (const e of input.engagements) {
    out.push({
      id: e.id,
      at: e.occurredAt,
      icon: CHANNEL_ICONS[e.channel] ?? MessageCircle,
      title: e.subject,
      detail: e.summary,
      meta: `${e.channel.replace('-', ' ')} · ${e.direction}${
        e.durationMins ? ` · ${e.durationMins} min` : ''
      }`,
      sentiment: e.sentiment,
    })
  }

  for (const v of input.visits) {
    // A booked slot nobody turned up to is as much a fact about the customer
    // as one they attended, so both are shown and labelled.
    const meta = ['site visit', v.attended ? 'attended' : 'no-show']
    if (v.outcome) meta.push(v.outcome)

    out.push({
      id: v.id,
      at: v.scheduledAt,
      icon: MapPin,
      title: `Site visit — ${v.projectName}`,
      detail:
        v.feedback ??
        (v.objection
          ? `Objection raised: ${v.objection}.`
          : 'Visit recorded against the project.'),
      meta: meta.join(' · '),
    })
  }

  if (input.booking) {
    const b = input.booking
    out.push({
      id: b.id,
      at: b.bookedAt,
      icon: Building2,
      title: `Booked ${b.unitType} — ${b.projectName}`,
      detail: `Booking value ${formatCrore(b.valueCr, { decimals: 2 })}.`,
      meta: b.closedWon ? 'booking · closed won' : 'booking',
    })
  }

  for (const p of input.payments) {
    // An overdue milestone is a customer event, not just a finance row — it is
    // often the reason the next conversation goes the way it does.
    out.push({
      id: p.id,
      at: p.paidAt ?? p.dueAt,
      icon: CreditCard,
      title: p.milestone,
      detail: p.paidAt
        ? `${formatCrore(p.amountCr, { decimals: 2 })} received.`
        : `${formatCrore(p.amountCr, { decimals: 2 })} ${p.status}.`,
      meta: `payment · ${p.status}`,
    })
  }

  for (const t of input.tickets) {
    out.push({
      id: t.id,
      at: t.openedAt,
      icon: LifeBuoy,
      title: t.subject,
      detail: t.detail,
      meta: `service · ${t.category} · ${t.severity} · ${t.status.replace('-', ' ')}`,
    })
  }

  // Newest first — the order the engagement list already used.
  return out.sort((a, b) => timeOf(b.at) - timeOf(a.at))
}

/** The behavioural counters, for a record that carries counts and no detail. */
const EVIDENCE_LABELS: { key: keyof LeadEvidence; label: string }[] = [
  { key: 'callsAnswered', label: 'Calls answered' },
  { key: 'callsAttempted', label: 'Calls attempted' },
  { key: 'whatsappReplies', label: 'WhatsApp replies' },
  { key: 'emailOpens', label: 'Emails opened' },
  { key: 'websiteVisits', label: 'Website visits' },
  { key: 'brochureViews', label: 'Brochure views' },
  { key: 'projectsViewed', label: 'Projects viewed' },
  { key: 'siteVisitsAttended', label: 'Site visits attended' },
]

const MILESTONES = [
  { label: 'Lead', stage: 'lead' },
  { label: 'Engaged', stage: 'engaged' },
  { label: 'Site Visit', stage: 'site-visit' },
  { label: 'Proposal', stage: 'proposal' },
  { label: 'Booking', stage: 'booking' },
] as const

export function CustomerProfile({ leadId }: { leadId: string }) {
  const { projects, reps } = useReference()
  const feedback = useFeedbackForLead(leadId)
  const { themes } = useFeedbackData()
  const lead = useCrmStore((s) => s.leadsById[leadId])
  const allEngagements = useCrmStore((s) => s.engagements)
  const allVisits = useCrmStore((s) => s.siteVisits)
  const allBookings = useCrmStore((s) => s.bookings)
  const allTickets = useCrmStore((s) => s.serviceTickets)
  const allPayments = useCrmStore((s) => s.payments)
  const allTasks = useCrmStore((s) => s.tasks)
  const customers = useCrmStore((s) => s.customers)
  const assignment = usePersonaFor(leadId)

  if (!lead) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-[15px] font-semibold text-slate-700">
          No lead found for {leadId}
        </p>
        <Link
          href="/agents/kpmg-dice/console/leads"
          className="text-[13px] font-semibold text-kpmg-blue hover:underline"
        >
          Back to Leads
        </Link>
      </Card>
    )
  }

  const engagements = allEngagements
    .filter((e) => e.leadId === leadId)
    .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))
  const visits = allVisits.filter((v) => v.leadId === leadId)
  const booking = allBookings.find((b) => b.leadId === leadId)
  const tickets = allTickets.filter((t) => t.leadId === leadId)
  const tasks = allTasks.filter((t) => t.whatId === leadId && t.status === 'Open')
  const customer = customers.find((c) => c.id === leadId)
  const payments = allPayments.filter((p) => p.leadId === leadId)

  const timeline = buildTimeline({
    engagements,
    visits,
    booking,
    payments,
    tickets,
  })

  // "Engaged" means an actual two-way conversation started — not the web form
  // that created the record, which would just repeat the Lead date.
  const firstTwoWayContact = [...engagements]
    .reverse()
    .find((e) => e.channel === 'call' || e.channel === 'whatsapp')

  const persona = assignment ? personaById(assignment.best.personaId) : null
  const rep = reps.find((r) => r.id === lead.ownerId)
  const comparison = agentforceVsDice(lead)
  const { action } = nextBestActionFor(lead)
  const objection = visits.find((v) => v.objection)?.objection
  const currentIndex = STAGE_ORDER.indexOf(lead.stage)

  const interestedProjects = projects.filter((p) =>
    lead.interestedProjectIds.includes(p.id),
  )

  return (
    <div className="animate-fade-in space-y-4">
      <Link
        href="/agents/kpmg-dice/console/leads"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" />
        Back to Leads
      </Link>

      {/* ---------- Header ---------- */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <InitialsAvatar name={lead.name} className="size-16 text-xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
                  {lead.name}
                </h2>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    lead.intent === 'high'
                      ? 'bg-emerald-50 text-emerald-700'
                      : lead.intent === 'cold'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {lead.intent === 'high'
                    ? 'High Intent'
                    : `${lead.intent[0].toUpperCase()}${lead.intent.slice(1)} Intent`}
                </span>
                {persona && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                    style={{ backgroundColor: persona.color }}
                  >
                    {persona.name}
                    {assignment && ` · ${assignment.best.confidence}%`}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12.5px] text-slate-500">
                Lead ID: {lead.id} · Owner{' '}
                {rep ? (
                  <Link
                    href={`/agents/kpmg-dice/console/team-performance/${rep.id}`}
                    className="font-medium text-kpmg-blue hover:underline"
                  >
                    {rep.name}
                  </Link>
                ) : (
                  '—'
                )}{' '}
                · {customer?.occupation ?? 'Occupation not captured'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <ScorePill score={lead.score} />
                <span className="text-[12px] text-slate-500">
                  DICE lead score
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {[
              { label: 'Budget', value: formatCrore(lead.budgetCr, { decimals: 1 }) },
              { label: 'Location', value: lead.preferredLocation },
              { label: 'Family', value: `${lead.familySize} members` },
              {
                label: 'Weighted value',
                value: formatCrore(Math.round(weightedValueCr(lead) * 10) / 10, {
                  decimals: 1,
                }),
              },
            ].map((fact) => (
              <div key={fact.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {fact.label}
                </p>
                <p className="mt-0.5 text-[15px] font-bold text-slate-900">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Journey timeline */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Journey Timeline
          </p>
          <div className="relative">
            <div className="absolute left-[10%] right-[10%] top-[11px] h-0.5 bg-slate-200" />
            <ol className="relative flex justify-between">
              {MILESTONES.map(({ label, stage }) => {
                const index = STAGE_ORDER.indexOf(stage)
                const state =
                  index < currentIndex
                    ? 'complete'
                    : index === currentIndex
                      ? 'current'
                      : 'upcoming'

                const date =
                  stage === 'lead'
                    ? lead.createdAt
                    : stage === 'engaged'
                      ? firstTwoWayContact?.occurredAt
                      : stage === 'site-visit'
                        ? visits[0]?.scheduledAt
                        : stage === 'booking'
                          ? booking?.bookedAt
                          : undefined

                return (
                  <li
                    key={label}
                    className="flex w-1/5 flex-col items-center gap-2"
                  >
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full ring-2 ring-white',
                        state === 'complete' && 'bg-kpmg-blue text-white',
                        state === 'current' &&
                          'bg-kpmg-purple text-white ring-[3px] ring-kpmg-purple/20',
                        state === 'upcoming' && 'border-2 border-slate-300 bg-white',
                      )}
                    >
                      {state === 'complete' && (
                        <Check className="size-3.5" strokeWidth={3.2} />
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-[12px] font-semibold',
                        state === 'upcoming' ? 'text-slate-400' : 'text-slate-800',
                      )}
                    >
                      {label}
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      {state !== 'upcoming' && date ? formatDate(date) : '—'}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </Card>

      {/* ---------- Tabs ---------- */}
      <Tabs defaultValue="engagements">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="engagements">
            Engagements ({timeline.length})
          </TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="crm">CRM Sync</TabsTrigger>
        </TabsList>

        {/* Engagements */}
        <TabsContent value="engagements">
          <Card className="p-5">
            {timeline.length === 0 ? (
              /*
               * Reachable only for a lead with no records of any kind. Show the
               * counters the record does carry rather than an empty panel: they
               * are real imported values, and they are the difference between
               * "nothing here" and "here is what we hold on this customer".
               */
              <div className="py-8">
                <p className="text-center text-[13px] font-semibold text-slate-600">
                  No interaction records for this customer
                </p>
                <p className="mx-auto mt-1 max-w-md text-center text-[12px] leading-relaxed text-slate-400">
                  This record has not been through EAI sanitisation, so DICE has
                  behavioural counts but no conversation detail to reason over.
                </p>

                <div className="mx-auto mt-5 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4">
                  {EVIDENCE_LABELS.map(({ key, label }) => (
                    <div key={key} className="bg-white px-3 py-2.5 text-center">
                      <p className="nums text-[15px] font-bold text-slate-900">
                        {lead.evidence[key]}
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-tight text-slate-500">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Counts only · last activity {lead.evidence.daysSinceLastActivity} days ago
                </p>
              </div>
            ) : (
              <ol className="space-y-0">
                {timeline.map((entry, i) => {
                  const Icon = entry.icon
                  return (
                    <li key={entry.id} className="flex gap-3.5">
                      {/* Rail */}
                      <div className="flex flex-col items-center">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <Icon className="size-4" strokeWidth={2} />
                        </span>
                        {i < timeline.length - 1 && (
                          <span className="w-px flex-1 bg-slate-200" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-semibold text-slate-900">
                            {entry.title}
                          </p>
                          {entry.sentiment ? (
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                                SENTIMENT_TONE[entry.sentiment],
                              )}
                            >
                              {entry.sentiment}
                            </span>
                          ) : null}
                          <span className="text-[11px] capitalize text-slate-400">
                            {entry.meta}
                          </span>
                          <span className="ml-auto shrink-0 text-[11px] text-slate-400">
                            {formatDate(entry.at)}
                          </span>
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
                          {entry.detail}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="p-5">
              <h3 className="section-title">Consolidated preferences</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                Activity merged across every project this customer touched — the
                view the assigned rep would otherwise never see.
              </p>

              <div className="mt-4 space-y-2">
                {interestedProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/agents/kpmg-dice/console/projects/${project.id}`}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-kpmg-blue/40 hover:bg-slate-50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-kpmg-blue/10">
                      <Building2 className="size-4 text-kpmg-blue" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-900">
                        {project.name}
                      </p>
                      <p className="text-[11.5px] text-slate-500">
                        {project.location} · {project.unitTypes.join(', ')} ·
                        Possession {project.possession}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11.5px] font-semibold text-slate-600">
                      ₹{project.priceRangeCr[0]}–{project.priceRangeCr[1]} Cr
                    </span>
                  </Link>
                ))}
                {interestedProjects.length === 0 && (
                  <p className="text-[12.5px] text-slate-400">
                    No project interest recorded.
                  </p>
                )}
              </div>

              {visits.length > 0 && (
                <>
                  <h4 className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                    Site visits
                  </h4>
                  <div className="mt-2 space-y-2">
                    {visits.map((v) => (
                      <div
                        key={v.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12.5px] font-semibold text-slate-900">
                            {v.projectName}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(v.scheduledAt)}
                          </span>
                        </div>
                        {v.feedback && (
                          <p className="mt-1 text-[11.5px] text-slate-600">
                            {v.feedback}
                          </p>
                        )}
                        {v.objection && (
                          <p className="mt-1 text-[11.5px] font-medium text-amber-700">
                            Objection: {v.objection}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/*
              Feedback on the 360.
              The story used to take four screens — the lead record here, the
              breaching ticket on Service Tickets, the score on the VoC Analyzer
              and the case on Recovery. This is the same customer, so it belongs
              on the same page.
            */}
            {feedback.latest && (
              <Card className="p-5">
                <h3 className="section-title">Customer satisfaction</h3>

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <span
                    className={cn(
                      'nums rounded-md px-2.5 py-1 text-[15px] font-bold',
                      feedback.latest.npsBand === 'promoter'
                        ? 'bg-kpmg-teal/10 text-kpmg-teal'
                        : feedback.latest.npsBand === 'passive'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-red-50 text-red-700',
                    )}
                  >
                    NPS {feedback.latest.npsScore}/10
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-semibold capitalize text-slate-600">
                    {feedback.latest.npsBand}
                  </span>
                  <span className="text-[12.5px] text-slate-500">
                    {TOUCHPOINT_LABEL[feedback.latest.touchpoint]} · CSAT{' '}
                    {feedback.latest.csatScore}/5
                  </span>
                </div>

                <blockquote className="mt-3 rounded-lg border-l-[3px] border-slate-300 bg-slate-50 py-2 pl-3 pr-3 text-[12.5px] italic leading-relaxed text-slate-600">
                  {feedback.latest.verbatim}
                </blockquote>

                {/* Themes quote this record, not the book. */}
                <div className="mt-3 space-y-1.5">
                  {selectThemesForResponse(feedback.latest, themes).map((theme) => (
                    <div
                      key={theme.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5"
                    >
                      <p className="min-w-0 text-[12px] font-semibold text-slate-800">
                        {theme.label}
                      </p>
                      <span className="nums shrink-0 text-[11px] font-semibold text-slate-500">
                        {theme.confidence}%
                      </span>
                    </div>
                  ))}
                </div>

                {feedback.latest.sourceTicketId && (
                  <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11.5px] leading-relaxed text-slate-600">
                    An unresolved service ticket (
                    <code className="text-[11px] font-semibold text-slate-700">
                      {feedback.latest.sourceTicketId}
                    </code>
                    ) was already open when this score was given.
                  </p>
                )}

                {feedback.cases.length > 0 && (
                  <div className="mt-3 rounded-lg border border-kpmg-magenta/25 bg-kpmg-magenta/[0.04] px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-kpmg-magenta">
                      <LifeBuoy className="size-3" />
                      Recovery case
                    </p>
                    <p className="mt-1 text-[12.5px] font-semibold capitalize text-slate-800">
                      {feedback.cases[0].status} ·{' '}
                      {reps.find((r) => r.id === feedback.cases[0].ownerId)?.name ??
                        'Customer Care'}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">
                      {feedback.cases[0].recommendedResponse}
                    </p>
                  </div>
                )}

                <Link
                  href="/agents/kpmg-dice/console/csat-nps/detractor-recovery"
                  className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-kpmg-blue hover:text-kpmg-navy"
                >
                  <Gauge className="size-3.5" />
                  Open in CSAT &amp; NPS
                </Link>
              </Card>
            )}

            <Card className="p-5">
              <h3 className="section-title">Persona fit</h3>
              {persona && assignment ? (
                <>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="rounded-md px-2.5 py-1 text-[13px] font-bold text-white"
                      style={{ backgroundColor: persona.color }}
                    >
                      {persona.name}
                    </span>
                    <span className="nums text-[13px] font-bold text-slate-900">
                      {assignment.best.confidence}%
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
                    {persona.description}
                  </p>

                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Signals used
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {assignment.best.signals.map((s) => (
                      <li key={s} className="flex gap-1.5">
                        <CircleCheck
                          className="mt-0.5 size-3.5 shrink-0 text-dice-status-success"
                          strokeWidth={2.2}
                        />
                        <span className="text-[11.5px] leading-snug text-slate-600">
                          {s}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Playbook
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">
                    {persona.playbook}
                  </p>

                  <Link
                    href="/agents/kpmg-dice/console/persona-mapping"
                    className="mt-3 inline-flex text-[11.5px] font-semibold text-kpmg-blue hover:underline"
                  >
                    Open persona board →
                  </Link>
                </>
              ) : (
                <p className="mt-3 text-[12.5px] text-slate-400">
                  No persona assigned.
                </p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights */}
        <TabsContent value="insights">
          {/*
            What the agents concluded, at the top of the tab that exists for
            exactly that. The full trace stays on /agent-chain; this links
            through rather than duplicating it.
          */}
          <div className="mb-4">
            <AgentBriefPanel leadId={leadId} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <div className="mb-2 flex items-center gap-1.5">
                <Lightbulb className="size-4 text-kpmg-violet" strokeWidth={2.2} />
                <h3 className="text-[13px] font-bold text-kpmg-violet">
                  Conversion outlook
                </h3>
              </div>
              <p className="text-[28px] font-bold leading-none text-slate-900">
                {lead.score}%
              </p>
              <p className="mt-1 text-[11.5px] text-slate-500">
                DICE lead score — {lead.score >= 80 ? 'high' : lead.score >= 60 ? 'moderate' : 'low'}{' '}
                probability of converting in the next 15 days.
              </p>
              <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                {[
                  ['Website sessions', lead.evidence.websiteVisits],
                  ['Brochures opened', lead.evidence.brochureViews],
                  ['Calls answered', `${lead.evidence.callsAnswered} / ${lead.evidence.callsAttempted}`],
                  ['WhatsApp replies', lead.evidence.whatsappReplies],
                  ['Days since activity', lead.evidence.daysSinceLastActivity],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between">
                    <dt className="text-[11.5px] text-slate-500">{label as string}</dt>
                    <dd className="nums text-[11.5px] font-semibold text-slate-900">
                      {value as string | number}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card className="p-5">
              <div className="mb-2 flex items-center gap-1.5">
                <TriangleAlert className="size-4 text-amber-600" strokeWidth={2.2} />
                <h3 className="text-[13px] font-bold text-amber-700">
                  Main objection
                </h3>
              </div>
              <p className="text-[15px] font-bold text-slate-900">
                {objection ?? 'None captured'}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
                {objection
                  ? 'Recorded at the site visit and unresolved on the record.'
                  : 'No objection was captured at any touchpoint — the reason for any stall is unknown.'}
              </p>

              {tickets.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Open service tickets
                  </p>
                  {tickets.map((t) => (
                    <div key={t.id} className="mt-1.5 flex gap-1.5">
                      <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-dice-status-danger" />
                      <span className="text-[11.5px] leading-snug text-slate-600">
                        {t.subject}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-2 flex items-center gap-1.5">
                <Target className="size-4 text-kpmg-teal" strokeWidth={2.2} />
                <h3 className="text-[13px] font-bold text-kpmg-teal">
                  Recommended action
                </h3>
              </div>
              <p className="text-[15px] font-bold text-slate-900">{action}</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
                {lead.evidenceNote ??
                  `Ranked from ${lead.evidence.websiteVisits + lead.evidence.emailOpens + lead.evidence.callsAnswered} behavioural signals on this record.`}
              </p>

              {tasks.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Open tasks ({tasks.length})
                  </p>
                  {tasks.slice(0, 4).map((t) => (
                    <div key={t.id} className="mt-1.5 flex gap-1.5">
                      <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-kpmg-blue" />
                      <span className="text-[11.5px] leading-snug text-slate-600">
                        {t.subject}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* CRM sync */}
        <TabsContent value="crm">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                <h3 className="text-[13px] font-bold text-slate-700">
                  Agentforce baseline
                </h3>
                <p className="text-[11.5px] text-slate-500">
                  What native Agentforce reads off this record
                </p>
              </div>
              <div className="p-5">
                <dl className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[12px] text-slate-500">Lead status</dt>
                    <dd className="text-[12px] font-semibold text-slate-900">
                      {comparison.agentforceView.status}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[12px] text-slate-500">Last synced</dt>
                    <dd className="text-[12px] font-semibold text-slate-900">
                      {formatDate(comparison.agentforceView.lastSyncedAt)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Gaps
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {comparison.agentforceView.gaps.map((gap) => (
                    <li key={gap} className="flex gap-1.5">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-dice-status-danger" />
                      <span className="text-[11.5px] leading-snug text-slate-600">
                        {gap}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="overflow-hidden border-kpmg-violet/25">
              <div className="border-b border-kpmg-violet/20 bg-kpmg-violet/[0.06] px-5 py-3">
                <h3 className="text-[13px] font-bold text-kpmg-violet">
                  Agentforce + DICE
                </h3>
                <p className="text-[11.5px] text-slate-500">
                  What DICE adds on top of the same record
                </p>
              </div>
              <div className="p-5">
                <dl className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[12px] text-slate-500">Evidence check</dt>
                    <dd
                      className={cn(
                        'text-[12px] font-semibold capitalize',
                        comparison.diceView.evidenceStatus === 'contradicted'
                          ? 'text-dice-status-danger'
                          : 'text-dice-status-success',
                      )}
                    >
                      {comparison.diceView.evidenceStatus.replace('-', ' ')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[12px] text-slate-500">Lead score</dt>
                    <dd className="text-[12px] font-semibold text-slate-900">
                      {comparison.diceView.score}/100
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[12px] text-slate-500">Persona</dt>
                    <dd className="text-[12px] font-semibold text-slate-900">
                      {persona?.name ?? '—'}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Added by DICE
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {comparison.diceView.adds.map((add) => (
                    <li key={add} className="flex gap-1.5">
                      <CircleCheck
                        className="mt-0.5 size-3.5 shrink-0 text-kpmg-teal"
                        strokeWidth={2.2}
                      />
                      <span className="text-[11.5px] leading-snug text-slate-600">
                        {add}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { useReference } from '@/lib/kpmg-dice/data/use-reference'
import { personaById } from '@/lib/kpmg-dice/data/active-reference'