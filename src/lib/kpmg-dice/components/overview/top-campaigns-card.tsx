import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { CardLink } from '@/lib/kpmg-dice/components/shared/card-link'
import { TrendArrow } from '@/lib/kpmg-dice/components/shared/delta'
import type { CampaignRow } from '@/lib/kpmg-dice/lib/selectors/overview'
import { formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'

export function TopCampaignsCard({ campaigns }: { campaigns: CampaignRow[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Top Campaigns by Quality</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="w-[33%] pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                  Campaign
                </th>
                <th className="w-[14%] pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                  Leads
                </th>
                <th className="w-[17%] pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                  Qualified
                </th>
                <th className="w-[15%] pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                  Visits
                </th>
                <th className="w-[21%] pb-2 text-right text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                  Booking
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="py-2.5 pr-2 text-[12.5px] font-medium leading-snug text-slate-800">
                    {campaign.name}
                  </td>
                  <td className="nums py-2.5 text-right text-[12.5px] font-semibold text-slate-900">
                    {formatNumber(campaign.leads)}
                  </td>
                  {/* Count over rate, stacked — running them inline overflowed
                      the card at a third of the viewport width. */}
                  <td className="nums py-2.5 text-right leading-tight">
                    <span className="block text-[12.5px] font-semibold text-slate-900">
                      {formatNumber(campaign.qualifiedLeads)}
                    </span>
                    <span className="block text-[10.5px] text-slate-400">
                      {formatPercentValue(campaign.qualifiedPct)}
                    </span>
                  </td>
                  <td className="nums py-2.5 text-right leading-tight">
                    <span className="block text-[12.5px] font-semibold text-slate-900">
                      {formatNumber(campaign.siteVisits)}
                    </span>
                    <span className="block text-[10.5px] text-slate-400">
                      {formatPercentValue(campaign.siteVisitPct)}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <span className="nums text-[12.5px] font-semibold text-slate-900">
                        {formatPercentValue(campaign.bookingRate)}
                      </span>
                      <TrendArrow trend={campaign.trend} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <CardLink
            href="/agents/kpmg-dice/console/campaign-analytics"
            label="View campaign analytics"
            align="start"
          />
        </div>
      </CardContent>
    </Card>
  )
}
