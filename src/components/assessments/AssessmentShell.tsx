"use client";

import { usePathname } from "next/navigation";
import { AssessmentSidebar } from "./AssessmentSidebar";
import { useAssessmentRun } from "./AssessmentRunContext";
import { stepsFor } from "@/lib/assessments/navigation";

/**
 * The two-column frame every step renders inside.
 *
 * The sidebar needs the run to know how far the flow has been unlocked, so the
 * shell sits inside the provider rather than in the layout beside it.
 */
export function AssessmentShell({ children }: { children: React.ReactNode }) {
  const { definition, isComplete } = useAssessmentRun();
  const pathname = usePathname();
  const steps = stepsFor(definition);

  // Step 2 is always reachable; Results only once the grid has been confirmed.
  // Reading it from the URL as well means a fresh tab on a results deep-link
  // still renders rather than trapping the visitor behind a lock.
  const onResults = pathname.includes("/results");
  const unlockedIndex = isComplete || onResults ? 2 : 1;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <aside className="mb-8 lg:mb-0">
          <div className="lg:sticky lg:top-24">
            <AssessmentSidebar
              title={definition.title}
              steps={steps}
              unlockedIndex={unlockedIndex}
            />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
