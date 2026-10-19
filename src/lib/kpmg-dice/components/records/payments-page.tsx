'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleCheck, Clock, CreditCard, TriangleAlert } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { DataTable, type Column } from '@/lib/kpmg-dice/components/shared/data-table'
import { RecordToolbar } from '@/lib/kpmg-dice/components/shared/record-toolbar'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { StatusPill } from '@/lib/kpmg-dice/components/shared/pills'
import { BreakdownList, type BreakdownRow } from '@/lib/kpmg-dice/components/shared/breakdown-list'
import { MiniColumns } from '@/lib/kpmg-dice/components/shared/mini-columns'
import { bucketByMonth, pct } from '@/lib/kpmg-dice/lib/analysis'
import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatDate, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import type { Payment } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'
import { useReference } from '@/lib/kpmg-dice/data/use-reference'

const STATUS_OPTIONS = ['paid', 'due', 'overdue'].map((s) => ({
  value: s,
  label: s,
}))

/** Days past due, for the ageing buckets. */
function daysOverdue(payment: Payment) {
  return Math.round(
    (DEMO_NOW.getTime() - new Date(payment.dueAt).getTime()) / 86_400_000,
  )
}

const AGEING_BUCKETS = [
  { label: '1–30 days', min: 1, max: 30 },
  { label: '31–60 days', min: 31, max: 60 },
  { label: '61–90 days', min: 61, max: 90 },
  { label: '90+ days', min: 91, max: Infinity },
]

