import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * The results cockpit caps this `main` and hides the footer through the
 * [data-cockpit] rules in globals.css rather than from here. Driving it from
 * CSS keeps it deterministic: this layout is an ancestor of a statically
 * generated route, so a client-side pathname check here renders the wrong
 * branch into the prerendered HTML and only corrects on hydration.
 */
export default function AssessmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">{children}</main>
      <Footer />
    </>
  );
}
