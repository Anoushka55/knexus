import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * The prev/next pair that closes every step. Hand-written eight times across
 * the two older assessments; extracted here so the hub has one of them.
 */
export function StepFooter({
  back,
  next,
}: {
  back?: { href: string; label: string };
  next?: { href: string; label: string; onClick?: () => void };
}) {
  return (
    <div
      className={`mt-12 flex border-t border-slate-200 pt-6 print:hidden ${
        back ? "justify-between" : "justify-end"
      }`}
    >
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          {back.label}
        </Link>
      )}
      {next && (
        <Link
          href={next.href}
          onClick={next.onClick}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
        >
          {next.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
