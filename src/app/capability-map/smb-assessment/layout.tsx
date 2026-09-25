import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SmbAssessmentProvider } from "@/components/smb/SmbAssessmentContext";
import { SmbStepper } from "@/components/smb/SmbStepper";

export default function SmbAssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmbAssessmentProvider>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 pt-4">
            <Breadcrumb
              crumbs={[
                { label: "Marketplace", href: "/" },
                { label: "Capability Map", href: "/capability-map" },
                { label: "SMB Assessment" },
              ]}
            />
          </div>
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <SmbStepper />
          </div>
        </div>
        {children}
      </main>
      <Footer />
    </SmbAssessmentProvider>
  );
}
