"use client";

import { cn } from "@/lib/utils";
import { LEVELS, type Level } from "@/lib/assessments/types";

/**
 * Five dots, one per rung.
 *
 * The benchmark value keeps a dashed ghost ring even after the client moves
 * away from it, so the room can always see what was assumed and what was
 * corrected — the same affordance the P2P baseline table uses.
 */
export function LevelPicker({
  value,
  benchmark,
  onChange,
  label,
  tone,
}: {
  value: Level;
  benchmark: Level;
  onChange: (level: Level) => void;
  label: string;
  tone: "business" | "agentic" | "target";
}) {
  const fill =
    tone === "business"
      ? "bg-[#2649a8] border-[#2649a8]"
      : tone === "agentic"
        ? "bg-[#8B5CF6] border-[#8B5CF6]"
        : "bg-slate-900 border-slate-900";

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
      {LEVELS.map((level) => {
        const selected = level === value;
        const isBenchmark = level === benchmark;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label}: level ${level}${isBenchmark ? " (starting position)" : ""}`}
            title={`Level ${level}${isBenchmark ? " — starting position" : ""}`}
            onClick={() => onChange(level)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border text-[0.7rem] font-bold transition-all",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
              selected
                ? `${fill} text-white`
                : "border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600",
              !selected && isBenchmark && "border-dashed border-slate-400 text-slate-500",
            )}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}
