import {
  BarChart3,
  Boxes,
  Code2,
  FileBarChart,
  Gauge,
  Landmark,
  LayoutGrid,
  Map,
  Network,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  title: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
};

/**
 * Ported from the standalone app, whose routes lived at the site root.
 * Nav and summary data keep those root-relative paths ("/", "/planning");
 * these helpers map them onto this console's mount point in knexus.
 */
export const LTM_BASE = "/agents/legacy-tech-modernization/console";

export function ltmHref(to: string) {
  return to === "/" ? LTM_BASE : `${LTM_BASE}${to}`;
}

export function ltmRoute(pathname: string) {
  const rest = pathname.startsWith(LTM_BASE) ? pathname.slice(LTM_BASE.length) : pathname;
  return rest.replace(/\/$/, "") || "/";
}

export const platformNav: NavItem[] = [
  { title: "Overview", to: "/", icon: Gauge },
  { title: "Discovery & Code Analysis", to: "/discovery", icon: Search },
  { title: "Architecture Intelligence", to: "/architecture-intelligence", icon: Network },
  { title: "Planning & Architecture Mapping", to: "/planning", icon: Map },
  { title: "Refactoring & Code Transformation", to: "/refactoring", icon: Code2 },
  { title: "Validation & Automated Testing", to: "/validation", icon: ShieldCheck },
  { title: "Security & Compliance", to: "/security", icon: ShieldCheck },
  { title: "Governance", to: "/governance", icon: Landmark },
];

export const portfolioNav: NavItem[] = [
  { title: "Applications", to: "/applications", icon: LayoutGrid },
  { title: "Teams", to: "/teams", icon: Users },
  { title: "Reports", to: "/reports", icon: FileBarChart },
];

export const navIcons = { BarChart3, Boxes };

export type SummarySegment = { label: string; value: string; color: string };

export type SidebarSummary = {
  title: string;
  ring?: { value: string; caption: string; segments: Array<{ value: number; color: string }> };
  segments: SummarySegment[];
  linkLabel: string;
  linkTo: string;
};

const pipelineSummary: SidebarSummary = {
  title: "Modernization Pipeline",
  ring: {
    value: "42",
    caption: "In Pipeline",
    segments: [
      { value: 12, color: "var(--brand-bright)" },
      { value: 18, color: "var(--warning)" },
      { value: 8, color: "var(--success)" },
      { value: 4, color: "var(--intel)" },
    ],
  },
  segments: [
    { label: "Assessment", value: "12", color: "var(--brand-bright)" },
    { label: "Planning", value: "18", color: "var(--warning)" },
    { label: "Transformation", value: "8", color: "var(--success)" },
    { label: "Testing", value: "4", color: "var(--intel)" },
  ],
  linkLabel: "View Pipeline",
  linkTo: "/planning",
};

