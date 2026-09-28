"use client";

import Link from "next/link";
import { CalendarDays, FileText, Layers, Radio } from "lucide-react";
import { useAssessmentRun } from "./AssessmentRunContext";
import { ShareButton } from "./ShareButton";

/**
 * Title, context chips and actions on one band.
 *
 * Deliberately compact: this sits above the dashboard, and every line it takes
 * is a line of the result pushed below the fold. The lede that used to sit here
 * is gone — the numbers directly underneath say the same thing.
 */
export function ResultsHeader({
  eyebrow,
  title,
  lede,
  showReportLink = false,
}: {
  eyebrow: string;
  title: string;
  /** Only the report uses this; the dashboard leads with its numbers instead. */
  lede?: string;
  showReportLink?: boolean;
}) {
  const { definition, input } = useAssessmentRun();
  const scope = definition.scopes.find((s) => s.id === input.scopeId);

  const completed = input.completedOn
    ? new Date(input.completedOn).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "In progress";

  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-blue">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900">
            {title}
          </h1>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 print:hidden">
          <ShareButton />
          {showReportLink && (
            <Link
              href={`/assessments/${definition.slug}/results/report`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
            >
              <FileText className="h-3.5 w-3.5" />
              Full report
            </Link>
          )}
        </div>
      </div>

      {lede && <p className="mt-3 leading-relaxed text-slate-600">{lede}</p>}

      <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-3">
        <Chip icon={Radio} label="Industry" value={input.industryLabel} />
        <Chip icon={Layers} label="Scope" value={scope?.label ?? "—"} />
        <Chip icon={CalendarDays} label="Completed on" value={completed} />
      </dl>
    </header>
  );
}

function Chip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Radio;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-xs font-bold text-slate-700">{value}</dd>
    </div>
  );
}
