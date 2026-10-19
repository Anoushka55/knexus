import Link from 'next/link'
import {
  Calendar,
  Clock,
  FileText,
  MessageCircle,
  Phone,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { CardLink } from '@/lib/kpmg-dice/components/shared/card-link'
import { InitialsAvatar, OwnerChip } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { ScorePill } from '@/lib/kpmg-dice/components/shared/score-pill'
import type { NbaIcon, RecommendedActionRow } from '@/lib/kpmg-dice/lib/selectors/overview'

const ACTION_ICONS: Record<NbaIcon, LucideIcon> = {
  call: Phone,
  'site-visit': Calendar,
  'payment-plan': FileText,
  whatsapp: MessageCircle,
  'follow-up': Clock,
  suppress: ShieldAlert,
}

export function RecommendedActionsCard({
  rows,
}: {
  rows: RecommendedActionRow[]
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>AI Recommended Actions (Next Best Actions)</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="-mx-1 flex-1 overflow-x-auto px-1">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Customer
                </th>
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Score
                </th>
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Next Best Action
                </th>
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Reason
                </th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const ActionIcon = ACTION_ICONS[row.actionIcon]
                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/agents/kpmg-dice/console/customers/${row.leadId}`}
                        className="group flex items-center gap-2.5"
                      >
                        <InitialsAvatar name={row.customerName} />
                        <span className="min-w-0">
                          <span className="block truncate text-[12.5px] font-semibold text-slate-900 group-hover:text-kpmg-blue">
                            {row.customerName}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {row.project} · {row.budget}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3">
                      <ScorePill score={row.score} />
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-1.5">
                        <ActionIcon
                          className="size-3.5 shrink-0 text-kpmg-blue"
                          strokeWidth={2.1}
                        />
                        <span className="text-[12.5px] font-medium text-slate-800">
                          {row.action}
                        </span>
                      </span>
                    </td>
                    <td className="max-w-[190px] py-2.5 pr-3 text-[11.5px] leading-snug text-slate-500">
                      {row.reason}
                    </td>
                    <td className="py-2.5">
                      <div className="flex justify-end">
                        <OwnerChip code={row.owner} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <CardLink
            href="/agents/kpmg-dice/console/ai-insights"
            label="View all recommended actions"
            align="start"
          />
        </div>
      </CardContent>
    </Card>
  )
}
