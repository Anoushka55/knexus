"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActive, type NavItem } from "@/components/layout/navigation";

/**
 * One top-level nav entry. Opens on hover, but is equally usable from the
 * keyboard: the trigger is a real button that toggles on click, Escape closes,
 * and moving focus out of the menu closes it too.
 */
export function NavMenu({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  const active = isActive(pathname, item.href);

  // Any navigation should leave the menu closed behind it.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function openNow() {
    cancelClose();
    setOpen(true);
  }

  /** Small grace period so the pointer can cross the gap to the panel. */
  function closeSoon() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  if (!item.groups) {
    return (
      <Link
        href={item.href}
        className={cn(
          "px-1 py-2 text-sm font-semibold transition-colors",
          active ? "text-brand-blue" : "text-slate-600 hover:text-brand-blue",
        )}
      >
        {item.label}
      </Link>
    );
  }

  const columns = item.groups.length;

  return (
    <div
      ref={wrapper}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onBlur={(event) => {
        if (!wrapper.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1 px-1 py-2 text-sm font-semibold transition-colors",
          active || open ? "text-brand-blue" : "text-slate-600 hover:text-brand-blue",
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Bridges the gap between trigger and panel so hover doesn't drop out. */}
      <div
        className={cn(
          "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3",
          !open && "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-4",
            // Tinted glass rather than flat white, so the panel picks up the
            // page behind it instead of sitting on top as a plain card.
            "border border-white/70 bg-gradient-to-b from-white/85 via-white/80 to-indigo-50/85",
            "backdrop-blur-xl backdrop-saturate-150",
            "shadow-xl shadow-indigo-950/10 ring-1 ring-indigo-900/5",
            "origin-top transition duration-150",
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-[0.98] opacity-0",
          )}
          style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(10rem, max-content))` }}
        >
          {/* Catches the light along the top edge, the way glass does. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
          />

          {item.groups.map((group, index) => (
            <div
              key={group.label ?? index}
              className={cn("px-3", index > 0 && "border-l border-indigo-200/50")}
            >
              {group.label && (
                <p className="mb-2 px-2 text-[0.68rem] font-bold uppercase tracking-wider text-indigo-400/90">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      tabIndex={open ? undefined : -1}
                      className={cn(
                        "block whitespace-nowrap rounded-lg px-2 py-1.5 text-sm transition-all",
                        isActive(pathname, link.href)
                          ? "bg-white/90 font-semibold text-brand-blue shadow-sm ring-1 ring-indigo-900/5"
                          : "font-medium text-slate-600 hover:bg-white/80 hover:text-brand-blue hover:shadow-sm",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
