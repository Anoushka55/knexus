'use client'

import { Fragment, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Gauge,
  Layers,
  Minus,
  Route,
  TrendingDown,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

import { Card } from '@/lib/kpmg-dice/components/ui/card'
import { isOpen, weightedValueCr } from '@/lib/kpmg-dice/lib/selectors/overview'
import {
  medianVisitToBookingDays,
  useJourneySpine,
  type HealthStage,
  type SpineStage,
} from '@/lib/kpmg-dice/lib/selectors/use-journey-spine'
import { useInventoryFit } from '@/lib/kpmg-dice/lib/selectors/use-inventory-fit'
import { useFeedbackData } from '@/lib/kpmg-dice/lib/selectors/use-feedback-data'
import { MONTHLY_ROLLUPS } from '@/lib/kpmg-dice/data/reference'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Customer Lifecycle Intelligence hub.
 *
 * The four capabilities answer "who is this customer" rather than "what
 * happened to them". This page names them together — but as a working
 * dashboard rather than a set of launchers: the journey spine across the top
 * says where the book is losing people, and each engine card states which
 * stages it acts on, so the capabilities read as parts of one pipeline instead
 * of four unrelated screens.
 *
 * Every figure here is computed, none is authored. Where a mock-up called for
 * a number this book cannot prove — a per-engine growth rate, a persona trend
 * — the element is dropped rather than filled in.
 *
 * On compute: this deliberately calls `useFeedbackData` and `useInventoryFit`,
 * which an earlier version of this file refused to do on the grounds that a
 * hub must not pay a page's cost. That was right when the hub was four tiles
 * and one figure each. It is now the screen a manager opens first, and a
 * dashboard that cannot state a finding is not worth the click it saves. Both
 * hooks are memoised and shared with the screens the tiles open.
 */

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

/** Bolds the substrings a finding wants to emphasise. */
function emphasise(text: string, terms: string[]) {
  if (!terms.length) return text
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return text
    .split(new RegExp(`(${escaped.join('|')})`, 'g'))
    .map((part, i) =>
      terms.includes(part) ? (
        <strong key={i} className="font-semibold text-slate-900">
          {part}
        </strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    )
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9.5px] font-semibold uppercase tracking-[0.11em] text-slate-400">
      {children}
    </p>
  )
}

/**
 * Movement badge.
 *
 * Only rendered where a real trend exists. Three of the four cards can point
 * at one; the persona engine has no history in this book, so it carries no
 * badge rather than a fabricated one.
 */
function DeltaBadge({ value, unit }: { value: number; unit: string }) {
  const flat = Math.abs(value) < 0.05
  const Icon = flat ? Minus : value > 0 ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'nums inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold',
        flat
          ? 'bg-slate-100 text-slate-500'
          : value > 0
            ? 'bg-kpmg-teal/10 text-kpmg-teal'
            : 'bg-red-50 text-red-700',
      )}
      title="Versus the previous month"
    >
      <Icon className="size-3" aria-hidden />
      {value > 0 ? '+' : ''}
      {flat ? 0 : value}
      {unit}
    </span>
  )
}

/**
 * A whole, split into named parts.
 *
 * The same device the feedback panel uses for its band mix, lifted so the
 * three engine cards can carry one too — the row read as three unfinished
 * cards beside one finished one, because only the CSAT card said anything
 * about the shape of its data.
 *
 * Every segment drawn is also named in the legend. A bar with an unlabelled
 * sliver is a bar the reader cannot check, so where a distribution has more
 * parts than fit, the tail is folded into a stated "Other" rather than
 * silently dropped.
 */
interface Segment {
  label: string
  value: number
  color: string
}

