import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { ApplicationsSection } from "@/components/landing/ApplicationsSection";
import { FunctionSection } from "@/components/landing/FunctionSection";
import { ForgeCtaBanner } from "@/components/landing/ForgeCtaBanner";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ denied?: string }>;
}) {
  const user = await getSessionUser();
  const isRestricted = user?.role === "restricted";
  const resolvedSearchParams = await searchParams;

  return (
    <>
      <Header />
      <main>
        {resolvedSearchParams?.denied === "forge" && (
          <div className="mx-auto max-w-7xl px-6 pt-4">
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Agent Forge isn&apos;t available on this account.
            </div>
          </div>
        )}
        <HeroSection />
        <ApplicationsSection />
        <FunctionSection />
        {!isRestricted && <ForgeCtaBanner />}
        <IntegrationsSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
