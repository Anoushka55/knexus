"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeStepIndex, type AssessmentStep } from "@/lib/assessments/navigation";

/**
 * The stepped side navigation.
 *
 * Replaces the horizontal Stepper the two older assessments used, because
 * Results has six sub-views and a horizontal bar cannot nest. Steps ahead of
 * the furthest reached are shown but not linked — deep-linking to Results with
 * nothing answered would render a scorecard of pure benchmark, which reads as
 * a result when it is only a starting position.
 */
export function AssessmentSidebar({
  title,
  steps,
  unlockedIndex,
}: {
  title: string;
  steps: AssessmentStep[];
  /** Highest step index the run has earned. */
  unlockedIndex: number;
}) {
  const pathname = usePathname();
  const active = activeStepIndex(steps, pathname);

  return (
    <nav aria-label="Assessment steps" className="print:hidden">
      <Link
        href="/assessments"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-blue"
      >
        ← Back to Assessments
      </Link>

      <p className="mb-5 text-sm font-bold leading-snug text-slate-900">{title}</p>

      <ol className="space-y-1">
        {steps.map((step, index) => {
          const isActive = index === active;
          const isDone = index < active || (index < unlockedIndex && !isActive);
          const isLocked = index > unlockedIndex;

          return (
            <li key={step.href}>
              {isLocked ? (
                <span
                  aria-disabled="true"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300"
                >
                  <Marker state="locked" index={index} />
                  {step.label}
                </span>
              ) : (
                <Link
                  href={step.href}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-brand-soft text-brand-blue"
                      : "text-slate-600 hover:bg-slate-50 hover:text-brand-blue",
                  )}
                >
                  <Marker state={isDone ? "done" : isActive ? "active" : "todo"} index={index} />
                  {step.label}
                </Link>
              )}

              {isActive && step.children && (
                <ul className="mb-2 ml-[1.35rem] mt-1 space-y-0.5 border-l border-slate-200 pl-4">
                  {step.children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          aria-current={childActive ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2 rounded-md py-1.5 pl-2 pr-2 text-[0.82rem] transition-colors",
                            childActive
                              ? "font-semibold text-brand-blue"
                              : "font-medium text-slate-500 hover:text-brand-blue",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                              childActive ? "bg-brand-blue" : "bg-slate-300",
                            )}
                          />
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Marker({
  state,
  index,
}: {
  state: "done" | "active" | "todo" | "locked";
  index: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold",
        state === "done" && "bg-brand-blue text-white",
        state === "active" && "bg-brand-blue text-white",
        state === "todo" && "border border-slate-300 text-slate-500",
        state === "locked" && "border border-slate-200 text-slate-300",
      )}
    >
      {state === "done" ? (
        <Check className="h-3.5 w-3.5" />
      ) : state === "locked" ? (
        <Lock className="h-3 w-3" />
      ) : (
        index + 1
      )}
    </span>
  );
}
