import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CtaBand } from "@/components/solutions/CtaBand";
import { Reveal } from "@/components/solutions/Reveal";
import { solutionIconMap } from "@/components/solutions/icon-map";
import { solutions } from "@/data/tmtSolutions";

interface Props {
  params: Promise<{ id: string; playId: string }>;
}

export function generateStaticParams() {
  return solutions.flatMap((solution) =>
    solution.plays.map((play) => ({ id: solution.id, playId: play.id }))
  );
}

export default async function PlayDetailPage({ params }: Props) {
  const { id, playId } = await params;
  const solution = solutions.find((s) => s.id === id);
  const play = solution?.plays.find((p) => p.id === playId);
  if (!solution || !play) notFound();

  const Icon = solutionIconMap[solution.iconName];

  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
            <Breadcrumb
              crumbs={[
                { label: "Home", href: "/" },
                { label: "Solutions", href: "/solutions" },
                { label: solution.title, href: `/solutions/${solution.id}` },
                { label: play.title },
              ]}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 items-start">
            <Reveal className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-violet mb-4">
                {play.kicker}
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-5">
                {play.title}
              </h1>
              <p className="italic text-lg text-slate-600 mb-5">{play.blurb}</p>
              <p className="text-base text-slate-600 leading-relaxed">{play.body}</p>
            </Reveal>

            <Reveal delay={0.1}>
              <Link
                href={`/solutions/${solution.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft mb-4">
                  {Icon && <Icon className="h-6 w-6 text-brand-blue" />}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-2">Part of</p>
                <p className="text-base font-bold text-slate-900 leading-snug mb-1">{solution.title}</p>
                <p className="text-sm text-slate-500">Back to the full pillar &rarr;</p>
              </Link>
            </Reveal>
          </div>
        </div>

        <Reveal>
          <CtaBand
            heading="Want this play tailored to your program?"
            body="Talk to us about bringing this into your transformation roadmap — or explore the full pillar it belongs to."
          />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
