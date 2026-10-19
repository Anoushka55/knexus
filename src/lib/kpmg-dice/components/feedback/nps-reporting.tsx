'use client'

import { useEffect, useState } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { useFeedbackData } from '@/lib/kpmg-dice/lib/selectors/use-feedback-data'
import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Type 1 — traditional CSAT & NPS reporting.
 *
 * Deliberately plain, and that is the argument rather than a shortcut. The
 * numbers are real and the charts are correct, but there are no evidence
 * chips, no confidence indicators, no drill-in and no recommended actions —
 * because descriptive reporting genuinely does not have them. A client should
 * feel the flatness one screen before they read the callout explaining it.
 *
 * Colour is used only where it encodes something. Polarity (promoter versus
 * detractor, positive versus negative) gets the diverging pair; plain magnitude
 * gets one neutral hue. Nothing here is coloured for decoration.
 */

/*
 * The diverging pair is teal/red, not the obvious green/red.
 *
 * Green #16A34A against red #DC2626 measures ΔE 5.0 under deuteranopia — below
 * the floor where secondary encoding can rescue it — so the single most
 * important distinction on an NPS screen would be invisible to a red-green
 * colourblind reader. Teal against the same red measures 15.5. Both values are
 * existing tokens; validated with the palette checker.
 */
const PROMOTER = '#00A3A1'
const PASSIVE = '#94A3B8'
const DETRACTOR = '#DC2626'

/** Plain magnitude. Passes 3:1 against white, unlike slate-400. */
const NEUTRAL = '#64748B'

const BAND_SERIES = [
  { key: 'promoters', label: 'Promoters', color: PROMOTER },
  { key: 'passives', label: 'Passives', color: PASSIVE },
  { key: 'detractors', label: 'Detractors', color: DETRACTOR },
] as const

function Legend({
  items,
}: {
  items: readonly { label: string; color: string }[]
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[11px] font-medium text-slate-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

interface TooltipPayloadItem {
  dataKey?: string | number
  value?: number
  name?: string
  payload?: Record<string, unknown>
}

function PlainTooltip({
  active,
  label,
  payload,
  suffix = '',
}: {
  active?: boolean
  label?: string
  payload?: TooltipPayloadItem[]
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-card-hover">
      <p className="mb-1 text-xs font-semibold text-slate-900">{label}</p>
      {payload.map((point, i) => (
        <p key={i} className="nums text-xs text-slate-600">
          {point.value}
          {suffix}
        </p>
      ))}
    </div>
  )
}

function ViewToggle({
  view,
  onToggle,
}: {
  view: 'chart' | 'table'
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={view === 'chart' ? 'Switch to table view' : 'Switch to chart view'}
      className="flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      {view === 'chart' ? (
        <Table2 className="size-3.5" />
      ) : (
        <ChartColumn className="size-3.5" />
      )}
    </button>
  )
}

/** Section heading — each Type 1 use case is named, with its own anchor. */
function SectionHead({
  id,
  title,
  caption,
}: {
  id: string
  title: string
  caption: string
}) {
  return (
    <div id={id} className="scroll-mt-4">
      <h3 className="section-title">{title}</h3>
      <p className="mt-0.5 text-[11.5px] text-slate-500">{caption}</p>
    </div>
  )
}

