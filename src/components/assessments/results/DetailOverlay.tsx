"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Hammer, X } from "lucide-react";
import { agents } from "@/data/agents";
import { challenges, priorities } from "@/data/tmtSolutions";
import { CATEGORIES } from "@/data/tmtOntology";
import { agentReach } from "@/lib/assessments/opportunities";
import type { AssessmentOutcome, CapabilityResult, GroupResult } from "@/lib/assessments/scoring";
import type { RubricRung } from "@/lib/assessments/types";
import { CHART } from "../charts/palette";

/**
 * The detail the cockpit cannot show.
 *
 * The cockpit trades completeness for fitting one viewport, so every row in it
 * is truncated. This is where the rest lives: the question that was asked, what
 * each level means for that capability, the evidence to ask for, and the agents
 * that actually move it. It hovers over the page rather than navigating, so the
 * cockpit is never lost behind a back button.
 */

export type Selection =
  | { kind: "capability"; id: string }
  | { kind: "group"; id: string }
  | null;

const agentById = new Map(agents.map((a) => [a.id, a]));
const challengeById = new Map(challenges.map((c) => [c.id, c]));
const priorityById = new Map(priorities.map((p) => [p.id, p]));
const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));

export function DetailOverlay({
  selection,
  outcome,
  rubric,
  onSelect,
  onClose,
}: {
  selection: Selection;
  outcome: AssessmentOutcome;
  rubric: RubricRung[];
  /** Lets a group drill through into one of its capabilities without closing. */
  onSelect: (next: Selection) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!selection) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    // The page behind must not scroll while a dialog is over it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [selection, onClose]);

  if (!selection) return null;

  const capability =
    selection.kind === "capability"
      ? outcome.capabilities.find((c) => c.capability.id === selection.id)
      : undefined;
  const group =
    selection.kind === "group"
      ? outcome.groups.find((g) => g.group.id === selection.id)
      : undefined;

  if (!capability && !group) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={capability ? capability.capability.label : group!.group.label}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm print:hidden"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex flex-none items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-blue">
              {capability ? capability.group.label : "Capability group"}
            </p>
            <h2 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900">
              {capability ? capability.capability.label : group!.group.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {capability ? (
            <CapabilityBody result={capability} rubric={rubric} />
          ) : (
            <GroupBody group={group!} onSelect={onSelect} />
          )}
        </div>
      </div>
    </div>
  );
}