export function PaymentsPage() {
  const { reps } = useReference()
  const router = useRouter()
  const payments = useCrmStore((s) => s.payments)
  const leadsById = useCrmStore((s) => s.leadsById)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const ordered = useMemo(
    () =>
      [...payments].sort((a, b) => {
        // Overdue first, then by due date.
        const rank = (p: Payment) =>
          p.status === 'overdue' ? 0 : p.status === 'due' ? 1 : 2
        if (rank(a) !== rank(b)) return rank(a) - rank(b)
        return +new Date(a.dueAt) - +new Date(b.dueAt)
      }),
    [payments],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ordered.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (!q) return true
      const lead = leadsById[p.leadId]
      return (
        p.milestone.toLowerCase().includes(q) ||
        p.bookingId.toLowerCase().includes(q) ||
        (lead?.name.toLowerCase().includes(q) ?? false)
      )
    })
  }, [ordered, query, status, leadsById])

  const totals = useMemo(() => {
    const scheduled = payments.reduce((s, p) => s + p.amountCr, 0)
    const collected = payments
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.amountCr, 0)
    const overdue = payments
      .filter((p) => p.status === 'overdue')
      .reduce((s, p) => s + p.amountCr, 0)
    return {
      scheduled: Math.round(scheduled),
      collected: Math.round(collected),
      overdue: Math.round(overdue),
      overdueCount: payments.filter((p) => p.status === 'overdue').length,
      rate: scheduled ? (collected / scheduled) * 100 : 0,
    }
  }, [payments])

  const ageing = useMemo(() => {
    const overdue = payments.filter((p) => p.status === 'overdue')
    const rows = AGEING_BUCKETS.map((bucket) => {
      const inBucket = overdue.filter((p) => {
        const d = daysOverdue(p)
        return d >= bucket.min && d <= bucket.max
      })
      return {
        label: bucket.label,
        count: inBucket.length,
        value: Math.round(inBucket.reduce((s, p) => s + p.amountCr, 0)),
      }
    })
    const max = Math.max(...rows.map((r) => r.value), 1)
    return rows.map((r) => ({ ...r, pct: (r.value / max) * 100 }))
  }, [payments])

  /* ---------- Analysis: which milestone stalls ---------- */

  const byMilestone: BreakdownRow[] = useMemo(() => {
    const totals = new Map<
      string,
      { scheduled: number; collected: number; overdue: number; overdueCount: number }
    >()
    for (const p of payments) {
      const entry = totals.get(p.milestone) ?? {
        scheduled: 0,
        collected: 0,
        overdue: 0,
        overdueCount: 0,
      }
      entry.scheduled += p.amountCr
      if (p.status === 'paid') entry.collected += p.amountCr
      if (p.status === 'overdue') {
        entry.overdue += p.amountCr
        entry.overdueCount += 1
      }
      totals.set(p.milestone, entry)
    }
    return [...totals.entries()]
      .sort((a, b) => b[1].overdue - a[1].overdue)
      .map(([milestone, v]) => ({
        key: milestone,
        label: milestone,
        caption: `${formatPercentValue(pct(v.collected, v.scheduled), 0)} collected · ${formatNumber(v.overdueCount)} past due`,
        value: Math.round(v.overdue),
        display: formatCrore(Math.round(v.overdue)),
      }))
  }, [payments])

  /* ---------- Analysis: collection cadence ---------- */

  const monthly = useMemo(() => {
    const collected = bucketByMonth(
      payments.filter((p) => p.paidAt),
      (p) => p.paidAt as string,
      { months: 6, value: (p) => p.amountCr },
    )
    const due = bucketByMonth(payments, (p) => p.dueAt, {
      months: 6,
      value: (p) => p.amountCr,
    })
    return collected.map((m, i) => ({
      key: m.key,
      label: m.label,
      fullLabel: m.fullLabel,
      value: Math.round(m.value),
      secondary: `${formatCrore(Math.round(due[i]?.value ?? 0))} fell due`,
    }))
  }, [payments])

  /* ---------- Analysis: the accounts finance should call first ---------- */

  const worstAccounts = useMemo(() => {
    const byLead = new Map<
      string,
      { overdueCr: number; milestones: number; oldest: number }
    >()
    for (const p of payments) {
      if (p.status !== 'overdue') continue
      const entry = byLead.get(p.leadId) ?? {
        overdueCr: 0,
        milestones: 0,
        oldest: 0,
      }
      entry.overdueCr += p.amountCr
      entry.milestones += 1
      entry.oldest = Math.max(entry.oldest, daysOverdue(p))
      byLead.set(p.leadId, entry)
    }
    return [...byLead.entries()]
      .map(([leadId, v]) => ({ leadId, ...v, lead: leadsById[leadId] }))
      .sort((a, b) => b.overdueCr - a.overdueCr)
      .slice(0, 8)
  }, [payments, leadsById])

  const columns: Column<Payment>[] = [
    {
      key: 'customer',
      header: 'Customer',
      width: 'w-[22%]',
      render: (p) => {
        const lead = leadsById[p.leadId]
        return (
          <div className="flex items-center gap-2.5">
            <InitialsAvatar name={lead?.name ?? '—'} className="size-7 text-[10px]" />
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-semibold text-slate-900">
                {lead?.name ?? p.leadId}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {p.bookingId}
              </span>
            </span>
          </div>
        )
      },
    },
    {
      key: 'milestone',
      header: 'Milestone',
      width: 'w-[26%]',
      render: (p) => (
        <span className="font-medium text-slate-800">{p.milestone}</span>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      render: (p) => (
        <span className="nums whitespace-nowrap text-slate-600">
          {formatDate(p.dueAt)}
        </span>
      ),
    },
    {
      key: 'ageing',
      header: 'Ageing',
      render: (p) =>
        p.status === 'overdue' ? (
          <span className="nums whitespace-nowrap font-semibold text-status-danger">
            {daysOverdue(p)}d late
          </span>
        ) : p.status === 'paid' ? (
          <span className="nums whitespace-nowrap text-slate-400">
            {p.paidAt ? formatDate(p.paidAt) : '—'}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <StatusPill status={p.status} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (p) => (
        <span className="nums font-bold text-slate-900">
          {formatCrore(p.amountCr, { decimals: 2 })}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Scheduled"
          value={formatCrore(totals.scheduled)}
          sub={`${formatNumber(payments.length)} milestones`}
          icon={CreditCard}
        />
        <StatTile
          label="Collected"
          value={formatCrore(totals.collected)}
          sub={`${formatPercentValue(totals.rate)} collection rate`}
          icon={CircleCheck}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Overdue"
          value={formatCrore(totals.overdue)}
          sub={`${formatNumber(totals.overdueCount)} milestones past due`}
          icon={TriangleAlert}
          accent="text-status-danger"
          accentBg="bg-status-danger/10"
          danger
        />
        <StatTile
          label="Oldest bucket"
          value={
            [...ageing].reverse().find((a) => a.count > 0)?.label ?? 'None'
          }
          sub="Longest-outstanding ageing band"
          icon={Clock}
          accent="text-amber-600"
          accentBg="bg-amber-50"
        />
      </div>

      <div className="grid gap-4 wide:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <RecordToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search customer, milestone or booking ID…"
            resultCount={filtered.length}
            totalCount={payments.length}
            onClear={() => {
              setQuery('')
              setStatus('all')
            }}
            selects={[
              { key: 'status', label: 'statuses', value: status, options: STATUS_OPTIONS, onChange: setStatus },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle>Payment schedule</CardTitle>
              <p className="shrink-0 text-[11.5px] text-slate-400">
                Overdue first, then by due date
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={filtered}
                columns={columns}
                getRowKey={(p) => p.id}
                onRowClick={(p) => router.push(`/agents/kpmg-dice/console/customers/${p.leadId}`)}
                minWidth="min-w-[760px]"
                emptyLabel="No payment milestones match this filter."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Overdue ageing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {ageing.map((a) => (
              <div key={a.label} className="flex items-center gap-2.5">
                <span className="w-[76px] shrink-0 text-[11px] text-slate-600">
                  {a.label}
                </span>
                <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                  <div
                    className="h-full rounded-r-[4px] bg-status-danger"
                    style={{ width: `${Math.max(a.value ? 2 : 0, a.pct)}%` }}
                  />
                </div>
                <span className="nums w-[58px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                  {formatCrore(a.value)}
                </span>
              </div>
            ))}
            <p className="border-t border-slate-100 pt-2.5 text-[11px] leading-relaxed text-slate-400">
              Ageing is measured against the milestone due date at the demo
              clock. The Payment Assistant raises the finance callback.
            </p>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Overdue by milestone</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList rows={byMilestone} tone="danger" layout="stacked" />
          </CardContent>
        </Card>
        </div>
      </div>

      {/* ---------- Cadence and the accounts to call ---------- */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Card>
          <CardHeader>
            <CardTitle>Collection cadence</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Cash received, last six months
            </p>
          </CardHeader>
          <CardContent>
            <MiniColumns
              points={monthly}
              tone="bg-kpmg-teal"
              valueLabel={(v) => formatCrore(v)}
              caption="Hover a column for cash received against what fell due"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accounts to chase first</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Ranked by outstanding value
            </p>
          </CardHeader>
          <CardContent>
            <div className="scrollbar-slim overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    {['Customer', 'Owner', 'Milestones', 'Oldest', 'Outstanding'].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={cn(
                            'pb-2 pr-3 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 last:pr-0',
                            i > 1 && 'text-right',
                          )}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {worstAccounts.map((a) => (
                    <tr
                      key={a.leadId}
                      onClick={() => router.push(`/agents/kpmg-dice/console/customers/${a.leadId}`)}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <InitialsAvatar
                            name={a.lead?.name ?? '—'}
                            className="size-7 text-[10px]"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-semibold text-slate-900">
                              {a.lead?.name ?? a.leadId}
                            </span>
                            <span className="block truncate text-[11px] text-slate-500">
                              {a.lead?.preferredLocation ?? a.leadId}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-[12px] text-slate-500">
                        {reps.find((r) => r.id === a.lead?.ownerId)?.name ?? '—'}
                      </td>
                      <td className="nums py-2.5 pr-3 text-right text-[12.5px] text-slate-700">
                        {a.milestones}
                      </td>
                      <td className="nums py-2.5 pr-3 text-right text-[12.5px] font-semibold text-status-danger">
                        {a.oldest}d
                      </td>
                      <td className="nums py-2.5 text-right text-[12.5px] font-bold text-slate-900">
                        {formatCrore(a.overdueCr, { decimals: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
