"use client";

import { useState } from "react";
import { maturityStages } from "@/lib/aiops";
import { Check } from "lucide-react";

/**
 * The seven-stage capability ladder. Stages one to six are demonstrated in
 * this environment; "Learn" is shown as the next step rather than a claim
 * about what runs here today.
 */
export function MaturityLadder({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {maturityStages.map((stage, i) => {
          const isOpen = open === stage.id;
          return (
            <div key={stage.id} className="flex items-stretch shrink-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : stage.id)}
                className={`text-left rounded-aiops-sm border px-2.5 py-2 transition-colors ${compact ? "min-w-[108px]" : "min-w-[132px]"} ${
                  isOpen
                    ? "border-navy bg-navy/5"
                    : stage.demonstrated
                      ? "border-border bg-surface hover:border-navy"
                      : "border-dashed border-border bg-background"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-4 h-4 rounded-aiops-sm flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      stage.demonstrated
                        ? "bg-teal text-white"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {stage.demonstrated ? <Check className="w-2.5 h-2.5" /> : i + 1}
                  </span>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wide ${
                      stage.demonstrated ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
                {!compact && (
                  <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    {stage.caption}
                  </div>
                )}
              </button>
              {i < maturityStages.length - 1 && (
                <span className="self-center w-2.5 h-px bg-border mx-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {open && (
        <div className="mt-3 border border-border rounded-aiops-sm bg-background p-3 text-xs text-foreground">
          {maturityStages.find((s) => s.id === open)?.detail}
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Stages one to six are demonstrated in this environment. Learn describes how remediation
        outcomes would feed back into recommendation ranking; no training loop runs here.
      </p>
    </div>
  );
}

/**
 * The workshop narrative rendered against live numbers:
 * Observe, Correlate, Understand, Predict, Recommend, Act.
 */
export function NarrativeStrip({
  stats,
}: {
  stats: {
    observe: string;
    correlate: string;
    understand: string;
    predict: string;
    recommend: string;
    act: string;
  };
}) {
  const steps = [
    {
      key: "observe",
      name: "Observe",
      caption: "Operational signals and service health",
      value: stats.observe,
    },
    {
      key: "correlate",
      name: "Correlate",
      caption: "Many events become few problems",
      value: stats.correlate,
    },
    {
      key: "understand",
      name: "Understand",
      caption: "Probable root cause and impact",
      value: stats.understand,
    },
    { key: "predict", name: "Predict", caption: "Likely future incidents", value: stats.predict },
    { key: "recommend", name: "Recommend", caption: "Best next action", value: stats.recommend },
    { key: "act", name: "Act", caption: "Approved actions, simulated here", value: stats.act },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {steps.map((s, i) => (
        <div
          key={s.key}
          className={`px-3 py-2.5 ${i > 0 ? "xl:border-l border-border" : ""} ${i % 2 === 1 ? "border-l xl:border-l" : ""} ${i >= 2 ? "border-t md:border-t-0" : ""} md:border-t-0`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-navy text-white text-[9px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-navy">
              {s.name}
            </span>
          </div>
          <div className="text-[13px] font-semibold text-foreground mt-1.5 tabular-nums">
            {s.value}
          </div>
          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.caption}</div>
        </div>
      ))}
    </div>
  );
}
