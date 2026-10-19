"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronDown,
  DollarSign,
  HelpCircle,
  Home,
  LayoutGrid,
  Network,
  Search,
  Share2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { currentUser } from "@/lib/engineering-observability/data/user";
import "./eng-obs-theme.css";

const BASE = "/agents/engineering-observability-command-center/console";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const nav: NavItem[] = [
  { to: `${BASE}/overview`, label: "Overview", icon: Home },
  { to: `${BASE}/live-ops`, label: "Live Ops", icon: Activity },
  { to: `${BASE}/service-map`, label: "Service Map", icon: Network },
  { to: `${BASE}/incidents`, label: "Incidents", icon: AlertTriangle },
  { to: `${BASE}/ai-insights`, label: "AI Insights", icon: Sparkles },
  { to: `${BASE}/cost-risk`, label: "Cost & Risk", icon: DollarSign },
  { to: `${BASE}/engineering-portfolio`, label: "Engineering Portfolio", icon: LayoutGrid },
  { to: `${BASE}/knowledge-graph`, label: "Knowledge Graph", icon: Share2, badge: "NEW" },
];

export default function EngineeringObservabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="eng-obs-theme min-h-screen flex bg-background text-foreground">
      <SidebarNav />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="eng-obs-fade-in occ-scroll flex-1 overflow-y-auto min-w-0 bg-[var(--occ-surface-chrome)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarNav() {
  const path = usePathname();
  const [hover, setHover] = useState(false);

  return (
    <aside
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`${hover ? "w-60" : "w-14"} transition-[width] duration-200 bg-[var(--kpmg-blue-dark)] text-white border-r border-white/10 flex flex-col sticky top-0 h-screen z-30`}
    >
      <Link
        href="/"
        title="Back to K-Nexus.AI"
        className="h-14 flex items-center px-3 border-b border-white/10 hover:bg-white/10 transition-colors"
      >
        <div className="w-8 h-8 shrink-0">
          <svg viewBox="0 0 32 32" width={32} height={32}>
            <rect x="3" y="3" width="11" height="11" fill="#fff" />
            <rect x="18" y="3" width="11" height="11" fill="#005EB8" />
            <rect x="3" y="18" width="11" height="11" fill="#005EB8" />
            <rect x="18" y="18" width="11" height="11" fill="#00B0A0" />
          </svg>
        </div>
        {hover && (
          <span className="ml-2 text-sm font-semibold tracking-tight leading-tight">
            Engineering OCC
          </span>
        )}
      </Link>

      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="pb-3 mb-3 border-b border-white/10">
          <Link
            href="/"
            title="Back to K-Nexus.AI"
            className="flex items-center h-9 px-3 mx-2 rounded-md text-[13px] text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Home className="w-4 h-4 shrink-0" />
            {hover && <span className="ml-3 truncate">Back to K-Nexus</span>}
          </Link>
        </div>

        {nav.map((item) => {
          const active = path?.startsWith(item.to) ?? false;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex items-center h-9 px-3 mx-2 rounded-md text-[13px] ${
                active
                  ? "bg-[var(--kpmg-blue-mid)] text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              {hover && (
                <span className="ml-3 truncate flex-1 min-w-0">
                  {item.label}
                  {item.badge ? (
                    <span className="ml-2 inline-block rounded-full bg-[var(--kpmg-purple)] px-1.5 py-[1px] text-[9px] font-bold uppercase leading-[14px] tracking-wide text-white align-middle">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {hover && (
        <div className="px-4 py-3 border-t border-white/10 text-[10px] text-white/50 leading-relaxed">
          Anonymized client operational data, used to demonstrate platform capability.
        </div>
      )}
    </aside>
  );
}

function TopHeader() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-5 border-b border-border bg-[var(--occ-surface-main)] px-5">
      <h1 className="shrink-0 text-[15px] font-bold tracking-tight text-foreground whitespace-nowrap">
        Engineering Observability Command Center
      </h1>
      <span className="hidden xl:inline text-xs text-muted-foreground truncate">
        / {labelFor(path ?? "")}
      </span>

      {/* Search */}
      <div className="relative w-full max-w-[380px] hidden md:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2}
        />
        <input
          type="text"
          placeholder="Ask OCC or search for anything..."
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-[70px] text-[13px] text-foreground placeholder:text-muted-foreground focus:border-[var(--kpmg-blue-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--kpmg-blue-mid)]/15"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Ctrl + K
        </span>
      </div>

      {/* Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--kpmg-blue-mid)] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--kpmg-blue-hover)]"
        >
          Ask OCC
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </button>

        <button
          type="button"
          aria-label={`${currentUser.notificationCount} notifications`}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--status-critical)] px-1 text-[10px] font-bold text-white">
            {currentUser.notificationCount}
          </span>
        </button>

        <button
          type="button"
          aria-label="Help"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HelpCircle className="h-5 w-5" strokeWidth={2} />
        </button>

        <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-border">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--kpmg-blue)] text-[13px] font-semibold text-white">
            {currentUser.initials}
          </span>
          <div className="text-[13px] leading-tight">
            <p className="font-bold text-foreground">{currentUser.firstName}</p>
            <p className="text-[11px] text-muted-foreground">{currentUser.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
        </div>
      </div>
    </header>
  );
}

function labelFor(path: string) {
  const item = nav.find((n) => path.startsWith(n.to));
  return item?.label ?? "";
}
