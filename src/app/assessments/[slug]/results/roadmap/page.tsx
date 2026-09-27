"use client";

import { ResultsHeader } from "@/components/assessments/ResultsHeader";
import { Roadmap } from "@/components/assessments/results/Roadmap";
import { StepFooter } from "@/components/assessments/StepFooter";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";

export default function RoadmapPage() {
  const { definition } = useAssessmentRun();
  return (
    <div>
      <ResultsHeader
        eyebrow="Roadmap"
        title="What to do, in what order"
        lede="Three waves sequenced on the result itself — widest gaps with an agent already available first, then the rest, then what has to be built."
      />
      <Roadmap />
      <StepFooter
        back={{ href: `/assessments/${definition.slug}/results/recommendations`, label: "Recommendations" }}
        next={{ href: `/assessments/${definition.slug}/results/report`, label: "Download report" }}
      />
    </div>
  );
}
