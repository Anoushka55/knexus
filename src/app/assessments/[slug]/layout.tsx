import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AssessmentRunProvider } from "@/components/assessments/AssessmentRunContext";
import { AssessmentShell } from "@/components/assessments/AssessmentShell";
import { assessmentSlugs, getAssessment } from "@/data/assessments/registry";

export function generateStaticParams() {
  return assessmentSlugs().map((slug) => ({ slug }));
}

/**
 * The provider is mounted here, above every step, which is what makes a run
 * survive the whole flow and lets navigating between the six results views
 * reuse the already-computed outcome.
 */
export default function AssessmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const definition = getAssessment(params.slug);
  if (!definition) notFound();

  return (
    <AssessmentRunProvider definition={definition}>
      <div className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <Breadcrumb
            crumbs={[
              { label: "Marketplace", href: "/" },
              { label: "Assessments", href: "/assessments" },
              { label: definition.title },
            ]}
          />
        </div>
      </div>
      <AssessmentShell>{children}</AssessmentShell>
    </AssessmentRunProvider>
  );
}
