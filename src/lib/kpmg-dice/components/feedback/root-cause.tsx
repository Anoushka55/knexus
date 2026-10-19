'use client'

import { useState } from 'react'
import { Layers, Loader2, Repeat, Sparkles, TrendingDown } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import {
  CorrelationNote,
  EvidenceList,
  } from './guardrails'
import { Button } from '@/lib/kpmg-dice/components/ui/button'
import { useAIService } from '@/lib/kpmg-dice/lib/ai/use-ai-service'
import { useFeedbackData } from '@/lib/kpmg-dice/lib/selectors/use-feedback-data'
import type { AIRootCauseResult } from '@/lib/kpmg-dice/lib/ai'
import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { STAGE_ORDER, TOUCHPOINT_LABEL, TOUCHPOINT_ORDER } from '@/lib/kpmg-dice/types'
import type { JourneyStage, TouchpointId } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Root Cause Intelligence Engine.
 *
 * Connects what customers said to where in the journey they said it. The
 * correlation column is the load-bearing caveat: it measures association with
 * detractor scores and nothing more, so the copy says "requires business
 * validation" everywhere it appears rather than implying a cause.
 */

const STAGE_LABEL: Record<JourneyStage, string> = {
  lead: 'Lead',
  engaged: 'Engaged',
  qualified: 'Qualified',
  'site-visit': 'Site Visit',
  proposal: 'Proposal',
  booking: 'Booking',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
}

