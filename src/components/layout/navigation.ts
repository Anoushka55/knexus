/**
 * Single source of truth for the header navigation.
 *
 * Every entry points at a route that actually exists — if a page is added or
 * moved, change it here and both the desktop menus and the mobile panel follow.
 */

export type NavLink = { label: string; href: string };

export type NavGroup = {
  /** Column heading inside a dropdown; omitted for a single ungrouped list. */
  label?: string;
  links: NavLink[];
};

export type NavItem = {
  label: string;
  /** Where the top-level label itself goes. */
  href: string;
  /** Absent for a plain link with no dropdown. */
  groups?: NavGroup[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Solutions",
    href: "/solutions",
    groups: [
      {
        label: "TMT Solutions",
        links: [{ label: "All solution areas", href: "/solutions" }],
      },
      {
        label: "Tech Transformation",
        links: [
          { label: "Overview", href: "/solutions/tech-transformation" },
          { label: "DSSI", href: "/solutions/tech-transformation/dssi" },
          { label: "Digital Next", href: "/solutions/tech-transformation/digital-next" },
          { label: "DEQ", href: "/solutions/tech-transformation/deq" },
        ],
      },
      {
        label: "DSSI sectors",
        links: [
          {
            label: "Consumer Markets",
            href: "/solutions/tech-transformation/dssi/consumer-markets",
          },
          {
            label: "Emerging Tech",
            href: "/solutions/tech-transformation/dssi/emerging-tech",
          },
          { label: "GCC", href: "/solutions/tech-transformation/dssi/gcc" },
          { label: "Tech M&A", href: "/solutions/tech-transformation/dssi/tech-ma" },
        ],
      },
    ],
  },
  {
    label: "Capability Map",
    href: "/capability-map",
    groups: [
      {
        label: "Capability Map",
        links: [
          { label: "Overview", href: "/capability-map" },
          { label: "AI Architecture", href: "/capability-map/ai-architecture" },
          { label: "Personas", href: "/capability-map/personas" },
        ],
      },
    ],
  },
  {
    label: "Assess",
    href: "/assessments",
    groups: [
      {
        label: "Maturity assessments",
        links: [
          { label: "All assessments", href: "/assessments" },
          {
            label: "Telecom AI & Agentic Maturity",
            href: "/assessments/telecom-ai-agentic-maturity",
          },
          { label: "Agentic Readiness Index", href: "/assessments/agentic-readiness-index" },
        ],
      },
      {
        label: "Process & service",
        links: [
          {
            label: "Procure-to-Pay Automation",
            href: "/assessments/procure-to-pay-automation",
          },
          { label: "SMB Managed Services", href: "/assessments/smb-managed-services" },
        ],
      },
    ],
  },
  // No sub-pages of its own, so it stays a plain link rather than an empty menu.
  { label: "TMT Ontology", href: "/tmt-ontology" },
  {
    label: "AI Stack",
    href: "/ai-stack",
    groups: [
      {
        links: [
          { label: "Overview", href: "/ai-stack" },
          { label: "Architecture", href: "/ai-stack/architecture" },
          { label: "TMT SLM", href: "/ai-stack/tmt-slm" },
        ],
      },
    ],
  },
  {
    label: "Assets",
    href: "/search",
    groups: [
      {
        label: "Agents",
        links: [
          { label: "Agent catalogue", href: "/search" },
          { label: "Integrations", href: "/#integrations" },
        ],
      },
      {
        label: "Industry verticals",
        links: [
          { label: "Telecom", href: "/verticals/telecom" },
          { label: "Media", href: "/verticals/media" },
          { label: "Technology", href: "/verticals/technology" },
          { label: "IT & ITSM", href: "/verticals/itsm" },
        ],
      },
      {
        label: "Function verticals",
        links: [
          { label: "Sales & Revenue Ops", href: "/verticals/sales" },
          { label: "Customer Support", href: "/verticals/support" },
          { label: "HR & Recruitment", href: "/verticals/hr" },
        ],
      },
    ],
  },
];

/** True when `href` is the current page or an ancestor of it. */
export function isActive(pathname: string, href: string) {
  const path = href.split("#")[0];
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}
