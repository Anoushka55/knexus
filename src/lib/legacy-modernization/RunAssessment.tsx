"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "./toast";

import { cn } from "@/lib/utils";

const steps = [
  "Indexing repositories…",
  "Parsing dependency graph…",
  "Scoring technical debt…",
  "Ranking modernization candidates…",
];

export function RunAssessment({ label = "Run AI Assessment" }: { label?: string }) {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function run() {
    if (state === "running") return;
    setState("running");
    setStep(0);
    setProgress(0);

    steps.forEach((s, i) => {
      timers.current.push(
        setTimeout(() => {
          setStep(i);
          setProgress(Math.round(((i + 1) / steps.length) * 100));
        }, i * 750),
      );
    });

    timers.current.push(
      setTimeout(() => {
        setState("done");
        toast.success("AI assessment complete", {
          description: "12 new modernization candidates ranked · debt model refreshed.",
        });
        timers.current.push(setTimeout(() => setState("idle"), 2600));
      }, steps.length * 750),
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={run}
        aria-live="polite"
        className={cn(
          "flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-primary-foreground shadow-card transition-all duration-200 active:scale-[0.97]",
          state === "done" ? "bg-success" : "bg-primary hover:bg-brand-bright hover:shadow-panel",
        )}
      >
        {state === "running" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : state === "done" ? (
          <Check className="size-3.5" />
        ) : (
          <Sparkles className="size-3.5 transition-transform duration-300 group-hover:rotate-12" />
        )}
        {state === "running" ? "Assessing…" : state === "done" ? "Assessment complete" : label}
      </button>

      {state === "running" ? (
        <div className="animate-fade-in flex w-[230px] flex-col gap-1">
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="num text-right text-[10px] text-muted-foreground">{steps[step]}</p>
        </div>
      ) : null}
    </div>
  );
}
