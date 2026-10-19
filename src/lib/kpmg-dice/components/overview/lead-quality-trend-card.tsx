'use client'

import { useEffect, useState } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import type { TrendPoint } from '@/lib/kpmg-dice/lib/selectors/overview'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Two conversion percentages share ONE axis — never a second y-scale, which
 * would invent a correlation the data does not contain.
 */
const SERIES = [
  {
    key: 'leadToSiteVisit' as const,
    label: 'Lead to Site Visit %',
    color: '#005EB8',
  },
  {
    key: 'leadToBooking' as const,
    label: 'Lead to Booking %',
    color: '#00A3A1',
  },
]

const SURFACE = '#FFFFFF'

interface TooltipPayloadItem {
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
  payload?: TooltipPayloadItem[]
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-card-hover">
      <p className="mb-1.5 text-xs font-semibold text-slate-900">{label}</p>
      {SERIES.map((series) => {
        const point = payload.find((p) => p.dataKey === series.key)
        if (!point) return null
        return (
          <div
            key={series.key}
            className="flex items-center gap-2 text-xs leading-5"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            <span className="text-slate-500">{series.label}</span>
            <span className="nums ml-auto font-semibold text-slate-900">
              {point.value}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Direct label on the final point only — never a number on every point. */
function EndLabel({
  x,
  y,
  value,
  index,
  lastIndex,
}: {
  x?: number
  y?: number
  value?: number
  index?: number
  lastIndex?: number
}) {
  if (index !== lastIndex || x == null || y == null) return null
  return (
    <text
      x={x}
      y={y - 12}
      textAnchor="middle"
      className="fill-slate-700 text-[11px] font-bold"
    >
      {value}%
    </text>
  )
}

function TrendTable({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[236px] overflow-y-auto scrollbar-slim">
      <table className="w-full">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-slate-100 text-left">
            <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Month
            </th>
            {SERIES.map((s) => (
              <th
                key={s.key}
                className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month} className="border-b border-slate-50 last:border-0">
              <td className="py-[9px] text-[12.5px] font-medium text-slate-700">
                {row.month}
              </td>
              <td className="nums py-[9px] text-right text-[12.5px] font-semibold text-slate-900">
                {row.leadToSiteVisit}%
              </td>
              <td className="nums py-[9px] text-right text-[12.5px] font-semibold text-slate-900">
                {row.leadToBooking}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function LeadQualityTrendCard({ data }: { data: TrendPoint[] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  // Recharts measures its container, so hold the plot back until after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="min-w-0">
          Lead Quality &amp; Conversion Trend
        </CardTitle>

        {/* Compact controls — a segmented toggle plus a bordered select left the
            title only enough room to wrap onto three lines. */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
            aria-label={
              view === 'chart' ? 'Switch to table view' : 'Switch to chart view'
            }
            className="flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {view === 'chart' ? (
              <Table2 className="size-3.5" />
            ) : (
              <ChartColumn className="size-3.5" />
            )}
          </button>

          <select
            aria-label="Time range"
            defaultValue="6m"
            className="h-7 cursor-pointer rounded-md border-0 bg-transparent pl-1 pr-0.5 text-[11px] font-medium text-slate-500 outline-none hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-kpmg-blue/30"
          >
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
            <option value="ytd">Year to date</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        {/* Legend — always present for two or more series */}
        <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {SERIES.map((series) => (
            <div key={series.key} className="flex items-center gap-1.5">
              <span
                className="h-[3px] w-4 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              <span className="text-xs font-medium text-slate-600">
                {series.label}
              </span>
            </div>
          ))}
        </div>

        {view === 'table' ? (
          <TrendTable data={data} />
        ) : (
          <div className="h-[236px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 18, right: 22, bottom: 4, left: -14 }}
                >
                  <CartesianGrid
                    stroke="#F1F5F9"
                    strokeWidth={1}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    dy={4}
                  />
                  <YAxis
                    domain={[0, 8]}
                    ticks={[0, 2, 4, 6, 8]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickFormatter={(v: number) => `${v}%`}
                    width={46}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                  />
                  {SERIES.map((series) => (
                    <Line
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      name={series.label}
                      stroke={series.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      // ≥8px marker with a 2px surface ring
                      dot={{
                        r: 4,
                        fill: series.color,
                        stroke: SURFACE,
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: series.color,
                        stroke: SURFACE,
                        strokeWidth: 2,
                      }}
                      label={<EndLabel lastIndex={data.length - 1} />}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="size-full animate-pulse rounded-lg bg-slate-50" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
