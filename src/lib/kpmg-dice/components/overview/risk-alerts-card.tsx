import Link from 'next/link'
import {
  ChevronRight,
  CircleAlert,
  Info,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { CardLink } from '@/lib/kpmg-dice/components/shared/card-link'
import type { RiskAlert, Severity } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/** Status colours are reserved for state — icon + label always accompany them. */
const SEVERITY: Record<Severity, { icon: LucideIcon; tone: string; headline: string }> =
  {
    critical: {
      icon: TriangleAlert,
      tone: 'text-status-danger',
      headline: 'text-status-danger',
    },
    high: {
      icon: TriangleAlert,
      tone: 'text-status-warning',
      headline: 'text-amber-700',
    },
    medium: {
      icon: CircleAlert,
      tone: 'text-status-warning',
      headline: 'text-amber-700',
    },
    info: {
      icon: Info,
      tone: 'text-status-info',
      headline: 'text-kpmg-lightblue',
    },
  }

/** Alerts are raised against the demo clock, so show a stable relative label. */
const AGE_LABELS = ['2h ago', '4h ago', '6h ago', '1d ago', '1d ago']

export function RiskAlertsCard({ alerts }: { alerts: RiskAlert[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Risk &amp; Alerts</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <ul className="flex-1 space-y-1">
          {alerts.map((alert, i) => {
            const config = SEVERITY[alert.severity]
            const Icon = config.icon

            return (
              <li key={alert.id}>
                <Link
                  href={alert.href ?? '/agents/kpmg-dice/console/risk-alerts'}
                  className="group flex items-start gap-2.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <Icon
                    className={cn('mt-0.5 size-[18px] shrink-0', config.tone)}
                    strokeWidth={2.1}
                  />

                  {/* Headline owns the full line; the timestamp rides the
                      detail row below it. Sharing a line with the timestamp
                      squeezed the headline to one word per line. */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-[12.5px] font-semibold leading-snug',
                        config.headline,
                      )}
                    >
                      {alert.headline}
                    </p>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <p className="text-[11.5px] leading-snug text-slate-500">
                        {alert.detail}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {AGE_LABELS[i] ?? '1d ago'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <CardLink href="/agents/kpmg-dice/console/risk-alerts" label="View all alerts" align="start" />
        </div>
      </CardContent>
    </Card>
  )
}
