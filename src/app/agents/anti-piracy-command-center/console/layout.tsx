"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Network,
  LayoutDashboard,
  BarChart3,
  ScrollText,
  FileSearch,
  Briefcase,
  Shield,
  FolderArchive,
  Gavel,
  Radar,
  Scale,
  FileText,
  BookOpen,
  Users,
  Bot,
  SlidersHorizontal,
  Settings,
  ChevronDown,
} from "lucide-react";
import { SessionProvider, useSession } from "@/lib/anti-piracy/session";
import { NAV_GROUPS, ROLE_LABEL, BASE, KPMG_LOGO } from "@/lib/anti-piracy/constants";
import { navAllowed } from "@/lib/anti-piracy/rbac";
import { PageLoader } from "@/lib/anti-piracy/components/LoadingDots";
import KBot from "@/lib/anti-piracy/components/KBot";
import type { Role } from "@/lib/anti-piracy/types";
import "./anti-piracy-theme.css";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  architecture: Network,
  overview: LayoutDashboard,
  analytics: BarChart3,
  reports: ScrollText,
  discovery: FileSearch,
  investigations: Briefcase,
  cases: Shield,
  evidence: FolderArchive,
  enforcement: Gavel,
  radar: Radar,
  legal: Scale,
  notices: FileText,
  catalogue: BookOpen,
  entities: Users,
  llm: Bot,
  configuration: SlidersHorizontal,
  administration: Settings,
  audit: ScrollText,
};

export default function AntiPiracyLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hover, setHover] = useState(false);
  const { user, personas, setPersona } = useSession();

  const groups = useMemo(() => {
    return NAV_GROUPS.filter((g) => navAllowed(user.role as Role, g.roles))
      .map((g) => ({ ...g, items: g.items.filter((item) => navAllowed(user.role as Role, item.roles ?? g.roles)) }))
      .filter((g) => g.items.length > 0);
  }, [user.role]);

  const currentLabel = useMemo(() => {
    for (const g of NAV_GROUPS) {
      const item = g.items.find((i) => pathname === i.href || pathname?.startsWith(i.href + "/"));
      if (item) return item.label;
    }
    return "";
  }, [pathname]);

  return (
    <div className="anti-piracy-theme min-h-screen flex bg-[#F4F6F9] text-[#1A1F36]">
      <aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`${hover ? "w-64" : "w-14"} transition-[width] duration-200 bg-[#0A1F4D] text-white flex flex-col sticky top-0 h-screen z-30 overflow-hidden`}
      >
        <Link
          href="/"
          title="Back to K-Nexus.AI"
          className="h-14 flex items-center px-3 border-b border-white/[0.08] hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <div className="w-8 h-8 shrink-0 rounded bg-white flex items-center justify-center">
            <img src={KPMG_LOGO} alt="" className="h-4 w-auto object-contain" />
          </div>
          {hover && (
            <span className="ml-2 text-[11px] font-semibold tracking-tight leading-tight text-white/80">
              Anti-Piracy Command Center
            </span>
          )}
        </Link>

        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="pb-3 mb-3 border-b border-white/[0.08]">
            <Link
              href="/"
              title="Back to K-Nexus"
              className="flex items-center h-9 px-3 mx-2 rounded-md text-[13px] text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Home className="w-4 h-4 shrink-0" />
              {hover && <span className="ml-3 truncate">Back to K-Nexus</span>}
            </Link>
            <Link
              href={BASE}
              title="Console home"
              className="flex items-center h-9 px-3 mx-2 rounded-md text-[13px] text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {hover && <span className="ml-3 truncate">Console Home</span>}
            </Link>
          </div>

          {groups.map((group, gi) => (
            <div key={group.label || `group-${gi}`} className="mb-2">
              {hover && group.label && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-5 mb-1">{group.label}</p>
              )}
              {group.items.map((item) => {
                const Icon = ICONS[item.id] ?? LayoutDashboard;
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={item.label}
                    className={`flex items-center h-9 px-3 mx-2 rounded-md text-[13px] ${
                      active
                        ? "bg-[#00338D]/30 text-white border-l-2 border-[#0077C8]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {hover && <span className="ml-3 truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {hover && (
          <div className="px-4 py-3 border-t border-white/[0.08] text-[10px] text-white/40 leading-relaxed flex-shrink-0">
            Synthetic / demonstration data. No live scraping or legal filings.
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center px-5 gap-3 sticky top-0 z-20">
          <div className="flex items-baseline gap-2 min-w-0 shrink-0">
            <span className="text-sm font-semibold text-[#00338D] whitespace-nowrap font-heading">
              S. Chand Anti-Piracy Command Center
            </span>
            <span className="hidden xl:inline text-xs text-[#9CA3AF] truncate">/ {currentLabel}</span>
          </div>

          <div className="flex-1" />

          <span className="hidden lg:inline-flex items-center h-7 px-2.5 rounded-full border border-[#D4A017]/30 bg-[#FFFBEB] text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">
            Synthetic / Demonstration Data
          </span>

          <div className="relative flex items-center gap-2 pl-3 border-l border-[#E2E8F0]">
            <div className="w-8 h-8 rounded-full bg-[#00338D] text-white text-xs font-semibold flex items-center justify-center">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="text-xs leading-tight hidden sm:block">
              <div className="font-medium text-[#1A1F36]">{user.name}</div>
              <div className="text-[#6B7280]">{ROLE_LABEL[user.role]}</div>
            </div>
            <select
              value={user.id}
              onChange={(e) => setPersona(e.target.value)}
              title="Switch demo persona"
              className="text-xs border border-[#E2E8F0] rounded-lg pl-2 pr-6 py-1.5 bg-white text-[#1A1F36] appearance-none cursor-pointer"
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {ROLE_LABEL[p.role]}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] -ml-6 pointer-events-none" />
          </div>
        </header>

        <main className="flex-1 ap-fade-in min-w-0">
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </main>
      </div>

      <KBot user={{ name: user.name, role: user.role as Role }} pathname={pathname ?? BASE} />
    </div>
  );
}