function CapabilityBody({
  result,
  rubric,
}: {
  result: CapabilityResult;
  rubric: RubricRung[];
}) {
  const { capability } = result;

  const levers = capability.agentIds
    .map((id) => agentById.get(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .map((agent) => {
      const reach = agentReach(agent);
      const rungs = reach === null ? 0 : Math.max(0, Math.min(reach, result.target) - result.agentic);
      return { agent, reach, rungs };
    })
    .sort((a, b) => b.rungs - a.rungs);

  const blocked = capability.priorityIds.map((id) => priorityById.get(id)).filter(Boolean);
  const implicated = capability.challengeIds.map((id) => challengeById.get(id)).filter(Boolean);

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-600">{capability.prompt}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Score label="Business" value={result.business} target={result.target} color={CHART.business} />
        <Score label="Agentic" value={result.agentic} target={result.target} color={CHART.agentic} />
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Gap</p>
          <p
            className={`mt-1 text-xl font-extrabold tabular-nums ${
              result.isPriority ? "text-red-600" : result.gapScore > 0 ? "text-amber-600" : "text-slate-300"
            }`}
          >
            {result.gapScore || "—"}
          </p>
          <p className="mt-0.5 text-[0.65rem] text-slate-400">
            {result.gapScore > 0 ? "rungs across both scales" : "at or above target"}
          </p>
        </div>
      </div>

      <Section title="What level 3 looks like here">
        <p className="text-sm leading-relaxed text-slate-600">{capability.levelAnchor}</p>
      </Section>

      <Section title="Evidence to ask for">
        <ul className="space-y-1">
          {capability.evidence.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-600">
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-300" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="The scale">
        <ol className="space-y-1.5">
          {rubric.map((rung) => {
            const isBusiness = rung.level === result.business;
            const isAgentic = rung.level === result.agentic;
            const isTarget = rung.level === result.target;
            return (
              <li
                key={rung.level}
                className={`rounded-lg border p-2.5 ${
                  isBusiness || isAgentic || isTarget
                    ? "border-slate-300 bg-slate-50"
                    : "border-slate-100"
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700">
                    {rung.level}. {rung.name}
                  </span>
                  {isBusiness && <Pill color={CHART.business}>Business</Pill>}
                  {isAgentic && <Pill color={CHART.agentic}>Agentic</Pill>}
                  {isTarget && <Pill color="#0f172a">Target</Pill>}
                </div>
                <p className="text-xs leading-relaxed text-slate-500">
                  {rung.business} <span className="text-[#7c4ddb]">{rung.agentic}</span>
                </p>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section title={`Agents mapped to this capability (${levers.length})`}>
        {levers.length === 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-3">
            <p className="flex items-center gap-2 text-xs text-slate-600">
              <Hammer className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
              Nothing in the catalogue covers this yet.
            </p>
            <Link
              href="/forge"
              className="flex-shrink-0 rounded-lg bg-brand-blue px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-blue-dark"
            >
              Build in Forge
            </Link>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {levers.map(({ agent, reach, rungs }) => (
              <li key={agent.id}>
                <Link
                  href={`/agents/${agent.id}`}
                  className="group flex items-center gap-3 rounded-lg border border-slate-200 p-2.5 transition-colors hover:border-brand-blue/40 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-brand-blue">
                      {agent.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {reach === null
                        ? "No scope or autonomy recorded"
                        : rungs > 0
                          ? `Reaches level ${reach} — closes ${rungs} rung${rungs === 1 ? "" : "s"} here`
                          : `Reaches level ${reach} — already at or past this capability's position`}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300 group-hover:text-brand-blue" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {(blocked.length > 0 || implicated.length > 0) && (
        <Section title="Why it matters">
          {blocked.length > 0 && (
            <p className="text-xs leading-relaxed text-slate-600">
              <span className="font-semibold">Blocks:</span>{" "}
              {blocked.map((p) => p!.title).join(" · ")}
            </p>
          )}
          {implicated.length > 0 && (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              {implicated.map((c) => c!.title).join(" · ")}
            </p>
          )}
        </Section>
      )}
    </div>
  );
}

function GroupBody({
  group,
  onSelect,
}: {
  group: GroupResult;
  onSelect: (next: Selection) => void;
}) {
  const domains = group.group.ontologyCategoryIds
    .map((id) => categoryById.get(id))
    .filter(Boolean);

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-600">{group.group.blurb}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Score label="Business" value={group.scores.business} target={group.target} color={CHART.business} />
        <Score label="Agentic" value={group.scores.agentic} target={group.target} color={CHART.agentic} />
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
            Total gap
          </p>
          <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{group.gapScore}</p>
          <p className="mt-0.5 text-[0.65rem] text-slate-400">
            across {group.capabilities.length} capabilities
          </p>
        </div>
      </div>

      <Section title={`Capabilities (${group.capabilities.length})`}>
        <ul className="space-y-1">
          {group.capabilities.map((c) => (
            <li key={c.capability.id}>
              <button
                type="button"
                onClick={() => onSelect({ kind: "capability", id: c.capability.id })}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-2.5 text-left transition-colors hover:border-brand-blue/40 hover:bg-slate-50"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                  {c.capability.label}
                </span>
                <span className="flex flex-shrink-0 items-center gap-2 text-xs tabular-nums text-slate-500">
                  B{c.business} · A{c.agentic} → {c.target}
                  {c.gapScore > 0 && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[0.62rem] font-bold ${
                        c.isPriority ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {c.gapScore}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {domains.length > 0 && (
        <Section title="Telecom domains covered">
          <ul className="flex flex-wrap gap-1.5">
            {domains.map((d) => (
              <li
                key={d!.id}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {d!.label}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Score({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-extrabold tabular-nums text-slate-900">
          {Number.isInteger(value) ? value : value.toFixed(1)}
        </span>
        <span className="text-xs text-slate-400">
          / target {Number.isInteger(target) ? target : target.toFixed(1)}
        </span>
      </p>
      <div
        className="relative mt-2 h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: CHART.track }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-30"
          style={{ width: `${(target / 5) * 100}%`, backgroundColor: color }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${(value / 5) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  );
}
