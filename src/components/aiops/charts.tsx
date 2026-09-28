"use client";

import { metricById } from "@/lib/aiops";
import { pointsFor, type SeriesSpec } from "@/lib/aiops/telemetry";
import { Pill } from "./primitives";

/**
 * Telemetry chart with the metric's warning and critical thresholds drawn in,
 * so a breach is visible rather than something the reader has to infer.
 */
export function MetricChart({
  spec,
  shift = 0,
  height = 92,
  showThresholds = true,
  label,
}: {
  spec: SeriesSpec;
  shift?: number;
  height?: number;
  showThresholds?: boolean;
  label?: string;
}) {
  const def = metricById[spec.metric];
  const points = pointsFor(spec, shift);
  const values = points.map((p) => p.v);
  const ceiling = Math.max(...values, def ? def.critical : 0) * 1.12 || 1;
  const w = 100; // viewBox units; the SVG scales to its container
  const step = w / Math.max(1, points.length - 1);

  const y = (v: number) => height - (v / ceiling) * (height - 6) - 3;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${y(p.v).toFixed(2)}`)
    .join(" ");
  const area = `${path} L${w},${height} L0,${height} Z`;

  const last = values[values.length - 1] ?? 0;
  const state = def ? (last >= def.critical ? "critical" : last >= def.warn ? "warn" : "ok") : "ok";
  const stroke =
    state === "critical" ? "var(--crimson)" : state === "warn" ? "var(--amber)" : "var(--teal)";

  return (
    <div>
      {label !== undefined && (
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <span
            className={`text-xs font-semibold tabular-nums ${
              state === "critical"
                ? "text-crimson"
                : state === "warn"
                  ? "text-amber"
                  : "text-foreground"
            }`}
          >
            {def
              ? `${last.toFixed(def.precision)}${def.unit === "%" ? "%" : ` ${def.unit}`}`
              : last}
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height }}
        role="img"
        aria-label={`${def ? def.label : spec.metric} trend for ${spec.deviceId}`}
      >
        {showThresholds && def && def.critical / ceiling < 1 && (
          <line
            x1="0"
            x2={w}
            y1={y(def.critical)}
            y2={y(def.critical)}
            stroke="var(--crimson)"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            opacity="0.55"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {showThresholds && def && def.warn / ceiling < 1 && (
          <line
            x1="0"
            x2={w}
            y1={y(def.warn)}
            y2={y(def.warn)}
            stroke="var(--amber)"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            opacity="0.55"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path d={area} fill={stroke} opacity="0.10" />
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        <circle cx={w} cy={y(last)} r="1.6" fill={stroke} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/** Compact confidence meter used wherever the platform states a confidence. */
export function ConfidenceBar({
  value,
  label = "AI confidence",
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
      <div className="flex-1 h-1.5 min-w-[48px] bg-background rounded-aiops-sm border border-border overflow-hidden">
        <div
          className="h-full bg-teal"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, transition: "width 0.5s ease" }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums">{value}%</span>
    </div>
  );
}

/** Horizontal bar list, used for root-cause and domain breakdowns. */
export function BarList({
  items,
  colorVar = "var(--navy)",
  suffix = "",
}: {
  items: { label: string; value: number; hint?: string }[];
  colorVar?: string;
  suffix?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-xs text-foreground truncate">{item.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {item.value}
              {suffix}
              {item.hint ? ` · ${item.hint}` : ""}
            </span>
          </div>
          <div className="h-2 bg-background rounded-aiops-sm border border-border overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: colorVar,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SlaPill({ risk }: { risk: string }) {
  const tone = risk === "Breached" ? "crimson" : risk === "At Risk" ? "amber" : "success";
  return <Pill tone={tone as "crimson" | "amber" | "success"}>{risk}</Pill>;
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Resolved" || status === "Verified"
      ? "success"
      : status === "Awaiting Approval"
        ? "amber"
        : status === "Mitigating" || status === "Approved"
          ? "teal"
          : status === "Investigating"
            ? "blue"
            : "muted";
  return <Pill tone={tone as "success" | "amber" | "teal" | "blue" | "muted"}>{status}</Pill>;
}

/** Small coloured dot conveying a 0–100 health score. */
export function HealthDot({ score }: { score: number }) {
  const color = score >= 85 ? "var(--success)" : score >= 65 ? "var(--amber)" : "var(--crimson)";
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />;
}
