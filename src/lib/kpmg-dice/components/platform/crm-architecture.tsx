'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  ClipboardCheck,
  Clock,
  Cloud,
  ContactRound,
  Cpu,
  Database,
  Funnel,
  Gauge,
  Globe,
  Headset,
  LayoutGrid,
  List,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Package,
  Plug,
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Smile,
  Star,
  Target,
  Ticket,
  TrendingUp,
  Users,
  Workflow,
  History,
  type LucideIcon,
} from 'lucide-react'

/**
 * DICE Architecture for Customer Lifecycle Management — the KPMG "Our PoV"
 * slide.
 *
 * A fixed 1600x900 stage scaled to its container, so proportions and line
 * breaks match the source rather than reflowing. The heading is the product's
 * own name by request; the six layers below it are verbatim from the source.
 *
 * Two departures from the supplied spec, both deliberate. The type is the
 * interface's Inter rather than the spec's Open Sans stand-in, and the icons
 * are lucide — the app's own set, drawn on a consistent grid — in place of the
 * reference's hand-built SVG sprite.
 *
 * Density is the constraint here: body bullets sit at 11.2px and the spec warns
 * that anything under 11px stops reading from the back of a room. If content is
 * ever added, drop an item rather than shrinking the type.
 */

const STAGE_W = 1600
const STAGE_H = 900

/* Flow arrows are drawn, never glyphs — a triangle character renders as a
   speck at this size. Stem plus a CSS border triangle. */
function DownArrows() {
  return (
    <div className="pointer-events-none absolute -top-3 left-0 right-0 h-3" aria-hidden>
      {['25%', '50%', '75%'].map((left) => (
        <span
          key={left}
          className="absolute top-0 h-[7px] w-[1.4px] -translate-x-1/2 bg-[color:var(--arrow)]
                     after:absolute after:left-1/2 after:top-[7px] after:-translate-x-1/2
                     after:border-l-[4.5px] after:border-r-[4.5px] after:border-t-[5px]
                     after:border-l-transparent after:border-r-transparent
                     after:border-t-[color:var(--arrow)] after:content-['']"
          style={{ left }}
        />
      ))}
    </div>
  )
}

const CHANNELS: [LucideIcon, string[]][] = [
  [Globe, ['Website &', 'Portals']],
  [Megaphone, ['Digital', 'Campaigns']],
  [MessageSquare, ['Whatsapp']],
  [Mail, ['Email']],
  [Headset, ['Call center']],
  [Users, ['Channel', 'Partners']],
  [MapPin, ['Site visits /', 'Walk-ins']],
  [Smartphone, ['Customer', 'Portal / app']],
  [ClipboardCheck, ['Surveys &', 'Feedback']],
  [Ticket, ['Service', 'Tickets']],
]

const DATA: [LucideIcon, string][] = [
  [Cloud, 'Data ingestion (Apis, batch, streams)'],
  [ClipboardCheck, 'Data quality & Validation'],
  [ContactRound, 'Identity resolution & Deduplication'],
  [Shield, 'Consent & preference Management'],
  [History, 'Interaction & transaction History'],
  [LayoutGrid, 'Behavioral & contextual Data'],
]

const CRM_CELLS: [LucideIcon, string[]][] = [
  [Funnel, ['Lead', 'Management']],
  [BarChart3, ['Opportunities', '& Pipeline']],
  [ContactRound, ['Customer', '360 profile']],
  [MapPin, ['Site visit &', 'Interactions']],
  [Package, ['Booking &', 'Transactions']],
  [Headset, ['Service &', 'Post sales']],
  [Star, ['Feedback', '(CSAT/NPS)']],
  [ClipboardCheck, ['Workflows,', 'Tasks & alerts']],
  [Gauge, ['Dashboards', '& Analytics']],
]

