"use client";

/*
 * App shell for the Engineering Observability Command Center, ported from the
 * standalone ontos-insight app (src/components/shell/app-shell.tsx). The
 * source app's own localStorage login screen is dropped: K-Nexus middleware
 * already guards /agents/* behind the marketplace login.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  Activity,
  Workflow,
  AlertTriangle,
  BrainCircuit,
  Wallet,
  Briefcase,
  Network,
  Search,
  Menu,
  X,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/engineering-observability/utils";
import { obsHref } from "@/lib/engineering-observability/paths";
import { AskOccButton, AskOccOverlay } from "@/lib/engineering-observability/shell/ask-occ";
import "./eng-obs-theme.css";

const navItems = [
  { title: "Overview", url: obsHref("/"), icon: LayoutDashboard },
  { title: "Live Ops", url: obsHref("/live-ops"), icon: Activity },
  { title: "Service Map", url: obsHref("/service-map"), icon: Workflow },
  { title: "Incidents", url: obsHref("/incidents"), icon: AlertTriangle },
  { title: "AI Insights", url: obsHref("/ai-insights"), icon: BrainCircuit },
  { title: "Cost & Risk", url: obsHref("/cost-risk"), icon: Wallet },
  { title: "Engineering Portfolio", url: obsHref("/portfolio"), icon: Briefcase },
  { title: "Knowledge Graph", url: obsHref("/knowledge-graph"), icon: Network },
];

function AppMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-sidebar-primary">
        <Zap className="h-[18px] w-[18px] text-sidebar-primary-foreground" fill="currentColor" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-wide text-sidebar-primary-foreground">
            Engineering OCC
          </div>
          <div className="text-[10px] uppercase tracking-widest text-[color:color-mix(in_oklab,var(--sidebar-foreground)_60%,transparent)]">
            Engineering Intelligence Platform
          </div>
        </div>
      )}
    </div>
  );
}

function BackToKnexus({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      title="Back to K-Nexus.AI"
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-[12px] font-medium text-[color:color-mix(in_oklab,var(--sidebar-foreground)_70%,transparent)] transition-colors hover:bg-[color:color-mix(in_oklab,var(--sidebar-accent)_50%,transparent)] hover:text-sidebar-primary-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {!collapsed && <span>Back to K-Nexus.AI</span>}
    </Link>
  );
}

function SidebarNav({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const currentPath = usePathname() ?? "";
  return (
    <nav className={cn("scrollbar-thin flex-1 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
      {!collapsed && (
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-[color:color-mix(in_oklab,var(--sidebar-foreground)_50%,transparent)]">
          Command Center
        </div>
      )}
      <ul className="space-y-0.5">
        {navItems.map((item) => {
          const active = currentPath.startsWith(item.url);
          return (
            <li key={item.title}>
              <Link
                href={item.url}
                onClick={onNavigate}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary-foreground"
                    : "text-[color:color-mix(in_oklab,var(--sidebar-foreground)_75%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--sidebar-accent)_50%,transparent)] hover:text-sidebar-primary-foreground",
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", active && "text-sidebar-primary")} />
                {!collapsed && <span>{item.title}</span>}
                {!collapsed && active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {!collapsed && (
        <div className="mt-6 rounded-md border border-sidebar-border bg-[color:color-mix(in_oklab,var(--sidebar-accent)_40%,transparent)] p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-sidebar-primary-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-healthy animate-pulse-dot" />
            Data fabric live
          </div>
          <p className="mt-1 text-[11px] leading-snug text-[color:color-mix(in_oklab,var(--sidebar-foreground)_60%,transparent)]">
            7/7 sources synced · 41,634 entities · updated 2 min ago
          </p>
        </div>
      )}
    </nav>
  );
}

export default function EngineeringObservabilityLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="eng-obs-theme flex min-h-screen w-full bg-background font-sans text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "px-4",
          )}
        >
          <AppMark collapsed={collapsed} />
        </div>
        <SidebarNav collapsed={collapsed} />
        <div className="space-y-1 border-t border-sidebar-border p-2">
          <BackToKnexus collapsed={collapsed} />
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-[12px] font-medium text-[color:color-mix(in_oklab,var(--sidebar-foreground)_70%,transparent)] transition-colors hover:bg-[color:color-mix(in_oklab,var(--sidebar-accent)_50%,transparent)] hover:text-sidebar-primary-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-[color:color-mix(in_oklab,var(--foreground)_40%,transparent)]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <AppMark />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded p-1 text-sidebar-foreground hover:bg-sidebar-accent"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-sidebar-border p-2">
              <BackToKnexus />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-8">
          <button
            className="rounded p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-healthy animate-pulse-dot" />
              Live · Demo environment
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                readOnly
                onClick={() => setAskOpen(true)}
                placeholder="Ask OCC anything…"
                className="h-9 w-56 cursor-pointer rounded-md border border-input bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring lg:w-72"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">
                AI
              </kbd>
            </div>
            <AskOccButton onClick={() => setAskOpen(true)} />
            <button
              className="relative rounded-md p-2 text-muted-foreground hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-critical text-[9px] font-bold text-critical-soft">
                2
              </span>
            </button>
            <button className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted">
              <CircleUserRound className="h-6 w-6 text-muted-foreground" />
              <span className="hidden text-left leading-tight md:block">
                <span className="block text-xs font-semibold text-foreground">S. Okafor</span>
                <span className="block text-[10px] text-muted-foreground">Eng. Director</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>

      <AskOccOverlay open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );
}
