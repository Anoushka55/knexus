"use client";

import { MotionConfig } from "framer-motion";
import { Printer } from "lucide-react";
import { ResultsHeader } from "@/components/assessments/ResultsHeader";
import { ExecutiveSummary } from "@/components/assessments/results/ExecutiveSummary";
import { GapAnalysis } from "@/components/assessments/results/GapAnalysis";
import { Recommendations } from "@/components/assessments/results/Recommendations";
import { Roadmap } from "@/components/assessments/results/Roadmap";
import { StepFooter } from "@/components/assessments/StepFooter";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";

/**
 * The whole result as one document.
 *
 * A route rather than a tab, because it composes every section at once with
 * motion disabled and print styles applied — as a tab it would have to
 * duplicate the section tree instead of reusing it. There is no PDF library in
 * this project, so the export is the browser's own Save as PDF over
 * print-specific CSS in globals.css.
 */
export default function ReportPage() {
  const { definition } = useAssessmentRun();

  return (
    // Entrance animations would otherwise capture mid-fade in the printed page.
    <MotionConfig reducedMotion="always">
      <div className="assessment-report">
        <div className="mb-6 flex justify-end print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
          >
            <Printer className="h-4 w-4" />
            Print or save as PDF
          </button>
        </div>

        <ResultsHeader
          eyebrow="Assessment report"
          title={definition.title}
          lede="The complete result: scores, gaps, recommended agents and the sequenced roadmap."
        />

        <div className="space-y-10">
          <ExecutiveSummary />

          <ReportSection title="Gap analysis">
            <GapAnalysis />
          </ReportSection>

          <ReportSection title="Recommendations">
            <Recommendations />
          </ReportSection>

          <ReportSection title="Roadmap">
            <Roadmap />
          </ReportSection>
        </div>

        <StepFooter
          back={{ href: `/assessments/${definition.slug}/results/roadmap`, label: "Back to roadmap" }}
        />
      </div>
    </MotionConfig>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print:break-before-page">
      <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
