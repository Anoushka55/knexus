"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { CHART } from "./charts/palette";

/** One headline figure, optionally with a bar and a delta against the benchmark. */
export function KpiTile({
  icon: Icon,
  label,
  value,
  outOf,
  caption,
  delta,
  deltaLabel,
  tone,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
  outOf?: string;
  caption?: string;
  delta?: number;
  deltaLabel?: string;
  /** Drives the accent and the bar. Omit for a plain count. */
  tone?: "business" | "agentic";
}) {
  const color = tone === "business" ? CHART.business : tone === "agentic" ? CHART.agentic : undefined;
  const fraction = tone ? Number(value) / 5 : undefined;
  const up = (delta ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-start gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: color ? `${color}14` : "#f1f5f9",
            color: color ?? "#64748b",
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="pt-1.5 text-xs font-semibold leading-tight text-slate-500">{label}</p>
      </div>

      <p className="mb-1 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
          {value}
        </span>
        {outOf && <span className="text-sm font-semibold text-slate-400">/ {outOf}</span>}
      </p>

      {delta !== undefined && (
        <p
          className={cn(
            "mb-2 flex items-center gap-1 text-xs font-semibold",
            up ? "text-brand-green" : "text-red-500",
          )}
        >
          {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {up ? "+" : ""}
          {delta.toFixed(1)} {deltaLabel}
        </p>
      )}

      {caption && <p className="text-xs leading-relaxed text-slate-400">{caption}</p>}

      {fraction !== undefined && color && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: CHART.track }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(2, fraction * 100)}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}
