'use client'

import {
  ArrowDown,
  BarChart3,
  Box,
  Boxes,
  Building2,
  Check,
  Clock,
  Database,
  Filter,
  Funnel,
  Layers,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Palette,
  RefreshCw,
  Send,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { useActiveRole } from '@/lib/kpmg-dice/components/layout/restriction'
import { cn } from '@/lib/kpmg-dice/lib/utils'

/**
 * The technical stack, request to record.
 *
 * Read top-down: a request enters at the user and resolves downward, and data
 * is drawn from the sources at the base. Every version is taken from
 * package.json rather than recalled — a stack diagram that misstates its own
 * dependencies is worse than not having one.
 *
 * Pills state what is true and nothing more. "Simulated" marks a layer modelled
 * faithfully but not wired to a client system; there is no pill anywhere that
 * implies an integration this build does not have.
 */

type Accent = 'navy' | 'violet' | 'teal'

const ACCENT_BAR: Record<Accent, string> = {
  navy: 'border-t-kpmg-navy',
  violet: 'border-t-kpmg-violet',
  teal: 'border-t-kpmg-teal',
}

const ACCENT_ICON: Record<Accent, string> = {
  navy: 'bg-kpmg-navy/10 text-kpmg-navy',
  violet: 'bg-kpmg-violet/10 text-kpmg-violet',
  teal: 'bg-kpmg-teal/10 text-kpmg-teal',
}

interface Node {
  title: string
  detail?: string
  icon?: LucideIcon
  chips?: string[]
  pill?: { text: string; tone: 'teal' | 'amber' | 'slate' }
}

function Pill({ text, tone }: NonNullable<Node['pill']>) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider',
        tone === 'teal' && 'border-emerald-200 bg-emerald-50 text-kpmg-teal',
        tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'slate' && 'border-slate-200 bg-slate-100 text-slate-500',
      )}
    >
      {text}
    </span>
  )
}

