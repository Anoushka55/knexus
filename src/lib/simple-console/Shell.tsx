"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  FileBarChart,
  ListChecks,
  Calculator,
  AlertTriangle,
  Ticket,
  Target,
  Gauge,
  Compass,
  DollarSign,
  ClipboardCheck,
  Layers,
  Receipt,
  ShieldAlert,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { agents } from "@/data/agents";
import { simpleConsoleConfig } from "./data";

const ICONS: Record<string, LucideIcon> = {
  ListChecks,
  Calculator,
  AlertTriangle,
  Ticket,
  Target,
  Gauge,
  Compass,
  DollarSign,
  ClipboardCheck,
  Layers,
  Receipt,
  ShieldAlert,
  Workflow,
};

export function SimpleConsoleShell({
  agentId,
  children,
}: {
  agentId: string;
  children: React.ReactNode;
}) {
  const activePath = usePathname();
  const agent = agents.find((a) => a.id === agentId);
  const config = simpleConsoleConfig[agentId];
  if (!agent || !config) return null;

  const base = `/agents/${agentId}/console`;
  const OpsIcon = ICONS[config.opsIcon] ?? LayoutGrid;

  const nav = [
    { href: base, label: "Overview", icon: LayoutGrid },
    { href: `${base}/${config.opsSlug}`, label: config.opsLabel, icon: OpsIcon },
    { href: `${base}/reports`, label: "Reports", icon: FileBarChart },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-56 shrink-0 bg-slate-900 text-slate-100 flex flex-col sticky top-0 h-screen">
        <Link
          href="/"
          className="h-14 flex items-center gap-2 px-4 border-b border-slate-800 hover:bg-slate-800 transition-colors"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium truncate">Back to K-Nexus</span>
        </Link>

        <div className="px-4 py-3 border-b border-slate-800">
          <div className="text-sm font-semibold leading-tight">{agent.title}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {agent.scope?.type} · {agent.autonomy?.type}
          </div>
        </div>

        <nav className="flex-1 py-3">
          {nav.map((item) => {
            const active = activePath === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 h-9 px-4 mx-2 rounded-md text-[13px] transition-colors ${
                  active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed">
          Illustrative console with representative sample data.
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6">
          <span className="text-sm font-semibold text-slate-900">{agent.title}</span>
          {typeof agent.accuracy === "number" && (
            <span className="ml-3 text-xs text-slate-400">{agent.accuracy}% accuracy</span>
          )}
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
