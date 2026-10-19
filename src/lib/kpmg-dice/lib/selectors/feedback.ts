import { SURVEY_QUESTIONS } from '@/lib/kpmg-dice/data/feedback'
import { DEMO_NOW, dayPartOf } from '@/lib/kpmg-dice/data/reference'

import { formatNumber } from '@/lib/kpmg-dice/lib/format'
import type {
  Engagement,
  FeedbackTheme,
  Lead,
  Payment,
  SurveyQuestion,
  Intervention,
  JourneyStage,
  NpsBand,
  RecoveryCase,
  RootCauseCluster,
  Sentiment,
  SurveyInvite,
  SurveyResponse,
  TouchpointId,
} from '@/lib/kpmg-dice/types'
import { TOUCHPOINT_LABEL, TOUCHPOINT_ORDER } from '@/lib/kpmg-dice/types'
import { ref, themeById } from '@/lib/kpmg-dice/data/active-reference'

/**
 * Feedback selectors.
 *
 * Pure functions over arrays, same contract as selectors/overview.ts. Theme
 * extraction and clustering are deterministic rule passes — the AI service
 * layers narrative on top, exactly as the agent registry does. A live demo
 * cannot afford the analysis to come out differently on the second run.
 *
 * Everything here that scores, predicts or correlates is illustrative until
 * validated against client data, and the UI must say so.
 */

/* ------------------------------------------------------------------ */
/* Type 1 — descriptive reporting                                      */
/* ------------------------------------------------------------------ */

export interface NpsSummary {
  responses: number
  promoters: number
  passives: number
  detractors: number
  promoterPct: number
  passivePct: number
  detractorPct: number
  /** Standard NPS: %promoters − %detractors, rounded to a whole number. */
  nps: number
}

export function selectNpsSummary(responses: SurveyResponse[]): NpsSummary {
  const total = responses.length
  const promoters = responses.filter((r) => r.npsBand === 'promoter').length
  const passives = responses.filter((r) => r.npsBand === 'passive').length
  const detractors = responses.filter((r) => r.npsBand === 'detractor').length

  const pct = (n: number) => (total ? (n / total) * 100 : 0)
  const promoterPct = pct(promoters)
  const detractorPct = pct(detractors)

  return {
    responses: total,
    promoters,
    passives,
    detractors,
    promoterPct: Math.round(promoterPct * 10) / 10,
    passivePct: Math.round(pct(passives) * 10) / 10,
    detractorPct: Math.round(detractorPct * 10) / 10,
    nps: Math.round(promoterPct - detractorPct),
  }
}

export interface NpsTrendPoint {
  month: string
  nps: number
  responses: number
}

/** Trailing six months of NPS, bucketed by response month. */
export function selectNpsTrend(responses: SurveyResponse[]): NpsTrendPoint[] {
  const buckets = new Map<string, SurveyResponse[]>()

  // Anchored to the first of the month: subtracting a month from the 31st
  // lands on a day that does not exist and silently rolls into the next month,
  // which dropped February entirely and produced March twice.
  for (let i = 5; i >= 0; i--) {
    const d = new Date(
      Date.UTC(DEMO_NOW.getUTCFullYear(), DEMO_NOW.getUTCMonth() - i, 1),
    )
    buckets.set(monthKey(d), [])
  }

  for (const response of responses) {
    const key = monthKey(new Date(response.respondedAt))
    buckets.get(key)?.push(response)
  }

  return [...buckets.entries()].map(([month, rows]) => ({
    month,
    nps: rows.length ? selectNpsSummary(rows).nps : 0,
    responses: rows.length,
  }))
}

/**
 * Month bucket key, pinned to UTC.
 *
 * Without an explicit timeZone, toLocaleDateString formats in the viewer's
 * local zone while these keys are built from UTC instants — so a viewer west
 * of UTC bucketed May into "Apr'26" and disagreed with the server-rendered
 * HTML, which is a hydration mismatch on a page whose premise is that the two
 * generate identical data.
 */
function monthKey(d: Date) {
  return `${d.toLocaleDateString('en-GB', {
    month: 'short',
    timeZone: 'UTC',
  })}'${String(d.getUTCFullYear()).slice(2)}`
}

/**
 * The six trailing month keys, and a bucketer that uses them.
 *
 * Three separate trends need the same window and the same UTC-pinned keys; a
 * second implementation would drift from the first the moment either changed.
 */
function monthWindow() {
  const keys: string[] = []
  for (let i = 5; i >= 0; i--) {
    keys.push(
      monthKey(
        new Date(
          Date.UTC(DEMO_NOW.getUTCFullYear(), DEMO_NOW.getUTCMonth() - i, 1),
        ),
      ),
    )
  }
  return keys
}

function bucketByMonth<T>(rows: T[], at: (row: T) => string) {
  const buckets = new Map<string, T[]>(monthWindow().map((k) => [k, []]))
  for (const row of rows) buckets.get(monthKey(new Date(at(row))))?.push(row)
  return buckets
}

export interface CsatTrendPoint {
  month: string
  csat: number
  responses: number
}

