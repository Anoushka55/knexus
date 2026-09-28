"use client";

import { useState } from "react";

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
  tooltip,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}) {
  return (
    <section className={`bg-surface border border-border rounded-aiops-md ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between px-4 h-11 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
            {tooltip && <Tooltip text={tooltip} />}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="w-3.5 h-3.5 rounded-full border border-border text-muted-foreground text-[9px] flex items-center justify-center cursor-help">
        i
      </span>
      {open && (
        <span className="absolute z-50 left-5 top-0 w-56 p-2 text-xs bg-navy text-navy-foreground rounded-aiops-sm border border-navy">
          {text}
        </span>
      )}
    </span>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "navy" | "teal" | "crimson" | "amber" | "blue" | "muted" | "success";
}) {
  const map = {
    default: "bg-background text-foreground border-border",
    navy: "bg-navy text-white border-navy",
    teal: "bg-teal/10 text-teal border-teal/30",
    crimson: "bg-crimson/10 text-crimson border-crimson/30",
    amber: "bg-amber/10 text-amber border-amber/30",
    blue: "bg-blue/10 text-blue border-blue/30",
    muted: "bg-background text-muted-foreground border-border",
    success: "bg-success/10 text-success border-success/30",
  } as const;
  return (
    <span
      className={`inline-flex items-center h-5 px-2 text-[10px] font-medium uppercase tracking-wide rounded-aiops-sm border ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ s }: { s: "P1" | "P2" | "P3" }) {
  const tone = s === "P1" ? "crimson" : s === "P2" ? "amber" : "blue";
  return <Pill tone={tone}>{s}</Pill>;
}

export function Sparkline({
  data,
  color = "var(--blue)",
  width = 80,
  height = 24,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / (max - min || 1)) * (height - 2) - 1}`)
    .join(" ");
  return (
    <svg width={width} height={height}>
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} />
    </svg>
  );
}

export function Gauge({ value, size = 64 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const color = value >= 80 ? "var(--success)" : value >= 65 ? "var(--amber)" : "var(--crimson)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--border)"
          strokeWidth={4}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
        {value}
      </div>
    </div>
  );
}
