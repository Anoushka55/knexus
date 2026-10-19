'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  IndianRupee,
  Lightbulb,
  Loader2,
  Target,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { DataTable, type Column } from '@/lib/kpmg-dice/components/shared/data-table'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { EvidencePill, IntentPill, StagePill } from '@/lib/kpmg-dice/components/shared/pills'
import { BreakdownList, type BreakdownRow } from '@/lib/kpmg-dice/components/shared/breakdown-list'
import { useAIService } from '@/lib/kpmg-dice/lib/ai/use-ai-service'
import { BACKLOG_THRESHOLD, selectRepStats } from '@/lib/kpmg-dice/lib/selectors/team'
import { isOpen } from '@/lib/kpmg-dice/lib/selectors/overview'
import { PIPELINE_STAGES, STALL_THRESHOLD_DAYS } from '@/lib/kpmg-dice/lib/selectors/pipeline'
import { median, pct } from '@/lib/kpmg-dice/lib/analysis'

import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatDate, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import type { Lead, SfTask } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'
import { useReference } from '@/lib/kpmg-dice/data/use-reference'

/** Validated ordinal ramp — single hue, monotone lightness. */
const STAGE_RAMP = [
  '#9CC6EC',
  '#7FB3E3',
  '#3D8FD1',
  '#0A6CBA',
  '#00509C',
  '#00338D',
  '#002266',
]

