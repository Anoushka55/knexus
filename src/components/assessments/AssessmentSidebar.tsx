"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  LayoutDashboard,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { activeStepIndex, type AssessmentStep } from "@/lib/assessments/navigation";

/**
 * The stepped side navigation, in two widths.
 *
 * Expanded it is a labelled step list. Collapsed it is a 64px icon rail, which
 * is what the results cockpit runs in — that page has to fit a single viewport,
 * and 240px of navigation is the cheapest horizontal space to reclaim.
 *
 * Steps ahead of the furthest reached are shown but not linked: deep-linking to
 * Results with nothing answered would render a scorecard of pure benchmark,
 * which reads as a result when it is only a starting position.
 */

const STEP_ICONS: ComponentType<LucideProps>[] = [
  SlidersHorizontal,
  ClipboardList,
  LayoutDashboard,
];

export function AssessmentSidebar({
  title,
  steps,
  unlockedIndex,
  collapsed = false,
  onToggle,
}: {
  title: string;
  steps: AssessmentStep[];
  unlockedIndex: number;
  collapsed?: boolean;
  /** Omit to render without a toggle, as the legacy assessments do. */
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const active = activeStepIndex(steps, pathname);

  if (collapsed) {
    return (
      <nav
        aria-label="Assessment steps"
        className="flex h-full flex-col items-center gap-1 border-r border-slate-200 bg-white py-3 print:hidden"
      >
        <Link
          href="/assessments"
          title="Back to Assessments"
          aria-label="Back to Assessments"
          className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-blue"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? LayoutDashboard;
          const isActive = index === active;
          const isLocked = index > unlockedIndex;

          if (isLocked) {
            return (
              <span
                key={step.href}
                title={`${step.label} — not yet available`}
                aria-disabled="true"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-200"
              >
                <Lock className="h-3.5 w-3.5" />
              </span>
            );
          }

          return (
            <Link
              key={step.href}
              href={step.href}
              title={step.label}
              aria-label={step.label}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-brand-soft text-brand-blue"
                  : "text-slate-400 hover:bg-slate-100 hover:text-brand-blue",
              )}
            >
              <Icon className="h-4 w-4" />
            </Link>
          );
        })}

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            title="Expand navigation"
            aria-label="Expand navigation"
            aria-expanded={false}
            className="mt-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-blue"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </nav>
    );
  }

  return (
    <nav aria-label="Assessment steps" className="print:hidden">
      <div className="mb-5 flex items-start justify-between gap-2">
        <Link
          href="/assessments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-blue"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Assessments
        </Link>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            title="Collapse navigation"
            aria-label="Collapse navigation"
            aria-expanded
            className="-mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-blue"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

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
