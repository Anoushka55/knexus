import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SolutionSubNav } from "@/components/solutions/SolutionSubNav";
import { DetailHero } from "@/components/solutions/DetailHero";
import { FeatureRow } from "@/components/solutions/FeatureRow";
import { CapabilityAccordion } from "@/components/solutions/CapabilityAccordion";
import { OutcomesGrid } from "@/components/solutions/OutcomesGrid";
import { PlayCardCarousel } from "@/components/solutions/PlayCardCarousel";
import { CtaBand } from "@/components/solutions/CtaBand";
import { Reveal } from "@/components/solutions/Reveal";
import { solutions } from "@/data/tmtSolutions";

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return solutions.map((s) => ({ id: s.id }));
}

export default async function SolutionDetailPage({ params }: Props) {
  const { id } = await params;
  const solution = solutions.find((s) => s.id === id);
  if (!solution) notFound();

  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
            <Link
              href="/solutions"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-blue transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              <ChevronLeft className="h-4 w-4" />
              See all solutions
            </Link>
          </div>
        </div>

        <SolutionSubNav solution={solution} />

        <section id="about" className="scroll-mt-32 bg-white">
          <DetailHero solution={solution} />
          <FeatureRow solution={solution} />
        </section>

        <section id="what-you-can-do" className="scroll-mt-32 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
            <Reveal className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                What you can do
              </h2>
            </Reveal>
            <CapabilityAccordion items={solution.canDo} />
          </div>
        </section>

        <section id="what-youll-achieve" className="scroll-mt-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
            <Reveal className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                What you&rsquo;ll achieve
              </h2>
            </Reveal>
            <OutcomesGrid items={solution.willAchieve} />
          </div>
        </section>

        <section id="whats-trending" className="scroll-mt-32 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
            <Reveal className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                What&rsquo;s trending
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <PlayCardCarousel plays={solution.plays} solutionId={solution.id} />
            </Reveal>
          </div>
        </section>

        <Reveal>
          <CtaBand
            heading={`Ready to move on ${solution.eyebrow.toLowerCase()}?`}
            body="Talk to us about bringing this pillar into your transformation program — or explore the agents already built to support it."
          />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
