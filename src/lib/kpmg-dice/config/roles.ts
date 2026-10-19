/**
 * Who is signed in, and what that seat is allowed to open.
 *
 * The demo used to run as a single identity that could see every screen, which
 * made "what would my sales exec actually see?" unanswerable. These four seats
 * answer it.
 *
 * Access is an explicit list per route rather than a seniority number, because
 * the Head of Customer Experience is a branch and not a rung: they see service
 * and feedback the Sales Manager cannot, and are locked out of payments and
 * pipeline the Sales Manager owns. A single rank could not express that.
 */

export type RoleId =
  | 'sales-exec'
  | 'sales-manager'
  | 'cx-head'
  | 'managing-director'

export interface Role {
  id: RoleId
  /** The person in the seat. */
  name: string
  /** Their title, shown under the name. */
  role: string
  initials: string
  /** One line on what this seat is for, shown in the switcher. */
  scope: string
}

export const ROLES: Role[] = [
  {
    id: 'sales-exec',
    name: 'Rahul Kulkarni',
    role: 'Sales Executive',
    initials: 'RK',
    scope: 'Own book — leads, visits and conversations',
  },
  {
    id: 'sales-manager',
    name: 'Anand Kumar',
    role: 'Sales Manager',
    initials: 'AK',
    scope: 'The team, the pipeline and the money',
  },
  {
    id: 'cx-head',
    name: 'Meera Nair',
    role: 'Head of Customer Experience',
    initials: 'MN',
    scope: 'Feedback, service and recovery',
  },
  {
    id: 'managing-director',
    name: 'Vikram Rao',
    role: 'Managing Director',
    initials: 'VR',
    scope: 'Everything, including the platform itself',
  },
]

export const ROLES_BY_ID = Object.fromEntries(
  ROLES.map((r) => [r.id, r]),
) as Record<RoleId, Role>

/** The seat the app opens on. Keeps every existing demo beat unchanged. */
export const DEFAULT_ROLE_ID: RoleId = 'sales-manager'

const ALL: RoleId[] = [
  'sales-exec',
  'sales-manager',
  'cx-head',
  'managing-director',
]

/**
 * Which seats may open which route.
 *
 * Every route in the nav must appear here — a missing entry is treated as
 * open to everyone, which is the wrong default to fail into, so the build
 * check asserts the map covers the nav rather than trusting it.
 */
export const ROUTE_ACCESS: Record<string, RoleId[]> = {
  /* Overview */
  '/agents/kpmg-dice/console': ALL,
  '/agents/kpmg-dice/console/platform': ['managing-director'],
  '/agents/kpmg-dice/console/data-ingestion': ['managing-director'],
  // Open to every seat: it describes how the platform is built rather than
  // customer data, and the user band on it names whichever seat is viewing.
  // How it Works and Data Ingestion stay MD-only, so the restriction story
  // is still demonstrable from the default seat.
  '/agents/kpmg-dice/console/tech-stack': ALL,

  /* Customer journey */
  '/agents/kpmg-dice/console/leads': ALL,
  '/agents/kpmg-dice/console/engagements': ALL,
  '/agents/kpmg-dice/console/site-visits': ALL,
  '/agents/kpmg-dice/console/bookings': ['sales-manager', 'managing-director'],
  '/agents/kpmg-dice/console/payments': ['sales-manager', 'managing-director'],
  '/agents/kpmg-dice/console/service-tickets': ['sales-manager', 'cx-head', 'managing-director'],

  /* AI copilots */
  '/agents/kpmg-dice/console/live-transcript': ['sales-exec', 'sales-manager', 'managing-director'],
  '/agents/kpmg-dice/console/sales-copilot': ['sales-exec', 'sales-manager', 'managing-director'],
  '/agents/kpmg-dice/console/payment-assistant': ['sales-manager', 'managing-director'],
  '/agents/kpmg-dice/console/service-assistant': ['sales-manager', 'cx-head', 'managing-director'],
  '/agents/kpmg-dice/console/csat-nps': ['sales-manager', 'cx-head', 'managing-director'],
  '/agents/kpmg-dice/console/persona-mapping': ['sales-manager', 'cx-head', 'managing-director'],
  '/agents/kpmg-dice/console/campaign-analytics': ['sales-manager', 'managing-director'],
  '/agents/kpmg-dice/console/agent-chain': ['sales-manager', 'cx-head', 'managing-director'],

  /* Manager view */
  '/agents/kpmg-dice/console/pipeline-dashboard': ['sales-manager', 'managing-director'],
  '/agents/kpmg-dice/console/projects': ALL,
  '/agents/kpmg-dice/console/risk-alerts': ['sales-manager', 'managing-director'],
  '/agents/kpmg-dice/console/team-performance': ['sales-manager', 'managing-director'],
  '/agents/kpmg-dice/console/reports': ['sales-manager', 'cx-head', 'managing-director'],

  /* Pinned + detail routes reachable without a nav row */
  '/agents/kpmg-dice/console/ai-insights': ['sales-manager', 'cx-head', 'managing-director'],
  '/agents/kpmg-dice/console/customers': ALL,
}

/** Seats allowed on a route, resolved through the longest matching prefix. */
export function rolesFor(pathname: string): RoleId[] {
  if (ROUTE_ACCESS[pathname]) return ROUTE_ACCESS[pathname]

  const prefix = Object.keys(ROUTE_ACCESS)
    .filter((href) => href !== '/agents/kpmg-dice/console' && pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0]

  // Unclassified routes stay open. The build check exists so this never
  // silently covers a screen that should have been locked.
  return prefix ? ROUTE_ACCESS[prefix] : ALL
}

export function canAccess(pathname: string, roleId: RoleId) {
  return rolesFor(pathname).includes(roleId)
}

/** "the Sales Manager and Managing Director" — never a bare "no access". */
export function describeRoles(roleIds: RoleId[]) {
  const titles = roleIds.map((id) => ROLES_BY_ID[id].role)
  if (titles.length === 1) return `the ${titles[0]}`
  if (titles.length === ALL.length) return 'every seat'
  return `the ${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`
}
