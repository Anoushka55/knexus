"use client";

import { correlationLevels } from "@/lib/aiops";

/**
 * The L1 to L7 correlation hierarchy.
 * Counts are supplied by the caller from the centralized dataset; nothing here
 * invents a number.
 */
export function CorrelationChain({
  active,
  counts,
  labels,
  onSelect,
}: {
  active?: number;
  counts: number[];
  /** Optional per-level value, e.g. "SD-WAN" for L1. */
  labels?: (string | undefined)[];
  onSelect?: (index: number) => void;
}) {
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
      {correlationLevels.map((level, i) => {
        const isActive = i === active;
        const count = counts[i] ?? 0;
        const label = labels?.[i];
        return (
          <div key={level.id} className="flex items-stretch shrink-0">
            <button
              type="button"
              onClick={() => onSelect?.(i)}
              title={level.hint}
              className={`text-left min-w-[132px] px-2.5 py-2 rounded-aiops-sm border transition-colors ${
                isActive ? "bg-teal/10 border-teal" : "bg-surface border-border hover:border-navy"
              } ${onSelect ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    isActive ? "text-teal" : "text-muted-foreground"
                  }`}
                >
                  {level.id}
                </span>
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded-aiops-sm text-[10px] font-semibold tabular-nums ${
                    isActive
                      ? "bg-teal text-white"
                      : "bg-background border border-border text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </div>
              <div className="text-[11px] font-medium text-foreground mt-0.5 leading-tight">
                {level.name}
              </div>
              {label && (
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">{label}</div>
              )}
            </button>
            {i < correlationLevels.length - 1 && (
              <span className="self-center w-3 h-px bg-border relative mx-0.5">
                <span className="absolute -right-[1px] -top-[3px] border-l-[5px] border-l-border border-y-[3px] border-y-transparent" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The funnel that makes the correlation result legible at a glance:
 * many events, fewer alerts, one problem, one action.
 */
export function CorrelationFunnel({
  events,
  alerts,
  problems = 1,
  actions = 1,
}: {
  events: number;
  alerts: number;
  problems?: number;
  actions?: number;
}) {
  const stages = [
    { label: "Events", value: events, color: "var(--blue)", note: "raw telemetry observations" },
    { label: "Alerts", value: alerts, color: "var(--amber)", note: "grouped by signal family" },
    { label: "Problem", value: problems, color: "var(--crimson)", note: "one correlated cause" },
    { label: "Action", value: actions, color: "var(--teal)", note: "recommended next step" },
  ];
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="grid grid-cols-4 gap-2">
      {stages.map((s, i) => (
        <div key={s.label} className="relative">
          <div className="border border-border rounded-aiops-sm p-2.5 bg-surface h-full">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {s.label}
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-0.5" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="h-1 mt-2 rounded-aiops-sm bg-background border border-border overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${(s.value / max) * 100}%`,
                  background: s.color,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 leading-tight">{s.note}</div>
          </div>
          {i < stages.length - 1 && (
            <span className="hidden md:block absolute top-1/2 -right-[9px] z-10 text-muted-foreground text-xs leading-none">
              ›
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