const AI_PANELS: { icon: LucideIcon; title: string; bullets: string[] }[] = [
  {
    icon: Settings,
    title: 'AI Model & intelligence layer',
    bullets: [
      'Lead scoring & ranking',
      'Intent prediction',
      'Persona & segmentation models',
      'Propensity & affinity models',
      'Sentiment & conversation AI',
      'NPS drivers & satisfaction models',
    ],
  },
  {
    icon: Workflow,
    title: 'AI orchestration & Workflow layer',
    bullets: [
      'Next best action recommendation',
      'Lead routing & assignment',
      'Journey triggers & automation',
      'Task creation & alerts',
      'Escalation & approval workflows',
      'CRM recommendations',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'AI governance & Trust layer',
    bullets: [
      'Responsible AI principles',
      'Human-in-the-loop controls',
      'Data privacy & security',
      'Model monitoring & drift detection',
      'Audit trails & explainability',
      'Role based access & compliance',
    ],
  },
]

const CAPS: {
  accent: string
  tint: string
  icon: LucideIcon
  title: string
  bullets: string[]
}[] = [
  {
    accent: 'var(--violet)',
    tint: 'var(--tint-a)',
    icon: Target,
    title: '1. Lead quality & scoring',
    bullets: [
      'Dynamic lead scoring',
      'Intent validation & prioritization',
      'Lead leakage detection',
      'Source quality & ROI',
      'Next best action for follow-up',
    ],
  },
  {
    accent: 'var(--green)',
    tint: 'var(--tint-b)',
    icon: ContactRound,
    title: '2. Customer personas',
    bullets: [
      'Dynamic persona creation',
      'Property-fit recommendations',
      'Preference & affordability insights',
      'Next best property / offer / channel',
      'Cross-project & inventory matching',
    ],
  },
  {
    accent: 'var(--blue)',
    tint: 'var(--tint-c)',
    icon: Smile,
    title: '3. Customer experience',
    bullets: [
      'Customer 360 view',
      'Omnichannel engagement',
      'Journey orchestration',
      'Service & sales copilot',
      'Proactive & personalized journeys',
    ],
  },
  {
    accent: 'var(--amber)',
    tint: 'var(--tint-d)',
    icon: Star,
    title: '4. CSAT & NPS performance',
    bullets: [
      'Feedback collection at key touchpoints',
      'Sentiment & root cause analysis',
      'Detractor risk & recovery actions',
      'Satisfaction & NPS dashboards',
      'Closed-loop resolution & insights',
    ],
  },
]

const FOUNDATION: [LucideIcon, string][] = [
  [Cloud, 'Cloud infrastructure (Secure & scalable)'],
  [Database, 'Data lake & Warehouse'],
  [Plug, 'Integration layer (API & connectors)'],
  [Cpu, 'AI/ML platform & Tooling'],
  [List, 'Master data Management'],
  [Lock, 'Security & Access controls'],
]

const OUTCOMES: [LucideIcon, string][] = [
  [TrendingUp, 'Higher qualified Lead conversion'],
  [Clock, 'Faster response & Follow-up'],
  [Funnel, 'Reduced lead Leakage'],
  [ContactRound, 'Better persona-based Engagement'],
  [Smile, 'Improved customer Satisfaction & loyalty'],
  [RefreshCw, 'Closed-loop service Recovery'],
  [Target, 'Better campaign ROI & Resource efficiency'],
  [BarChart3, 'Leadership visibility & Decision intelligence'],
]

const ICON = 'size-4 shrink-0 stroke-[1.8]'
const CELL_DIV =
  "before:absolute before:left-0 before:top-[5px] before:bottom-[5px] before:w-px before:bg-[color:var(--hair)] before:content-['']"

function Rail({ children, on }: { children: React.ReactNode; on?: boolean }) {
  return (
    <div
      className="col-start-1 flex items-center rounded-[6px] px-[11px] py-[9px] text-[13px] font-bold leading-[1.3] tracking-[-0.005em] text-white"
      style={{ background: on ? 'var(--hi)' : 'var(--navy)' }}
    >
      {children}
    </div>
  )
}

export function CrmArchitecture() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      // Never past 1:1 — the canvas is the design size, not a minimum.
      setScale(Math.min(1, entry.contentRect.width / STAGE_W))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className="w-full overflow-hidden">
      <div
        style={{
          height: STAGE_H * scale,
          ['--navy' as string]: '#1F3864',
          ['--deep' as string]: '#122A52',
          ['--hi' as string]: '#2C4FA8',
          ['--orange' as string]: '#C55A11',
          ['--blue' as string]: '#1F6FB8',
          ['--green' as string]: '#2E7D5B',
          ['--violet' as string]: '#4B3FA8',
          ['--amber' as string]: '#B9770E',
          ['--arrow' as string]: '#64789B',
          ['--hair' as string]: '#D6DCE8',
          ['--grey' as string]: '#4A5568',
          ['--tint-a' as string]: '#EDEEFA',
          ['--tint-b' as string]: '#EAF4EE',
          ['--tint-c' as string]: '#E8F1FA',
          ['--tint-d' as string]: '#FBF6E4',
        }}
      >
        <div
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="flex flex-col rounded-xl border border-slate-200 bg-white px-[46px] py-[34px] text-[color:var(--navy)] shadow-card"
        >
          <h1 className="text-[37px] font-extrabold leading-[1.06] tracking-[-0.022em]">
            <span style={{ color: 'var(--orange)' }}>
              DICE Architecture
            </span>{' '}
            for Customer Lifecycle Management
          </h1>

          <div
            className="mt-[18px] grid min-h-0 flex-1"
            style={{
              gridTemplateColumns: '168px 1fr 188px',
              gridTemplateRows: '76px 102px 132px 168px 156px 86px',
              gap: '11px 12px',
            }}
          >
            {/* 1 — channels */}
            <Rail>1. Customer &amp; business interaction channels</Rail>
            <div className="relative col-start-2 flex min-h-0 flex-col rounded-[6px] border border-[color:var(--hair)] px-[11px] py-[9px]">
              <div className="grid flex-1 grid-cols-10 items-center">
                {CHANNELS.map(([Icon, lines], i) => (
                  <div
                    key={lines.join()}
                    className={`relative flex items-center gap-[7px] px-[9px] text-[11.5px] leading-[1.28] ${i ? CELL_DIV : ''}`}
                  >
                    <Icon className={ICON} style={{ color: 'var(--blue)' }} />
                    <span>
                      {lines[0]}
                      {lines[1] && (
                        <>
                          <br />
                          {lines[1]}
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes rail — spans every row */}
            <aside
              className="col-start-3 flex min-h-0 flex-col rounded-[6px] border border-[color:var(--hair)] p-[10px]"
              style={{ gridRow: '1 / -1' }}
            >
              <h3 className="border-b border-[color:var(--hair)] pb-2 text-center text-[12.5px] font-bold">
                Business outcomes
              </h3>
              <ul className="flex min-h-0 flex-1 flex-col">
                {OUTCOMES.map(([Icon, label], i) => (
                  <li
                    key={label}
                    className={`flex flex-1 items-center gap-[9px] px-[2px] text-[11.2px] leading-[1.3] ${
                      i ? 'border-t border-[color:var(--hair)]' : ''
                    }`}
                  >
                    <Icon className={ICON} style={{ color: 'var(--blue)' }} />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </aside>

            {/* 2 — data foundation */}
            <Rail>2. Data foundation &amp; Customer 360</Rail>
            <div className="relative col-start-2 flex min-h-0 flex-col rounded-[6px] border border-[color:var(--hair)] px-[11px] py-[9px]">
              <DownArrows />
              <p className="mb-[7px] text-center text-[13.5px] font-bold">
                Unified customer 360 &amp; data foundation
              </p>
              <div className="grid flex-1 grid-cols-6 items-center">
                {DATA.map(([Icon, label], i) => (
                  <div
                    key={label}
                    className={`relative flex items-center gap-[7px] px-[10px] text-[11.5px] leading-[1.28] ${i ? CELL_DIV : ''}`}
                  >
                    <Icon className={ICON} style={{ color: 'var(--blue)' }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 — CRM hub */}
            <Rail>3. CRM as central System of action</Rail>
            <div
              className="relative col-start-2 flex min-h-0 flex-col rounded-[6px] px-3 pb-[10px] pt-[9px] text-white"
              style={{ background: 'var(--deep)' }}
            >
              <DownArrows />
              {/* the one horizontal arrow, into the outcomes rail */}
              <span
                className="absolute -right-3 top-1/2 h-[9px] w-3 -translate-y-1/2
                           before:absolute before:left-0 before:top-1/2 before:h-[1.4px] before:w-[7px]
                           before:-translate-y-1/2 before:bg-[color:var(--arrow)] before:content-['']
                           after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2
                           after:border-b-[4.5px] after:border-l-[5px] after:border-t-[4.5px]
                           after:border-b-transparent after:border-l-[color:var(--arrow)]
                           after:border-t-transparent after:content-['']"
                aria-hidden
              />
              <h3 className="text-center text-[21px] font-bold leading-[1.1] tracking-[-0.01em]">
                CRM
              </h3>
              <p
                className="mb-[9px] mt-px border-b pb-[9px] text-center text-[11.5px]"
                style={{ color: '#C7D4EA', borderColor: 'rgba(255,255,255,.16)' }}
              >
                Single source of customer truth &amp; action
              </p>
              <div
                className="grid flex-1 items-center"
                style={{ gridTemplateColumns: '70px repeat(9, 1fr)' }}
              >
                <div className="flex flex-col items-center gap-1 text-center">
                  <i className="flex size-[38px] items-center justify-center rounded-full border-[1.5px] border-white">
                    <MoreHorizontal className="size-[19px] stroke-[1.8]" />
                  </i>
                  <span className="text-[11px] font-bold">CRM</span>
                </div>
                {CRM_CELLS.map(([Icon, lines]) => (
                  <div
                    key={lines.join()}
                    className="relative flex flex-col items-center gap-1 px-1.5 text-center text-[11px] leading-[1.25]
                               before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-px
                               before:bg-white/25 before:content-['']"
                  >
                    <Icon className={ICON} />
                    <span>
                      {lines[0]}
                      <br />
                      {lines[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 — AI layers */}
            <Rail on>4. AI intelligence &amp; Orchestration Layer</Rail>
            <div className="relative col-start-2 flex min-h-0 flex-col rounded-[6px] border border-[color:var(--hair)] px-[11px] py-[9px]">
              <DownArrows />
              <div
                className="grid flex-1 items-stretch"
                style={{ gridTemplateColumns: '1fr 18px 1fr 18px 1fr' }}
              >
                {AI_PANELS.map((panel, i) => {
                  const Icon = panel.icon
                  return (
                    <div key={panel.title} className="contents">
                      {i > 0 && (
                        <div
                          className="relative
                            before:absolute before:left-1 before:right-px before:top-1/2 before:h-[1.4px]
                            before:-translate-y-1/2 before:bg-[color:var(--arrow)] before:content-['']
                            after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2
                            after:border-b-[4.5px] after:border-r-[5px] after:border-t-[4.5px]
                            after:border-b-transparent after:border-r-[color:var(--arrow)]
                            after:border-t-transparent after:content-['']"
                          aria-hidden
                        />
                      )}
                      <div className="flex flex-col rounded-[6px] border border-[color:var(--hair)] px-3 py-[9px]">
                        <h4
                          className="mb-[7px] text-center text-[12.5px] font-bold"
                          style={{ color: 'var(--orange)' }}
                        >
                          {panel.title}
                        </h4>
                        <div className="flex flex-1 gap-[9px]">
                          <span
                            className="flex size-8 shrink-0 items-center justify-center self-center rounded-full border-[1.5px]"
                            style={{ borderColor: 'var(--blue)', color: 'var(--blue)' }}
                          >
                            <Icon className={ICON} />
                          </span>
                          <ul className="flex flex-1 flex-col justify-center gap-[2.5px]">
                            {panel.bullets.map((b) => (
                              <li
                                key={b}
                                className="relative pl-2.5 text-[11.2px] leading-[1.34]
                                           before:absolute before:left-0 before:content-['•']"
                                style={{ color: 'var(--grey)' }}
                              >
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 5 — capability areas */}
            <Rail on>5. AI-enabled CRM Capability areas (Our focus)</Rail>
            <div className="col-start-2 flex min-h-0 flex-col">
              <div className="grid flex-1 grid-cols-4 gap-[11px]">
                {CAPS.map((cap) => {
                  const Icon = cap.icon
                  return (
                    <div
                      key={cap.title}
                      className="flex flex-col rounded-[6px] border border-[color:var(--hair)] px-[11px] py-2"
                      style={{
                        background: cap.tint,
                        borderTop: `3px solid ${cap.accent}`,
                      }}
                    >
                      <h4
                        className="mb-[7px] text-center text-[12.5px] font-bold"
                        style={{ color: cap.accent }}
                      >
                        {cap.title}
                      </h4>
                      <div className="flex flex-1 gap-[9px]">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center self-center rounded-full border-[1.5px]"
                          style={{ borderColor: cap.accent, color: cap.accent }}
                        >
                          <Icon className={ICON} />
                        </span>
                        <ul className="flex flex-1 flex-col justify-center gap-[2.5px]">
                          {cap.bullets.map((b) => (
                            <li
                              key={b}
                              className="relative pl-2.5 text-[11.2px] leading-[1.34]"
                              style={{ color: 'var(--grey)' }}
                            >
                              <span
                                className="absolute left-0"
                                style={{ color: cap.accent }}
                              >
                                •
                              </span>
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 6 — technology foundation */}
            <Rail>6. Data &amp; technology Foundation</Rail>
            <div className="col-start-2 flex min-h-0 flex-col rounded-[6px] border border-[color:var(--hair)] px-[11px] py-[9px]">
              <div className="grid flex-1 grid-cols-6 items-center">
                {FOUNDATION.map(([Icon, label], i) => (
                  <div
                    key={label}
                    className={`relative flex items-center gap-2 px-[11px] text-[12px] leading-[1.28] ${i ? CELL_DIV : ''}`}
                  >
                    <Icon className={ICON} style={{ color: 'var(--blue)' }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
