'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, ShieldAlert, TriangleAlert, UsersRound } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { DataTable, type Column } from '@/lib/kpmg-dice/components/shared/data-table'
import { RecordToolbar } from '@/lib/kpmg-dice/components/shared/record-toolbar'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { InitialsAvatar, OwnerChip } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { ScorePill } from '@/lib/kpmg-dice/components/shared/score-pill'
import { EvidencePill, IntentPill, StagePill } from '@/lib/kpmg-dice/components/shared/pills'
import { BreakdownList, type BreakdownRow } from '@/lib/kpmg-dice/components/shared/breakdown-list'
import { CrossTab } from '@/lib/kpmg-dice/components/shared/cross-tab'

import { weightedValueCr } from '@/lib/kpmg-dice/lib/selectors/overview'
import { pct, shareBy } from '@/lib/kpmg-dice/lib/analysis'
import { useCrmStore } from '@/lib/kpmg-dice/store/crm-store'
import { formatCrore, formatNumber, formatPercentValue } from '@/lib/kpmg-dice/lib/format'
import type { CrmStatus, EvidenceStatus, Lead } from '@/lib/kpmg-dice/types'

const STAGE_OPTIONS = [
  'lead',
  'engaged',
  'qualified',
  'site-visit',
  'proposal',
  'booking',
  'closed-won',
  'closed-lost',
].map((s) => ({ value: s, label: s.replace('-', ' ') }))

const INTENT_OPTIONS = ['high', 'medium', 'low', 'cold'].map((i) => ({
  value: i,
  label: i,
}))

const EVIDENCE_OPTIONS = [
  'strong-evidence',
  'supported',
  'weak-evidence',
  'unverified',
  'contradicted',
].map((e) => ({ value: e, label: e.replace('-', ' ') }))


/** CRM statuses that assert live interest — the claims worth auditing. */
const CLAIM_STATUSES: CrmStatus[] = [
  'Interested',
  'Qualified',
  'Site Visit Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Booked',
]

const EVIDENCE_COLUMNS: { key: EvidenceStatus; label: string; alarming?: boolean }[] =
  [
    { key: 'strong-evidence', label: 'Strong' },
    { key: 'supported', label: 'Supported' },
    { key: 'weak-evidence', label: 'Weak', alarming: true },
    { key: 'unverified', label: 'Unverified', alarming: true },
    { key: 'contradicted', label: 'Contradicted', alarming: true },
  ]

/** Evidence grades that do not stand behind an advanced CRM status. */
const UNSUPPORTED: EvidenceStatus[] = [
  'weak-evidence',
  'unverified',
  'contradicted',
]

const SCORE_BANDS = [
  { key: '80', label: '80–99', min: 80, max: 100 },
  { key: '60', label: '60–79', min: 60, max: 80 },
  { key: '40', label: '40–59', min: 40, max: 60 },
  { key: '20', label: '20–39', min: 20, max: 40 },
  { key: '0', label: 'Under 20', min: 0, max: 20 },
]

/**
 * Filters can be seeded from the URL so every summary view has somewhere to
 * drill through to — `/agents/kpmg-dice/console/leads?stage=proposal&owner=rep-...`.
 */
export interface LeadsPageFilters {
  stage?: string
  intent?: string
  evidence?: string
  owner?: string
  campaign?: string
}

