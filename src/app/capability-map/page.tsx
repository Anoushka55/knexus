import Link from "next/link";
import { ArrowRight, Layers, Users, Building2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { MetricsRow } from "@/components/solutions/MetricsRow";
import { CapabilityMap } from "@/components/capability-map/CapabilityMap";
import { solutionMetrics, solutionMetricsSource } from "@/data/tmtSolutions";

export default function CapabilityMapPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Breadcrumb
              crumbs={[{ label: "Marketplace", href: "/" }, { label: "Capability Map" }]}
            />
          </div>
        </div>

        <section className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-4">
                TMT &middot; Capability Map
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4">
                Capability Map
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Hover any node to see everything it connects to across priorities, challenges,
                pillars, solutions and proof points — click to lock.
              </p>
            </div>
          </div>
        </section>

        <MetricsRow metrics={solutionMetrics} source={solutionMetricsSource} />

        <section className="max-w-7xl mx-auto px-6 pt-16 sm:pt-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/capability-map/ai-architecture"
              className="group flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:border-brand-blue hover:shadow-card-hover transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
                  <Layers className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-bold text-slate-900">AI Architecture Accelerator</p>
                  <p className="mt-1 text-sm text-slate-500 leading-snug">
                    Vendor-agnostic architecture, mapped by layer.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-slate-300 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/capability-map/personas"
              className="group flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:border-brand-blue hover:shadow-card-hover transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-bold text-slate-900">Persona Capability Map</p>
                  <p className="mt-1 text-sm text-slate-500 leading-snug">
                    Roles, mapped by day, month and year.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-slate-300 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/capability-map/smb-assessment"
              className="group flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:border-brand-blue hover:shadow-card-hover transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-bold text-slate-900">SMB Assessment</p>
                  <p className="mt-1 text-sm text-slate-500 leading-snug">
                    Outcome-first pains, mapped to a recommended bundle.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-slate-300 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
          <CapabilityMap />
        </section>
      </main>
      <Footer />
    </>
  );
}