/** CSAT over the trailing six months — the brief's "CSAT trend dashboard". */
export function selectCsatTrend(responses: SurveyResponse[]): CsatTrendPoint[] {
  return [...bucketByMonth(responses, (r) => r.respondedAt).entries()].map(
    ([month, rows]) => ({
      month,
      csat: rows.length
        ? Math.round((rows.reduce((s, r) => s + r.csatScore, 0) / rows.length) * 100) / 100
        : 0,
      responses: rows.length,
    }),
  )
}

export interface IssueTrendSeries {
  themeId: string
  label: string
  aspect: string
  points: { month: string; mentions: number }[]
  /** Mentions in the latest month minus the first — the direction of travel. */
  change: number
}

/**
 * Complaint volume per theme, month by month.
 *
 * Backs both the brief's "repeat-issue trend" on Root Cause and its "issue
 * trends" on the Control Tower — the same series, read for different purposes:
 * is this recurring, and is it getting worse.
 */
export function selectIssueTrends(
  responses: SurveyResponse[],
  themes: FeedbackTheme[],
  limit = 5,
): IssueTrendSeries[] {
  const responsesById = new Map(responses.map((r) => [r.id, r]))
  const months = monthWindow()

  return themes
    .filter((t) => t.sentiment !== 'positive' && t.mentions >= MIN_CLUSTER_RESPONSES)
    .map((theme) => {
      // Complaints only — a theme's total volume tracks survey volume, not pain.
      const rows = theme.responseIds
        .map((id) => responsesById.get(id))
        .filter((r): r is SurveyResponse => Boolean(r) && r!.sentiment === 'negative')

      const buckets = bucketByMonth(rows, (r) => r.respondedAt)
      const points = months.map((month) => ({
        month,
        mentions: buckets.get(month)?.length ?? 0,
      }))

      return {
        themeId: theme.id,
        label: theme.label,
        aspect: theme.aspect,
        points,
        change: points[points.length - 1].mentions - points[0].mentions,
      }
    })
    .sort((a, b) => b.change - a.change)
    .slice(0, limit)
}

