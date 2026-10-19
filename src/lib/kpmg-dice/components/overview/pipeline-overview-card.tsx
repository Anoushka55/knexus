import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { CardLink } from '@/lib/kpmg-dice/components/shared/card-link'
import type { FunnelRow } from '@/lib/kpmg-dice/lib/selectors/overview'
import { formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * The funnel tapers on a fixed linear ramp rather than by true proportion —
 * a 246-of-12,842 bottom stage would otherwise collapse to an unreadable sliver.
 * The table beside it carries the exact figures.
 */
function taperWidth(index: number, total: number) {
  const start = 100
  // Stops at 74% rather than tapering to a point: the narrowest bar still has
  // to hold its label and count without clipping them.
  const end = 74
  return start - ((start - end) * index) / (total - 1)
}

function FunnelBar({
  stage,
  index,
  total,
}: {
  stage: FunnelRow
  index: number
  total: number
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-[3px] px-3 py-2.5',
        // Ink chosen by fill luminance so in-bar labels always clear contrast.
        stage.onColor === 'light' ? 'text-white' : 'text-slate-900',
      )}
      style={{
        backgroundColor: stage.color,
        width: `${taperWidth(index, total)}%`,
      }}
    >
      <span className="whitespace-nowrap text-[12.5px] font-semibold">
        {stage.shortLabel ?? stage.label}
      </span>
      <span className="ml-2 whitespace-nowrap text-[12.5px] font-bold">
        {formatNumber(stage.count)}
      </span>
    </div>
  )
}

export function PipelineOverviewCard({
  stages,
  overallConversion,
}: {
  stages: FunnelRow[]
  overallConversion: number
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Pipeline Overview</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-1 gap-5">
          {/* Funnel */}
          <div className="flex w-1/2 shrink-0 flex-col items-center gap-1.5 pt-1">
            {stages.map((stage, i) => (
              <FunnelBar
                key={stage.label}
                stage={stage}
                index={i}
                total={stages.length}
              />
            ))}
          </div>

          {/* Figures */}
          <div className="min-w-0 flex-1">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="w-[46%] pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    Stage
                  </th>
                  <th className="w-[26%] pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    Count
                  </th>
                  <th className="w-[28%] pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                    Conv.
                  </th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage) => (
                  <tr
                    key={stage.label}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-[9px] pr-1 text-[12px] font-medium leading-tight text-slate-700">
                      {stage.label}
                    </td>
                    <td className="nums py-[9px] text-right text-[12px] font-semibold text-slate-900">
                      {formatNumber(stage.count)}
                    </td>
                    <td className="nums py-[9px] text-right text-[12px] font-semibold text-slate-600">
                      {stage.conversionFromPrev === null
                        ? '—'
                        : formatPercentValue(stage.conversionFromPrev)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="text-[12.5px] font-medium text-slate-600">
            Overall Conversion (Lead to Closed Won)
          </span>
          <span className="nums text-[15px] font-bold text-kpmg-blue">
            {formatPercentValue(overallConversion, 2)}
          </span>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <CardLink
            href="/agents/kpmg-dice/console/pipeline-dashboard"
            label="View full pipeline"
            align="start"
          />
        </div>
      </CardContent>
    </Card>
  )
}
