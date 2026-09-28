"use client";

import { ResultsHeader } from "@/components/assessments/ResultsHeader";
import { ResultsDashboard } from "@/components/assessments/results/ResultsDashboard";
import { StepFooter } from "@/components/assessments/StepFooter";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";

export default function ResultsPage() {
  const { definition } = useAssessmentRun();
  return (
    <div>
      <ResultsHeader
        eyebrow="Assessment results"
        title={definition.title}
        showReportLink
      />
      <ResultsDashboard />
      <StepFooter
        back={{ href: `/assessments/${definition.slug}/assessment`, label: "Back to assessment" }}
        next={{ href: `/assessments/${definition.slug}/results/report`, label: "Open the full report" }}
      />
    </div>
  );
}
