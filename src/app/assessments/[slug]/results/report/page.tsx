"use client";

import { MotionConfig } from "framer-motion";
import { Printer } from "lucide-react";
import { ResultsHeader } from "@/components/assessments/ResultsHeader";
import { ResultsDashboard } from "@/components/assessments/results/ResultsDashboard";
import { CapabilityDetail } from "@/components/assessments/results/CapabilityDetail";
import { GapAnalysis } from "@/components/assessments/results/GapAnalysis";
import { Recommendations } from "@/components/assessments/results/Recommendations";
import { Roadmap } from "@/components/assessments/results/Roadmap";
import { StepFooter } from "@/components/assessments/StepFooter";
import { useAssessmentRun } from "@/components/assessments/AssessmentRunContext";

/**
 * The long form.
 *
 * The dashboard at /results is the one-screen answer; everything that would
 * have made it scroll lives here instead — every capability, every gap with
 * both scales, the full recommendation list and the sequenced roadmap.
 *
 * There is no PDF library in this project, so the export is the browser's own
 * Save as PDF over the print rules in globals.css.
 */
export default function ReportPage() {
  const { definition } = useAssessmentRun();

  return (
    // Entrance animations would otherwise be captured mid-fade when printing.
    <MotionConfig reducedMotion="always">
      <div className="assessment-report">
        <div className="mb-5 flex justify-end print:hidden">
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
          lede="The complete result: scores, every capability, the full gap analysis, recommended agents and the sequenced roadmap."
        />

        <ResultsDashboard />

        <div className="mt-10 space-y-10">
          <ReportSection title="Every capability">
            <CapabilityDetail />
          </ReportSection>

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
          back={{ href: `/assessments/${definition.slug}/results`, label: "Back to results" }}
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
