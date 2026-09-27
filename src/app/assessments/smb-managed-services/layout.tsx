import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmbAssessmentProvider } from "@/components/assessments/smb/SmbAssessmentContext";
import { LegacyShell } from "@/components/assessments/LegacyShell";

const BASE = "/assessments/smb-managed-services";

const STEPS = [
  { href: BASE, label: "Context" },
  { href: `${BASE}/assessment`, label: "Baseline" },
  { href: `${BASE}/results`, label: "Scorecard" },
  { href: `${BASE}/results/roadmap`, label: "Roadmap" },
];

export default function SmbManagedServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmbAssessmentProvider>
      <Header />
      <main className="min-h-screen bg-white">
        <LegacyShell title="SMB Managed Services Assessment" steps={STEPS}>
          {children}
        </LegacyShell>
      </main>
      <Footer />
    </SmbAssessmentProvider>
  );
}
