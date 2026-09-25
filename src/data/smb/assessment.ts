// SMB Managed Services Assessment — a general-purpose product, not tied to
// any specific provider or client. The content (seven SMB pains, three
// bundles) is generic managed-services category language, not anyone's
// proprietary positioning.
//
// The mechanism mirrors the Procure-to-Pay automation assessment: arrive
// with a benchmark guess based on the client's segment and IT landscape,
// let the conversation correct it live, and let the corrections determine
// which bundle actually fits — the sale is an outcome match, not a product
// list.

export type Segment = "small" | "medium" | "mid-market";
export type Landscape = "m365-only" | "google-workspace" | "no-it-team" | "legacy-mixed";

export interface SegmentInfo {
  id: Segment;
  label: string;
  note: string;
}

export const segments: SegmentInfo[] = [
  { id: "small", label: "Small (10–49 employees)", note: "Typically no dedicated IT function" },
  { id: "medium", label: "Medium (50–249 employees)", note: "A lean IT function, if any" },
  {
    id: "mid-market",
    label: "Mid-Market (250–1,000 employees)",
    note: "The segment most managed-services growth targets",
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
  // Illustrative heuristics for which segment/landscape typically already
  // has this pain live — the pre-filled starting point a conversation then
  // corrects, the same mechanic as the P2P landscape benchmark. Editorial
  // judgment, not measured data — meant to be argued with in the room.
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
    defaultSegments: ["small", "medium", "mid-market"],
    defaultLandscapes: ["m365-only", "google-workspace", "no-it-team", "legacy-mixed"],
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
    defaultSegments: ["small"],
    defaultLandscapes: ["no-it-team"],
  },
  {
    id: "compliance",
    label: "Compliance and audit requirements are outrunning what the team can document",
    service: "Managed Backup & DR",
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
  // components back to the closest pain — the source material gives
  // pain->service and bundle->components as two separate tables and never
  // states this crosswalk directly. Treat this as an editorial best guess,
  // not a confirmed mapping — worth a glance before it's treated as
  // authoritative.
  painIds: string[];
}

export const bundles: Bundle[] = [
  {
    id: "secure-workplace",
    label: "Secure Workplace",
    components: ["M365 Management", "Endpoint Security", "Backup", "Helpdesk"],
    painIds: ["hybrid-workforce", "cyber-risk", "compliance", "support-staff"],
  },
  {
    id: "cloud-business",
    label: "Cloud Business",
    components: ["Cloud Hosting", "Monitoring", "Backup", "Security"],
    painIds: ["cloud-complexity", "compliance", "cyber-risk"],
  },
  {
    id: "compliance-ready",
    label: "Compliance Ready Business",
    components: ["Managed Security", "Compliance Reporting", "Vulnerability Management"],
    painIds: ["cyber-risk", "compliance"],
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