export function LeadsPage({ initial = {} }: { initial?: LeadsPageFilters }) {
  const { campaigns, reps } = useReference()
  const ownerOptions = useMemo(
    () => reps.map((r) => ({ value: r.id, label: r.name })),
    [reps],
  )
  const campaignOptions = useMemo(
    () => campaigns.map((c) => ({ value: c.id, label: c.name })),
    [campaigns],
  )
  const router = useRouter()
  const leads = useCrmStore((s) => s.leads)

  const [query, setQuery] = useState('')
  const [stage, setStage] = useState(initial.stage ?? 'all')
  const [intent, setIntent] = useState(initial.intent ?? 'all')
  const [evidence, setEvidence] = useState(initial.evidence ?? 'all')
  const [owner, setOwner] = useState(initial.owner ?? 'all')
  const [campaign, setCampaign] = useState(initial.campaign ?? 'all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter((l) => {
      if (stage !== 'all' && l.stage !== stage) return false
      if (intent !== 'all' && l.intent !== intent) return false
      if (evidence !== 'all' && l.evidenceStatus !== evidence) return false
      if (owner !== 'all' && l.ownerId !== owner) return false
      if (campaign !== 'all' && l.sourceCampaignId !== campaign) return false
      if (!q) return true
      return (
        l.name.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.preferredLocation.toLowerCase().includes(q)
      )
    })
    // Highest-scoring first — the top of the list is where the work is.
  }, [leads, query, stage, intent, evidence, owner, campaign])

  // Open work sits above closed records — a closed-won lead still scores 98,
  // and a lead book that opens on finished deals is not a working list.
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const closedRank = (l: Lead) => (l.stage.startsWith('closed') ? 1 : 0)
        if (closedRank(a) !== closedRank(b)) return closedRank(a) - closedRank(b)
        return b.score - a.score
      }),
    [filtered],
  )

  const stats = useMemo(() => {
    const hot = leads.filter((l) => l.intent === 'high').length
    const backed = leads.filter((l) =>
      ['strong-evidence', 'supported'].includes(l.evidenceStatus),
    ).length
    const contradicted = leads.filter(
      (l) => l.evidenceStatus === 'contradicted',
    ).length
    return { hot, backed, contradicted }
  }, [leads])

  /* ---------- Analysis: CRM claim vs evidence ---------- */

  const audit = useMemo(() => {
    const claimed = leads.filter((l) => CLAIM_STATUSES.includes(l.crmStatus))
    const unsupported = claimed.filter((l) =>
      UNSUPPORTED.includes(l.evidenceStatus),
    )

    const rows = CLAIM_STATUSES.map((status) => {
      const inStatus = claimed.filter((l) => l.crmStatus === status)
      const cells: Record<string, number> = {}
      for (const col of EVIDENCE_COLUMNS) {
        cells[col.key] = inStatus.filter(
          (l) => l.evidenceStatus === col.key,
        ).length
      }
      const bad = inStatus.filter((l) => UNSUPPORTED.includes(l.evidenceStatus))
      return {
        key: status,
        label: status,
        caption: inStatus.length
          ? `${formatPercentValue(pct(bad.length, inStatus.length), 0)} unsupported`
          : undefined,
        cells,
      }
    }).filter((r) => Object.values(r.cells).some((v) => v > 0))

    return {
      rows,
      claimedCount: claimed.length,
      unsupportedCount: unsupported.length,
      unsupportedShare: pct(unsupported.length, claimed.length),
      exposureCr: Math.round(
        unsupported.reduce((s, l) => s + weightedValueCr(l), 0),
      ),
    }
  }, [leads])

  /* ---------- Analysis: score distribution ---------- */

  const scoreBands: BreakdownRow[] = useMemo(
    () =>
      SCORE_BANDS.map((band) => {
        const inBand = leads.filter(
          (l) => l.score >= band.min && l.score < band.max,
        )
        const hot = inBand.filter((l) => l.intent === 'high').length
        const share = `${formatPercentValue(pct(inBand.length, leads.length), 0)} of the book`
        return {
          key: band.key,
          label: band.label,
          caption: hot ? `${share} · ${formatNumber(hot)} high intent` : share,
          value: inBand.length,
          display: formatNumber(inBand.length),
        }
      }),
    [leads],
  )

  /* ---------- Analysis: demand by micro-market ---------- */

  const marketRows: BreakdownRow[] = useMemo(
    () =>
      shareBy(leads, (l) => l.preferredLocation, { limit: 8 }).map((row) => {
        const hot = row.items.filter((l) => l.intent === 'high').length
        const avgBudget =
          row.items.reduce((s, l) => s + l.budgetCr, 0) / row.items.length
        return {
          key: row.key,
          label: row.label,
          caption: `${formatPercentValue(pct(hot, row.count), 0)} hot · avg ${formatCrore(avgBudget, { decimals: 1 })}`,
          value: row.count,
          display: formatNumber(row.count),
          // Search matches preferred location, so this doubles as a filter.
          onClick: () => setQuery(row.label),
        }
      }),
    [leads],
  )

  /* ---------- Analysis: quality by source ---------- */

  const sourceRows: BreakdownRow[] = useMemo(() => {
    const rows = campaigns.map((c) => {
      const owned = leads.filter((l) => l.sourceCampaignId === c.id)
      const hot = owned.filter((l) => l.intent === 'high').length
      const backed = owned.filter((l) =>
        ['strong-evidence', 'supported'].includes(l.evidenceStatus),
      ).length
      return {
        key: c.id,
        label: c.name,
        caption: `${formatNumber(owned.length)} leads · ${formatPercentValue(pct(backed, owned.length), 0)} evidence-backed`,
        value: pct(hot, owned.length),
        display: formatPercentValue(pct(hot, owned.length)),
        onClick: () => router.push(`/agents/kpmg-dice/console/campaign-analytics/${c.id}`),
      }
    })
    return rows.sort((a, b) => b.value - a.value)
  }, [leads, router])

  const columns: Column<Lead>[] = [
    {
      key: 'customer',
      header: 'Customer',
      width: 'w-[22%]',
      render: (lead) => (
        <div className="flex items-center gap-2.5">
          <InitialsAvatar name={lead.name} />
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-semibold text-slate-900">
              {lead.name}
            </span>
            <span className="block truncate text-[11px] text-slate-500">
              {lead.id} · {lead.preferredLocation}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (lead) => <ScorePill score={lead.score} />,
    },
    {
      key: 'intent',
      header: 'Intent',
      render: (lead) => <IntentPill intent={lead.intent} />,
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (lead) => <StagePill stage={lead.stage} />,
    },
    {
      key: 'crm',
      header: 'CRM status',
      render: (lead) => (
        <span className="whitespace-nowrap text-[12px] text-slate-600">
          {lead.crmStatus}
        </span>
      ),
    },
    {
      key: 'evidence',
      header: 'Evidence',
      render: (lead) => <EvidencePill status={lead.evidenceStatus} />,
    },
    {
      key: 'budget',
      header: 'Budget',
      align: 'right',
      render: (lead) => (
        <span className="nums font-semibold text-slate-900">
          {formatCrore(lead.budgetCr, { decimals: 1 })}
        </span>
      ),
    },
    {
      key: 'silent',
      header: 'Silent',
      align: 'right',
      render: (lead) => (
        <span
          className={
            lead.evidence.daysSinceLastActivity > 21
              ? 'nums font-semibold text-dice-status-danger'
              : 'nums text-slate-600'
          }
        >
          {lead.evidence.daysSinceLastActivity}d
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      align: 'right',
      render: (lead) => (
        <div className="flex justify-end">
          <OwnerChip
            code={reps.find((r) => r.id === lead.ownerId)?.initials ?? '—'}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Total leads"
          value={formatNumber(leads.length)}
          sub="Across nine sources"
          icon={UsersRound}
        />
        <StatTile
          label="Hot leads"
          value={formatNumber(stats.hot)}
          sub={`${formatPercentValue((stats.hot / leads.length) * 100)} of the book`}
          icon={Flame}
          accent="text-kpmg-magenta"
          accentBg="bg-kpmg-magenta/10"
        />
        <StatTile
          label="Evidence-backed"
          value={formatPercentValue((stats.backed / leads.length) * 100)}
          sub={`${formatNumber(stats.backed)} records with real interaction history`}
          icon={ShieldAlert}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
        <StatTile
          label="Contradicted"
          value={formatNumber(stats.contradicted)}
          sub="CRM status the evidence does not support"
          icon={TriangleAlert}
          accent="text-dice-status-danger"
          accentBg="bg-dice-status-danger/10"
          danger
        />
      </div>

      {/* ---------- The divergence at the heart of the pitch ---------- */}
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Where the CRM and the evidence disagree</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Rows: what the rep recorded · columns: what the history supports
            </p>
          </CardHeader>
          <CardContent>
            <CrossTab
              rowHeader="CRM status"
              columns={EVIDENCE_COLUMNS}
              rows={audit.rows}
            />
            <p className="mt-3 border-t border-slate-100 pt-3 text-[12.5px] leading-relaxed text-slate-600">
              <span className="font-bold text-dice-status-danger">
                {formatNumber(audit.unsupportedCount)}
              </span>{' '}
              of {formatNumber(audit.claimedCount)} records in an active CRM
              status ({formatPercentValue(audit.unsupportedShare)}) have weak,
              unverified or contradicted evidence behind them —{' '}
              <span className="font-semibold text-slate-900">
                {formatCrore(audit.exposureCr)}
              </span>{' '}
              of probability-weighted pipeline resting on a claim rather than a
              conversation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={scoreBands}
              tone="navy"
              labelWidth="w-[76px]"
              valueWidth="w-[54px]"
            />
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
              The DICE score blends behavioural evidence with recency, so a
              silent lead decays out of the top band even when the CRM still
              calls it hot.
            </p>
          </CardContent>
        </Card>
      </div>

      <RecordToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search name, lead ID or micro-market…"
        resultCount={sorted.length}
        totalCount={leads.length}
        onClear={() => {
          setQuery('')
          setStage('all')
          setIntent('all')
          setEvidence('all')
          setOwner('all')
          setCampaign('all')
        }}
        selects={[
          { key: 'stage', label: 'stages', value: stage, options: STAGE_OPTIONS, onChange: setStage },
          { key: 'intent', label: 'intents', value: intent, options: INTENT_OPTIONS, onChange: setIntent },
          { key: 'evidence', label: 'evidence', value: evidence, options: EVIDENCE_OPTIONS, onChange: setEvidence },
          { key: 'owner', label: 'owners', value: owner, options: ownerOptions, onChange: setOwner },
          { key: 'campaign', label: 'sources', value: campaign, options: campaignOptions, onChange: setCampaign },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lead book</CardTitle>
          <p className="shrink-0 text-[11.5px] text-slate-400">
            Open leads first, ranked by DICE lead score · click a row for the
            full Customer 360
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={sorted}
            columns={columns}
            getRowKey={(lead) => lead.id}
            onRowClick={(lead) => router.push(`/agents/kpmg-dice/console/customers/${lead.id}`)}
            minWidth="min-w-[980px]"
            emptyLabel="No leads match this combination of filters."
          />
        </CardContent>
      </Card>

      {/* ---------- Where the demand sits ---------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demand by micro-market</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              Select one to filter the book
            </p>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={marketRows}
              tone="teal"
              labelWidth="w-[112px]"
              valueWidth="w-[54px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead quality by source</CardTitle>
            <p className="shrink-0 text-[11.5px] text-slate-400">
              High-intent share · select to open the campaign
            </p>
          </CardHeader>
          <CardContent>
            <BreakdownList
              rows={sourceRows}
              tone="magenta"
              labelWidth="w-[152px]"
              valueWidth="w-[48px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useReference } from '@/lib/kpmg-dice/data/use-reference'