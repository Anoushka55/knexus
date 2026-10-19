'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  Clock,
  Crown,
  Lightbulb,
  Loader2,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { useAIService } from '@/lib/kpmg-dice/lib/ai/use-ai-service'
import {
  BACKLOG_THRESHOLD,
  selectRepStats,
  type RepStats,
} from '@/lib/kpmg-dice/lib/selectors/team'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const MEDAL = ['text-amber-500', 'text-slate-400', 'text-amber-700']

export function TeamPerformance() {
  const router = useRouter()
  const leads = useCrmStore((s) => s.leads)
  const bookings = useCrmStore((s) => s.bookings)
  const tasks = useCrmStore((s) => s.tasks)

  const reps = useMemo(
    () => selectRepStats(leads, bookings, tasks),
    [leads, bookings, tasks],
  )

  const [coaching, setCoaching] = useState<
    Record<string, { focus: string; insight: string }>
  >({})
  const [loadingCoaching, setLoadingCoaching] = useState(true)
  const ai = useAIService()

  // One AI call per rep, resolved together so the section fills in at once.
  useEffect(() => {
    let cancelled = false
    setLoadingCoaching(true)

    Promise.all(
      reps.map(async (rep) => {
        const result = await ai.coachRep({
          name: rep.name,
          leadsOwned: rep.leadsOwned,
          openLeads: rep.openLeads,
          backlog: rep.followUpBacklog,
          stalled: rep.stalledLeads,
          conversionPct: rep.conversionPct,
          responseHours: rep.avgResponseHours,
          revenueCr: rep.revenueCr,
          overloaded: rep.overloaded,
        })
        return [rep.id, result] as const
      }),
    ).then((pairs) => {
      if (cancelled) return
      setCoaching(Object.fromEntries(pairs))
      setLoadingCoaching(false)
    })

    return () => {
      cancelled = true
    }
  }, [reps, ai])

  const overloaded = reps.filter((r) => r.overloaded)
  const totalRevenue = reps.reduce((s, r) => s + r.revenueCr, 0)
  const avgResponse =
    Math.round(
      (reps.reduce((s, r) => s + r.avgResponseHours, 0) / (reps.length || 1)) * 10,
    ) / 10
  const maxRevenue = Math.max(...reps.map((r) => r.revenueCr), 1)

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Team revenue"
          value={formatCrore(totalRevenue)}
          sub={`Across ${reps.length} reps`}
          icon={Crown}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Leads owned"
          value={formatNumber(reps.reduce((s, r) => s + r.leadsOwned, 0))}
          sub={`${formatNumber(reps.reduce((s, r) => s + r.openLeads, 0))} still open`}
          icon={UsersRound}
        />
        <StatTile
          label="Avg response time"
          value={`${avgResponse}h`}
          sub="First response to an inbound lead"
          icon={Clock}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
        <StatTile
          label="Reps overloaded"
          value={String(overloaded.length)}
          sub={`Backlog above ${BACKLOG_THRESHOLD} open tasks`}
          icon={TriangleAlert}
          accent="text-status-danger"
          accentBg="bg-status-danger/10"
          danger={overloaded.length > 0}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        {/* Per-rep table */}
        <Card>
          <CardHeader>
            <CardTitle>Rep performance</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Ranked by revenue closed · select a rep to drill in
            </p>
          </CardHeader>
          <CardContent>
            <div className="scrollbar-slim overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    {[
                      'Rep',
                      'Leads',
                      'Hot',
                      'Response',
                      'Backlog',
                      'Visits',
                      'Conv.',
                      'Revenue',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          'pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400',
                          i > 0 && 'text-right',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reps.map((rep, i) => (
                    <tr
                      key={rep.id}
                      onClick={() => router.push(`/agents/kpmg-dice/console/team-performance/${rep.id}`)}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-kpmg-navy text-[11px] font-bold text-white">
                            {rep.initials}
                            {i < 3 && (
                              <Crown
                                className={cn(
                                  'absolute -right-1 -top-1.5 size-3.5',
                                  MEDAL[i],
                                )}
                                fill="currentColor"
                              />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-semibold text-slate-900">
                              {rep.name}
                            </span>
                            <span className="block truncate text-[11px] text-slate-500">
                              {rep.territory}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="nums py-3 text-right text-[12.5px] text-slate-700">
                        {formatNumber(rep.leadsOwned)}
                      </td>
                      <td className="nums py-3 text-right text-[12.5px] text-slate-700">
                        {formatNumber(rep.hotLeads)}
                      </td>
                      <td className="nums py-3 text-right text-[12.5px] text-slate-700">
                        {rep.avgResponseHours}h
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            'nums rounded-md px-1.5 py-0.5 text-[12px] font-bold',
                            rep.overloaded
                              ? 'bg-red-50 text-red-700'
                              : 'text-slate-700',
                          )}
                        >
                          {rep.followUpBacklog}
                        </span>
                      </td>
                      <td className="nums py-3 text-right text-[12.5px] text-slate-700">
                        {formatNumber(rep.siteVisitsBooked)}
                      </td>
                      <td className="nums py-3 text-right text-[12.5px] font-semibold text-slate-700">
                        {formatPercentValue(rep.conversionPct)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="nums text-[12.5px] font-bold text-slate-900">
                            {formatCrore(rep.revenueCr)}
                          </span>
                          <ChevronRight className="size-3.5 shrink-0 text-slate-300" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard — single series, direct labels, no legend needed */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reps.map((rep) => (
              <div key={rep.id} className="flex items-center gap-3">
                <span className="w-[104px] shrink-0 truncate text-[12px] font-medium text-slate-600">
                  {rep.name}
                </span>
                <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                  <div
                    className="h-full rounded-r-[4px] bg-kpmg-blue"
                    style={{ width: `${Math.max(2, (rep.revenueCr / maxRevenue) * 100)}%` }}
                  />
                </div>
                <span className="nums w-[72px] shrink-0 text-right text-[12px] font-bold text-slate-900">
                  {formatCrore(rep.revenueCr)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Coaching insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-4 text-kpmg-violet" />
            AI coaching insights
          </CardTitle>
          {loadingCoaching && (
            <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" />
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {reps.map((rep) => (
              <CoachingCard
                key={rep.id}
                rep={rep}
                insight={coaching[rep.id]}
                onOpen={() => router.push(`/agents/kpmg-dice/console/team-performance/${rep.id}`)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CoachingCard({
  rep,
  insight,
  onOpen,
}: {
  rep: RepStats
  insight?: { focus: string; insight: string }
  onOpen: () => void
}) {
  return (
    <div
      onClick={onOpen}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        'cursor-pointer rounded-xl border p-3.5 transition-colors hover:bg-slate-50/70',
        rep.overloaded ? 'border-status-danger/25 bg-red-50/40' : 'border-slate-200',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-kpmg-navy text-[10.5px] font-bold text-white">
          {rep.initials}
        </span>
        <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-slate-900">
          {rep.name}
        </p>
        {rep.overloaded && (
          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
            Overloaded
          </span>
        )}
      </div>

      {insight && (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-kpmg-violet">
          {insight.focus}
        </p>
      )}
      <p className="mt-1 min-h-[48px] text-[11.5px] leading-relaxed text-slate-600">
        {insight?.insight ?? 'Analysing…'}
      </p>

      <div className="mt-2.5 flex gap-4 border-t border-slate-100 pt-2">
        {[
          ['Backlog', formatNumber(rep.followUpBacklog)],
          ['Stalled', formatNumber(rep.stalledLeads)],
          ['Conv.', formatPercentValue(rep.conversionPct)],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="nums text-[12px] font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
