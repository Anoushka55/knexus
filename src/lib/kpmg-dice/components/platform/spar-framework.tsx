import { ArrowRight, Brain, Clock, MessageSquare, Send } from 'lucide-react'

import { CONDITIONAL_FOLLOW_UPS } from '@/lib/kpmg-dice/data/feedback'

/**
 * The KPMG SPAR AI Engine, as the deck draws it.
 *
 * Four outer stages wrapping four numbered decisions. Unlike the CRM
 * architecture beside it, this one is fully built — it runs per customer on the
 * Survey Participation Optimizer — so the section says so and links there
 * rather than presenting itself as a target.
 *
 * The step names and their 1,2 / 4,3 arrangement mirror the live panel exactly.
 * The follow-up branches are read from the same CONDITIONAL_FOLLOW_UPS the
 * engine uses, so the framework card and the running product cannot drift.
 */

const CYCLE = [
  {
    label: 'Predict',
    question: 'Who is most likely to respond?',
    icon: Brain,
    reads: 'Recency, WhatsApp replies, email opens, calls answered',
  },
  {
    label: 'Time',
    question: 'When is the right moment to ask?',
    icon: Clock,
    reads: "The customer's own contact history, bucketed by day-part",
  },
  {
    label: 'Select',
    question: 'Which channel should be used?',
    icon: Send,
    reads: 'Whichever channel that customer actually engages on',
  },
  {
    label: 'Personalize',
    question: 'What message & questions should be sent?',
    icon: MessageSquare,
    reads: 'Touchpoint, journey stage and persona',
  },
]

/** The slide's inner grid: 1 and 2 across the top, 4 and 3 beneath. */
const STEPS = [
  { n: 1, label: 'Smart follow-up' },
  { n: 2, label: 'Preferred channel' },
  { n: 4, label: 'At the right moment' },
  { n: 3, label: 'Relevant questions' },
]

const EXPERIENCE = ['Timely', 'Relevant', 'Short', 'Transparent']

export function SparFramework() {
  return (
    <div>
      {/* The four outer stages */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {CYCLE.map((stage, i) => {
          const Icon = stage.icon
          return (
            <div
              key={stage.label}
              className="relative min-w-0 rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center gap-1.5">
                <Icon className="size-3.5 shrink-0 text-kpmg-blue" strokeWidth={2.2} />
                <p className="text-[12.5px] font-bold text-slate-900">
                  {stage.label}
                </p>
              </div>
              <p className="mt-1 text-[11.5px] leading-snug text-slate-600">
                {stage.question}
              </p>
              <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-[11px] leading-snug text-slate-500">
                Reads: {stage.reads}
              </p>

              {/* Direction of travel, on wide layouts only. */}
              {i < CYCLE.length - 1 && (
                <ArrowRight
                  className="absolute -right-[11px] top-1/2 hidden size-4 -translate-y-1/2 text-slate-300 xl:block"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
            </div>
          )
        })}
      </div>

      {/* The four numbered decisions */}
      <div className="mt-3 rounded-xl border border-kpmg-violet/25 bg-kpmg-violet/[0.04] p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-kpmg-violet">
          KPMG SPAR AI Engine
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <span className="nums text-[17px] font-bold leading-none text-kpmg-violet">
                {step.n}
              </span>
              <span className="text-[12.5px] font-semibold text-slate-800">
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Follow-up branches, read from the same table the engine uses. */}
        <div className="mt-2.5 border-t border-kpmg-violet/15 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Follow-up branches on the score, not on the customer
          </p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {CONDITIONAL_FOLLOW_UPS.map((row) => (
              <li key={row.band} className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">{row.when}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Customer-friendly survey experience */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg bg-slate-50 px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Customer-friendly survey experience
        </span>
        {EXPERIENCE.map((word, i) => (
          <span key={word} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-300">|</span>}
            <span className="text-[11.5px] font-semibold text-slate-700">
              {word}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

export const SPAR_NOTE =
  'This one is not a target state — it runs per customer in the Survey Participation Optimizer, where every step states the evidence behind its own decision.'
