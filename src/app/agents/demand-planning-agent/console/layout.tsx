"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  ListChecks,
  Activity,
  Zap,
  AlertTriangle,
  RefreshCw,
  FileText,
  Sparkles,
  Bot,
  Network,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { DataProvider } from "@/lib/demand-planning/state/dataContext";
import { OverrideProvider } from "@/lib/demand-planning/state/overrideContext";
import { FloatingChatButton } from "@/lib/demand-planning/ui/FloatingChatButton";
import "./demand-planning-theme.css";

const BASE = "/agents/demand-planning-agent/console";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const nav: NavItem[] = [
  { to: `${BASE}/overview`, label: "Home", icon: Home },
  { to: `${BASE}/forecast-collaboration`, label: "Forecast Collaboration", icon: Users },
  { to: `${BASE}/agent-tracker`, label: "Agent Tracker", icon: ListChecks },
  { to: `${BASE}/data-health`, label: "Data Health", icon: Activity },
  { to: `${BASE}/kpi-demand-sensing`, label: "KPI & Demand Sensing", icon: Zap },
  { to: `${BASE}/exceptions`, label: "Exception Report", icon: AlertTriangle },
  { to: `${BASE}/coverage`, label: "Coverage & Reallocation", icon: RefreshCw },
  { to: `${BASE}/governance`, label: "Governance Pre-Reads", icon: FileText },
  { to: `${BASE}/learning`, label: "Learning Dashboard", icon: Sparkles },
  { to: `${BASE}/assistant`, label: "AI Assistant", icon: Bot },
  { to: `${BASE}/architecture`, label: "AI Architecture", icon: Network },
];

export default function DemandPlanningLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <OverrideProvider>
        <AppShell>{children}</AppShell>
      </OverrideProvider>
    </DataProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isArchitecture = pathname === `${BASE}/architecture`;

  return (
    <div className="demand-planning-theme min-h-screen flex bg-cream text-navy">
      <SidebarNav />
      <div className="flex-1 flex flex-col min-w-0">
        {!isArchitecture && <TopHeader />}
        <main className={isArchitecture ? "flex-1 min-w-0" : "flex-1 p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto"}>
          {children}
        </main>
      </div>
      {!isArchitecture && <FloatingChatButton />}
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
      className={`${hover ? "w-64" : "w-14"} transition-[width] duration-200 bg-navy text-white border-r border-white/10 flex flex-col sticky top-0 h-screen z-30 overflow-hidden`}
    >
      <Link
        href="/"
        title="Back to K-Nexus.AI"
        className="h-14 flex items-center px-3 border-b border-white/10 hover:bg-white/10 transition-colors flex-shrink-0"
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
          <span className="ml-2 text-sm font-semibold tracking-tight leading-tight whitespace-nowrap">
            Demand<span className="text-coral">IQ</span>
          </span>
        )}
      </Link>

      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <div className="pb-3 mb-3 border-b border-white/10">
          <Link
            href="/"
            title="Back to K-Nexus"
            className="flex items-center h-9 px-3 mx-2 rounded-lg text-[13px] text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Home className="w-4 h-4 shrink-0" />
            {hover && <span className="ml-3 truncate">Back to K-Nexus</span>}
          </Link>
        </div>

        {nav.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex items-center h-9 px-3 mx-2 rounded-lg text-[13px] transition-colors ${
                active ? "bg-coral text-white shadow-[0_4px_12px_rgba(224,53,92,0.25)]" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.3 : 1.8} />
              {hover && <span className="ml-3 truncate flex-1 min-w-0">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
          <Cpu size={16} strokeWidth={2.2} />
        </div>
        {hover && (
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">DemandIQ Agent</div>
            <div className="text-[10px] text-teal-soft/80 font-mono">Active</div>
          </div>
        )}
        {hover && <div className="ml-auto w-2 h-2 rounded-full bg-success animate-dp-pulse-soft flex-shrink-0" />}
      </div>
    </aside>
  );
}

function TopHeader() {
  const pathname = usePathname();
  const current = nav.find((n) => n.to === pathname);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[#E7DDCB] px-5 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl font-extrabold text-navy tracking-tight whitespace-nowrap">
          Demand<span className="text-coral">IQ</span>
        </span>
        <div className="hidden md:block h-6 w-px bg-[#E7DDCB] flex-shrink-0" />
        <span className="hidden md:block text-sm text-muted font-medium truncate">
          {current?.label ?? "Autonomous Planning"}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          href={`${BASE}/architecture`}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-coral hover:bg-coral/5"
        >
          <Network size={14} />
          <span className="hidden sm:inline">AI Architecture</span>
        </Link>
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-navy leading-tight">Demand Planner</div>
          <div className="text-[11px] text-muted">Autonomous Planning</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-teal text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          P
        </div>
      </div>
    </header>
  );
}
