'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Phone,
  Smile,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { DataTable, type Column } from '@/lib/kpmg-dice/components/shared/data-table'
import { RecordToolbar } from '@/lib/kpmg-dice/components/shared/record-toolbar'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { SentimentPill } from '@/lib/kpmg-dice/components/shared/pills'
import { BreakdownList, type BreakdownRow } from '@/lib/kpmg-dice/components/shared/breakdown-list'
import { MiniColumns } from '@/lib/kpmg-dice/components/shared/mini-columns'
import { bucketByMonth, pct as toPct } from '@/lib/kpmg-dice/lib/analysis'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatDate, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import type { Engagement, EngagementChannel } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const CHANNEL_ICON: Record<EngagementChannel, LucideIcon> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  website: Globe,
  'site-visit': MapPin,
}

/** Explicit labels — `capitalize` would render WhatsApp as "Whatsapp". */
const CHANNEL_LABEL: Record<EngagementChannel, string> = {
  call: 'Call',
  email: 'Email',
  whatsapp: 'WhatsApp',
  website: 'Website',
  'site-visit': 'Site visit',
}

const CHANNEL_OPTIONS = (
  ['call', 'email', 'whatsapp', 'website', 'site-visit'] as EngagementChannel[]
).map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))

const SENTIMENT_OPTIONS = ['positive', 'neutral', 'negative'].map((s) => ({
  value: s,
  label: s,
}))

