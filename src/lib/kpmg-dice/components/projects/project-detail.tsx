'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarCheck,
  IndianRupee,
  MapPin,
  MessageSquareWarning,
  Target,
  UsersRound,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { DataTable, type Column } from '@/lib/kpmg-dice/components/shared/data-table'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { IntentPill, StagePill, StatusPill } from '@/lib/kpmg-dice/components/shared/pills'
import { useProjectRollups } from '@/lib/kpmg-dice/components/projects/projects-portfolio'
import { BreakdownList, type BreakdownRow } from '@/lib/kpmg-dice/components/shared/breakdown-list'
import { MiniColumns } from '@/lib/kpmg-dice/components/shared/mini-columns'
import { bucketByMonth, pct } from '@/lib/kpmg-dice/lib/analysis'

import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatDate, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import type { Booking, Lead } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'
import { useReference } from '@/lib/kpmg-dice/data/use-reference'

/** Validated ordinal ramp — single hue, monotone lightness. */
const DEMAND_RAMP = [
  { color: '#7FB3E3', onColor: 'dark' as const },
  { color: '#3D8FD1', onColor: 'dark' as const },
  { color: '#00509C', onColor: 'light' as const },
  { color: '#00338D', onColor: 'light' as const },
]

export function ProjectDetail({ projectId }: { projectId: string }) {
  const { campaigns, projects, reps } = useReference()
  const router = useRouter()
  const leads = useCrmStore((s) => s.leads)
  const leadsById = useCrmStore((s) => s.leadsById)
  const siteVisits = useCrmStore((s) => s.siteVisits)
  const bookings = useCrmStore((s) => s.bookings)
  const payments = useCrmStore((s) => s.payments)
  const serviceTickets = useCrmStore((s) => s.serviceTickets)

  const project = projects.find((p) => p.id === projectId)
  const rollups = useProjectRollups()
  const rollup = rollups.find((r) => r.id === projectId)
  const rank = rollups.findIndex((r) => r.id === projectId) + 1

  const interested = useMemo(
    () =>
      leads
        .filter((l) => l.interestedProjectIds.includes(projectId))
        .sort((a, b) => b.score - a.score),
    [leads, projectId],
  )

  const visits = useMemo(
    () => siteVisits.filter((v) => v.projectId === projectId),
    [siteVisits, projectId],
  )

  const projectBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.projectId === projectId)
        .sort((a, b) => +new Date(b.bookedAt) - +new Date(a.bookedAt)),
    [bookings, projectId],
  )

  const demand = useMemo(() => {
    // Every recorded visit is an attended visit, so there is no separate
    // "scheduled" step to show here.
    const rows = [
      { label: 'Interested', count: interested.length },
      { label: 'Site visits', count: visits.length },
      { label: 'Bookings', count: projectBookings.length },
      {
        label: 'Closed won',
        count: projectBookings.filter((b) => b.closedWon).length,
      },
    ]
    const max = rows[0].count || 1
    return rows.map((r, i) => ({
      ...r,
      pct: (r.count / max) * 100,
      carried:
        i === 0 ? null : Math.round((r.count / (rows[i - 1].count || 1)) * 1000) / 10,
      ...DEMAND_RAMP[i],
    }))
  }, [interested.length, visits, projectBookings])

  const objections = useMemo(() => {
    const totals = new Map<string, number>()
    for (const v of visits) {
      if (!v.objection) continue
      totals.set(v.objection, (totals.get(v.objection) ?? 0) + 1)
    }
    const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    const max = rows[0]?.[1] ?? 1
    return rows.map(([name, count]) => ({ name, count, pct: (count / max) * 100 }))
  }, [visits])

  const unitMix = useMemo(() => {
    const totals = new Map<string, { count: number; valueCr: number }>()
    for (const b of projectBookings) {
      const entry = totals.get(b.unitType) ?? { count: 0, valueCr: 0 }
      entry.count += 1
      entry.valueCr += b.valueCr
      totals.set(b.unitType, entry)
    }
    const rows = [...totals.entries()].sort((a, b) => b[1].count - a[1].count)
    const max = rows[0]?.[1].count ?? 1
    return rows.map(([name, v]) => ({
      name,
      count: v.count,
      valueCr: Math.round(v.valueCr),
      pct: (v.count / max) * 100,
    }))
  }, [projectBookings])

  /* ---------- Which campaigns create demand for this project ---------- */

  const demandSources: BreakdownRow[] = useMemo(() => {
    const counts = new Map<string, { leads: number; booked: number }>()
    const bookedLeadIds = new Set(projectBookings.map((b) => b.leadId))
    for (const l of interested) {
      const entry = counts.get(l.sourceCampaignId) ?? { leads: 0, booked: 0 }
      entry.leads += 1
      if (bookedLeadIds.has(l.id)) entry.booked += 1
      counts.set(l.sourceCampaignId, entry)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].leads - a[1].leads)
      .slice(0, 6)
      .map(([id, v]) => ({
        key: id,
        label: campaigns.find((c) => c.id === id)?.name ?? id,
        caption: `${formatNumber(v.booked)} booked · ${formatPercentValue(pct(v.booked, v.leads), 1)} of its interest`,
        value: v.leads,
        display: formatNumber(v.leads),
        onClick: () => router.push(`/agents/kpmg-dice/console/campaign-analytics/${id}`),
      }))
  }, [interested, projectBookings, router])

  /* ---------- Collections against this project's bookings ---------- */

  const collections = useMemo(() => {
    const bookingIds = new Set(projectBookings.map((b) => b.id))
    const mine = payments.filter((p) => bookingIds.has(p.bookingId))
    const scheduled = mine.reduce((s, p) => s + p.amountCr, 0)
    const collected = mine
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.amountCr, 0)
    const overdueList = mine.filter((p) => p.status === 'overdue')
    return {
      milestones: mine.length,
      scheduled: Math.round(scheduled),
      collected: Math.round(collected),
      overdue: Math.round(overdueList.reduce((s, p) => s + p.amountCr, 0)),
      overdueCount: overdueList.length,
      rate: pct(collected, scheduled),
    }
  }, [projectBookings, payments])

  /* ---------- Post-sales load carried by this project ---------- */

  const service = useMemo(() => {
    const leadIds = new Set(projectBookings.map((b) => b.leadId))
    const mine = serviceTickets.filter((t) => leadIds.has(t.leadId))
    const openHere = mine.filter((t) => t.status !== 'resolved')
    const counts = new Map<string, number>()
    for (const t of mine) counts.set(t.category, (counts.get(t.category) ?? 0) + 1)
    return {
      total: mine.length,
      open: openHere.length,
      rows: [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
          key: name,
          label: name,
          value: count,
          display: formatNumber(count),
        })) as BreakdownRow[],
    }
  }, [projectBookings, serviceTickets])

  /* ---------- Booking cadence for this project ---------- */

  const monthly = useMemo(
    () =>
      bucketByMonth(projectBookings, (b) => b.bookedAt, {
        months: 6,
        value: (b) => b.valueCr,
      }).map((m) => ({
        key: m.key,
        label: m.label,
        fullLabel: m.fullLabel,
        value: m.count,
        secondary: formatCrore(m.value),
      })),
    [projectBookings],
  )

  const outcomes = useMemo(() => {
    const totals = new Map<string, number>()
    for (const v of visits) {
      if (!v.attended) continue
      totals.set(v.outcome ?? 'pending', (totals.get(v.outcome ?? 'pending') ?? 0) + 1)
    }
    return ['booked', 'considering', 'dropped', 'pending'].map((key) => ({
      key,
      count: totals.get(key) ?? 0,
    }))
  }, [visits])

  if (!project || !rollup) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-[15px] font-semibold text-slate-700">
          No project found for {projectId}
        </p>
        <Link
          href="/agents/kpmg-dice/console/projects"
          className="text-[13px] font-semibold text-kpmg-blue hover:underline"
        >
          Back to Project Portfolio
        </Link>
      </Card>
    )
  }

  const avgTicket = projectBookings.length
    ? Math.round((rollup.bookedValueCr / projectBookings.length) * 100) / 100
    : 0

  const bookingColumns: Column<Booking>[] = [
    {
      key: 'customer',
      header: 'Customer',
      width: 'w-[28%]',
      render: (b) => {
        const lead = leadsById[b.leadId]
        return (
          <div className="flex items-center gap-2.5">
            <InitialsAvatar name={lead?.name ?? '—'} className="size-7 text-[10px]" />
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-semibold text-slate-900">
                {lead?.name ?? b.leadId}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {b.id}
              </span>
            </span>
          </div>
        )
      },
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (b) => (
        <span className="whitespace-nowrap text-slate-700">{b.unitType}</span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (b) => (
        <span className="whitespace-nowrap text-[12px] text-slate-500">
          {reps.find((r) => r.id === leadsById[b.leadId]?.ownerId)?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'booked',
      header: 'Booked',
      render: (b) => (
        <span className="nums whitespace-nowrap text-slate-600">
          {formatDate(b.bookedAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <span
          className={cn(
            'inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
            b.closedWon
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-sky-50 text-sky-700',
          )}
        >
          {b.closedWon ? 'Closed won' : 'Booked'}
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      align: 'right',
      render: (b) => (
        <span className="nums font-bold text-slate-900">
          {formatCrore(b.valueCr, { decimals: 2 })}
        </span>
      ),
    },
  ]

  const leadColumns: Column<Lead>[] = [
    {
      key: 'lead',
      header: 'Lead',
      width: 'w-[30%]',
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
      key: 'owner',
      header: 'Owner',
      render: (l) => (
        <span className="whitespace-nowrap text-[12px] text-slate-500">
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
        href="/agents/kpmg-dice/console/projects"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" />
        Back to Project Portfolio
      </Link>

      {/* ---------- Header ---------- */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
              {project.name}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-slate-500">
              <MapPin className="size-3.5 shrink-0" />
              {project.location} · possession {project.possession} · ₹
              {project.priceRangeCr[0]}–{project.priceRangeCr[1]} Cr
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {project.unitTypes.map((u) => (
                <span
                  key={u}
                  className="rounded bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600"
                >
                  {u}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              ['Rank by value', `${rank} of ${rollups.length}`],
              ['Avg ticket', formatCrore(avgTicket, { decimals: 2 })],
              ['Visit→book', formatPercentValue(rollup.visitToBookingPct)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="nums mt-1 text-[18px] font-bold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ---------- KPIs ---------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Interested leads"
          value={formatNumber(interested.length)}
          sub="Leads naming this project"
          icon={UsersRound}
        />
        <StatTile
          label="Site visits"
          value={formatNumber(visits.length)}
          sub={`${formatPercentValue(
            interested.length ? (visits.length / interested.length) * 100 : 0,
          )} of interested leads visited`}
          icon={MapPin}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
        <StatTile
          label="Bookings"
          value={formatNumber(projectBookings.length)}
          sub={`${formatPercentValue(rollup.visitToBookingPct)} of site visits convert`}
          icon={CalendarCheck}
          accent="text-kpmg-magenta"
          accentBg="bg-kpmg-magenta/10"
        />
        <StatTile
          label="Booked value"
          value={formatCrore(rollup.bookedValueCr)}
          sub="Confirmed against this project"
          icon={IndianRupee}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
      </div>

      {/* ---------- Demand funnel + objections ---------- */}
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Demand funnel</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Interest through to booking
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {demand.map((d) => (
              <div key={d.label}>
                <div className="flex items-center gap-3">
                  <span className="w-[102px] shrink-0 text-[11.5px] text-slate-600">
                    {d.label}
                  </span>
                  <div className="h-7 min-w-0 flex-1">
                    {/* minWidth keeps the in-bar count readable at tiny steps. */}
                    <div
                      className="flex h-full items-center rounded-r-[4px] px-2.5"
                      style={{
                        width: `${Math.max(6, d.pct)}%`,
                        minWidth: '54px',
                        backgroundColor: d.color,
                      }}
                    >
                      <span
                        className={cn(
                          'nums text-[12px] font-bold',
                          d.onColor === 'light' ? 'text-white' : 'text-slate-900',
                        )}
                      >
                        {formatNumber(d.count)}
                      </span>
                    </div>
                  </div>
                </div>
                {d.carried !== null && (
                  <p className="ml-[114px] py-0.5 text-[10.5px] text-slate-400">
                    {formatPercentValue(d.carried)} carried forward
                  </p>
                )}
              </div>
            ))}

            <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3">
              {outcomes.map((o) => (
                <div key={o.key}>
                  <StatusPill status={o.key} />
                  <p className="nums mt-1 text-[15px] font-bold text-slate-900">
                    {formatNumber(o.count)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareWarning className="size-4 text-status-danger" />
                What buyers push back on
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {objections.length === 0 && (
                <p className="py-6 text-center text-[12.5px] text-slate-400">
                  No objections captured at this project.
                </p>
              )}
              {objections.map((o) => (
                <div key={o.name} className="flex items-center gap-2.5">
                  <span className="w-[148px] shrink-0 truncate text-[11px] text-slate-600">
                    {o.name}
                  </span>
                  <div className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                    <div
                      className="h-full rounded-r-[4px] bg-status-danger"
                      style={{ width: `${Math.max(2, o.pct)}%` }}
                    />
                  </div>
                  <span className="nums w-[34px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                    {o.count}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4 text-kpmg-blue" />
                Unit mix booked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {unitMix.length === 0 && (
                <p className="py-6 text-center text-[12.5px] text-slate-400">
                  No bookings yet at this project.
                </p>
              )}
              {unitMix.map((u) => (
                <div key={u.name} className="flex items-center gap-2.5">
                  <span className="w-[54px] shrink-0 text-[11px] text-slate-600">
                    {u.name}
                  </span>
                  <div className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                    <div
                      className="h-full rounded-r-[4px] bg-kpmg-blue"
                      style={{ width: `${Math.max(2, u.pct)}%` }}
                    />
                  </div>
                  <span className="nums w-[64px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                    {formatCrore(u.valueCr)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---------- Demand sources, cadence and post-sales ---------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Where the demand comes from</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">Drill in</p>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={demandSources}
              tone="magenta"
              layout="stacked"
              emptyLabel="No campaign has produced interest here yet."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking cadence</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Last six months
            </p>
          </CardHeader>
          <CardContent>
            <MiniColumns
              points={monthly}
              tone="bg-kpmg-teal"
              caption="Hover a column for units and value booked"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>After the sale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Collected', formatCrore(collections.collected), `${formatPercentValue(collections.rate, 0)} of schedule`],
                ['Overdue', formatCrore(collections.overdue), `${formatNumber(collections.overdueCount)} milestones`],
                ['Tickets', formatNumber(service.total), `${formatNumber(service.open)} still open`],
              ].map(([label, value, sub]) => (
                <div key={label} className="rounded-lg border border-slate-200 px-2.5 py-2">
                  <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="nums mt-0.5 text-[14px] font-bold text-slate-900">
                    {value}
                  </p>
                  <p className="text-[10px] text-slate-400">{sub}</p>
                </div>
              ))}
            </div>
            <BreakdownList
              rows={service.rows}
              tone="purple"
              labelWidth="w-[96px]"
              valueWidth="w-[28px]"
              barHeight="h-3"
              emptyLabel="No service tickets raised by these customers."
            />
          </CardContent>
        </Card>
      </div>

      {/* ---------- Bookings ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings at this project</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Most recent first
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={projectBookings}
            columns={bookingColumns}
            getRowKey={(b) => b.id}
            onRowClick={(b) => router.push(`/agents/kpmg-dice/console/customers/${b.leadId}`)}
            minWidth="min-w-[860px]"
            pageSize={8}
            emptyLabel="No bookings recorded at this project."
          />
        </CardContent>
      </Card>

      {/* ---------- Interested leads ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Live demand</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            {formatNumber(interested.length)} leads, highest score first
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={interested}
            columns={leadColumns}
            getRowKey={(l) => l.id}
            onRowClick={(l) => router.push(`/agents/kpmg-dice/console/customers/${l.id}`)}
            minWidth="min-w-[900px]"
            pageSize={10}
            emptyLabel="No leads have named this project."
          />
        </CardContent>
      </Card>
    </div>
  )
}