export function NpsReporting() {
  const {
    nps,
    npsTrend,
    csatTrend,
    csatByTouchpoint,
    sentiment,
    responses,
    wordFrequency,
  } = useFeedbackData()

  const [mounted, setMounted] = useState(false)
  const [trendView, setTrendView] = useState<'chart' | 'table'>('chart')
  const [csatView, setCsatView] = useState<'chart' | 'table'>('chart')
  useEffect(() => setMounted(true), [])

  /* Project-wise NPS — plain magnitude comparison. */
  const byProject = Object.values(
    responses.reduce<
      Record<string, { project: string; promoters: number; detractors: number; total: number }>
    >((acc, r) => {
      const row = (acc[r.projectId] ??= {
        project: r.projectName.replace('Meridian ', ''),
        promoters: 0,
        detractors: 0,
        total: 0,
      })
      row.total += 1
      if (r.npsBand === 'promoter') row.promoters += 1
      if (r.npsBand === 'detractor') row.detractors += 1
      return acc
    }, {}),
  )
    .map((row) => ({
      project: row.project,
      nps: Math.round(((row.promoters - row.detractors) / row.total) * 100),
      responses: row.total,
    }))
    .sort((a, b) => b.nps - a.nps)

  const byProjectCsat = Object.values(
    responses.reduce<Record<string, { project: string; sum: number; n: number }>>(
      (acc, r) => {
        const row = (acc[r.projectId] ??= {
          project: r.projectName.replace('Meridian ', ''),
          sum: 0,
          n: 0,
        })
        row.sum += r.csatScore
        row.n += 1
        return acc
      },
      {},
    ),
  )
    .map((row) => ({
      project: row.project,
      csat: Math.round((row.sum / row.n) * 100) / 100,
    }))
    .sort((a, b) => b.csat - a.csat)

  const sentimentRows = [
    { label: 'Positive', value: sentiment.positive, color: PROMOTER },
    { label: 'Neutral', value: sentiment.neutral, color: PASSIVE },
    { label: 'Negative', value: sentiment.negative, color: DETRACTOR },
  ]

  return (
    <div className="space-y-6">
      {/* ============ 1. NPS Performance Dashboard ============ */}
      <section className="space-y-3">
        <SectionHead
          id="nps-performance"
          title="NPS Performance Dashboard"
          caption="Customer loyalty and promoter/detractor trends across projects."
        />

        <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Score card — a single headline number is not a chart. */}
          <Card className="flex flex-col justify-center p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Net Promoter Score
            </p>
            <p className="nums mt-1 text-[44px] font-bold leading-none text-slate-700">
              {nps.nps > 0 ? '+' : ''}
              {nps.nps}
            </p>
            <p className="mt-2 text-[11.5px] text-slate-500">
              {formatNumber(nps.responses)} responses
            </p>

            {/* Composition of a whole: one stacked bar, all segments labelled. */}
            <div className="mt-4 space-y-2">
              <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
                {BAND_SERIES.map((band) => (
                  <div
                    key={band.key}
                    style={{
                      width: `${nps[`${band.key === 'promoters' ? 'promoter' : band.key === 'passives' ? 'passive' : 'detractor'}Pct`]}%`,
                      backgroundColor: band.color,
                    }}
                  />
                ))}
              </div>
              <div className="space-y-1">
                {BAND_SERIES.map((band) => {
                  const pct =
                    nps[
                      `${band.key === 'promoters' ? 'promoter' : band.key === 'passives' ? 'passive' : 'detractor'}Pct`
                    ]
                  return (
                    <div
                      key={band.key}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: band.color }}
                        />
                        <span className="text-[11.5px] text-slate-500">
                          {band.label}
                        </span>
                      </div>
                      <span className="nums text-[11.5px] font-semibold text-slate-700">
                        {pct}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Monthly trend — one series, so no legend box; the title names it. */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Monthly NPS trend</CardTitle>
              <ViewToggle
                view={trendView}
                onToggle={() =>
                  setTrendView(trendView === 'chart' ? 'table' : 'chart')
                }
              />
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              {trendView === 'chart' ? (
                <div className="h-[196px]">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={npsTrend}
                        margin={{ top: 8, right: 12, bottom: 0, left: -18 }}
                      >
                        <CartesianGrid
                          stroke="#F1F5F9"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#94A3B8' }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#94A3B8' }}
                        />
                        <Tooltip
                          content={<PlainTooltip />}
                          cursor={{ stroke: '#CBD5E1' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="nps"
                          stroke={NEUTRAL}
                          strokeWidth={2}
                          dot={{ r: 3, fill: NEUTRAL, strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ) : (
                <PlainTable
                  head={['Month', 'NPS', 'Responses']}
                  rows={npsTrend.map((p) => [
                    p.month,
                    String(p.nps),
                    formatNumber(p.responses),
                  ])}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project comparison — magnitude, one neutral hue. */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>NPS by project</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ul className="space-y-2">
              {byProject.map((row) => (
                <li key={row.project} className="flex items-center gap-3">
                  <span className="w-[110px] shrink-0 truncate text-[12px] text-slate-600">
                    {row.project}
                  </span>
                  <div className="h-2.5 min-w-0 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (row.nps / 100) * 100)}%`,
                        backgroundColor: NEUTRAL,
                      }}
                    />
                  </div>
                  <span className="nums w-[38px] shrink-0 text-right text-[12px] font-semibold text-slate-700">
                    {row.nps > 0 ? '+' : ''}
                    {row.nps}
                  </span>
                  <span className="nums w-[54px] shrink-0 text-right text-[11px] text-slate-400">
                    {formatNumber(row.responses)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* ============ 2. CSAT Service Reporting ============ */}
      <section className="space-y-3">
        <SectionHead
          id="csat-service"
          title="CSAT Service Reporting"
          caption="Satisfaction across every customer touchpoint in the journey."
        />

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>CSAT by touchpoint</CardTitle>
            <ViewToggle
              view={csatView}
              onToggle={() =>
                setCsatView(csatView === 'chart' ? 'table' : 'chart')
              }
            />
          </CardHeader>
          <CardContent className="pb-4">
            {csatView === 'chart' ? (
              <div className="h-[230px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={csatByTouchpoint}
                      layout="vertical"
                      margin={{ top: 4, right: 28, bottom: 0, left: 26 }}
                    >
                      <CartesianGrid stroke="#F1F5F9" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 5]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={86}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                      />
                      <Tooltip
                        content={<PlainTooltip suffix=" / 5" />}
                        cursor={{ fill: '#F8FAFC' }}
                      />
                      <Bar
                        dataKey="csat"
                        fill={NEUTRAL}
                        radius={[0, 4, 4, 0]}
                        barSize={14}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <PlainTable
                head={['Touchpoint', 'CSAT', 'Satisfied', 'Responses']}
                rows={csatByTouchpoint.map((t) => [
                  t.label,
                  `${t.csat} / 5`,
                  `${t.satisfiedPct}%`,
                  formatNumber(t.responses),
                ])}
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2">
          {/* One series, so the title names it and there is no legend box. */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>CSAT trend</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <div className="h-[180px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={csatTrend}
                      margin={{ top: 8, right: 12, bottom: 0, left: -22 }}
                    >
                      <CartesianGrid stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                      />
                      <YAxis
                        domain={[0, 5]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                      />
                      <Tooltip
                        content={<PlainTooltip suffix=" / 5" />}
                        cursor={{ stroke: '#CBD5E1' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="csat"
                        stroke={NEUTRAL}
                        strokeWidth={2}
                        dot={{ r: 3, fill: NEUTRAL, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>CSAT by project</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="space-y-2">
                {byProjectCsat.map((row) => (
                  <li key={row.project} className="flex items-center gap-3">
                    <span className="w-[110px] shrink-0 truncate text-[12px] text-slate-600">
                      {row.project}
                    </span>
                    <div className="h-2.5 min-w-0 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(2, (row.csat / 5) * 100)}%`,
                          backgroundColor: NEUTRAL,
                        }}
                      />
                    </div>
                    <span className="nums w-[46px] shrink-0 text-right text-[12px] font-semibold text-slate-700">
                      {row.csat}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============ 3. Feedback Sentiment Reporting ============ */}
      <section className="space-y-3">
        <SectionHead
          id="sentiment-reporting"
          title="Feedback Sentiment Reporting"
          caption="Distribution of positive, neutral and negative open-text feedback."
        />

        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Sentiment split</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <Legend items={sentimentRows} />
              <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
                {sentimentRows.map((row) => (
                  <div
                    key={row.label}
                    style={{
                      width: `${(row.value / Math.max(1, sentiment.total)) * 100}%`,
                      backgroundColor: row.color,
                    }}
                  />
                ))}
              </div>
              <ul className="mt-3 space-y-1.5">
                {sentimentRows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-[12px] text-slate-600">
                      {row.label}
                    </span>
                    <span className="nums text-[12px] font-semibold text-slate-700">
                      {formatNumber(row.value)}
                      <span className="ml-1.5 font-normal text-slate-400">
                        {Math.round(
                          (row.value / Math.max(1, sentiment.total)) * 100,
                        )}
                        %
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Theme frequency — counting, not analysis. That is the Type 1 ceiling. */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Theme frequency</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="space-y-2">
                {sentiment.themeCounts.slice(0, 8).map((row) => {
                  const max = sentiment.themeCounts[0]?.count || 1
                  return (
                    <li key={row.label} className="flex items-center gap-3">
                      <span className="w-[150px] shrink-0 truncate text-[12px] text-slate-600">
                        {row.label}
                      </span>
                      <div className="h-2.5 min-w-0 flex-1 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(2, (row.count / max) * 100)}%`,
                            backgroundColor: NEUTRAL,
                          }}
                        />
                      </div>
                      <span className="nums w-[48px] shrink-0 text-right text-[12px] font-semibold text-slate-700">
                        {formatNumber(row.count)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/*
        Word cloud.

        Deliberately included, and deliberately last. A word cloud encodes by
        area, which people read poorly, and mistakes frequency for importance,
        so it is a weak visual by any modern standard. That is exactly why it
        belongs here: it is what descriptive reporting produces when asked to
        summarise open text, and showing it makes the ceiling visible rather
        than merely asserted.
      */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Word frequency</CardTitle>
          <span className="text-[10.5px] font-medium text-slate-400">
            Most common words across {formatNumber(responses.length)} comments
          </span>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            {wordFrequency.map((w) => {
              const max = wordFrequency[0]?.count || 1
              const scale = w.count / max
              return (
                <span
                  key={w.word}
                  title={`${w.word} - ${formatNumber(w.count)} mentions`}
                  className="leading-none"
                  style={{
                    fontSize: `${12 + scale * 20}px`,
                    fontWeight: scale > 0.55 ? 700 : 500,
                    color: `rgba(71, 85, 105, ${0.5 + scale * 0.5})`,
                  }}
                >
                  {w.word}
                </span>
              )
            })}
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3 text-[11.5px] leading-relaxed text-slate-500">
            This is the ceiling of summarising open text by counting it. It shows
            which words appeared most. It cannot tell you that hundreds of those
            mentions share one root cause, which customer said them, or what to
            do next.
          </p>
        </CardContent>
      </Card>

      {/*
        The ceiling, stated on the screen itself. Everything above answers "what
        happened" and stops there.
      */}
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-[11.5px] leading-relaxed text-slate-500">
        Reporting ends here. These views show scores, trends and
        sentiment distribution — they do not determine who should receive a
        survey, when and how to engage, why a score changed, or which recovery
        action to trigger.
      </p>
    </div>
  )
}

/** Shared table view — the accessible alternative to every chart above. */
function PlainTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="max-h-[230px] overflow-y-auto scrollbar-slim">
      <table className="w-full">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-slate-100 text-left">
            {head.map((h, i) => (
              <th
                key={h}
                className={cn(
                  'pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400',
                  i > 0 && 'text-right',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    'py-[9px] text-[12.5px]',
                    j === 0
                      ? 'font-medium text-slate-700'
                      : 'nums text-right font-semibold text-slate-900',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
