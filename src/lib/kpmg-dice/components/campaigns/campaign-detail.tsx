'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChartColumn,
  IndianRupee,
  Rocket,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { DataTable, type Column } from '@/lib/kpmg-dice/components/shared/data-table'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { EvidencePill, IntentPill, StagePill } from '@/lib/kpmg-dice/components/shared/pills'
import { TrendArrow } from '@/lib/kpmg-dice/components/shared/delta'
import { BreakdownList, type BreakdownRow } from '@/lib/kpmg-dice/components/shared/breakdown-list'
import { MiniColumns } from '@/lib/kpmg-dice/components/shared/mini-columns'

import { selectCampaignRows, selectFunnel } from '@/lib/kpmg-dice/lib/selectors/overview'
import { STALL_THRESHOLD_DAYS } from '@/lib/kpmg-dice/lib/selectors/pipeline'
import { bucketByMonth, pct } from '@/lib/kpmg-dice/lib/analysis'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatDate, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import type { Lead } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const RECOMMENDATION_STYLE = {
  Scale: { chip: 'bg-emerald-50 text-emerald-700', icon: Rocket },
  Optimise: { chip: 'bg-amber-50 text-amber-700', icon: Target },
  Pause: { chip: 'bg-red-50 text-red-700', icon: TrendingDown },
} as const

