'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Clock, Layers, PauseCircle, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { FilterBar } from '@/lib/kpmg-dice/components/shared/filter-bar'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { useLeadFilters } from '@/lib/kpmg-dice/lib/filters/use-lead-filters'
import {
  selectPipelineTotals,
  selectStageMetrics,
  STALL_THRESHOLD_DAYS,
} from '@/lib/kpmg-dice/lib/selectors/pipeline'
import { formatCrore, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/** Validated ordinal ramp (single hue, monotone lightness) — same as Overview. */
const RAMP = ['#7FB3E3', '#5CA0DA', '#3D8FD1', '#1E7BC5', '#0A6CBA', '#00509C', '#00338D']

export function PipelineDashboard() {
  const router = useRouter()
  const { filters, setFilter, clearFilters, filtered, activeCount, totalCount } =
    useLeadFilters()

  const stages = useMemo(() => selectStageMetrics(filtered), [filtered])
  const totals = useMemo(() => selectPipelineTotals(filtered), [filtered])

  const maxValue = Math.max(...stages.map((s) => s.valueCr), 1)

  return (
    <div className="animate-fade-in space-y-4">
      <FilterBar
        filters={filters}
        setFilter={setFilter}
        clearFilters={clearFilters}
        activeCount={activeCount}
        resultCount={filtered.length}
        totalCount={totalCount}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Open pipeline"
          value={formatNumber(totals.openLeads)}
          sub={`${formatCrore(totals.openValueCr)} total value`}
          icon={Layers}
        />
        <StatTile
          label="Weighted value"
          value={formatCrore(totals.weightedValueCr)}
          sub="Probability-weighted by stage"
          icon={TrendingUp}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Stalled deals"
          value={formatNumber(totals.stalledCount)}
          sub={`${formatCrore(totals.stalledValueCr)} · no contact in ${STALL_THRESHOLD_DAYS}+ days`}
          icon={PauseCircle}
          accent="text-dice-status-danger"
          accentBg="bg-dice-status-danger/10"
          danger
        />
        <StatTile
          label="Avg cycle time"
          value={`${totals.avgCycleDays} days`}
          sub="Lead created to closed won"
          icon={Clock}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
      </div>

      {/* Stage table */}
      <Card>
        <CardHeader>
          <CardTitle>Stage-by-stage pipeline</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Velocity is the mean gap in lead age between consecutive stages ·
            select a stage for the leads behind it
          </p>
        </CardHeader>
        <CardContent>
          <div className="scrollbar-slim overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  {[
                    'Stage',
                    'At stage',
                    'Reached',
                    'Conversion',
                    'Value',
                    'Weighted',
                    'Velocity',
                    'Stalled',
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
                {stages.map((s, i) => (
                  <tr
                    key={s.stage}
                    onClick={() => router.push(`/agents/kpmg-dice/console/leads?stage=${s.stage}`)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: RAMP[i] }}
                        />
                        <span className="text-[12.5px] font-semibold text-slate-800">
                          {s.label}
                        </span>
                      </div>
                    </td>
                    <td className="nums py-2.5 text-right text-[12.5px] font-semibold text-slate-900">
                      {formatNumber(s.count)}
                    </td>
                    <td className="nums py-2.5 text-right text-[12.5px] text-slate-600">
                      {formatNumber(s.reachedCount)}
                    </td>
                    <td className="nums py-2.5 text-right text-[12.5px] font-semibold text-slate-700">
                      {s.conversionPct === null
                        ? '—'
                        : formatPercentValue(s.conversionPct)}
                    </td>
                    <td className="nums py-2.5 text-right text-[12.5px] text-slate-700">
                      {formatCrore(s.valueCr)}
                    </td>
                    <td className="nums py-2.5 text-right text-[12.5px] font-semibold text-kpmg-teal">
                      {formatCrore(s.weightedValueCr)}
                    </td>
                    <td className="nums py-2.5 text-right text-[12.5px] text-slate-700">
                      {s.velocityDays === null ? '—' : `${s.velocityDays}d`}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        {s.stalledCount > 0 ? (
                          <span className="nums text-[12.5px] font-semibold text-dice-status-danger">
                            {formatNumber(s.stalledCount)}
                          </span>
                        ) : (
                          <span className="text-[12.5px] text-slate-300">—</span>
                        )}
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

      {/* Value distribution + stalled breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline value by stage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {/* Single series → one hue, direct value labels, no legend needed */}
            {stages.map((s, i) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="w-[86px] shrink-0 text-[11.5px] font-medium text-slate-600">
                  {s.label}
                </span>
                <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                  <div
                    className="h-full rounded-r-[4px]"
                    style={{
                      width: `${Math.max(1, (s.valueCr / maxValue) * 100)}%`,
                      backgroundColor: RAMP[i],
                    }}
                  />
                </div>
                <span className="nums w-[74px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                  {formatCrore(s.valueCr)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where deals are stalling</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              No contact in {STALL_THRESHOLD_DAYS}+ days
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stages
                .filter((s) => s.stalledCount > 0)
                .sort((a, b) => b.stalledValueCr - a.stalledValueCr)
                .map((s) => (
                  <li
                    key={s.stage}
                    onClick={() => router.push(`/agents/kpmg-dice/console/leads?stage=${s.stage}`)}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-slate-800">
                        {s.label}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatNumber(s.stalledCount)} of{' '}
                        {formatNumber(s.count)} leads stalled
                      </p>
                    </div>
                    <span className="nums shrink-0 text-[13px] font-bold text-dice-status-danger">
                      {formatCrore(s.stalledValueCr)}
                    </span>
                  </li>
                ))}
              {stages.every((s) => s.stalledCount === 0) && (
                <li className="py-8 text-center text-[12.5px] text-slate-400">
                  No stalled deals in this slice.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
