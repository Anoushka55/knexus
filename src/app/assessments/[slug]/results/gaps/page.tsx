"use client";

import { ResultsHeader } from "@/components/assessments/ResultsHeader";
import { GapAnalysis } from "@/components/assessments/results/GapAnalysis";
import { StepFooter } from "@/components/assessments/StepFooter";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";

export default function GapsPage() {
  const { definition } = useAssessmentRun();
  return (
    <div>
      <ResultsHeader
        eyebrow="Gap analysis"
        title="What is furthest from target"
        lede="Ranked by total rungs to climb across both scales, with the strategic priorities each gap holds back."
      />
      <GapAnalysis />
      <StepFooter
        back={{ href: `/assessments/${definition.slug}/results/capabilities`, label: "Capability view" }}
        next={{ href: `/assessments/${definition.slug}/results/recommendations`, label: "Recommendations" }}
      />
    </div>
  );
}
