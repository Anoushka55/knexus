import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            K-Nexus<span className="text-brand-blue">.AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-7">
          <Link
            href="/solutions/tech-transformation"
            className="text-sm font-semibold text-slate-600 hover:text-brand-blue transition-colors"
          >
            Solutions
          </Link>
          <Link
            href="/capability-map"
            className="text-sm font-semibold text-slate-600 hover:text-brand-blue transition-colors"
          >
            Capability Map
          </Link>
          <Link
            href="/tmt-ontology"
            className="text-sm font-semibold text-slate-600 hover:text-brand-blue transition-colors"
          >
            TMT Ontology
          </Link>
          <Link
            href="/ai-stack"
            className="text-sm font-semibold text-slate-600 hover:text-brand-blue transition-colors"
          >
            AI Stack
          </Link>
          <Link
            href="/test"
            className="text-sm font-semibold text-slate-600 hover:text-brand-blue transition-colors"
          >
            Test
          </Link>

          {/* <button className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark transition-colors shadow-sm">
            Login
          </button> */}
        </nav>
      </div>
    </header>
  );
}
