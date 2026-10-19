import {
  Bot,
  BarChart3,
  Gauge,
  Building2,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Funnel,
  Headset,
  Home,
  Layers,
  Layers3,
  MapPin,
  MessagesSquare,
  ShieldAlert,
  Sparkles,
  UserSearch,
  UsersRound,
  Wallet,
  DatabaseZap,
  Waypoints,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Header title when this route is active. */
  title: string
  /** Header subtitle when this route is active. */
  subtitle: string
  /**
   * Routes this entry stands in for — reached from it, with no rail entry of
   * their own.
   *
   * Only ever EXTRA_ROUTES destinations. Naming a route that has its own entry
   * would light two at once, which is worse than the nothing-is-lit state this
   * exists to fix.
   */
  owns?: string[]
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        label: 'Overview',
        href: '/agents/kpmg-dice/console',
        icon: Home,
        title: 'Customer Journey Command Center',
        subtitle: 'AI-Powered Customer Intelligence Platform.',
      },
      {
        label: 'How it Works',
        href: '/agents/kpmg-dice/console/platform',
        icon: Workflow,
        title: 'DICE Platform',
        subtitle:
          'Sources to experience — and what DICE adds on top of Agentforce.',
      },
      {
        label: 'Data Ingestion',
        href: '/agents/kpmg-dice/console/data-ingestion',
        icon: DatabaseZap,
        title: 'Data Ingestion',
        subtitle:
          'Pull a batch from a source system and watch EAI and sanitization run on it.',
      },
      {
        label: 'Tech Stack',
        href: '/agents/kpmg-dice/console/tech-stack',
        icon: Layers3,
        title: 'Tech Stack',
        subtitle:
          'Every layer this build runs on — a request from the user down to the source records.',
      },
    ],
  },
  {
    id: 'journey',
    label: 'Customer Journey',
    items: [
      {
        label: 'Leads',
        href: '/agents/kpmg-dice/console/leads',
        icon: UsersRound,
        title: 'Lead Quality & Conversion Engine',
        subtitle: 'Every lead, scored and validated against real evidence.',
      },
      {
        label: 'Engagements',
        href: '/agents/kpmg-dice/console/engagements',
        icon: MessagesSquare,
        title: 'Engagements',
        subtitle: 'Calls, emails, WhatsApp and web activity in one timeline.',
      },
      {
        label: 'Site Visits',
        href: '/agents/kpmg-dice/console/site-visits',
        icon: MapPin,
        title: 'Site Visits',
        subtitle: 'Scheduled, attended and converted — with captured feedback.',
      },
      {
        label: 'Bookings',
        href: '/agents/kpmg-dice/console/bookings',
        icon: CalendarCheck,
        title: 'Bookings',
        subtitle: 'Confirmed bookings and the journeys that produced them.',
      },
      {
        label: 'Payments',
        href: '/agents/kpmg-dice/console/payments',
        icon: CreditCard,
        title: 'Payments',
        subtitle: 'Milestones, schedules and collection risk.',
      },
      {
        label: 'Service Tickets',
        href: '/agents/kpmg-dice/console/service-tickets',
        icon: ClipboardList,
        title: 'Service Tickets',
        subtitle: 'Post-sales requests with SLA tracking.',
      },
    ],
  },
  {
    id: 'copilots',
    label: 'AI Copilots',
    items: [
      {
        // Short in the rail, full in the header — the same split `/agents/kpmg-dice/console/leads` uses
        // to carry "Lead Quality & Conversion Engine". The full name truncates
        // in a 200px rail; this does not.
        label: 'Customer Lifecycle',
        href: '/agents/kpmg-dice/console/customer-intelligence',
        icon: UserSearch,
        title: 'Customer Lifecycle Intelligence',
        subtitle:
          'Who the customer is, what kind of buyer they are, and how they feel.',
        // Three of its four tiles have no rail entry, so it stays lit for them.
        // `/agents/kpmg-dice/console/leads` is the fourth and is deliberately absent: it keeps its own
        // entry under Customer Journey, and owning it would light both.
        owns: ['/agents/kpmg-dice/console/customers', '/agents/kpmg-dice/console/persona-mapping', '/agents/kpmg-dice/console/csat-nps'],
      },
      {
        label: 'Live Transcript',
        href: '/agents/kpmg-dice/console/live-transcript',
        icon: Headset,
        title: 'Real-Time Call Intelligence',
        subtitle: 'Intent detected as the call happens, flagged straight into the CRM.',
      },
      {
        label: 'Sales Copilot',
        href: '/agents/kpmg-dice/console/sales-copilot',
        icon: Bot,
        title: 'Sales Copilot',
        subtitle: 'Ask, draft and act on your pipeline in plain language.',
      },
      {
        label: 'Payment Assistant',
        href: '/agents/kpmg-dice/console/payment-assistant',
        icon: Wallet,
        title: 'Payment Assistant',
        subtitle: 'Payment plans, finance callbacks and query capture.',
      },
      {
        label: 'Service Assistant',
        href: '/agents/kpmg-dice/console/service-assistant',
        icon: MessagesSquare,
        title: 'Service Assistant',
        subtitle: 'Summarise tickets, assess SLA risk, recommend resolution.',
      },
      {
        label: 'Agent Chain',
        href: '/agents/kpmg-dice/console/agent-chain',
        icon: Waypoints,
        title: 'Agent Chain',
        subtitle:
          'Agents handing conclusions to each other for one customer — and the proof that they did.',
      },
      {
        label: 'Campaign Analytics',
        href: '/agents/kpmg-dice/console/campaign-analytics',
        icon: BarChart3,
        title: 'Campaign Analytics',
        subtitle: 'Lead quality and true ROI, campaign by campaign.',
      },
    ],
  },
  {
    id: 'manager',
    label: 'Manager View',
    items: [
      {
        label: 'Pipeline Dashboard',
        href: '/agents/kpmg-dice/console/pipeline-dashboard',
        icon: Funnel,
        title: 'Pipeline Dashboard',
        subtitle: 'Daily pipeline truth — stage velocity, value and stalled deals.',
      },
      {
        label: 'Projects',
        href: '/agents/kpmg-dice/console/projects',
        icon: Building2,
        title: 'Project Portfolio',
        subtitle: 'Demand, conversion and booked value across every project.',
      },
      {
        label: 'Risk & Alerts',
        href: '/agents/kpmg-dice/console/risk-alerts',
        icon: ShieldAlert,
        title: 'Risk & Alerts',
        subtitle: 'Prioritised risks with impacted revenue and owners.',
      },
      {
        label: 'Team Performance',
        href: '/agents/kpmg-dice/console/team-performance',
        icon: UsersRound,
        title: 'Team Performance',
        subtitle: 'Rep-level throughput, backlog and coaching insight.',
      },
      {
        label: 'Reports',
        href: '/agents/kpmg-dice/console/reports',
        icon: FileText,
        title: 'Reports',
        subtitle: 'Pre-built reporting across pipeline, quality and risk.',
      },
    ],
  },
]

