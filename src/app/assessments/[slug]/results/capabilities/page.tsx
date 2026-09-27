"use client";

import { Suspense } from "react";
import { ResultsHeader } from "@/components/assessments/ResultsHeader";
import { CapabilityView } from "@/components/assessments/results/CapabilityView";
import { StepFooter } from "@/components/assessments/StepFooter";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";

export default function CapabilitiesPage() {
  const { definition } = useAssessmentRun();
  return (
    <div>
      <ResultsHeader
        eyebrow="Capability view"
        title="Where the maturity sits"
        lede="Both scales by group, and every capability shaded to the level it reached. Filter to one group to drill in."
      />
      {/* useSearchParams needs a boundary, per the pattern in src/app/search/page.tsx. */}
      <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
        <CapabilityView />
      </Suspense>
      <StepFooter
        back={{ href: `/assessments/${definition.slug}/results`, label: "Executive summary" }}
        next={{ href: `/assessments/${definition.slug}/results/gaps`, label: "Gap analysis" }}
      />
    </div>
  );
}
