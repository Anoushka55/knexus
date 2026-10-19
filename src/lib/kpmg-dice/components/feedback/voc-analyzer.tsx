'use client'

import { useMemo, useState } from 'react'
import { CornerDownRight, Loader2, Sparkles, Tag, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/lib/kpmg-dice/components/ui/card'
import { StatTile } from '@/lib/kpmg-dice/components/shared/stat-tile'
import { SentimentPill } from '@/lib/kpmg-dice/components/shared/pills'
import { InitialsAvatar } from '@/lib/kpmg-dice/components/shared/initials-avatar'
import { ConfidencePill, EvidenceList } from './guardrails'
import { selectThemesForResponse } from '@/lib/kpmg-dice/lib/selectors/feedback'
import { Button } from '@/lib/kpmg-dice/components/ui/button'
import { useAIService } from '@/lib/kpmg-dice/lib/ai/use-ai-service'
import { useFeedbackData } from '@/lib/kpmg-dice/lib/selectors/use-feedback-data'
import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import { TOUCHPOINT_LABEL } from '@/lib/kpmg-dice/types'
import type { FeedbackTheme, SurveyResponse } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * AI Voice-of-Customer Analyzer.
 *
 * Turns open text into structured, checkable insight. Every theme carries the
 * customer's own words, so a reader can verify the classification against the
 * source rather than trusting it — which is the whole difference between this
 * and the Type 1 theme counter.
 */

const NPS_TONE = (score: number) =>
  score >= 9
    ? 'bg-kpmg-teal/10 text-kpmg-teal'
    : score >= 7
      ? 'bg-slate-100 text-slate-600'
      : 'bg-red-50 text-red-700'

function ThemeRow({
  theme,
  active,
  onSelect,
  isChild,
}: {
  theme: FeedbackTheme
  active: boolean
  onSelect: () => void
  isChild: boolean
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0',
          active ? 'bg-kpmg-blue/[0.06]' : 'hover:bg-slate-50',
          isChild && 'pl-8',
        )}
      >
        {isChild && (
          <CornerDownRight className="size-3 shrink-0 text-slate-300" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[12.5px] font-semibold text-slate-900">
              {theme.label}
            </p>
            {theme.emerging && (
              <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                Emerging
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-slate-500">
            {theme.aspect} · {formatNumber(theme.mentions)} mention
            {theme.mentions === 1 ? '' : 's'}
          </p>
        </div>

        <SentimentPill sentiment={theme.sentiment} />
        <ConfidencePill value={theme.confidence} />
      </button>
    </li>
  )
}

export function VocAnalyzer() {
  const { themes, responses } = useFeedbackData()
  const [selectedId, setSelectedId] = useState(themes[0]?.id ?? '')

  /*
   * Batch summary from the AI service.
   *
   * The themes are extracted deterministically and are not up for negotiation.
   * This asks the model to read the same batch and say what it amounts to in a
   * sentence, which is the narrative layer the rule pass has no way to produce.
   */
  const ai = useAIService()
  const [summary, setSummary] = useState('')
  const [summarising, setSummarising] = useState(false)
  const [responseId, setResponseId] = useState<string>('')

  /* Parents first, each followed by its sub-themes — the hierarchy view. */
  const ordered = useMemo(() => {
    const parents = themes.filter((t) => !t.parentId)
    const out: { theme: FeedbackTheme; isChild: boolean }[] = []
    for (const parent of parents) {
      out.push({ theme: parent, isChild: false })
      for (const child of themes.filter((t) => t.parentId === parent.id)) {
        out.push({ theme: child, isChild: true })
      }
    }
    // Sub-themes whose parent fell below the volume floor still belong somewhere.
    for (const theme of themes) {
      if (theme.parentId && !out.some((r) => r.theme.id === theme.id)) {
        out.push({ theme, isChild: true })
      }
    }
    return out
  }, [themes])

  const selected = themes.find((t) => t.id === selectedId) ?? themes[0]

  /* The authored records lead, so the hero verbatim is one click from landing. */
  const recent = useMemo(
    () =>
      [...responses]
        .sort((a, b) => {
          if (Boolean(b.featured) !== Boolean(a.featured))
            return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
          return b.respondedAt.localeCompare(a.respondedAt)
        })
        .slice(0, 10),
    [responses],
  )

  const activeResponse: SurveyResponse | undefined =
    recent.find((r) => r.id === responseId) ?? recent[0]

  const decomposition = activeResponse
    ? selectThemesForResponse(activeResponse, themes)
    : []

  const meanConfidence = themes.length
    ? Math.round(themes.reduce((s, t) => s + t.confidence, 0) / themes.length)
    : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Themes extracted"
          value={formatNumber(themes.length)}
          sub="From open-text responses"
          icon={Sparkles}
          accent="text-kpmg-violet"
          accentBg="bg-kpmg-violet/10"
        />
        <StatTile
          label="Responses analysed"
          value={formatNumber(responses.length)}
          sub="Every verbatim, every run"
          icon={TrendingUp}
        />
        <StatTile
          label="Emerging themes"
          value={formatNumber(themes.filter((t) => t.emerging).length)}
          sub="Low volume, flagged for review"
          icon={Tag}
          accent="text-amber-600"
          accentBg="bg-amber-50"
        />
        <StatTile
          label="Mean confidence"
          value={`${meanConfidence}%`}
          sub="Across extracted themes"
          icon={Sparkles}
          accent="text-kpmg-teal"
          accentBg="bg-kpmg-teal/10"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Theme hierarchy */}
        <Card className="flex min-w-0 flex-col">
          <CardHeader>
            <CardTitle>Theme hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-4 py-2.5">
              {summary ? (
                <p className="flex gap-2 text-[12px] leading-relaxed text-slate-600">
                  <Sparkles
                    className="mt-0.5 size-3.5 shrink-0 text-kpmg-violet"
                    strokeWidth={2.2}
                  />
                  <span>{summary}</span>
                </p>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={summarising}
                  onClick={async () => {
                    setSummarising(true)
                    try {
                      // A readable sample, not the whole book: the point is the
                      // narrative, and 3,000 verbatims is not a prompt.
                      const batch = responses
                        .filter((r) => r.sentiment === 'negative')
                        .slice(0, 40)
                        .map((r) => r.verbatim)
                      const result = await ai.extractThemes(batch, {
                        screen: 'voc-analyzer',
                      })
                      setSummary(result.summary)
                    } finally {
                      setSummarising(false)
                    }
                  }}
                >
                  {summarising ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Reading the batch...
                    </>
                  ) : (
                    <>
                      <Sparkles />
                      Summarise what these amount to
                    </>
                  )}
                </Button>
              )}
            </div>
            <ul>
              {ordered.map(({ theme, isChild }) => (
                <ThemeRow
                  key={theme.id}
                  theme={theme}
                  isChild={isChild}
                  active={theme.id === selected?.id}
                  onSelect={() => setSelectedId(theme.id)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Selected theme */}
        {selected && (
          <Card className="flex min-w-0 flex-col">
            <CardHeader>
              <CardTitle className="min-w-0 truncate">{selected.label}</CardTitle>
              <ConfidencePill value={selected.confidence} />
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {selected.aspect}
                </span>
                <SentimentPill sentiment={selected.sentiment} />
                <span className="text-[11.5px] text-slate-500">
                  {formatNumber(selected.mentions)} of{' '}
                  {formatNumber(responses.length)} responses
                </span>
              </div>

              <EvidenceList
                spans={selected.evidence}
                label="Source text — the customer's own words"
              />

              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Tag className="size-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-500">
                    Suggested CRM tag
                  </span>
                </div>
                <code className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-kpmg-blue ring-1 ring-inset ring-slate-200">
                  {selected.suggestedCrmTag}
                </code>
              </div>

              {selected.emerging && (
                <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
                  Flagged as emerging: too few mentions to be a pattern yet, but
                  appearing in new responses. Confidence is correspondingly low —
                  this is for review, not for action.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Per-response decomposition — the "why did this customer score that" view */}
      <div className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recent responses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="max-h-[340px] overflow-y-auto scrollbar-slim">
              {recent.map((response) => (
                <li key={response.id}>
                  <button
                    type="button"
                    onClick={() => setResponseId(response.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0',
                      response.id === activeResponse?.id
                        ? 'bg-kpmg-blue/[0.06]'
                        : 'hover:bg-slate-50',
                    )}
                  >
                    <InitialsAvatar name={response.customerName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-slate-900">
                        {response.customerName}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {TOUCHPOINT_LABEL[response.touchpoint]}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'nums shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-bold',
                        NPS_TONE(response.npsScore),
                      )}
                    >
                      {response.npsScore}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {activeResponse && (
          <Card className="flex min-w-0 flex-col">
            <CardHeader>
              <CardTitle className="min-w-0 truncate">
                What drove {activeResponse.customerName}&apos;s score
              </CardTitle>
              <span
                className={cn(
                  'nums shrink-0 rounded-md px-2 py-0.5 text-[13px] font-bold',
                  NPS_TONE(activeResponse.npsScore),
                )}
              >
                {activeResponse.npsScore}/10
              </span>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <blockquote className="rounded-lg border-l-[3px] border-slate-300 bg-slate-50 py-2 pl-3 pr-3 text-[12.5px] italic leading-relaxed text-slate-600">
                {activeResponse.verbatim}
              </blockquote>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Decomposed into {decomposition.length} theme
                  {decomposition.length === 1 ? '' : 's'}
                </p>
                <ul className="mt-2 space-y-2">
                  {decomposition.map((theme) => (
                    <li
                      key={theme.id}
                      className="rounded-lg border border-slate-200 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-[12px] font-semibold text-slate-800">
                          {theme.label}
                        </p>
                        <ConfidencePill value={theme.confidence} />
                      </div>
                      {/* The span from THIS response, not the theme's book-wide
                          evidence — drilling in from a record must quote it. */}
                      <p className="mt-1.5 text-[11.5px] italic leading-snug text-slate-500">
                        &ldquo;{theme.evidence[0]}&rdquo;
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {activeResponse.sourceTicketId && (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11.5px] leading-relaxed text-slate-600">
                  An unresolved service ticket (
                  <code className="text-[11px] font-semibold text-slate-700">
                    {activeResponse.sourceTicketId}
                  </code>
                  ) was already open when this score was given. The platform
                  flagged the SLA risk before advocacy broke.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
