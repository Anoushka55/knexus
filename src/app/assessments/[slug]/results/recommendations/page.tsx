"use client";

import { ResultsHeader } from "@/components/assessments/ResultsHeader";
import { Recommendations } from "@/components/assessments/results/Recommendations";
import { StepFooter } from "@/components/assessments/StepFooter";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";

export default function RecommendationsPage() {
  const { definition } = useAssessmentRun();
  return (
    <div>
      <ResultsHeader
        eyebrow="Recommendations"
        title="The agents that close the gap"
        lede="Each gap matched against the catalogue, with how far the agent actually carries it — and an honest list of what nothing covers yet."
      />
      <Recommendations />
      <StepFooter
        back={{ href: `/assessments/${definition.slug}/results/gaps`, label: "Gap analysis" }}
        next={{ href: `/assessments/${definition.slug}/results/roadmap`, label: "Roadmap" }}
      />
    </div>
  );
}
