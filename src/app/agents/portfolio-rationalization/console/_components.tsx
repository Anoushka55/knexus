"use client";

import type { RationalizationAction } from "@/lib/portfolio-rationalization/types";

const ACTION_CLASS: Record<string, string> = {
  Retain: "ptr-badge-retain",
  Rehost: "ptr-badge-rehost",
  Replatform: "ptr-badge-replatform",
  Refactor: "ptr-badge-refactor",
  Replace: "ptr-badge-replace",
  Retire: "ptr-badge-retire",
  TBD: "ptr-badge-tbd",
};

export function ActionBadge({ action }: { action?: RationalizationAction | string }) {
  const a = action || "TBD";
  return <span className={`ptr-badge ${ACTION_CLASS[a] ?? "ptr-badge-tbd"}`}>{a}</span>;
}

const PRIORITY_CLASS: Record<string, string> = {
  Critical: "ptr-badge-critical",
  High: "ptr-badge-high",
  Medium: "ptr-badge-medium",
  Low: "ptr-badge-low",
};

export function PriorityBadge({ level }: { level?: string }) {
  const l = level || "Medium";
  return <span className={`ptr-badge ${PRIORITY_CLASS[l] ?? "ptr-badge-medium"}`}>{l}</span>;
}

export function scoreColor(score: number): string {
  return score >= 7 ? "#00A651" : score >= 5 ? "#FFC200" : "#E31837";
}

export function ScoreValue({ score }: { score?: number }) {
  const s = score ?? 0;
  return (
    <span className="font-bold" style={{ color: scoreColor(s) }}>
      {s.toFixed(1)}/10
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  valueColor,
  barPct,
  barColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  barPct?: number;
  barColor?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-[var(--ptr-border)] px-3.5 py-4 text-center">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--ptr-slate)]">{label}</div>
      <div className="text-[22px] font-extrabold mt-1" style={{ color: valueColor ?? "var(--ptr-navy)" }}>
        {value}
      </div>
      <div className="text-[10px] text-[#8899bb]">{sub}</div>
      {barPct !== undefined && (
        <div className="h-1 bg-[#e8edf5] rounded mt-2 overflow-hidden">
          <div className="h-full rounded" style={{ width: `${barPct}%`, background: barColor ?? "var(--ptr-navy)" }} />
        </div>
      )}
    </div>
  );
}

export function SectionCard({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-[var(--ptr-border)] p-5 ${className}`}>
      {title && <h3 className="text-sm font-bold text-[var(--ptr-navy)] mb-3 pb-2 border-b border-[var(--ptr-border)]">{title}</h3>}
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-10 text-sm text-[var(--ptr-muted)]">{message}</div>;
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`ptr-spin inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white ${className}`}
      aria-label="Loading"
    />
  );
}
