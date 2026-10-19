'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartColumn,
  ChevronRight,
  IndianRupee,
  Rocket,
  Table2,
  Target,
  TrendingDown,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { TrendArrow } from '@/lib/kpmg-dice/components/shared/delta'
import { selectCampaignRows, type CampaignRow } from '@/lib/kpmg-dice/lib/selectors/overview'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/** Three percentage series on ONE axis — never a second y-scale. */
const SERIES = [
  { key: 'qualifiedPct' as const, label: 'Qualified %', color: '#005EB8' },
  { key: 'siteVisitPct' as const, label: 'Site visit %', color: '#00A3A1' },
  { key: 'bookingRate' as const, label: 'Booking rate %', color: '#C6007E' },
]

const RECOMMENDATION_STYLE = {
  Scale: { chip: 'bg-emerald-50 text-emerald-700', icon: Rocket },
  Optimise: { chip: 'bg-amber-50 text-amber-700', icon: Target },
  Pause: { chip: 'bg-red-50 text-red-700', icon: TrendingDown },
} as const

interface TooltipItem {
  dataKey?: string | number
  value?: number
}

function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean
  label?: string
  payload?: TooltipItem[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-card-hover">
      <p className="mb-1.5 text-xs font-semibold text-slate-900">{label}</p>
      {SERIES.map((s) => {
        const point = payload.find((p) => p.dataKey === s.key)
        if (!point) return null
        return (
          <div key={s.key} className="flex items-center gap-2 text-xs leading-5">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-slate-500">{s.label}</span>
            <span className="nums ml-auto font-semibold text-slate-900">
              {point.value}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ComparisonTable({ rows }: { rows: CampaignRow[] }) {
  return (
    <div className="scrollbar-slim h-[300px] overflow-y-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-slate-100 text-left">
            <th className="pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
              Campaign
            </th>
            {SERIES.map((s) => (
              <th
                key={s.key}
                className="pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-slate-400"
              >
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-50 last:border-0">
              <td className="py-2 text-[12px] font-medium text-slate-700">
                {row.name}
              </td>
              {SERIES.map((s) => (
                <td
                  key={s.key}
                  className="nums py-2 text-right text-[12px] font-semibold text-slate-900"
                >
                  {formatPercentValue(row[s.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CampaignAnalytics() {
  const router = useRouter()
  const leads = useCrmStore((s) => s.leads)
  const suppressed = useCrmStore((s) => s.suppressedCampaignIds)
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const rows = useMemo(() => selectCampaignRows(leads), [leads])

  const totals = useMemo(() => {
    const spendLakh = rows.reduce((s, r) => s + r.spendLakh, 0)
    const totalLeads = rows.reduce((s, r) => s + r.leads, 0)
    const totalBookings = rows.reduce((s, r) => s + r.bookings, 0)
    return {
      spendCr: Math.round((spendLakh / 100) * 10) / 10,
      totalLeads,
      totalBookings,
      blendedBookingRate:
        Math.round((totalBookings / totalLeads) * 1000) / 10,
      costPerBookingLakh:
        Math.round((spendLakh / Math.max(1, totalBookings)) * 10) / 10,
    }
  }, [rows])

  // Chart data keeps the same order as the table so colour never re-maps.
  const chartData = rows.map((r) => ({
    name: r.name.length > 15 ? `${r.name.slice(0, 14)}…` : r.name,
    qualifiedPct: r.qualifiedPct,
    siteVisitPct: r.siteVisitPct,
    bookingRate: r.bookingRate,
  }))

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Total spend"
          value={formatCrore(totals.spendCr, { decimals: 1 })}
          sub={`Across ${rows.length} sources`}
          icon={IndianRupee}
        />
        <StatTile
          label="Leads generated"
          value={formatNumber(totals.totalLeads)}
          sub={`${formatNumber(totals.totalBookings)} became bookings`}
          icon={ChartColumn}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Blended booking rate"
          value={formatPercentValue(totals.blendedBookingRate)}
          sub="Bookings ÷ all leads"
          icon={Target}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
        <StatTile
          label="Cost per booking"
          value={`₹${totals.costPerBookingLakh} L`}
          sub="Blended across every source"
          icon={IndianRupee}
          accent="text-kpmg-magenta"
          accentBg="bg-kpmg-magenta/10"
        />
      </div>

      {/* Comparison chart */}
      <Card>
        <CardHeader>
          <CardTitle>Quality comparison across campaigns</CardTitle>
          <button
            type="button"
            onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
            aria-label={
              view === 'chart' ? 'Switch to table view' : 'Switch to chart view'
            }
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {view === 'chart' ? (
              <Table2 className="size-3.5" />
            ) : (
              <ChartColumn className="size-3.5" />
            )}
          </button>
        </CardHeader>

        <CardContent>
          {/* Legend is always present for two or more series */}
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs font-medium text-slate-600">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {view === 'table' ? (
            <ComparisonTable rows={rows} />
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  // Enough left margin that the rotated first tick label and
                  // the top y-tick both clear the plot edge.
                  margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
                  barGap={2}
                  barCategoryGap="22%"
                >
                  <CartesianGrid stroke="#F1F5F9" strokeWidth={1} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10.5 }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={58}
                    tickMargin={6}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}%`}
                    width={46}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: '#F8FAFC' }}
                  />
                  {SERIES.map((s) => (
                    <Bar
                      key={s.key}
                      dataKey={s.key}
                      name={s.label}
                      fill={s.color}
                      maxBarSize={16}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-campaign detail */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign quality &amp; recommendation</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Scored by the Campaign Quality Analytics Agent · select a row to
            drill in
          </p>
        </CardHeader>
        <CardContent>
          <div className="scrollbar-slim overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  {[
                    'Campaign',
                    'Leads',
                    'Qualified',
                    'Visits',
                    'Bookings',
                    'Cost / lead',
                    'Cost / booking',
                    'Quality',
                    'Recommendation',
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        'pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400',
                        i > 0 && i < 8 && 'text-right',
                        i === 8 && 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const style = RECOMMENDATION_STYLE[row.recommendation]
                  const Icon = style.icon
                  const isSuppressed = suppressed.includes(row.id)

                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        router.push(`/agents/kpmg-dice/console/campaign-analytics/${row.id}`)
                      }
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[12.5px] font-semibold text-slate-800">
                            {row.name}
                          </span>
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
                        <p className="text-[11px] text-slate-400">{row.channel}</p>
                      </td>
                      <td className="nums py-2.5 text-right text-[12.5px] text-slate-700">
                        {formatNumber(row.leads)}
                      </td>
                      <td className="nums py-2.5 text-right text-[12.5px] text-slate-700">
                        {formatPercentValue(row.qualifiedPct)}
                      </td>
                      <td className="nums py-2.5 text-right text-[12.5px] text-slate-700">
                        {formatPercentValue(row.siteVisitPct)}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="nums text-[12.5px] font-semibold text-slate-900">
                            {formatNumber(row.bookings)}
                          </span>
                          <TrendArrow trend={row.trend} />
                        </div>
                      </td>
                      <td className="nums py-2.5 text-right text-[12.5px] text-slate-700">
                        ₹{formatNumber(row.costPerLead)}
                      </td>
                      <td className="nums py-2.5 text-right text-[12.5px] font-semibold text-slate-900">
                        ₹{row.costPerBookingLakh} L
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-kpmg-blue/15">
                            <div
                              className="h-full rounded-full bg-kpmg-blue"
                              style={{ width: `${row.qualityScore}%` }}
                            />
                          </div>
                          <span className="nums w-6 text-right text-[12px] font-bold text-slate-900">
                            {row.qualityScore}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                              style.chip,
                            )}
                          >
                            <Icon className="size-3" strokeWidth={2.4} />
                            {row.recommendation}
                          </span>
                          <ChevronRight className="size-3.5 shrink-0 text-slate-300" />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
