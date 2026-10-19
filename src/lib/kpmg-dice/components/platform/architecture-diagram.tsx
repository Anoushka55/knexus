import {
  Bot,
  Brain,
  Building2,
  Database,
  Filter,
  Globe,
  Layers,
  MapPin,
  MessageCircle,
  Monitor,
  Phone,
  Plug,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'

import { AGENTS } from '@/lib/kpmg-dice/lib/agents'
import { cn } from '@/lib/kpmg-dice/lib/utils'

interface Stage {
  id: string
  label: string
  sublabel: string
  icon: LucideIcon
  items: { label: string; icon?: LucideIcon }[]
  /** Fill for the stage header. */
  color: string
  onColor: 'light' | 'dark'
  /** Emphasised as the DICE contribution. */
  highlight?: boolean
}

/**
 * Single-hue KPMG ramp across the pipeline, deepening left to right — the same
 * ordinal treatment as the Overview funnel, so "further along" reads
 * consistently across the product. DICE's own layers break the ramp in violet.
 */
const STAGES: Stage[] = [
  {
    id: 'sources',
    label: 'Sources',
    sublabel: 'Where the customer actually shows up',
    icon: Globe,
    color: '#7FB3E3',
    onColor: 'dark',
    items: [
      { label: 'Calls', icon: Phone },
      { label: 'Emails', icon: MessageCircle },
      { label: 'WhatsApp', icon: MessageCircle },
      { label: 'Website', icon: Globe },
      { label: 'Site visits', icon: MapPin },
      { label: 'Campaigns', icon: Target },
    ],
  },
  {
    id: 'eai',
    label: 'EAI Integration Layer',
    sublabel: 'Enterprise Application Integration — infra layer',
    icon: Plug,
    color: '#3D8FD1',
    onColor: 'dark',
    items: [
      { label: 'Connectors & adapters' },
      { label: 'Event routing' },
      { label: 'Identity resolution' },
      { label: 'Rate & retry handling' },
    ],
  },
  {
    id: 'sanitization',
    label: 'Data Sanitization',
    sublabel: 'Sanitized customer data',
    icon: Filter,
    color: '#0A6CBA',
    onColor: 'light',
    items: [
      { label: 'De-duplication' },
      { label: 'PII handling & masking' },
      { label: 'Normalisation' },
      { label: 'Validation & enrichment' },
    ],
  },
  {
    id: 'crm',
    label: 'Salesforce CRM',
    sublabel: 'System of record + Agentforce',
    icon: Database,
    color: '#00509C',
    onColor: 'light',
    items: [
      { label: 'Leads' },
      { label: 'Contacts' },
      { label: 'Opportunities' },
      { label: 'Tasks & Activities' },
      { label: 'Agentforce', icon: Bot },
    ],
  },
  {
    id: 'dice',
    label: 'DICE Intelligence Layer',
    sublabel: 'The layer KPMG adds',
    icon: Brain,
    color: '#5B3FBF',
    onColor: 'light',
    highlight: true,
    items: [
      // Counted, not typed. This read '11 AI agents' for six agents longer
      // than it was true, because the CSAT feature added to the registry
      // without anyone editing the diagram.
      { label: `${AGENTS.length} AI agents`, icon: Sparkles },
      { label: 'Persona mapping', icon: Layers },
      { label: 'Next best action', icon: Target },
      { label: 'Evidence validation' },
      { label: 'Real-time transcript analysis' },
    ],
  },
  {
    id: 'experience',
    label: 'Experience Layer',
    sublabel: 'What the team actually uses',
    icon: Monitor,
    color: '#7C5CD6',
    onColor: 'light',
    highlight: true,
    items: [
      { label: 'Command Center' },
      { label: 'Customer 360' },
      { label: 'Sales / Payment / Service copilots' },
      { label: 'Manager pipeline truth' },
    ],
  },
]

function Arrow() {
  return (
    <div
      className="flex shrink-0 items-center justify-center px-1 xl:px-0"
      aria-hidden
    >
      {/* Down on stacked layouts, right once the flow goes horizontal */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="rotate-90 text-slate-300 xl:rotate-0"
      >
        <path
          d="M3 10 H14 M10 6 L14 10 L10 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function ArchitectureDiagram() {
  return (
    <div className="flex flex-col gap-1 xl:flex-row xl:items-stretch xl:gap-0">
      {STAGES.map((stage, i) => {
        const Icon = stage.icon
        return (
          <div key={stage.id} className="contents">
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-white shadow-card',
                stage.highlight
                  ? 'border-kpmg-violet/30 ring-1 ring-kpmg-violet/15'
                  : 'border-slate-200',
              )}
            >
              <div
                className={cn(
                  'px-3 py-2.5',
                  stage.onColor === 'light' ? 'text-white' : 'text-slate-900',
                )}
                style={{ backgroundColor: stage.color }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0" strokeWidth={2.1} />
                  <p className="text-[12.5px] font-bold leading-tight">
                    {stage.label}
                  </p>
                </div>
                <p
                  className={cn(
                    'mt-0.5 text-[10.5px] leading-snug',
                    stage.onColor === 'light'
                      ? 'text-white/75'
                      : 'text-slate-900/65',
                  )}
                >
                  {stage.sublabel}
                </p>
              </div>

              <ul className="flex-1 divide-y divide-slate-50">
                {stage.items.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <li
                      key={item.label}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      {ItemIcon ? (
                        <ItemIcon
                          className="size-3.5 shrink-0 text-slate-400"
                          strokeWidth={2}
                        />
                      ) : (
                        <span className="size-1.5 shrink-0 rounded-full bg-slate-300" />
                      )}
                      <span className="text-[11.5px] leading-snug text-slate-600">
                        {item.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            {i < STAGES.length - 1 && <Arrow />}
          </div>
        )
      })}
    </div>
  )
}

/** Where the Meridian data physically lives at each hop. */
export const PIPELINE_NOTE =
  'Sanitized data flows INTO Salesforce, not around it. The CRM stays the system of record — DICE reads the cleaned record, adds the intelligence Agentforce cannot derive, and writes its conclusions back as native Salesforce objects.'

export { Building2 }
