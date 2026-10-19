"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  UploadCloud,
  ListTree,
  Sparkles,
  Bot,
  FileBarChart,
  ChevronDown,
} from "lucide-react";
import { SessionProvider, useSession } from "@/lib/portfolio-rationalization/session";
import "./ptr-theme.css";

const BASE = "/agents/portfolio-rationalization/console";

const nav = [
  { to: `${BASE}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
  { to: `${BASE}/ingest`, label: "Data Ingest", icon: UploadCloud },
  { to: `${BASE}/inventory`, label: "Tool Inventory", icon: ListTree },
  { to: `${BASE}/assessment`, label: "AI Assessment", icon: Sparkles },
  { to: `${BASE}/advisor`, label: "AI Advisor", icon: Bot },
  { to: `${BASE}/reports`, label: "Reports", icon: FileBarChart },
] as const;

export default function PortfolioRationalizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppLayout>{children}</AppLayout>
    </SessionProvider>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [hover, setHover] = useState(false);
  const { tools, duplications } = useSession();

  return (
    <div className="ptr-theme min-h-screen flex text-[var(--ptr-text)]">
      <aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`${hover ? "w-60" : "w-14"} transition-[width] duration-200 ptr-sidebar text-white border-r border-black/10 flex flex-col sticky top-0 h-screen z-30`}
      >
        <Link href="/" title="Back to K-Nexus.AI" className="h-14 flex items-center px-3 border-b border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 shrink-0">
            <svg viewBox="0 0 32 32" width={32} height={32}>
              <rect x="3" y="3" width="11" height="11" fill="#fff" />
              <rect x="18" y="3" width="11" height="11" fill="#005EB8" />
              <rect x="3" y="18" width="11" height="11" fill="#005EB8" />
              <rect x="18" y="18" width="11" height="11" fill="#00B0A0" />
            </svg>
          </div>
          {hover && <span className="ml-2 text-sm font-semibold tracking-tight leading-tight">Portfolio Rationalization</span>}
        </Link>

        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="pb-3 mb-3 border-b border-white/10">
            <Link href="/" title="Back to K-Nexus.AI" className="flex items-center h-9 px-3 mx-2 rounded-md text-[13px] text-white/70 hover:bg-white/10 hover:text-white">
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
                  active ? "bg-white/15 text-white border-l-2 border-[var(--ptr-green)]" : "text-white/70 hover:bg-white/10 hover:text-white"
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
          <div className="px-4 py-3 border-t border-white/10 text-[10px] text-white/50 leading-relaxed">
            Enterprise technology portfolio assessment &amp; 6R rationalization advisory.
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-[var(--ptr-border)] flex items-center px-5 gap-3 sticky top-0 z-20">
          <div className="flex items-baseline gap-2 min-w-0 shrink-0">
            <span className="text-sm font-semibold text-[var(--ptr-navy)] whitespace-nowrap">Portfolio Rationalization</span>
            <span className="hidden xl:inline text-xs text-[var(--ptr-muted)] truncate">/ {labelFor(path ?? "")}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden lg:inline-flex items-center h-7 px-2.5 rounded-full border border-[var(--ptr-border)] bg-[var(--ptr-background)] text-xs text-[var(--ptr-muted)]"
              title="Tools currently loaded in this session"
            >
              {tools.length} tool{tools.length === 1 ? "" : "s"} &bull; {duplications.length} overlaps
            </span>

            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[var(--ptr-border)]">
              <div className="w-8 h-8 rounded-full bg-[var(--ptr-navy)] text-white text-xs font-semibold flex items-center justify-center">
                EA
              </div>
              <div className="text-xs leading-tight">
                <div className="font-medium">Enterprise Architect</div>
                <div className="text-[var(--ptr-muted)]">Technology Advisory</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ptr-muted)]" />
            </div>
          </div>
        </header>

        <main className="flex-1 ptr-fade-in min-w-0 bg-[var(--ptr-background)]">{children}</main>
      </div>
    </div>
  );
}

function labelFor(path: string) {
  const item = nav.find((n) => path.startsWith(n.to));
  return item?.label ?? "";
}