export const PINNED_NAV: NavItem = {
  label: 'AI Insights',
  href: '/agents/kpmg-dice/console/ai-insights',
  icon: Sparkles,
  title: 'AI Insights',
  subtitle: 'The DICE intelligence layer — agents, personas and platform story.',
}

/**
 * Routes that resolve a header title but never appear in the rail — reached by
 * drilling in from a card rather than by navigating.
 */
export const EXTRA_ROUTES: NavItem[] = [
  {
    label: 'CSAT & NPS',
    href: '/agents/kpmg-dice/console/csat-nps',
    icon: Gauge,
    title: 'CSAT & NPS Intelligence',
    subtitle:
      'From descriptive scores to governed feedback intelligence — nine capabilities across two types.',
  },
  {
    label: 'Persona Mapping',
    href: '/agents/kpmg-dice/console/persona-mapping',
    icon: Layers,
    title: 'Dynamic Persona & Property-fit Engine',
    subtitle:
      'Every lead scored against six buyer personas — with the evidence behind each assignment.',
  },
  {
    label: 'Customer 360',
    href: '/agents/kpmg-dice/console/customers',
    icon: UsersRound,
    title: 'Customer Journey Orchestration Copilot',
    subtitle: 'One consolidated view of the customer, across every channel.',
  },
]

const ALL_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  PINNED_NAV,
  ...EXTRA_ROUTES,
]

/** Resolve the header title/subtitle for a pathname (longest prefix wins). */
export function resolveNavItem(pathname: string): NavItem {
  const exact = ALL_ITEMS.find((item) => item.href === pathname)
  if (exact) return exact

  const prefixed = ALL_ITEMS.filter(
    (item) => item.href !== '/agents/kpmg-dice/console' && pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0]

  return prefixed ?? ALL_ITEMS[0]
}

/**
 * Active for its own route, or for one it stands in for.
 *
 * Separate from `isNavItemActive` rather than folded into it: the header
 * resolver and the pinned link both depend on the plain href test, and a route
 * two entries can claim is exactly the bug this must not introduce.
 */
export function isNavEntryActive(item: NavItem, pathname: string) {
  if (isNavItemActive(item.href, pathname)) return true
  return item.owns?.some((href) => isNavItemActive(href, pathname)) ?? false
}

export function isNavItemActive(href: string, pathname: string) {
  if (href === '/agents/kpmg-dice/console') return pathname === '/agents/kpmg-dice/console'
  return pathname === href || pathname.startsWith(`${href}/`)
}