/** Split a lead list by a key, biggest share first. */
function shareOf<T>(items: T[], key: (item: T) => string, limit = 6) {
  const totals = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    totals.set(k, (totals.get(k) ?? 0) + 1)
  }
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
  const max = rows[0]?.[1] ?? 1
  return rows.map(([name, count]) => ({
    name,
    count,
    pct: (count / max) * 100,
    share: items.length ? (count / items.length) * 100 : 0,
  }))
}

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const { campaigns, projects, reps } = useReference()
  const router = useRouter()
  const leads = useCrmStore((s) => s.leads)
  const bookings = useCrmStore((s) => s.bookings)
  const siteVisits = useCrmStore((s) => s.siteVisits)
  const suppressed = useCrmStore((s) => s.suppressedCampaignIds)

  const campaign = campaigns.find((c) => c.id === campaignId)

  const allRows = useMemo(() => selectCampaignRows(leads), [leads])
  const row = allRows.find((r) => r.id === campaignId)

  const campaignLeads = useMemo(
    () => leads.filter((l) => l.sourceCampaignId === campaignId),
    [leads, campaignId],
  )

  const funnel = useMemo(() => selectFunnel(campaignLeads), [campaignLeads])

  const bookedRevenueCr = useMemo(() => {
    const ids = new Set(campaignLeads.map((l) => l.id))
    return Math.round(
      bookings.filter((b) => ids.has(b.leadId)).reduce((s, b) => s + b.valueCr, 0),
    )
  }, [bookings, campaignLeads])

  const topLeads = useMemo(
    () => [...campaignLeads].sort((a, b) => b.score - a.score).slice(0, 60),
    [campaignLeads],
  )

  const projectMix = useMemo(() => {
    const expanded = campaignLeads.flatMap((l) =>
      l.interestedProjectIds.map((id) => ({ id })),
    )
    return shareOf(
      expanded,
      (p) => projects.find((x) => x.id === p.id)?.name ?? p.id,
      5,
    )
  }, [campaignLeads])

  const marketMix = useMemo(
    () => shareOf(campaignLeads, (l) => l.preferredLocation, 6),
    [campaignLeads],
  )

  const ownerMix = useMemo(
    () =>
      shareOf(
        campaignLeads,
        (l) => reps.find((r) => r.id === l.ownerId)?.name ?? l.ownerId,
        5,
      ),
    [campaignLeads],
  )

  /* ---------- Quality signature, stated against the whole book ---------- */

  const signature = useMemo(() => {
    const measure = (set: Lead[]) => {
      if (!set.length) {
        return { hot: 0, backed: 0, contradicted: 0, avgBudget: 0, avgScore: 0, stalled: 0 }
      }
      const open = set.filter((l) => !l.stage.startsWith('closed'))
      return {
        hot: pct(set.filter((l) => l.intent === 'high').length, set.length),
        backed: pct(
          set.filter((l) =>
            ['strong-evidence', 'supported'].includes(l.evidenceStatus),
          ).length,
          set.length,
        ),
        contradicted: pct(
          set.filter((l) => l.evidenceStatus === 'contradicted').length,
          set.length,
        ),
        avgBudget: set.reduce((s, l) => s + l.budgetCr, 0) / set.length,
        avgScore: Math.round(
          set.reduce((s, l) => s + l.score, 0) / set.length,
        ),
        stalled: pct(
          open.filter(
            (l) => l.evidence.daysSinceLastActivity > STALL_THRESHOLD_DAYS,
          ).length,
          open.length,
        ),
      }
    }

    const mine = measure(campaignLeads)
    const book = measure(leads)

    return [
      {
        label: 'High-intent share',
        mine: formatPercentValue(mine.hot),
        book: formatPercentValue(book.hot),
        delta: Math.round((mine.hot - book.hot) * 10) / 10,
        goodWhenUp: true,
      },
      {
        label: 'Evidence-backed',
        mine: formatPercentValue(mine.backed),
        book: formatPercentValue(book.backed),
        delta: Math.round((mine.backed - book.backed) * 10) / 10,
        goodWhenUp: true,
      },
      {
        label: 'Contradicted records',
        mine: formatPercentValue(mine.contradicted),
        book: formatPercentValue(book.contradicted),
        delta: Math.round((mine.contradicted - book.contradicted) * 10) / 10,
        goodWhenUp: false,
      },
      {
        label: 'Average budget',
        mine: formatCrore(mine.avgBudget, { decimals: 2 }),
        book: formatCrore(book.avgBudget, { decimals: 2 }),
        delta: Math.round((mine.avgBudget - book.avgBudget) * 100) / 100,
        goodWhenUp: true,
        unit: 'Cr',
      },
      {
        label: 'Average DICE score',
        mine: String(mine.avgScore),
        book: String(book.avgScore),
        delta: mine.avgScore - book.avgScore,
        goodWhenUp: true,
        unit: 'pts',
      },
      {
        label: 'Stalled share of open book',
        mine: formatPercentValue(mine.stalled),
        book: formatPercentValue(book.stalled),
        delta: Math.round((mine.stalled - book.stalled) * 10) / 10,
        goodWhenUp: false,
      },
    ]
  }, [campaignLeads, leads])

  /* ---------- Lead flow over the trailing half-year ---------- */

  const monthlyFlow = useMemo(() => {
    const created = bucketByMonth(campaignLeads, (l) => l.createdAt, { months: 6 })
    const qualified = bucketByMonth(
      campaignLeads.filter((l) =>
        ['qualified', 'site-visit', 'proposal', 'booking', 'closed-won'].includes(
          l.stage,
        ),
      ),
      (l) => l.createdAt,
      { months: 6 },
    )
    return created.map((m, i) => ({
      key: m.key,
      label: m.label,
      fullLabel: m.fullLabel,
      value: m.count,
      secondary: `${formatNumber(qualified[i]?.count ?? 0)} later qualified`,
    }))
  }, [campaignLeads])

  /* ---------- What this source's buyers push back on ---------- */

  const objectionRows: BreakdownRow[] = useMemo(() => {
    const ids = new Set(campaignLeads.map((l) => l.id))
    const counts = new Map<string, number>()
    for (const v of siteVisits) {
      if (!ids.has(v.leadId) || !v.objection || v.outcome === 'booked') continue
      counts.set(v.objection, (counts.get(v.objection) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        key: name,
        label: name,
        value: count,
        display: formatNumber(count),
      }))
  }, [campaignLeads, siteVisits])

  if (!campaign || !row) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-[15px] font-semibold text-slate-700">
          No campaign found for {campaignId}
        </p>
        <Link
          href="/agents/kpmg-dice/console/campaign-analytics"
          className="text-[13px] font-semibold text-kpmg-blue hover:underline"
        >
          Back to Campaign Analytics
        </Link>
      </Card>
    )
  }

  const style = RECOMMENDATION_STYLE[row.recommendation]
  const RecIcon = style.icon
  const isSuppressed = suppressed.includes(row.id)

  // Blended benchmark, so the verdict is stated relative to something.
  const blendedLeads = allRows.reduce((s, r) => s + r.leads, 0)
  const blendedBookings = allRows.reduce((s, r) => s + r.bookings, 0)
  const blendedRate = Math.round((blendedBookings / blendedLeads) * 1000) / 10
  const vsBlended = Math.round((row.bookingRate - blendedRate) * 10) / 10

  const columns: Column<Lead>[] = [
    {
      key: 'lead',
      header: 'Lead',
      width: 'w-[26%]',
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <InitialsAvatar name={l.name} className="size-7 text-[10px]" />
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-semibold text-slate-900">
              {l.name}
            </span>
            <span className="block truncate text-[11px] text-slate-500">
              {l.id} · {l.preferredLocation}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      align: 'right',
      render: (l) => (
        <span className="nums font-bold text-slate-900">{l.score}</span>
      ),
    },
    { key: 'intent', header: 'Intent', render: (l) => <IntentPill intent={l.intent} /> },
    { key: 'stage', header: 'Stage', render: (l) => <StagePill stage={l.stage} /> },
    {
      key: 'evidence',
      header: 'Evidence',
      render: (l) => <EvidencePill status={l.evidenceStatus} />,
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (l) => (
        <span className="whitespace-nowrap text-[12px] text-slate-600">
          {reps.find((r) => r.id === l.ownerId)?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      align: 'right',
      render: (l) => (
        <span className="nums text-slate-700">
          {formatCrore(l.budgetCr, { decimals: 2 })}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-fade-in space-y-4">
      <Link
        href="/agents/kpmg-dice/console/campaign-analytics"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" />
        Back to Campaign Analytics
      </Link>

      {/* ---------- Header ---------- */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
                {campaign.name}
              </h2>
              {!row.headline && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-slate-500">
                  Long tail
                </span>
              )}
              {isSuppressed && (
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-red-700">
                  Suppressed
                </span>
              )}
            </div>
            <p className="mt-1 text-[12.5px] text-slate-500">
              {campaign.channel} · live since {formatDate(campaign.startedAt)} ·{' '}
              ₹{campaign.spendLakh} L spent
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                Quality score
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-kpmg-blue/15">
                  <div
                    className="h-full rounded-full bg-kpmg-blue"
                    style={{ width: `${row.qualityScore}%` }}
                  />
                </div>
                <span className="nums text-[15px] font-bold text-slate-900">
                  {row.qualityScore}
                </span>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold',
                style.chip,
              )}
            >
              <RecIcon className="size-3.5" strokeWidth={2.4} />
              {row.recommendation}
            </span>
          </div>
        </div>

        <p className="mt-4 border-t border-slate-100 pt-3.5 text-[12.5px] leading-relaxed text-slate-600">
          This source booked{' '}
          <span className="font-semibold text-slate-900">
            {formatPercentValue(row.bookingRate)}
          </span>{' '}
          of the leads it produced —{' '}
          <span
            className={cn(
              'font-semibold',
              vsBlended >= 0 ? 'text-emerald-700' : 'text-status-danger',
            )}
          >
            {vsBlended >= 0 ? '+' : ''}
            {vsBlended} pts
          </span>{' '}
          against the blended {formatPercentValue(blendedRate)} across all{' '}
          {allRows.length} sources. Each booking cost ₹{row.costPerBookingLakh} L
          in media against {formatCrore(bookedRevenueCr)} of booked value.
        </p>
      </Card>

      {/* ---------- KPIs ---------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Leads generated"
          value={formatNumber(row.leads)}
          sub={`${formatNumber(row.qualifiedLeads)} qualified (${formatPercentValue(row.qualifiedPct)})`}
          icon={Users}
        />
        <StatTile
          label="Bookings"
          value={formatNumber(row.bookings)}
          sub={`${formatPercentValue(row.bookingRate)} of leads booked`}
          icon={ChartColumn}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Cost per booking"
          value={`₹${row.costPerBookingLakh} L`}
          sub={`₹${formatNumber(row.costPerLead)} per lead`}
          icon={IndianRupee}
          accent="text-kpmg-magenta"
          accentBg="bg-kpmg-magenta/10"
        />
        <StatTile
          label="Booked value"
          value={formatCrore(bookedRevenueCr)}
          sub="Confirmed bookings from this source"
          icon={IndianRupee}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
      </div>

      {/* ---------- Funnel + mixes ---------- */}
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Funnel for this campaign</CardTitle>
            <div className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-slate-400">
              Direction of travel
              <TrendArrow trend={row.trend} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {funnel.map((stage, i) => (
              <div key={stage.label}>
                <div className="flex items-center gap-3">
                  <span className="w-[104px] shrink-0 text-[11.5px] text-slate-600">
                    {stage.label}
                  </span>
                  <div className="h-7 min-w-0 flex-1">
                    {/* minWidth keeps the in-bar count readable at tiny steps. */}
                    <div
                      className="flex h-full items-center rounded-r-[4px] px-2.5"
                      style={{
                        width: `${Math.max(6, (stage.count / Math.max(1, funnel[0].count)) * 100)}%`,
                        minWidth: '54px',
                        backgroundColor: stage.color,
                      }}
                    >
                      <span
                        className={cn(
                          'nums text-[12px] font-bold',
                          stage.onColor === 'light' ? 'text-white' : 'text-slate-900',
                        )}
                      >
                        {formatNumber(stage.count)}
                      </span>
                    </div>
                  </div>
                </div>
                {stage.conversionFromPrev !== null && i < funnel.length && (
                  <p className="ml-[116px] py-0.5 text-[10.5px] text-slate-400">
                    {formatPercentValue(stage.conversionFromPrev)} carried
                    forward
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Project interest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {projectMix.map((p) => (
                <div key={p.name} className="flex items-center gap-2.5">
                  <span className="w-[88px] shrink-0 truncate text-[11px] text-slate-600">
                    {p.name.replace('Meridian ', '')}
                  </span>
                  <div className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                    <div
                      className="h-full rounded-r-[4px] bg-kpmg-blue"
                      style={{ width: `${Math.max(2, p.pct)}%` }}
                    />
                  </div>
                  <span className="nums w-[46px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                    {formatNumber(p.count)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Micro-markets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {marketMix.map((m) => (
                <div key={m.name} className="flex items-center gap-2.5">
                  <span className="w-[88px] shrink-0 truncate text-[11px] text-slate-600">
                    {m.name}
                  </span>
                  <div className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                    <div
                      className="h-full rounded-r-[4px] bg-kpmg-teal"
                      style={{ width: `${Math.max(2, m.pct)}%` }}
                    />
                  </div>
                  <span className="nums w-[46px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                    {formatPercentValue(m.share, 0)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---------- Quality signature vs the whole book ---------- */}
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quality signature</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              This source against all {formatNumber(leads.length)} leads
            </p>
          </CardHeader>
          <CardContent>
            <div className="scrollbar-slim overflow-x-auto">
              <table className="w-full min-w-[440px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    {['Measure', 'This source', 'Whole book', 'Gap'].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          'pb-2 pr-3 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 last:pr-0',
                          i > 0 && 'text-right',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {signature.map((s) => {
                    const good = s.goodWhenUp ? s.delta > 0 : s.delta < 0
                    const flat = s.delta === 0
                    return (
                      <tr
                        key={s.label}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-2.5 pr-3 text-[12.5px] text-slate-700">
                          {s.label}
                        </td>
                        <td className="nums py-2.5 pr-3 text-right text-[12.5px] font-bold text-slate-900">
                          {s.mine}
                        </td>
                        <td className="nums py-2.5 pr-3 text-right text-[12.5px] text-slate-500">
                          {s.book}
                        </td>
                        <td
                          className={cn(
                            'nums py-2.5 text-right text-[12.5px] font-semibold',
                            flat
                              ? 'text-slate-400'
                              : good
                                ? 'text-emerald-700'
                                : 'text-status-danger',
                          )}
                        >
                          {s.delta > 0 ? '+' : ''}
                          {s.delta}
                          {s.unit ? ` ${s.unit}` : ' pts'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Lead flow</CardTitle>
              <p className="shrink-0 text-[11.5px] text-slate-400">
                Last six months
              </p>
            </CardHeader>
            <CardContent>
              <MiniColumns
                points={monthlyFlow}
                caption="Hover a column for leads created and how many qualified"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Objections from this source</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList
                rows={objectionRows}
                tone="amber"
                labelWidth="w-[132px]"
                valueWidth="w-[32px]"
                emptyLabel="No site-visit objections recorded for these leads."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---------- Ownership + leads ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Who is working this source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ownerMix.map((o) => (
              <div
                key={o.name}
                className="rounded-lg border border-slate-200 px-3 py-2.5"
              >
                <p className="truncate text-[12px] font-semibold text-slate-800">
                  {o.name}
                </p>
                <p className="nums mt-0.5 text-[16px] font-bold text-slate-900">
                  {formatNumber(o.count)}
                </p>
                <p className="text-[10.5px] text-slate-400">
                  {formatPercentValue(o.share, 0)} of the source
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Highest-scoring leads from this campaign</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Top 60 of {formatNumber(campaignLeads.length)}
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={topLeads}
            columns={columns}
            getRowKey={(l) => l.id}
            onRowClick={(l) => router.push(`/agents/kpmg-dice/console/customers/${l.id}`)}
            minWidth="min-w-[960px]"
            pageSize={10}
            emptyLabel="This campaign has no leads."
          />
        </CardContent>
      </Card>
    </div>
  )
}

import { useReference } from '@/lib/kpmg-dice/data/use-reference'