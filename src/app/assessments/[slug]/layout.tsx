import { notFound } from "next/navigation";
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
export default async function AssessmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const definition = getAssessment(slug);
  if (!definition) notFound();

  return (
    // The breadcrumb lives inside the shell, which is a client component and so
    // can drop it on the cockpit route where the vertical space is spoken for.
    <AssessmentRunProvider definition={definition}>
      <AssessmentShell>{children}</AssessmentShell>
    </AssessmentRunProvider>
  );
}