export function RootCause() {
  const { clusters, journeyHeatmap, responses, byPersona, byProject, issueTrends } =
    useFeedbackData()
  const [selectedId, setSelectedId] = useState(clusters[0]?.id ?? '')

  /*
   * The AI narrative layer, on demand.
   *
   * The clusters themselves are a deterministic rule pass and never change. This
   * asks the model to phrase a HYPOTHESIS over them and name what would have to
   * be checked — which is the one thing a rule pass cannot do, and the reason
   * the live AI mode exists at all.
   */
  const ai = useAIService()
  const [explanation, setExplanation] = useState<AIRootCauseResult | null>(null)
  const [explaining, setExplaining] = useState(false)

  const selected = clusters.find((c) => c.id === selectedId) ?? clusters[0]

  /* Stages that actually carry responses — an empty column teaches nothing. */
  const stages = STAGE_ORDER.filter((stage) =>
    journeyHeatmap.some((c) => c.stage === stage && c.responses > 0),
  )

  const cellFor = (stage: JourneyStage, touchpoint: TouchpointId) =>
    journeyHeatmap.find((c) => c.stage === stage && c.touchpoint === touchpoint)

  const worstDrag = clusters[0]
  const totalAffected = clusters.reduce((s, c) => s + c.affectedResponses, 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Issue clusters"
          value={formatNumber(clusters.length)}
          sub="Grouped from extracted themes"
          icon={Layers}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
        <StatTile
          label="Complaints clustered"
          value={formatNumber(totalAffected)}
          sub={`of ${formatNumber(responses.length)} responses analysed`}
          icon={Repeat}
        />
        <StatTile
          label="Largest NPS drag"
          value={worstDrag ? `${worstDrag.npsDrag}` : '—'}
          sub={worstDrag?.label ?? ''}
          icon={TrendingDown}
          danger
        />
        <StatTile
          label="Strongest association"
          value={worstDrag ? worstDrag.correlation.toFixed(2) : '—'}
          sub="Diagnostic only, not causal"
          icon={Layers}
          accent="text-amber-600"
          accentBg="bg-amber-50"
        />
      </div>

      {/* Journey heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Journey heatmap — NPS by stage and touchpoint</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="w-full min-w-[620px] border-separate border-spacing-[2px]">
              <thead>
                <tr>
                  <th className="pb-1 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Touchpoint
                  </th>
                  {stages.map((stage) => (
                    <th
                      key={stage}
                      className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {STAGE_LABEL[stage]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOUCHPOINT_ORDER.map((touchpoint) => (
                  <tr key={touchpoint}>
                    <td className="pr-2 text-[11.5px] text-slate-600">
                      {TOUCHPOINT_LABEL[touchpoint]}
                    </td>
                    {stages.map((stage) => {
                      const cell = cellFor(stage, touchpoint)
                      if (!cell) {
                        return (
                          <td key={stage}>
                            <div className="rounded-md bg-slate-50 py-2 text-center text-[11px] text-slate-300">
                              —
                            </div>
                          </td>
                        )
                      }
                      // Sequential single hue on detractor share, and the value
                      // is printed in every cell so colour is never the only cue.
                      const intensity = Math.min(1, cell.detractorPct / 60)
                      return (
                        <td key={stage}>
                          <div
                            title={`${formatNumber(cell.responses)} responses · NPS ${cell.nps} · ${cell.detractorPct}% detractors`}
                            className="rounded-md py-2 text-center"
                            style={{
                              backgroundColor: `rgba(220, 38, 38, ${
                                0.05 + intensity * 0.4
                              })`,
                            }}
                          >
                            <span className="nums text-[12px] font-bold text-slate-800">
                              {cell.nps}
                            </span>
                            <span className="nums block text-[9.5px] text-slate-500">
                              n={formatNumber(cell.responses)}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Cell shows NPS for that stage and touchpoint; shading is the
            detractor share. Hover for the full breakdown.
          </p>
        </CardContent>
      </Card>

      {/*
        Segment comparison.

        The brief asks Root Cause for a project and persona comparison. Persona
        is the more actionable half: a developer can change how it sells to a
        segment far faster than it can change a delivered project.
      */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Satisfaction by buyer persona</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul>
              {byPersona.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-slate-900">
                      {row.label}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {formatNumber(row.responses)} responses
                      {row.topComplaint ? ` · worst on ${row.topComplaint}` : ''}
                    </p>
                  </div>
                  <span className="nums shrink-0 text-[11.5px] text-slate-500">
                    {row.detractorPct}% detr.
                  </span>
                  <span
                    className={cn(
                      'nums shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-bold',
                      row.nps < 20
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-100 text-slate-700',
                    )}
                  >
                    {row.nps > 0 ? '+' : ''}
                    {row.nps}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Satisfaction by project</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul>
              {byProject.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-slate-900">
                      {row.label}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {formatNumber(row.responses)} responses
                      {row.topComplaint ? ` · worst on ${row.topComplaint}` : ''}
                    </p>
                  </div>
                  <span className="nums shrink-0 text-[11.5px] text-slate-500">
                    CSAT {row.csat}
                  </span>
                  <span
                    className={cn(
                      'nums shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-bold',
                      row.nps < 20
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-100 text-slate-700',
                    )}
                  >
                    {row.nps > 0 ? '+' : ''}
                    {row.nps}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/*
        Repeat-issue trend.

        Complaint volume per theme, month by month. A count says an issue is
        common; only the direction of travel says whether anything is working.
      */}
      <Card>
        <CardHeader>
          <CardTitle>Repeat-issue trend</CardTitle>
          <span className="text-[10.5px] font-medium text-slate-400">
            Complaints per month, worsening first
          </span>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Issue
                  </th>
                  {(issueTrends[0]?.points ?? []).map((pt) => (
                    <th
                      key={pt.month}
                      className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {pt.month}
                    </th>
                  ))}
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {issueTrends.map((series) => {
                  const peak = Math.max(
                    ...series.points.map((pt) => pt.mentions),
                    1,
                  )
                  return (
                    <tr key={series.themeId}>
                      <td className="py-1.5 pr-3 text-[12px] text-slate-700">
                        {series.label}
                      </td>
                      {series.points.map((pt) => (
                        <td key={pt.month} className="py-1.5 pl-1.5">
                          <div
                            className="rounded-md py-1 text-center"
                            style={{
                              backgroundColor: `rgba(220, 38, 38, ${
                                0.05 + (pt.mentions / peak) * 0.35
                              })`,
                            }}
                          >
                            <span className="nums text-[11.5px] font-semibold text-slate-800">
                              {pt.mentions}
                            </span>
                          </div>
                        </td>
                      ))}
                      <td className="py-1.5 pl-2 text-right">
                        <span
                          className={cn(
                            'nums text-[12px] font-bold',
                            series.change > 0
                              ? 'text-red-600'
                              : series.change < 0
                                ? 'text-kpmg-teal'
                                : 'text-slate-400',
                          )}
                        >
                          {series.change > 0 ? '+' : ''}
                          {series.change}
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

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Clusters */}
        <Card className="flex min-w-0 flex-col">
          <CardHeader>
            <CardTitle>Issue clusters, worst drag first</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul>
              {clusters.map((cluster) => (
                <li key={cluster.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(cluster.id)
                      setExplanation(null)
                    }}
                    className={cn(
                      'w-full border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0',
                      cluster.id === selected?.id
                        ? 'bg-kpmg-blue/[0.06]'
                        : 'hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[12.5px] font-semibold text-slate-900">
                        {cluster.label}
                      </p>
                      <span className="nums shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[11.5px] font-bold text-red-700">
                        {cluster.npsDrag} NPS
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {STAGE_LABEL[cluster.journeyStage]} ·{' '}
                      {TOUCHPOINT_LABEL[cluster.touchpoint]} ·{' '}
                      {formatNumber(cluster.repeatCount)} complaint
                      {cluster.repeatCount === 1 ? '' : 's'} ·{' '}
                      {cluster.projectIds.length} project
                      {cluster.projectIds.length === 1 ? '' : 's'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Drill-down */}
        {selected && (
          <Card className="flex min-w-0 flex-col">
            <CardHeader>
              <CardTitle className="min-w-0 truncate">{selected.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'NPS drag', value: `${selected.npsDrag}` },
                  {
                    label: 'Complaints',
                    value: formatNumber(selected.affectedResponses),
                  },
                  {
                    label: 'Association',
                    value: selected.correlation.toFixed(2),
                  },
                ].map((figure) => (
                  <div
                    key={figure.label}
                    className="rounded-lg bg-slate-50 px-2.5 py-2"
                  >
                    <p className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
                      {figure.label}
                    </p>
                    <p className="nums mt-0.5 text-[15px] font-bold text-slate-800">
                      {figure.value}
                    </p>
                  </div>
                ))}
              </div>

              <CorrelationNote value={selected.correlation} />

              {explanation ? (
                <div className="rounded-lg border border-kpmg-violet/25 bg-kpmg-violet/[0.04] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-kpmg-violet">
                      <Sparkles className="size-3" />
                      Hypothesis
                    </p>
                    <span className="nums text-[10.5px] font-semibold text-slate-400">
                      {explanation.confidence}% confidence
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-700">
                    {explanation.hypothesis}
                  </p>
                  {explanation.correlates.length > 0 && (
                    <>
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Validate before treating as a cause
                      </p>
                      <ul className="mt-1 space-y-1">
                        {explanation.correlates.map((c, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-slate-400" />
                            <span className="text-[11.5px] leading-snug text-slate-600">
                              {c}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={explaining}
                  onClick={async () => {
                    setExplaining(true)
                    try {
                      setExplanation(
                        await ai.explainRootCause({
                          theme: selected.label,
                          journeyStage: STAGE_LABEL[selected.journeyStage],
                          touchpoint: TOUCHPOINT_LABEL[selected.touchpoint],
                          affectedResponses: selected.affectedResponses,
                          npsDrag: selected.npsDrag,
                          correlation: selected.correlation,
                          evidence: selected.evidence,
                        }),
                      )
                    } finally {
                      setExplaining(false)
                    }
                  }}
                >
                  {explaining ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Reasoning...
                    </>
                  ) : (
                    <>
                      <Sparkles />
                      Explain this cluster
                    </>
                  )}
                </Button>
              )}

              <EvidenceList
                spans={selected.evidence}
                label="Representative responses"
              />

              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Concentrated at
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-slate-700">
                  {STAGE_LABEL[selected.journeyStage]} stage ·{' '}
                  {TOUCHPOINT_LABEL[selected.touchpoint]} touchpoint
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
