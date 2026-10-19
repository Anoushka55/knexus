import {
  CalendarCheck,
  Gauge,
  CircleAlert,
  Flame,
  MapPin,
  PiggyBank,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

import { Delta } from '@/lib/kpmg-dice/components/shared/delta'
import { KPI_DELTAS, type KpiValues } from '@/lib/kpmg-dice/lib/selectors/overview'
import { formatCrore, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/** Presentation only — every figure arrives from the computed KPI selector. */
interface TileConfig {
  key: keyof KpiValues
  label: string
  icon: LucideIcon
  accent: string
  accentBg: string
  format: (value: number) => string
  invertDelta?: boolean
  dangerValue?: boolean
}

const TILES: TileConfig[] = [
  {
    key: 'nps',
    label: 'Net Promoter Score',
    icon: Gauge,
    accent: 'text-kpmg-teal',
    accentBg: 'bg-kpmg-teal/10',
    format: (v) => `${v > 0 ? '+' : ''}${v}`,
  },
  {
    key: 'totalLeads',
    label: 'Total Leads',
    icon: UsersRound,
    accent: 'text-kpmg-blue',
    accentBg: 'bg-kpmg-blue/10',
    format: formatNumber,
  },
  {
    key: 'hotLeads',
    label: 'Hot Leads',
    icon: Flame,
    accent: 'text-kpmg-magenta',
    accentBg: 'bg-kpmg-magenta/10',
    format: formatNumber,
  },
  {
    key: 'siteVisits',
    label: 'Site Visits',
    icon: MapPin,
    accent: 'text-kpmg-purple',
    accentBg: 'bg-kpmg-purple/10',
    format: formatNumber,
  },
  {
    key: 'bookings',
    label: 'Bookings',
    icon: CalendarCheck,
    accent: 'text-kpmg-violet',
    accentBg: 'bg-kpmg-violet/10',
    format: formatNumber,
  },
  {
    key: 'revenueYtdCr',
    label: 'Revenue (YTD)',
    icon: PiggyBank,
    accent: 'text-kpmg-teal',
    accentBg: 'bg-kpmg-teal/10',
    format: (v) => formatCrore(v),
  },
  {
    key: 'revenueAtRiskCr',
    label: 'Revenue at Risk',
    icon: CircleAlert,
    accent: 'text-dice-status-danger',
    accentBg: 'bg-dice-status-danger/10',
    format: (v) => formatCrore(v),
    invertDelta: true,
    dangerValue: true,
  },
]

export function KpiStrip({ values }: { values: KpiValues }) {
  return (
    <section
      aria-label="Key performance indicators"
      className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
    >
      {TILES.map((tile) => {
        const Icon = tile.icon
        return (
          <div
            key={tile.key}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  tile.accentBg,
                )}
              >
                <Icon className={cn('size-5', tile.accent)} strokeWidth={2.1} />
              </span>
              <p className="text-[13px] font-medium text-slate-500">
                {tile.label}
              </p>
            </div>

            <p
              className={cn(
                'mt-2.5 text-[27px] font-bold leading-none tracking-[-0.02em]',
                tile.dangerValue ? 'text-dice-status-danger' : 'text-slate-900',
              )}
            >
              {tile.format(values[tile.key])}
            </p>

            <div className="mt-2.5">
              <Delta value={KPI_DELTAS[tile.key]} invert={tile.invertDelta} />
            </div>
          </div>
        )
      })}
    </section>
  )
}