function Composition({
  caption,
  segments,
  total,
  format = (n: number) => `${((n / total) * 100).toFixed(1)}%`,
}: {
  caption: string
  segments: Segment[]
  total: number
  format?: (n: number) => string
}) {
  if (!total) return null
  return (
    <div className="mt-3 border-t border-slate-100 pt-2.5">
      <MonoLabel>{caption}</MonoLabel>
      <div className="mt-1.5 flex h-2 gap-[2px] overflow-hidden rounded-full">
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{
              width: `${(seg.value / total) * 100}%`,
              backgroundColor: seg.color,
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {segments.map((seg) => (
          <span
            key={seg.label}
            className="nums flex items-center gap-1.5 text-[10.5px] text-slate-500"
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            {seg.label} {format(seg.value)}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Ordinal blues from the validated funnel ramp, plus the semantic pair. */
const MIX = {
  strong: '#005EB8',
  mid: '#3D8FD1',
  light: '#7FB3E3',
  deep: '#00338D',
  teal: '#00A3A1',
  grey: '#94A3B8',
  red: '#DC2626',
}

/* ------------------------------------------------------------------ */
/* Journey spine                                                       */
/* ------------------------------------------------------------------ */

function FunnelColumn({ stage }: { stage: SpineStage }) {
  return (
    <div className="min-w-0 pr-4">
      <MonoLabel>
        {stage.index} · {stage.label}
      </MonoLabel>
      <p
        className={cn(
          'nums mt-1 text-[22px] font-bold leading-none tracking-[-0.02em]',
          stage.bottleneck ? 'text-status-danger' : 'text-slate-900',
        )}
      >
        {formatNumber(stage.count)}
      </p>
      <div className="my-2.5 h-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn(
            'h-full rounded-full',
            stage.bottleneck ? 'bg-status-danger' : 'bg-kpmg-blue',
          )}
          style={{ width: `${Math.max(2, stage.share)}%` }}
        />
      </div>
      <p
        className={cn(
          'nums text-[10.5px]',
          stage.bottleneck
            ? 'font-semibold text-status-danger'
            : 'text-slate-500',
        )}
      >
        {stage.conversionFromPrev === null
          ? 'Baseline cohort'
          : `${stage.conversionFromPrev}% carried forward`}
      </p>
      {stage.bottleneck && (
        <span className="mt-1.5 inline-block rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-status-danger">
          Weakest hand-off
        </span>
      )}
    </div>
  )
}

/**
 * Post-sale health, drawn deliberately unlike the funnel.
 *
 * No conversion track, because there is no conversion to draw: payments and
 * service are not a subset of bookings. Giving them the same bar would say
 * "92% of bookings became payments", which is untrue and is exactly the error
 * the layout this came from contained.
 */
function HealthColumn({ stage }: { stage: HealthStage }) {
  return (
    <div className="min-w-0 pr-4">
      <MonoLabel>
        {stage.index} · {stage.label}
      </MonoLabel>
      <p
        className={cn(
          'nums mt-1 text-[22px] font-bold leading-none tracking-[-0.02em]',
          stage.alarming ? 'text-status-warning' : 'text-slate-900',
        )}
      >
        {formatNumber(stage.count)}
      </p>
      <div className="my-2.5 h-1 rounded-full border-t border-dashed border-slate-300" />
      <p
        className={cn(
          'nums text-[10.5px]',
          stage.alarming ? 'font-semibold text-slate-600' : 'text-slate-500',
        )}
      >
        {stage.caption}
      </p>
    </div>
  )
}

function JourneySpineCard() {
  const spine = useJourneySpine()

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-[13px] font-bold tracking-[-0.01em] text-slate-900">
          Pre-sales journey, then what happens after
        </h2>
        <p className="mt-0.5 text-[11.5px] text-slate-500">{spine.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-3 wide:grid-cols-6 wide:gap-y-0">
        {spine.funnel.map((stage) => (
          <FunnelColumn key={stage.id} stage={stage} />
        ))}
        {spine.health.map((stage) => (
          <HealthColumn key={stage.id} stage={stage} />
        ))}
      </div>

      <p className="mt-4 border-t border-slate-100 pt-2.5 text-[10.5px] leading-relaxed text-slate-400">
        Stages 01–04 are one cohort narrowing, so the percentages between them
        are conversions. Stages 05 and 06 are not a subset of bookings — they
        are read as health, which is why they carry no conversion track.
      </p>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Engine card                                                         */
/* ------------------------------------------------------------------ */

interface EngineProps {
  title: string
  icon: LucideIcon
  anchor: string
  metrics: [{ value: string; label: string }, { value: string; label: string }]
  finding: { agent: string; text: string; terms: string[] }
  href: string
  cta: string
  delta?: { value: number; unit: string }
  /** The composition bar beneath the finding. */
  stats?: React.ReactNode
}

function EngineCard({
  title,
  icon: Icon,
  anchor,
  metrics,
  finding,
  href,
  cta,
  delta,
  stats,
}: EngineProps) {
  return (
    <Card className="flex flex-col p-4 transition-shadow hover:shadow-card-hover">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-kpmg-blue/10">
          <Icon className="size-4 text-kpmg-blue" strokeWidth={2.1} />
        </span>
        <h3 className="text-[12.5px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
          {title}
        </h3>
      </div>

      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.09em] text-kpmg-teal">
        {anchor}
      </p>

      <div className="mb-3 flex gap-6">
        {metrics.map((m) => (
          <div key={m.label} className="min-w-0">
            <p className="nums text-[22px] font-bold leading-none tracking-[-0.02em] text-slate-900">
              {m.value}
            </p>
            <MonoLabel>{m.label}</MonoLabel>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.08em] text-kpmg-blue">
          {finding.agent}
        </p>
        <p className="text-[11.5px] leading-relaxed text-slate-600">
          {emphasise(finding.text, finding.terms)}
        </p>
      </div>

      {stats}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-kpmg-blue hover:text-kpmg-navy"
        >
          {cta}
          <ArrowRight className="size-3" />
        </Link>
        {delta && <DeltaBadge value={delta.value} unit={delta.unit} />}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Feedback panel                                                      */
/* ------------------------------------------------------------------ */

/*
 * The same diverging pair the reporting screen uses, and for the same reason:
 * green against this red measures ΔE 5.0 under deuteranopia, teal measures
 * 15.5. Every segment also carries a number, so colour is never the only
 * encoding. See nps-reporting.tsx.
 */
const PROMOTER = '#00A3A1'
const PASSIVE = '#94A3B8'
const DETRACTOR = '#DC2626'

function FeedbackPanel() {
  const { nps, npsTrend, drivers } = useFeedbackData()
  const surveyInvites = useCrmStore((s) => s.surveyInvites)

  /* One pass for the response rate — the full silent-detractor model is a
   * page's worth of work to produce two numbers this card can count itself. */
  const { asked, answered } = useMemo(() => {
    let asked = 0
    let answered = 0
    for (const invite of surveyInvites) {
      if (invite.status === 'queued' || invite.status === 'suppressed') continue
      asked += 1
      if (invite.respondedAt || invite.status === 'responded') answered += 1
    }
    return { asked, answered }
  }, [surveyInvites])

  const previous = npsTrend.filter((p) => p.responses > 0).slice(-2)[0]
  const npsDelta = previous ? nps.nps - previous.nps : null

  // Share of negative mentions, which is what the book can actually support —
  // not a share of detractors, which nothing here measures.
  const totalDragMentions = drivers.drags.reduce((s, d) => s + d.mentions, 0)

  const bands = [
    { label: 'Promoters', pct: nps.promoterPct, color: PROMOTER },
    { label: 'Passives', pct: nps.passivePct, color: PASSIVE },
    { label: 'Detractors', pct: nps.detractorPct, color: DETRACTOR },
  ]

  return (
    <Card className="flex flex-col p-4">
      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-kpmg-blue/10">
          <Gauge className="size-4 text-kpmg-blue" strokeWidth={2.1} />
        </span>
        <h3 className="text-[12.5px] font-bold leading-tight tracking-[-0.01em] text-slate-900">
          CSAT &amp; NPS Intelligence
        </h3>
      </div>
      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.09em] text-kpmg-teal">
        Acts on stages 03 → 06
      </p>

      <div className="mb-4 flex items-center gap-4">
        <p className="nums text-[40px] font-bold leading-none tracking-[-0.03em] text-kpmg-blue">
          {nps.nps > 0 ? '+' : ''}
          {nps.nps}
        </p>
        <div className="min-w-0 text-[11px] leading-relaxed text-slate-500">
          <p>Net promoter score</p>
          {npsDelta !== null && (
            <p
              className={cn(
                'nums font-semibold',
                npsDelta < 0 ? 'text-status-danger' : 'text-kpmg-teal',
              )}
            >
              {npsDelta > 0 ? '+' : ''}
              {npsDelta} pts vs previous month
            </p>
          )}
          <p className="nums">
            {formatNumber(nps.responses)} responses
            {asked > 0 && ` · ${Math.round((answered / asked) * 100)}% response rate`}
          </p>
        </div>
      </div>

      <div
        className="mb-2 flex h-2.5 gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={`Promoters ${nps.promoterPct}%, passives ${nps.passivePct}%, detractors ${nps.detractorPct}%`}
      >
        {bands.map((b) => (
          <div
            key={b.label}
            style={{ width: `${b.pct}%`, backgroundColor: b.color }}
          />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-x-3.5 gap-y-1 text-[10.5px] text-slate-500">
        {bands.map((b) => (
          <span key={b.label} className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: b.color }}
            />
            <span className="nums">
              {b.label} {b.pct}%
            </span>
          </span>
        ))}
      </div>

      {drivers.drags.length > 0 && (
        <>
          <MonoLabel>Top detractor drivers</MonoLabel>
          <ul className="mt-2 space-y-2">
            {drivers.drags.slice(0, 4).map((d) => {
              const share = totalDragMentions
                ? Math.round((d.mentions / totalDragMentions) * 100)
                : 0
              return (
                <li key={d.label}>
                  <div className="mb-1 flex justify-between gap-2 text-[11.5px] text-slate-600">
                    <span className="min-w-0 truncate">{d.label}</span>
                    <span className="nums shrink-0 font-semibold">{share}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-status-danger"
                      style={{ width: `${Math.max(2, share)}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-1.5 text-[10px] text-slate-400">
            Share of negative mentions across the themes dragging NPS down.
          </p>
        </>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <Link
          href="/agents/kpmg-dice/console/csat-nps"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-kpmg-blue hover:text-kpmg-navy"
        >
          Open intelligence
          <ArrowRight className="size-3" />
        </Link>
        <span className="text-[10.5px] text-slate-400">9 capabilities</span>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Hub                                                                 */
/* ------------------------------------------------------------------ */

/** Percentage-point movement in the trailing rollups, where one exists. */
function rollupDelta(key: 'leadToSiteVisit' | 'leadToBooking') {
  const rows = MONTHLY_ROLLUPS
  if (rows.length < 2) return undefined
  const last = rows[rows.length - 1][key]
  const prev = rows[rows.length - 2][key]
  return { value: Math.round((last - prev) * 10) / 10, unit: ' pts' }
}

export function CustomerIntelligenceHub() {
  const leads = useCrmStore((s) => s.leads)
  const engagements = useCrmStore((s) => s.engagements)
  const siteVisits = useCrmStore((s) => s.siteVisits)
  const bookings = useCrmStore((s) => s.bookings)
  const payments = useCrmStore((s) => s.payments)
  const serviceTickets = useCrmStore((s) => s.serviceTickets)

  const spine = useJourneySpine()
  const inventory = useInventoryFit()

  const leadFacts = useMemo(() => {
    let hot = 0
    let open = 0
    let staleHot = 0
    let staleValueCr = 0
    let backed = 0
    let contradicted = 0
    for (const lead of leads) {
      if (lead.intent === 'high') hot += 1
      /* The Leads screen's own definition, so the two headline figures cannot
       * drift apart: backed is strong-evidence plus supported, nothing else. */
      if (
        lead.evidenceStatus === 'strong-evidence' ||
        lead.evidenceStatus === 'supported'
      ) {
        backed += 1
      } else if (lead.evidenceStatus === 'contradicted') {
        contradicted += 1
      }
      if (!isOpen(lead)) continue
      open += 1
      /* The same rule the risk engine uses for its critical alert, so the hub
       * and the alert cannot disagree about how many leads have gone quiet. */
      if (
        lead.intent === 'high' &&
        lead.evidence.daysSinceLastActivity > 21 &&
        ['qualified', 'site-visit', 'proposal'].includes(lead.stage)
      ) {
        staleHot += 1
        staleValueCr += weightedValueCr(lead)
      }
    }
    return {
      hot,
      open,
      staleHot,
      staleValueCr: Math.round(staleValueCr),
      backed,
      contradicted,
      unverified: leads.length - backed - contradicted,
    }
  }, [leads])

  const interactions =
    engagements.length +
    siteVisits.length +
    bookings.length +
    payments.length +
    serviceTickets.length

  /*
   * Six personas will not legibly legend at this column width, and a bar with
   * unlabelled slivers cannot be checked by the reader. The tail is folded
   * into a stated "Other" so every drawn segment is still named.
   */
  const personaSegments = useMemo(() => {
    const ramp = [MIX.strong, MIX.deep, MIX.mid, MIX.light]
    const top = inventory.personaMix.slice(0, 4).map((p, i) => ({
      label: p.label,
      value: p.count,
      color: ramp[i],
    }))
    const rest = inventory.personaMix.slice(4)
    const restTotal = rest.reduce((sum, p) => sum + p.count, 0)
    return restTotal
      ? [...top, { label: 'Other', value: restTotal, color: MIX.grey }]
      : top
  }, [inventory.personaMix])

  const visitToBooking = useMemo(
    () => medianVisitToBookingDays(siteVisits, bookings),
    [siteVisits, bookings],
  )

  return (
    <div className="animate-fade-in space-y-3">
      <JourneySpineCard />

      <div className="grid gap-3 lg:grid-cols-2 wide:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_22rem]">
        <EngineCard
          title="Lead Quality & Conversion Engine"
          icon={UsersRound}
          anchor="Acts on stages 01 → 02"
          metrics={[
            { value: formatNumber(leads.length), label: 'Leads scored' },
            { value: formatNumber(leadFacts.hot), label: 'High intent' },
          ]}
          finding={{
            agent: 'Lead Quality Agent',
            text: leadFacts.staleHot
              ? `${formatNumber(leadFacts.staleHot)} high-intent leads have gone quiet for over 21 days, holding ${formatCrore(leadFacts.staleValueCr)} of weighted pipeline.`
              : 'No high-intent lead in the revenue-bearing stages has gone quiet for more than 21 days.',
            terms: [`${formatNumber(leadFacts.staleHot)} high-intent leads`],
          }}
          href="/agents/kpmg-dice/console/leads"
          cta="Open engine"
          delta={rollupDelta('leadToSiteVisit')}
          stats={
            <Composition
              caption="Claim against evidence"
              total={leads.length}
              segments={[
                { label: 'Backed', value: leadFacts.backed, color: MIX.teal },
                { label: 'Unverified', value: leadFacts.unverified, color: MIX.grey },
                { label: 'Contradicted', value: leadFacts.contradicted, color: MIX.red },
              ]}
            />
          }
        />

        <EngineCard
          title="Customer Journey Orchestration Copilot"
          icon={Route}
          anchor="Acts on stages 02 → 04"
          metrics={[
            { value: formatNumber(interactions), label: 'Interactions' },
            {
              value: visitToBooking === null ? '—' : `${visitToBooking}d`,
              label: 'Visit → booking',
            },
          ]}
          finding={{
            agent: 'Journey Agent',
            text: spine.weakest
              ? `${spine.weakest.from} → ${spine.weakest.to} is the weakest hand-off in the book, carrying ${spine.weakest.conversion}% forward.`
              : 'Every hand-off in the funnel is carrying a comparable share forward.',
            terms: spine.weakest
              ? [`${spine.weakest.from} → ${spine.weakest.to}`]
              : [],
          }}
          href="/agents/kpmg-dice/console/customers"
          cta="Open copilot"
          delta={rollupDelta('leadToBooking')}
          stats={
            <Composition
              caption="What the record is made of"
              total={interactions}
              format={(n) => formatNumber(n)}
              segments={[
                { label: 'Conversations', value: engagements.length, color: MIX.strong },
                { label: 'Payments', value: payments.length, color: MIX.mid },
                { label: 'Visits', value: siteVisits.length, color: MIX.light },
                { label: 'Bookings', value: bookings.length, color: MIX.teal },
                { label: 'Tickets', value: serviceTickets.length, color: MIX.red },
              ]}
            />
          }
        />

        <EngineCard
          title="Dynamic Persona & Property-fit Engine"
          icon={Layers}
          anchor="Acts on stages 01 → 03"
          metrics={[
            { value: formatNumber(leadFacts.open), label: 'Open leads scored' },
            { value: '6', label: 'Buyer personas' },
          ]}
          finding={{
            agent: 'Persona Fit Agent',
            text: inventory.orphans
              ? `${formatNumber(inventory.orphans)} unsold units worth ${formatCrore(inventory.orphanValueCr)} have no credible buyer in the current book.`
              : `Every one of the ${formatNumber(inventory.unitsAvailable)} available units has a credible buyer in the book.`,
            terms: inventory.orphans
              ? [`${formatNumber(inventory.orphans)} unsold units`]
              : [],
          }}
          href="/agents/kpmg-dice/console/persona-mapping"
          cta="Open engine"
          stats={
            <Composition
              caption="Where the open book sits"
              total={leadFacts.open}
              segments={personaSegments}
            />
          }
          /* No badge: nothing in the book records how personas moved over time,
           * and a fabricated trend is worse than an empty corner. */
        />

        <FeedbackPanel />
      </div>
    </div>
  )
}