export const sidebarSummaries: Record<string, SidebarSummary> = {
  "/": pipelineSummary,
  "/planning": pipelineSummary,
  "/discovery": {
    title: "Scan Summary",
    segments: [
      { label: "Repositories Scanned", value: "248", color: "var(--brand-bright)" },
      { label: "Lines of Code", value: "84.6M", color: "var(--intel)" },
      { label: "Languages", value: "12", color: "var(--success)" },
      { label: "Last Scan Duration", value: "2h 34m", color: "var(--warning)" },
    ],
    linkLabel: "View Scan History",
    linkTo: "/discovery",
  },
  "/architecture-intelligence": {
    title: "Knowledge Graph Status",
    segments: [
      { label: "Applications", value: "2,184", color: "var(--brand-bright)" },
      { label: "Services", value: "8,742", color: "var(--success)" },
      { label: "APIs", value: "12,356", color: "var(--intel)" },
      { label: "Databases", value: "4,128", color: "var(--warning)" },
      { label: "Infrastructure", value: "7,896", color: "var(--chart-6)" },
      { label: "Business Capabilities", value: "3,216", color: "var(--danger)" },
    ],
    linkLabel: "Explore Graph",
    linkTo: "/architecture-intelligence",
  },
  "/refactoring": {
    title: "Transformation Progress",
    ring: {
      value: "68%",
      caption: "Overall Progress",
      segments: [
        { value: 68, color: "var(--brand-bright)" },
        { value: 18, color: "var(--warning)" },
        { value: 10, color: "var(--success)" },
        { value: 4, color: "var(--danger)" },
      ],
    },
    segments: [
      { label: "Completed", value: "68%", color: "var(--brand-bright)" },
      { label: "In Progress", value: "18%", color: "var(--warning)" },
      { label: "Pending", value: "10%", color: "var(--success)" },
      { label: "Blocked", value: "4%", color: "var(--danger)" },
    ],
    linkLabel: "View Full Progress",
    linkTo: "/refactoring",
  },
  "/validation": {
    title: "Testing Progress",
    ring: {
      value: "87%",
      caption: "Overall Progress",
      segments: [
        { value: 87, color: "var(--brand-bright)" },
        { value: 8, color: "var(--warning)" },
        { value: 3, color: "var(--success)" },
        { value: 2, color: "var(--danger)" },
      ],
    },
    segments: [
      { label: "Completed", value: "87%", color: "var(--brand-bright)" },
      { label: "In Progress", value: "8%", color: "var(--warning)" },
      { label: "Pending", value: "3%", color: "var(--success)" },
      { label: "Blocked", value: "2%", color: "var(--danger)" },
    ],
    linkLabel: "View Full Progress",
    linkTo: "/validation",
  },
  "/security": {
    title: "Security Posture",
    ring: {
      value: "72%",
      caption: "Overall Score",
      segments: [
        { value: 72, color: "var(--success)" },
        { value: 16, color: "var(--warning)" },
        { value: 12, color: "var(--danger)" },
      ],
    },
    segments: [
      { label: "Secure", value: "72%", color: "var(--success)" },
      { label: "Warning", value: "16%", color: "var(--warning)" },
      { label: "Critical", value: "12%", color: "var(--danger)" },
    ],
    linkLabel: "View Security Posture",
    linkTo: "/security",
  },
  "/governance": {
    title: "Governance Health",
    ring: {
      value: "78%",
      caption: "Overall Score",
      segments: [
        { value: 78, color: "var(--success)" },
        { value: 12, color: "var(--warning)" },
        { value: 10, color: "var(--danger)" },
      ],
    },
    segments: [
      { label: "Compliant", value: "78%", color: "var(--success)" },
      { label: "At Risk", value: "12%", color: "var(--warning)" },
      { label: "Non-compliant", value: "10%", color: "var(--danger)" },
    ],
    linkLabel: "View Governance Health",
    linkTo: "/governance",
  },
  "/applications": {
    title: "Application Portfolio Health",
    ring: {
      value: "78%",
      caption: "Healthy",
      segments: [
        { value: 78, color: "var(--success)" },
        { value: 14, color: "var(--warning)" },
        { value: 8, color: "var(--danger)" },
      ],
    },
    segments: [
      { label: "Healthy", value: "78%", color: "var(--success)" },
      { label: "At Risk", value: "14%", color: "var(--warning)" },
      { label: "Critical", value: "8%", color: "var(--danger)" },
    ],
    linkLabel: "View Portfolio Health",
    linkTo: "/applications",
  },
  "/teams": {
    title: "Team Health",
    ring: {
      value: "84%",
      caption: "Average Health",
      segments: [
        { value: 62, color: "var(--success)" },
        { value: 26, color: "var(--warning)" },
        { value: 12, color: "var(--danger)" },
      ],
    },
    segments: [
      { label: "On Track", value: "62%", color: "var(--success)" },
      { label: "At Risk", value: "26%", color: "var(--warning)" },
      { label: "Overdue", value: "12%", color: "var(--danger)" },
    ],
    linkLabel: "View Team Health",
    linkTo: "/teams",
  },
  "/reports": {
    title: "Reporting Summary",
    segments: [
      { label: "Total Reports", value: "184", color: "var(--brand-bright)" },
      { label: "Scheduled", value: "62", color: "var(--intel)" },
      { label: "Reports Run", value: "4,286", color: "var(--success)" },
      { label: "Success Rate", value: "98.4%", color: "var(--warning)" },
    ],
    linkLabel: "View Report Activity",
    linkTo: "/reports",
  },
};
