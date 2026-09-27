import { SearchBar } from "@/components/ui/SearchBar";
import { HeroNetwork } from "@/components/landing/HeroNetwork";
import { HeroWaves } from "@/components/landing/HeroWaves";

export function HeroSection() {
  return (
    <section className="hero-gradient relative overflow-hidden px-6 pt-24 pb-32">
      <HeroNetwork />
      <HeroWaves />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="animate-fade-in inline-flex items-center gap-2 mb-6 rounded-full border border-indigo-100 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-brand-blue shadow-sm backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-blue" />
          </span>
          Ontology-driven agent marketplace
        </div>

        <h1
          className="animate-fade-in text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.08] mb-5 tracking-tight"
          style={{ animationDelay: "60ms" }}
        >
          The right agent doesn&apos;t just automate{" "}
          <span className="text-brand-blue">— it elevates.</span>
        </h1>

        <p
          className="animate-fade-in text-slate-500 text-sm sm:text-[0.95rem] leading-relaxed mb-9 max-w-2xl mx-auto"
          style={{ animationDelay: "120ms" }}
        >
          KPMG&rsquo;s enterprise AI playbook platform for TMT — AI solutions, demos, credentials,
          accelerators and reusable assets in one knowledge ecosystem, powered by an
          ontology-driven knowledge graph connecting capabilities, use cases, data, industry
          expertise and AI agents for intelligent discovery, recommendations and orchestration.
        </p>

        <div className="animate-fade-in" style={{ animationDelay: "180ms" }}>
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