export function EngagementsPage() {
  const router = useRouter()
  const engagements = useCrmStore((s) => s.engagements)
  const leadsById = useCrmStore((s) => s.leadsById)

  const [query, setQuery] = useState('')
  const [channel, setChannel] = useState('all')
  const [sentiment, setSentiment] = useState('all')

  /** Newest first — an interaction log reads backwards from now. */
  const ordered = useMemo(
    () =>
      [...engagements].sort(
        (a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt),
      ),
    [engagements],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ordered.filter((e) => {
      if (channel !== 'all' && e.channel !== channel) return false
      if (sentiment !== 'all' && e.sentiment !== sentiment) return false
      if (!q) return true
      const lead = leadsById[e.leadId]
      return (
        e.subject.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        (lead?.name.toLowerCase().includes(q) ?? false)
      )
    })
  }, [ordered, query, channel, sentiment, leadsById])

  const byChannel = useMemo(() => {
    const counts = new Map<EngagementChannel, number>()
    for (const e of engagements) {
      counts.set(e.channel, (counts.get(e.channel) ?? 0) + 1)
    }
    const max = Math.max(...counts.values(), 1)
    return (['call', 'whatsapp', 'website', 'email', 'site-visit'] as EngagementChannel[]).map(
      (c) => ({
        channel: c,
        count: counts.get(c) ?? 0,
        pct: ((counts.get(c) ?? 0) / max) * 100,
      }),
    )
  }, [engagements])

  /* ---------- Analysis: which channel produces the friction ---------- */

  const negativeByChannel: BreakdownRow[] = useMemo(() => {
    const channels: EngagementChannel[] = [
      'call',
      'whatsapp',
      'website',
      'email',
      'site-visit',
    ]
    return channels
      .map((c) => {
        const all = engagements.filter((e) => e.channel === c)
        const bad = all.filter((e) => e.sentiment === 'negative')
        const good = all.filter((e) => e.sentiment === 'positive')
        return {
          key: c,
          label: CHANNEL_LABEL[c],
          icon: CHANNEL_ICON[c],
          caption: `${formatNumber(bad.length)} of ${formatNumber(all.length)} · ${formatPercentValue(toPct(good.length, all.length), 0)} positive`,
          value: toPct(bad.length, all.length),
          display: formatPercentValue(toPct(bad.length, all.length)),
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [engagements])

  /* ---------- Analysis: volume over the trailing half-year ---------- */

  const monthly = useMemo(
    () =>
      bucketByMonth(engagements, (e) => e.occurredAt, { months: 6 }).map((b) => ({
        key: b.key,
        label: b.label,
        fullLabel: b.fullLabel,
        value: b.count,
      })),
    [engagements],
  )

  const inboundMonthly = useMemo(
    () =>
      bucketByMonth(
        engagements.filter((e) => e.direction === 'inbound'),
        (e) => e.occurredAt,
        { months: 6 },
      ),
    [engagements],
  )

  /* ---------- Analysis: the most engaged customers ---------- */

  const mostEngaged: BreakdownRow[] = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of engagements) {
      counts.set(e.leadId, (counts.get(e.leadId) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([leadId, count]) => {
        const lead = leadsById[leadId]
        return {
          key: leadId,
          label: lead?.name ?? leadId,
          caption: lead
            ? `Score ${lead.score} · ${lead.stage.replace('-', ' ')} · ${lead.evidence.daysSinceLastActivity}d quiet`
            : leadId,
          value: count,
          display: formatNumber(count),
          onClick: () => router.push(`/agents/kpmg-dice/console/customers/${leadId}`),
        }
      })
  }, [engagements, leadsById, router])

  const positive = engagements.filter((e) => e.sentiment === 'positive').length
  const negative = engagements.filter((e) => e.sentiment === 'negative').length
  const inbound = engagements.filter((e) => e.direction === 'inbound').length

  const columns: Column<Engagement>[] = [
    {
      key: 'customer',
      header: 'Customer',
      width: 'w-[20%]',
      render: (e) => {
        const lead = leadsById[e.leadId]
        return (
          <div className="flex items-center gap-2.5">
            <InitialsAvatar name={lead?.name ?? '—'} className="size-7 text-[10px]" />
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-semibold text-slate-900">
                {lead?.name ?? e.leadId}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {e.leadId}
              </span>
            </span>
          </div>
        )
      },
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (e) => {
        const Icon = CHANNEL_ICON[e.channel]
        return (
          <span className="flex items-center gap-1.5 whitespace-nowrap text-slate-700">
            <Icon className="size-3.5 shrink-0 text-slate-400" strokeWidth={2} />
            {CHANNEL_LABEL[e.channel]}
          </span>
        )
      },
    },
    {
      key: 'direction',
      header: 'Direction',
      render: (e) => (
        <span className="flex items-center gap-1 whitespace-nowrap text-[11.5px] capitalize text-slate-500">
          {e.direction === 'inbound' ? (
            <ArrowDownLeft className="size-3.5 text-kpmg-teal" />
          ) : (
            <ArrowUpRight className="size-3.5 text-kpmg-blue" />
          )}
          {e.direction}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Interaction',
      width: 'w-[34%]',
      // An auto-layout table only truncates against an explicit max-width.
      render: (e) => (
        <div className="max-w-[228px]">
          <p className="truncate text-[12.5px] font-medium text-slate-800">
            {e.subject}
          </p>
          <p className="truncate text-[11px] text-slate-500">{e.summary}</p>
        </div>
      ),
    },
    {
      key: 'sentiment',
      header: 'Sentiment',
      render: (e) => <SentimentPill sentiment={e.sentiment} />,
    },
    {
      key: 'when',
      header: 'When',
      align: 'right',
      render: (e) => (
        <span className="nums whitespace-nowrap text-slate-500">
          {formatDate(e.occurredAt)}
          {e.durationMins ? (
            <span className="ml-1 text-[11px] text-slate-400">
              · {e.durationMins}m
            </span>
          ) : null}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Interactions logged"
          value={formatNumber(engagements.length)}
          sub="Across every channel"
          icon={MessagesSquare}
        />
        <StatTile
          label="Inbound share"
          value={formatPercentValue((inbound / Math.max(1, engagements.length)) * 100)}
          sub={`${formatNumber(inbound)} customer-initiated`}
          icon={ArrowDownLeft}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Positive sentiment"
          value={formatPercentValue((positive / Math.max(1, engagements.length)) * 100)}
          sub={`${formatNumber(positive)} interactions`}
          icon={Smile}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
        <StatTile
          label="Negative sentiment"
          value={formatNumber(negative)}
          sub="Worth a manager review"
          icon={MessageCircle}
          accent="text-dice-status-danger"
          accentBg="bg-dice-status-danger/10"
          danger={negative > 0}
        />
      </div>

      <div className="grid gap-4 wide:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <RecordToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search customer, subject or summary…"
            resultCount={filtered.length}
            totalCount={engagements.length}
            onClear={() => {
              setQuery('')
              setChannel('all')
              setSentiment('all')
            }}
            selects={[
              { key: 'channel', label: 'channels', value: channel, options: CHANNEL_OPTIONS, onChange: setChannel },
              { key: 'sentiment', label: 'sentiments', value: sentiment, options: SENTIMENT_OPTIONS, onChange: setSentiment },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle>Interaction log</CardTitle>
              <p className="shrink-0 text-[11.5px] text-slate-400">
                Newest first · click a row for the customer&apos;s full timeline
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={filtered}
                columns={columns}
                getRowKey={(e) => e.id}
                onRowClick={(e) => router.push(`/agents/kpmg-dice/console/customers/${e.leadId}`)}
                minWidth="min-w-[780px]"
                emptyLabel="No interactions match this filter."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Channel mix — single series, direct labels, no legend needed */}
          <Card className="h-fit">
          <CardHeader>
            <CardTitle>Channel mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {byChannel.map(({ channel: c, count, pct }) => {
              const Icon = CHANNEL_ICON[c]
              return (
                <div key={c} className="flex items-center gap-2.5">
                  <Icon className="size-3.5 shrink-0 text-slate-400" strokeWidth={2} />
                  <span className="w-[68px] shrink-0 truncate text-[11.5px] text-slate-600">
                    {CHANNEL_LABEL[c]}
                  </span>
                  <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-r-[4px] bg-slate-50">
                    <div
                      className={cn('h-full rounded-r-[4px] bg-kpmg-blue')}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <span className="nums w-[52px] shrink-0 text-right text-[11.5px] font-semibold text-slate-900">
                    {formatNumber(count)}
                  </span>
                </div>
              )
            })}
          </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Friction by channel</CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownList
                rows={negativeByChannel}
                tone="danger"
                labelWidth="w-[62px]"
                valueWidth="w-[44px]"
              />
              <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
                Share of interactions on each channel that carried negative
                sentiment. Voice surfaces objections that digital touches never
                record.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---------- Volume and concentration ---------- */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Interaction volume</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Last six months
            </p>
          </CardHeader>
          <CardContent>
            <MiniColumns
              points={monthly.map((m, i) => ({
                ...m,
                secondary: `${formatNumber(inboundMonthly[i]?.count ?? 0)} inbound`,
              }))}
              caption="Hover a column for the month's total and inbound split"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most engaged customers</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Interactions on record
            </p>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={mostEngaged}
              tone="violet"
              labelWidth="w-[132px]"
              valueWidth="w-[34px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
