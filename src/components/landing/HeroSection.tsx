import { SearchBar } from "@/components/ui/SearchBar";
import { HeroNetwork } from "@/components/landing/HeroNetwork";
import { HeroWaves } from "@/components/landing/HeroWaves";

export function HeroSection() {
  return (
    <section className="hero-gradient relative overflow-hidden py-28 px-6">
      <HeroNetwork />
      <HeroWaves />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
          The right agent doesn&apos;t just automate{" "}
          <span className="text-brand-blue">— it elevates.</span>
        </h1>

        <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-3xl mx-auto">
          KPMG&rsquo;s enterprise AI playbook platform for TMT — AI solutions, demos, credentials,
          accelerators and reusable assets in one knowledge ecosystem, powered by an
          ontology-driven knowledge graph connecting capabilities, use cases, data, industry
          expertise and AI agents for intelligent discovery, recommendations and orchestration.
        </p>

        <SearchBar />
      </div>
    </section>
  );
}
