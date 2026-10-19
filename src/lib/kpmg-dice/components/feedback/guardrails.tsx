import {
  Lock,
  Quote,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * Guardrail primitives.
 *
 * The brief's guardrails are build requirements, not commentary, so they are
 * components rather than a review checklist — built once here and inherited by
 * every screen. Retrofitting six screens at the end is how a guardrail quietly
 * ends up on five of them.
 */

/**
 * Confidence in an AI-derived claim.
 *
 * Deliberately not colour-coded green at the top end — high confidence in a
 * rule pass is still a machine judgement, and a green tick invites the reader
 * to stop checking.
 */
export function ConfidencePill({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const tone =
    value >= 75
      ? 'bg-slate-100 text-slate-700'
      : value >= 55
        ? 'bg-amber-50 text-amber-700'
        : 'bg-orange-50 text-orange-700'

  return (
    <span
      title={`${value}% confidence in this classification`}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        tone,
        className,
      )}
    >
      {value}%
      <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">
        conf
      </span>
    </span>
  )
}

/**
 * The customer's own words behind a claim.
 *
 * Never paraphrased. A theme, cluster or recommendation that cannot quote the
 * text it came from has no business being shown.
 */
export function EvidenceList({
  spans,
  label = 'Supporting text',
  className,
}: {
  spans: string[]
  label?: string
  className?: string
}) {
  if (!spans.length) return null

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <ul className="space-y-1.5">
        {spans.map((span, i) => (
          <li key={i} className="flex gap-1.5">
            <Quote
              className="mt-0.5 size-3 shrink-0 text-slate-300"
              strokeWidth={2.2}
            />
            <p className="min-w-0 text-[11.5px] italic leading-snug text-slate-600">
              {span}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Standard NPS wording is governed — the composer renders it read-only. */
export function LockedQuestionBadge() {
  return (
    <span
      title="Standard NPS wording — locked to keep results benchmarkable"
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-slate-500"
    >
      <Lock className="size-2.5" strokeWidth={2.4} />
      Governed
    </span>
  )
}

/**
 * Marks an action as requiring human approval before anything is sent.
 *
 * Used on every surface that drafts customer contact or opens a case, so the
 * approval step is visible before the click rather than implied by it.
 */
export function HumanReviewNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-500">
      <ShieldCheck
        className="mt-px size-3.5 shrink-0 text-kpmg-teal"
        strokeWidth={2.1}
      />
      <span>{children}</span>
    </p>
  )
}

/**
 * Marks a figure as predicted rather than collected.
 *
 * The distinction the feature layer leans on hardest: a measured NPS and an
 * inferred one are not the same kind of fact, and a screen that shows both has
 * to say which is which without the reader having to work it out. Deliberately
 * not the teal used for the human-review note — that one confirms a safeguard
 * is in place, this one warns that a number is softer than it looks.
 */
export function InferredNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-500">
      <Sparkles
        className="mt-px size-3.5 shrink-0 text-kpmg-violet"
        strokeWidth={2.1}
      />
      <span>{children}</span>
    </p>
  )
}

/**
 * Diagnostic framing for a correlation.
 *
 * The brief is explicit that correlations are presented as diagnostic outputs,
 * never as proven causality, so the wording lives here rather than being
 * retyped — and mistyped — on each screen that shows one.
 */
export function CorrelationNote({ value }: { value: number }) {
  const strength =
    Math.abs(value) >= 0.5
      ? 'a strong association'
      : Math.abs(value) >= 0.2
        ? 'a moderate association'
        : 'a weak association'

  return (
    <p className="text-[11px] leading-snug text-slate-500">
      Shows {strength} with detractor scores. Diagnostic only — requires
      business validation before it is treated as a cause.
    </p>
  )
}
