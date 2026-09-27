"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAssessmentRun } from "../AssessmentRunContext";
import { MaturityRadar } from "../charts/MaturityRadar";
import { CapabilityHeatmap } from "../charts/CapabilityHeatmap";
import { GroupBars } from "../charts/GroupBars";
import { Panel } from "../Card";

export function CapabilityView() {
  const { outcome } = useAssessmentRun();
  const params = useSearchParams();
  const [selected, setSelected] = useState<string | null>(params.get("group"));

  const group = outcome.groups.find((g) => g.group.id === selected) ?? null;
  const shown = group ? group.capabilities : outcome.capabilities;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Maturity by Capability Group">
          <GroupBars groups={outcome.groups} />
        </Panel>
        <Panel title="Capability Maturity Radar">
          <MaturityRadar groups={outcome.groups} />
        </Panel>
      </div>

      <Panel title={group ? `${group.group.label} — capabilities` : "All capabilities"}>
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          <Chip active={selected === null} onClick={() => setSelected(null)}>
            All {outcome.counts.capabilities}
          </Chip>
          {outcome.groups.map((g) => (
            <Chip
              key={g.group.id}
              active={selected === g.group.id}
              onClick={() => setSelected(g.group.id)}
            >
              {g.group.shortLabel}
            </Chip>
          ))}
        </div>

        {group && (
          <p className="mb-4 text-sm leading-relaxed text-slate-500">{group.group.blurb}</p>
        )}

        <CapabilityHeatmap capabilities={shown} />
      </Panel>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-brand-blue bg-brand-blue text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400",
      )}
    >
      {children}
    </button>
  );
}
