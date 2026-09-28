"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AssessmentSidebar } from "./AssessmentSidebar";
import { useAssessmentRun } from "./AssessmentRunContext";
import { stepsFor } from "@/lib/assessments/navigation";

const COLLAPSE_KEY = "assessment.sidebar.collapsed";

/**
 * The frame every step renders inside, in two modes.
 *
 * Steps 1 and 2 are ordinary documents that scroll. The results cockpit is not:
 * it has to resolve inside one viewport, so it runs full-height with its own
 * overflow hidden, drops the breadcrumb band, and starts with the navigation
 * collapsed to a 64px rail. The preference is remembered either way.
 */
export function AssessmentShell({ children }: { children: React.ReactNode }) {
  const { definition, isComplete } = useAssessmentRun();
  const pathname = usePathname();
  const steps = stepsFor(definition);

  const onResults = pathname.endsWith("/results");
  const onReport = pathname.includes("/results/report");
  const cockpit = onResults && !onReport;

  // Collapsed by default in the cockpit, expanded elsewhere, until the visitor
  // says otherwise — at which point their choice wins on every step.
  const [collapsed, setCollapsed] = useState(cockpit);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_KEY);
      if (saved !== null) {
        setCollapsed(saved === "1");
        setRestored(true);
      }
    } catch {
      /* storage blocked — the default stands */
    }
  }, []);

  useEffect(() => {
    if (!restored) setCollapsed(cockpit);
  }, [cockpit, restored]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* storage blocked — the toggle still works for this session */
      }
      setRestored(true);
      return next;
    });
  }

  const sidebar = (
    <AssessmentSidebar
      title={definition.title}
      steps={steps}
      unlockedIndex={isComplete || pathname.includes("/results") ? 2 : 1}
      collapsed={collapsed}
      onToggle={toggle}
    />
  );

  if (cockpit) {
    return (
      // AssessmentsChrome already caps main to the viewport minus the header,
      // so the shell just fills it.
      <div className="flex h-full overflow-hidden">
        <aside className="hidden flex-shrink-0 lg:block" style={{ width: collapsed ? 64 : 240 }}>
          <div className="h-full overflow-y-auto">{sidebar}</div>
        </aside>
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <Breadcrumb
            crumbs={[
              { label: "Marketplace", href: "/" },
              { label: "Assessments", href: "/assessments" },
              { label: definition.title },
            ]}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div
          className="lg:grid lg:gap-10"
          style={{ gridTemplateColumns: `${collapsed ? "4rem" : "15rem"} minmax(0,1fr)` }}
        >
          <aside className="mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-24">{sidebar}</div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </>
  );
}
