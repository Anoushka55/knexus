'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleCheck, Headset, LifeBuoy, TimerOff } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { DataTable, type Column } from '@/lib/kpmg-dice/components/shared/data-table'
import { RecordToolbar } from '@/lib/kpmg-dice/components/shared/record-toolbar'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { SeverityPill, StatusPill } from '@/lib/kpmg-dice/components/shared/pills'
import { BreakdownList, type BreakdownRow } from '@/lib/kpmg-dice/components/shared/breakdown-list'
import { daysBetween, median, pct } from '@/lib/kpmg-dice/lib/analysis'
import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatDate, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import type { ServiceTicket, Severity } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved'].map((s) => ({
  value: s,
  label: s.replace('-', ' '),
}))

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'info'].map((s) => ({
  value: s,
  label: s,
}))

/** Positive = days already past SLA, negative = days of headroom left. */
function slaDays(ticket: ServiceTicket) {
  return Math.round(
    (DEMO_NOW.getTime() - new Date(ticket.slaDueAt).getTime()) / 86_400_000,
  )
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  info: 3,
}

export function ServiceTicketsPage() {
  const resolveServiceTicket = useCrmStore((s) => s.resolveServiceTicket)
  const router = useRouter()
  const tickets = useCrmStore((s) => s.serviceTickets)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [severity, setSeverity] = useState('all')

  /** Open work first, most-breached first — the queue a service lead works down. */
  const ordered = useMemo(
    () =>
      [...tickets].sort((a, b) => {
        const openRank = (t: ServiceTicket) => (t.status === 'resolved' ? 1 : 0)
        if (openRank(a) !== openRank(b)) return openRank(a) - openRank(b)
        if (slaDays(a) !== slaDays(b)) return slaDays(b) - slaDays(a)
        return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      }),
    [tickets],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ordered.filter((t) => {
      if (status !== 'all' && t.status !== status) return false
      if (severity !== 'all' && t.severity !== severity) return false
      if (!q) return true
      return (
        t.customerName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      )
    })
  }, [ordered, query, status, severity])

  const open = tickets.filter((t) => t.status !== 'resolved')
  const breached = open.filter((t) => slaDays(t) > 0)
  const resolved = tickets.filter((t) => t.status === 'resolved')

  /** Median resolution time, in days, across resolved tickets. */
  const medianResolution = useMemo(() => {
    const spans = resolved
      .filter((t) => t.resolvedAt)
      .map(
        (t) =>
          (new Date(t.resolvedAt as string).getTime() -
            new Date(t.openedAt).getTime()) /
          86_400_000,
      )
      .sort((a, b) => a - b)
    if (!spans.length) return 0
    return Math.round(spans[Math.floor(spans.length / 2)])
  }, [resolved])

  const byCategory = useMemo(() => {
    const totals = new Map<string, { total: number; breached: number }>()
    for (const t of tickets) {
      const entry = totals.get(t.category) ?? { total: 0, breached: 0 }
      entry.total += 1
      if (t.status !== 'resolved' && slaDays(t) > 0) entry.breached += 1
      totals.set(t.category, entry)
    }
    const rows = [...totals.entries()].sort((a, b) => b[1].total - a[1].total)
    const max = rows[0]?.[1].total ?? 1
    return rows.map(([name, v]) => ({
      name,
      ...v,
      pct: (v.total / max) * 100,
    }))
  }, [tickets])

  /* ---------- Analysis: SLA performance by severity ---------- */

  const bySeverity = useMemo(() => {
    const order: Severity[] = ['critical', 'high', 'medium', 'info']
    return order
      .map((sev) => {
        const all = tickets.filter((t) => t.severity === sev)
        const openHere = all.filter((t) => t.status !== 'resolved')
        const breachedHere = openHere.filter((t) => slaDays(t) > 0)
        const closed = all.filter((t) => t.resolvedAt)
        return {
          severity: sev,
          total: all.length,
          open: openHere.length,
          breached: breachedHere.length,
          breachRate: pct(breachedHere.length, openHere.length),
          medianDays: Math.round(
            median(
              closed.map((t) => daysBetween(t.openedAt, t.resolvedAt as string)),
            ),
          ),
          worstDays: openHere.reduce((m, t) => Math.max(m, slaDays(t)), 0),
        }
      })
      .filter((r) => r.total > 0)
  }, [tickets])

  /* ---------- Analysis: how long resolution actually takes ---------- */

  const resolutionBands: BreakdownRow[] = useMemo(() => {
    const closed = tickets.filter((t) => t.resolvedAt)
    const bands = [
      { key: 'same', label: 'Same day', min: 0, max: 1 },
      { key: '1-3', label: '1–3 days', min: 1, max: 4 },
      { key: '4-7', label: '4–7 days', min: 4, max: 8 },
      { key: '8-14', label: '8–14 days', min: 8, max: 15 },
      { key: '15', label: '15+ days', min: 15, max: Infinity },
    ]
    return bands.map((b) => {
      const inBand = closed.filter((t) => {
        const d = daysBetween(t.openedAt, t.resolvedAt as string)
        return d >= b.min && d < b.max
      })
      return {
        key: b.key,
        label: b.label,
        caption: `${formatPercentValue(pct(inBand.length, closed.length), 0)} of resolved tickets`,
        value: inBand.length,
        display: formatNumber(inBand.length),
      }
    })
  }, [tickets])

  const columns: Column<ServiceTicket>[] = [
    {
      key: 'ticket',
      header: 'Ticket',
      width: 'w-[30%]',
      render: (t) => (
        <span className="block min-w-0">
          <span className="block truncate text-[12.5px] font-semibold text-slate-900">
            {t.subject}
          </span>
          <span className="block truncate text-[11px] text-slate-500">
            {t.id} · {t.customerName}
          </span>
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (t) => (
        <span className="whitespace-nowrap text-slate-600">{t.category}</span>
      ),
    },
    {
      /*
       * Resolving a ticket is what closes the loop the platform is built on:
       * it flagged that advocacy was at risk, and until now nothing could act
       * on it. Resolving here moves the detractor risk on CSAT & NPS.
       */
      key: 'resolve',
      header: '',
      render: (t) =>
        t.status === 'resolved' ? (
          <span className="whitespace-nowrap text-[11px] font-semibold text-dice-status-success">
            Resolved
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              resolveServiceTicket(
                t.id,
                `${t.subject} closed with the customer.`,
              )
            }}
            className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-kpmg-teal/10 hover:text-kpmg-teal"
          >
            Resolve
          </button>
        ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (t) => <SeverityPill severity={t.severity} />,
    },
    {
      key: 'opened',
      header: 'Opened',
      render: (t) => (
        <span className="nums whitespace-nowrap text-slate-600">
          {formatDate(t.openedAt)}
        </span>
      ),
    },
    {
      key: 'sla',
      header: 'SLA',
      render: (t) => {
        if (t.status === 'resolved') {
          return (
            <span className="nums whitespace-nowrap text-slate-400">
              Closed {t.resolvedAt ? formatDate(t.resolvedAt) : '—'}
            </span>
          )
        }
        const days = slaDays(t)
        return days > 0 ? (
          <span className="nums whitespace-nowrap font-semibold text-dice-status-danger">
            Breached {days}d
          </span>
        ) : (
          <span className="nums whitespace-nowrap text-slate-600">
            {Math.abs(days)}d left
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (t) => <StatusPill status={t.status} />,
    },
  ]

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Open tickets"
          value={formatNumber(open.length)}
          sub={`${formatNumber(tickets.length)} raised in total`}
          icon={LifeBuoy}
        />
        <StatTile
          label="Past SLA"
          value={formatNumber(breached.length)}
          sub="Open tickets beyond target"
          icon={TimerOff}
          accent="text-dice-status-danger"
          accentBg="bg-dice-status-danger/10"
          danger
        />
        <StatTile
          label="Resolved"
          value={formatNumber(resolved.length)}
          sub={`Median ${medianResolution} days to close`}
          icon={CircleCheck}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Top driver"
          value={byCategory[0]?.name ?? '—'}
          sub={
            byCategory[0]
              ? `${formatNumber(byCategory[0].total)} tickets in this category`
              : '—'
          }
          icon={Headset}
          accent="text-kpmg-purple"
          accentBg="bg-kpmg-purple/10"
        />
      </div>

      <div className="grid gap-4 wide:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <RecordToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search subject, customer or ticket ID…"
            resultCount={filtered.length}
            totalCount={tickets.length}
            onClear={() => {
              setQuery('')
              setStatus('all')
              setSeverity('all')
            }}
            selects={[
              { key: 'status', label: 'statuses', value: status, options: STATUS_OPTIONS, onChange: setStatus },
              { key: 'severity', label: 'severities', value: severity, options: SEVERITY_OPTIONS, onChange: setSeverity },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle>Post-sales tickets</CardTitle>
              <p className="shrink-0 text-[11.5px] text-slate-400">
                Open first, most overdue at the top
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={filtered}
                columns={columns}
                getRowKey={(t) => t.id}
                onRowClick={(t) => router.push(`/agents/kpmg-dice/console/customers/${t.leadId}`)}
                minWidth="min-w-[760px]"
                emptyLabel="No tickets match this filter."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Tickets by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {byCategory.map((c) => (
              <div key={c.name} className="flex items-center gap-2.5">
                <span className="w-[86px] shrink-0 truncate text-[11px] text-slate-600">
                  {c.name}
                </span>
                <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                  <div
                    className="h-full rounded-r-[4px] bg-kpmg-purple"
                    style={{ width: `${Math.max(2, c.pct)}%` }}
                  />
                </div>
                <span className="nums w-[52px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                  {c.total}
                  {c.breached > 0 && (
                    <span className="ml-1 text-dice-status-danger">
                      ·{c.breached}
                    </span>
                  )}
                </span>
              </div>
            ))}
            <p className="border-t border-slate-100 pt-2.5 text-[11px] leading-relaxed text-slate-400">
              The red figure counts open tickets in that category already past
              SLA.
            </p>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Time to resolve</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={resolutionBands}
              tone="teal"
              labelWidth="w-[76px]"
              valueWidth="w-[32px]"
            />
          </CardContent>
        </Card>
        </div>
      </div>

      {/* ---------- SLA performance ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>SLA performance by severity</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Critical tickets carry a 3-day target, high 7 days, everything else
            14
          </p>
        </CardHeader>
        <CardContent>
          <div className="scrollbar-slim overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  {[
                    'Severity',
                    'Raised',
                    'Open',
                    'Past SLA',
                    'Breach rate',
                    'Median close',
                    'Worst open',
                  ].map((h, i) => (
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
                {bySeverity.map((r) => (
                  <tr
                    key={r.severity}
                    onClick={() => setSeverity(r.severity)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="py-2.5 pr-3">
                      <SeverityPill severity={r.severity} />
                    </td>
                    <td className="nums py-2.5 pr-3 text-right text-[12.5px] text-slate-700">
                      {formatNumber(r.total)}
                    </td>
                    <td className="nums py-2.5 pr-3 text-right text-[12.5px] text-slate-700">
                      {formatNumber(r.open)}
                    </td>
                    <td className="nums py-2.5 pr-3 text-right text-[12.5px] font-semibold text-dice-status-danger">
                      {formatNumber(r.breached)}
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-dice-status-danger/15">
                          <span
                            className="block h-full rounded-full bg-dice-status-danger"
                            style={{ width: `${r.breachRate}%` }}
                          />
                        </span>
                        <span className="nums w-11 text-right text-[12px] font-bold text-slate-900">
                          {formatPercentValue(r.breachRate, 0)}
                        </span>
                      </span>
                    </td>
                    <td className="nums py-2.5 pr-3 text-right text-[12.5px] text-slate-700">
                      {r.medianDays}d
                    </td>
                    <td className="nums py-2.5 text-right text-[12.5px] font-semibold text-slate-900">
                      {r.worstDays > 0 ? `${r.worstDays}d late` : 'inside SLA'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
