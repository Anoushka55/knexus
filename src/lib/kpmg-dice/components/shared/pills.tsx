import type { EvidenceStatus, IntentLevel, JourneyStage, Sentiment, Severity } from '@/lib/kpmg-dice/types'
import { cn } from '@/lib/kpmg-dice/lib/utils'

const BASE = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize whitespace-nowrap'

const INTENT_TONE: Record<IntentLevel, string> = {
  high: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-sky-50 text-sky-700',
  low: 'bg-slate-100 text-slate-600',
  cold: 'bg-red-50 text-red-700',
}

export function IntentPill({ intent }: { intent: IntentLevel }) {
  return <span className={cn(BASE, INTENT_TONE[intent])}>{intent}</span>
}

const SENTIMENT_TONE: Record<Sentiment, string> = {
  positive: 'bg-emerald-50 text-emerald-700',
  neutral: 'bg-slate-100 text-slate-600',
  negative: 'bg-red-50 text-red-700',
}

export function SentimentPill({ sentiment }: { sentiment: Sentiment }) {
  return <span className={cn(BASE, SENTIMENT_TONE[sentiment])}>{sentiment}</span>
}

/** Stage reads as a neutral chip — the funnel already carries the colour story. */
export function StagePill({ stage }: { stage: JourneyStage }) {
  const closed = stage.startsWith('closed')
  return (
    <span
      className={cn(
        BASE,
        closed
          ? stage === 'closed-won'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-slate-100 text-slate-500'
          : 'bg-slate-100 text-slate-700',
      )}
    >
      {stage.replace('-', ' ')}
    </span>
  )
}

const EVIDENCE_TONE: Record<EvidenceStatus, string> = {
  'strong-evidence': 'bg-emerald-50 text-emerald-700',
  supported: 'bg-emerald-50/70 text-emerald-700',
  'weak-evidence': 'bg-amber-50 text-amber-700',
  unverified: 'bg-slate-100 text-slate-500',
  contradicted: 'bg-red-50 text-red-700',
}

const EVIDENCE_LABEL: Record<EvidenceStatus, string> = {
  'strong-evidence': 'Strong',
  supported: 'Supported',
  'weak-evidence': 'Weak',
  unverified: 'Unverified',
  contradicted: 'Contradicted',
}

export function EvidencePill({ status }: { status: EvidenceStatus }) {
  return <span className={cn(BASE, EVIDENCE_TONE[status])}>{EVIDENCE_LABEL[status]}</span>
}

/** Status ramp — reserved for state, never reused as a categorical hue. */
const SEVERITY_TONE: Record<Severity, string> = {
  critical: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-amber-50 text-amber-700',
  info: 'bg-slate-100 text-slate-600',
}

export function SeverityPill({ severity }: { severity: Severity }) {
  return <span className={cn(BASE, SEVERITY_TONE[severity])}>{severity}</span>
}

const STATUS_TONE: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700',
  due: 'bg-slate-100 text-slate-600',
  overdue: 'bg-red-50 text-red-700',
  open: 'bg-red-50 text-red-700',
  'in-progress': 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  booked: 'bg-emerald-50 text-emerald-700',
  considering: 'bg-amber-50 text-amber-700',
  dropped: 'bg-red-50 text-red-700',
  pending: 'bg-slate-100 text-slate-600',
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn(BASE, STATUS_TONE[status] ?? 'bg-slate-100 text-slate-600')}>
      {status.replace('-', ' ')}
    </span>
  )
}
