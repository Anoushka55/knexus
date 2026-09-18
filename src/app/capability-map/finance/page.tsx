import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { MetricsRow } from "@/components/solutions/MetricsRow";
import { FinancePersonaMap } from "@/components/finance/FinancePersonaMap";
import { agents, personas, problemStatements, themes } from "@/data/finance/personas";

export default function FinanceCapabilityMapPage() {
  const liveAgentCount = agents.filter((a) => a.status === "live").length;

  const metrics = [
    { value: `${personas.length}`, label: "Finance personas mapped, from Group CFO to Internal Audit." },
    { value: `${problemStatements.length}`, label: "Problem statements captured across Day, Month and Year." },
    { value: `${themes.length}`, label: "Finance capability themes, from Procure-to-Pay to Board Reporting." },
    { value: `${liveAgentCount} / ${agents.length}`, label: "Agents already live today; the rest are on the roadmap." },
  ];

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
                { label: "Finance" },
              ]}
            />
          </div>
        </div>

        <section className="border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue mb-4">
                Finance &middot; Capability Map
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4">
                Finance Personas Capability Map
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Pick a day, month or year lens on the finance function, then hover any node to see
                everything it connects to across personas, problem statements, challenges,
                automation opportunities and agents — click to lock.
              </p>
            </div>
          </div>
        </section>

        <MetricsRow
          metrics={metrics}
          source="Illustrative, informed by common finance operating-model engagement patterns — not any specific client."
        />

        <section className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
          <FinancePersonaMap />
        </section>
      </main>
      <Footer />
    </>
  );
}
