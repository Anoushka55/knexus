"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Cpu } from "lucide-react";

import { cn } from "@/lib/utils";
import { ltmHref, ltmRoute, platformNav, portfolioNav, sidebarSummaries, type NavItem } from "./nav";

function Ring({
  segments,
  value,
  caption,
}: {
  segments: Array<{ value: number; color: string }>;
  value: string;
  caption: string;
}) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  const r = 34;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative mx-auto size-[92px]">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="8" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const dash = `${len} ${c - len}`;
          const dashOffset = -offset;
          offset += len;
          return (
            <circle
              key={i}
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="8"
              strokeDasharray={dash}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-base font-semibold text-sidebar-foreground">{value}</span>
        <span className="text-[9px] text-[color:color-mix(in_oklch,var(--sidebar-foreground)_60%,transparent)]">{caption}</span>
      </div>
    </div>
  );
}

function NavList({
  label,
  items,
  collapsed,
  pathname,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
}) {
  return (
    <div className="px-3">
      {!collapsed ? (
        <p className="px-2 pt-4 pb-2 text-[10px] font-semibold tracking-[0.14em] text-[color:color-mix(in_oklch,var(--sidebar-foreground)_45%,transparent)] uppercase">
          {label}
        </p>
      ) : (
        <div className="my-3 border-t border-[color:color-mix(in_oklch,var(--sidebar-border)_60%,transparent)]" />
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = pathname === ltmHref(item.to);
          return (
            <li key={item.to}>
              <Link
                href={ltmHref(item.to)}
                title={item.title}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-[color:color-mix(in_oklch,var(--sidebar-foreground)_75%,transparent)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <item.icon className="size-[17px] shrink-0" />
                {!collapsed ? <span className="truncate">{item.title}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const summary = sidebarSummaries[ltmRoute(pathname)];

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-[264px]",
      )}
    >
      <div className={cn("flex items-center gap-2.5 px-4 py-4", collapsed && "justify-center px-0")}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <Cpu className="size-5 text-sidebar-primary-foreground" />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-[13px] leading-tight font-semibold text-sidebar-foreground">
              Legacy Tech Modernization AI
            </p>
            <p className="text-[10px] text-[color:color-mix(in_oklch,var(--sidebar-foreground)_55%,transparent)]">Enterprise Platform</p>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <NavList label="Platform" items={platformNav} collapsed={collapsed} pathname={pathname} />
        <NavList label="Portfolio" items={portfolioNav} collapsed={collapsed} pathname={pathname} />

        {!collapsed && summary ? (
          <div className="mx-3 mt-5 rounded-xl border border-[color:color-mix(in_oklch,var(--sidebar-border)_70%,transparent)] bg-[color:color-mix(in_oklch,var(--sidebar-accent)_45%,transparent)] p-3.5">
            <p className="text-[11px] font-semibold text-sidebar-foreground">{summary.title}</p>
            {summary.ring ? (
              <div className="my-3">
                <Ring {...summary.ring} />
              </div>
            ) : (
              <div className="h-2" />
            )}
            <ul className="space-y-1.5">
              {summary.segments.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-[11px]">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="min-w-0 flex-1 truncate text-[color:color-mix(in_oklch,var(--sidebar-foreground)_70%,transparent)]">{s.label}</span>
                  <span className="num font-semibold text-sidebar-foreground">{s.value}</span>
                </li>
              ))}
            </ul>
            <Link
              href={ltmHref(summary.linkTo)}
              className="mt-3 block rounded-md bg-[color:color-mix(in_oklch,var(--sidebar-primary)_90%,transparent)] py-1.5 text-center text-[11px] font-semibold text-sidebar-primary-foreground transition-colors hover:bg-sidebar-primary"
            >
              {summary.linkLabel}
            </Link>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "m-3 flex items-center justify-center gap-2 rounded-lg border border-[color:color-mix(in_oklch,var(--sidebar-border)_70%,transparent)] py-2 text-[11px] font-semibold text-[color:color-mix(in_oklch,var(--sidebar-foreground)_70%,transparent)] transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        {!collapsed ? "Collapse" : null}
      </button>
    </aside>
  );
}
