"use client";

import { ResultsHeader } from "@/components/assessments/ResultsHeader";
import { ExecutiveSummary } from "@/components/assessments/results/ExecutiveSummary";
import { StepFooter } from "@/components/assessments/StepFooter";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";

export default function ResultsPage() {
  const { definition } = useAssessmentRun();
  return (
    <div>
      <ResultsHeader
        eyebrow="Assessment results"
        title={definition.title}
        lede="A consolidated view of current maturity, the strengths worth building on, the gaps that matter most, and the agents that close them."
      />
      <ExecutiveSummary />
      <StepFooter
        back={{ href: `/assessments/${definition.slug}/assessment`, label: "Back to assessment" }}
        next={{ href: `/assessments/${definition.slug}/results/capabilities`, label: "Capability view" }}
      />
    </div>
  );
}
