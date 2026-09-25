// SMB Managed Services Assessment — a general-purpose product, not tied to
// any specific provider or client. The content (nine SMB pains, three
// bundles) is generic managed-services category language, not anyone's
// proprietary positioning.
//
// The mechanism mirrors the Procure-to-Pay automation assessment: arrive
// with a benchmark guess based on the client's segment and IT landscape,
// let the conversation correct it live, and let the corrections determine
// which bundle actually fits — the sale is an outcome match, not a product
// list.
//
// Segmentation, the pain set and several `stat` citations are grounded in
// public 2025–2026 industry research (Gartner SMB/midsize definitions,
// SMB cybersecurity and disaster-recovery surveys, cyber-insurance
// underwriting requirements) rather than invented outright — sources noted
// inline. Rate/incidence statistics are used freely; no currency figure
// appears anywhere in this file or the screens that render it, by design.

export type Segment = "small" | "medium" | "mid-market";
export type Landscape = "m365-only" | "google-workspace" | "no-it-team" | "legacy-mixed";

export interface SegmentInfo {
  id: Segment;
  label: string;
  note: string;
}

// Gartner's own SMB/midsize line sits at 100 employees, and its midsize
// band runs 100–999 — which is also almost exactly the "100–1,000 employee"
// mid-market focus named in the source material. The three bands below
// split that midsize range in two for a finer-grained conversation, rather
// than inventing an unrelated scheme.
export const segments: SegmentInfo[] = [
  {
    id: "small",
    label: "Small (fewer than 100 employees)",
    note: "Gartner's own SMB line — rarely has a dedicated IT function",
  },
  {
    id: "medium",
    label: "Lower Mid-Market (100–499 employees)",
    note: "IT usually exists; security and compliance rarely keep pace with it",
  },
  {
    id: "mid-market",
    label: "Upper Mid-Market (500–999 employees)",
    note: "The band most managed-services growth strategies target",
  },
];

export interface LandscapeInfo {
  id: Landscape;
  label: string;
  note: string;
}

export const landscapes: LandscapeInfo[] = [
  { id: "m365-only", label: "Microsoft 365, unmanaged", note: "Licensed, but nobody actively administers it" },
  { id: "google-workspace", label: "Google Workspace", note: "No Microsoft stack in place" },
  { id: "no-it-team", label: "No formal IT team", note: "IT is whoever's available that day" },
  { id: "legacy-mixed", label: "Legacy / mixed estate", note: "Several vendors, no single owner" },
];

export interface Pain {
  id: string;
  label: string; // outcome-framed, not product-framed
  service: string; // the managed service this pain converts into
  // A real, cited incidence/rate statistic backing this pain, where
  // research gave a genuinely well-matched one — left unset rather than
  // forced onto every row. Never a currency figure.
  stat?: string;
  statSource?: string;
  // Illustrative heuristics for which segment/landscape typically already
  // has this pain live — the pre-filled starting point a conversation then
  // corrects, the same mechanic as the P2P landscape benchmark. Editorial
  // judgment, informed by the research above but not measured for any
  // specific client — meant to be argued with in the room.
  defaultSegments: Segment[];
  defaultLandscapes: Landscape[];
}

