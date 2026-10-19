"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Compass,
  ListTree,
  ShieldCheck,
  Network,
  Gauge,
  MessageSquare,
  Sparkles,
  FileBarChart,
  Blocks,
  Settings,
  Bell,
  ChevronDown,
} from "lucide-react";
import { SessionProvider, useSession } from "@/lib/enterprise-architecture/session";
import "./ea-theme.css";

const BASE = "/agents/enterprise-architecture-agent/console";

const nav = [
  { to: `${BASE}/overview`, label: "Overview", icon: Compass },
  { to: `${BASE}/dashboard`, label: "Dashboard", icon: LayoutGrid },
  { to: `${BASE}/command-center`, label: "Command Center", icon: Sparkles },
  { to: `${BASE}/analysis`, label: "Step 1 — EA Analysis", icon: ListTree },
  { to: `${BASE}/arb`, label: "ARB Decisions", icon: ShieldCheck },
  { to: `${BASE}/mapping`, label: "Step 2 — Dependency Map", icon: Network },
  { to: `${BASE}/maturity`, label: "Step 3 — Maturity Assessment", icon: Gauge },
  { to: `${BASE}/advisory`, label: "AI Advisory", icon: MessageSquare },
  { to: `${BASE}/agents`, label: "AI Agents", icon: Blocks },
  { to: `${BASE}/reports`, label: "Reports", icon: FileBarChart },
  { to: `${BASE}/architecture`, label: "Platform Architecture", icon: Network },
  { to: `${BASE}/settings`, label: "Settings", icon: Settings },
] as const;

export default function EnterpriseArchitectureLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppLayout>{children}</AppLayout>
    </SessionProvider>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [hover, setHover] = useState(false);
  const { timeResult, arbResult, maturityResult } = useSession();

  return (
    <div className="ea-theme min-h-screen flex bg-background text-foreground">
      <aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`${hover ? "w-64" : "w-14"} transition-[width] duration-200 bg-navy text-navy-foreground border-r border-sidebar-border flex flex-col sticky top-0 h-screen z-30`}
      >
        <Link
          href="/"
          title="Back to K-Nexus.AI"
          className="h-14 flex items-center px-3 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors shrink-0"
        >
          <div className="w-8 h-8 shrink-0">
            <svg viewBox="0 0 32 32" width={32} height={32}>
              <rect x="3" y="3" width="11" height="11" fill="#fff" />
              <rect x="18" y="3" width="11" height="11" fill="#1E49E2" />
              <rect x="3" y="18" width="11" height="11" fill="#1E49E2" />
              <rect x="18" y="18" width="11" height="11" fill="#10B981" />
            </svg>
          </div>
          {hover && (
            <span className="ml-2 text-sm font-semibold tracking-tight leading-tight">
              Enterprise Architecture
            </span>
          )}
        </Link>

        <nav className="flex-1 py-3 overflow-y-auto no-scrollbar">
          <div className="pb-3 mb-3 border-b border-sidebar-border">
            <Link
              href="/"
              title="Back to K-Nexus.AI"
              className="flex items-center h-9 px-3 mx-2 rounded-ea-sm text-[13px] text-white/70 hover:bg-sidebar-accent hover:text-white"
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
                className={`flex items-center h-9 px-3 mx-2 rounded-ea-sm text-[13px] ${
                  active
                    ? "bg-sidebar-accent text-white border-l-2 border-teal"
                    : "text-white/70 hover:bg-sidebar-accent hover:text-white"
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {hover && <span className="ml-3 truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {hover && (
          <div className="px-4 py-3 border-t border-sidebar-border text-[10px] text-white/50 leading-relaxed shrink-0">
            Enterprise Architecture Intelligence — capability mapping, technology redundancy
            detection, and modernisation roadmapping.
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-surface border-b border-border flex items-center px-5 gap-3 sticky top-0 z-20">
          <div className="flex items-baseline gap-2 min-w-0 shrink-0">
            <span className="text-sm font-semibold text-navy whitespace-nowrap">
              EA Intelligence Console
            </span>
            <span className="hidden xl:inline text-xs text-muted-foreground truncate">
              / {labelFor(path ?? "")}
            </span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden lg:inline-flex items-center h-7 px-2.5 rounded-full border border-border bg-background text-xs text-muted-foreground"
              title="Portfolio loaded into this session"
            >
              {timeResult ? `${timeResult.applications.length} apps scored` : "No portfolio loaded"}
            </span>
            {arbResult && (
              <span
                className={`hidden lg:inline-flex items-center h-7 px-2.5 rounded-full text-xs font-medium ${
                  arbResult.decision === "APPROVED"
                    ? "bg-success/10 text-success"
                    : arbResult.decision === "REJECTED"
                      ? "bg-crimson/10 text-crimson"
                      : "bg-amber/10 text-amber"
                }`}
              >
                ARB: {arbResult.decision}
              </span>
            )}
            {maturityResult?.overall_maturity_score !== undefined && (
              <span className="hidden lg:inline-flex items-center h-7 px-2.5 rounded-full border border-border bg-background text-xs text-muted-foreground">
                Maturity {maturityResult.overall_maturity_score}/5
              </span>
            )}

            <button className="relative w-9 h-9 rounded-ea-sm hover:bg-background flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </button>

            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-semibold flex items-center justify-center">
                EA
              </div>
              <div className="text-xs leading-tight">
                <div className="font-medium">Enterprise Architect</div>
                <div className="text-muted-foreground">Client Deployment</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </header>

        <main className="flex-1 ea-fade-in min-w-0">{children}</main>
      </div>
    </div>
  );
}

function labelFor(path: string) {
  const item = nav.find((n) => path.startsWith(n.to));
  return item?.label ?? "";
}