export function RepDetail({ repId }: { repId: string }) {
  const { campaigns } = useReference()
  const router = useRouter()
  const leads = useCrmStore((s) => s.leads)
  const bookings = useCrmStore((s) => s.bookings)
  const tasks = useCrmStore((s) => s.tasks)
  const engagements = useCrmStore((s) => s.engagements)
  const ai = useAIService()

  const reps = useMemo(
    () => selectRepStats(leads, bookings, tasks),
    [leads, bookings, tasks],
  )
  const rep = reps.find((r) => r.id === repId)
  const rank = reps.findIndex((r) => r.id === repId) + 1

  const owned = useMemo(
    () => leads.filter((l) => l.ownerId === repId),
    [leads, repId],
  )

  const openTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.ownerId === repId && t.status === 'Open')
        .sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt)),
    [tasks, repId],
  )

  const stalled = useMemo(
    () =>
      owned
        .filter(
          (l) => isOpen(l) && l.evidence.daysSinceLastActivity > STALL_THRESHOLD_DAYS,
        )
        .sort((a, b) => b.budgetCr - a.budgetCr),
    [owned],
  )

  const byStage = useMemo(() => {
    const counts = PIPELINE_STAGES.map(({ stage, label }) => ({
      label,
      count: owned.filter((l) => l.stage === stage).length,
      valueCr: owned
        .filter((l) => l.stage === stage)
        .reduce((s, l) => s + l.budgetCr, 0),
    }))
    const max = Math.max(...counts.map((c) => c.count), 1)
    return counts.map((c, i) => ({
      ...c,
      valueCr: Math.round(c.valueCr),
      pct: (c.count / max) * 100,
      color: STAGE_RAMP[i],
      onColor: i >= 3 ? ('light' as const) : ('dark' as const),
    }))
  }, [owned])

  const sourceMix = useMemo(() => {
    const totals = new Map<string, number>()
    for (const l of owned) {
      totals.set(l.sourceCampaignId, (totals.get(l.sourceCampaignId) ?? 0) + 1)
    }
    const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const max = rows[0]?.[1] ?? 1
    return rows.map(([id, count]) => ({
      id,
      name: campaigns.find((c) => c.id === id)?.name ?? id,
      count,
      pct: (count / max) * 100,
    }))
  }, [owned])

  /* ---------- How this rep's book compares with the team ---------- */

  const comparison = useMemo(() => {
    if (!rep) return []
    const others = reps.filter((r) => r.id !== repId)
    const teamMedian = (get: (r: (typeof reps)[number]) => number) =>
      Math.round(median(others.map(get)) * 10) / 10

    const rows = [
      {
        label: 'Conversion rate',
        mine: formatPercentValue(rep.conversionPct),
        team: formatPercentValue(teamMedian((r) => r.conversionPct)),
        delta: Math.round((rep.conversionPct - teamMedian((r) => r.conversionPct)) * 10) / 10,
        goodWhenUp: true,
        unit: 'pts',
      },
      {
        label: 'Response time',
        mine: `${rep.avgResponseHours}h`,
        team: `${teamMedian((r) => r.avgResponseHours)}h`,
        delta:
          Math.round((rep.avgResponseHours - teamMedian((r) => r.avgResponseHours)) * 10) / 10,
        goodWhenUp: false,
        unit: 'h',
      },
      {
        label: 'Follow-up backlog',
        mine: formatNumber(rep.followUpBacklog),
        team: formatNumber(teamMedian((r) => r.followUpBacklog)),
        delta: Math.round(rep.followUpBacklog - teamMedian((r) => r.followUpBacklog)),
        goodWhenUp: false,
        unit: 'tasks',
      },
      {
        label: 'Stalled share of open book',
        mine: formatPercentValue(pct(rep.stalledLeads, rep.openLeads)),
        team: formatPercentValue(
          teamMedian((r) => pct(r.stalledLeads, r.openLeads)),
        ),
        delta:
          Math.round(
            (pct(rep.stalledLeads, rep.openLeads) -
              teamMedian((r) => pct(r.stalledLeads, r.openLeads))) *
              10,
          ) / 10,
        goodWhenUp: false,
        unit: 'pts',
      },
      {
        label: 'Revenue per lead owned',
        mine: formatCrore(rep.revenueCr / Math.max(1, rep.leadsOwned), {
          decimals: 2,
        }),
        team: formatCrore(
          teamMedian((r) => r.revenueCr / Math.max(1, r.leadsOwned)),
          { decimals: 2 },
        ),
        delta:
          Math.round(
            (rep.revenueCr / Math.max(1, rep.leadsOwned) -
              teamMedian((r) => r.revenueCr / Math.max(1, r.leadsOwned))) *
              100,
          ) / 100,
        goodWhenUp: true,
        unit: 'Cr',
      },
    ]
    return rows
  }, [rep, reps, repId])

  /* ---------- Evidence quality of the book they hold ---------- */

  const evidenceRows: BreakdownRow[] = useMemo(() => {
    const order = [
      ['strong-evidence', 'Strong'],
      ['supported', 'Supported'],
      ['weak-evidence', 'Weak'],
      ['unverified', 'Unverified'],
      ['contradicted', 'Contradicted'],
    ] as const
    return order.map(([key, label]) => {
      const count = owned.filter((l) => l.evidenceStatus === key).length
      return {
        key,
        label,
        caption: `${formatPercentValue(pct(count, owned.length), 0)} of the book`,
        value: count,
        display: formatNumber(count),
      }
    })
  }, [owned])

  /* ---------- How they actually reach customers ---------- */

  const activityRows: BreakdownRow[] = useMemo(() => {
    const ids = new Set(owned.map((l) => l.id))
    const mine = engagements.filter((e) => ids.has(e.leadId))
    const labels: Record<string, string> = {
      call: 'Call',
      email: 'Email',
      whatsapp: 'WhatsApp',
      website: 'Website',
      'site-visit': 'Site visit',
    }
    const counts = new Map<string, { total: number; outbound: number }>()
    for (const e of mine) {
      const entry = counts.get(e.channel) ?? { total: 0, outbound: 0 }
      entry.total += 1
      if (e.direction === 'outbound') entry.outbound += 1
      counts.set(e.channel, entry)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([channel, v]) => ({
        key: channel,
        label: labels[channel] ?? channel,
        caption: `${formatPercentValue(pct(v.outbound, v.total), 0)} outbound`,
        value: v.total,
        display: formatNumber(v.total),
      }))
  }, [owned, engagements])

  const [coaching, setCoaching] = useState<{ focus: string; insight: string }>()
  const [loadingCoaching, setLoadingCoaching] = useState(true)

  useEffect(() => {
    if (!rep) return
    let cancelled = false
    setLoadingCoaching(true)

    ai.coachRep({
      name: rep.name,
      leadsOwned: rep.leadsOwned,
      openLeads: rep.openLeads,
      backlog: rep.followUpBacklog,
      stalled: rep.stalledLeads,
      conversionPct: rep.conversionPct,
      responseHours: rep.avgResponseHours,
      revenueCr: rep.revenueCr,
      overloaded: rep.overloaded,
    }).then((result) => {
      if (cancelled) return
      setCoaching(result)
      setLoadingCoaching(false)
    })

    return () => {
      cancelled = true
    }
  }, [rep, ai])

  if (!rep) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-[15px] font-semibold text-slate-700">
          No rep found for {repId}
        </p>
        <Link
          href="/agents/kpmg-dice/console/team-performance"
          className="text-[13px] font-semibold text-kpmg-blue hover:underline"
        >
          Back to Team Performance
        </Link>
      </Card>
    )
  }

  const stalledValueCr = Math.round(stalled.reduce((s, l) => s + l.budgetCr, 0))
  const teamAvgConversion =
    Math.round(
      (reps.reduce((s, r) => s + r.conversionPct, 0) / reps.length) * 10,
    ) / 10

  const leadColumns: Column<Lead>[] = [
    {
      key: 'lead',
      header: 'Lead',
      width: 'w-[28%]',
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
      key: 'idle',
      header: 'Last touch',
      align: 'right',
      render: (l) => (
        <span
          className={cn(
            'nums whitespace-nowrap',
            l.evidence.daysSinceLastActivity > STALL_THRESHOLD_DAYS
              ? 'font-semibold text-dice-status-danger'
              : 'text-slate-600',
          )}
        >
          {l.evidence.daysSinceLastActivity}d ago
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

  const taskColumns: Column<SfTask>[] = [
    {
      key: 'subject',
      header: 'Task',
      width: 'w-[46%]',
      render: (t) => (
        <span className="block min-w-0">
          <span className="block truncate text-[12.5px] font-medium text-slate-800">
            {t.subject}
          </span>
          <span className="block truncate text-[11px] text-slate-500">
            {t.whatId}
          </span>
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => (
        <span
          className={cn(
            'inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
            t.priority === 'High'
              ? 'bg-red-50 text-red-700'
              : t.priority === 'Normal'
                ? 'bg-slate-100 text-slate-600'
                : 'bg-slate-50 text-slate-400',
          )}
        >
          {t.priority}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Raised by',
      render: (t) => (
        <span className="whitespace-nowrap text-[12px] text-slate-500">
          {t.createdBy}
        </span>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (t) => (
        <span className="nums whitespace-nowrap text-slate-600">
          {formatDate(t.dueAt)}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-fade-in space-y-4">
      <Link
        href="/agents/kpmg-dice/console/team-performance"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-3.5" />
        Back to Team Performance
      </Link>

      {/* ---------- Header ---------- */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-kpmg-navy text-xl font-bold text-white">
              {rep.initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
                  {rep.name}
                </h2>
                {rep.overloaded && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                    Overloaded
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12.5px] text-slate-500">
                {rep.territory} · rank {rank} of {reps.length} by revenue closed
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              ['Conversion', formatPercentValue(rep.conversionPct)],
              ['Team average', formatPercentValue(teamAvgConversion)],
              ['Response', `${rep.avgResponseHours}h`],
              ['Site visits', formatNumber(rep.siteVisitsBooked)],
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
          label="Leads owned"
          value={formatNumber(rep.leadsOwned)}
          sub={`${formatNumber(rep.openLeads)} still open`}
          icon={UsersRound}
        />
        <StatTile
          label="Revenue closed"
          value={formatCrore(rep.revenueCr)}
          sub={`${formatNumber(rep.conversions)} closed won`}
          icon={IndianRupee}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Follow-up backlog"
          value={formatNumber(rep.followUpBacklog)}
          sub={`Threshold is ${BACKLOG_THRESHOLD} open tasks`}
          icon={Clock}
          accent={rep.overloaded ? 'text-dice-status-danger' : 'text-kpmg-blue'}
          accentBg={rep.overloaded ? 'bg-dice-status-danger/10' : 'bg-kpmg-blue/10'}
          danger={rep.overloaded}
        />
        <StatTile
          label="Stalled deals"
          value={formatNumber(stalled.length)}
          sub={`${formatCrore(stalledValueCr)} untouched over ${STALL_THRESHOLD_DAYS} days`}
          icon={TriangleAlert}
          accent="text-amber-600"
          accentBg="bg-amber-50"
        />
      </div>

      {/* ---------- Coaching ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-4 text-kpmg-violet" />
            AI coaching insight
          </CardTitle>
          {loadingCoaching && (
            <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" />
          )}
        </CardHeader>
        <CardContent>
          {coaching ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-kpmg-violet">
                {coaching.focus}
              </p>
              <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-slate-700">
                {coaching.insight}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-slate-400">
              Analysing this rep&rsquo;s book…
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---------- Pipeline shape + sources ---------- */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Where this rep&rsquo;s book sits</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Leads at each stage today
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {byStage.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-[82px] shrink-0 text-[11.5px] text-slate-600">
                  {s.label}
                </span>
                <div className="h-6 min-w-0 flex-1">
                  {/* minWidth keeps the in-bar count readable at tiny stages. */}
                  <div
                    className="flex h-full items-center rounded-r-[4px] px-2"
                    style={{
                      width: `${Math.max(4, s.pct)}%`,
                      minWidth: '48px',
                      backgroundColor: s.color,
                    }}
                  >
                    <span
                      className={cn(
                        'nums text-[11.5px] font-bold',
                        s.onColor === 'light' ? 'text-white' : 'text-slate-900',
                      )}
                    >
                      {formatNumber(s.count)}
                    </span>
                  </div>
                </div>
                <span className="nums w-[64px] shrink-0 text-right text-[11.5px] text-slate-500">
                  {formatCrore(s.valueCr)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where the leads came from</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {sourceMix.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => router.push(`/agents/kpmg-dice/console/campaign-analytics/${s.id}`)}
                className="flex w-full items-center gap-2.5 rounded-md text-left transition-colors hover:bg-slate-50"
              >
                <span className="w-[134px] shrink-0 truncate text-[11px] text-slate-600">
                  {s.name}
                </span>
                <span className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                  <span
                    className="block h-full rounded-r-[4px] bg-kpmg-blue"
                    style={{ width: `${Math.max(2, s.pct)}%` }}
                  />
                </span>
                <span className="nums w-[46px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                  {formatNumber(s.count)}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ---------- Comparison, book quality and reach ---------- */}
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Against the team</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Median of the other {reps.length - 1} reps
            </p>
          </CardHeader>
          <CardContent>
            <div className="scrollbar-slim overflow-x-auto">
              <table className="w-full min-w-[380px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    {['Measure', rep.initials, 'Team', 'Gap'].map((h, i) => (
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
                  {comparison.map((c) => {
                    const good = c.goodWhenUp ? c.delta > 0 : c.delta < 0
                    const flat = c.delta === 0
                    return (
                      <tr
                        key={c.label}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-2.5 pr-3 text-[12px] text-slate-700">
                          {c.label}
                        </td>
                        <td className="nums py-2.5 pr-3 text-right text-[12.5px] font-bold text-slate-900">
                          {c.mine}
                        </td>
                        <td className="nums py-2.5 pr-3 text-right text-[12.5px] text-slate-500">
                          {c.team}
                        </td>
                        <td
                          className={cn(
                            'nums py-2.5 text-right text-[12px] font-semibold',
                            flat
                              ? 'text-slate-400'
                              : good
                                ? 'text-emerald-700'
                                : 'text-dice-status-danger',
                          )}
                        >
                          {c.delta > 0 ? '+' : ''}
                          {c.delta} {c.unit}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence behind the book</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={evidenceRows}
              tone="navy"
              labelWidth="w-[86px]"
              valueWidth="w-[48px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How they reach customers</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={activityRows}
              tone="violet"
              labelWidth="w-[82px]"
              valueWidth="w-[48px]"
              emptyLabel="No interactions logged against this book."
            />
          </CardContent>
        </Card>
      </div>

      {/* ---------- Backlog ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-kpmg-blue" />
            Open follow-up tasks
          </CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Earliest due date first
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={openTasks}
            columns={taskColumns}
            getRowKey={(t) => t.id}
            onRowClick={(t) => router.push(`/agents/kpmg-dice/console/customers/${t.whatId}`)}
            minWidth="min-w-[720px]"
            pageSize={8}
            emptyLabel="This rep has no open tasks."
          />
        </CardContent>
      </Card>

      {/* ---------- Owned book ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Owned leads</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Stalled deals first, then by score
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={[...owned].sort((a, b) => {
              const stalledRank = (l: Lead) =>
                isOpen(l) &&
                l.evidence.daysSinceLastActivity > STALL_THRESHOLD_DAYS
                  ? 0
                  : 1
              if (stalledRank(a) !== stalledRank(b))
                return stalledRank(a) - stalledRank(b)
              return b.score - a.score
            })}
            columns={leadColumns}
            getRowKey={(l) => l.id}
            onRowClick={(l) => router.push(`/agents/kpmg-dice/console/customers/${l.id}`)}
            minWidth="min-w-[940px]"
            pageSize={10}
            emptyLabel="This rep owns no leads."
          />
        </CardContent>
      </Card>
    </div>
  )
}
