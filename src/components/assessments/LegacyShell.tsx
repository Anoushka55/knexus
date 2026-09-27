"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AssessmentSidebar } from "./AssessmentSidebar";
import type { AssessmentStep } from "@/lib/assessments/navigation";

/**
 * The frame for the two assessments that predate the maturity engine.
 *
 * They keep their own providers and their own scoring — those capture models
 * are genuinely different and forcing them through one abstraction would cost
 * more than it saves — but they share this chrome, so the hub has one
 * navigation idiom rather than three.
 */
export function LegacyShell({
  title,
  steps,
  children,
}: {
  title: string;
  steps: AssessmentStep[];
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <Breadcrumb
            crumbs={[
              { label: "Marketplace", href: "/" },
              { label: "Assessments", href: "/assessments" },
              { label: title },
            ]}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          <aside className="mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              {/* Every step is reachable: these flows pre-fill their own
                  positions, so a visitor landing deep still sees a real page. */}
              <AssessmentSidebar
                title={title}
                steps={steps}
                unlockedIndex={steps.length - 1}
              />
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </>
  );
}
