'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CalendarCheck, IndianRupee, Trophy } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { DataTable, type Column } from '@/lib/kpmg-dice/components/shared/data-table'
import { RecordToolbar } from '@/lib/kpmg-dice/components/shared/record-toolbar'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { BreakdownList, type BreakdownRow } from '@/lib/kpmg-dice/components/shared/breakdown-list'
import { MiniColumns } from '@/lib/kpmg-dice/components/shared/mini-columns'
import { bucketByMonth, pct } from '@/lib/kpmg-dice/lib/analysis'

import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatDate, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import type { Booking } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'
import { useReference } from '@/lib/kpmg-dice/data/use-reference'

const STATUS_OPTIONS = [
  { value: 'closed-won', label: 'closed won' },
  { value: 'booked', label: 'booked' },
]

export function BookingsPage() {
  const { campaigns, projects, reps } = useReference()
  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  )
  const router = useRouter()
  const bookings = useCrmStore((s) => s.bookings)
  const leadsById = useCrmStore((s) => s.leadsById)

  const [query, setQuery] = useState('')
  const [project, setProject] = useState('all')
  const [status, setStatus] = useState('all')

  const ordered = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => +new Date(b.bookedAt) - +new Date(a.bookedAt),
      ),
    [bookings],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ordered.filter((b) => {
      if (project !== 'all' && b.projectId !== project) return false
      if (status === 'closed-won' && !b.closedWon) return false
      if (status === 'booked' && b.closedWon) return false
      if (!q) return true
      const lead = leadsById[b.leadId]
      return (
        b.projectName.toLowerCase().includes(q) ||
        b.unitType.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (lead?.name.toLowerCase().includes(q) ?? false)
      )
    })
  }, [ordered, query, project, status, leadsById])

  const totalCr = Math.round(bookings.reduce((s, b) => s + b.valueCr, 0))
  const closedWon = bookings.filter((b) => b.closedWon).length
  const avgTicket =
    Math.round((totalCr / Math.max(1, bookings.length)) * 100) / 100

  /** Revenue concentration by project — single hue, direct labels. */
  const byProject = useMemo(() => {
    const totals = new Map<string, { name: string; value: number; count: number }>()
    for (const b of bookings) {
      const entry = totals.get(b.projectId) ?? {
        name: b.projectName,
        value: 0,
        count: 0,
      }
      entry.value += b.valueCr
      entry.count += 1
      totals.set(b.projectId, entry)
    }
    const rows = [...totals.entries()].sort((a, b) => b[1].value - a[1].value)
    const max = rows[0]?.[1].value ?? 1
    return rows.map(([id, v]) => ({
      id,
      name: v.name,
      value: Math.round(v.value),
      count: v.count,
      pct: (v.value / max) * 100,
    }))
  }, [bookings])

  /* ---------- Analysis: what configuration actually sells ---------- */

  const unitMix: BreakdownRow[] = useMemo(() => {
    const totals = new Map<string, { count: number; valueCr: number }>()
    for (const b of bookings) {
      const entry = totals.get(b.unitType) ?? { count: 0, valueCr: 0 }
      entry.count += 1
      entry.valueCr += b.valueCr
      totals.set(b.unitType, entry)
    }
    return [...totals.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([unit, v]) => ({
        key: unit,
        label: unit,
        caption: `avg ${formatCrore(v.valueCr / v.count, { decimals: 2 })} · ${formatCrore(v.valueCr)} total`,
        value: v.count,
        display: formatNumber(v.count),
      }))
  }, [bookings])

  /* ---------- Analysis: booking momentum ---------- */

  const monthly = useMemo(
    () =>
      bucketByMonth(bookings, (b) => b.bookedAt, {
        months: 6,
        value: (b) => b.valueCr,
      }).map((m) => ({
        key: m.key,
        label: m.label,
        fullLabel: m.fullLabel,
        value: m.count,
        secondary: formatCrore(m.value),
      })),
    [bookings],
  )

  /* ---------- Analysis: which source produced the revenue ---------- */

  const sourceRows: BreakdownRow[] = useMemo(() => {
    const totals = new Map<string, { count: number; valueCr: number }>()
    for (const b of bookings) {
      const lead = leadsById[b.leadId]
      if (!lead) continue
      const entry = totals.get(lead.sourceCampaignId) ?? { count: 0, valueCr: 0 }
      entry.count += 1
      entry.valueCr += b.valueCr
      totals.set(lead.sourceCampaignId, entry)
    }
    return [...totals.entries()]
      .sort((a, b) => b[1].valueCr - a[1].valueCr)
      .map(([id, v]) => ({
        key: id,
        label: campaigns.find((c) => c.id === id)?.name ?? id,
        caption: `${formatNumber(v.count)} bookings · avg ${formatCrore(v.valueCr / v.count, { decimals: 2 })}`,
        value: Math.round(v.valueCr),
        display: formatCrore(Math.round(v.valueCr)),
        onClick: () => router.push(`/agents/kpmg-dice/console/campaign-analytics/${id}`),
      }))
  }, [bookings, leadsById, router])

  /* ---------- Analysis: who closed them ---------- */

  const ownerRows: BreakdownRow[] = useMemo(() => {
    const totals = new Map<string, { count: number; valueCr: number }>()
    for (const b of bookings) {
      const lead = leadsById[b.leadId]
      if (!lead) continue
      const entry = totals.get(lead.ownerId) ?? { count: 0, valueCr: 0 }
      entry.count += 1
      entry.valueCr += b.valueCr
      totals.set(lead.ownerId, entry)
    }
    const grand = [...totals.values()].reduce((s, v) => s + v.valueCr, 0)
    return [...totals.entries()]
      .sort((a, b) => b[1].valueCr - a[1].valueCr)
      .map(([id, v]) => ({
        key: id,
        label: reps.find((r) => r.id === id)?.name ?? id,
        caption: `${formatNumber(v.count)} bookings · ${formatPercentValue(pct(v.valueCr, grand), 0)} of value`,
        value: Math.round(v.valueCr),
        display: formatCrore(Math.round(v.valueCr)),
        onClick: () => router.push(`/agents/kpmg-dice/console/team-performance/${id}`),
      }))
  }, [bookings, leadsById, router])

  const columns: Column<Booking>[] = [
    {
      key: 'customer',
      header: 'Customer',
      width: 'w-[22%]',
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
      key: 'project',
      header: 'Project',
      render: (b) => (
        <span className="whitespace-nowrap font-medium text-slate-800">
          {b.projectName}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (b) => (
        <span className="whitespace-nowrap text-slate-600">{b.unitType}</span>
      ),
    },
    {
      key: 'source',
      header: 'Source campaign',
      render: (b) => {
        const lead = leadsById[b.leadId]
        const campaign = campaigns.find((c) => c.id === lead?.sourceCampaignId)
        return (
          <span className="whitespace-nowrap text-[12px] text-slate-500">
            {campaign?.name ?? '—'}
          </span>
        )
      },
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

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Bookings"
          value={formatNumber(bookings.length)}
          sub={`${formatNumber(closedWon)} closed won`}
          icon={CalendarCheck}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
        <StatTile
          label="Booked revenue"
          value={formatCrore(totalCr)}
          sub="Year to date"
          icon={IndianRupee}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Average ticket"
          value={formatCrore(avgTicket, { decimals: 2 })}
          sub="Per booking"
          icon={Trophy}
        />
        <StatTile
          label="Top project"
          value={byProject[0]?.name.replace('Meridian ', '') ?? '—'}
          sub={
            byProject[0]
              ? `${formatCrore(byProject[0].value)} across ${byProject[0].count} bookings`
              : '—'
          }
          icon={Building2}
          accent="text-kpmg-magenta"
          accentBg="bg-kpmg-magenta/10"
        />
      </div>

      <div className="grid gap-4 wide:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <RecordToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search customer, project, unit or booking ID…"
            resultCount={filtered.length}
            totalCount={bookings.length}
            onClear={() => {
              setQuery('')
              setProject('all')
              setStatus('all')
            }}
            selects={[
              { key: 'project', label: 'projects', value: project, options: projectOptions, onChange: setProject },
              { key: 'status', label: 'statuses', value: status, options: STATUS_OPTIONS, onChange: setStatus },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <p className="shrink-0 text-[11.5px] text-slate-400">
                Most recent first
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={filtered}
                columns={columns}
                getRowKey={(b) => b.id}
                onRowClick={(b) => router.push(`/agents/kpmg-dice/console/customers/${b.leadId}`)}
                minWidth="min-w-[770px]"
                emptyLabel="No bookings match this filter."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Revenue by project</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">Drill in</p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {byProject.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => router.push(`/agents/kpmg-dice/console/projects/${p.id}`)}
                className="flex w-full items-center gap-2.5 rounded-md text-left transition-colors hover:bg-slate-50"
              >
                <span className="w-[92px] shrink-0 truncate text-[11px] text-slate-600">
                  {p.name.replace('Meridian ', '')}
                </span>
                <span className="h-4 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                  <span
                    className="block h-full rounded-r-[4px] bg-kpmg-teal"
                    style={{ width: `${Math.max(2, p.pct)}%` }}
                  />
                </span>
                <span className="nums w-[62px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                  {formatCrore(p.value)}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Unit mix</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList rows={unitMix} tone="violet" layout="stacked" />
          </CardContent>
        </Card>
        </div>
      </div>

      {/* ---------- Momentum and attribution ---------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Booking momentum</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Last six months
            </p>
          </CardHeader>
          <CardContent>
            <MiniColumns
              points={monthly}
              tone="bg-kpmg-teal"
              caption="Hover a column for bookings and value closed"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by source</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">Drill in</p>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={sourceRows.slice(0, 6)}
              tone="magenta"
              layout="stacked"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by closer</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">Drill in</p>
          </CardHeader>
          <CardContent>
            <BreakdownList rows={ownerRows} tone="navy" layout="stacked" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
