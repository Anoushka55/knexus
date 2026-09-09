import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AssessmentProvider } from "@/components/test/AssessmentContext";
import { Stepper } from "@/components/test/Stepper";

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssessmentProvider>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 pt-4">
            <Breadcrumb
              crumbs={[{ label: "Marketplace", href: "/" }, { label: "Process Assessment" }]}
            />
          </div>
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <Stepper />
          </div>
        </div>
        {children}
      </main>
      <Footer />
    </AssessmentProvider>
  );
}
