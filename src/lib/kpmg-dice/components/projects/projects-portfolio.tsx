'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CalendarCheck, IndianRupee, MapPin, Target } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'

import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import { useReference } from '@/lib/kpmg-dice/data/use-reference'

export interface ProjectRollup {
  id: string
  name: string
  location: string
  possession: string
  unitTypes: string[]
  priceRangeCr: [number, number]
  interestedLeads: number
  siteVisits: number
  attendedVisits: number
  bookings: number
  bookedValueCr: number
  /** Bookings ÷ attended visits — the number a sales head actually tracks. */
  visitToBookingPct: number
}

/** One roll-up per project, shared by the portfolio and the drill-in. */
export function useProjectRollups(): ProjectRollup[] {
  const { projects } = useReference()
  const leads = useCrmStore((s) => s.leads)
  const siteVisits = useCrmStore((s) => s.siteVisits)
  const bookings = useCrmStore((s) => s.bookings)

  return useMemo(
    () =>
      projects.map((project) => {
        const visits = siteVisits.filter((v) => v.projectId === project.id)
        const attended = visits.filter((v) => v.attended)
        const booked = bookings.filter((b) => b.projectId === project.id)
        const value = booked.reduce((s, b) => s + b.valueCr, 0)

        return {
          id: project.id,
          name: project.name,
          location: project.location,
          possession: project.possession,
          unitTypes: project.unitTypes,
          priceRangeCr: project.priceRangeCr,
          interestedLeads: leads.filter((l) =>
            l.interestedProjectIds.includes(project.id),
          ).length,
          siteVisits: visits.length,
          attendedVisits: attended.length,
          bookings: booked.length,
          bookedValueCr: Math.round(value),
          visitToBookingPct: attended.length
            ? Math.round((booked.length / attended.length) * 1000) / 10
            : 0,
        }
      }).sort((a, b) => b.bookedValueCr - a.bookedValueCr),
    [leads, siteVisits, bookings],
  )
}

export function ProjectsPortfolio() {
  const { projects } = useReference()
  const router = useRouter()
  const rollups = useProjectRollups()

  const totalValue = rollups.reduce((s, p) => s + p.bookedValueCr, 0)
  const totalBookings = rollups.reduce((s, p) => s + p.bookings, 0)
  // Summed per-project interest double-counts anyone naming two projects, so
  // this tile counts distinct leads instead.
  const leadsWithInterest = useCrmStore(
    (s) => s.leads.filter((l) => l.interestedProjectIds.length > 0).length,
  )
  const bestConverting = [...rollups].sort(
    (a, b) => b.visitToBookingPct - a.visitToBookingPct,
  )[0]

  const maxValue = Math.max(...rollups.map((p) => p.bookedValueCr), 1)

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Live projects"
          value={String(rollups.length)}
          sub="Across the Mumbai metropolitan region"
          icon={Building2}
        />
        <StatTile
          label="Booked value"
          value={formatCrore(totalValue)}
          sub={`${formatNumber(totalBookings)} bookings`}
          icon={IndianRupee}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Demand signals"
          value={formatNumber(leadsWithInterest)}
          sub="Distinct leads naming at least one project"
          icon={Target}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
        <StatTile
          label="Best converting"
          value={bestConverting?.name.replace('Meridian ', '') ?? '—'}
          sub={
            bestConverting
              ? `${formatPercentValue(bestConverting.visitToBookingPct)} of visits book`
              : '—'
          }
          icon={CalendarCheck}
          accent="text-kpmg-magenta"
          accentBg="bg-kpmg-magenta/10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rollups.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => router.push(`/agents/kpmg-dice/console/projects/${p.id}`)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-slate-900">
                  {p.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-500">
                  <MapPin className="size-3 shrink-0" />
                  {p.location} · {p.possession}
                </p>
              </div>
              <span className="nums shrink-0 rounded-md bg-kpmg-teal/10 px-2 py-1 text-[12px] font-bold text-kpmg-teal">
                {formatCrore(p.bookedValueCr)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {p.unitTypes.map((u) => (
                <span
                  key={u}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {u}
                </span>
              ))}
              <span className="nums rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                ₹{p.priceRangeCr[0]}–{p.priceRangeCr[1]} Cr
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3">
              {[
                ['Interest', formatNumber(p.interestedLeads)],
                ['Visits', formatNumber(p.siteVisits)],
                ['Bookings', formatNumber(p.bookings)],
                ['Visit→book', formatPercentValue(p.visitToBookingPct)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="nums text-[13px] font-bold text-slate-800">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booked value by project</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Single series — the number is on the bar
          </p>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {rollups.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="w-[112px] shrink-0 truncate text-[11.5px] text-slate-600">
                {p.name.replace('Meridian ', '')}
              </span>
              <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                <div
                  className="h-full rounded-r-[4px] bg-kpmg-blue"
                  style={{
                    width: `${Math.max(2, (p.bookedValueCr / maxValue) * 100)}%`,
                  }}
                />
              </div>
              <span className="nums w-[72px] shrink-0 text-right text-[11.5px] font-bold text-slate-900">
                {formatCrore(p.bookedValueCr)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
