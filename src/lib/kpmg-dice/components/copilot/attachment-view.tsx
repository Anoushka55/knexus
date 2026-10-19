'use client'

import Link from 'next/link'
import {
  CircleAlert,
  Clock,
  Mail,
  MessageCircle,
  Smartphone,
  TriangleAlert,
} from 'lucide-react'

import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { ScorePill } from '@/lib/kpmg-dice/components/shared/score-pill'
import type { CopilotAttachment } from '@/lib/kpmg-dice/lib/copilot/types'
import { formatCrore, formatDate, formatNumber } from '@/lib/kpmg-dice/lib/format'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const CHANNEL_ICON = {
  whatsapp: MessageCircle,
  email: Mail,
  sms: Smartphone,
} as const

/** Renders whatever structured payload a copilot reply carries. */
export function AttachmentView({ attachment }: { attachment: CopilotAttachment }) {
  /* ---------------- Single lead ---------------- */
  if (attachment.kind === 'lead-card') {
    const { lead, reason, action } = attachment
    return (
      <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
        <div className="flex items-start gap-3">
          <InitialsAvatar name={lead.name} className="size-10" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/agents/kpmg-dice/console/customers/${lead.id}`}
                className="text-[13.5px] font-bold text-slate-900 hover:text-kpmg-blue"
              >
                {lead.name}
              </Link>
              <ScorePill score={lead.score} />
              <span className="text-[11px] capitalize text-slate-400">
                {lead.stage.replace('-', ' ')}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              {lead.id} · {lead.preferredLocation} ·{' '}
              {formatCrore(lead.budgetCr, { decimals: 1 })} · {lead.familySize}{' '}
              members
            </p>
            <p className="mt-1.5 text-[11.5px] leading-snug text-slate-600">
              {reason}
            </p>
            <p className="mt-2 inline-flex rounded-md bg-kpmg-teal/10 px-2 py-1 text-[11.5px] font-semibold text-kpmg-teal">
              Next best action: {action}
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ---------------- Lead list ---------------- */
  if (attachment.kind === 'lead-list') {
    return (
      <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <p className="border-b border-slate-100 bg-slate-50/70 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {attachment.title}
        </p>
        <ul className="divide-y divide-slate-50">
          {attachment.leads.map(({ lead, note }) => (
            <li key={lead.id}>
              <Link
                href={`/agents/kpmg-dice/console/customers/${lead.id}`}
                className="flex items-center gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-slate-50"
              >
                <InitialsAvatar name={lead.name} className="size-7 text-[10px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-slate-900">
                    {lead.name}
                  </span>
                  <span className="block truncate text-[10.5px] text-slate-400">
                    {note}
                  </span>
                </span>
                <ScorePill score={lead.score} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  /* ---------------- Drafted message ---------------- */
  if (attachment.kind === 'draft') {
    const Icon = CHANNEL_ICON[attachment.channel]
    return (
      <div className="mt-2.5 overflow-hidden rounded-xl border border-kpmg-violet/25 bg-kpmg-violet/[0.04]">
        <div className="flex items-center gap-2 border-b border-kpmg-violet/15 px-3.5 py-2">
          <Icon className="size-3.5 text-kpmg-violet" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-kpmg-violet">
            {attachment.channel} draft
          </p>
          <p className="ml-auto text-[11px] text-slate-500">
            to {attachment.recipient}
          </p>
        </div>
        <div className="px-3.5 py-3">
          {attachment.subject && (
            <p className="mb-1.5 text-[12px] font-semibold text-slate-900">
              Subject: {attachment.subject}
            </p>
          )}
          <p className="whitespace-pre-line text-[12px] leading-relaxed text-slate-700">
            {attachment.body}
          </p>
        </div>
      </div>
    )
  }

  /* ---------------- Payment schedule ---------------- */
  if (attachment.kind === 'payment-schedule') {
    const { rows, totalCr, paidCr, overdueCr } = attachment
    return (
      <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-4 border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
          {[
            { label: 'Total', value: formatCrore(totalCr, { decimals: 2 }) },
            { label: 'Collected', value: formatCrore(paidCr, { decimals: 2 }) },
            {
              label: 'Overdue',
              value: formatCrore(overdueCr, { decimals: 2 }),
              danger: overdueCr > 0,
            },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                {f.label}
              </p>
              <p
                className={cn(
                  'nums text-[13px] font-bold',
                  f.danger ? 'text-status-danger' : 'text-slate-900',
                )}
              >
                {f.value}
              </p>
            </div>
          ))}
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              {['Milestone', 'Amount', 'Due', 'Status'].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    'px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400',
                    i > 0 && 'text-right',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 last:border-0">
                <td className="px-3.5 py-2 text-[11.5px] font-medium text-slate-700">
                  {row.milestone}
                </td>
                <td className="nums px-3.5 py-2 text-right text-[11.5px] font-semibold text-slate-900">
                  {formatCrore(row.amountCr, { decimals: 2 })}
                </td>
                <td className="nums px-3.5 py-2 text-right text-[11.5px] text-slate-500">
                  {formatDate(row.dueAt)}
                </td>
                <td className="px-3.5 py-2 text-right">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold capitalize',
                      row.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : row.status === 'overdue'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  /* ---------------- KPI summary ---------------- */
  if (attachment.kind === 'kpi-summary') {
    return (
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {attachment.figures.map((f) => (
          <div
            key={f.label}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <p className="text-[10.5px] text-slate-500">{f.label}</p>
            <p
              className={cn(
                'mt-0.5 text-[16px] font-bold leading-none',
                f.danger ? 'text-status-danger' : 'text-slate-900',
              )}
            >
              {f.value}
            </p>
          </div>
        ))}
      </div>
    )
  }

  /* ---------------- Ticket list ---------------- */
  if (attachment.kind === 'ticket-list') {
    return (
      <div className="mt-2.5 space-y-2">
        {attachment.tickets.map(({ ticket, slaDays, summary, resolution, owner }) => {
          const breached = slaDays > 0
          return (
            <div
              key={ticket.id}
              className={cn(
                'rounded-xl border bg-white p-3.5',
                breached ? 'border-status-danger/30' : 'border-slate-200',
              )}
            >
              <div className="flex flex-wrap items-start gap-2">
                {breached ? (
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-danger" />
                ) : (
                  <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-slate-900">
                    {ticket.subject}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {ticket.customerName} · {ticket.category} ·{' '}
                    {ticket.status.replace('-', ' ')}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                    breached
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700',
                  )}
                >
                  {breached
                    ? `SLA +${slaDays}d`
                    : `${Math.abs(slaDays)}d left`}
                </span>
              </div>

              <p className="mt-2 text-[11.5px] leading-snug text-slate-600">
                <span className="font-semibold text-slate-500">Summary: </span>
                {summary}
              </p>
              <p className="mt-1 text-[11.5px] leading-snug text-slate-600">
                <span className="font-semibold text-slate-500">Resolution: </span>
                {resolution}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-slate-600">
                <CircleAlert className="size-3.5 text-kpmg-blue" />
                <span className="font-semibold text-slate-500">Owner: </span>
                {owner}
              </p>
            </div>
          )
        })}
        <p className="text-[10.5px] text-slate-400">
          {formatNumber(attachment.tickets.length)} shown, worst exposure first
        </p>
      </div>
    )
  }

  return null
}
