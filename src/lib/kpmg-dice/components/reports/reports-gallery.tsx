'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChartColumn,
  ChevronRight,
  Gauge,
  Download,
  FileText,
  ShieldAlert,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/lib/kpmg-dice/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { riskDigest, useAgentContext } from '@/lib/kpmg-dice/lib/agents'
import { selectCampaignRows, isAtRisk, weightedValueCr } from '@/lib/kpmg-dice/lib/selectors/overview'
import { selectPipelineTotals, selectStageMetrics } from '@/lib/kpmg-dice/lib/selectors/pipeline'
import { selectRepStats } from '@/lib/kpmg-dice/lib/selectors/team'
import {
  selectCsatByTouchpoint,
  selectNpsSummary,
  selectRecoverySummary,
  selectRootCauseClusters,
  selectThemes,
} from '@/lib/kpmg-dice/lib/selectors/feedback'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { DEMO_NOW } from '@/lib/kpmg-dice/data/reference'
import { formatCrore, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

type ReportId =
  | 'pipeline-truth'
  | 'campaign-roi'
  | 'lead-quality'
  | 'at-risk'
  | 'customer-feedback'

interface ReportSection {
  heading: string
  /** Label / value pairs rendered as a figure grid. */
  figures?: { label: string; value: string; danger?: boolean }[]
  /** Simple horizontal bar rows — single series, direct labels. */
  bars?: { label: string; value: number; display: string }[]
  rows?: { cells: string[]; danger?: boolean }[]
  columns?: string[]
  note?: string
}

interface ReportDef {
  id: ReportId
  name: string
  description: string
  icon: LucideIcon
  accent: string
  accentBg: string
}

const REPORTS: ReportDef[] = [
  {
    id: 'pipeline-truth',
    name: 'Daily Pipeline Truth',
    description:
      'What the pipeline actually contains today — stage by stage, with stalled value called out.',
    icon: ChartColumn,
    accent: 'text-kpmg-blue',
    accentBg: 'bg-kpmg-blue/10',
  },
  {
    id: 'campaign-roi',
    name: 'Campaign ROI',
    description:
      'Spend against outcomes for every source, with cost per booking and a scale/pause call.',
    icon: Target,
    accent: 'text-kpmg-teal',
    accentBg: 'bg-kpmg-teal/10',
  },
  {
    id: 'lead-quality',
    name: 'Lead Quality',
    description:
      'How much of the qualified pool is supported by evidence, and how much is inflation.',
    icon: Sparkles,
    accent: 'text-kpmg-violet',
    accentBg: 'bg-kpmg-violet/10',
  },
  {
    id: 'at-risk',
    name: 'At-Risk Revenue',
    description:
      'Weighted exposure across every risk signal, with the reps who own it.',
    icon: ShieldAlert,
    accent: 'text-status-danger',
    accentBg: 'bg-status-danger/10',
  },
  {
    id: 'customer-feedback',
    name: 'Customer Feedback',
    description:
      'NPS and CSAT across the journey, with the themes dragging the score and the recovery still open.',
    icon: Gauge,
    accent: 'text-kpmg-teal',
    accentBg: 'bg-kpmg-teal/10',
  },
]

export function ReportsGallery() {
  const ctx = useAgentContext()
  const bookings = useCrmStore((s) => s.bookings)
  const surveyResponses = useCrmStore((s) => s.surveyResponses)
  const recoveryCases = useCrmStore((s) => s.recoveryCases)
  const [selected, setSelected] = useState<ReportId>('pipeline-truth')

  const sections = useMemo<ReportSection[]>(() => {
    const { leads, tasks } = ctx

    if (selected === 'pipeline-truth') {
      const totals = selectPipelineTotals(leads)
      const stages = selectStageMetrics(leads)
      const maxValue = Math.max(...stages.map((s) => s.valueCr), 1)

      return [
        {
          heading: 'Headline',
          figures: [
            { label: 'Open leads', value: formatNumber(totals.openLeads) },
            { label: 'Open value', value: formatCrore(totals.openValueCr) },
            { label: 'Weighted value', value: formatCrore(totals.weightedValueCr) },
            {
              label: 'Stalled value',
              value: formatCrore(totals.stalledValueCr),
              danger: true,
            },
            { label: 'Avg cycle', value: `${totals.avgCycleDays} days` },
          ],
        },
        {
          heading: 'Value by stage',
          bars: stages.map((s) => ({
            label: s.label,
            value: (s.valueCr / maxValue) * 100,
            display: formatCrore(s.valueCr),
          })),
        },
        {
          heading: 'Stage detail',
          columns: ['Stage', 'At stage', 'Conversion', 'Velocity', 'Stalled'],
          rows: stages.map((s) => ({
            cells: [
              s.label,
              formatNumber(s.count),
              s.conversionPct === null ? '—' : formatPercentValue(s.conversionPct),
              s.velocityDays === null ? '—' : `${s.velocityDays}d`,
              formatNumber(s.stalledCount),
            ],
            danger: s.stalledCount > s.count * 0.25,
          })),
        },
      ]
    }

    if (selected === 'customer-feedback') {
      const nps = selectNpsSummary(surveyResponses)
      const touchpoints = selectCsatByTouchpoint(surveyResponses)
      const themes = selectThemes(surveyResponses)
      const clusters = selectRootCauseClusters(surveyResponses, themes)
      const recovery = selectRecoverySummary(surveyResponses, recoveryCases)
      const maxDrag = Math.max(...clusters.map((c) => Math.abs(c.npsDrag)), 1)

      return [
        {
          heading: 'Headline',
          figures: [
            { label: 'NPS', value: `${nps.nps > 0 ? '+' : ''}${nps.nps}` },
            { label: 'Responses', value: formatNumber(nps.responses) },
            {
              label: 'Detractors',
              value: formatPercentValue(nps.detractorPct),
              danger: true,
            },
            {
              label: 'Recovery closure',
              value: formatPercentValue(recovery.closureRatePct),
            },
            {
              label: 'Breaching SLA',
              value: formatNumber(recovery.breaching),
              danger: recovery.breaching > 0,
            },
          ],
        },
        {
          heading: 'What drags the score',
          bars: clusters.slice(0, 6).map((c) => ({
            label: c.label,
            value: (Math.abs(c.npsDrag) / maxDrag) * 100,
            display: `${c.npsDrag} NPS`,
          })),
          note: 'Association with detractor scores is diagnostic and requires business validation before it is treated as a cause.',
        },
        {
          heading: 'Satisfaction by touchpoint',
          columns: ['Touchpoint', 'CSAT', 'Satisfied', 'NPS', 'Responses'],
          rows: touchpoints.map((t) => ({
            cells: [
              t.label,
              `${t.csat} / 5`,
              formatPercentValue(t.satisfiedPct),
              String(t.nps),
              formatNumber(t.responses),
            ],
            danger: t.csat < 3,
          })),
        },
      ]
    }

    if (selected === 'campaign-roi') {
      const rows = selectCampaignRows(leads)
      const maxScore = Math.max(...rows.map((r) => r.qualityScore), 1)
      return [
        {
          heading: 'Headline',
          figures: [
            {
              label: 'Total spend',
              value: formatCrore(
                Math.round(rows.reduce((s, r) => s + r.spendLakh, 0) / 100),
              ),
            },
            {
              label: 'Bookings',
              value: formatNumber(rows.reduce((s, r) => s + r.bookings, 0)),
            },
            {
              label: 'Revenue booked',
              value: formatCrore(
                Math.round(bookings.reduce((s, b) => s + b.valueCr, 0)),
              ),
            },
            {
              label: 'Sources to pause',
              value: String(rows.filter((r) => r.recommendation === 'Pause').length),
              danger: true,
            },
          ],
        },
        {
          heading: 'Quality score by source',
          bars: rows.map((r) => ({
            label: r.name,
            value: (r.qualityScore / maxScore) * 100,
            display: String(r.qualityScore),
          })),
        },
        {
          heading: 'Cost efficiency',
          columns: ['Campaign', 'Spend', 'Cost / lead', 'Cost / booking', 'Verdict'],
          rows: rows.map((r) => ({
            cells: [
              r.name,
              `₹${r.spendLakh} L`,
              `₹${formatNumber(r.costPerLead)}`,
              `₹${r.costPerBookingLakh} L`,
              r.recommendation,
            ],
            danger: r.recommendation === 'Pause',
          })),
        },
      ]
    }

    if (selected === 'lead-quality') {
      const qualifiedPlus = leads.filter((l) =>
        ['qualified', 'site-visit', 'proposal', 'booking', 'closed-won'].includes(
          l.stage,
        ),
      )
      const contradicted = leads.filter((l) => l.evidenceStatus === 'contradicted')
      const byStatus = ['strong-evidence', 'supported', 'weak-evidence', 'unverified', 'contradicted']
      const counts = byStatus.map((status) => ({
        status,
        count: leads.filter((l) => l.evidenceStatus === status).length,
      }))
      const maxCount = Math.max(...counts.map((c) => c.count), 1)

      return [
        {
          heading: 'Headline',
          figures: [
            { label: 'Qualified pool', value: formatNumber(qualifiedPlus.length) },
            {
              label: 'Evidence-backed',
              value: formatPercentValue(
                (leads.filter((l) =>
                  ['strong-evidence', 'supported'].includes(l.evidenceStatus),
                ).length /
                  leads.length) *
                  100,
              ),
            },
            {
              label: 'Contradicted',
              value: formatNumber(contradicted.length),
              danger: true,
            },
            {
              label: 'Inflated value',
              value: formatCrore(
                Math.round(contradicted.reduce((s, l) => s + weightedValueCr(l), 0)),
              ),
              danger: true,
            },
          ],
          note:
            'Contradicted records carry an optimistic CRM status with no interaction evidence behind it. They inflate the forecast.',
        },
        {
          heading: 'Evidence distribution',
          bars: counts.map((c) => ({
            label: c.status.replace('-', ' '),
            value: (c.count / maxCount) * 100,
            display: formatNumber(c.count),
          })),
        },
      ]
    }

    // at-risk
    const atRisk = leads.filter(isAtRisk)
    const reps = selectRepStats(leads, bookings, tasks)
    const alerts = riskDigest(ctx)
    const maxRepExposure = Math.max(
      ...reps.map((r) =>
        atRisk
          .filter((l) => l.ownerId === r.id)
          .reduce((s, l) => s + weightedValueCr(l), 0),
      ),
      1,
    )

    return [
      {
        heading: 'Headline',
        figures: [
          {
            label: 'Total exposure',
            value: formatCrore(
              Math.round(atRisk.reduce((s, l) => s + weightedValueCr(l), 0)),
            ),
            danger: true,
          },
          { label: 'Leads at risk', value: formatNumber(atRisk.length) },
          { label: 'Active alerts', value: String(alerts.length) },
          {
            label: 'Reps overloaded',
            value: String(reps.filter((r) => r.overloaded).length),
            danger: true,
          },
        ],
      },
      {
        heading: 'Exposure by owner',
        bars: reps.map((rep) => {
          const value = atRisk
            .filter((l) => l.ownerId === rep.id)
            .reduce((s, l) => s + weightedValueCr(l), 0)
          return {
            label: rep.name,
            value: (value / maxRepExposure) * 100,
            display: formatCrore(Math.round(value)),
          }
        }),
      },
      {
        heading: 'Open alerts',
        columns: ['Severity', 'Alert', 'Impact'],
        rows: alerts.map((a) => ({
          cells: [
            a.severity,
            a.headline,
            a.impactedRevenueCr ? formatCrore(a.impactedRevenueCr) : '—',
          ],
          danger: a.severity === 'critical',
        })),
      },
    ]
  }, [selected, ctx, bookings])

  const report = REPORTS.find((r) => r.id === selected)!

  function exportJson() {
    const payload = {
      report: report.name,
      generatedAt: DEMO_NOW.toISOString(),
      client: 'Meridian Developers',
      sections,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dice-${selected}-${DEMO_NOW.toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fade-in space-y-4">
      {/* Report picker */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {REPORTS.map((r) => {
          const Icon = r.icon
          const active = r.id === selected
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r.id)}
              className={cn(
                'rounded-xl border bg-white p-4 text-left shadow-card transition-colors',
                active
                  ? 'border-kpmg-blue ring-1 ring-kpmg-blue/20'
                  : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg',
                  r.accentBg,
                )}
              >
                <Icon className={cn('size-4.5', r.accent)} strokeWidth={2.1} />
              </span>
              <p className="mt-2.5 text-[13.5px] font-bold text-slate-900">
                {r.name}
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
                {r.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Rendered report */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-slate-400" />
              {report.name}
            </CardTitle>
            <p className="mt-0.5 text-[11.5px] text-slate-400">
              Meridian Developers · generated{' '}
              {DEMO_NOW.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={exportJson}>
            <Download />
            Export
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {sections.map((section) => (
            <section key={section.heading}>
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {section.heading}
              </h3>

              {section.figures && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                  {section.figures.map((f) => (
                    <div
                      key={f.label}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <p className="text-[11px] text-slate-500">{f.label}</p>
                      <p
                        className={cn(
                          'mt-1 text-[19px] font-bold leading-none tracking-[-0.01em]',
                          f.danger ? 'text-status-danger' : 'text-slate-900',
                        )}
                      >
                        {f.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {section.bars && (
                <div className="space-y-2">
                  {section.bars.map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <span className="w-[136px] shrink-0 truncate text-[11.5px] font-medium capitalize text-slate-600">
                        {b.label}
                      </span>
                      <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                        <div
                          className="h-full rounded-r-[4px] bg-kpmg-blue"
                          style={{ width: `${Math.max(1, b.value)}%` }}
                        />
                      </div>
                      <span className="nums w-[78px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                        {b.display}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {section.rows && section.columns && (
                <div className="scrollbar-slim overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        {section.columns.map((c, i) => (
                          <th
                            key={c}
                            className={cn(
                              'pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400',
                              i > 0 && 'text-right',
                            )}
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row) => (
                        <tr
                          key={row.cells.join('|')}
                          className="border-b border-slate-50 last:border-0"
                        >
                          {row.cells.map((cell, i) => (
                            <td
                              key={i}
                              className={cn(
                                'py-2 text-[12px] capitalize',
                                i === 0
                                  ? 'font-medium text-slate-800'
                                  : 'nums text-right text-slate-700',
                                // Flag the metric that triggered the concern,
                                // not the row label.
                                row.danger &&
                                  i === row.cells.length - 1 &&
                                  'font-semibold text-status-danger',
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
              )}

              {section.note && (
                <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">
                  {section.note}
                </p>
              )}
            </section>
          ))}

          {/*
            The bridge into the feature. Managers discover feedback here; the
            analysis, the evidence and the recovery queue live under CSAT & NPS,
            and duplicating them into a report would split the story in two.
          */}
          {selected === 'customer-feedback' && (
            <Link
              href="/agents/kpmg-dice/console/csat-nps/control-tower"
              className="group flex items-center gap-1 text-[13px] font-semibold text-kpmg-blue transition-colors hover:text-kpmg-navy"
            >
              Open the Voice-of-Customer Control Tower
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
