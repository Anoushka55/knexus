"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Level, RubricRung } from "@/lib/assessments/types";
import type { CapabilityResult } from "@/lib/assessments/scoring";
import { LevelPicker } from "./LevelPicker";

/** One capability's three captures, with the rubric available in place. */
export function CapabilityRow({
  result,
  benchmark,
  rubric,
  onChange,
  onReset,
}: {
  result: CapabilityResult;
  benchmark: { business: Level; agentic: Level; target: Level };
  rubric: RubricRung[];
  onChange: (scale: "business" | "agentic" | "target", level: Level) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { capability } = result;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 transition-colors",
        result.corrected ? "border-brand-blue/40" : "border-slate-200",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{capability.label}</h3>
            {result.corrected && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-brand-blue">
                Corrected
              </span>
            )}
            {capability.weight !== undefined && capability.weight !== 1 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">
                Weight ×{capability.weight}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">{capability.prompt}</p>
        </div>

        {result.corrected && (
          <button
            type="button"
            onClick={onReset}
            title="Reset to the starting position"
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Capture label="Business maturity" tone="business">
          <LevelPicker
            value={result.business}
            benchmark={benchmark.business}
            onChange={(l) => onChange("business", l)}
            label={`${capability.label} business maturity`}
            tone="business"
          />
        </Capture>
        <Capture label="Agentic maturity" tone="agentic">
          <LevelPicker
            value={result.agentic}
            benchmark={benchmark.agentic}
            onChange={(l) => onChange("agentic", l)}
            label={`${capability.label} agentic maturity`}
            tone="agentic"
          />
        </Capture>
        <Capture label="Target" tone="target">
          <LevelPicker
            value={result.target}
            benchmark={benchmark.target}
            onChange={(l) => onChange("target", l)}
            label={`${capability.label} target`}
            tone="target"
          />
        </Capture>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-blue"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {open ? "Hide" : "What the levels mean, and what to ask for"}
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <div>
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
              Level 3 here means
            </p>
            <p className="text-xs leading-relaxed text-slate-600">{capability.levelAnchor}</p>
          </div>

          <div>
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
              Evidence to ask for
            </p>
            <ul className="space-y-1">
              {capability.evidence.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-slate-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
              The scale
            </p>
            <dl className="space-y-2">
              {rubric.map((rung) => (
                <div key={rung.level} className="grid grid-cols-[1.5rem_1fr] gap-2">
                  <dt className="text-xs font-bold text-slate-400">{rung.level}</dt>
                  <dd className="text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-700">{rung.name}.</span>{" "}
                    {rung.business}{" "}
                    <span className="text-[#7c4ddb]">{rung.agentic}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Capture({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "business" | "agentic" | "target";
  children: React.ReactNode;
}) {
  const dot =
    tone === "business" ? "bg-[#2649a8]" : tone === "agentic" ? "bg-[#8B5CF6]" : "bg-slate-900";
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        {label}
      </p>
      {children}
    </div>
  );
}
