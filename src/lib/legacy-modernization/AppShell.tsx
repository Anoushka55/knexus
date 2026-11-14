"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { ltmHref, platformNav, portfolioNav } from "./nav";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-[color:color-mix(in_oklch,var(--navy-deep)_60%,transparent)]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full w-[264px] flex-col overflow-y-auto bg-sidebar">
            <div className="flex items-center gap-2.5 px-4 py-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary">
                <Cpu className="size-5 text-sidebar-primary-foreground" />
              </span>
              <p className="flex-1 text-[13px] leading-tight font-semibold text-sidebar-foreground">
                Legacy Tech Modernization AI
              </p>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="size-4 text-[color:color-mix(in_oklch,var(--sidebar-foreground)_70%,transparent)]" />
              </button>
            </div>
            {[
              { label: "Platform", items: platformNav },
              { label: "Portfolio", items: portfolioNav },
            ].map((group) => (
              <div key={group.label} className="px-3">
                <p className="px-2 pt-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-[color:color-mix(in_oklch,var(--sidebar-foreground)_45%,transparent)] uppercase">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <Link
                        href={ltmHref(item.to)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium",
                          pathname === ltmHref(item.to)
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-[color:color-mix(in_oklch,var(--sidebar-foreground)_75%,transparent)]",
                        )}
                      >
                        <item.icon className="size-[17px]" />
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 space-y-5 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
