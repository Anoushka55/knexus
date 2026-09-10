import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ArchitectureAccelerator } from "@/components/architecture/ArchitectureAccelerator";

export default function AIArchitectureAcceleratorPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Breadcrumb
              crumbs={[
                { label: "Marketplace", href: "/" },
                { label: "Capability Map", href: "/capability-map" },
                { label: "AI Architecture Accelerator" },
              ]}
            />
          </div>
        </div>

        <section className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-4">
                AI Architecture Accelerator
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4">
                Vendor-agnostic architecture, mapped by layer
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Pick a transformation scenario, walk each layer of the stack, and see how a
                Microsoft-native, SAP-anchored, or hybrid approach answers the same challenge —
                hover any node to trace it, click to lock.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
          <ArchitectureAccelerator />
        </section>
      </main>
      <Footer />
    </>
  );
}
