import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AssessmentProvider } from "@/components/assessments/p2p/AssessmentContext";
import { LegacyShell } from "@/components/assessments/LegacyShell";

const BASE = "/assessments/procure-to-pay-automation";

const STEPS = [
  { href: BASE, label: "Context" },
  { href: `${BASE}/assessment`, label: "Baseline" },
  { href: `${BASE}/results`, label: "Scorecard" },
  { href: `${BASE}/results/roadmap`, label: "Roadmap" },
];

export default function ProcureToPayLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssessmentProvider>
      <Header />
      <main className="min-h-screen bg-white">
        <LegacyShell title="Procure-to-Pay Automation Assessment" steps={STEPS}>
          {children}
        </LegacyShell>
      </main>
      <Footer />
    </AssessmentProvider>
  );
}
