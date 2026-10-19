'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleCheck, MapPin, Target, TriangleAlert } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { DataTable, type Column } from '@/lib/kpmg-dice/components/shared/data-table'
import { RecordToolbar } from '@/lib/kpmg-dice/components/shared/record-toolbar'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { StatusPill } from '@/lib/kpmg-dice/components/shared/pills'
import { BreakdownList, type BreakdownRow } from '@/lib/kpmg-dice/components/shared/breakdown-list'
import { MiniColumns } from '@/lib/kpmg-dice/components/shared/mini-columns'
import { bucketByMonth, pct } from '@/lib/kpmg-dice/lib/analysis'

import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatDate, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import type { SiteVisit } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'
import { useReference } from '@/lib/kpmg-dice/data/use-reference'

const OUTCOME_OPTIONS = ['booked', 'considering', 'dropped', 'pending'].map(
  (o) => ({ value: o, label: o }),
)


export function SiteVisitsPage() {
  const { projects } = useReference()
  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  )
  const router = useRouter()
  const siteVisits = useCrmStore((s) => s.siteVisits)
  const leadsById = useCrmStore((s) => s.leadsById)

  const [query, setQuery] = useState('')
  const [outcome, setOutcome] = useState('all')
  const [project, setProject] = useState('all')

  const ordered = useMemo(
    () =>
      [...siteVisits].sort(
        (a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt),
      ),
    [siteVisits],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ordered.filter((v) => {
      if (outcome !== 'all' && v.outcome !== outcome) return false
      if (project !== 'all' && v.projectId !== project) return false
      if (!q) return true
      const lead = leadsById[v.leadId]
      return (
        v.projectName.toLowerCase().includes(q) ||
        (v.objection?.toLowerCase().includes(q) ?? false) ||
        (lead?.name.toLowerCase().includes(q) ?? false)
      )
    })
  }, [ordered, query, outcome, project, leadsById])

  const booked = siteVisits.filter((v) => v.outcome === 'booked').length
  const dropped = siteVisits.filter((v) => v.outcome === 'dropped').length

  /** What actually stops a visit converting — ranked. */
  const objections = useMemo(() => {
    const counts = new Map<string, number>()
    for (const v of siteVisits) {
      if (!v.objection || v.outcome === 'booked') continue
      counts.set(v.objection, (counts.get(v.objection) ?? 0) + 1)
    }
    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const max = rows[0]?.[1] ?? 1
    return rows.map(([label, count]) => ({
      label,
      count,
      pct: (count / max) * 100,
    }))
  }, [siteVisits])

  /* ---------- Analysis: what happened after the visit ---------- */

  const outcomeRows: BreakdownRow[] = useMemo(() => {
    const order: SiteVisit['outcome'][] = [
      'booked',
      'considering',
      'dropped',
      'pending',
    ]
    return order.map((o) => {
      const count = siteVisits.filter((v) => (v.outcome ?? 'pending') === o).length
      return {
        key: o ?? 'pending',
        label: (o ?? 'pending').replace(/^./, (c) => c.toUpperCase()),
        caption: `${formatPercentValue(pct(count, siteVisits.length), 0)} of all visits`,
        value: count,
        display: formatNumber(count),
        onClick: () => setOutcome(o ?? 'pending'),
      }
    })
  }, [siteVisits])

  /* ---------- Analysis: which project turns a visit into a booking ---------- */

  const byProject = useMemo(
    () =>
      projects.map((p) => {
        const visits = siteVisits.filter((v) => v.projectId === p.id)
        const booked = visits.filter((v) => v.outcome === 'booked').length
        const considering = visits.filter((v) => v.outcome === 'considering').length
        const droppedHere = visits.filter((v) => v.outcome === 'dropped').length
        const topObjection = (() => {
          const counts = new Map<string, number>()
          for (const v of visits) {
            if (!v.objection || v.outcome === 'booked') continue
            counts.set(v.objection, (counts.get(v.objection) ?? 0) + 1)
          }
          return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
        })()
        return {
          ...p,
          visits: visits.length,
          booked,
          considering,
          dropped: droppedHere,
          conversion: pct(booked, visits.length),
          topObjection,
        }
      }).sort((a, b) => b.conversion - a.conversion),
    [siteVisits],
  )

  /* ---------- Analysis: visit volume over time ---------- */

  const monthly = useMemo(() => {
    const all = bucketByMonth(siteVisits, (v) => v.scheduledAt, { months: 6 })
    const converted = bucketByMonth(
      siteVisits.filter((v) => v.outcome === 'booked'),
      (v) => v.scheduledAt,
      { months: 6 },
    )
    return all.map((b, i) => ({
      key: b.key,
      label: b.label,
      fullLabel: b.fullLabel,
      value: b.count,
      secondary: `${formatNumber(converted[i]?.count ?? 0)} booked`,
    }))
  }, [siteVisits])

  const columns: Column<SiteVisit>[] = [
    {
      key: 'customer',
      header: 'Customer',
      width: 'w-[22%]',
      render: (v) => {
        const lead = leadsById[v.leadId]
        return (
          <div className="flex items-center gap-2.5">
            <InitialsAvatar name={lead?.name ?? '—'} className="size-7 text-[10px]" />
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-semibold text-slate-900">
                {lead?.name ?? v.leadId}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {lead?.preferredLocation ?? v.leadId}
              </span>
            </span>
          </div>
        )
      },
    },
    {
      key: 'project',
      header: 'Project',
      render: (v) => (
        <span className="whitespace-nowrap font-medium text-slate-800">
          {v.projectName}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Visited',
      render: (v) => (
        <span className="nums whitespace-nowrap text-slate-600">
          {formatDate(v.scheduledAt)}
        </span>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      render: (v) => <StatusPill status={v.outcome ?? 'pending'} />,
    },
    {
      key: 'objection',
      header: 'Objection',
      width: 'w-[20%]',
      render: (v) =>
        v.objection ? (
          <span className="text-[12px] text-amber-700">{v.objection}</span>
        ) : (
          <span className="text-[12px] text-slate-300">—</span>
        ),
    },
    {
      key: 'feedback',
      header: 'Feedback',
      width: 'w-[24%]',
      render: (v) => (
        <span className="block truncate text-[11.5px] text-slate-500">
          {v.feedback ?? 'No written feedback captured'}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Site visits"
          value={formatNumber(siteVisits.length)}
          sub="All attended visits on record"
          icon={MapPin}
          accent="text-kpmg-purple"
          accentBg="bg-kpmg-purple/10"
        />
        <StatTile
          label="Converted to booking"
          value={formatNumber(booked)}
          sub={formatPercentValue((booked / Math.max(1, siteVisits.length)) * 100) + ' of visits'}
          icon={CircleCheck}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Dropped after visit"
          value={formatNumber(dropped)}
          sub="Visited, then went quiet"
          icon={TriangleAlert}
          accent="text-status-danger"
          accentBg="bg-status-danger/10"
          danger={dropped > 0}
        />
        <StatTile
          label="Top objection"
          value={objections[0]?.label ?? '—'}
          sub={
            objections[0]
              ? `${formatNumber(objections[0].count)} visits blocked on it`
              : 'Nothing recorded'
          }
          icon={Target}
          accent="text-amber-600"
          accentBg="bg-amber-50"
        />
      </div>

      <div className="grid gap-4 wide:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <RecordToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search customer, project or objection…"
            resultCount={filtered.length}
            totalCount={siteVisits.length}
            onClear={() => {
              setQuery('')
              setOutcome('all')
              setProject('all')
            }}
            selects={[
              { key: 'outcome', label: 'outcomes', value: outcome, options: OUTCOME_OPTIONS, onChange: setOutcome },
              { key: 'project', label: 'projects', value: project, options: projectOptions, onChange: setProject },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle>Site visits</CardTitle>
              <p className="shrink-0 text-[11.5px] text-slate-400">
                Most recent first
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={filtered}
                columns={columns}
                getRowKey={(v) => v.id}
                onRowClick={(v) => router.push(`/agents/kpmg-dice/console/customers/${v.leadId}`)}
                minWidth="min-w-[760px]"
                emptyLabel="No site visits match this filter."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Why visits stall</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {objections.map((o) => (
              <div key={o.label} className="flex items-center gap-2.5">
                <span className="w-[110px] shrink-0 text-[11px] leading-tight text-slate-600">
                  {o.label}
                </span>
                <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                  <div
                    className="h-full rounded-r-[4px] bg-amber-500"
                    style={{ width: `${Math.max(2, o.pct)}%` }}
                  />
                </div>
                <span className="nums w-[38px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                  {formatNumber(o.count)}
                </span>
              </div>
            ))}
            {objections.length === 0 && (
              <p className="py-6 text-center text-[12px] text-slate-400">
                No objections captured.
              </p>
            )}
            <p className="border-t border-slate-100 pt-2.5 text-[11px] leading-relaxed text-slate-400">
              Counted across visits that did not convert. The Visit Conversion
              Agent turns each of these into a counter-play.
            </p>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Outcome mix</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">Select to filter</p>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={outcomeRows}
              tone="purple"
              labelWidth="w-[82px]"
              valueWidth="w-[38px]"
            />
          </CardContent>
        </Card>
        </div>
      </div>

      {/* ---------- Conversion and cadence ---------- */}
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Conversion by project</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Select a row for the project view
            </p>
          </CardHeader>
          <CardContent>
            <div className="scrollbar-slim overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    {[
                      'Project',
                      'Visits',
                      'Booked',
                      'Considering',
                      'Dropped',
                      'Blocked on',
                      'Conversion',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          'pb-2 pr-3 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 last:pr-0',
                          i > 0 && i < 5 && 'text-right',
                          i === 6 && 'text-right',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byProject.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/agents/kpmg-dice/console/projects/${p.id}`)}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="py-2.5 pr-3">
                        <span className="whitespace-nowrap text-[12.5px] font-semibold text-slate-800">
                          {p.name.replace('Meridian ', '')}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {p.location}
                        </span>
                      </td>
                      <td className="nums py-2.5 pr-3 text-right text-[12.5px] text-slate-700">
                        {formatNumber(p.visits)}
                      </td>
                      <td className="nums py-2.5 pr-3 text-right text-[12.5px] font-semibold text-slate-900">
                        {formatNumber(p.booked)}
                      </td>
                      <td className="nums py-2.5 pr-3 text-right text-[12.5px] text-slate-600">
                        {formatNumber(p.considering)}
                      </td>
                      <td className="nums py-2.5 pr-3 text-right text-[12.5px] text-status-danger">
                        {formatNumber(p.dropped)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="whitespace-nowrap text-[11.5px] text-slate-500">
                          {p.topObjection}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-12 overflow-hidden rounded-full bg-kpmg-teal/15">
                            <span
                              className="block h-full rounded-full bg-kpmg-teal"
                              style={{ width: `${Math.min(100, p.conversion * 2)}%` }}
                            />
                          </span>
                          <span className="nums w-11 text-right text-[12px] font-bold text-slate-900">
                            {formatPercentValue(p.conversion)}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visit cadence</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Last six months
            </p>
          </CardHeader>
          <CardContent>
            <MiniColumns
              points={monthly}
              tone="bg-kpmg-purple"
              caption="Hover a column for visits held and how many converted"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
