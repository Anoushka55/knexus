"use client";

import { CalendarDays, Layers, Radio } from "lucide-react";
import { useAssessmentRun } from "./AssessmentRunContext";
import { ShareButton } from "./ShareButton";

/** Title, lede and the three context chips that anchor a printed report. */
export function ResultsHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
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
    <header className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
            {eyebrow}
          </p>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="leading-relaxed text-slate-600">{lede}</p>
          <div className="mt-4">
            <ShareButton />
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <Chip icon={Radio} label="Industry" value={input.industryLabel} />
          <Chip icon={Layers} label="Scope" value={scope?.label ?? "—"} />
          <Chip icon={CalendarDays} label="Completed on" value={completed} />
        </dl>
      </div>
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
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-blue">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <dt className="text-[0.68rem] font-semibold text-slate-400">{label}</dt>
        <dd className="text-xs font-bold text-slate-800">{value}</dd>
      </div>
    </div>
  );
}
