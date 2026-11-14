"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Command, Home, Menu, Search, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { ltmHref, platformNav, portfolioNav } from "./nav";

const allNav = [...platformNav, ...portfolioNav];

export function AppHeader({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const current = allNav.find((n) => ltmHref(n.to) === pathname);
  const section = platformNav.some((n) => ltmHref(n.to) === pathname) ? "Platform" : "Portfolio";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-[color:color-mix(in_oklch,var(--card)_95%,transparent)] px-4 backdrop-blur lg:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs text-muted-foreground md:flex">
        <Link href={ltmHref("/")} className="transition-colors hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <span>{section}</span>
        <span>/</span>
        <span className="truncate font-medium text-foreground">{current?.title ?? "Overview"}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <label className="relative hidden items-center sm:flex">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search applications, services, capabilities..."
            className="h-9 w-[240px] rounded-lg border bg-background pr-16 pl-9 text-xs text-foreground outline-none transition-[width,box-shadow] placeholder:text-muted-foreground focus:w-[340px] focus:ring-2 focus:ring-[color:color-mix(in_oklch,var(--ring)_30%,transparent)] xl:w-[320px]"
          />
          <span className="num pointer-events-none absolute right-2.5 flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <Command className="size-3" />K
          </span>
        </label>

        <button
          type="button"
          className="hidden h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary md:flex"
        >
          <span className="size-2 rounded-full bg-success" />
          Production
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>

        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="num absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-primary-foreground">
            7
          </span>
        </button>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary"
          aria-label="Settings"
        >
          <Settings className="size-4" />
        </button>

        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg border py-1 pr-2.5 pl-1 transition-colors hover:bg-secondary",
          )}
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-navy-deep text-[11px] font-semibold text-primary-foreground">
            AM
          </span>
          <span className="hidden leading-tight lg:block">
            <span className="block text-[12px] font-semibold text-foreground">Alex Morgan</span>
            <span className="block text-[10px] text-muted-foreground">Chief Architect</span>
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </div>

        <Link
          href="/"
          title="Back to K-Nexus"
          className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Back to K-Nexus"
        >
          <Home className="size-4" />
        </Link>
      </div>
    </header>
  );
}
