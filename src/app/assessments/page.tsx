import Link from "next/link";
import {
  ArrowRight,
  Clapperboard,
  Clock,
  Compass,
  Cpu,
  Radar,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ALL_ASSESSMENTS } from "@/data/assessments/registry";
import type { AssessmentDefinition } from "@/lib/assessments/types";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Assessments — K-Nexus.AI",
  description:
    "Capability maturity assessments for TMT: score where you stand, and see which agents close the gap.",
};

const ICONS: Record<string, ComponentType<LucideProps>> = {
  Radar,
  Receipt,
  ShieldCheck,
  Clapperboard,
  Compass,
  Cpu,
};

export default function AssessmentsHubPage() {
  const live = ALL_ASSESSMENTS.filter((a) => a.status === "live");
  const legacy = ALL_ASSESSMENTS.filter((a) => a.status === "legacy");
  const soon = ALL_ASSESSMENTS.filter((a) => a.status === "coming-soon");

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <Breadcrumb crumbs={[{ label: "Marketplace", href: "/" }, { label: "Assessments" }]} />
        </div>
      </div>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
            Assess
          </p>
          <h1 className="mb-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Find out where you stand — and which agents close the gap.
          </h1>
          <p className="max-w-2xl leading-relaxed text-slate-600">
            Each assessment scores your capabilities against a starting position drawn from
            portfolio experience, then maps the largest gaps onto specific agents in the
            catalogue. Every answer is pre-filled so the session is spent correcting a view
            rather than filling in a form.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-5 text-lg font-bold tracking-tight text-slate-900">
          Capability maturity
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {live.map((a) => (
            <AssessmentCard key={a.slug} assessment={a} />
          ))}
        </div>

        {legacy.length > 0 && (
          <>
            <h2 className="mb-5 mt-14 text-lg font-bold tracking-tight text-slate-900">
              Process &amp; service assessments
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {legacy.map((a) => (
                <AssessmentCard key={a.slug} assessment={a} />
              ))}
            </div>
          </>
        )}

        {soon.length > 0 && (
          <>
            <h2 className="mb-5 mt-14 text-lg font-bold tracking-tight text-slate-900">
              In development
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {soon.map((a) => (
                <AssessmentCard key={a.slug} assessment={a} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

function AssessmentCard({ assessment }: { assessment: AssessmentDefinition }) {
  const Icon = ICONS[assessment.iconName] ?? Radar;
  const available = assessment.status !== "coming-soon";
  const href = assessment.href ?? `/assessments/${assessment.slug}`;

  const body = (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <span
          className={cn(
            "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl",
            available ? "bg-brand-soft text-brand-blue" : "bg-slate-100 text-slate-400",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider",
            available ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-400",
          )}
        >
          {assessment.kicker}
        </span>
      </div>

      <h3
        className={cn(
          "mb-2 text-base font-bold tracking-tight",
          available ? "text-slate-900" : "text-slate-500",
        )}
      >
        {assessment.title}
      </h3>
      <p className="mb-5 text-sm leading-relaxed text-slate-500">{assessment.summary}</p>

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          {assessment.estimateMinutes} min
          {assessment.capabilities.length > 0 && ` · ${assessment.capabilities.length} capabilities`}
        </span>
        {available ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue">
            Start <ArrowRight className="h-4 w-4" />
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-400">Coming soon</span>
        )}
      </div>
    </>
  );

  const shell =
    "rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-all";

  if (!available) {
    return <div className={cn(shell, "opacity-70")}>{body}</div>;
  }

  return (
    <Link href={href} className={cn(shell, "block hover:border-brand-blue/40 hover:shadow-card-hover")}>
      {body}
    </Link>
  );
}