function Card({
  node,
  accent,
  center,
}: {
  node: Node
  accent: Accent
  center?: boolean
}) {
  const Icon = node.icon
  return (
    <div
      className={cn(
        'min-w-0 rounded-xl border border-slate-200 border-t-[3px] bg-white p-3.5 shadow-card',
        ACCENT_BAR[accent],
      )}
    >
      <div
        className={cn(
          'flex items-start gap-2.5',
          center && !Icon && 'justify-center text-center',
        )}
      >
        {Icon && (
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-lg',
              ACCENT_ICON[accent],
            )}
          >
            <Icon className="size-[15px]" strokeWidth={2.1} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[13px] font-bold leading-snug tracking-[-0.005em] text-slate-900">
              {node.title}
            </h3>
            {node.pill && <Pill {...node.pill} />}
          </div>
          {node.detail && (
            <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">
              {node.detail}
            </p>
          )}
        </div>
      </div>

      {node.chips && node.chips.length > 0 && (
        <div className={cn('mt-2 flex flex-wrap gap-1', center && 'justify-center')}>
          {node.chips.map((chip) => (
            <span
              key={chip}
              className="nums rounded-full bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center gap-3">
      <span className="h-px flex-1 bg-slate-100" />
      <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-slate-100" />
    </div>
  )
}

function Flow() {
  return (
    <div className="flex justify-center py-1.5" aria-hidden>
      <ArrowDown className="size-4 text-slate-300" strokeWidth={1.8} />
    </div>
  )
}

const EXPERIENCE: Node[] = [
  { title: 'Command Center', detail: 'Funnel, alerts, next best action', icon: LayoutDashboard },
  { title: 'Customer 360', detail: 'One profile across every channel', icon: UserRound },
  { title: 'Copilots', detail: 'Sales · Payment · Service', icon: MessageSquare },
  { title: 'CSAT & NPS', detail: 'Nine feedback use cases', icon: LineChart },
  { title: 'Manager views', detail: 'Pipeline truth, team, reports', icon: BarChart3 },
]

const RUNTIME: Node[] = [
  {
    title: 'Next.js App Router',
    detail: 'React Server Components, static generation',
    icon: Boxes,
    chips: ['Next.js 15.5', 'React 19.2', 'TypeScript 5.7', '36 routes'],
  },
  {
    title: 'Interface layer',
    detail: 'Design system, charts, iconography',
    icon: Palette,
    chips: ['Tailwind 3.4', 'Radix + shadcn', 'Recharts 3.10', 'lucide'],
  },
]

const STATE: Node[] = [
  {
    title: 'Zustand store',
    detail: 'Single source of client truth — leads, engagements, feedback, activity',
    icon: Database,
    chips: ['Zustand 5.0', '3 stores'],
  },
  {
    title: 'Selector layer',
    detail: 'Pure functions over arrays — one memoised pass feeds every screen',
    icon: Funnel,
    chips: ['7 modules', 'Pure'],
  },
]

const AI_SERVICE: Node[] = [
  {
    title: 'MockAIService',
    detail: 'Seeded reasoning, identical every run',
    icon: Box,
    pill: { text: 'Deterministic', tone: 'teal' },
  },
  {
    title: 'LiveAIService',
    detail: 'Server route to a hosted language model',
    icon: Send,
    chips: ['Server-side'],
  },
  {
    title: 'Per-call fallback',
    detail: 'A failed live call drops to mock rather than to a dead end',
    icon: Check,
  },
]

const FOUNDATION: Node[] = [
  {
    title: 'Seeded generator',
    detail: 'mulberry32 PRNG on a fixed clock — byte-identical on server and client',
    icon: Clock,
    pill: { text: 'Deterministic', tone: 'teal' },
    chips: ['12,842 leads'],
  },
  {
    title: 'EAI ingestion',
    detail: 'Connectors, event routing, identity resolution',
    icon: Send,
    chips: ['Batch pull'],
  },
  {
    title: 'Sanitization',
    detail: 'De-duplication, PII masking, validation',
    icon: Filter,
    chips: ['Funnel reconciles'],
  },
]

const SOURCES = [
  { title: 'Website & portals', detail: 'Enquiry forms' },
  { title: 'WhatsApp', detail: 'Conversation history' },
  { title: 'Email', detail: 'Inbound & outbound' },
  { title: 'Call centre', detail: 'Logs & transcripts' },
  { title: 'Site visits', detail: 'Walk-ins' },
  { title: 'Campaigns', detail: 'Attributed response' },
  { title: 'Surveys', detail: 'CSAT / NPS' },
  { title: 'Service tickets', detail: 'Post-sales' },
]

const LOOP_STEPS = [
  'Agent proposes',
  'Evidence shown',
  'Human commits',
  'Activity feed',
]

export function TechStack() {
  /*
   * The request enters the stack at whoever is actually signed in, so the top
   * card reads the live seat rather than a fixed role. It used to say "Sales
   * Manager" while the header said Managing Director.
   */
  const activeRole = useActiveRole()

  return (
    <div className="animate-fade-in">
      {/* Head */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
        Proprietary KPMG DICE Architecture
      </p>
      <h2 className="mt-1 text-[23px] font-bold tracking-[-0.02em] text-slate-900">
        Technical stack &mdash; request to record
      </h2>
      <p className="mt-1 max-w-[70ch] text-[13px] text-slate-500">
        Every layer this build actually runs on, top to bottom. A request enters at
        the user and resolves downward; data is drawn from the sources at the base.
        Versions are read from <code className="text-[12px]">package.json</code>, not
        recalled.
      </p>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
        {(
          [
            ['navy', 'Interface & runtime'],
            ['violet', 'Intelligence'],
            ['teal', 'Data & records'],
          ] as [Accent, string][]
        ).map(([accent, label]) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-[11.5px] text-slate-500"
          >
            <span
              className={cn(
                'h-[3px] w-2.5 rounded-sm',
                accent === 'navy' && 'bg-kpmg-navy',
                accent === 'violet' && 'bg-kpmg-violet',
                accent === 'teal' && 'bg-kpmg-teal',
              )}
            />
            {label}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-[11.5px] text-slate-500">
          <Pill text="Pill" tone="slate" /> states what is real, never what is
          aspirational
        </span>
      </div>

      {/* User — whichever seat is signed in, not a fixed one */}
      <Divider label="User" />
      <div className="mx-auto max-w-[430px]">
        <Card
          accent="navy"
          node={{
            title: activeRole.role,
            detail: `${activeRole.name} · ${activeRole.scope}`,
            icon: Users,
          }}
        />
      </div>

      <Flow />
      <Divider label="Experience layer — what the team actually uses" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {EXPERIENCE.map((node) => (
          <Card key={node.title} node={node} accent="navy" />
        ))}
      </div>

      <Flow />
      <Divider label="Frontend runtime" />
      <div className="grid gap-3 md:grid-cols-2">
        {RUNTIME.map((node) => (
          <Card key={node.title} node={node} accent="navy" />
        ))}
      </div>

      <Flow />
      <Divider label="State & derivation" />
      <div className="grid gap-3 md:grid-cols-2">
        {STATE.map((node) => (
          <Card key={node.title} node={node} accent="violet" />
        ))}
      </div>

      <Flow />
      <Divider label="Agent layer — 17 agents, 7 KPMG archetypes" />
      <div className="mx-auto max-w-[560px]">
        <Card
          accent="violet"
          node={{
            title: 'Agent contract',
            detail: 'detectSync → recommendAction → declared CrmWrite',
            icon: Layers,
            chips: [
              'Pattern identifiers',
              'Predictive',
              'Extractors',
              'Assistants',
              'Generators',
            ],
          }}
        />
      </div>

      <Flow />
      <Divider label="AI service — one interface, two implementations" />
      <div className="grid gap-3 md:grid-cols-3">
        {AI_SERVICE.map((node) => (
          <Card key={node.title} node={node} accent="violet" />
        ))}
      </div>

      <Flow />
      <Divider label="System of action" />
      <div className="mx-auto max-w-[560px]">
        <Card
          accent="teal"
          node={{
            title: 'Salesforce CRM facade',
            detail: 'Typed writes, every one logged to the activity feed',
            icon: Building2,
            pill: { text: 'Simulated', tone: 'amber' },
            chips: [
              'flag-lead',
              'create-task',
              'schedule-survey',
              'create-recovery-case',
              'ingest-sanitized',
            ],
          }}
        />
      </div>

      <Flow />
      <Divider label="Data foundation" />
      <div className="grid gap-3 md:grid-cols-3">
        {FOUNDATION.map((node) => (
          <Card key={node.title} node={node} accent="teal" />
        ))}
      </div>

      <Flow />
      <Divider label="Sources — where the customer actually shows up" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SOURCES.map((node) => (
          <div
            key={node.title}
            className="rounded-xl border border-slate-200 border-t-[3px] border-t-kpmg-teal bg-white p-3.5 text-center shadow-card"
          >
            <h3 className="text-[13px] font-bold leading-snug text-slate-900">
              {node.title}
            </h3>
            <p className="mt-0.5 text-[11.5px] text-slate-500">{node.detail}</p>
          </div>
        ))}
      </div>

      {/* The guardrail loop */}
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-kpmg-violet/10 text-kpmg-violet">
            <RefreshCw className="size-[15px]" strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-bold text-slate-900">
              The guardrail loop
            </h3>
            <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">
              No agent writes on its own. Every conclusion is proposed, a human
              commits it, and the write lands in the feed where it can be audited.
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {LOOP_STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-300">&rarr;</span>}
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11.5px] font-semibold text-slate-700">
                {step}
              </span>
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[11.5px] leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-700">Reading the pills.</span>{' '}
        <Pill text="Deterministic" tone="teal" /> means the same input gives the same
        output on every run. <Pill text="Simulated" tone="amber" /> marks a layer
        modelled faithfully but not connected to a client system &mdash; the CRM
        facade writes to an in-memory store, not to Salesforce.
      </p>
    </div>
  )
}