export const pains: Pain[] = [
  {
    id: "no-it-team",
    label: "No in-house IT team to own any of this",
    service: "Fully Managed IT",
    defaultSegments: ["small"],
    defaultLandscapes: ["no-it-team"],
  },
  {
    id: "cyber-risk",
    label: "Cyber risk is growing faster than anyone can keep up with",
    service: "Managed Security (MDR/SOC)",
    stat: "81% of small businesses suffered a security or data breach in the past 12 months",
    statSource: "SMB cybersecurity research, 2025–2026",
    defaultSegments: ["small", "medium", "mid-market"],
    defaultLandscapes: ["m365-only", "google-workspace", "no-it-team", "legacy-mixed"],
  },
  {
    id: "no-tested-backup",
    label: "There's no tested, ransomware-proof backup — only a hope that one exists",
    service: "Managed Backup & DR",
    stat: "93% of companies that lose data for 10+ days file for bankruptcy within a year",
    statSource: "Disaster-recovery preparedness research, 2025–2026",
    defaultSegments: ["small"],
    defaultLandscapes: ["no-it-team", "legacy-mixed"],
  },
  {
    id: "cant-get-insurance",
    label: "Cyber insurance is getting harder to qualify for, or the premium keeps climbing",
    service: "Compliance Reporting & Vulnerability Management",
    stat: "Over 73% of small businesses now fail their cyber-insurance assessment",
    statSource: "Cyber-insurance underwriting research, 2026",
    defaultSegments: ["small"],
    defaultLandscapes: ["no-it-team", "legacy-mixed"],
  },
  {
    id: "hybrid-workforce",
    label: "A hybrid workforce needs a workplace that's actively managed, not just licensed",
    service: "M365 Managed Workplace",
    defaultSegments: [],
    defaultLandscapes: ["m365-only"],
  },
  {
    id: "cloud-complexity",
    label: "Cloud spend and configuration have outgrown what anyone is watching",
    service: "Managed Cloud Operations",
    defaultSegments: [],
    defaultLandscapes: ["legacy-mixed", "google-workspace"],
  },
  {
    id: "support-staff",
    label: "There's no one to call when something breaks",
    service: "Helpdesk-as-a-Service",
    stat: "IT talent shortage and retention remain a top-cited SMB IT challenge",
    statSource: "SMB IT priorities research, 2026",
    defaultSegments: ["small"],
    defaultLandscapes: ["no-it-team"],
  },
  {
    id: "compliance",
    label: "Data-privacy and industry regulations are outrunning what the team can document",
    service: "Compliance Reporting",
    defaultSegments: ["mid-market"],
    defaultLandscapes: [],
  },
  {
    id: "multi-vendor",
    label: "Every vendor points at every other vendor when something goes wrong",
    service: "Single Managed Service Provider",
    defaultSegments: [],
    defaultLandscapes: ["legacy-mixed", "no-it-team"],
  },
];

export function isDefaultPain(pain: Pain, segment: Segment, landscape: Landscape): boolean {
  return pain.defaultSegments.includes(segment) || pain.defaultLandscapes.includes(landscape);
}

export interface Bundle {
  id: string;
  label: string;
  components: string[];
  // Which pains this bundle addresses. Inferred by matching each bundle's
  // named components back to the closest pain — the source material gives
  // pain->service and bundle->components as two separate tables and never
  // states this crosswalk directly. Treat this as an editorial best guess,
  // not a confirmed mapping — worth a glance before it's treated as
  // authoritative.
  //
  // "Backup" and "Compliance Reporting" are kept as two separate mappings
  // rather than one, on purpose — a tested backup answers "will I lose my
  // data," compliance reporting answers "can I prove I'm controlled." They
  // are different risks with different evidence, even though both bundles
  // that carry a Backup component also happen to reduce insurance risk
  // somewhat; the primary insurance-readiness pain is scored against
  // Compliance Ready Business specifically, since vulnerability management
  // and compliance reporting are the two controls underwriters check most
  // directly.
  painIds: string[];
}

export const bundles: Bundle[] = [
  {
    id: "secure-workplace",
    label: "Secure Workplace",
    components: ["M365 Management", "Endpoint Security", "Backup", "Helpdesk"],
    painIds: ["hybrid-workforce", "cyber-risk", "support-staff", "no-tested-backup"],
  },
  {
    id: "cloud-business",
    label: "Cloud Business",
    components: ["Cloud Hosting", "Monitoring", "Backup", "Security"],
    painIds: ["cloud-complexity", "cyber-risk", "no-tested-backup"],
  },
  {
    id: "compliance-ready",
    label: "Compliance Ready Business",
    components: ["Managed Security", "Compliance Reporting", "Vulnerability Management"],
    painIds: ["cyber-risk", "compliance", "cant-get-insurance"],
  },
];

// These two pains don't sit inside any single named bundle — they read as
// the overarching case for buying ANY bundle (one accountable provider
// instead of point products), not a specific component. Scored separately
// rather than force-fit into a bundle's painIds.
export const overarchingPainIds = ["no-it-team", "multi-vendor"];

const painById = new Map(pains.map((p) => [p.id, p]));
export function painLabel(id: string): string {
  return painById.get(id)?.label ?? id;
}

// Market-context stats for framing the whole tool — why an outcome-first,
// bundled conversation matters right now. Rates only, never a currency
// figure, same discipline as the pains above.
export interface MarketStat {
  value: string;
  label: string;
}

export const marketStats: MarketStat[] = [
  { value: "81%", label: "of small businesses suffered a breach in the past 12 months" },
  { value: "58%", label: "of SMBs already use a managed services provider" },
  { value: "73%", label: "of small businesses fail their cyber-insurance assessment" },
  { value: `${pains.length}`, label: "outcome-framed pains mapped to 3 recommended bundles" },
];

export const marketStatsSource =
  "Public SMB cybersecurity, disaster-recovery and cyber-insurance underwriting research, 2025–2026 — illustrative market context, not measurements of any specific client.";
