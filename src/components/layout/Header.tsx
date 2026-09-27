"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavMenu } from "@/components/layout/NavMenu";
import { NAV_ITEMS, isActive } from "@/components/layout/navigation";
import { useIsRestricted } from "@/components/providers/SessionProvider";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Agent Forge is blocked for restricted accounts by middleware, so there is
  // no point advertising it to them.
  const restricted = useIsRestricted();

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex flex-shrink-0 items-center">
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            K-Nexus<span className="text-brand-blue">.AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavMenu key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search agents"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-blue"
          >
            <Search className="h-4 w-4" />
          </Link>

          {!restricted && (
            <Link
              href="/forge"
              className="hidden items-center gap-1.5 rounded-lg bg-brand-blue px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue-dark sm:inline-flex"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Agent Forge
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[70vh] overflow-y-auto border-t border-indigo-100 bg-gradient-to-b from-white to-indigo-50/70 px-6 py-4 backdrop-blur-xl lg:hidden">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="border-b border-slate-100 py-3 last:border-0">
              <Link
                href={item.href}
                className={cn(
                  "block text-sm font-bold",
                  isActive(pathname, item.href) ? "text-brand-blue" : "text-slate-900",
                )}
              >
                {item.label}
              </Link>

              {item.groups?.map((group, index) => (
                <div key={group.label ?? index} className="mt-2">
                  {group.label && (
                    <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                      {group.label}
                    </p>
                  )}
                  <ul className="space-y-1">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={cn(
                            "block py-1 text-sm",
                            isActive(pathname, link.href)
                              ? "font-semibold text-brand-blue"
                              : "text-slate-600",
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
          ))}

          {!restricted && (
            <Link
              href="/forge"
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white sm:hidden"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Agent Forge
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