/** Word frequency across every verbatim — the Traditional screen's ceiling. */
export function selectWordFrequency(
  responses: SurveyResponse[],
  limit = 28,
): { word: string; count: number }[] {
  const STOP = new Set(
    ('the a an and or but of to in on at for with was were is are be been i we my our you your it its ' +
      'that this they them he she has have had do did not no so as from by up out if then than very ' +
      'me us me about after before all any been because been more most other some such only own same ' +
      'too can will just should now')
      .split(' '),
  )

  const counts = new Map<string, number>()
  for (const response of responses) {
    for (const raw of response.verbatim.toLowerCase().split(/[^a-z]+/)) {
      if (raw.length < 4 || STOP.has(raw)) continue
      counts.set(raw, (counts.get(raw) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export interface TouchpointCsat {
  touchpoint: TouchpointId
  label: string
  /** Mean of the 1–5 CSAT scores. */
  csat: number
  /** Share scoring 4 or 5, the conventional "satisfied" cut. */
  satisfiedPct: number
  responses: number
  nps: number
}

export function selectCsatByTouchpoint(
  responses: SurveyResponse[],
): TouchpointCsat[] {
  return TOUCHPOINT_ORDER.map((touchpoint) => {
    const rows = responses.filter((r) => r.touchpoint === touchpoint)
    const sum = rows.reduce((s, r) => s + r.csatScore, 0)
    const satisfied = rows.filter((r) => r.csatScore >= 4).length

    return {
      touchpoint,
      label: TOUCHPOINT_LABEL[touchpoint],
      csat: rows.length ? Math.round((sum / rows.length) * 100) / 100 : 0,
      satisfiedPct: rows.length
        ? Math.round((satisfied / rows.length) * 1000) / 10
        : 0,
      responses: rows.length,
      nps: rows.length ? selectNpsSummary(rows).nps : 0,
    }
  }).filter((row) => row.responses > 0)
}

export interface SentimentBreakdown {
  positive: number
  neutral: number
  negative: number
  total: number
  /** Frequency of each theme label, for the Type 1 theme-count chart. */
  themeCounts: { label: string; count: number }[]
}

export function selectSentimentBreakdown(
  responses: SurveyResponse[],
): SentimentBreakdown {
  const count = (s: Sentiment) =>
    responses.filter((r) => r.sentiment === s).length

  const counts = new Map<string, number>()
  for (const response of responses) {
    for (const def of matchThemes(response.verbatim)) {
      counts.set(def.id, (counts.get(def.id) ?? 0) + 1)
    }
  }

  return {
    positive: count('positive'),
    neutral: count('neutral'),
    negative: count('negative'),
    total: responses.length,
    themeCounts: [...counts.entries()]
      .map(([id, n]) => ({ label: themeById(id)?.label ?? id, count: n }))
      .sort((a, b) => b.count - a.count),
  }
}

/* ------------------------------------------------------------------ */
/* Type 2 — voice of customer                                          */
/* ------------------------------------------------------------------ */

/** Every theme whose keywords appear in the text and are not vetoed. */
function matchThemes(verbatim: string) {
  const text = verbatim.toLowerCase()
  return ref().themes.filter((def) => {
    if (def.excludes?.some((phrase) => text.includes(phrase))) return false
    return def.keywords.some((keyword) => text.includes(keyword))
  })
}

/**
 * The span of the verbatim that triggered a theme.
 *
 * Returns the sentence containing the keyword rather than the keyword alone —
 * a bare keyword is not evidence a human can check, and the guardrail requires
 * traceability back to the customer's own words.
 */
function evidenceSpan(verbatim: string, keywords: string[]) {
  const sentences = verbatim.split(/(?<=[.!?])\s+/)
  // The sentence with the most keyword hits, not merely the first to match.
  // Taking the first put the same shared sentence against two different themes
  // when a later sentence spoke to one of them far more directly.
  let best = ''
  let bestHits = 0
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase()
    const hits = keywords.filter((keyword) => lower.includes(keyword)).length
    if (hits > bestHits) {
      bestHits = hits
      best = sentence
    }
  }
  return (bestHits > 0 ? best : verbatim).trim()
}

/**
 * Confidence in a theme assignment.
 *
 * Volume is most of it — three mentions is a hint, eighty is a pattern — with a
 * bonus when several distinct keywords for the same theme fire together.
 * Capped below 100 because a rule pass is never certain.
 */
function confidenceFor(mentions: number, keywordBreadth: number) {
  // Tuned so a handful of mentions lands near 45 and a thousand near 90. An
  // earlier curve saturated by ~14 mentions, which reported 94% confidence on
  // the emerging theme the indicator exists to qualify.
  const volume = Math.min(50, Math.log2(mentions + 1) * 6)
  const breadth = Math.min(20, keywordBreadth * 5)
  return Math.max(30, Math.min(92, Math.round(20 + volume + breadth)))
}

export function selectThemes(responses: SurveyResponse[]): FeedbackTheme[] {
  const acc = new Map<
    string,
    { responseIds: string[]; evidence: string[]; keywords: Set<string> }
  >()

  for (const response of responses) {
    const text = response.verbatim.toLowerCase()
    for (const def of matchThemes(response.verbatim)) {
      const entry = acc.get(def.id) ?? {
        responseIds: [],
        evidence: [],
        keywords: new Set<string>(),
      }
      entry.responseIds.push(response.id)
      // Authored records lead the evidence list so the hero verbatim is the
      // first thing a presenter sees when they open a theme.
      const span = evidenceSpan(response.verbatim, def.keywords)
      if (entry.evidence.length < 6 && !entry.evidence.includes(span)) {
        if (response.featured) entry.evidence.unshift(span)
        else entry.evidence.push(span)
      }
      for (const keyword of def.keywords) {
        if (text.includes(keyword)) entry.keywords.add(keyword)
      }
      acc.set(def.id, entry)
    }
  }

  const responsesById = new Map(responses.map((r) => [r.id, r]))

  return [...acc.entries()]
    .map(([id, entry]) => {
      const def = themeById(id)
      const rows = entry.responseIds
        .map((rid) => responsesById.get(rid))
        .filter((r): r is SurveyResponse => Boolean(r))
      const negative = rows.filter((r) => r.sentiment === 'negative').length
      const positive = rows.filter((r) => r.sentiment === 'positive').length

      const sentiment: Sentiment =
        negative > positive
          ? 'negative'
          : positive > negative
            ? 'positive'
            : 'neutral'

      return {
        id,
        label: def.label,
        parentId: def.parentId,
        aspect: def.aspect,
        sentiment,
        confidence: confidenceFor(entry.responseIds.length, entry.keywords.size),
        mentions: entry.responseIds.length,
        responseIds: entry.responseIds,
        evidence: entry.evidence,
        // Flagged in the taxonomy and genuinely low-volume. Both must hold, or
        // the confidence indicator is decorative.
        emerging: Boolean(def.emerging) && entry.responseIds.length <= 40,
        suggestedCrmTag: def.suggestedCrmTag,
      }
    })
    .sort((a, b) => b.mentions - a.mentions)
}

/**
 * The themes present in one response, carrying *that response's* evidence.
 *
 * The theme-level `evidence` array is drawn from the whole book, so rendering it
 * on a single record shows another customer's words next to this customer's
 * score. Drilling in from a record must quote the record.
 */
export function selectThemesForResponse(
  response: SurveyResponse,
  themes: FeedbackTheme[],
): FeedbackTheme[] {
  const defsById = Object.fromEntries(ref().themes.map((d) => [d.id, d]))
  return themes
    .filter((theme) => theme.responseIds.includes(response.id))
    .map((theme) => ({
      ...theme,
      evidence: [evidenceSpan(response.verbatim, defsById[theme.id]?.keywords ?? [])],
    }))
}

/* ------------------------------------------------------------------ */
/* Root cause                                                          */
/* ------------------------------------------------------------------ */

/**
 * Groups themes into clusters against the journey stage they concentrate in.
 *
 * `correlation` is the strength of association between the theme appearing and
 * the response being a detractor. It is a diagnostic signal requiring business
 * validation — never a causal claim, and the UI copy must not imply one.
 */
/**
 * Volume floors.
 *
 * Six mentions is an anecdote. Without a floor a six-response theme surfaced as
 * the second-worst driver in the book, which is the kind of thing a client
 * checks and loses confidence over.
 */
const MIN_CLUSTER_RESPONSES = 10
const MIN_DRIVER_MENTIONS = 25

export function selectRootCauseClusters(
  responses: SurveyResponse[],
  themes: FeedbackTheme[],
): RootCauseCluster[] {
  const responsesById = new Map(responses.map((r) => [r.id, r]))
  const bookMeanNps = responses.length
    ? responses.reduce((s, r) => s + r.npsScore, 0) / responses.length
    : 0
  const bookDetractorRate = responses.length
    ? responses.filter((r) => r.npsBand === 'detractor').length / responses.length
    : 0

  return themes
    .map((theme) => {
      const rows = theme.responseIds
        .map((id) => responsesById.get(id))
        .filter((r): r is SurveyResponse => Boolean(r))

      /*
       * A cluster is built from the complaints about an aspect, not from the
       * aspect's overall mood. Filtering on the theme's majority sentiment hid
       * Documentation entirely — most people who mention paperwork are content,
       * yet the third who are not is precisely the operational problem.
       */
      const negative = rows.filter((r) => r.sentiment === 'negative')
      if (negative.length < MIN_CLUSTER_RESPONSES) return null

      const meanNps = negative.reduce((s, r) => s + r.npsScore, 0) / negative.length

      // Correlation is measured across everyone who raised the aspect, so a
      // common topic is not flattered by looking only at its complaints.
      const themeDetractorRate = rows.length
        ? rows.filter((r) => r.npsBand === 'detractor').length / rows.length
        : 0
      const correlation =
        Math.round(
          Math.max(-1, Math.min(1, themeDetractorRate - bookDetractorRate)) * 100,
        ) / 100

      const featured = negative.filter((r) => r.featured)
      const evidenceRows = [...featured, ...negative.filter((r) => !r.featured)]

      return {
        id: `cls-${theme.id}`,
        label: theme.label,
        themeIds: [theme.id],
        journeyStage: modeOf(negative.map((r) => r.journeyStage)) ?? 'engaged',
        touchpoint: modeOf(negative.map((r) => r.touchpoint)) ?? 'sales',
        projectIds: [...new Set(negative.map((r) => r.projectId))],
        repeatCount: negative.length,
        correlation,
        affectedResponses: negative.length,
        npsDrag: Math.round((meanNps - bookMeanNps) * 10) / 10,
        evidence: evidenceRows.slice(0, 3).map((r) => r.verbatim),
      }
    })
    .filter((c): c is RootCauseCluster => c !== null)
    .sort((a, b) => a.npsDrag - b.npsDrag)
}

function modeOf<T extends string>(values: T[]): T | undefined {
  if (!values.length) return undefined
  const counts = new Map<T, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

export interface JourneyHeatCell {
  stage: JourneyStage
  touchpoint: TouchpointId
  responses: number
  nps: number
  detractorPct: number
}

/** Journey stage × touchpoint grid backing the root-cause heatmap. */
export function selectJourneyHeatmap(
  responses: SurveyResponse[],
): JourneyHeatCell[] {
  const cells = new Map<string, SurveyResponse[]>()
  for (const response of responses) {
    const key = `${response.journeyStage}::${response.touchpoint}`
    const list = cells.get(key)
    if (list) list.push(response)
    else cells.set(key, [response])
  }

  return [...cells.entries()].map(([key, rows]) => {
    const [stage, touchpoint] = key.split('::') as [JourneyStage, TouchpointId]
    const detractors = rows.filter((r) => r.npsBand === 'detractor').length
    return {
      stage,
      touchpoint,
      responses: rows.length,
      nps: selectNpsSummary(rows).nps,
      detractorPct: Math.round((detractors / rows.length) * 1000) / 10,
    }
  })
}

/* ------------------------------------------------------------------ */
/* Participation                                                       */
/* ------------------------------------------------------------------ */

export interface SurveyQueueRow {
  invite: SurveyInvite
  /** Propensity banded for the queue's colour coding. */
  band: 'high' | 'medium' | 'low'
}

function bandFor(propensity: number): SurveyQueueRow['band'] {
  if (propensity >= 70) return 'high'
  if (propensity >= 45) return 'medium'
  return 'low'
}

/**
 * The queue the optimiser works: what to send next, best first.
 *
 * Suppressed invites are returned separately rather than filtered away. An
 * optimiser that only shows what it would send looks like a mailing list; the
 * restraint is half the argument.
 */
export function selectSurveyQueue(invites: SurveyInvite[]) {
  const queued = invites
    .filter((i) => i.status === 'queued' && i.eligible)
    .sort((a, b) => b.responsePropensity - a.responsePropensity)
    .map((invite) => ({ invite, band: bandFor(invite.responsePropensity) }))

  /*
   * One row per customer, with the reasons interleaved.
   *
   * A lead carries an invite per touchpoint, so a suppressed customer appeared
   * three times in a row with the same sentence. Deduplicating fixes that.
   * Sorting alone does not fix the rest: any single sort key groups identical
   * reasons together, so the top of a list of eight distinct reasons still read
   * as one. Taking the strongest remaining row from each reason in turn shows
   * the range of judgements being made, which is the point of the panel.
   */
  const bestPerLead = new Map<string, SurveyInvite>()
  for (const invite of invites) {
    if (invite.status !== 'suppressed') continue
    const held = bestPerLead.get(invite.leadId)
    if (!held || invite.responsePropensity > held.responsePropensity) {
      bestPerLead.set(invite.leadId, invite)
    }
  }

  const byReason = new Map<string, SurveyInvite[]>()
  for (const invite of bestPerLead.values()) {
    const key = invite.suppressedLabel ?? 'other'
    const list = byReason.get(key)
    if (list) list.push(invite)
    else byReason.set(key, [invite])
  }
  for (const list of byReason.values()) {
    list.sort((a, b) => b.responsePropensity - a.responsePropensity)
  }

  const queues = [...byReason.values()]
  const interleaved: SurveyInvite[] = []
  for (let round = 0; interleaved.length < bestPerLead.size; round++) {
    let moved = false
    for (const list of queues) {
      const next = list[round]
      if (next) {
        interleaved.push(next)
        moved = true
      }
    }
    if (!moved) break
  }

  const suppressed = interleaved.map((invite) => ({
    invite,
    band: bandFor(invite.responsePropensity),
  }))

  const sent = invites.filter((i) => i.status !== 'queued' && i.status !== 'suppressed')
  const responded = sent.filter((i) => i.status === 'responded').length

  return {
    queued,
    suppressed,
    sentCount: sent.length,
    respondedCount: responded,
    responseRatePct: sent.length
      ? Math.round((responded / sent.length) * 1000) / 10
      : 0,
    /** Mean propensity of the queue — what the next send is worth. */
    queueMeanPropensity: queued.length
      ? Math.round(
          queued.reduce((s, r) => s + r.invite.responsePropensity, 0) /
            queued.length,
        )
      : 0,
  }
}

export interface PropensityCell {
  touchpoint: TouchpointId
  band: SurveyQueueRow['band']
  count: number
  meanPropensity: number
}

/** Touchpoint × propensity-band grid for the response-likelihood heatmap. */
export function selectPropensityHeatmap(
  invites: SurveyInvite[],
): PropensityCell[] {
  const out: PropensityCell[] = []
  const bands: SurveyQueueRow['band'][] = ['high', 'medium', 'low']

  for (const touchpoint of TOUCHPOINT_ORDER) {
    for (const band of bands) {
      const rows = invites.filter(
        (i) => i.touchpoint === touchpoint && bandFor(i.responsePropensity) === band,
      )
      if (!rows.length) continue
      out.push({
        touchpoint,
        band,
        count: rows.length,
        meanPropensity: Math.round(
          rows.reduce((s, i) => s + i.responsePropensity, 0) / rows.length,
        ),
      })
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Recovery                                                            */
/* ------------------------------------------------------------------ */

/** Negative = days until SLA, positive = days already breached. */
export function caseSlaDaysOverdue(recoveryCase: RecoveryCase) {
  return Math.round(
    (DEMO_NOW.getTime() - new Date(recoveryCase.slaDueAt).getTime()) /
      86_400_000,
  )
}

export interface RecoveryQueueRow {
  response: SurveyResponse
  existingCase?: RecoveryCase
  /** Set when an unresolved ticket preceded the detractor score. */
  hasBreachedTicket: boolean
  slaDaysOverdue?: number
}

/**
 * Detractors needing recovery, worst first.
 *
 * A response whose lead already had an unresolved ticket outranks an equal
 * score without one — the platform flagged that advocacy was at risk, and this
 * is the record showing it broke.
 */
export function selectRecoveryQueue(
  responses: SurveyResponse[],
  cases: RecoveryCase[],
): RecoveryQueueRow[] {
  const caseByResponse = new Map(cases.map((c) => [c.responseId, c]))

  return responses
    .filter((r) => r.npsBand === 'detractor')
    .map((response) => {
      const existingCase = caseByResponse.get(response.id)
      return {
        response,
        existingCase,
        hasBreachedTicket: Boolean(response.sourceTicketId),
        slaDaysOverdue: existingCase
          ? caseSlaDaysOverdue(existingCase)
          : undefined,
      }
    })
    .sort((a, b) => {
      const aOpen = a.existingCase ? 0 : 1
      const bOpen = b.existingCase ? 0 : 1
      if (aOpen !== bOpen) return bOpen - aOpen
      if (a.hasBreachedTicket !== b.hasBreachedTicket) {
        return a.hasBreachedTicket ? -1 : 1
      }
      return a.response.npsScore - b.response.npsScore
    })
}

export interface RecoverySummary {
  open: number
  inProgress: number
  escalated: number
  closed: number
  breaching: number
  closureRatePct: number
  /** Detractors with no case opened at all — the real exposure. */
  unworked: number
}

export function selectRecoverySummary(
  responses: SurveyResponse[],
  cases: RecoveryCase[],
): RecoverySummary {
  const count = (status: RecoveryCase['status']) =>
    cases.filter((c) => c.status === status).length

  const closed = count('closed')
  const detractors = responses.filter((r) => r.npsBand === 'detractor').length
  const withCase = new Set(cases.map((c) => c.responseId)).size

  return {
    open: count('open'),
    inProgress: count('in-progress'),
    escalated: count('escalated'),
    closed,
    breaching: cases.filter(
      (c) => c.status !== 'closed' && caseSlaDaysOverdue(c) > 0,
    ).length,
    closureRatePct: cases.length
      ? Math.round((closed / cases.length) * 1000) / 10
      : 0,
    unworked: Math.max(0, detractors - withCase),
  }
}

/* ------------------------------------------------------------------ */
/* Control tower                                                       */
/* ------------------------------------------------------------------ */

export interface SatisfactionDriver {
  label: string
  aspect: string
  sentiment: Sentiment
  mentions: number
  /** Mean NPS of responses carrying this theme, minus the book mean. */
  npsDelta: number
}

/** The themes moving satisfaction most, in both directions. */
export function selectDrivers(
  responses: SurveyResponse[],
  themes: FeedbackTheme[],
): { strengths: SatisfactionDriver[]; drags: SatisfactionDriver[] } {
  const responsesById = new Map(responses.map((r) => [r.id, r]))
  const bookMean = responses.length
    ? responses.reduce((s, r) => s + r.npsScore, 0) / responses.length
    : 0

  const drivers = themes
    .filter((theme) => theme.mentions >= MIN_DRIVER_MENTIONS)
    .map((theme) => {
      const rows = theme.responseIds
        .map((id) => responsesById.get(id))
        .filter((r): r is SurveyResponse => Boolean(r))
      const mean = rows.length
        ? rows.reduce((s, r) => s + r.npsScore, 0) / rows.length
        : 0

      return {
        label: theme.label,
        aspect: theme.aspect,
        sentiment: theme.sentiment,
        mentions: theme.mentions,
        npsDelta: Math.round((mean - bookMean) * 10) / 10,
      }
    })

  return {
    strengths: drivers
      .filter((d) => d.npsDelta > 0)
      .sort((a, b) => b.npsDelta - a.npsDelta)
      .slice(0, 5),
    drags: drivers
      .filter((d) => d.npsDelta < 0)
      .sort((a, b) => a.npsDelta - b.npsDelta)
      .slice(0, 5),
  }
}

/**
 * Improvement backlog derived from the clusters.
 *
 * Impact and effort are configured inputs, not model outputs — the matrix is a
 * planning aid, and presenting a prioritisation as if it were predicted would
 * overclaim exactly where the guardrails say not to.
 */
export function selectInterventions(
  clusters: RootCauseCluster[],
): Intervention[] {
  const EFFORT: Record<string, number> = {
    Documentation: 4,
    Service: 3,
    Handover: 8,
    Payment: 5,
    Quality: 9,
    Amenities: 3,
    Allotment: 2,
    Sales: 4,
  }

  const OWNER: Record<string, string> = {
    Documentation: 'Legal & Documentation',
    Service: 'Customer Care',
    Handover: 'Projects',
    Payment: 'Finance',
    Quality: 'Projects',
    Amenities: 'Facilities',
    Allotment: 'Sales Operations',
    Sales: 'Sales',
  }

  /*
   * Impact is normalised against the clusters actually present, not against an
   * absolute scale. An earlier formula multiplied the NPS drag by two, and
   * since every cluster drags between four and five points it produced 9 or 10
   * for all of them — every dot piled into the top of the matrix and every
   * backlog row came out "in flight". Volume is log-scaled so one very large
   * cluster does not flatten the rest to zero.
   */
  const maxDrag = Math.max(...clusters.map((c) => Math.abs(c.npsDrag)), 1)
  const maxVolume = Math.max(...clusters.map((c) => c.affectedResponses), 1)

  const ranked = clusters
    .map((cluster, i) => {
      const aspect = themeById(cluster.themeIds[0])?.aspect ?? 'Service'
      const dragNorm = Math.abs(cluster.npsDrag) / maxDrag
      const volumeNorm =
        Math.log10(1 + cluster.affectedResponses) / Math.log10(1 + maxVolume)
      const impact = Math.max(
        1,
        Math.min(10, Math.round(1 + 9 * (0.5 * dragNorm + 0.5 * volumeNorm))),
      )

      return {
        id: `int-${i.toString().padStart(3, '0')}`,
        title: `Address ${cluster.label.toLowerCase()}`,
        clusterId: cluster.id,
        impact,
        effort: EFFORT[aspect] ?? 5,
        owner: OWNER[aspect] ?? 'Customer Care',
        aspect,
      }
    })
    .sort((a, b) => b.impact - a.impact || a.effort - b.effort)

  /*
   * Status follows the ranking rather than an absolute impact threshold, so the
   * backlog always shows a real mix. A fixed cut-off marked everything
   * in-flight the moment the impact scores clustered.
   */
  return ranked.map((row, i) => ({
    ...row,
    status:
      i < 2 ? 'in-flight' : i < 4 ? 'planned' : ('backlog' as const),
  })) satisfies Intervention[]
}

/* ------------------------------------------------------------------ */
/* Segment comparison                                                  */
/* ------------------------------------------------------------------ */

export interface SegmentSatisfaction {
  id: string
  label: string
  responses: number
  nps: number
  csat: number
  detractorPct: number
  /** The aspect this segment complains about most, or an empty string. */
  topComplaint: string
}

function summariseSegment(
  id: string,
  label: string,
  rows: SurveyResponse[],
  themes: FeedbackTheme[],
): SegmentSatisfaction {
  const ids = new Set(rows.map((r) => r.id))
  const negative = rows.filter((r) => r.sentiment === 'negative')

  // Which aspect this segment complains about more than any other.
  let topComplaint = ''
  let best = 0
  for (const theme of themes) {
    if (theme.sentiment === 'positive') continue
    const hits = theme.responseIds.filter((rid) => ids.has(rid)).length
    if (hits > best) {
      best = hits
      topComplaint = theme.aspect
    }
  }

  return {
    id,
    label,
    responses: rows.length,
    nps: selectNpsSummary(rows).nps,
    csat: rows.length
      ? Math.round((rows.reduce((s, r) => s + r.csatScore, 0) / rows.length) * 100) / 100
      : 0,
    detractorPct: rows.length
      ? Math.round((rows.filter((r) => r.npsBand === 'detractor').length / rows.length) * 1000) / 10
      : 0,
    topComplaint: negative.length ? topComplaint : '',
  }
}

/**
 * Satisfaction by buyer persona.
 *
 * The brief asks Root Cause for a project and persona comparison. Persona is the
 * more actionable half: a developer can change how it sells to a segment far
 * faster than it can change a delivered project.
 */
export function selectSatisfactionByPersona(
  responses: SurveyResponse[],
  themes: FeedbackTheme[],
  personaLabel: (id: string) => string,
): SegmentSatisfaction[] {
  const groups = new Map<string, SurveyResponse[]>()
  for (const response of responses) {
    if (!response.personaId) continue
    const list = groups.get(response.personaId)
    if (list) list.push(response)
    else groups.set(response.personaId, [response])
  }

  return [...groups.entries()]
    .map(([id, rows]) => summariseSegment(id, personaLabel(id), rows, themes))
    .filter((row) => row.responses >= MIN_CLUSTER_RESPONSES)
    .sort((a, b) => a.nps - b.nps)
}

/** Satisfaction by project — the other half of the comparison. */
export function selectSatisfactionByProject(
  responses: SurveyResponse[],
  themes: FeedbackTheme[],
): SegmentSatisfaction[] {
  const groups = new Map<string, SurveyResponse[]>()
  for (const response of responses) {
    const list = groups.get(response.projectId)
    if (list) list.push(response)
    else groups.set(response.projectId, [response])
  }

  return [...groups.entries()]
    .map(([id, rows]) =>
      summariseSegment(id, rows[0].projectName.replace('Meridian ', ''), rows, themes),
    )
    .filter((row) => row.responses >= MIN_CLUSTER_RESPONSES)
    .sort((a, b) => a.nps - b.nps)
}

/** Band counts for the Type 1 promoter/passive/detractor split chart. */
export const NPS_BAND_ORDER: NpsBand[] = ['promoter', 'passive', 'detractor']

/**
 * The question set for one customer at one touchpoint.
 *
 * Locked questions always appear. Supporting questions qualify on touchpoint,
 * then on journey stage and persona where the library declares them — which is
 * what makes the survey specific to this customer rather than generic.
 *
 * Pure and React-free so the journey composer and the SPAR engine panel run
 * the same selection rather than two copies that can drift apart.
 */
export function composeQuestions(
  lead: Pick<Lead, 'stage'> | undefined,
  touchpoint: TouchpointId,
  personaId: string | undefined,
): SurveyQuestion[] {
  if (!lead) return []
  return SURVEY_QUESTIONS.filter((q) => {
    if (!q.touchpoints.includes(touchpoint)) return false
    if (q.journeyStages && !q.journeyStages.includes(lead.stage)) return false
    if (q.personaIds && !q.personaIds.includes(personaId ?? '')) return false
    return true
  })
}

/* ---------- Outcome measures ---------- */

/** Display names for the survey channels, for the outcome tallies. */
const SURVEY_CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
  call: 'Call',
  'in-app': 'In-app',
}

/**
 * Broader representation.
 *
 * The point of predicting who to ask is not a higher response count, it is a
 * less lopsided one — a programme can lift its response rate and still only
 * ever hear from the same segment. This compares who answered against who was
 * actually asked, so the gap is measured against the addressable book rather
 * than against an abstract ideal.
 */
export function selectRepresentation(
  invites: SurveyInvite[],
  responses: SurveyResponse[],
  personaLabel: (id: string) => string,
) {
  const askedStages = new Set(invites.filter((i) => i.sentAt).map((i) => i.journeyStage))
  const heardStages = new Set(responses.map((r) => r.journeyStage))

  const askedPersonas = new Set(ref().personas.map((p) => p.id))
  const heardPersonas = new Set(
    responses.map((r) => r.personaId).filter((id): id is string => Boolean(id)),
  )

  const missingStages = [...askedStages].filter((x) => !heardStages.has(x))
  const missingPersonas = [...askedPersonas].filter((x) => !heardPersonas.has(x))

  return {
    personasHeard: heardPersonas.size,
    personasAsked: askedPersonas.size,
    stagesHeard: heardStages.size,
    stagesAsked: askedStages.size,
    // Named so the gap is actionable rather than just a fraction.
    missingPersonaLabels: missingPersonas.map(personaLabel),
    missingStages,
  }
}

/**
 * Response knowledge — who responds, when, and through which channel.
 *
 * Reads only rows that actually came back, so it reports observed behaviour
 * rather than restating the predictions that produced the invites. That
 * distinction is the whole value of the measure: it is the feedback loop on
 * the engine, and it would be worthless if it simply echoed the model.
 */
export function selectResponseKnowledge(
  responses: SurveyResponse[],
  personaLabel: (id: string) => string,
) {
  const tally = (rows: string[]) => {
    const counts = new Map<string, number>()
    for (const key of rows) counts.set(key, (counts.get(key) ?? 0) + 1)
    return [...counts.entries()]
      .map(([label, count]) => ({
        label,
        count,
        pct: rows.length ? Math.round((count / rows.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }

  const DAY_PART_LABEL: Record<string, string> = {
    'weekday-day': 'Weekday daytime',
    'weekday-evening': 'Weekday evening',
    'weekend-day': 'Weekend daytime',
    'weekend-evening': 'Weekend evening',
  }

  return {
    total: responses.length,
    byChannel: tally(responses.map((r) => SURVEY_CHANNEL_LABEL[r.channel] ?? r.channel)),
    byDayPart: tally(
      responses.map((r) => DAY_PART_LABEL[dayPartOf(r.respondedAt)] ?? 'Unknown'),
    ),
    byPersona: tally(
      responses
        .map((r) => r.personaId)
        .filter((id): id is string => Boolean(id))
        .map(personaLabel),
    ),
  }
}

/**
 * What the engine actually reads.
 *
 * The pitch names six data inputs; this counts them off the live book so the
 * claim is auditable on screen rather than asserted on a slide. Every figure
 * is derived from the same records the predictions run on — if an input were
 * ever disconnected, its row here would go to zero rather than keep printing
 * a number that sounds right.
 */
export function selectDataInputs(input: {
  leads: Lead[]
  engagements: Engagement[]
  payments: Payment[]
  invites: SurveyInvite[]
  responses: SurveyResponse[]
  ingestedLeadIds: string[]
}) {
  const { leads, engagements, payments, invites, responses } = input
  const ingested = new Set(input.ingestedLeadIds)

  const sent = invites.filter((i) => i.sentAt)
  const responded = invites.filter((i) => i.status === 'responded')
  const lapsed = invites.filter(
    (i) => i.status === 'expired' || i.status === 'abandoned',
  )
  const overdue = payments.filter((p) => p.status === 'overdue')
  const channels = new Set(invites.map((i) => i.channel))
  const withHistory = new Set(engagements.map((e) => e.leadId))

  return [
    {
      label: 'Customer and project profile',
      value: formatNumber(leads.length),
      detail: `${ref().projects.length} projects · ${ref().personas.length} personas mapped`,
      usedFor: 'Who exists, and which persona and stage they sit in',
    },
    {
      label: 'CSAT/NPS invitations and responses',
      value: `${formatNumber(invites.length)} / ${formatNumber(responses.length)}`,
      detail: `${formatNumber(sent.length)} actually sent`,
      usedFor: 'The book every score, theme and trend is computed from',
    },
    {
      label: 'Respondent and non-respondent history',
      value: `${formatNumber(responded.length)} / ${formatNumber(lapsed.length)}`,
      detail: 'Responded vs. expired or abandoned',
      usedFor: 'Trains the response-likelihood prediction',
    },
    {
      label: 'Survey date, time, and comm. channels',
      value: formatNumber(engagements.length),
      detail: `${channels.size} channels · ${formatNumber(withHistory.size)} customers with contact history`,
      usedFor: 'Picks the preferred channel and the right moment',
    },
    {
      label: 'Transaction milestones',
      value: formatNumber(payments.length),
      detail: `${formatNumber(overdue.length)} overdue`,
      usedFor: 'Holds back a survey landing beside a demand letter',
    },
    {
      label: 'Ingested interaction history',
      // A count, not a share. At the seeded 9 of 12,842 a percentage rounds to
      // 0% and reads as a broken feed rather than as a backlog waiting to be
      // ingested.
      value: formatNumber(ingested.size),
      detail: `of ${formatNumber(leads.length)} records, arrived via EAI`,
      // Scope stated exactly. Ingestion gates what the agents may act on; it
      // does not filter the scores and themes on these screens, and implying
      // otherwise would misrepresent every figure above.
      usedFor: 'Gates what agents may act on — the figures above read the full book',
    },
    {
      label: 'Survey performance',
      value: sent.length
        ? `${Math.round((responded.length / sent.length) * 100)}%`
        : '0%',
      detail: `${formatNumber(responded.length)} of ${formatNumber(sent.length)} sent`,
      usedFor: 'The baseline every outcome below is measured against',
    },
  ]
}
