"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { href: "/capability-map/smb-assessment", label: "Context" },
  { href: "/capability-map/smb-assessment/baseline", label: "Baseline" },
  { href: "/capability-map/smb-assessment/scorecard", label: "Scorecard" },
  { href: "/capability-map/smb-assessment/roadmap", label: "Roadmap" },
];

export function SmbStepper() {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.href === pathname)
  );

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;

        return (
          <span key={step.href} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && <span className="h-px w-6 bg-slate-200" />}
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                active && "bg-brand-blue text-white",
                done && "text-brand-blue hover:bg-brand-soft",
                !active && !done && "text-slate-400 hover:text-slate-600"
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                  active && "bg-white/20 text-white",
                  done && "bg-brand-soft text-brand-blue",
                  !active && !done && "bg-slate-100 text-slate-400"
                )}
              >
                {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </span>
              {step.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
