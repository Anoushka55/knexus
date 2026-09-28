"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  AlertOctagon,
  Network,
  Route as RouteIcon,
  Sparkles,
  Workflow,
  History,
  Bot,
  FileBarChart,
  Settings,
  Bell,
  ChevronDown,
  Presentation,
} from "lucide-react";
import { SessionProvider, useSession } from "@/lib/aiops/session";
import { kpis, scenarios } from "@/lib/aiops";
import "./aiops-theme.css";

const BASE = "/agents/aiops-sentry/console";

const nav = [
  { to: `${BASE}/dashboard`, label: "Control Tower", icon: LayoutGrid },
  { to: `${BASE}/problems`, label: "Problems & Incidents", icon: AlertOctagon },
  { to: `${BASE}/correlation`, label: "Correlation Explorer", icon: Network },
  { to: `${BASE}/journeys`, label: "Service Journeys", icon: RouteIcon },
  { to: `${BASE}/predictive`, label: "Predictive AI", icon: Sparkles },
  { to: `${BASE}/playbooks`, label: "Agentic Playbooks", icon: Workflow },
  { to: `${BASE}/similar`, label: "Remediation History", icon: History },
  { to: `${BASE}/agent`, label: "Operations Copilot", icon: Bot },
  { to: `${BASE}/reports`, label: "Reports & Insights", icon: FileBarChart },
  { to: `${BASE}/settings`, label: "Settings", icon: Settings },
] as const;

export default function AiOpsSentryLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppLayout>{children}</AppLayout>
    </SessionProvider>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [hover, setHover] = useState(false);
  const { demoMode, setDemoMode, scenario, setScenario, live, setLive, shift } = useSession();
  const k = kpis(shift);

  return (
    <div className="aiops-theme min-h-screen flex bg-background text-foreground">
      <aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`${hover ? "w-60" : "w-14"} transition-[width] duration-200 bg-navy text-navy-foreground border-r border-sidebar-border flex flex-col sticky top-0 h-screen z-30`}
      >
        <div className="h-14 flex items-center px-3 border-b border-sidebar-border">
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
              AI Operations
            </span>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map((item) => {
            const active = path?.startsWith(item.to) ?? false;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`flex items-center h-9 px-3 mx-2 rounded-aiops-sm text-[13px] ${
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
          <div className="px-4 py-3 border-t border-sidebar-border text-[10px] text-white/50 leading-relaxed">
            Anonymized client operational data, used to demonstrate platform capability.
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-surface border-b border-border flex items-center px-5 gap-3 sticky top-0 z-20">
          <div className="flex items-baseline gap-2 min-w-0 shrink-0">
            <span className="text-sm font-semibold text-navy whitespace-nowrap">
              AI Operations Control Tower
            </span>
            <span className="hidden xl:inline text-xs text-muted-foreground truncate">
              / {labelFor(path ?? "")}
            </span>
          </div>

          <div className="flex-1 min-w-0 flex justify-center overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setDemoMode(!demoMode)}
                title="Curated dataset with the workshop scenarios in focus"
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-xs shrink-0 whitespace-nowrap transition-colors ${
                  demoMode
                    ? "bg-navy text-white border-navy"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <Presentation className="w-3.5 h-3.5" /> Demo Mode
              </button>

              {demoMode && (
                <div className="inline-flex items-center bg-background border border-border rounded-full p-0.5 shrink-0">
                  <button
                    onClick={() => setScenario("all")}
                    className={`px-2.5 h-6 text-[11px] rounded-full whitespace-nowrap transition-colors ${
                      scenario === "all"
                        ? "bg-navy text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All scenarios
                  </button>
                  {scenarios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setScenario(s.id)}
                      title={s.headline}
                      className={`px-2.5 h-6 text-[11px] rounded-full transition-colors whitespace-nowrap ${
                        scenario === s.id
                          ? "bg-navy text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden lg:inline-flex items-center h-7 px-2.5 rounded-full border border-border bg-background text-xs text-muted-foreground"
              title="This environment runs on anonymized, representative client operational data."
            >
              Client Deployment
            </span>

            <button
              onClick={() => setLive(!live)}
              title={live ? "Pause the operations simulation" : "Resume the operations simulation"}
              className="inline-flex items-center gap-2 px-2.5 h-7 border border-border rounded-full bg-background hover:border-navy"
            >
              <span
                className={`w-2 h-2 rounded-full ${live ? "bg-success aiops-pulse-dot" : "bg-muted-foreground"}`}
              />
              <span className="text-xs text-foreground whitespace-nowrap">
                {live ? "Live Operations Simulation" : "Simulation paused"}
              </span>
            </button>

            <button className="relative w-9 h-9 rounded-aiops-sm hover:bg-background flex items-center justify-center">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-crimson text-white text-[10px] font-medium flex items-center justify-center">
                {k.activeProblems}
              </span>
            </button>

            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-semibold flex items-center justify-center">
                AM
              </div>
              <div className="text-xs leading-tight">
                <div className="font-medium">Aarav M.</div>
                <div className="text-muted-foreground">Service Assurance Lead</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </header>

        <main className="flex-1 aiops-fade-in min-w-0">{children}</main>
      </div>
    </div>
  );
}

function labelFor(path: string) {
  const item = nav.find((n) => path.startsWith(n.to));
  return item?.label ?? "";
}
